'use client';

import { useState } from 'react';
import type { LayoutProps } from '@/lib/layouts/types';
import { EliteHeader } from './components/EliteHeader';
import { EliteBottomNav } from './components/EliteBottomNav';
import { MobileDrawer } from '@/components/layout/mobile-drawer';

export function EliteLayout({
  children,
  saldo,
  saldoBonus,
  saldoCassino,
  saldoBonusCassino,
  isLoggedIn = true,
}: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const totalSaldo = saldo + saldoBonus + saldoCassino + saldoBonusCassino;

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: '#0C0E14' }}>
      <div className="w-full max-w-md min-h-screen" style={{ backgroundColor: '#0C0E14' }}>
        <EliteHeader saldo={totalSaldo} isLoggedIn={isLoggedIn} />
        <main className="pb-24">{children}</main>
        <EliteBottomNav isLoggedIn={isLoggedIn} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
