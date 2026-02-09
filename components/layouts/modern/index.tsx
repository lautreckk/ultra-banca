'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModernHeader } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import type { LayoutProps } from '@/lib/layouts/types';

export function ModernLayout({
  children,
  saldo,
  saldoBonus,
  saldoCassino,
  saldoBonusCassino,
  unidade,
  onRefresh,
  loading,
}: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load theme CSS
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/layouts/modern/theme.css';
    link.id = 'modern-theme';
    document.head.appendChild(link);

    // Add data attribute for CSS scoping
    document.documentElement.setAttribute('data-layout', 'modern');

    return () => {
      const existingLink = document.getElementById('modern-theme');
      if (existingLink) {
        existingLink.remove();
      }
      document.documentElement.removeAttribute('data-layout');
    };
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-background)',
        backgroundImage: 'var(--modern-bg-pattern)',
      }}
    >
      {/* Sidebar fixa a esquerda (desktop only) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        saldo={saldo}
        saldoBonus={saldoBonus}
        saldoCassino={saldoCassino}
        saldoBonusCassino={saldoBonusCassino}
      />

      {/* Container principal com margem para sidebar */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: isMobile ? 0 : isSidebarCollapsed ? '4rem' : '16rem',
          paddingBottom: isMobile ? '5rem' : 0, // Space for bottom nav
        }}
      >
        {/* Header */}
        <ModernHeader
          saldo={saldo}
          saldoBonus={saldoBonus}
          saldoCassino={saldoCassino}
          saldoBonusCassino={saldoBonusCassino}
          onRefresh={onRefresh}
          loading={loading}
          onMenuClick={() => setDrawerOpen(true)}
        />

        {/* Main content */}
        <main
          className="p-4 md:p-8 pb-8"
          style={{
            maxWidth: '100%',
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav onMenuClick={() => setDrawerOpen(true)} />}

      {/* Mobile Drawer - reusa o existente */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
