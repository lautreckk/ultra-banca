'use client';

import { Home, Trophy, Plus, Wallet, User, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Início', href: '/home' },
  { icon: Trophy, label: 'Prêmios', href: '/premiadas' },
  { icon: null, label: 'Apostar', href: '/loterias' },
  { icon: Wallet, label: 'Carteira', href: '/recarga-pix' },
  { icon: User, label: 'Perfil', href: '/perfil' },
];

const CASINO_NAV_ITEMS = [
  { icon: Home, label: 'Início', href: '/home' },
  { icon: Gamepad2, label: 'Cassino', href: '/cassino' },
  { icon: null, label: 'Depositar', href: '/recarga-pix' },
  { icon: Wallet, label: 'Carteira', href: '/saques' },
  { icon: User, label: 'Perfil', href: '/perfil' },
];

interface EliteBottomNavProps {
  isLoggedIn?: boolean;
}

export function EliteBottomNav({ isLoggedIn = true }: EliteBottomNavProps) {
  const pathname = usePathname();
  const { casino_only } = usePlatformConfig();

  // Casino-only: hide bottom nav for unauthenticated users
  if (casino_only && !isLoggedIn) return null;

  const items = casino_only ? CASINO_NAV_ITEMS : NAV_ITEMS;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t"
      style={{
        backgroundColor: 'rgba(12, 14, 20, 0.95)',
        borderColor: 'rgba(255, 215, 0, 0.1)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="max-w-3xl mx-auto flex items-end justify-around px-2 pt-1 pb-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isCenter = item.icon === null;

          if (isCenter) {
            return (
              <Link key={item.label} href={item.href} className="flex flex-col items-center -mt-5">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border-4"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
                    borderColor: '#0C0E14',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                  }}
                >
                  <Plus className="h-7 w-7 text-black" strokeWidth={3} />
                </div>
                <span className="text-[10px] font-bold mt-1" style={{ color: '#FFD700' }}>{item.label}</span>
              </Link>
            );
          }

          const Icon = item.icon!;
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center py-2 px-3 min-w-[56px]">
              <Icon
                className="h-5 w-5 transition-colors"
                style={{ color: isActive ? '#FFD700' : '#4a5068' }}
              />
              <span
                className="text-[10px] font-semibold mt-1 transition-colors"
                style={{ color: isActive ? '#FFD700' : '#4a5068' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
