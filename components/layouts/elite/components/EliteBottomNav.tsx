'use client';

import { Home, Trophy, Plus, Wallet, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Início', href: '/home' },
  { icon: Trophy, label: 'Prêmios', href: '/premiadas' },
  { icon: null, label: 'Apostar', href: '/loterias' }, // Center button
  { icon: Wallet, label: 'Carteira', href: '/recarga-pix' },
  { icon: User, label: 'Perfil', href: '/perfil' },
];

export function EliteBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-zinc-800/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-md mx-auto flex items-end justify-around px-2 pt-1 pb-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isCenter = item.icon === null;

          if (isCenter) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center -mt-5"
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform border-4 border-[#0a0a0a]">
                  <Plus className="h-7 w-7 text-white" strokeWidth={3} />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-1">{item.label}</span>
              </Link>
            );
          }

          const Icon = item.icon!;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center py-2 px-3 min-w-[56px]"
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive ? 'text-emerald-400' : 'text-zinc-500'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold mt-1 transition-colors',
                  isActive ? 'text-emerald-400' : 'text-zinc-500'
                )}
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
