'use client';

import { useState } from 'react';
import { Home, Menu, RefreshCw, Eye, EyeOff, ChevronLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MobileDrawer, BrasiliaClock } from '@/components/layout';
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
  const [showSaldo, setShowSaldo] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('show-balance') === '1';
    }
    return false;
  });
  const { saldo, saldoBonus, loading, refresh } = useUserBalance();

  const toggleSaldo = () => {
    setShowSaldo((prev) => {
      const next = !prev;
      localStorage.setItem('show-balance', next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#111318] flex justify-center">
      <div className="w-full max-w-md min-h-screen shadow-xl flex flex-col" style={{ backgroundColor: '#111318' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between bg-[#1A202C] px-4 pt-safe">
        {showBack ? (
          <button
            onClick={() => router.back()}
            onTouchEnd={(e) => {
              e.preventDefault();
              router.back();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-white/10 active:scale-[0.98] transition-all"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        ) : showHome ? (
          <button
            onClick={() => router.push('/home')}
            onTouchEnd={(e) => {
              e.preventDefault();
              router.push('/home');
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-white/10 active:scale-[0.98] transition-all"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Ir para início"
          >
            <Home className="h-5 w-5 text-white" />
          </button>
        ) : (
          <div className="w-11" />
        )}
        <span className="text-base font-bold text-white">{title}</span>
        <button
          onClick={() => setDrawerOpen(true)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setDrawerOpen(true);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-white/10 active:scale-[0.98] transition-all"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
      </header>

      {/* Balance Bar */}
      <div className="flex items-center justify-between border-b border-zinc-700/30 px-4 py-2.5" style={{ backgroundColor: '#1A1F2B' }}>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-white/10 active:scale-[0.98] transition-all"
          aria-label="Atualizar saldo"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5 text-zinc-400" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">
            R$ {showSaldo ? formatCurrencyCompact(saldo) : '*******'} | {showSaldo ? formatCurrencyCompact(saldoBonus) : '*******'}
          </span>
          <button
            onClick={toggleSaldo}
            className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-white/10 active:scale-[0.98] transition-all"
            aria-label={showSaldo ? 'Ocultar saldo' : 'Mostrar saldo'}
          >
            {showSaldo ? (
              <Eye className="h-5 w-5 text-zinc-400" />
            ) : (
              <EyeOff className="h-5 w-5 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      <BrasiliaClock />

      {/* Content */}
      <div className="flex-1">{children}</div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
