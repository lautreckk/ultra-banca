'use client';

import { useState } from 'react';
import { Home, Menu, RefreshCw, Eye, EyeOff, ChevronLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MobileDrawer } from '@/components/layout';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  showHome?: boolean;
}

export function PageLayout({
  title,
  children,
  showBack = false,
  showHome = true
}: PageLayoutProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSaldo, setShowSaldo] = useState(false);
  const { saldo, saldoBonus, loading, refresh } = useUserBalance();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header - Dark for contrast */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between bg-zinc-900 px-4">
        {showBack ? (
          <button
            onClick={() => router.back()}
            onTouchEnd={(e) => {
              e.preventDefault();
              router.back();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        ) : showHome ? (
          <button
            onClick={() => router.push('/')}
            onTouchEnd={(e) => {
              e.preventDefault();
              router.push('/');
            }}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Ir para início"
          >
            <Home className="h-5 w-5 text-white" />
          </button>
        ) : (
          <div className="w-11" />
        )}
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
      </header>

      {/* Balance Bar - Yellow/Gold */}
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

      {/* Content */}
      {children}

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
