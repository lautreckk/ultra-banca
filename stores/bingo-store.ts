'use client';

import { create } from 'zustand';
import type { BingoPhase, PhaseWinner } from '@/lib/bingo/phases';

export type BingoGameStatus = 'loading' | 'waiting' | 'countdown' | 'playing' | 'showing_winners' | 'finished';

interface BingoState {
  roomId: string | null;
  status: BingoGameStatus;
  cartela: (number | null)[][] | null;
  drawnNumbers: number[];
  currentNumber: number | null;
  markedNumbers: Set<number>;
  players: { id: string; name: string }[];
  winner: { id: string; name: string; prize: number } | null;
  drawSpeed: number;
  totalPot: number;
  startsAt: string | null;
  entryFee: number;
  isSpectator: boolean;

  // Phase system
  gamePhase: BingoPhase;
  phaseWinners: {
    kuadra: PhaseWinner | null;
    kina: PhaseWinner | null;
    keno: PhaseWinner | null;
  };
  phaseAnnouncement: PhaseWinner | null; // Currently showing announcement

  // Actions
  setGame: (data: {
    roomId: string;
    status: BingoGameStatus;
    cartela: (number | null)[][] | null;
    drawSpeed: number;
    totalPot: number;
    startsAt: string | null;
    entryFee: number;
    isSpectator: boolean;
    players: { id: string; name: string }[];
    drawnNumbers: number[];
    currentNumber: number | null;
    winner: BingoState['winner'];
  }) => void;
  addDrawnNumber: (n: number) => void;
  markNumber: (n: number) => void;
  setWinner: (w: BingoState['winner']) => void;
  addPlayer: (p: { id: string; name: string }) => void;
  setPlayers: (p: { id: string; name: string }[]) => void;
  setStatus: (s: BingoGameStatus) => void;
  updatePot: (pot: number) => void;
  setCartela: (c: (number | null)[][]) => void;
  setIsSpectator: (v: boolean) => void;
  setRoomId: (id: string) => void;
  setStartsAt: (t: string | null) => void;
  setGamePhase: (phase: BingoPhase) => void;
  setPhaseWinner: (winner: PhaseWinner) => void;
  setPhaseAnnouncement: (winner: PhaseWinner | null) => void;
  reset: () => void;
  allCartelaNumbersMarked: () => boolean;
}

const initialState = {
  roomId: null,
  status: 'loading' as const,
  cartela: null,
  drawnNumbers: [],
  currentNumber: null,
  markedNumbers: new Set<number>(),
  players: [],
  winner: null,
  drawSpeed: 5,
  totalPot: 0,
  startsAt: null,
  entryFee: 2,
  isSpectator: true,
  gamePhase: 'kuadra' as BingoPhase,
  phaseWinners: {
    kuadra: null as PhaseWinner | null,
    kina: null as PhaseWinner | null,
    keno: null as PhaseWinner | null,
  },
  phaseAnnouncement: null as PhaseWinner | null,
};

export const useBingoStore = create<BingoState>()((set, get) => ({
  ...initialState,

  setGame: (data) =>
    set({
      roomId: data.roomId,
      status: data.status,
      cartela: data.cartela,
      drawSpeed: data.drawSpeed,
      totalPot: data.totalPot,
      startsAt: data.startsAt,
      entryFee: data.entryFee,
      isSpectator: data.isSpectator,
      players: data.players,
      drawnNumbers: data.drawnNumbers,
      currentNumber: data.currentNumber,
      winner: data.winner,
      markedNumbers: new Set<number>(),
      gamePhase: 'kuadra',
      phaseWinners: { kuadra: null, kina: null, keno: null },
      phaseAnnouncement: null,
    }),

  addDrawnNumber: (n) =>
    set((s) => ({
      drawnNumbers: [...s.drawnNumbers, n],
      currentNumber: n,
    })),

  markNumber: (n) =>
    set((s) => {
      if (s.markedNumbers.has(n)) return s;
      return { markedNumbers: new Set([...s.markedNumbers, n]) };
    }),

  setWinner: (winner) => set({ winner, status: 'finished' }),

  addPlayer: (p) =>
    set((s) => ({
      players: s.players.some(x => x.id === p.id) ? s.players : [...s.players, p],
    })),

  setPlayers: (players) => set({ players }),

  setStatus: (status) => set({ status }),

  updatePot: (pot) => set({ totalPot: pot }),

  setCartela: (cartela) => set({ cartela, isSpectator: false }),

  setIsSpectator: (isSpectator) => set({ isSpectator }),

  setRoomId: (roomId) => set({ roomId }),

  setStartsAt: (startsAt) => set({ startsAt }),

  setGamePhase: (gamePhase) => set({ gamePhase }),

  setPhaseWinner: (winner) =>
    set((s) => ({
      phaseWinners: { ...s.phaseWinners, [winner.phase]: winner },
      phaseAnnouncement: winner,
    })),

  setPhaseAnnouncement: (phaseAnnouncement) => set({ phaseAnnouncement }),

  reset: () => set({
    ...initialState,
    markedNumbers: new Set<number>(),
    phaseWinners: { kuadra: null, kina: null, keno: null },
  }),

  allCartelaNumbersMarked: () => {
    const { cartela, markedNumbers } = get();
    if (!cartela) return false;
    for (const row of cartela) {
      for (const num of row) {
        if (num !== null && !markedNumbers.has(num)) {
          return false;
        }
      }
    }
    return true;
  },
}));
