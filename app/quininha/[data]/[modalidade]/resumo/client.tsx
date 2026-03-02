'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, Trash2 } from 'lucide-react';
import type { ModalidadeDB } from '@/lib/actions/modalidades';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

interface QuininhaResumoClientProps {
  data: string;
  modalidade: ModalidadeDB;
}

function QuininhaResumoContent({ data, modalidade }: QuininhaResumoClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saldo, saldoBonus } = useUserBalance();

  const modalidadeId = modalidade.codigo;
  const palpitesStr = searchParams.get('palpites') || '';
  const valorParam = searchParams.get('valor') || '0';
  const mode = searchParams.get('mode') || 'cada';

  const [palpites, setPalpites] = useState(palpitesStr.split('|').filter(Boolean));
  const valor = parseFloat(valorParam);

  const valorPorPalpite = mode === 'cada' ? valor : valor / palpites.length;
  const valorTotal = mode === 'cada' ? valor * palpites.length : valor;

  const handleRemoveBet = () => {
    setPalpites([]);
  };

  const handleMaisApostas = () => {
    router.push(`/quininha/${data}/${modalidadeId}`);
  };

  const handleAvancar = () => {
    if (palpites.length === 0) return;

    router.push(
      `/quininha/${data}/${modalidadeId}/dias?palpites=${encodeURIComponent(palpites.join('|'))}&valor=${valorPorPalpite}&total=${valorTotal}`
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-[#111318]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-base font-bold text-white">APOSTAS</span>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* Balance Bar */}
      <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
        <button className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10" aria-label="Atualizar saldo">
          <RefreshCw className="h-5 w-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">R$ {formatCurrencyCompact(saldo)} | {formatCurrencyCompact(saldoBonus)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-zinc-800/50 min-h-screen p-4">
        {palpites.length > 0 ? (
          <>
            {/* Bet Card */}
            <div className="bg-[#1A1F2B] rounded-xl border border-zinc-700/40 p-4 mb-4">
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-white">
                  {modalidade.nome} -
                </span>
                <button
                  onClick={handleRemoveBet}
                  className="text-red-500 flex h-11 w-11 items-center justify-center rounded-lg active:scale-[0.98] transition-all"
                  aria-label="Remover todas as apostas"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {/* Palpites */}
              <div className="space-y-2 mb-4">
                {palpites.map((palpite, index) => (
                  <div
                    key={index}
                    className="inline-block bg-zinc-800/50 border border-zinc-700/40 rounded-xl px-2 py-1 text-xs mr-2 mb-1"
                  >
                    {palpite}
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div className="border-t border-dashed border-zinc-700/40 my-3" />

              {/* Value Info */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">R$ {formatCurrency(valorTotal)}</span>
                <span className="text-zinc-500 text-sm">{formatCurrency(valorPorPalpite)} / CADA</span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-dashed border-zinc-700/40 py-4 mb-4">
              <div className="text-center">
                <span className="text-zinc-400">Total: </span>
                <span className="font-bold text-white">R$ {formatCurrency(valorTotal)}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleMaisApostas}
                className="h-14 min-h-[56px] bg-[#E5A220] rounded-xl font-bold text-zinc-900 active:scale-[0.98] transition-all"
                aria-label="Adicionar mais apostas"
              >
                Mais Apostas
              </button>
              <button
                onClick={handleAvancar}
                className="h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
                aria-label="Avancar para selecao de dias"
              >
                Avancar
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-zinc-500">
            Nenhuma aposta adicionada
          </div>
        )}
      </div>
    </div>
  );
}

export function QuininhaResumoClient(props: QuininhaResumoClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111318]" />}>
      <QuininhaResumoContent {...props} />
    </Suspense>
  );
}
