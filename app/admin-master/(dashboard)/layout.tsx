'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  LogOut,
  Menu,
  X,
  Crown,
  ArrowLeft,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin-master/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Clientes',
    href: '/admin-master/clientes',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    label: 'Plataformas',
    href: '/admin-master/plataformas',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    label: 'Administradores',
    href: '/admin-master/administradores',
    icon: <Users className="h-5 w-5" />,
  },
];

export default function AdminMasterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-gradient-to-b from-purple-950 to-zinc-900 border-r border-purple-800/30 transition-all duration-300 flex flex-col shrink-0',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16',
          'lg:static lg:h-full'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-purple-800/30',
            sidebarOpen ? 'px-4 justify-between' : 'justify-center'
          )}
        >
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-purple-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Cúpula Barão
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-purple-800/30 text-purple-400 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-purple-800/30 text-purple-400 hidden lg:block"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 py-4 overflow-y-auto', !sidebarOpen && 'hidden lg:block')}>
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                    isActive(item.href)
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-zinc-400 hover:bg-purple-800/20 hover:text-white',
                    !sidebarOpen && 'lg:justify-center lg:px-2'
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {item.icon}
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Back to Admin */}
        <div className={cn('p-4 border-t border-purple-800/30', !sidebarOpen && 'hidden lg:block')}>
          <Link
            href="/admin/dashboard"
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-purple-800/20 hover:text-white transition-all duration-150',
              !sidebarOpen && 'lg:justify-center lg:px-2'
            )}
            title={!sidebarOpen ? 'Voltar ao Admin' : undefined}
          >
            <ArrowLeft className="h-5 w-5" />
            {sidebarOpen && <span className="font-medium">Voltar ao Admin</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-zinc-900/50 border-b border-purple-800/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              Cúpula Barão
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <Crown className="h-4 w-4" />
            <span>Super Admin</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
