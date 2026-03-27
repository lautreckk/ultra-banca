import { getModalidadesByJogo } from '@/lib/actions/modalidades';
import { LotinhaWizardClient } from './wizard-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LotinhaPage() {
  const modalidades = await getModalidadesByJogo('lotinha');

  return <LotinhaWizardClient modalidades={modalidades} />;
}
