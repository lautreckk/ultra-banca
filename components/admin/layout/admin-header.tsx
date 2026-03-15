'use client';

import { useState, useEffect } from 'react';
import { Menu, Bell, User, Sun, Moon } from 'lucide-react';
import { usePlatformConfig } from '@/contexts/platform-config-context';

interface AdminHeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

export function AdminHeader({ onMenuClick, userName = 'Admin' }: AdminHeaderProps) {
  const config = usePlatformConfig();
  const [isDark, setIsDark] = useState(true);

  // Inicializar tema do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-theme');
    if (saved === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('admin-light');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.remove('admin-light');
      localStorage.setItem('admin-theme', 'dark');
    } else {
      document.documentElement.classList.add('admin-light');
      localStorage.setItem('admin-theme', 'light');
    }
  };

  return (
    <header className="h-16 bg-zinc-900/50 admin-light:bg-white/80 border-b border-zinc-800/50 admin-light:border-zinc-200 flex items-center justify-between px-4 backdrop-blur-sm">
      {/* Menu button (mobile) */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-zinc-800 admin-light:hover:bg-zinc-100 text-zinc-400 admin-light:text-zinc-600 lg:hidden transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Title (desktop) */}
      <div className="hidden lg:flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white admin-light:text-zinc-900">
          {config.site_name} - Painel Administrativo
        </h1>
      </div>

      {/* Mobile platform name */}
      <div className="lg:hidden flex-1 flex justify-center">
        <span className="text-sm font-semibold text-white admin-light:text-zinc-900 truncate">
          {config.site_name}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-2 rounded-lg hover:bg-zinc-800 admin-light:hover:bg-zinc-100 text-zinc-400 admin-light:text-zinc-600 transition-all duration-150"
          title={isDark ? 'Tema claro' : 'Tema escuro'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-zinc-800 admin-light:hover:bg-zinc-100 text-zinc-400 admin-light:text-zinc-600 transition-all duration-150">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-zinc-900 admin-light:ring-white" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-zinc-800 admin-light:hover:bg-zinc-100 transition-all duration-150 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <User className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-sm font-medium text-zinc-300 admin-light:text-zinc-700 hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
