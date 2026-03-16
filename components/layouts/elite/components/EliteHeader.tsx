'use client';

import { usePlatformConfig } from '@/contexts/platform-config-context';
import { User } from 'lucide-react';
import Link from 'next/link';

interface EliteHeaderProps {
  saldo: number;
}

export function EliteHeader({ saldo }: EliteHeaderProps) {
  const { site_name, logo_url } = usePlatformConfig();

  return (
    <header className="px-5 pt-safe pt-4 pb-2">
      {/* Top row: Logo + Name | Profile */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          {logo_url ? (
            <img src={logo_url} alt={site_name} className="h-9 w-9 rounded-xl object-contain" />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-base font-black text-emerald-400">{site_name.charAt(0)}</span>
            </div>
          )}
          <span className="text-base font-bold text-white tracking-tight">{site_name}</span>
        </div>
        <Link
          href="/perfil"
          className="h-9 w-9 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center active:scale-95 transition-transform"
        >
          <User className="h-4 w-4 text-zinc-400" />
        </Link>
      </div>

      {/* Balance row */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
        <span className="text-xs text-zinc-500 font-medium">Saldo disponível</span>
        <span className="text-base font-bold text-emerald-400">
          R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </header>
  );
}
