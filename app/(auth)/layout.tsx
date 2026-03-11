export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0D1117] flex justify-center" style={{ backgroundColor: 'var(--color-background, #0D1117)' }}>
      <div className="w-full max-w-md min-h-screen shadow-xl" style={{ backgroundColor: 'var(--color-background, #0D1117)' }}>
        {children}
      </div>
    </div>
  );
}
