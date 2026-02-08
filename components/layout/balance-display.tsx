'use client';

import { useState } from 'react';
import { RefreshCw, Eye, EyeOff, Wallet, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

interface BalanceDisplayProps {
  saldo: number;
  saldoBonus: number;
  saldoCassino: number;
  unidade?: string;
  onRefresh?: () => void;
  className?: string;
}

export function BalanceDisplay({
  saldo,
  saldoBonus,
  saldoCassino,
  unidade = '979536',
  onRefresh,
  className,
}: BalanceDisplayProps) {
  const [showBalance, setShowBalance] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('show-balance') === '1';
    }
    return false;
  });

  const toggleBalance = () => {
    setShowBalance((prev) => {
      const next = !prev;
      localStorage.setItem('show-balance', next ? '1' : '0');
      return next;
    });
  };

  const maskedValue = '*******';

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
        {/* Left: Refresh + Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Atualizar saldo"
          >
            <RefreshCw className="h-5 w-5 text-zinc-400" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">Saldos</span>
              <button
                onClick={toggleBalance}
                className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
                aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
              >
                {showBalance ? (
                  <Eye className="h-5 w-5 text-zinc-400" />
                ) : (
                  <EyeOff className="h-5 w-5 text-zinc-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Values */}
        <div className="text-right space-y-0.5">
          <div className="flex items-center justify-end gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] text-zinc-500">Loterias</span>
            <span className="text-sm font-bold text-white">
              R$ {showBalance ? formatCurrencyCompact(saldo) : maskedValue}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <Gamepad2 className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[11px] text-zinc-500">Cassino</span>
            <span className="text-sm font-bold text-white">
              R$ {showBalance ? formatCurrencyCompact(saldoCassino) : maskedValue}
            </span>
          </div>
          {saldoBonus > 0 && (
            <p className="text-[11px] text-zinc-500">
              Bonus: R$ {showBalance ? formatCurrencyCompact(saldoBonus) : maskedValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
