import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Admin Access',
    template: '%s | Admin Access',
  },
  description: 'Painel Administrativo',
  icons: {
    icon: '/icons/admin-favicon.svg',
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
