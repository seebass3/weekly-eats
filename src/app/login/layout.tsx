export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-background">
      <div className="flex min-h-screen items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
