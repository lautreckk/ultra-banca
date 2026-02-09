'use client';

import { useState } from 'react';
import { ChevronLeft, Menu, RefreshCw, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { MobileDrawer, BrasiliaClock } from '@/components/layout';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

export default function LoteriasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSaldo, setShowSaldo] = useState(false);
  const { saldo, saldoBonus, loading, refresh } = useUserBalance();

  // Check if we're in colocacao step - if so, let the page render its own header
  const colocacao = params?.colocacao as string | undefined;
  const isInBetFlow = !!colocacao;

  const handleBack = () => {
    router.back();
  };

  // If in bet flow, render with centering but without shared header (page handles its own)
  if (isInBetFlow) {
    return (
      <div className="min-h-screen bg-[#111318] flex justify-center">
        <div className="w-full max-w-md bg-[#111318] min-h-screen shadow-xl flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111318] flex justify-center">
      <div className="w-full max-w-md bg-[#111318] min-h-screen shadow-xl flex flex-col">
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
            <span className="text-base font-bold text-white">TIPO DE JOGO</span>
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
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900">
              R$ {showSaldo ? formatCurrencyCompact(saldo) : '*******'} | {showSaldo ? formatCurrencyCompact(saldoBonus) : '*******'}
            </span>
            <button
              onClick={() => setShowSaldo(!showSaldo)}
              className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10"
              aria-label={showSaldo ? 'Ocultar saldo' : 'Mostrar saldo'}
            >
              {showSaldo ? (
                <Eye className="h-5 w-5 text-zinc-900" />
              ) : (
                <EyeOff className="h-5 w-5 text-zinc-900" />
              )}
            </button>
          </div>
        </div>

        <BrasiliaClock />

        {/* Content */}
        <div className="flex-1 bg-[#111318]">
          {children}
        </div>

        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
