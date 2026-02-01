export default function AdminMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O middleware já protege as rotas admin-master
  // Não fazer verificação aqui para evitar redirect loop na página de login
  return <>{children}</>;
}
