import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Cúpula Barão - Master',
    template: '%s | Cúpula Barão - Master',
  },
  description: 'Cúpula Barão - Plataforma de Elite para Gestão de Bancas',
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
