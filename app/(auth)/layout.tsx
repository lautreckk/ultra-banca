export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0D1117] flex justify-center">
      <div className="w-full max-w-md bg-[#0D1117] min-h-screen shadow-xl">
        {children}
      </div>
    </div>
  );
}
