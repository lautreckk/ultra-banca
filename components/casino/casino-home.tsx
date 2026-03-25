'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, ArrowLeft, Gamepad2 } from 'lucide-react';
import { GameCard } from './game-card';
import { getGames } from '@/lib/actions/casino';
import type { CasinoGame } from '@/lib/actions/casino';
import { AuthModal } from '@/components/auth/auth-modal';
import { createClient } from '@/lib/supabase/client';

/**
 * CasinoHome — Home page for casino-only platforms (44x.site).
 * Shows game grid immediately, no auth required to browse.
 * Opens AuthModal when user tries to play without being logged in.
 */
export function CasinoHome() {
  const [games, setGames] = useState<CasinoGame[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<{ url: string; name: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadData();
    checkAuth();
  }, []);

  useEffect(() => {
    if (activeGame) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeGame]);

  async function checkAuth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  }

  async function loadData() {
    setLoading(true);
    const result = await getGames();
    if (result.success && result.games) {
      setGames(result.games.filter(g => g.featured));
    }
    setLoading(false);
  }

  async function handleLaunch(gameCode: string, provider: string, original: boolean) {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }

    setLaunchingGame(gameCode);
    const { launchGame } = await import('@/lib/actions/casino');
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

  // Re-check auth after modal closes (user may have logged in)
  function handleAuthModalClose() {
    setAuthModalOpen(false);
    checkAuth();
  }

  const filteredGames = useMemo(() => {
    if (!search.trim()) return games;
    const term = search.toLowerCase();
    return games.filter(g =>
      g.game_name.toLowerCase().includes(term) ||
      g.provider.toLowerCase().includes(term)
    );
  }, [games, search]);

  return (
    <>
      <div className="px-4 py-4 space-y-4">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 rounded-full" style={{ backgroundColor: '#FFD700' }} />
          <Gamepad2 className="h-5 w-5" style={{ color: '#FFD700' }} />
          <h1 className="text-lg font-black text-white italic">CASSINO</h1>
        </div>

        {/* Search */}
        {games.length > 0 && (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquise um jogo..."
              className="w-full h-12 rounded-xl bg-zinc-900/80 border border-zinc-700/40 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all"
            />
          </div>
        )}

        {/* Games Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
            <p className="text-zinc-500 text-sm">
              {search ? 'Nenhum jogo encontrado' : 'Nenhum jogo disponivel'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-sm text-amber-400 hover:text-amber-300"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {filteredGames.map((game) => (
              <GameCard
                key={game.game_code}
                game={game}
                onLaunch={handleLaunch}
                isLaunching={launchingGame === game.game_code}
              />
            ))}
          </div>
        )}
      </div>

      {/* Game iframe overlay */}
      {activeGame && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-white/10 shrink-0">
            <button
              onClick={handleCloseGame}
              className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            <span className="text-white/60 text-sm truncate mx-4">{activeGame.name}</span>
          </div>
          <iframe
            src={activeGame.url}
            className="flex-1 w-full border-0"
            allow="autoplay; fullscreen"
          />
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={handleAuthModalClose}
        defaultTab="cadastro"
      />
    </>
  );
}
