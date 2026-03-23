'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBingoStore } from '@/stores/bingo-store';
import { getCurrentGame, joinCurrentGame, tickGame, callBingo } from '@/lib/bingo/actions';
import { Cartela } from '@/components/bingo/cartela';
import { BingoButton } from '@/components/bingo/bingo-button';
import { NumberDisplay } from '@/components/bingo/number-display';
import { DrawnNumbers } from '@/components/bingo/drawn-numbers';
import { PlayerList } from '@/components/bingo/player-list';
import { Countdown } from '@/components/bingo/countdown';
import { WinnersPodium } from '@/components/bingo/winners-podium';
import { PhaseAnnouncement } from '@/components/bingo/phase-announcement';
import { useBingoSounds } from '@/hooks/use-bingo-sounds';
import { Volume2, VolumeX, Loader2, Users } from 'lucide-react';
import { generateBotsForRoom } from '@/lib/bingo/bots';
import { getCurrentPhase, getCompletedPhaseWinners } from '@/lib/bingo/phases';
import { formatCurrency } from '@/lib/utils/format-currency';
import type { BingoRoomWithPlayers } from '@/lib/bingo/types';
import type { PhaseWinner } from '@/lib/bingo/phases';

interface GameBoardProps {
  initialRoom: BingoRoomWithPlayers;
  currentUserId: string;
}

export function GameBoard({ initialRoom, currentUserId }: GameBoardProps) {
  const store = useBingoStore();
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);
  const { playNumber, preload, muted, toggleMute } = useBingoSounds();
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [nextGameCountdown, setNextGameCountdown] = useState<number>(0);

  const bots = useMemo(() => {
    const roomId = store.roomId || initialRoom.id;
    return generateBotsForRoom(roomId);
  }, [store.roomId, initialRoom.id]);

  const allPlayers = useMemo(() => {
    return [...bots, ...store.players];
  }, [bots, store.players]);

  // Initialize store from server data (only once)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    preload();

    const currentPlayer = initialRoom.bingo_players.find(
      (p) => p.user_id === currentUserId && !p.is_bot
    );
    const realPlayers = initialRoom.bingo_players
      .filter((p) => !p.is_bot)
      .map((p) => ({ id: p.user_id, name: p.profiles?.nome || 'Jogador' }));

    let status: 'waiting' | 'playing' | 'finished' = 'waiting';
    if (initialRoom.status === 'playing') status = 'playing';
    else if (initialRoom.status === 'finished') status = 'finished';

    let winner = null;
    if (initialRoom.status === 'finished' && initialRoom.winner_id) {
      const wp = initialRoom.bingo_players.find(p => p.user_id === initialRoom.winner_id);
      if (wp) winner = { id: initialRoom.winner_id, name: wp.profiles?.nome || 'Jogador', prize: wp.prize || 0 };
    }

    const drawnNumbers = (initialRoom.drawn_numbers as number[]) || [];

    store.setGame({
      roomId: initialRoom.id,
      status,
      cartela: currentPlayer?.cartela ?? null,
      drawSpeed: initialRoom.draw_speed,
      totalPot: initialRoom.total_pot,
      startsAt: initialRoom.starts_at,
      entryFee: initialRoom.entry_fee,
      isSpectator: !currentPlayer,
      players: realPlayers,
      drawnNumbers,
      currentNumber: initialRoom.current_number,
      winner,
    });

    // Restore phase state for mid-game joins
    if (status === 'playing' && drawnNumbers.length > 0) {
      const phase = getCurrentPhase(initialRoom.id, drawnNumbers.length);
      store.setGamePhase(phase);
      const completedWinners = getCompletedPhaseWinners(initialRoom.id, drawnNumbers.length, initialRoom.total_pot);
      completedWinners.forEach(w => store.setPhaseWinner(w));
      store.setPhaseAnnouncement(null); // Don't show old announcements
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to realtime broadcasts
  useEffect(() => {
    const roomId = store.roomId;
    if (!roomId) return;

    const supabase = createClient();
    const channel = supabase.channel(`bingo:room:${roomId}`);

    channel
      .on('broadcast', { event: 'number_drawn' }, ({ payload }) => {
        useBingoStore.getState().addDrawnNumber(payload.number);
        playNumber(payload.number);

        // Check for phase winner in payload
        if (payload.phaseWinner) {
          const pw = payload.phaseWinner as PhaseWinner;
          useBingoStore.getState().setPhaseWinner(pw);

          // Update game phase
          const nextPhase = pw.phase === 'kuadra' ? 'kina' : pw.phase === 'kina' ? 'keno' : 'keno';
          useBingoStore.getState().setGamePhase(nextPhase);
        }
      })
      .on('broadcast', { event: 'player_joined' }, ({ payload }) => {
        useBingoStore.getState().addPlayer({
          id: payload.userId,
          name: payload.playerName,
        });
        const s = useBingoStore.getState();
        useBingoStore.getState().updatePot(s.totalPot + s.entryFee);
      })
      .on('broadcast', { event: 'game_started' }, () => {
        useBingoStore.getState().setStatus('countdown');
      })
      .on('broadcast', { event: 'bingo_winner' }, ({ payload }) => {
        useBingoStore.getState().setWinner({
          id: payload.winnerId,
          name: payload.winnerName,
          prize: payload.prize,
        });
      })
      .on('broadcast', { event: 'game_over' }, () => {
        const s = useBingoStore.getState();
        // If we have phase winners, show the podium
        if (s.phaseWinners.kuadra || s.phaseWinners.kina || s.phaseWinners.keno) {
          useBingoStore.getState().setStatus('showing_winners');
        } else {
          useBingoStore.getState().setStatus('finished');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store.roomId, playNumber]);

  // Countdown timer for waiting state
  useEffect(() => {
    if (store.status !== 'waiting' || !store.startsAt) return;

    const update = () => {
      const diff = Math.max(0, Math.ceil((new Date(store.startsAt!).getTime() - Date.now()) / 1000));
      setCountdown(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [store.status, store.startsAt]);

  // Tick game driver
  useEffect(() => {
    const roomId = store.roomId;
    if (!roomId) return;
    if (store.status === 'finished' || store.status === 'loading' || store.status === 'showing_winners') return;

    const tick = async () => {
      const s = useBingoStore.getState();
      if (!s.roomId || s.status === 'finished' || s.status === 'loading' || s.status === 'showing_winners') return;

      if (s.status === 'waiting' && s.startsAt) {
        const diff = new Date(s.startsAt).getTime() - Date.now();
        if (diff > 0) return;
      }

      await tickGame({ roomId: s.roomId });
    };

    const intervalMs = store.drawSpeed * 1000;
    const jitter = Math.floor(Math.random() * 1000);

    const timeout = setTimeout(() => {
      tick();
      tickIntervalRef.current = setInterval(tick, intervalMs);
    }, jitter);

    return () => {
      clearTimeout(timeout);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [store.roomId, store.status, store.drawSpeed]);

  // Next game countdown (after showing_winners or finished)
  useEffect(() => {
    if (store.status !== 'showing_winners' && store.status !== 'finished') {
      setNextGameCountdown(0);
      return;
    }

    setNextGameCountdown(12);
    const interval = setInterval(() => {
      setNextGameCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleLoadNextGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.status]);

  const handleLoadNextGame = useCallback(async () => {
    useBingoStore.getState().setStatus('loading');
    const room = await getCurrentGame();
    if (room) {
      const currentPlayer = room.bingo_players.find(
        (p) => p.user_id === currentUserId && !p.is_bot
      );
      const realPlayers = room.bingo_players
        .filter((p) => !p.is_bot)
        .map((p) => ({ id: p.user_id, name: p.profiles?.nome || 'Jogador' }));

      let winner = null;
      if (room.status === 'finished' && room.winner_id) {
        const wp = room.bingo_players.find(p => p.user_id === room.winner_id);
        if (wp) winner = { id: room.winner_id, name: wp.profiles?.nome || 'Jogador', prize: wp.prize || 0 };
      }

      useBingoStore.getState().setGame({
        roomId: room.id,
        status: room.status === 'playing' ? 'playing' : room.status === 'finished' ? 'finished' : 'waiting',
        cartela: currentPlayer?.cartela ?? null,
        drawSpeed: room.draw_speed,
        totalPot: room.total_pot,
        startsAt: room.starts_at,
        entryFee: room.entry_fee,
        isSpectator: !currentPlayer,
        players: realPlayers,
        drawnNumbers: (room.drawn_numbers as number[]) || [],
        currentNumber: room.current_number,
        winner,
      });
    }
  }, [currentUserId]);

  const handleJoin = useCallback(async () => {
    const s = useBingoStore.getState();
    if (!s.roomId || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const result = await joinCurrentGame({ roomId: s.roomId });
      if (result.success && result.cartela) {
        useBingoStore.getState().setCartela(result.cartela);
      } else if (!result.success) {
        setJoinError(result.error || 'Erro ao comprar cartela');
        setTimeout(() => setJoinError(null), 3000);
      }
    } catch (err) {
      console.error('[BINGO] Join error:', err);
      setJoinError('Erro inesperado ao comprar cartela');
      setTimeout(() => setJoinError(null), 3000);
    } finally {
      setJoining(false);
    }
  }, [joining]);

  const handleCountdownComplete = useCallback(() => {
    useBingoStore.getState().setStatus('playing');
  }, []);

  const handleMarkNumber = useCallback((n: number) => {
    useBingoStore.getState().markNumber(n);
  }, []);

  const handleCallBingo = useCallback(async () => {
    const s = useBingoStore.getState();
    if (!s.roomId) return { success: false, error: 'Sem jogo ativo' };
    const result = await callBingo({ roomId: s.roomId });
    return result.success ? { success: true } : { success: false, error: result.error };
  }, []);

  const handleDismissAnnouncement = useCallback(() => {
    useBingoStore.getState().setPhaseAnnouncement(null);
  }, []);

  const drawnSet = new Set(store.drawnNumbers);
  const cartelaNumbers = useMemo(() => {
    const s = new Set<number>();
    if (store.cartela) {
      for (const row of store.cartela) {
        for (const n of row) {
          if (n !== null) s.add(n);
        }
      }
    }
    return s;
  }, [store.cartela]);

  const prizeAmount = store.totalPot > 0 ? store.totalPot * 0.9 : 0;

  const PHASE_LABELS: Record<string, { label: string; color: string }> = {
    kuadra: { label: 'KUADRA', color: 'text-blue-400' },
    kina: { label: 'KINA', color: 'text-purple-400' },
    keno: { label: 'KENO', color: 'text-yellow-400' },
  };

  // ── LOADING ──
  if (store.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-sm text-white/40">Carregando jogo...</p>
      </div>
    );
  }

  // ── WAITING (lobby) ──
  if (store.status === 'waiting') {
    const now = new Date();
    const diaHora = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return (
      <div className="space-y-5">
        {/* Countdown grande */}
        <div className="bingo-glass-card rounded-2xl p-5 text-center border-t border-purple-400/20">
          <span className="text-[10px] text-purple-400 font-bold tracking-[0.2em] uppercase">
            Próximo Sorteio em...
          </span>
          <p className="text-5xl font-black bingo-gaming-font text-white mt-2 tabular-nums">
            {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
          </p>
        </div>

        {/* Info do sorteio */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bingo-glass-card rounded-2xl p-3 flex flex-col items-center justify-center border-t border-blue-400/20">
            <span className="text-[9px] uppercase font-bold text-blue-400 tracking-tighter mb-1">Sorteio</span>
            <span className="text-sm font-black text-white bingo-gaming-font">
              #{store.roomId?.slice(-5).toUpperCase() || '-----'}
            </span>
          </div>
          <div className="bingo-glass-card rounded-2xl p-3 flex flex-col items-center justify-center border-t border-purple-400/20">
            <span className="text-[9px] uppercase font-bold text-purple-400 tracking-tighter mb-1">Dia-Hora</span>
            <span className="text-sm font-black text-white tabular-nums">{diaHora}</span>
          </div>
          <div className="bingo-glass-card rounded-2xl p-3 flex flex-col items-center justify-center border-t border-green-400/20">
            <span className="text-[9px] uppercase font-bold text-green-400 tracking-tighter mb-1">Doação</span>
            <span className="text-sm font-black text-white tabular-nums">{formatCurrency(store.entryFee)}</span>
          </div>
        </section>

        {/* Modalidades em lista com premios fixos */}
        <section className="space-y-2">
          <div className="flex items-center justify-between bg-blue-600/20 border border-blue-500/30 rounded-xl px-4 py-3">
            <span className="text-sm font-black uppercase tracking-wider text-blue-400">KUADRA</span>
            <span className="text-sm font-black text-white tabular-nums">{formatCurrency(50)}</span>
          </div>
          <div className="flex items-center justify-between bg-purple-600/20 border border-purple-500/30 rounded-xl px-4 py-3">
            <span className="text-sm font-black uppercase tracking-wider text-purple-400">KINA</span>
            <span className="text-sm font-black text-white tabular-nums">{formatCurrency(100)}</span>
          </div>
          <div className="flex items-center justify-between bg-orange-600/20 border border-orange-500/30 rounded-xl px-4 py-3">
            <span className="text-sm font-black uppercase tracking-wider text-orange-400">KENO</span>
            <span className="text-sm font-black text-white tabular-nums">{formatCurrency(150)}</span>
          </div>
        </section>

        {/* Banner Acumulado */}
        <section className="w-full relative p-0.5 rounded-2xl bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 jackpot-glow overflow-hidden">
          <div className="relative bg-black/90 rounded-[14px] px-5 py-3.5 flex justify-between items-center">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent jackpot-streak" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-yellow-500/80">ACUMULADO</span>
              <p className="text-2xl font-black bingo-gaming-font bg-gradient-to-b from-white to-yellow-200 bg-clip-text text-transparent">
                {formatCurrency(300)}
              </p>
            </div>
            <div className="relative z-10 bingo-glass-panel bg-white/5 px-3 py-2 rounded-xl border border-white/10 text-center">
              <span className="block text-[8px] uppercase font-bold text-yellow-500/60 mb-1">Jogadores</span>
              <span className="text-base font-black bingo-gaming-font leading-none">{allPlayers.length}</span>
            </div>
          </div>
        </section>

        {/* Comprar cartela */}
        {store.isSpectator ? (
          <div className="space-y-3">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full h-16 rounded-2xl bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 shadow-[0_4px_15px_rgba(234,179,8,0.4)] border-b-4 border-yellow-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {joining ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span className="text-sm font-black text-black uppercase tracking-widest">Entrando...</span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                    <span className="text-black font-black text-lg">+</span>
                  </div>
                  <span className="text-[13px] font-black text-black uppercase tracking-widest">
                    Comprar Cartela - {formatCurrency(store.entryFee)}
                  </span>
                </>
              )}
            </button>
            {joinError && (
              <p className="text-sm text-red-400 text-center">{joinError}</p>
            )}
          </div>
        ) : (
          store.cartela && (
            <Cartela
              cartela={store.cartela}
              interactive={false}
              drawnNumbers={drawnSet}
              markedNumbers={store.markedNumbers}
              onMark={() => {}}
            />
          )
        )}

        <PlayerList players={allPlayers} />
      </div>
    );
  }

  // ── COUNTDOWN ──
  if (store.status === 'countdown') {
    return <Countdown onComplete={handleCountdownComplete} />;
  }

  // ── PLAYING ──
  if (store.status === 'playing') {
    const allMarked = store.allCartelaNumbersMarked();
    const phaseInfo = PHASE_LABELS[store.gamePhase];

    return (
      <div className="space-y-5">
        {/* Phase announcement overlay */}
        {store.phaseAnnouncement && (
          <PhaseAnnouncement
            winner={store.phaseAnnouncement}
            onDismiss={handleDismissAnnouncement}
          />
        )}

        {/* Top bar with phase indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${phaseInfo.color}`}>
                Fase: {phaseInfo.label}
              </span>
              <p className="text-lg font-black bingo-gaming-font text-yellow-400 leading-tight">
                {formatCurrency(prizeAmount)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-white/60">{allPlayers.length}</span>
            </div>
          </div>
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 transition-colors"
            aria-label={muted ? 'Ativar som' : 'Desativar som'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Phase winners badges (completed phases) */}
        {(store.phaseWinners.kuadra || store.phaseWinners.kina) && (
          <div className="flex gap-2">
            {store.phaseWinners.kuadra && (
              <div className="flex-1 bg-blue-600/15 border border-blue-500/20 rounded-xl px-3 py-2 text-center">
                <span className="text-[8px] font-black text-blue-400 uppercase">Kuadra</span>
                <p className="text-xs font-bold text-white/70 truncate">{store.phaseWinners.kuadra.name}</p>
              </div>
            )}
            {store.phaseWinners.kina && (
              <div className="flex-1 bg-purple-600/15 border border-purple-500/20 rounded-xl px-3 py-2 text-center">
                <span className="text-[8px] font-black text-purple-400 uppercase">Kina</span>
                <p className="text-xs font-bold text-white/70 truncate">{store.phaseWinners.kina.name}</p>
              </div>
            )}
          </div>
        )}

        {/* Bolas de sorteio */}
        <NumberDisplay
          currentNumber={store.currentNumber}
          drawIndex={store.drawnNumbers.length}
        />

        {store.cartela && !store.isSpectator ? (
          <>
            <Cartela
              cartela={store.cartela}
              interactive={true}
              drawnNumbers={drawnSet}
              markedNumbers={store.markedNumbers}
              onMark={handleMarkNumber}
            />
            <BingoButton
              disabled={!allMarked}
              allMarked={allMarked}
              onCall={handleCallBingo}
            />
          </>
        ) : (
          <div className="bingo-glass-card rounded-2xl p-5 text-center">
            <p className="text-sm text-white/50">Voce esta assistindo este jogo.</p>
            <p className="text-xs text-white/30 mt-1">Compre uma cartela no proximo jogo!</p>
          </div>
        )}

        <DrawnNumbers drawnNumbers={drawnSet} cartelaNumbers={cartelaNumbers} />
        <PlayerList players={allPlayers} />
      </div>
    );
  }

  // ── SHOWING WINNERS (podium after all phases) ──
  if (store.status === 'showing_winners') {
    return (
      <div className="space-y-5">
        <WinnersPodium
          phaseWinners={store.phaseWinners}
          nextGameCountdown={nextGameCountdown}
        />
        <PlayerList players={allPlayers} />
      </div>
    );
  }

  // ── FINISHED ──
  if (store.status === 'finished') {
    return (
      <div className="space-y-5">
        {store.phaseWinners.kuadra || store.phaseWinners.kina || store.phaseWinners.keno ? (
          <WinnersPodium
            phaseWinners={store.phaseWinners}
            nextGameCountdown={nextGameCountdown}
          />
        ) : store.winner ? (
          <div className="bingo-glass-card rounded-2xl p-6 text-center banner-slide">
            <h2 className="text-2xl font-black bingo-gaming-font text-yellow-400 mb-2">BINGO!</h2>
            <p className="text-lg font-bold text-white">{store.winner.name}</p>
            <p className="text-xl font-black bingo-gaming-font text-emerald-400 mt-1">
              {formatCurrency(store.winner.prize)}
            </p>
          </div>
        ) : (
          <div className="bingo-glass-card rounded-2xl p-6 text-center">
            <p className="text-lg font-bold text-white">Jogo encerrado</p>
            <p className="text-sm text-white/40 mt-1">Ninguem completou a cartela</p>
          </div>
        )}

        {!(store.phaseWinners.kuadra || store.phaseWinners.kina || store.phaseWinners.keno) && (
          <div className="bingo-glass-card rounded-2xl p-5 text-center">
            <p className="text-sm text-white/40">Proximo jogo em</p>
            <p className="text-3xl font-black bingo-gaming-font text-emerald-400 mt-1">
              {nextGameCountdown}s
            </p>
          </div>
        )}

        <PlayerList players={allPlayers} />
      </div>
    );
  }

  return null;
}
