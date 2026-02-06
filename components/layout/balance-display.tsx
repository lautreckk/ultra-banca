'use client';

import { useState } from 'react';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

interface BalanceDisplayProps {
  saldo: number;
  saldoBonus: number;
  unidade?: string;
  onRefresh?: () => void;
  className?: string;
}

export function BalanceDisplay({
  saldo,
  saldoBonus,
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
        {/* Left: Refresh + Saldo */}
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
              <span className="text-sm font-bold text-white">Saldo</span>
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
            <span className="text-xs text-zinc-500">Bonus</span>
          </div>
        </div>

        {/* Right: Values */}
        <div className="text-right">
          <p className="text-base font-bold text-white">
            R$ {showBalance ? formatCurrencyCompact(saldo) : maskedValue}
          </p>
          <p className="text-xs text-zinc-500">
            R$ {showBalance ? formatCurrencyCompact(saldoBonus) : maskedValue}
          </p>
        </div>
      </div>
    </div>
  );
}
