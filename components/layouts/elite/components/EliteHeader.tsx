'use client';

import { useState } from 'react';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { AuthModal } from '@/components/auth/auth-modal';

interface EliteHeaderProps {
  saldo: number;
  isLoggedIn?: boolean;
}

export function EliteHeader({ saldo, isLoggedIn = true }: EliteHeaderProps) {
  const { logo_url, site_name, casino_only } = usePlatformConfig();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'cadastro'>('login');

  const showAuthButtons = casino_only && !isLoggedIn;

  return (
    <>
      <header className="px-5 pt-safe pt-4 pb-3" style={{ background: 'linear-gradient(180deg, #141828 0%, #0C0E14 100%)' }}>
        {/* Top row: Logo | Right side */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex-shrink-0">
            {logo_url ? (
              <img src={logo_url} alt={site_name} className="h-20 w-auto object-contain drop-shadow-lg" />
            ) : (
              <div className="h-14 px-5 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <span className="text-2xl font-black text-amber-400 tracking-wider">{site_name}</span>
              </div>
            )}
          </Link>

          {/* Right side: always show saldo + action button */}
          <div className="flex items-center gap-2">
            {/* Saldo box — shows R$0,00 when not logged in */}
            <div className="px-4 py-2 rounded-xl border border-amber-500/20" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
              <p className="text-[9px] text-amber-400/60 uppercase tracking-widest leading-none font-semibold mb-0.5">Saldo</p>
              <p className="text-base font-black text-amber-400 leading-tight">
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {showAuthButtons ? (
              /* Entrar button for unauthenticated */
              <button
                onClick={() => { setAuthTab('login'); setAuthModalOpen(true); }}
                className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-bold text-black active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)' }}
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </button>
            ) : (
              /* Profile button for logged in */
              <Link
                href="/perfil"
                className="h-10 w-10 rounded-full border border-amber-500/25 flex items-center justify-center active:scale-95 transition-transform"
                style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
              >
                <LogIn className="h-4 w-4 text-amber-400/70" />
              </Link>
            )}
          </div>
        </div>

        {/* Cadastre-se banner for unauthenticated */}
        {showAuthButtons && (
          <button
            onClick={() => { setAuthTab('cadastro'); setAuthModalOpen(true); }}
            className="mt-3 w-full py-3 rounded-xl text-sm font-black text-black tracking-wide active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)' }}
          >
            CADASTRE-SE E GANHE BÔNUS
          </button>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
}
