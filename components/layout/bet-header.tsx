'use client';

import { useState } from 'react';
import { ChevronLeft, Menu, RefreshCw, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MobileDrawer } from '@/components/layout';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

interface BetHeaderProps {
  title: string;
  onBack?: () => void;
}

export function BetHeader({ title, onBack }: BetHeaderProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSaldo, setShowSaldo] = useState(false);
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
      {/* Header - Dark for contrast */}
      <header className="sticky top-0 z-40 bg-zinc-900 px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">{title}</span>
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

      {/* Balance Bar */}
      <div className="flex items-center justify-between bg-[#E5A220] px-4 py-2">
        <button
          onClick={refresh}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 text-zinc-900 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5 text-zinc-900" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-900">
            R$ {showSaldo ? formatCurrencyCompact(saldo) : '*******'} | {showSaldo ? formatCurrencyCompact(saldoBonus) : '*******'}
          </span>
          <button onClick={() => setShowSaldo(!showSaldo)}>
            {showSaldo ? (
              <Eye className="h-5 w-5 text-zinc-900" />
            ) : (
              <EyeOff className="h-5 w-5 text-zinc-900" />
            )}
          </button>
        </div>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
