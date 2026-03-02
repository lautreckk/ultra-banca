import { getModalidadeByCodigo } from '@/lib/actions/modalidades';
import { LotinhaNumbersClient } from './client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LotinhaNumbersPage({ params }: { params: Promise<{ data: string; modalidade: string }> }) {
  const { data, modalidade: modalidadeId } = await params;
  const modalidade = await getModalidadeByCodigo(modalidadeId);

  if (!modalidade) {
    notFound();
  }

  return <LotinhaNumbersClient data={data} modalidade={modalidade} />;
}
