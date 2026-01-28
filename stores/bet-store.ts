'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BetItem, BetSelection, TipoJogo } from '@/types/bet';

interface BetStore {
  items: BetItem[];
  currentSelection: BetSelection;

  // Cart actions
  addItem: (item: Omit<BetItem, 'id'>) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;

  // Selection actions
  setTipo: (tipo: TipoJogo) => void;
  setData: (data: string) => void;
  setModalidade: (modalidade: string) => void;
  setColocacao: (colocacao: string) => void;
  addPalpite: (palpite: string) => void;
  removePalpite: (palpite: string) => void;
  clearPalpites: () => void;
  toggleHorario: (horario: string) => void;
  toggleLoteria: (loteriaId: string) => void;
  setValorUnitario: (valor: number) => void;
  resetSelection: () => void;
}

const initialSelection: BetSelection = {
  tipo: undefined,
  data: undefined,
  modalidade: undefined,
  colocacao: undefined,
  palpites: [],
  horarios: [],
  loterias: [],
  valorUnitario: 0.1,
};

export const useBetStore = create<BetStore>()(
  persist(
    (set, get) => ({
      items: [],
      currentSelection: initialSelection,

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, { ...item, id: crypto.randomUUID() }],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const items = get().items;
        return items.reduce((sum, item) => {
          const quantidade = item.palpites.length * item.horarios.length;
          return sum + item.valorUnitario * quantidade;
        }, 0);
      },

      getItemCount: () => get().items.length,

      setTipo: (tipo) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, tipo },
        })),

      setData: (data) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, data },
        })),

      setModalidade: (modalidade) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, modalidade },
        })),

      setColocacao: (colocacao) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, colocacao },
        })),

      addPalpite: (palpite) =>
        set((state) => ({
          currentSelection: {
            ...state.currentSelection,
            palpites: [...state.currentSelection.palpites, palpite],
          },
        })),

      removePalpite: (palpite) =>
        set((state) => ({
          currentSelection: {
            ...state.currentSelection,
            palpites: state.currentSelection.palpites.filter((p) => p !== palpite),
          },
        })),

      clearPalpites: () =>
        set((state) => ({
          currentSelection: {
            ...state.currentSelection,
            palpites: [],
          },
        })),

      toggleHorario: (horario) =>
        set((state) => {
          const horarios = state.currentSelection.horarios.includes(horario)
            ? state.currentSelection.horarios.filter((h) => h !== horario)
            : [...state.currentSelection.horarios, horario];
          return {
            currentSelection: { ...state.currentSelection, horarios },
          };
        }),

      toggleLoteria: (loteriaId) =>
        set((state) => {
          const loterias = state.currentSelection.loterias.includes(loteriaId)
            ? state.currentSelection.loterias.filter((l) => l !== loteriaId)
            : [...state.currentSelection.loterias, loteriaId];
          return {
            currentSelection: { ...state.currentSelection, loterias },
          };
        }),

      setValorUnitario: (valor) =>
        set((state) => ({
          currentSelection: { ...state.currentSelection, valorUnitario: valor },
        })),

      resetSelection: () =>
        set({
          currentSelection: initialSelection,
        }),
    }),
    {
      name: 'bet-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
