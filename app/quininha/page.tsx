import { getModalidadesByJogo } from '@/lib/actions/modalidades';
import { QuininhaWizardClient } from './wizard-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function QuininhaPage() {
  const modalidades = await getModalidadesByJogo('quininha');

  return <QuininhaWizardClient modalidades={modalidades} />;
}
