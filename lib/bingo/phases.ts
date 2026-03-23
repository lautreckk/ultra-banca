import { generateBotsForRoom } from './bots';

export type BingoPhase = 'kuadra' | 'kina' | 'keno';

export interface PhaseWinner {
  phase: BingoPhase;
  name: string;
  prize: number;
}

export interface PhaseThresholds {
  kuadra: number;
  kina: number;
  keno: number;
}

/**
 * Gera thresholds deterministicos para cada fase baseado no roomId.
 * Kuadra: bola 15-24, Kina: bola 35-49, Keno: bola 60-74
 */
export function getPhaseThresholds(roomId: string): PhaseThresholds {
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = ((hash << 5) - hash) + roomId.charCodeAt(i);
    hash |= 0;
  }

  return {
    kuadra: 15 + (Math.abs(hash) % 10),        // 15-24
    kina: 35 + (Math.abs(hash >> 4) % 15),      // 35-49
    keno: 60 + (Math.abs(hash >> 8) % 15),       // 60-74
  };
}

/**
 * Seleciona um bot como ganhador da fase, deterministico por roomId + fase.
 */
export function pickPhaseWinner(
  roomId: string,
  phase: BingoPhase,
  totalPot: number,
): PhaseWinner {
  const bots = generateBotsForRoom(roomId);

  let hash = 0;
  const seed = `${roomId}-${phase}`;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const botIndex = Math.abs(hash) % bots.length;
  const bot = bots[botIndex];

  // Premios fixos por fase
  const fixedPrizes: Record<BingoPhase, number> = {
    kuadra: 50,
    kina: 100,
    keno: 150,
  };

  const prize = fixedPrizes[phase];

  return {
    phase,
    name: bot.name,
    prize,
  };
}

/**
 * Dado o drawCount atual, retorna qual fase acabou de ser completada (se alguma).
 */
export function checkPhaseCompletion(
  roomId: string,
  drawCount: number,
): BingoPhase | null {
  const thresholds = getPhaseThresholds(roomId);

  if (drawCount === thresholds.kuadra) return 'kuadra';
  if (drawCount === thresholds.kina) return 'kina';
  if (drawCount === thresholds.keno) return 'keno';

  return null;
}

/**
 * Retorna todos os ganhadores de fases ja completadas (para users que entram mid-game).
 */
export function getCompletedPhaseWinners(
  roomId: string,
  drawCount: number,
  totalPot: number,
): PhaseWinner[] {
  const thresholds = getPhaseThresholds(roomId);
  const winners: PhaseWinner[] = [];

  if (drawCount >= thresholds.kuadra) {
    winners.push(pickPhaseWinner(roomId, 'kuadra', totalPot));
  }
  if (drawCount >= thresholds.kina) {
    winners.push(pickPhaseWinner(roomId, 'kina', totalPot));
  }
  if (drawCount >= thresholds.keno) {
    winners.push(pickPhaseWinner(roomId, 'keno', totalPot));
  }

  return winners;
}

/**
 * Retorna a fase atual do jogo baseado no drawCount.
 */
export function getCurrentPhase(roomId: string, drawCount: number): BingoPhase {
  const thresholds = getPhaseThresholds(roomId);

  if (drawCount < thresholds.kuadra) return 'kuadra';
  if (drawCount < thresholds.kina) return 'kina';
  return 'keno';
}
