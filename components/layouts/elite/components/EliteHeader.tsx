'use client';

import { useState } from 'react';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { LogIn, User, Home, Gamepad2, Wallet, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthModal } from '@/components/auth/auth-modal';

interface EliteHeaderProps {
  saldo: number;
  isLoggedIn?: boolean;
}

const DESKTOP_NAV = [
  { icon: Home, label: 'Início', href: '/home' },
  { icon: Gamepad2, label: 'Cassino', href: '/cassino' },
  { icon: Wallet, label: 'Depositar', href: '/recarga-pix' },
  { icon: DollarSign, label: 'Saques', href: '/saques' },
];

export function EliteHeader({ saldo, isLoggedIn = true }: EliteHeaderProps) {
  const { logo_url, site_name, casino_only } = usePlatformConfig();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'cadastro'>('login');
  const pathname = usePathname();

  const showAuthButtons = casino_only && !isLoggedIn;

  return (
    <>
      <header className="px-5 lg:px-8 pt-safe pt-4 pb-3" style={{ background: 'linear-gradient(180deg, #141828 0%, #0C0E14 100%)' }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/home" className="flex-shrink-0">
            {logo_url ? (
              <img src={logo_url} alt={site_name} className="h-16 lg:h-14 w-auto object-contain drop-shadow-lg" />
            ) : (
              <div className="h-12 px-5 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <span className="text-xl font-black text-amber-400 tracking-wider">{site_name}</span>
              </div>
            )}
          </Link>

          {/* Desktop nav links — hidden on mobile */}
          {casino_only && isLoggedIn && (
            <nav className="hidden lg:flex items-center gap-1">
              {DESKTOP_NAV.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      color: isActive ? '#FFD700' : '#7a839a',
                      backgroundColor: isActive ? 'rgba(255, 215, 0, 0.08)' : 'transparent',
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Saldo box */}
            <div className="px-3 lg:px-4 py-2 rounded-xl border border-amber-500/20" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
              <p className="text-[9px] text-amber-400/60 uppercase tracking-widest leading-none font-semibold mb-0.5">Saldo</p>
              <p className="text-sm lg:text-base font-black text-amber-400 leading-tight">
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {showAuthButtons ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setAuthTab('login'); setAuthModalOpen(true); }}
                  className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={() => { setAuthTab('cadastro'); setAuthModalOpen(true); }}
                  className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-bold text-black active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)' }}
                >
                  Cadastre-se
                </button>
              </div>
            ) : (
              <Link
                href="/perfil"
                className="h-10 w-10 rounded-full border border-amber-500/25 flex items-center justify-center active:scale-95 transition-transform"
                style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
              >
                <User className="h-4 w-4 text-amber-400/70" />
              </Link>
            )}
          </div>
        </div>

        {/* CTA banner — only mobile, only unauthenticated */}
        {showAuthButtons && (
          <button
            onClick={() => { setAuthTab('cadastro'); setAuthModalOpen(true); }}
            className="mt-3 w-full lg:hidden py-3 rounded-xl text-sm font-black text-black tracking-wide active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)' }}
          >
            CADASTRE-SE E GANHE BÔNUS
          </button>
        )}
      </header>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
}
