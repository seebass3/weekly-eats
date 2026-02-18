export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-background bg-[radial-gradient(ellipse_at_center,oklch(0.97_0.01_60_/_40%)_0%,transparent_70%)]">
      <div className="flex min-h-screen items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
