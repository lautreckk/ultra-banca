'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
    >
      <div className="w-full overflow-hidden rounded-xl">
        {game.image_url && !imgError ? (
          <img
            src={game.image_url}
            alt={game.game_name}
            className="w-full h-auto transition-transform duration-300 group-hover:scale-110"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="flex aspect-square w-full items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <span className="text-3xl font-bold text-white/80">
              {game.game_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isLaunching && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </button>
  );
}
