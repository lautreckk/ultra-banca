'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BetItem, BetSelection, TipoJogo } from '@/types/bet';
import { getSubLoteriaById } from '@/lib/constants';

// Aposta pendente (sem loterias selecionadas ainda)
export interface PendingBet {
  id: string;
  tipo: TipoJogo;
  data: string;
  modalidade: string;
  colocacao: string;
  palpites: string[];
  valorUnitario: number;
  multiplicador: number;
}

interface BetStore {
  items: BetItem[];
  pendingItems: PendingBet[]; // Apostas aguardando seleção de loterias
  currentSelection: BetSelection;

  // Cart actions
  addItem: (item: Omit<BetItem, 'id'>) => void;
  removeItem: (id: string) => void;
  removeLoteriaFromAll: (loteriaId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;

  // Pending items actions
  addPendingItem: (item: Omit<PendingBet, 'id'>) => void;
  removePendingItem: (id: string) => void;
  clearPendingItems: () => void;
  finalizePendingItems: (loterias: string[], horarios: string[]) => void;
  getPendingCount: () => number;

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
      pendingItems: [],
      currentSelection: initialSelection,

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, { ...item, id: crypto.randomUUID() }],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      removeLoteriaFromAll: (loteriaId) =>
        set((state) => {
          const updatedItems = state.items.map((item) => {
            const newLoterias = item.loterias.filter((l) => l !== loteriaId);
            const subLoteria = getSubLoteriaById(loteriaId);
            let newHorarios = [...item.horarios];
            if (subLoteria?.horario) {
              const otherLoteriasWithSameHorario = newLoterias.some((l) => {
                const other = getSubLoteriaById(l);
                return other?.horario === subLoteria.horario;
              });
              if (!otherLoteriasWithSameHorario) {
                newHorarios = newHorarios.filter((h) => h !== subLoteria.horario);
              }
            }
            return { ...item, loterias: newLoterias, horarios: newHorarios };
          });
          const filteredItems = updatedItems.filter((item) => item.loterias.length > 0);
          return { items: filteredItems };
        }),

      clearCart: () => set({ items: [], pendingItems: [] }),

      getTotal: () => {
        const items = get().items;
        return items.reduce((sum, item) => {
          const quantidade = item.palpites.length * item.horarios.length;
          return sum + item.valorUnitario * quantidade;
        }, 0);
      },

      getItemCount: () => get().items.length,

      // Pending items actions
      addPendingItem: (item) =>
        set((state) => ({
          pendingItems: [...state.pendingItems, { ...item, id: crypto.randomUUID() }],
        })),

      removePendingItem: (id) =>
        set((state) => ({
          pendingItems: state.pendingItems.filter((i) => i.id !== id),
        })),

      clearPendingItems: () => set({ pendingItems: [] }),

      finalizePendingItems: (loterias, horarios) =>
        set((state) => {
          // Converte todas as apostas pendentes em apostas finais
          const newItems: BetItem[] = state.pendingItems.map((pending) => ({
            id: crypto.randomUUID(),
            tipo: pending.tipo,
            data: pending.data,
            modalidade: pending.modalidade,
            colocacao: pending.colocacao,
            palpites: pending.palpites,
            horarios,
            loterias,
            valorUnitario: pending.valorUnitario,
            multiplicador: pending.multiplicador,
          }));

          return {
            items: [...state.items, ...newItems],
            pendingItems: [],
          };
        }),

      getPendingCount: () => get().pendingItems.length,

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
          const isRemoving = state.currentSelection.loterias.includes(loteriaId);
          const loterias = isRemoving
            ? state.currentSelection.loterias.filter((l) => l !== loteriaId)
            : [...state.currentSelection.loterias, loteriaId];

          // Also update horarios based on the loteria's horario
          const subLoteria = getSubLoteriaById(loteriaId);
          let horarios = [...state.currentSelection.horarios];

          if (subLoteria?.horario) {
            if (isRemoving) {
              // Only remove if no other loteria uses the same horario
              const otherLoteriasWithSameHorario = loterias.some((l) => {
                const other = getSubLoteriaById(l);
                return other?.horario === subLoteria.horario;
              });
              if (!otherLoteriasWithSameHorario) {
                horarios = horarios.filter((h) => h !== subLoteria.horario);
              }
            } else {
              // Add horario if not already present
              if (!horarios.includes(subLoteria.horario)) {
                horarios = [...horarios, subLoteria.horario];
              }
            }
          }

          return {
            currentSelection: { ...state.currentSelection, loterias, horarios },
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
      partialize: (state) => ({ items: state.items, pendingItems: state.pendingItems }),
    }
  )
);

// Re-export BetItem type for convenience
export type { BetItem };
