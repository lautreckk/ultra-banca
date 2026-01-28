import { ModalityList } from '@/components/loterias';

interface DataPageProps {
  params: Promise<{ tipo: string; data: string }>;
}

export default async function DataPage({ params }: DataPageProps) {
  const { tipo, data } = await params;

  const formattedDate = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="py-6">
      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold text-zinc-900">Escolha a Modalidade</h1>
        <p className="text-sm text-zinc-600 mt-1 capitalize">{formattedDate}</p>
      </div>

      <ModalityList baseHref={`/loterias/${tipo}/${data}`} tipoJogo={tipo} />
    </div>
  );
}
