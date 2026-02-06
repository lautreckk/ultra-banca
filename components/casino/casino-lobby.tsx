'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { GameCard } from './game-card';
import { getGames, getProviders, launchGame } from '@/lib/actions/casino';
import type { CasinoGame } from '@/lib/actions/casino';

export function CasinoLobby() {
  const [games, setGames] = useState<CasinoGame[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
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
    const [gamesResult, providersResult] = await Promise.all([
      getGames(),
      getProviders(),
    ]);

    if (gamesResult.success && gamesResult.games) {
      setGames(gamesResult.games);
    }
    if (providersResult.success && providersResult.providers) {
      setProviders(providersResult.providers);
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

  const featuredGames = useMemo(() => {
    return games.filter(g => g.featured);
  }, [games]);

  const filteredGames = useMemo(() => {
    let result = games;

    if (selectedProvider) {
      result = result.filter(g => g.provider === selectedProvider);
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(g =>
        g.game_name.toLowerCase().includes(term) ||
        g.provider.toLowerCase().includes(term)
      );
    }

    return result;
  }, [games, selectedProvider, search]);

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
          {/* Close button */}
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={handleCloseGame}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors shadow-lg"
            >
              <X className="h-5 w-5 text-white" />
              <span className="text-white text-sm font-medium">Fechar</span>
            </button>
          </div>
          {/* iframe */}
          <iframe
            src={activeGame.url}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; clipboard-write"
            allowFullScreen
          />
        </div>
      )}

      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar jogos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/10 border border-white/20 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-400 outline-none transition-colors focus:border-white/40 focus:bg-white/15"
          />
        </div>

        {/* Provider Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedProvider('')}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0 ${
              !selectedProvider
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20'
            }`}
          >
            Todos
          </button>
          {providers.map((prov) => (
            <button
              key={prov}
              onClick={() => setSelectedProvider(prov)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0 ${
                selectedProvider === prov
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20'
              }`}
            >
              {prov}
            </button>
          ))}
        </div>

        {/* Featured Games */}
        {featuredGames.length > 0 && !selectedProvider && !search && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">
              Populares
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {featuredGames.map((game) => (
                <GameCard
                  key={`featured-${game.game_code}-${game.provider}`}
                  game={game}
                  onLaunch={handleLaunch}
                  isLaunching={launchingGame === game.game_code}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Games Grid */}
        {filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-gray-400">
              Nenhum jogo encontrado
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-sm underline text-green-400"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {featuredGames.length > 0 && !selectedProvider && !search && (
              <h2 className="text-lg font-bold text-white">
                Todos os Jogos
              </h2>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
              {filteredGames.map((game) => (
                <GameCard
                  key={`${game.game_code}-${game.provider}`}
                  game={game}
                  onLaunch={handleLaunch}
                  isLaunching={launchingGame === game.game_code}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        <p className="text-center text-xs py-2 text-gray-500">
          {filteredGames.length} jogos
        </p>
      </div>
    </>
  );
}
