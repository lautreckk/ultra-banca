import { getModalidadesByJogo } from '@/lib/actions/modalidades';
import { QuininhaModalidadesClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QuininhaModalidadesPage({ params }: { params: Promise<{ data: string }> }) {
  const { data } = await params;
  const modalidades = await getModalidadesByJogo('quininha');

  return <QuininhaModalidadesClient data={data} modalidades={modalidades} />;
}
