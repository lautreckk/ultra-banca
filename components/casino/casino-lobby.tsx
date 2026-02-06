'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    loadData();
  }, []);

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
      window.open(result.launch_url, '_blank');
    } else {
      alert(result.error || 'Erro ao abrir jogo');
    }
    setLaunchingGame(null);
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
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Buscar jogos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:ring-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      {/* Provider Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedProvider('')}
          className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0"
          style={{
            backgroundColor: !selectedProvider ? 'var(--color-primary)' : 'var(--color-surface)',
            color: !selectedProvider ? 'white' : 'var(--color-text-muted)',
            borderWidth: '1px',
            borderColor: !selectedProvider ? 'transparent' : 'var(--color-border)',
          }}
        >
          Todos
        </button>
        {providers.map((prov) => (
          <button
            key={prov}
            onClick={() => setSelectedProvider(prov)}
            className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0"
            style={{
              backgroundColor: selectedProvider === prov ? 'var(--color-primary)' : 'var(--color-surface)',
              color: selectedProvider === prov ? 'white' : 'var(--color-text-muted)',
              borderWidth: '1px',
              borderColor: selectedProvider === prov ? 'transparent' : 'var(--color-border)',
            }}
          >
            {prov}
          </button>
        ))}
      </div>

      {/* Featured Games */}
      {featuredGames.length > 0 && !selectedProvider && !search && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
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
          <p className="text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Nenhum jogo encontrado
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-2 text-sm underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {featuredGames.length > 0 && !selectedProvider && !search && (
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
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
      <p className="text-center text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>
        {filteredGames.length} jogos
      </p>
    </div>
  );
}
