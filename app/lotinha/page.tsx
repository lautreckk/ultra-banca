import { getModalidadesByJogo } from '@/lib/actions/modalidades';
import { LotinhaClient } from './client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LotinhaPage() {
  const modalidades = await getModalidadesByJogo('lotinha');

  return <LotinhaClient modalidades={modalidades} />;
}
