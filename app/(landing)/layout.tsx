import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cupula Barao - Plataforma de Elite',
  description: 'Entre para a Cupula Barao - Plataforma exclusiva de elite',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
