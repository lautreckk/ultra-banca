'use client';

import { useBingoStore } from '@/stores/bingo-store';

interface NumberDisplayProps {
  currentNumber: number | null;
  drawIndex: number;
}

// Cada bola com cor unica baseada no numero
function getBallGradient(n: number): string {
  const colors: Record<number, string> = {
    0: 'from-green-300 via-green-500 to-green-800',
    1: 'from-blue-300 via-blue-500 to-blue-800',
    2: 'from-rose-300 via-rose-500 to-rose-800',
    3: 'from-amber-300 via-amber-500 to-amber-700',
    4: 'from-purple-300 via-purple-500 to-purple-800',
    5: 'from-cyan-300 via-cyan-500 to-cyan-800',
    6: 'from-red-300 via-red-500 to-red-800',
    7: 'from-indigo-300 via-indigo-500 to-indigo-800',
    8: 'from-pink-300 via-pink-500 to-pink-700',
    9: 'from-teal-300 via-teal-500 to-teal-800',
  };
  return colors[n % 10] || colors[0];
}

function getBallShadowColor(n: number): string {
  const shadows: Record<number, string> = {
    0: 'rgba(74, 222, 128, 0.4)',
    1: 'rgba(96, 165, 250, 0.4)',
    2: 'rgba(251, 113, 133, 0.4)',
    3: 'rgba(251, 191, 36, 0.4)',
    4: 'rgba(192, 132, 252, 0.4)',
    5: 'rgba(34, 211, 238, 0.4)',
    6: 'rgba(248, 113, 113, 0.4)',
    7: 'rgba(129, 140, 248, 0.4)',
    8: 'rgba(244, 114, 182, 0.4)',
    9: 'rgba(45, 212, 191, 0.4)',
  };
  return shadows[n % 10] || shadows[0];
}

function BingoBall({
  number,
  size = 'lg',
  className = '',
  animated = false,
}: {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}) {
  const gradient = getBallGradient(number);
  const shadowColor = getBallShadowColor(number);

  const sizeConfig = {
    sm: { outer: 'w-10 h-10', inner: 'text-xs', shine: 'top-1 left-2 w-3 h-1.5' },
    md: { outer: 'w-[4.5rem] h-[4.5rem]', inner: 'text-2xl', shine: 'top-2 left-3 w-5 h-3' },
    lg: { outer: 'w-44 h-44', inner: 'text-7xl', shine: 'top-4 left-8 w-12 h-6' },
  };

  const cfg = sizeConfig[size];

  return (
    <div
      className={`
        relative rounded-full bg-gradient-to-br ${gradient} p-[3px]
        ${cfg.outer} ${animated ? 'bingo-ball-entrance main-ball-glow' : ''}
        ${className}
      `}
      style={animated ? { boxShadow: `0 0 30px ${shadowColor}` } : undefined}
    >
      <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden relative">
        {/* Reflexo de luz */}
        <div className={`absolute ${cfg.shine} bg-white/20 rounded-full rotate-[-35deg] blur-sm`} />
        <span className={`${cfg.inner} font-black text-white bingo-gaming-font drop-shadow-2xl relative z-10`}>
          {number}
        </span>
      </div>
    </div>
  );
}

export function NumberDisplay({ currentNumber, drawIndex }: NumberDisplayProps) {
  const drawnNumbers = useBingoStore((s) => s.drawnNumbers);

  // Ultimas 3 bolas antes da atual
  const recentBalls = drawnNumbers.slice(-4, -1).reverse();

  // Historico (ultimas 6 bolas)
  const historyBalls = drawnNumbers.slice(-7, -1).reverse();

  return (
    <section className="flex flex-col items-center gap-5 py-4">
      {/* Area das bolas */}
      <div className="relative flex items-center justify-center" style={{ minHeight: '200px' }}>
        {/* Bola principal */}
        {currentNumber !== null ? (
          <div key={currentNumber} className="relative z-20">
            <BingoBall number={currentNumber} size="lg" animated />
          </div>
        ) : (
          <div className="w-44 h-44 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5">
            <span className="text-4xl text-white/20 animate-pulse bingo-gaming-font">?</span>
          </div>
        )}

        {/* Bola flutuante 1 (canto superior direito) */}
        {recentBalls[0] && (
          <div
            key={`trail-${recentBalls[0]}`}
            className="absolute -top-2 -right-4 z-30 bingo-ball-float-1"
          >
            <BingoBall number={recentBalls[0]} size="md" />
          </div>
        )}

        {/* Bola flutuante 2 (canto inferior esquerdo) */}
        {recentBalls[1] && (
          <div
            key={`trail-${recentBalls[1]}`}
            className="absolute -bottom-1 -left-6 z-30 bingo-ball-float-2"
          >
            <BingoBall number={recentBalls[1]} size="md" />
          </div>
        )}

        {/* Bola flutuante 3 (canto inferior direito, menor) */}
        {recentBalls[2] && (
          <div
            key={`trail-${recentBalls[2]}`}
            className="absolute bottom-4 -right-8 z-10 opacity-60 bingo-ball-float-3"
          >
            <BingoBall number={recentBalls[2]} size="sm" />
          </div>
        )}
      </div>

      {/* Historico em linha */}
      {historyBalls.length > 0 && (
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest mr-1">
            Histórico
          </span>
          <div className="flex gap-2">
            {historyBalls.map((n, i) => (
              <div
                key={n}
                className="w-9 h-9 rounded-full bingo-glass-card flex items-center justify-center text-[11px] font-black text-white/80 border border-white/10"
                style={{ opacity: 1 - i * 0.1 }}
              >
                {n}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de progresso */}
      <div className="flex items-center gap-2 w-full max-w-[260px]">
        <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${(drawIndex / 90) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-white/40 font-bold tabular-nums">{drawIndex}/90</span>
      </div>
    </section>
  );
}
