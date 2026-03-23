'use client';

import { useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';
import type { PhaseWinner } from '@/lib/bingo/phases';

interface PhaseAnnouncementProps {
  winner: PhaseWinner;
  onDismiss: () => void;
}

const PHASE_CONFIG = {
  kuadra: { label: 'KUADRA', color: 'text-blue-400', bg: 'from-blue-600/30 to-blue-900/30', border: 'border-blue-500/40' },
  kina: { label: 'KINA', color: 'text-purple-400', bg: 'from-purple-600/30 to-purple-900/30', border: 'border-purple-500/40' },
  keno: { label: 'KENO', color: 'text-yellow-400', bg: 'from-yellow-600/30 to-yellow-900/30', border: 'border-yellow-500/40' },
};

export function PhaseAnnouncement({ winner, onDismiss }: PhaseAnnouncementProps) {
  const config = PHASE_CONFIG[winner.phase];

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm phase-announcement-enter">
      <div className={`bg-gradient-to-br ${config.bg} border ${config.border} rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl`}>
        {/* Titulo da fase */}
        <h2 className={`text-4xl font-black bingo-gaming-font ${config.color} tracking-wider mb-4`}>
          {config.label}
        </h2>

        {/* Ganhador */}
        <div className="bingo-glass-card rounded-2xl p-4 mb-3">
          <p className="text-lg font-black text-white">{winner.name}</p>
          <p className="text-2xl font-black bingo-gaming-font text-yellow-400 mt-1">
            {formatCurrency(winner.prize)}
          </p>
        </div>

        <p className="text-xs text-white/40 uppercase tracking-widest">
          O sorteio continua...
        </p>
      </div>
    </div>
  );
}
