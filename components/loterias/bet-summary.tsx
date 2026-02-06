'use client';

import { Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PendingBet } from '@/stores/bet-store';
import { getModalidadeById, getColocacaoById } from '@/lib/constants';

interface BetSummaryProps {
  modalidade: string;
  colocacao: string;
  palpites: string[];
  valorUnitario: number;
  pendingItems?: PendingBet[];
  onRemoveBet?: () => void;
  onRemovePendingItem?: (id: string) => void;
  onEditPendingItem?: (item: PendingBet) => void;
  onMaisApostas: () => void;
  onAvancar: () => void;
  className?: string;
}

export function BetSummary({
  modalidade,
  colocacao,
  palpites,
  valorUnitario,
  pendingItems = [],
  onRemoveBet,
  onRemovePendingItem,
  onEditPendingItem,
  onMaisApostas,
  onAvancar,
  className,
}: BetSummaryProps) {
  const totalAtual = palpites.length * valorUnitario;
  const valorFormatted = valorUnitario.toFixed(2).replace('.', ',');

  // Calcula total de todas as apostas (pendentes + atual)
  const totalPendentes = pendingItems.reduce(
    (acc, item) => acc + item.palpites.length * item.valorUnitario,
    0
  );
  const totalGeral = totalPendentes + totalAtual;
  const totalFormatted = totalGeral.toFixed(2).replace('.', ',');

  return (
    <div className={cn('bg-[#1A1F2B] min-h-screen', className)}>
      {/* Apostas pendentes (já adicionadas) */}
      {pendingItems.length > 0 && (
        <div className="p-4 space-y-3">
          <p className="text-sm text-zinc-500 font-medium">
            Apostas acumuladas ({pendingItems.length}):
          </p>
          {pendingItems.map((item) => {
            const modalidadeInfo = getModalidadeById(item.modalidade);
            const colocacaoInfo = getColocacaoById(item.colocacao);
            const itemTotal = item.palpites.length * item.valorUnitario;

            return (
              <div
                key={item.id}
                className="border border-zinc-700/40 rounded-lg overflow-hidden bg-zinc-800/30"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700/40">
                  <span className="font-bold text-zinc-300 text-sm">
                    {modalidadeInfo?.nome || item.modalidade.toUpperCase()} -{' '}
                    {colocacaoInfo?.nome || item.colocacao.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    {onEditPendingItem && (
                      <button
                        onClick={() => onEditPendingItem(item)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar aposta"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {onRemovePendingItem && (
                      <button
                        onClick={() => onRemovePendingItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover aposta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.palpites.map((palpite) => (
                      <span
                        key={palpite}
                        className="inline-flex items-center px-2 py-0.5 border border-zinc-700/40 rounded text-xs font-medium text-zinc-300"
                      >
                        {palpite}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300">
                      R$ {itemTotal.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-zinc-500 text-xs">
                      {item.valorUnitario.toFixed(2).replace('.', ',')} / CADA
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Divider */}
          <div className="border-t border-dashed border-zinc-700/40 my-2" />
        </div>
      )}

      {/* Aposta atual */}
      <div className="p-4">
        {pendingItems.length > 0 && (
          <p className="text-sm text-zinc-500 font-medium mb-2">Aposta atual:</p>
        )}
        <div className="border border-zinc-700/40 rounded-lg overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/40">
            <span className="font-bold text-white">
              {modalidade.toUpperCase()} - {colocacao.toUpperCase()}
            </span>
            {onRemoveBet && (
              <button onClick={onRemoveBet} className="text-red-500">
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Card Content */}
          <div className="px-4 py-3">
            {/* Palpites */}
            <div className="flex flex-wrap gap-2 mb-3">
              {palpites.map((palpite) => (
                <span
                  key={palpite}
                  className="inline-flex items-center px-2 py-1 border border-zinc-700/40 rounded text-sm font-medium text-white"
                >
                  {palpite}
                </span>
              ))}
            </div>

            {/* Value Row */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">
                R$ {totalAtual.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-zinc-500 text-sm">{valorFormatted} / CADA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className="px-4">
        <div className="border-t border-dashed border-zinc-700/40" />
      </div>

      {/* Total */}
      <div className="py-4 text-center">
        <span className="text-lg">Total: </span>
        <span className="text-lg font-bold">R$ {totalFormatted}</span>
        {pendingItems.length > 0 && (
          <p className="text-sm text-zinc-500 mt-1">
            ({pendingItems.length + 1} apostas)
          </p>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="px-4">
        <div className="border-t border-dashed border-zinc-700/40" />
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-3">
        <button
          onClick={onAvancar}
          className="w-full h-14 min-h-[56px] bg-[#E5A220] rounded-xl font-bold text-zinc-900 active:scale-[0.98] transition-all"
        >
          Selecionar Loterias
        </button>

        <button
          onClick={onMaisApostas}
          className="w-full h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
        >
          + Mais Apostas
        </button>
      </div>
    </div>
  );
}
