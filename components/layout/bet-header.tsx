'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Menu, RefreshCw, Eye, EyeOff, Loader2, Clock } from 'lucide-react';
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

  const [horaBrasilia, setHoraBrasilia] = useState('');
  useEffect(() => {
    const update = () => {
      setHoraBrasilia(
        new Date().toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

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

      {/* Horário de Brasília */}
      {horaBrasilia && (
        <div className="flex items-center justify-center gap-1.5 bg-zinc-900/80 py-1">
          <Clock className="h-3 w-3 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">
            {horaBrasilia} Brasilia
          </span>
        </div>
      )}

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
