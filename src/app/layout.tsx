import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { getGroceryListForWeek } from "@/lib/db/queries";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { InstallPrompt } from "@/components/install-prompt";
import { GenerationProvider } from "@/components/generation-provider";
import { DialogProvider } from "@/components/dialog-provider";
import { SyncProvider } from "@/components/sync-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { InfoButton } from "@/components/info-button";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Weekly Eats",
  description: "Your weekly dinner plan, powered by local AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Weekly Eats",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2c2418",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const groceryList = await getGroceryListForWeek();
  const groceryCount = groceryList?.items.filter((i) => !i.checked).length ?? 0;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} font-sans antialiased`}>
        <ThemeProvider>
          <DialogProvider>
            <GenerationProvider>
              <Suspense>
                <SyncProvider>
                  <main className="mx-auto min-h-screen max-w-md pb-20 px-4 pt-6">
                    {children}
                  </main>
                  <BottomNav groceryCount={groceryCount} />
                </SyncProvider>
              </Suspense>
            </GenerationProvider>
          </DialogProvider>
          <ThemeToggle />
          <InfoButton />
          <InstallPrompt />
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
