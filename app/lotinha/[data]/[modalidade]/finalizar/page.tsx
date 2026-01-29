import { getModalidadeByCodigo } from '@/lib/actions/modalidades';
import { LotinhaFinalizarClient } from './client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LotinhaFinalizarPage({ params }: { params: Promise<{ data: string; modalidade: string }> }) {
  const { data, modalidade: modalidadeId } = await params;
  const modalidade = await getModalidadeByCodigo(modalidadeId);

  if (!modalidade) {
    notFound();
  }

  return <LotinhaFinalizarClient data={data} modalidade={modalidade} />;
}
