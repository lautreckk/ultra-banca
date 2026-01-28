'use client';

import { Menu, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlatformConfig } from '@/contexts/platform-config-context';

interface AdminHeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

export function AdminHeader({ onMenuClick, userName = 'Admin' }: AdminHeaderProps) {
  const config = usePlatformConfig();

  return (
    <header className="h-16 bg-zinc-900/50 border-b border-zinc-800/50 flex items-center justify-between px-4 backdrop-blur-sm">
      {/* Menu button (mobile) */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Title (desktop) */}
      <div className="hidden lg:block">
        <h1 className="text-lg font-semibold text-white">
          {config.site_name} - Painel Administrativo
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-all duration-150">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-zinc-900" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all duration-150 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <User className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-sm font-medium text-zinc-300 hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
