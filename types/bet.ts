export type TipoJogo = 'loterias' | 'fazendinha' | 'quininha' | 'seninha' | 'lotinha';

export type StatusAposta = 'pendente' | 'confirmada' | 'premiada' | 'perdeu';

export interface BetItem {
  id: string;
  tipo: TipoJogo;
  modalidade: string;
  colocacao: string;
  palpites: string[];
  horarios: string[];
  loterias: string[];
  data: string;
  valorUnitario: number;
  multiplicador: number;
}

export interface Aposta {
  id: string;
  user_id: string;
  tipo: TipoJogo;
  modalidade: string;
  colocacao: string;
  palpites: string[];
  horarios: string[];
  data_jogo: string;
  valor_unitario: number;
  valor_total: number;
  multiplicador: number;
  status: StatusAposta;
  premio_valor?: number;
  created_at: string;
}

export interface BetSelection {
  tipo?: TipoJogo;
  data?: string;
  modalidade?: string;
  colocacao?: string;
  palpites: string[];
  horarios: string[];
  loterias: string[];
  valorUnitario: number;
}
