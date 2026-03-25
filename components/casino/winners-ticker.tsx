'use client';

import { useEffect, useRef } from 'react';

interface FakeWinner {
  name: string;
  game: string;
  amount: number;
  avatar: string;
}

const FAKE_WINNERS: FakeWinner[] = [
  { name: 'FERNANDA', game: 'Fortune Dragon', amount: 9580.20, avatar: 'https://i.pravatar.cc/40?u=fernanda' },
  { name: 'TIAGO', game: 'Aviator', amount: 16432.20, avatar: 'https://i.pravatar.cc/40?u=tiago' },
  { name: 'PATRICIA', game: 'Fortune Rabbit', amount: 51250.00, avatar: 'https://i.pravatar.cc/40?u=patricia' },
  { name: 'JULIAN', game: 'Fortune Tiger', amount: 38900.00, avatar: 'https://i.pravatar.cc/40?u=julian' },
  { name: 'MARCOS', game: 'Gates of Olympus', amount: 22750.50, avatar: 'https://i.pravatar.cc/40?u=marcos' },
  { name: 'CAMILA', game: 'Sweet Bonanza', amount: 15320.00, avatar: 'https://i.pravatar.cc/40?u=camila' },
  { name: 'RAFAEL', game: 'Spaceman', amount: 8940.80, avatar: 'https://i.pravatar.cc/40?u=rafael' },
  { name: 'JULIANA', game: 'Fortune Mouse', amount: 42100.00, avatar: 'https://i.pravatar.cc/40?u=juliana' },
  { name: 'LUCAS', game: 'Big Bass Splash', amount: 19600.30, avatar: 'https://i.pravatar.cc/40?u=lucas' },
  { name: 'AMANDA', game: 'Dog House', amount: 31450.00, avatar: 'https://i.pravatar.cc/40?u=amanda' },
  { name: 'BRUNO', game: 'Mines', amount: 7820.40, avatar: 'https://i.pravatar.cc/40?u=bruno' },
  { name: 'LARISSA', game: 'Fortune Ox', amount: 28300.00, avatar: 'https://i.pravatar.cc/40?u=larissa' },
  { name: 'DIEGO', game: 'Crash', amount: 45600.00, avatar: 'https://i.pravatar.cc/40?u=diego' },
  { name: 'ISABELA', game: 'Plinko', amount: 12890.50, avatar: 'https://i.pravatar.cc/40?u=isabela' },
  { name: 'THIAGO', game: 'Wild West Gold', amount: 55200.00, avatar: 'https://i.pravatar.cc/40?u=thiago2' },
];

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function WinnersTicker() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationId: number;
    let pos = 0;

    function animate() {
      pos += 0.5;
      if (el) {
        const halfWidth = el.scrollWidth / 2;
        if (pos >= halfWidth) pos = 0;
        el.style.transform = `translateX(-${pos}px)`;
      }
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Duplicate for seamless loop
  const items = [...FAKE_WINNERS, ...FAKE_WINNERS];

  return (
    <div
      className="w-full overflow-hidden py-2.5 border-y"
      style={{
        backgroundColor: 'rgba(20, 24, 40, 0.8)',
        borderColor: 'rgba(255, 215, 0, 0.08)',
      }}
    >
      <div ref={scrollRef} className="flex items-center gap-6 whitespace-nowrap will-change-transform">
        {items.map((winner, i) => (
          <div key={i} className="flex items-center gap-2.5 shrink-0">
            <img
              src={winner.avatar}
              alt=""
              className="h-8 w-8 rounded-full object-cover border"
              style={{ borderColor: 'rgba(255, 215, 0, 0.2)' }}
            />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">{winner.name}</span>
              <span className="text-[10px] font-medium" style={{ color: '#7a839a' }}>{winner.game}</span>
            </div>
            <span className="text-xs font-black" style={{ color: '#22C55E' }}>
              {formatBRL(winner.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
