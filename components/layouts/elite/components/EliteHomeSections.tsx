'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QrCode, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePlatformConfig } from '@/contexts/platform-config-context';

// ============================================================================
// RECARGA PIX BUTTON
// ============================================================================
export function ElitePixButton() {
  return (
    <Link href="/recarga-pix" className="block px-5 mt-3">
      <div
        className="flex items-center justify-center gap-3 h-14 rounded-2xl font-black text-base tracking-wide shadow-lg active:scale-[0.97] transition-transform"
        style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
          color: '#1a1a0a',
          boxShadow: '0 4px 20px rgba(255, 215, 0, 0.25)',
        }}
      >
        <QrCode className="h-6 w-6" strokeWidth={2.5} />
        RECARGA PIX IMEDIATA
      </div>
    </Link>
  );
}

// ============================================================================
// PROMO CAROUSEL (3 banners, auto-slide a cada 3s)
// ============================================================================
const PROMO_SLIDES = [
  {
    gradient: 'linear-gradient(135deg, #1a3a1a 0%, #0d200d 50%, #2a1a0a 100%)',
    badge: 'Promoção',
    badgeStyle: { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700' },
    title: 'GANHE 100%\nNO PRIMEIRO PIX',
    cta: 'APROVEITAR',
    href: '/recarga-pix',
  },
  {
    gradient: 'linear-gradient(135deg, #2a1a0a 0%, #1a0d00 50%, #1a2a0a 100%)',
    badge: 'Especial',
    badgeStyle: { backgroundColor: 'rgba(255,165,0,0.15)', borderColor: 'rgba(255,165,0,0.3)', color: '#FFA500' },
    title: 'INDIQUE AMIGOS\nE GANHE BÔNUS',
    cta: 'INDICAR',
    href: '/amigos',
  },
  {
    gradient: 'linear-gradient(135deg, #0d2a0d 0%, #1a3a1a 50%, #0d150d 100%)',
    badge: 'Novo',
    badgeStyle: { backgroundColor: 'rgba(50,205,50,0.15)', borderColor: 'rgba(50,205,50,0.3)', color: '#32CD32' },
    title: 'APOSTE E\nGANHE PRÊMIOS',
    cta: 'APOSTAR',
    href: '/loterias',
  },
];

export function ElitePromoCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % PROMO_SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 3000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = PROMO_SLIDES[current];

  return (
    <div className="px-5 mt-5">
      <Link href={slide.href} className="block">
        <div
          className="relative overflow-hidden rounded-2xl p-6 min-h-[150px] active:scale-[0.98] transition-all duration-500 border"
          style={{ background: slide.gradient, borderColor: 'rgba(255, 215, 0, 0.1)' }}
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full" style={{ backgroundColor: 'rgba(255,215,0,0.04)' }} />
          <div className="absolute -right-4 bottom-0 h-24 w-24 rounded-full" style={{ backgroundColor: 'rgba(255,215,0,0.04)' }} />

          <span
            className="inline-block px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-3"
            style={slide.badgeStyle}
          >
            {slide.badge}
          </span>
          <h3 className="text-2xl font-black text-white leading-tight whitespace-pre-line">
            {slide.title}
          </h3>
          <div
            className="mt-3 inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #FFD700, #DAA520)', color: '#1a1a0a' }}
          >
            {slide.cta}
          </div>
        </div>
      </Link>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {PROMO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === current ? '24px' : '6px',
              backgroundColor: i === current ? '#FFD700' : '#2a3a2a',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// JOGOS (Grid 2x2 alinhado + Cassino banner)
// ============================================================================
export function EliteJogosSection() {
  return (
    <div className="px-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: '#FFD700' }} />
        <h2 className="text-lg font-black text-white italic">JOGOS</h2>
      </div>

      {/* Grid 2x2 - todos alinhados */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/loterias"
          className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.95] transition-transform"
        >
          <div className="relative aspect-square">
            <Image
              src="/images/elite-jb.webp"
              alt="Jogo do Bicho"
              fill
              className="object-cover rounded-2xl"
              priority
            />
          </div>
        </Link>

        <Link
          href="/loterias"
          className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.95] transition-transform"
        >
          <div className="relative aspect-square">
            <Image
              src="/images/elite-loterias.webp"
              alt="Loterias"
              fill
              className="object-cover rounded-2xl"
              priority
            />
          </div>
        </Link>

        <Link
          href="/fazendinha"
          className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.95] transition-transform"
        >
          <div className="relative aspect-square">
            <Image
              src="/images/fazendinha-banner.webp"
              alt="Fazendinha"
              fill
              className="object-cover rounded-2xl"
            />
          </div>
        </Link>

        <Link
          href="#"
          className="relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.95] transition-transform"
        >
          <div className="relative aspect-square">
            <Image
              src="/images/elite-bingo.webp"
              alt="Bingo"
              fill
              className="object-cover rounded-2xl"
            />
          </div>
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/90 text-[9px] font-bold text-black">
            EM BREVE
          </div>
        </Link>
      </div>

      {/* Cassino - banner full width */}
      <Link
        href="/cassino"
        className="block mt-3 relative overflow-hidden rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
      >
        <Image
          src="/images/elite-casino.webp"
          alt="Cassino Online"
          width={1200}
          height={600}
          className="w-full h-auto object-cover rounded-2xl"
          priority
        />
      </Link>
    </div>
  );
}

// ============================================================================
// GRUPO DE PALPITES (imagem nova)
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
        <Image
          src="/images/elite-palpites.webp"
          alt="Palpites ao Vivo"
          width={1200}
          height={600}
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
        setWinner({ nome: data.nome || 'Jogador', valor: Number(data.valor) || 0, unidade: data.unidade || '' });
      }
    };

    fetchWinner();

    const channel = supabase
      .channel('elite-winner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ultimo_ganhador' }, () => fetchWinner())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [config]);

  if (!winner || winner.valor === 0) return null;

  return (
    <div className="px-5 mt-4">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)' }}>
        <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-amber-300 font-semibold truncate flex-1">
          <span className="text-amber-400">{winner.nome}</span> ganhou{' '}
          <span className="text-amber-400 font-black">R$ {winner.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// QUICK ACTIONS
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
            className="flex flex-col items-center gap-1.5 py-3 rounded-2xl active:scale-[0.93] transition-all"
            style={{ backgroundColor: '#131f13', border: '1px solid rgba(255,215,0,0.1)' }}
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-[10px] font-bold" style={{ color: '#8a9a7a' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
