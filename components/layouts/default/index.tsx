'use client';

import { useState } from 'react';
import { Header, BalanceDisplay, MobileDrawer } from '@/components/layout';
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
    <div className="min-h-screen bg-zinc-950 flex justify-center">
      <div className="w-full max-w-md min-h-screen shadow-xl" style={{ backgroundColor: '#111318' }}>
        <Header showHome showMenu onMenuClick={() => setDrawerOpen(true)} />
        <BalanceDisplay
          saldo={saldo}
          saldoBonus={saldoBonus}
          saldoCassino={saldoCassino}
          saldoBonusCassino={saldoBonusCassino}
          unidade={unidade}
          onRefresh={onRefresh}
        />
        <main className="pb-safe">{children}</main>
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
