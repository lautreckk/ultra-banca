'use client';

import { use } from 'react';
import { PageLayout } from '@/components/layout';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Share2 } from 'lucide-react';
import {
  MODALIDADES_LOTERIAS,
  MODALIDADES_QUININHA,
  MODALIDADES_SENINHA,
  MODALIDADES_LOTINHA,
  CATEGORIAS_MODALIDADES,
  type Modalidade,
} from '@/lib/constants/modalidades';

const TIPOS_CONFIG: Record<string, { titulo: string; modalidades: Modalidade[]; showCategories: boolean }> = {
  loterias: {
    titulo: 'LOTERIAS',
    modalidades: MODALIDADES_LOTERIAS,
    showCategories: true,
  },
  quininha: {
    titulo: 'QUININHA',
    modalidades: MODALIDADES_QUININHA,
    showCategories: false,
  },
  seninha: {
    titulo: 'SENINHA',
    modalidades: MODALIDADES_SENINHA,
    showCategories: false,
  },
  lotinha: {
    titulo: 'LOTINHA',
    modalidades: MODALIDADES_LOTINHA,
    showCategories: false,
  },
};

export default function CotacaoTipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = use(params);
  const config = TIPOS_CONFIG[tipo];

  if (!config) {
    return (
      <PageLayout title="COTACOES" showBack>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Tipo de cotacao nao encontrado</p>
        </div>
      </PageLayout>
    );
  }

  const { titulo, modalidades, showCategories } = config;

  // Group by category for loterias
  const groupedModalidades = showCategories
    ? CATEGORIAS_MODALIDADES.map(cat => ({
        ...cat,
        items: modalidades.filter(m => m.categoria === cat.id),
      })).filter(cat => cat.items.length > 0)
    : [{ id: 'all', nome: titulo, items: modalidades }];

  const handleShare = async () => {
    let text = `TABELA DE COTACOES - ${titulo}\n\n`;

    groupedModalidades.forEach(group => {
      if (showCategories) {
        text += `${group.nome.toUpperCase()}\n`;
      }
      group.items.forEach(m => {
        text += `${m.nome}: ${formatCurrency(m.multiplicador)}\n`;
      });
      text += '\n';
    });

    if (navigator.share) {
      try {
        await navigator.share({ text: text.trim() });
      } catch {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(text.trim());
      alert('Copiado para a area de transferencia!');
    }
  };

  return (
    <PageLayout title={`COTACOES - ${titulo}`} showBack>
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="rounded-lg bg-[#E5A220] px-4 py-3 text-center">
          <span className="font-bold text-zinc-900">TABELA DE COTACOES</span>
        </div>

        {/* Cotações por categoria */}
        {groupedModalidades.map((group) => (
          <div key={group.id} className="overflow-hidden rounded-lg bg-white shadow-sm">
            {showCategories && (
              <div className="bg-zinc-800 px-4 py-2">
                <span className="text-sm font-bold text-white">{group.nome.toUpperCase()}</span>
              </div>
            )}
            <div className="divide-y divide-gray-100">
              {group.items.map((modalidade) => (
                <div
                  key={modalidade.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-gray-800">{modalidade.nome}</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(modalidade.multiplicador)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Legenda */}
        <div className="rounded-lg bg-gray-100 px-4 py-3 text-center">
          <p className="text-xs text-gray-500">
            * Valores em R$ representam o premio para cada R$ 1,00 apostado
          </p>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 py-4 text-white active:bg-zinc-700"
        >
          <Share2 className="h-5 w-5" />
          <span className="font-semibold">Compartilhar</span>
        </button>
      </div>
    </PageLayout>
  );
}
