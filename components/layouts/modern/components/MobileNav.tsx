'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Dices, Trophy, Wallet, Menu } from 'lucide-react';

interface MobileNavProps {
  onMenuClick: () => void;
}

const NAV_ITEMS = [
  { icon: Home, label: 'Inicio', href: '/home' },
  { icon: Dices, label: 'Apostar', href: '/loterias' },
  { icon: Trophy, label: 'Resultados', href: '/resultados' },
  { icon: Wallet, label: 'Depositar', href: '/recarga-pix' },
];

export function MobileNav({ onMenuClick }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t md:hidden"
      style={{
        zIndex: 50,
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors"
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
