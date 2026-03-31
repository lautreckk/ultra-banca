'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { Header, BalanceDisplay, MobileDrawer, BrasiliaClock } from '@/components/layout';
import { AuthModal } from '@/components/auth/auth-modal';
import type { LayoutProps } from '@/lib/layouts/types';

export function DefaultLayout({
  children,
  saldo,
  saldoBonus,
  saldoCassino,
  saldoBonusCassino,
  unidade,
  onRefresh,
  isLoggedIn = true,
}: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: 'var(--color-background, #111318)' }}>
      <div className="w-full max-w-md min-h-screen shadow-xl" style={{ backgroundColor: 'var(--color-background, #111318)' }}>
        <Header showHome showMenu={isLoggedIn} onMenuClick={() => setDrawerOpen(true)} />
        {isLoggedIn ? (
          <BalanceDisplay
            saldo={saldo}
            saldoBonus={saldoBonus}
            saldoCassino={saldoCassino}
            saldoBonusCassino={saldoBonusCassino}
            unidade={unidade}
            onRefresh={onRefresh}
          />
        ) : (
          <div className="border-b border-zinc-700/30 px-4 py-3" style={{ backgroundColor: '#1A1F2B' }}>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-transform active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <UserPlus className="h-5 w-5" />
              Cadastre-se e comece a jogar!
            </button>
          </div>
        )}
        <BrasiliaClock />
        <main className="pb-safe">{children}</main>
        {isLoggedIn && <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultTab="cadastro"
        />
      </div>
    </div>
  );
}
