import { requireSuperAdmin } from '@/lib/admin/actions/master';

export default async function AdminMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protege todas as rotas do admin-master
  await requireSuperAdmin();

  return <>{children}</>;
}
