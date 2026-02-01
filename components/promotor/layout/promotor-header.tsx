'use client';

import { Menu } from 'lucide-react';

interface PromotorHeaderProps {
  onMenuClick: () => void;
}

export function PromotorHeader({ onMenuClick }: PromotorHeaderProps) {
  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-white hidden sm:block">Portal do Promotor</h2>
      </div>
    </header>
  );
}
