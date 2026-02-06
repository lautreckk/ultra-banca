'use client';

import { useState } from 'react';
import type { CasinoGame } from '@/lib/actions/casino';

interface GameCardProps {
  game: CasinoGame;
  onLaunch: (gameCode: string, provider: string, original: boolean) => void;
  isLaunching: boolean;
}

export function GameCard({ game, onLaunch, isLaunching }: GameCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onLaunch(game.game_code, game.provider, game.original)}
      disabled={isLaunching}
      className="group relative overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        {game.image_url && !imgError ? (
          <img
            src={game.image_url}
            alt={game.game_name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: 'var(--modern-gradient-primary, linear-gradient(135deg, #6366f1, #8b5cf6))' }}
          >
            <span className="text-3xl font-bold text-white/80">
              {game.game_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="p-2">
        <p
          className="truncate text-sm font-medium"
          style={{ color: 'var(--color-text)' }}
        >
          {game.game_name}
        </p>
        <p
          className="truncate text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {game.provider}
        </p>
      </div>
    </button>
  );
}
