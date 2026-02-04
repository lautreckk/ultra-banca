'use client';

import { useState } from 'react';
import { Header, BalanceDisplay, MobileDrawer } from '@/components/layout';
import type { LayoutProps } from '@/lib/layouts/types';

export function DefaultLayout({
  children,
  saldo,
  saldoBonus,
  unidade,
  onRefresh,
}: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-300 flex justify-center">
      <div className="w-full max-w-md bg-gray-100 min-h-screen shadow-xl">
        <Header showHome showMenu onMenuClick={() => setDrawerOpen(true)} />
        <BalanceDisplay
          saldo={saldo}
          saldoBonus={saldoBonus}
          unidade={unidade}
          onRefresh={onRefresh}
        />
        <main className="pb-safe">{children}</main>
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
