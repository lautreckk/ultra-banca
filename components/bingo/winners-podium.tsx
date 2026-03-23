'use client';

import { formatCurrency } from '@/lib/utils/format-currency';
import type { PhaseWinner } from '@/lib/bingo/phases';

interface WinnersPodiumProps {
  phaseWinners: {
    kuadra: PhaseWinner | null;
    kina: PhaseWinner | null;
    keno: PhaseWinner | null;
  };
  nextGameCountdown: number;
}

function PodiumCard({
  winner,
  label,
  color,
  size,
}: {
  winner: PhaseWinner | null;
  label: string;
  color: string;
  size: 'sm' | 'lg';
}) {
  if (!winner) return null;

  return (
    <div className={`flex flex-col items-center ${size === 'lg' ? 'order-2' : size === 'sm' ? '' : ''}`}>
      {/* Label */}
      <h3 className={`text-sm font-black bingo-gaming-font tracking-wider mb-2 ${color}`}>
        {label}
      </h3>

      {/* Card */}
      <div className={`
        bg-gradient-to-b from-yellow-400/20 to-yellow-600/10
        border border-yellow-500/30 rounded-2xl
        ${size === 'lg' ? 'p-5 min-w-[140px]' : 'p-4 min-w-[110px]'}
        text-center
      `}>
        <p className={`font-black text-white ${size === 'lg' ? 'text-base' : 'text-sm'}`}>
          {winner.name}
        </p>
        <p className={`font-black bingo-gaming-font text-yellow-400 mt-1 ${size === 'lg' ? 'text-xl' : 'text-base'}`}>
          {formatCurrency(winner.prize)}
        </p>
      </div>
    </div>
  );
}

export function WinnersPodium({ phaseWinners, nextGameCountdown }: WinnersPodiumProps) {
  return (
    <div className="space-y-5 banner-slide">
      {/* Titulo */}
      <div className="text-center">
        <h2 className="text-2xl font-black bingo-gaming-font text-yellow-400 tracking-wider">
          GANHADORES
        </h2>
      </div>

      {/* Podio: Kuadra | KENO (centro, maior) | Kina */}
      <div className="flex items-end justify-center gap-3">
        <PodiumCard
          winner={phaseWinners.kuadra}
          label="KUADRA"
          color="text-blue-400"
          size="sm"
        />
        <PodiumCard
          winner={phaseWinners.keno}
          label="KENO"
          color="text-yellow-400"
          size="lg"
        />
        <PodiumCard
          winner={phaseWinners.kina}
          label="KINA"
          color="text-purple-400"
          size="sm"
        />
      </div>

      {/* Confetti */}
      <div className="relative h-4 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute confetti-fall"
            style={{
              left: `${(i / 20) * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            <div
              style={{
                width: `${4 + Math.random() * 4}px`,
                height: `${6 + Math.random() * 6}px`,
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444'][i % 5],
                borderRadius: i % 3 === 0 ? '50%' : '2px',
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Proximo jogo */}
      <div className="bingo-glass-card rounded-2xl p-5 text-center">
        <p className="text-sm text-white/40">Proximo jogo em</p>
        <p className="text-3xl font-black bingo-gaming-font text-emerald-400 mt-1">
          {nextGameCountdown}s
        </p>
      </div>
    </div>
  );
}
