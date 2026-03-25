'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, ArrowLeft, Gamepad2, Flame, Star, Zap } from 'lucide-react';
import { GameCard } from './game-card';
import { getGames } from '@/lib/actions/casino';
import type { CasinoGame } from '@/lib/actions/casino';
import { AuthModal } from '@/components/auth/auth-modal';
import { WinnersTicker } from './winners-ticker';
import { createClient } from '@/lib/supabase/client';

/**
 * CasinoHome — Home page for casino-only platforms (44x.site).
 * Elite design (dark navy + gold). Responsive for mobile AND desktop.
 * Shows game grid immediately, no auth required to browse.
 */
export function CasinoHome() {
  const [games, setGames] = useState<CasinoGame[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<{ url: string; name: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
    checkAuth().then((loggedIn) => {
      // Auto-show auth modal for non-logged users after games load
      if (!loggedIn) {
        const timer = setTimeout(() => setAuthModalOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  useEffect(() => {
    if (activeGame) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeGame]);

  async function checkAuth(): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const loggedIn = !!user;
    setIsLoggedIn(loggedIn);
    return loggedIn;
  }

  async function loadData() {
    setLoading(true);
    const result = await getGames();
    if (result.success && result.games) {
      setGames(result.games);
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

  function handleAuthModalClose() {
    setAuthModalOpen(false);
    checkAuth();
  }

  // Get unique providers for categories
  const providers = useMemo(() => {
    const provs = [...new Set(games.map(g => g.provider))].sort();
    return provs;
  }, [games]);

  const featuredGames = useMemo(() => games.filter(g => g.featured), [games]);

  const filteredGames = useMemo(() => {
    let filtered = games;
    if (activeCategory !== 'all' && activeCategory !== 'featured') {
      filtered = filtered.filter(g => g.provider === activeCategory);
    }
    if (activeCategory === 'featured') {
      filtered = filtered.filter(g => g.featured);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(g =>
        g.game_name.toLowerCase().includes(term) ||
        g.provider.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [games, search, activeCategory]);

  const CATEGORIES = [
    { id: 'all', label: 'Todos', icon: Gamepad2 },
    { id: 'featured', label: 'Destaques', icon: Star },
    ...providers.slice(0, 8).map(p => ({ id: p, label: p, icon: Zap })),
  ];

  return (
    <>
      {/* Winners Ticker — full width, outside padding */}
      <WinnersTicker />

      <div className="px-4 py-4 space-y-5">
        {/* Search Bar */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5" style={{ color: '#4a5068' }} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise um jogo..."
            className="w-full h-12 rounded-2xl border pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: '#141828',
              borderColor: 'rgba(255, 215, 0, 0.1)',
              // @ts-ignore
              '--tw-ring-color': 'rgba(255, 215, 0, 0.2)',
            }}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0"
                style={isActive ? {
                  background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
                  color: '#000',
                } : {
                  backgroundColor: '#141828',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  color: '#7a839a',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Featured Section */}
        {activeCategory === 'all' && featuredGames.length > 0 && !search && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-1 rounded-full" style={{ backgroundColor: '#FFD700' }} />
              <Flame className="h-4 w-4" style={{ color: '#FFD700' }} />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Destaques</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
              {featuredGames.map((game) => (
                <GameCard
                  key={`feat-${game.game_code}`}
                  game={game}
                  onLaunch={handleLaunch}
                  isLaunching={launchingGame === game.game_code}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Games / Filtered */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-1 rounded-full" style={{ backgroundColor: '#FFD700' }} />
            <Gamepad2 className="h-4 w-4" style={{ color: '#FFD700' }} />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {activeCategory === 'all' ? 'Todos os Jogos' :
               activeCategory === 'featured' ? 'Destaques' :
               activeCategory}
            </h2>
            <span className="text-xs font-semibold ml-auto" style={{ color: '#4a5068' }}>
              {filteredGames.length} jogos
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#FFD700' }} />
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
              <Gamepad2 className="h-12 w-12" style={{ color: '#1B2440' }} />
              <p className="text-sm" style={{ color: '#4a5068' }}>
                {search ? 'Nenhum jogo encontrado' : 'Nenhum jogo disponível'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-sm font-bold"
                  style={{ color: '#FFD700' }}
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
              {filteredGames.slice(0, 120).map((game) => (
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

        {/* Footer */}
        <div className="pt-8 pb-4 text-center space-y-2">
          <p className="text-xs" style={{ color: '#4a5068' }}>
            Jogue com responsabilidade. Apenas maiores de 18 anos.
          </p>
          <p className="text-xs" style={{ color: '#2a2f3d' }}>
            &copy; 2026 44X Casino. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Game iframe overlay */}
      {activeGame && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ backgroundColor: '#0C0E14', borderColor: 'rgba(255, 215, 0, 0.1)' }}>
            <button
              onClick={handleCloseGame}
              className="flex items-center gap-2 text-white rounded-xl px-4 py-2 transition-colors"
              style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
            >
              <ArrowLeft className="h-4 w-4" style={{ color: '#FFD700' }} />
              <span className="text-sm font-bold" style={{ color: '#FFD700' }}>Voltar</span>
            </button>
            <span className="text-sm truncate mx-4" style={{ color: '#7a839a' }}>{activeGame.name}</span>
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
