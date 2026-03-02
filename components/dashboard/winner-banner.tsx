'use client';

import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/format-currency';

interface WinnerBannerProps {
  nome: string;
  valor: number;
  modalidade?: string;
  className?: string;
}

export function WinnerBanner({
  nome,
  valor,
  modalidade = 'MILHAR',
  className,
}: WinnerBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] p-4',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
        <Trophy className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-white/80">ULTIMO GANHADOR</p>
        <p className="font-bold text-white">{nome}</p>
        <p className="text-sm text-white/90">
          {formatCurrency(valor)} - {modalidade}
        </p>
      </div>
    </div>
  );
}
