export type BingoRoomStatus = 'waiting' | 'playing' | 'finished' | 'cancelled';
export type DrawSpeed = 3 | 5 | 10;
export type BingoCartela = (number | null)[][]; // 3 rows x 9 cols

export interface BingoRoom {
  id: string;
  host_id: string | null;
  status: BingoRoomStatus;
  entry_fee: number;
  draw_speed: DrawSpeed;
  game_mode: string;
  max_players: number;
  drawn_numbers: number[];
  current_number: number | null;
  winner_id: string | null;
  total_pot: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
  starts_at: string | null;
  next_draw_at: string | null;
  platform_id: string | null;
}

export interface BingoPlayer {
  id: string;
  room_id: string;
  user_id: string;
  cartela: BingoCartela;
  entry_tx_id: string | null;
  prize: number;
  ranking: number | null;
  joined_at: string;
  is_bot: boolean;
  profiles?: { nome: string };
}

export interface BingoRoomWithPlayers extends BingoRoom {
  bingo_players: BingoPlayer[];
  player_count: number;
}

export interface NumberDrawnPayload {
  number: number;
  drawnNumbers: number[];
  drawIndex: number;
}

export interface PlayerJoinedPayload {
  userId: string;
  playerName: string;
  playerCount: number;
}

export interface BingoWinnerPayload {
  winnerId: string;
  winnerName: string;
  prize: number;
}

export interface GameStartedPayload {
  startedAt: string;
}

export interface TickResult {
  action: 'none' | 'game_started' | 'number_drawn' | 'game_over' | 'already_handled';
  room: BingoRoomWithPlayers | null;
  number?: number;
  drawnNumbers?: number[];
  drawIndex?: number;
}
