'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, ChevronRight, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePlatformConfig } from '@/contexts/platform-config-context';

// Tabela do bicho com emojis
const BICHOS = [
  { grupo: 1, nome: 'Avestruz', emoji: '🦆' },
  { grupo: 2, nome: 'Águia', emoji: '🦅' },
  { grupo: 3, nome: 'Burro', emoji: '🫏' },
  { grupo: 4, nome: 'Borboleta', emoji: '🦋' },
  { grupo: 5, nome: 'Cachorro', emoji: '🐕' },
  { grupo: 6, nome: 'Cabra', emoji: '🐐' },
  { grupo: 7, nome: 'Carneiro', emoji: '🐏' },
  { grupo: 8, nome: 'Camelo', emoji: '🐫' },
  { grupo: 9, nome: 'Cobra', emoji: '🐍' },
  { grupo: 10, nome: 'Coelho', emoji: '🐇' },
  { grupo: 11, nome: 'Cavalo', emoji: '🐴' },
  { grupo: 12, nome: 'Elefante', emoji: '🐘' },
  { grupo: 13, nome: 'Galo', emoji: '🐓' },
  { grupo: 14, nome: 'Gato', emoji: '🐱' },
  { grupo: 15, nome: 'Jacaré', emoji: '🐊' },
  { grupo: 16, nome: 'Leão', emoji: '🦁' },
  { grupo: 17, nome: 'Macaco', emoji: '🐒' },
  { grupo: 18, nome: 'Porco', emoji: '🐷' },
  { grupo: 19, nome: 'Pavão', emoji: '🦚' },
  { grupo: 20, nome: 'Peru', emoji: '🦃' },
  { grupo: 21, nome: 'Touro', emoji: '🐂' },
  { grupo: 22, nome: 'Tigre', emoji: '🐅' },
  { grupo: 23, nome: 'Urso', emoji: '🐻' },
  { grupo: 24, nome: 'Veado', emoji: '🦌' },
  { grupo: 25, nome: 'Vaca', emoji: '🐄' },
];

// Pegar 4 bichos aleatórios para exibir
function getRandomBichos(count: number) {
  const shuffled = [...BICHOS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

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
          {/* Decorative circles */}
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
// ANIMAIS DA SORTE
// ============================================================================
export function EliteAnimaisSection() {
  const [bichos] = useState(() => getRandomBichos(4));

  return (
    <div className="px-5 mt-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-emerald-500" />
          <h2 className="text-lg font-black text-white italic">ANIMAIS DA SORTE</h2>
        </div>
        <Link href="/tabela-bichos" className="text-sm font-semibold text-emerald-400 active:opacity-70">
          Ver Todos
        </Link>
      </div>

      {/* Animal grid */}
      <div className="grid grid-cols-2 gap-3">
        {bichos.map((bicho) => (
          <Link
            key={bicho.grupo}
            href="/loterias"
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/60 active:scale-[0.95] active:bg-zinc-800/50 transition-all"
          >
            <div className="text-5xl animate-pulse" style={{ animationDuration: `${2 + Math.random() * 3}s` }}>
              {bicho.emoji}
            </div>
            <span className="text-sm font-black text-white tracking-wide">{bicho.nome.toUpperCase()}</span>
            <span className="text-[11px] font-bold text-emerald-400/70">
              GRUPO {String(bicho.grupo).padStart(2, '0')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CASSINO AO VIVO
// ============================================================================
export function EliteCassinoSection() {
  return (
    <div className="px-5 mt-6">
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-900/30 border border-zinc-800/60 p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-white italic">CASSINO AO VIVO</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] text-zinc-400 font-medium">INTERAÇÃO REAL EM HD</span>
            </div>
          </div>
          <Link
            href="/cassino"
            className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-black active:scale-95 transition-transform"
          >
            ENTRAR
          </Link>
        </div>

        {/* Game cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/cassino" className="rounded-xl bg-zinc-800/60 border border-zinc-700/40 p-4 text-center active:scale-95 transition-transform">
            <div className="text-3xl mb-2">🎰</div>
            <span className="text-xs font-bold text-white">ROLETA NEON</span>
          </Link>
          <Link href="/cassino" className="rounded-xl bg-zinc-800/60 border border-zinc-700/40 p-4 text-center active:scale-95 transition-transform">
            <div className="text-3xl mb-2">🃏</div>
            <span className="text-xs font-bold text-white">BLACKJACK PRO</span>
          </Link>
        </div>
      </div>
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

    // Realtime
    const channel = supabase
      .channel('elite-winner')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ultimo_ganhador',
      }, () => {
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
// QUICK ACTIONS (Jogos)
// ============================================================================
export function EliteQuickActions() {
  const games = [
    { label: 'Loterias', emoji: '🎲', href: '/loterias' },
    { label: 'Fazendinha', emoji: '🐔', href: '/fazendinha' },
    { label: 'Quininha', emoji: '🎯', href: '/quininha' },
    { label: 'Seninha', emoji: '🔢', href: '/seninha' },
    { label: 'Resultados', emoji: '📊', href: '/resultados' },
    { label: 'Cotações', emoji: '💰', href: '/relatorios/cotacoes' },
  ];

  return (
    <div className="px-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full bg-amber-500" />
        <h2 className="text-lg font-black text-white italic">JOGOS</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {games.map((game) => (
          <Link
            key={game.label}
            href={game.href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/60 active:scale-[0.93] active:bg-zinc-800/50 transition-all"
          >
            <span className="text-2xl">{game.emoji}</span>
            <span className="text-[11px] font-bold text-zinc-300">{game.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
