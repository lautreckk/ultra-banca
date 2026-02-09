'use client';

import { useState } from 'react';
import { ChevronLeft, Menu, RefreshCw, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MobileDrawer, BrasiliaClock } from '@/components/layout';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

interface BetHeaderProps {
  title: string;
  onBack?: () => void;
}

export function BetHeader({ title, onBack }: BetHeaderProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { saldo, saldoBonus, loading, refresh } = useUserBalance();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4 pt-safe">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={handleBack}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleBack();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-base font-bold text-white">{title}</span>
          <button
            onClick={() => setDrawerOpen(true)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setDrawerOpen(true);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
        </div>
      </header>

      {/* Balance Bar - Golden */}
      <div className="flex items-center justify-between bg-[#E5A220] px-4 py-2.5">
        <button
          onClick={refresh}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10"
          aria-label="Atualizar saldo"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 text-zinc-900 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5 text-zinc-900" />
          )}
        </button>
        <div className="text-right">
          <span className="text-xs text-zinc-800/70">Real: </span>
          <span className="font-bold text-zinc-900">R$ {formatCurrencyCompact(saldo)}</span>
          <span className="text-zinc-800/50 mx-1">|</span>
          <span className="text-xs text-zinc-800/70">Bonus: </span>
          <span className="font-bold text-zinc-900">R$ {formatCurrencyCompact(saldoBonus)}</span>
        </div>
      </div>

      <BrasiliaClock />

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
