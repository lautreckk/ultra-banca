'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';

interface WinnerBannerProps {
  winner: { id: string; name: string; prize: number };
  isCurrentUser: boolean;
}

const CONFETTI_COLORS = [
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4',
];

function ConfettiPiece({ index, total }: { index: number; total: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = (index / total) * 100;
  const delay = Math.random() * 1.5;
  const duration = 2 + Math.random() * 2;
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;
  const isRect = index % 3 !== 0;

  return (
    <div
      className="absolute top-0 confetti-fall"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: isRect ? `${size * 1.5}px` : `${size}px`,
          backgroundColor: color,
          borderRadius: isRect ? '2px' : '50%',
          transform: `rotate(${rotation}deg)`,
        }}
      />
    </div>
  );
}

export function WinnerBanner({ winner, isCurrentUser }: WinnerBannerProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl banner-slide">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-emerald-800/60 to-amber-900/40 border border-emerald-500/30 rounded-2xl" />

      {/* Confetti shower */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {Array.from({ length: 40 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} total={40} />
          ))}
        </div>
      )}

      {/* Pulsing glow */}
      <div className="absolute inset-0 winner-glow rounded-2xl" />

      <div className="relative z-10 p-6 flex flex-col items-center gap-3">
        {/* Trophy with bounce */}
        <div className="winner-trophy">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center ring-2 ring-amber-400/30">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* BINGO text with glow */}
        <span className="text-3xl font-black text-emerald-400 tracking-wider [text-shadow:0_0_20px_rgba(16,185,129,0.5)]">
          BINGO!
        </span>

        {/* Winner name */}
        <span className="text-xl font-bold text-white">
          {winner.name}
        </span>

        {/* Prize amount */}
        <div className="bg-emerald-500/20 px-5 py-2 rounded-xl border border-emerald-400/30">
          <span className="text-2xl font-mono font-bold text-emerald-300">
            {formatCurrency(winner.prize)}
          </span>
        </div>

        {isCurrentUser && (
          <div className="mt-1 px-4 py-1.5 bg-amber-500/20 rounded-full border border-amber-400/30">
            <span className="text-amber-300 font-bold text-sm tracking-wide">
              VOCE GANHOU!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
