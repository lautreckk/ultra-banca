'use client';

import { RefreshCw, Wallet, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

interface BalanceDisplayProps {
  saldo: number;
  saldoBonus: number;
  saldoCassino: number;
  saldoBonusCassino: number;
  unidade?: string;
  onRefresh?: () => void;
  className?: string;
}

export function BalanceDisplay({
  saldo,
  saldoBonus,
  saldoCassino,
  saldoBonusCassino,
  unidade = '979536',
  onRefresh,
  className,
}: BalanceDisplayProps) {
  return (
    <div className={cn('border-b border-zinc-700/30', className)} style={{ backgroundColor: '#1A1F2B' }}>
      {/* Unidade Badge */}
      <div className="flex justify-center py-1.5">
        <span className="rounded-full bg-emerald-500 px-4 py-0.5 text-xs font-bold text-white tracking-wide">
          UNIDADE #{unidade}
        </span>
      </div>

      {/* Balance Row */}
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: Refresh */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Atualizar saldo"
          >
            <RefreshCw className="h-5 w-5 text-zinc-400" />
          </button>
          <span className="text-sm font-bold text-white">Saldos</span>
        </div>

        {/* Right: Values */}
        <div className="text-right space-y-1.5">
          {/* Loterias */}
          <div>
            <div className="flex items-center justify-end gap-1.5 mb-0.5">
              <Wallet className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-medium text-zinc-400">Loterias</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] text-zinc-500">Real:</span>
              <span className="text-sm font-bold text-white">
                R$ {formatCurrencyCompact(saldo)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] text-zinc-500">Bonus:</span>
              <span className="text-[11px] text-emerald-400">
                R$ {formatCurrencyCompact(saldoBonus)}
              </span>
            </div>
          </div>

          <div className="border-t border-zinc-700/30" />

          {/* Cassino */}
          <div>
            <div className="flex items-center justify-end gap-1.5 mb-0.5">
              <Gamepad2 className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[11px] font-medium text-zinc-400">Cassino</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] text-zinc-500">Real:</span>
              <span className="text-sm font-bold text-white">
                R$ {formatCurrencyCompact(saldoCassino)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] text-zinc-500">Bonus:</span>
              <span className="text-[11px] text-emerald-400">
                R$ {formatCurrencyCompact(saldoBonusCassino)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
