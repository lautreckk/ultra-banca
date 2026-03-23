'use client';

interface DrawnNumbersProps {
  drawnNumbers: Set<number>;
  cartelaNumbers: Set<number>;
}

function getMiniColor(n: number) {
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

export function DrawnNumbers({ drawnNumbers, cartelaNumbers }: DrawnNumbersProps) {
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] text-purple-400 font-black uppercase tracking-[0.15em]">
        Bolas Sorteadas
      </h3>
      <div className="grid grid-cols-10 gap-1.5">
        {numbers.map((n) => {
          const isDrawn = drawnNumbers.has(n);
          const onCartela = cartelaNumbers.has(n);

          if (!isDrawn) {
            return (
              <div
                key={n}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono bg-white/3 text-white/20 border border-white/5"
              >
                {n}
              </div>
            );
          }

          if (onCartela) {
            return (
              <div
                key={n}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br ${getMiniColor(n)} shadow-sm ring-1 ring-white/20 drawn-ball-pop`}
              >
                {n}
              </div>
            );
          }

          return (
            <div
              key={n}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/10 text-white/60 ring-1 ring-white/10 drawn-ball-pop"
            >
              {n}
            </div>
          );
        })}
      </div>
    </div>
  );
}
