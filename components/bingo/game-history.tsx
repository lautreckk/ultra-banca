'use client';

import { useState, useCallback } from 'react';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getBingoHistory } from '@/lib/bingo/actions';

interface HistoryGame {
  id: string;
  prize: number;
  ranking: number | null;
  joined_at: string;
  bingo_rooms: {
    id: string;
    status: string;
    entry_fee: number;
    game_mode: string;
    draw_speed: number;
    total_pot: number;
    winner_id: string | null;
    started_at: string | null;
    finished_at: string | null;
  };
}

interface GameHistoryProps {
  initialGames: HistoryGame[];
  initialTotal: number;
  currentUserId: string;
}

const ITEMS_PER_PAGE = 20;

export function GameHistory({ initialGames, initialTotal, currentUserId }: GameHistoryProps) {
  const [games, setGames] = useState<HistoryGame[]>(initialGames);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    const result = await getBingoHistory(p, ITEMS_PER_PAGE);
    setGames(result.games as unknown as HistoryGame[]);
    setTotal(result.total);
    setPage(p);
    setLoading(false);
  }, []);

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400">Nenhum jogo finalizado ainda</p>
        <p className="text-sm text-zinc-500 mt-1">Jogue uma partida de bingo para ver seu historico</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const room = game.bingo_rooms;
        const isWinner = room.winner_id === currentUserId;
        const finishedDate = room.finished_at ? new Date(room.finished_at) : null;

        return (
          <div
            key={game.id}
            className={`bg-zinc-900 rounded-xl p-4 border ${isWinner ? 'border-emerald-500/30' : 'border-zinc-800'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isWinner && <Trophy className="w-4 h-4 text-amber-400" />}
                <span className={`text-sm font-bold ${isWinner ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isWinner ? 'Vitoria' : 'Derrota'}
                </span>
              </div>
              {finishedDate && (
                <span className="text-xs text-zinc-500">
                  {finishedDate.toLocaleDateString('pt-BR')} {finishedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-zinc-500">Entrada</span>
                <p className="text-zinc-300 font-mono">{formatCurrency(room.entry_fee)}</p>
              </div>
              <div>
                <span className="text-zinc-500">Premio</span>
                <p className={`font-mono ${game.prize > 0 ? 'text-emerald-300' : 'text-zinc-500'}`}>
                  {game.prize > 0 ? formatCurrency(game.prize) : '-'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Modo</span>
                <p className="text-zinc-300">{room.game_mode === 'competitive' ? 'Competitivo' : 'Casual'}</p>
              </div>
              <div>
                <span className="text-zinc-500">Velocidade</span>
                <p className="text-zinc-300">{room.draw_speed}s</p>
              </div>
              {game.ranking && (
                <div>
                  <span className="text-zinc-500">Ranking</span>
                  <p className="text-zinc-300">{game.ranking}o lugar</p>
                </div>
              )}
              <div>
                <span className="text-zinc-500">Pot total</span>
                <p className="text-zinc-300 font-mono">{formatCurrency(room.total_pot)}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => loadPage(page - 1)}
            disabled={page <= 1 || loading}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-zinc-400">{page} / {totalPages}</span>
          <button
            onClick={() => loadPage(page + 1)}
            disabled={page >= totalPages || loading}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
