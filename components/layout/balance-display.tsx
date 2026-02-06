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
    <div className={cn('bg-white', className)}>
      {/* Unidade Badge */}
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
          UNIDADE #{unidade}
        </span>
      </div>

      {/* Balance Row */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Refresh + Saldo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex h-6 w-6 items-center justify-center rounded active:opacity-70"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-gray-800">Saldo</span>
              <button
                onClick={toggleBalance}
                className="flex h-5 w-5 items-center justify-center"
              >
                {showBalance ? (
                  <Eye className="h-4 w-4 text-gray-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
            <span className="text-xs text-gray-500">Bonus</span>
          </div>
        </div>

        {/* Right: Values */}
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">
            R$ {showBalance ? formatCurrencyCompact(saldo) : maskedValue}
          </p>
          <p className="text-xs text-gray-500">
            R$ {showBalance ? formatCurrencyCompact(saldoBonus) : maskedValue}
          </p>
        </div>
      </div>
    </div>
  );
}
