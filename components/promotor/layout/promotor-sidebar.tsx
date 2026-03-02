'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Wallet,
  LogOut,
  Menu,
  X,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { logoutPromotor } from '@/lib/promotor/actions/dashboard';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/promotor',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Indicados',
    href: '/promotor/referidos',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Comissões',
    href: '/promotor/comissoes',
    icon: <Wallet className="h-5 w-5" />,
  },
];

interface PromotorSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  promotorNome?: string;
}

export function PromotorSidebar({ isOpen, onToggle, promotorNome }: PromotorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutPromotor();
      router.push('/promotor/login');
    });
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-zinc-900 border-r border-zinc-800/50 transition-all duration-300 flex flex-col shrink-0',
          isOpen ? 'w-64' : 'w-0 lg:w-16',
          'lg:static lg:h-full'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'h-16 flex items-center border-b border-zinc-800/50',
          isOpen ? 'px-4 justify-between' : 'justify-center'
        )}>
          {isOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-lg font-bold text-white">Promotor</span>
              </div>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hidden lg:block"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* User Info */}
        {isOpen && promotorNome && (
          <div className="px-4 py-3 border-b border-zinc-800/50">
            <p className="text-sm text-zinc-400">Olá,</p>
            <p className="text-white font-medium truncate">{promotorNome}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className={cn('flex-1 py-4 overflow-y-auto', !isOpen && 'hidden lg:block')}>
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                    isActive(item.href)
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                    !isOpen && 'lg:justify-center lg:px-2'
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  {item.icon}
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className={cn('p-4 border-t border-zinc-800/50', !isOpen && 'hidden lg:block')}>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 disabled:opacity-50',
              !isOpen && 'lg:justify-center lg:px-2'
            )}
            title={!isOpen ? 'Sair' : undefined}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            {isOpen && <span className="font-medium">{isPending ? 'Saindo...' : 'Sair'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
