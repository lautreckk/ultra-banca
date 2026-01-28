import { DateSelector } from '@/components/loterias';

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
  const tipoName = tipoNames[tipo] || tipo;

  return (
    <div className="py-6">
      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900">{tipoName}</h1>
        <p className="text-sm text-gray-500 mt-1">Selecione o dia do sorteio</p>
      </div>

      <DateSelector baseHref={`/loterias/${tipo}`} daysCount={6} />
    </div>
  );
}
