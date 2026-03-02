'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { GameCard } from './game-card';
import { getGames, launchGame } from '@/lib/actions/casino';
import type { CasinoGame } from '@/lib/actions/casino';
import { usePlatformConfig } from '@/contexts/platform-config-context';

export function CasinoLobby() {
  const config = usePlatformConfig();
  const [games, setGames] = useState<CasinoGame[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeGame) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeGame]);

  async function loadData() {
    setLoading(true);
    const result = await getGames();
    if (result.success && result.games) {
      // Only show featured games
      setGames(result.games.filter(g => g.featured));
    }
    setLoading(false);
  }

  async function handleLaunch(gameCode: string, provider: string, original: boolean) {
    setLaunchingGame(gameCode);
    const result = await launchGame(gameCode, provider, original);
    if (result.success && result.launch_url) {
      const game = games.find(g => g.game_code === gameCode);
      setActiveGame({ url: result.launch_url, name: game?.game_name || 'Jogo' });
    } else {
      alert(result.error || 'Erro ao abrir jogo');
    }
    setLaunchingGame(null);
  }

  function handleCloseGame() {
    setActiveGame(null);
  }

  const filteredGames = useMemo(() => {
    if (!search.trim()) return games;
    const term = search.toLowerCase();
    return games.filter(g =>
      g.game_name.toLowerCase().includes(term) ||
      g.provider.toLowerCase().includes(term)
    );
  }, [games, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <>
      {/* Game iframe overlay */}
      {activeGame && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-white/10 shrink-0">
            <button
              onClick={handleCloseGame}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">Voltar</span>
            </button>
            {config.logo_url ? (
              <Image
                src={config.logo_url}
                alt={config.site_name || 'Logo'}
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-white text-sm font-bold">{config.site_name}</span>
            )}
            <div className="w-[88px]" />
          </div>
          <iframe
            src={activeGame.url}
            className="w-full flex-1 border-0"
            allow="autoplay; fullscreen; clipboard-write"
            allowFullScreen
          />
        </div>
      )}

      <div className="space-y-4">
        {/* Search Bar */}
        {games.length > 6 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar jogos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 min-h-[48px] rounded-xl bg-zinc-900/80 border border-zinc-700/40 pl-10 pr-4 text-base text-white placeholder-zinc-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        )}

        {/* Games Grid */}
        {filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-zinc-500">
              Nenhum jogo encontrado
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-sm underline text-green-400 active:scale-[0.98] transition-all"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredGames.map((game) => (
              <GameCard
                key={`${game.game_code}-${game.provider}`}
                game={game}
                onLaunch={handleLaunch}
                isLaunching={launchingGame === game.game_code}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
