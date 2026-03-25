'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, ArrowLeft, Gamepad2, Flame, Star, Zap, X } from 'lucide-react';
import { GameCard } from './game-card';
import { getGames } from '@/lib/actions/casino';
import type { CasinoGame } from '@/lib/actions/casino';
import { getBanners, type PlatformBanner } from '@/lib/actions/banners';
import { AuthModal } from '@/components/auth/auth-modal';
import { BannerCarousel } from './banner-carousel';
import { WinnersTicker } from './winners-ticker';
import { createClient } from '@/lib/supabase/client';

export function CasinoHome() {
  const [games, setGames] = useState<CasinoGame[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<{ url: string; name: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bonusPopupOpen, setBonusPopupOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [authShownOnce, setAuthShownOnce] = useState(false);
  const [banners, setBanners] = useState<PlatformBanner[]>([]);

  useEffect(() => {
    loadData();
    loadBanners();
    checkAuth().then((loggedIn) => {
      if (!loggedIn) {
        // Show auth popup after 10 seconds
        const timer = setTimeout(() => {
          setAuthModalOpen(true);
          setAuthShownOnce(true);
        }, 10000);
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

  async function loadBanners() {
    const b = await getBanners();
    setBanners(b);
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

  // When user closes auth modal → show bonus popup
  const handleAuthModalClose = useCallback(() => {
    setAuthModalOpen(false);
    checkAuth().then((loggedIn) => {
      if (!loggedIn && authShownOnce) {
        setBonusPopupOpen(true);
      }
    });
  }, [authShownOnce]);

  // Bonus popup: "Continuar" goes back to auth, "Cancelar" closes all
  function handleBonusContinue() {
    setBonusPopupOpen(false);
    setAuthModalOpen(true);
  }
  function handleBonusCancel() {
    setBonusPopupOpen(false);
  }

  const providers = useMemo(() => [...new Set(games.map(g => g.provider))].sort(), [games]);
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
    { id: 'featured', label: 'Populares', icon: Star },
    ...providers.slice(0, 8).map(p => ({ id: p, label: p, icon: Zap })),
  ];

  return (
    <>
      {/* Winners Ticker */}
      <WinnersTicker />

      <div className="px-4 md:px-6 lg:px-8 py-4 space-y-5 max-w-7xl mx-auto">
        {/* Search */}
        <div className="relative max-w-xl">
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
            }}
          />
        </div>

        {/* Banner Carousel */}
        {banners.length > 0 && <BannerCarousel banners={banners} />}

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

        {/* Featured / "Mais Jogados" */}
        {activeCategory === 'all' && featuredGames.length > 0 && !search && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-1 rounded-full" style={{ backgroundColor: '#FFD700' }} />
              <Flame className="h-4 w-4" style={{ color: '#FFD700' }} />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Mais Jogados da Semana</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
              {featuredGames.map((game) => (
                <GameCard key={`feat-${game.game_code}`} game={game} onLaunch={handleLaunch} isLaunching={launchingGame === game.game_code} />
              ))}
            </div>
          </div>
        )}

        {/* All Games */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-1 rounded-full" style={{ backgroundColor: '#FFD700' }} />
            <Gamepad2 className="h-4 w-4" style={{ color: '#FFD700' }} />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {activeCategory === 'all' ? 'Todos os Jogos' : activeCategory === 'featured' ? 'Populares' : activeCategory}
            </h2>
            <span className="text-xs font-semibold ml-auto" style={{ color: '#4a5068' }}>{filteredGames.length} jogos</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#FFD700' }} />
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
              <Gamepad2 className="h-12 w-12" style={{ color: '#1B2440' }} />
              <p className="text-sm" style={{ color: '#4a5068' }}>{search ? 'Nenhum jogo encontrado' : 'Nenhum jogo disponível'}</p>
              {search && <button onClick={() => setSearch('')} className="text-sm font-bold" style={{ color: '#FFD700' }}>Limpar busca</button>}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
              {filteredGames.slice(0, 150).map((game) => (
                <GameCard key={game.game_code} game={game} onLaunch={handleLaunch} isLaunching={launchingGame === game.game_code} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 pb-4 text-center space-y-2">
          <p className="text-xs" style={{ color: '#4a5068' }}>Jogue com responsabilidade. Apenas maiores de 18 anos.</p>
          <p className="text-xs" style={{ color: '#2a2f3d' }}>&copy; 2026 44X Casino. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Game iframe overlay */}
      {activeGame && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ backgroundColor: '#0C0E14', borderColor: 'rgba(255, 215, 0, 0.1)' }}>
            <button onClick={() => setActiveGame(null)} className="flex items-center gap-2 text-white rounded-xl px-4 py-2 transition-colors" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
              <ArrowLeft className="h-4 w-4" style={{ color: '#FFD700' }} />
              <span className="text-sm font-bold" style={{ color: '#FFD700' }}>Voltar</span>
            </button>
            <span className="text-sm truncate mx-4" style={{ color: '#7a839a' }}>{activeGame.name}</span>
          </div>
          <iframe src={activeGame.url} className="flex-1 w-full border-0" allow="autoplay; fullscreen" />
        </div>
      )}

      {/* Auth Modal — appears after 10s or when clicking a game */}
      <AuthModal open={authModalOpen} onClose={handleAuthModalClose} defaultTab="cadastro" />

      {/* Bonus Popup — appears when user closes auth modal */}
      {bonusPopupOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleBonusCancel} />
          <div className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden border" style={{ backgroundColor: '#0C0E14', borderColor: 'rgba(255, 215, 0, 0.15)' }}>
            {/* Banner */}
            <div className="relative w-full h-44 flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #1B2440 0%, #0C0E14 100%)' }}>
              <button onClick={handleBonusCancel} className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center z-10">
                <X className="h-4 w-4 text-white/70" />
              </button>
              <div className="text-center px-6">
                <p className="text-4xl font-black text-white leading-none">NÃO PARE</p>
                <p className="text-4xl font-black leading-none" style={{ color: '#FFD700' }}>AGORA!</p>
                <p className="text-xs mt-2" style={{ color: '#7a839a' }}>🎰 Jogue com responsabilidade</p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 text-center space-y-4">
              <h3 className="text-lg font-black text-white">44X Casino</h3>
              <p className="text-sm" style={{ color: '#7a839a' }}>
                Tem certeza de que deseja cancelar seu registro?
              </p>
              <p className="text-xs" style={{ color: '#FFD700' }}>
                🎁 Bônus de até R$ 500 no primeiro depósito!
              </p>

              <button
                onClick={handleBonusContinue}
                className="w-full py-3.5 rounded-xl text-sm font-black text-black tracking-wide active:scale-[0.98] transition-transform"
                style={{ background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)' }}
              >
                Continuar
              </button>

              <button
                onClick={handleBonusCancel}
                className="w-full text-sm font-medium transition-colors"
                style={{ color: '#4a5068' }}
              >
                Sim, quero cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
