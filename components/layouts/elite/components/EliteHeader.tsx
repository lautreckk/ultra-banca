'use client';

import { usePlatformConfig } from '@/contexts/platform-config-context';
import { User } from 'lucide-react';
import Link from 'next/link';

interface EliteHeaderProps {
  saldo: number;
}

export function EliteHeader({ saldo }: EliteHeaderProps) {
  const { logo_url, site_name } = usePlatformConfig();

  return (
    <header className="px-5 pt-safe pt-4 pb-3" style={{ background: 'linear-gradient(180deg, #141828 0%, #0C0E14 100%)' }}>
      {/* Top row: Logo | Saldo + Profile */}
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

        {/* Saldo + Profile */}
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
      </div>
    </header>
  );
}
