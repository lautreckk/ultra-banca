import { PlacementList } from '@/components/loterias';
import { getModalidadeById, formatMultiplicador } from '@/lib/constants';
import { getModalidadeByCodigo } from '@/lib/actions/modalidades';

// Forçar revalidação a cada request para pegar alterações do admin
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ModalidadePageProps {
  params: Promise<{ tipo: string; data: string; modalidade: string }>;
}

export default async function ModalidadePage({ params }: ModalidadePageProps) {
  const { tipo, data, modalidade } = await params;

  // Buscar do banco de dados primeiro
  const modalidadeDB = await getModalidadeByCodigo(modalidade);

  // Fallback para hardcoded
  const modalidadeInfo = getModalidadeById(modalidade);

  // Usar dados do banco se disponível
  const nome = modalidadeDB?.nome || modalidadeInfo?.nome || modalidade;
  const multiplicador = modalidadeDB?.multiplicador ?? modalidadeInfo?.multiplicador ?? 800;

  return (
    <div className="py-6">
      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold text-zinc-900">COLOCAÇÕES</h1>
        <p className="text-sm text-zinc-600 mt-1">
          {nome} - {formatMultiplicador(multiplicador)}
        </p>
      </div>

      <PlacementList
        baseHref={`/loterias/${tipo}/${data}/${modalidade}`}
        multiplicadorBase={multiplicador}
        modalidadeDB={modalidadeDB}
      />
    </div>
  );
}
