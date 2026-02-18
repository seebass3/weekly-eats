import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { InstallPrompt } from "@/components/install-prompt";
import { GenerationProvider } from "@/components/generation-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  themeColor: "#18181b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <GenerationProvider>
          <main className="mx-auto min-h-screen max-w-md pb-20 px-4 pt-6">
            {children}
          </main>
          <BottomNav />
        </GenerationProvider>
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
