import { getModalidadesByJogo } from '@/lib/actions/modalidades';
import { SeninhaWizardClient } from './wizard-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SeninhaPage() {
  const modalidades = await getModalidadesByJogo('seninha');

  return <SeninhaWizardClient modalidades={modalidades} />;
}
