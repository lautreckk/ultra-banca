import { PageLayout } from '@/components/layout';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getModalidadesAtivas, getModalidadesByJogo, type ModalidadeDB } from '@/lib/actions/modalidades';
import { CATEGORIAS_MODALIDADES } from '@/lib/constants/modalidades';
import { CotacoesShareButton } from './share-button';

// Forçar revalidação para pegar alterações do admin
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TIPOS_CONFIG: Record<string, { titulo: string; showCategories: boolean }> = {
  loterias: {
    titulo: 'LOTERIAS',
    showCategories: true,
  },
  quininha: {
    titulo: 'QUININHA',
    showCategories: false,
  },
  seninha: {
    titulo: 'SENINHA',
    showCategories: false,
  },
  lotinha: {
    titulo: 'LOTINHA',
    showCategories: false,
  },
};

export default async function CotacaoTipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const config = TIPOS_CONFIG[tipo];

  if (!config) {
    return (
      <PageLayout title="COTACOES" showBack>
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-500">Tipo de cotacao nao encontrado</p>
        </div>
      </PageLayout>
    );
  }

  const { titulo, showCategories } = config;

  // Buscar modalidades do banco de dados
  let modalidadesDB: ModalidadeDB[] = [];

  if (tipo === 'loterias') {
    // Para loterias, busca todas as ativas e agrupa por categoria
    modalidadesDB = await getModalidadesAtivas();
  } else {
    // Para quininha, seninha, lotinha - busca por tipo de jogo
    modalidadesDB = await getModalidadesByJogo(tipo);
  }

  if (modalidadesDB.length === 0) {
    return (
      <PageLayout title={`COTACOES - ${titulo}`} showBack>
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-500">Nenhuma modalidade encontrada</p>
        </div>
      </PageLayout>
    );
  }

  // Agrupar modalidades
  const groupedModalidades = showCategories
    ? CATEGORIAS_MODALIDADES.map(cat => ({
        ...cat,
        items: modalidadesDB.filter(m => m.categoria === cat.id),
      })).filter(cat => cat.items.length > 0)
    : [{ id: 'all', nome: titulo, items: modalidadesDB }];

  return (
    <PageLayout title={`COTACOES - ${titulo}`} showBack>
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="rounded-xl bg-[#E5A220] px-4 py-3 text-center">
          <span className="font-bold text-zinc-900">TABELA DE COTACOES</span>
        </div>

        {/* Cotações por categoria */}
        {groupedModalidades.map((group) => (
          <div key={group.id} className="overflow-hidden rounded-xl bg-[#1A1F2B] border border-zinc-700/40 shadow-sm">
            {showCategories && (
              <div className="bg-zinc-800 px-4 py-2">
                <span className="text-sm font-bold text-white">{group.nome.toUpperCase()}</span>
              </div>
            )}
            <div className="divide-y divide-zinc-700/40">
              {group.items.map((modalidade) => (
                <div
                  key={modalidade.id}
                  className="flex items-center justify-between px-4 py-3 min-h-[56px]"
                >
                  <span className="text-white">{modalidade.nome}</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(modalidade.multiplicador)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Legenda */}
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 px-4 py-3 text-center">
          <p className="text-xs text-zinc-500">
            * Valores em R$ representam o premio para cada R$ 1,00 apostado
          </p>
        </div>

        {/* Share Button */}
        <CotacoesShareButton
          titulo={titulo}
          groupedData={groupedModalidades.map(g => ({
            nome: g.nome,
            items: g.items.map(m => ({ nome: m.nome, multiplicador: m.multiplicador }))
          }))}
          showCategories={showCategories}
        />
      </div>
    </PageLayout>
  );
}
