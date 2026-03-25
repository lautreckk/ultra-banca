'use client';

import { useState } from 'react';
import type { LayoutProps } from '@/lib/layouts/types';
import { usePlatformConfig } from '@/contexts/platform-config-context';
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
  const { casino_only } = usePlatformConfig();
  const totalSaldo = saldo + saldoBonus + saldoCassino + saldoBonusCassino;

  // Casino-only: full width responsive layout for desktop
  // Normal Elite: max-w-md mobile-first
  const containerClass = casino_only
    ? 'w-full min-h-screen'
    : 'w-full max-w-md min-h-screen';

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: '#0C0E14' }}>
      <div className={containerClass} style={{ backgroundColor: '#0C0E14' }}>
        <EliteHeader saldo={totalSaldo} isLoggedIn={isLoggedIn} />
        <main className={casino_only ? 'pb-8 max-w-7xl mx-auto' : 'pb-24'}>{children}</main>
        <EliteBottomNav isLoggedIn={isLoggedIn} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
