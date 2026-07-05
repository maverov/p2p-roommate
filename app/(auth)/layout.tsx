export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream px-6 py-12">
      {children}
    </main>
  );
}
