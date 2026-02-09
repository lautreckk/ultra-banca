'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Ticket,
  Trophy,
  Wallet,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Dices,
  Calculator,
  Moon,
  Beef,
  Gamepad2,
} from 'lucide-react';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { formatCurrency } from '@/lib/utils/format-currency';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  saldo: number;
  saldoBonus: number;
  saldoCassino: number;
  saldoBonusCassino: number;
}

const NAVIGATION_ITEMS = [
  { icon: Home, label: 'Inicio', href: '/home' },
  { icon: Dices, label: 'Loterias', href: '/loterias' },
  { icon: Beef, label: 'Fazendinha', href: '/fazendinha' },
  { icon: Calculator, label: 'Quininha', href: '/quininha' },
  { icon: Moon, label: 'Seninha', href: '/seninha' },
  { icon: Ticket, label: 'Lotinha', href: '/lotinha' },
  { icon: Gamepad2, label: 'Cassino', href: '/cassino' },
  { icon: Trophy, label: 'Resultados', href: '/resultados' },
  { icon: Wallet, label: 'Depositar', href: '/recarga-pix' },
  { icon: FileText, label: 'Relatorios', href: '/relatorios' },
];

export function Sidebar({ isCollapsed, onToggleCollapse, saldo, saldoBonus, saldoCassino, saldoBonusCassino }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const config = usePlatformConfig();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside
      className="fixed top-0 left-0 h-screen border-r transition-all duration-300 flex-col hidden md:flex"
      style={{
        width: isCollapsed ? '4rem' : '16rem',
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
        zIndex: 40,
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo/Header */}
      <div
        className="p-4 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.site_name} className="h-8 w-auto" />
            ) : (
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: 'var(--modern-gradient-primary)' }}
              >
                {config.site_name?.charAt(0) || 'B'}
              </div>
            )}
            <span className="font-semibold text-lg truncate" style={{ color: 'var(--color-text)' }}>
              {config.site_name || 'Banca'}
            </span>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{ backgroundColor: 'var(--color-background)' }}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
          ) : (
            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg
                    transition-all duration-200
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  style={{
                    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--color-text-muted)',
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer - Balance e Logout */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {!isCollapsed ? (
          <div className="space-y-3">
            <div
              className="p-3 rounded-lg space-y-2"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              {/* Loterias */}
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Wallet className="h-3 w-3 text-amber-400" />
                  <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Loterias</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Real:</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{formatCurrency(saldo)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Bonus:</span>
                  <span className="text-xs" style={{ color: 'var(--color-accent-green)' }}>{formatCurrency(saldoBonus)}</span>
                </div>
              </div>

              <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

              {/* Cassino */}
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Gamepad2 className="h-3 w-3 text-purple-400" />
                  <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Cassino</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Real:</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{formatCurrency(saldoCassino)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Bonus:</span>
                  <span className="text-xs" style={{ color: 'var(--color-accent-green)' }}>{formatCurrency(saldoBonusCassino)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-muted)',
              }}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg transition-colors hover:opacity-80 w-full flex justify-center"
            style={{ backgroundColor: 'var(--color-background)' }}
            title="Sair"
          >
            <LogOut className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        )}
      </div>
    </aside>
  );
}
