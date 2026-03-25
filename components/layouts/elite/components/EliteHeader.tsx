'use client';

import { useState } from 'react';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { User } from 'lucide-react';
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
        {/* Top row: Logo | Saldo + Profile OR Auth Buttons */}
        <div className="flex items-center justify-between">
          {/* Logo grande */}
          <Link href="/home" className="flex-shrink-0">
            {logo_url ? (
              <img src={logo_url} alt={site_name} className="h-20 w-auto object-contain drop-shadow-lg" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <span className="text-2xl font-black text-amber-400">{site_name.charAt(0)}</span>
              </div>
            )}
          </Link>

          {showAuthButtons ? (
            /* Auth Buttons for casino-only unauthenticated users */
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setAuthTab('login'); setAuthModalOpen(true); }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => { setAuthTab('cadastro'); setAuthModalOpen(true); }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-black transition-colors active:scale-95"
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)' }}
              >
                Cadastre-se
              </button>
            </div>
          ) : (
            /* Saldo + Profile for logged in users */
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl border border-amber-500/20" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                <p className="text-[9px] text-amber-400/60 uppercase tracking-widest leading-none font-semibold mb-0.5">Saldo</p>
                <p className="text-base font-black text-amber-400 leading-tight">
                  R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Link
                href="/perfil"
                className="h-10 w-10 rounded-full border border-amber-500/25 flex items-center justify-center active:scale-95 transition-transform"
                style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
              >
                <User className="h-4 w-4 text-amber-400/70" />
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthButtons && (
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultTab={authTab}
        />
      )}
    </>
  );
}
