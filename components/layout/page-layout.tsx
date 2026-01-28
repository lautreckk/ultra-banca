'use client';

import { useState } from 'react';
import { Home, Menu, RefreshCw, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MobileDrawer } from '@/components/layout';

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
  const [showSaldo, setShowSaldo] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between bg-[#1A202C] px-4">
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        ) : showHome ? (
          <button
            onClick={() => router.push('/')}
            className="flex h-10 w-10 items-center justify-center"
          >
            <Home className="h-5 w-5 text-white" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <span className="text-sm font-bold text-white">{title}</span>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-10 w-10 items-center justify-center"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      </header>

      {/* Balance Bar - Yellow/Gold */}
      <div className="flex items-center justify-between bg-[#E5A220] px-4 py-2">
        <button className="flex h-8 w-8 items-center justify-center">
          <RefreshCw className="h-5 w-5 text-black" />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black">
            R$ {showSaldo ? '150,00' : '*******'} | {showSaldo ? '25,50' : '*******'}
          </span>
          <button onClick={() => setShowSaldo(!showSaldo)}>
            {showSaldo ? (
              <Eye className="h-5 w-5 text-black" />
            ) : (
              <EyeOff className="h-5 w-5 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {children}

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
