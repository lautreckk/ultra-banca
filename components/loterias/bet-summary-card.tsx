'use client';

import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-currency';
import { BetItem } from '@/types/bet';
import { getModalidadeById, getColocacaoById, getHorarioById } from '@/lib/constants';

interface BetSummaryCardProps {
  item: BetItem;
  onRemove: (id: string) => void;
  className?: string;
}

export function BetSummaryCard({ item, onRemove, className }: BetSummaryCardProps) {
  const modalidade = getModalidadeById(item.modalidade);
  const colocacao = getColocacaoById(item.colocacao);
  const quantidade = item.palpites.length * item.horarios.length;
  const valorTotal = item.valorUnitario * quantidade;

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-[#1A1F2B] p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-white">
            {modalidade?.nome || item.modalidade} - {colocacao?.nome || item.colocacao}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {item.data} | {item.horarios.map((h) => getHorarioById(h)?.nome || h).join(', ')}
          </p>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 active:bg-zinc-700/30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Palpites */}
      <div className="mt-3 flex flex-wrap gap-2">
        {item.palpites.map((palpite) => (
          <Badge key={palpite} variant="default" size="sm">
            {palpite}
          </Badge>
        ))}
      </div>

      {/* Price */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-bold text-white">{formatCurrency(valorTotal)}</span>
        <span className="text-zinc-500">
          {formatCurrency(item.valorUnitario)} / CADA ({quantidade}x)
        </span>
      </div>
    </div>
  );
}
