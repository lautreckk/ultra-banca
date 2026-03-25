'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import type { LayoutProps } from '@/lib/layouts/types';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { EliteHeader } from './components/EliteHeader';
import { EliteBottomNav } from './components/EliteBottomNav';
import { MobileDrawer } from '@/components/layout/mobile-drawer';

// Pages that use full-width grid (games, home)
const WIDE_PAGES = ['/home', '/cassino'];

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
  const pathname = usePathname();
  const totalSaldo = saldo + saldoBonus + saldoCassino + saldoBonusCassino;

  const isWidePage = WIDE_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (!casino_only) {
    // Normal Elite: mobile-first max-w-md (unchanged)
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

  // Casino-only: responsive desktop layout
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0C0E14' }}>
      {/* Header: full width with inner max constraint */}
      <div className="max-w-7xl mx-auto">
        <EliteHeader saldo={totalSaldo} isLoggedIn={isLoggedIn} />
      </div>

      {/* Main: wide for home/casino, wider centered for utility pages */}
      <main className={
        isWidePage
          ? 'pb-24'
          : 'pb-24 max-w-3xl mx-auto px-4 lg:px-0'
      }>
        {children}
      </main>

      {/* Bottom nav: always visible */}
      <EliteBottomNav isLoggedIn={isLoggedIn} />

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
