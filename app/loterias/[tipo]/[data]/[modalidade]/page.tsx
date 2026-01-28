import { PlacementList } from '@/components/loterias';
import { getModalidadeById, formatMultiplicador } from '@/lib/constants';

interface ModalidadePageProps {
  params: Promise<{ tipo: string; data: string; modalidade: string }>;
}

export default async function ModalidadePage({ params }: ModalidadePageProps) {
  const { tipo, data, modalidade } = await params;
  const modalidadeInfo = getModalidadeById(modalidade);

  return (
    <div className="py-6">
      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold text-zinc-900">COLOCAÇÕES</h1>
        <p className="text-sm text-zinc-600 mt-1">
          {modalidadeInfo?.nome || modalidade} - {modalidadeInfo ? formatMultiplicador(modalidadeInfo.multiplicador) : ''}
        </p>
      </div>

      <PlacementList
        baseHref={`/loterias/${tipo}/${data}/${modalidade}`}
        multiplicadorBase={modalidadeInfo?.multiplicador || 800}
      />
    </div>
  );
}
