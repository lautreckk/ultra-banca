'use client';

import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BetSummaryProps {
  modalidade: string;
  colocacao: string;
  palpites: string[];
  valorUnitario: number;
  onRemoveBet?: () => void;
  onValendo: () => void;
  onMaisApostas: () => void;
  onAvancar: () => void;
  className?: string;
}

export function BetSummary({
  modalidade,
  colocacao,
  palpites,
  valorUnitario,
  onRemoveBet,
  onValendo,
  onMaisApostas,
  onAvancar,
  className,
}: BetSummaryProps) {
  const total = palpites.length * valorUnitario;
  const valorFormatted = valorUnitario.toFixed(2).replace('.', ',');
  const totalFormatted = total.toFixed(2).replace('.', ',');

  return (
    <div className={cn('bg-white min-h-screen', className)}>
      {/* Bet Card */}
      <div className="p-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <span className="font-bold text-gray-900">
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
                  className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-900"
                >
                  {palpite}
                </span>
              ))}
            </div>

            {/* Value Row */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">R$ {valorFormatted}</span>
              <span className="text-gray-500 text-sm">{valorFormatted} / CADA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className="px-4">
        <div className="border-t border-dashed border-gray-300" />
      </div>

      {/* Total */}
      <div className="py-4 text-center">
        <span className="text-lg">Total: </span>
        <span className="text-lg font-bold">R$ {totalFormatted}</span>
      </div>

      {/* Dashed Separator */}
      <div className="px-4">
        <div className="border-t border-dashed border-gray-300" />
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-3">
        <button
          onClick={onValendo}
          className="w-full h-12 bg-[#E5A220] rounded-lg font-semibold text-white"
        >
          Valendo
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onMaisApostas}
            className="h-12 bg-[#E5A220] rounded-lg font-semibold text-white"
          >
            Mais Apostas
          </button>
          <button
            onClick={onAvancar}
            className="h-12 bg-zinc-900 rounded-lg font-semibold text-white"
          >
            Avançar
          </button>
        </div>
      </div>
    </div>
  );
}
