import { DateSelector } from '@/components/loterias';
import { getModalidadesAtivas } from '@/lib/actions/modalidades';
import { LoteriasWizardClient } from '../wizard-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TipoPageProps {
  params: Promise<{ tipo: string }>;
}

const tipoNames: Record<string, string> = {
  loterias: 'Loterias',
  quininha: 'Quininha',
  seninha: 'Seninha',
  lotinha: 'Lotinha',
};

export default async function TipoPage({ params }: TipoPageProps) {
  const { tipo } = await params;

  // Para tipo "loterias", renderiza o wizard
  if (tipo === 'loterias') {
    const modalidades = await getModalidadesAtivas();
    return <LoteriasWizardClient modalidades={modalidades} />;
  }

  // Fallback para outros tipos (caso acessem via rota antiga)
  const tipoName = tipoNames[tipo] || tipo;

  return (
    <div className="py-6">
      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold text-white">{tipoName}</h1>
        <p className="text-sm text-zinc-400 mt-1">Selecione o dia do sorteio</p>
      </div>

      <DateSelector baseHref={`/loterias/${tipo}`} daysCount={6} />
    </div>
  );
}
