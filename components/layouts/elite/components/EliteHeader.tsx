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
    <header className="flex items-center justify-between px-5 pt-safe pb-3 pt-5">
      {/* Logo + Name */}
      <div className="flex items-center gap-3">
        {logo_url ? (
          <img src={logo_url} alt={site_name} className="h-11 w-11 rounded-xl object-contain" />
        ) : (
          <div className="h-11 w-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-xl font-black text-emerald-400">{site_name.charAt(0)}</span>
          </div>
        )}
        <span className="text-xl font-black text-white tracking-tight">{site_name}</span>
      </div>

      {/* Balance + Profile */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest leading-none font-semibold">Saldo</p>
          <p className="text-xl font-black text-white leading-tight">
            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <Link
          href="/perfil"
          className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform"
        >
          <User className="h-5 w-5 text-emerald-400" />
        </Link>
      </div>
    </header>
  );
}
