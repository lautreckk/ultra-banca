import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Admin Master',
    template: '%s | Admin Master',
  },
  description: 'Painel Master - Super Administração',
  icons: {
    icon: '/icons/admin-favicon.svg',
  },
};

export default function AdminMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O middleware já protege as rotas admin-master
  // Não fazer verificação aqui para evitar redirect loop na página de login
  return <>{children}</>;
}
