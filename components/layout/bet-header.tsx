'use client';

import { useState } from 'react';
import { ChevronLeft, Menu, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MobileDrawer } from '@/components/layout';

interface BetHeaderProps {
  title: string;
  onBack?: () => void;
}

export function BetHeader({ title, onBack }: BetHeaderProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSaldo, setShowSaldo] = useState(false);

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
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">{title}</span>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* Balance Bar */}
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

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
