'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QrCode, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePlatformConfig } from '@/contexts/platform-config-context';

// ============================================================================
// RECARGA PIX BUTTON
// ============================================================================
export function ElitePixButton() {
  return (
    <Link href="/recarga-pix" className="block px-5 mt-2">
      <div className="flex items-center justify-center gap-3 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black text-base tracking-wide shadow-lg shadow-emerald-500/25 active:scale-[0.97] transition-transform">
        <QrCode className="h-6 w-6" strokeWidth={2.5} />
        RECARGA PIX IMEDIATA
      </div>
    </Link>
  );
}

// ============================================================================
// PROMO BANNER
// ============================================================================
export function ElitePromoBanner() {
  return (
    <div className="px-5 mt-5">
      <Link href="/recarga-pix" className="block">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/80 via-purple-700/60 to-indigo-800/80 p-6 min-h-[160px] active:scale-[0.98] transition-transform">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -right-4 bottom-0 h-24 w-24 rounded-full bg-white/5" />

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-3">
            Promoção
          </span>
          <h3 className="text-2xl font-black text-white leading-tight">
            GANHE 100%<br />NO PRIMEIRO PIX
          </h3>
          <div className="mt-3 inline-flex items-center gap-1 px-4 py-2 rounded-full bg-white text-black text-sm font-bold">
            APROVEITAR
          </div>
        </div>
      </Link>
    </div>
  );
}

// ============================================================================
// JOGOS (com imagens existentes)
// ============================================================================
export function EliteJogosSection() {
  return (
    <div className="px-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full bg-emerald-500" />
        <h2 className="text-lg font-black text-white italic">JOGOS</h2>
      </div>

      {/* Grid 2x2 - Loterias e Fazendinha */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/loterias"
          className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.95] transition-transform"
        >
          <div className="relative aspect-[4/3]">
            <Image
              src="/images/loterias-banner.webp"
              alt="Loterias"
              fill
              className="object-cover object-top scale-105"
              priority
            />
          </div>
        </Link>

        <Link
          href="/fazendinha"
          className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.95] transition-transform"
        >
          <div className="relative aspect-[4/3]">
            <Image
              src="/images/fazendinha-banner.webp"
              alt="Fazendinha"
              fill
              className="object-cover"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Grid 3 - Quininha, Seninha, Lotinha */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <Link
          href="/quininha"
          className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.95] transition-transform"
        >
          <div className="relative aspect-square">
            <Image
              src="/images/QUININHA.webp"
              alt="Quininha"
              fill
              className="object-cover"
            />
          </div>
        </Link>

        <Link
          href="/seninha"
          className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.95] transition-transform"
        >
          <div className="relative aspect-square">
            <Image
              src="/images/SENINHA.webp"
              alt="Seninha"
              fill
              className="object-cover"
            />
          </div>
        </Link>

        <Link
          href="/lotinha"
          className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.95] transition-transform"
        >
          <div className="relative aspect-square">
            <Image
              src="/images/LOTINHA.webp"
              alt="Lotinha"
              fill
              className="object-cover"
            />
          </div>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// CASSINO AO VIVO (com banner existente)
// ============================================================================
export function EliteCassinoSection() {
  return (
    <div className="px-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full bg-purple-500" />
        <h2 className="text-lg font-black text-white italic">CASSINO AO VIVO</h2>
        <span className="flex items-center gap-1 ml-auto">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-zinc-400 font-semibold">AO VIVO</span>
        </span>
      </div>

      <Link href="/cassino" className="block">
        <div className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.98] transition-transform">
          <Image
            src="/images/cassino-banner.webp"
            alt="Cassino Online"
            width={2700}
            height={910}
            className="w-full h-auto object-cover rounded-2xl"
            priority
          />
        </div>
      </Link>
    </div>
  );
}

// ============================================================================
// GRUPO DE PALPITES (reutiliza WPP.webp)
// ============================================================================
interface EliteGrupoPalpitesProps {
  onOpen: () => void;
}

export function EliteGrupoPalpites({ onOpen }: EliteGrupoPalpitesProps) {
  return (
    <div className="px-5 mt-6">
      <button
        onClick={onOpen}
        className="w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-transform shadow-lg"
      >
        <img
          src="/WPP.webp"
          alt="Grupo de Palpites ao Vivo"
          className="w-full h-auto object-cover"
        />
      </button>
    </div>
  );
}

// ============================================================================
// WINNERS TICKER
// ============================================================================
export function EliteWinnersTicker() {
  const [winner, setWinner] = useState<{ nome: string; valor: number; unidade: string } | null>(null);
  const config = usePlatformConfig();

  useEffect(() => {
    const supabase = createClient();

    const fetchWinner = async () => {
      const platformId = document.cookie.split('; ').find(row => row.startsWith('platform_id='))?.split('=')[1];
      if (!platformId) return;

      const { data } = await supabase
        .from('ultimo_ganhador')
        .select('*')
        .eq('platform_id', platformId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setWinner({
          nome: data.nome || 'Jogador',
          valor: Number(data.valor) || 0,
          unidade: data.unidade || '',
        });
      }
    };

    fetchWinner();

    const channel = supabase
      .channel('elite-winner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ultimo_ganhador' }, () => {
        fetchWinner();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [config]);

  if (!winner || winner.valor === 0) return null;

  return (
    <div className="px-5 mt-4">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 overflow-hidden">
        <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
        <div className="flex-1 overflow-hidden">
          <p className="text-xs text-amber-300 font-semibold truncate">
            <span className="text-amber-400">{winner.nome}</span> ganhou{' '}
            <span className="text-amber-400 font-black">R$ {winner.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            {winner.unidade ? ` na unidade ${winner.unidade}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// QUICK ACTIONS (Suporte, Cotações, Indique, Resultados)
// ============================================================================
export function EliteQuickActions() {
  return (
    <div className="px-5 mt-6">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Resultados', emoji: '📊', href: '/resultados' },
          { label: 'Cotações', emoji: '💰', href: '/relatorios/cotacoes' },
          { label: 'Indique', emoji: '🤝', href: '/amigos' },
          { label: 'Saques', emoji: '💸', href: '/saques' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/60 active:scale-[0.93] transition-all"
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-[10px] font-bold text-zinc-400">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
