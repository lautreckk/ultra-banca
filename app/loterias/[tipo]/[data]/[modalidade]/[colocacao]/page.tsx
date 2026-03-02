import { getModalidadeByCodigo } from '@/lib/actions/modalidades';
import { ColocacaoClient } from './ColocacaoClient';

// Forçar revalidação a cada request para pegar alterações do admin
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ColocacaoPageProps {
  params: Promise<{ tipo: string; data: string; modalidade: string; colocacao: string }>;
}

export default async function ColocacaoPage({ params }: ColocacaoPageProps) {
  const { tipo, data, modalidade, colocacao } = await params;

  // Buscar multiplicador do banco de dados (server-side)
  const modalidadeDB = await getModalidadeByCodigo(modalidade);

  return (
    <ColocacaoClient
      tipo={tipo}
      data={data}
      modalidade={modalidade}
      colocacao={colocacao}
      multiplicadorDB={modalidadeDB?.multiplicador ?? null}
    />
  );
}
