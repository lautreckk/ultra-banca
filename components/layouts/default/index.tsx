'use client';

import { useState } from 'react';
import { Header, BalanceDisplay, MobileDrawer, BrasiliaClock } from '@/components/layout';
import type { LayoutProps } from '@/lib/layouts/types';

export function DefaultLayout({
  children,
  saldo,
  saldoBonus,
  saldoCassino,
  saldoBonusCassino,
  unidade,
  onRefresh,
}: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: 'var(--color-background, #111318)' }}>
      <div className="w-full max-w-md min-h-screen shadow-xl" style={{ backgroundColor: 'var(--color-background, #111318)' }}>
        <Header showHome showMenu onMenuClick={() => setDrawerOpen(true)} />
        <BalanceDisplay
          saldo={saldo}
          saldoBonus={saldoBonus}
          saldoCassino={saldoCassino}
          saldoBonusCassino={saldoBonusCassino}
          unidade={unidade}
          onRefresh={onRefresh}
        />
        <BrasiliaClock />
        <main className="pb-safe">{children}</main>
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
