import { ModalityList } from '@/components/loterias';
import { getModalidadesAtivas } from '@/lib/actions/modalidades';

// Forçar revalidação a cada request para pegar alterações do admin
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DataPageProps {
  params: Promise<{ tipo: string; data: string }>;
}

export default async function DataPage({ params }: DataPageProps) {
  const { tipo, data } = await params;

  // Buscar modalidades do banco de dados
  const modalidadesDB = await getModalidadesAtivas();

  const formattedDate = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="py-6">
      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold text-white">Escolha a Modalidade</h1>
        <p className="text-sm text-zinc-400 mt-1 capitalize">{formattedDate}</p>
      </div>

      <ModalityList
        baseHref={`/loterias/${tipo}/${data}`}
        tipoJogo={tipo}
        modalidadesFromDB={modalidadesDB}
      />
    </div>
  );
}
