'use client';

import type { BingoCartela } from '@/lib/bingo/types';

interface CartelaProps {
  cartela: BingoCartela;
  interactive: boolean;
  drawnNumbers: Set<number>;
  markedNumbers: Set<number>;
  onMark: (n: number) => void;
}

function getMarkedGradient(n: number) {
  const colors: Record<number, string> = {
    0: 'from-green-400 to-green-600',
    1: 'from-blue-400 to-blue-600',
    2: 'from-rose-400 to-rose-600',
    3: 'from-amber-400 to-amber-600',
    4: 'from-purple-400 to-purple-600',
    5: 'from-cyan-400 to-cyan-600',
    6: 'from-red-400 to-red-600',
    7: 'from-indigo-400 to-indigo-600',
    8: 'from-pink-400 to-pink-600',
    9: 'from-teal-400 to-teal-600',
  };
  return colors[n % 10] || colors[0];
}

export function Cartela({ cartela, interactive, drawnNumbers, markedNumbers, onMark }: CartelaProps) {
  return (
    <section className="w-full bingo-glass-card rounded-[2rem] p-4 border-t border-white/10 shadow-2xl relative overflow-hidden">
      {/* Detalhe decorativo */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
          Minha Cartela
        </h3>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">
            Ativa
          </span>
        </div>
      </div>

      <div className={`grid grid-cols-9 gap-1.5 ${!interactive ? 'pointer-events-none' : ''}`}>
        {cartela.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (cell === null) {
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="aspect-square rounded-xl bg-white/3"
                />
              );
            }

            const isMarked = markedNumbers.has(cell);
            const isDrawn = drawnNumbers.has(cell);
            const canMark = isDrawn && !isMarked;

            // Marcado corretamente = bola colorida
            if (isMarked && isDrawn) {
              return (
                <button
                  key={`${rowIdx}-${colIdx}`}
                  onClick={() => interactive && onMark(cell)}
                  className={`aspect-square rounded-xl bg-gradient-to-br ${getMarkedGradient(cell)} shadow-[0_4px_12px_rgba(74,222,128,0.2)] flex items-center justify-center text-sm font-black text-black ring-1 ring-white/30 cell-mark-pop`}
                >
                  {cell}
                </button>
              );
            }

            // Disponivel para marcar = pulse verde
            if (canMark && interactive) {
              return (
                <button
                  key={`${rowIdx}-${colIdx}`}
                  onClick={() => onMark(cell)}
                  className="aspect-square rounded-xl flex items-center justify-center text-sm font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 cartela-available active:scale-90 transition-transform"
                >
                  {cell}
                </button>
              );
            }

            // Marcado mas nao sorteado
            if (isMarked && !isDrawn) {
              return (
                <button
                  key={`${rowIdx}-${colIdx}`}
                  onClick={() => interactive && onMark(cell)}
                  className="aspect-square rounded-xl flex items-center justify-center text-sm font-mono text-white/40 bg-white/5 border border-white/5"
                >
                  {cell}
                </button>
              );
            }

            // Default: nao marcado
            return (
              <button
                key={`${rowIdx}-${colIdx}`}
                onClick={() => interactive && onMark(cell)}
                className="aspect-square rounded-xl bingo-cell-inner border border-white/5 flex items-center justify-center text-sm font-bold text-white/70 hover:bg-white/10 active:scale-95 transition-all"
              >
                {cell}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
