export interface Modalidade {
  id: string;
  nome: string;
  multiplicador: number;
  digitos: number;
  descricao?: string;
  categoria?: string;
  jogo: 'loterias' | 'quininha' | 'seninha' | 'lotinha';
}

// ==================== LOTERIAS ====================
export const MODALIDADES_LOTERIAS: Modalidade[] = [
  // Centenas
  { id: 'centena', nome: 'CENTENA', multiplicador: 800, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv', nome: 'CENTENA INV', multiplicador: 800, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_3x', nome: 'CENTENA 3X', multiplicador: 800, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_esquerda', nome: 'CENTENA ESQUERDA', multiplicador: 800, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_4d', nome: 'CENTENA INV 4D', multiplicador: 600, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_5d', nome: 'CENTENA INV 5D', multiplicador: 480, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_6d', nome: 'CENTENA INV 6D', multiplicador: 400, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_7d', nome: 'CENTENA INV 7D', multiplicador: 340, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_8d', nome: 'CENTENA INV 8D', multiplicador: 300, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_esq', nome: 'CENTENA INV ESQ', multiplicador: 800, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_esq_4d', nome: 'CENTENA INV ESQ 4D', multiplicador: 600, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_esq_5d', nome: 'CENTENA INV ESQ 5D', multiplicador: 480, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_esq_6d', nome: 'CENTENA INV ESQ 6D', multiplicador: 400, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_esq_7d', nome: 'CENTENA INV ESQ 7D', multiplicador: 340, digitos: 3, categoria: 'centena', jogo: 'loterias' },
  { id: 'centena_inv_esq_8d', nome: 'CENTENA INV ESQ 8D', multiplicador: 300, digitos: 3, categoria: 'centena', jogo: 'loterias' },

  // Milhares
  { id: 'milhar', nome: 'MILHAR', multiplicador: 8000, digitos: 4, categoria: 'milhar', jogo: 'loterias' },
  { id: 'milhar_ct', nome: 'MILHAR E CT', multiplicador: 8000, digitos: 4, categoria: 'milhar', jogo: 'loterias' },
  { id: 'milhar_inv', nome: 'MILHAR INV', multiplicador: 8000, digitos: 4, categoria: 'milhar', jogo: 'loterias' },
  { id: 'milhar_inv_5d', nome: 'MILHAR INV 5D', multiplicador: 4800, digitos: 4, categoria: 'milhar', jogo: 'loterias' },
  { id: 'milhar_inv_6d', nome: 'MILHAR INV 6D', multiplicador: 4000, digitos: 4, categoria: 'milhar', jogo: 'loterias' },
  { id: 'milhar_inv_7d', nome: 'MILHAR INV 7D', multiplicador: 3400, digitos: 4, categoria: 'milhar', jogo: 'loterias' },
  { id: 'milhar_inv_8d', nome: 'MILHAR INV 8D', multiplicador: 3000, digitos: 4, categoria: 'milhar', jogo: 'loterias' },
  { id: 'milhar_inv_9d', nome: 'MILHAR INV 9D', multiplicador: 2660, digitos: 4, categoria: 'milhar', jogo: 'loterias' },
  { id: 'milhar_inv_10d', nome: 'MILHAR INV 10D', multiplicador: 2400, digitos: 4, categoria: 'milhar', jogo: 'loterias' },

  // Unidade
  { id: 'unidade', nome: 'UNIDADE', multiplicador: 8, digitos: 1, categoria: 'unidade', jogo: 'loterias' },

  // Dezenas
  { id: 'dezena', nome: 'DEZENA', multiplicador: 80, digitos: 2, categoria: 'dezena', jogo: 'loterias' },
  { id: 'dezena_esq', nome: 'DEZENA ESQ', multiplicador: 80, digitos: 2, categoria: 'dezena', jogo: 'loterias' },
  { id: 'dezena_meio', nome: 'DEZENA MEIO', multiplicador: 80, digitos: 2, categoria: 'dezena', jogo: 'loterias' },

  // Duque Dezena
  { id: 'duque_dez', nome: 'DUQUE DEZ', multiplicador: 300, digitos: 4, categoria: 'duque_dezena', jogo: 'loterias' },
  { id: 'duque_dez_10d', nome: 'DUQUE DEZ 10D', multiplicador: 180, digitos: 4, categoria: 'duque_dezena', jogo: 'loterias' },
  { id: 'duque_dez_esq', nome: 'DUQUE DEZ ESQ', multiplicador: 300, digitos: 4, categoria: 'duque_dezena', jogo: 'loterias' },
  { id: 'duque_dez_meio', nome: 'DUQUE DEZ MEIO', multiplicador: 300, digitos: 4, categoria: 'duque_dezena', jogo: 'loterias' },

  // Terno Dezena Seco
  { id: 'terno_dez_seco', nome: 'TERNO DEZ SECO', multiplicador: 10000, digitos: 6, categoria: 'terno_dezena_seco', jogo: 'loterias' },
  { id: 'terno_dez_seco_esq', nome: 'TERNO DEZ SECO ESQ', multiplicador: 5000, digitos: 6, categoria: 'terno_dezena_seco', jogo: 'loterias' },
  { id: 'terno_dez_seco_meio', nome: 'TERNO DEZ SECO MEIO', multiplicador: 5000, digitos: 6, categoria: 'terno_dezena_seco', jogo: 'loterias' },

  // Terno Dezena
  { id: 'terno_dez', nome: 'TERNO DEZ', multiplicador: 5000, digitos: 6, categoria: 'terno_dezena', jogo: 'loterias' },
  { id: 'terno_dez_esq', nome: 'TERNO DEZ ESQ', multiplicador: 5000, digitos: 6, categoria: 'terno_dezena', jogo: 'loterias' },
  { id: 'terno_dez_meio', nome: 'TERNO DEZ MEIO', multiplicador: 5000, digitos: 6, categoria: 'terno_dezena', jogo: 'loterias' },

  // Grupo
  { id: 'grupo', nome: 'GRUPO', multiplicador: 20, digitos: 2, categoria: 'grupo', jogo: 'loterias' },
  { id: 'grupo_esq', nome: 'GRUPO ESQ', multiplicador: 20, digitos: 2, categoria: 'grupo', jogo: 'loterias' },
  { id: 'grupo_meio', nome: 'GRUPO MEIO', multiplicador: 20, digitos: 2, categoria: 'grupo', jogo: 'loterias' },

  // Duque Grupo
  { id: 'duque_gp', nome: 'DUQUE GP', multiplicador: 200, digitos: 4, categoria: 'duque_grupo', jogo: 'loterias' },
  { id: 'duque_gp_esq', nome: 'DUQUE GP ESQ', multiplicador: 180, digitos: 4, categoria: 'duque_grupo', jogo: 'loterias' },
  { id: 'duque_gp_meio', nome: 'DUQUE GP MEIO', multiplicador: 180, digitos: 4, categoria: 'duque_grupo', jogo: 'loterias' },

  // Terno Grupo
  { id: 'terno_gp', nome: 'TERNO GP', multiplicador: 1500, digitos: 6, categoria: 'terno_grupo', jogo: 'loterias' },
  { id: 'terno_gp_esq', nome: 'TERNO GP ESQ', multiplicador: 1500, digitos: 6, categoria: 'terno_grupo', jogo: 'loterias' },
  { id: 'terno_gp_meio', nome: 'TERNO GP MEIO', multiplicador: 1500, digitos: 6, categoria: 'terno_grupo', jogo: 'loterias' },

  // Quadra Grupo
  { id: 'quadra_gp', nome: 'QUADRA GP', multiplicador: 1000, digitos: 8, categoria: 'quadra_grupo', jogo: 'loterias' },
  { id: 'quadra_gp_esq', nome: 'QUADRA GP ESQ', multiplicador: 1000, digitos: 8, categoria: 'quadra_grupo', jogo: 'loterias' },
  { id: 'quadra_gp_meio', nome: 'QUADRA GP MEIO', multiplicador: 1000, digitos: 8, categoria: 'quadra_grupo', jogo: 'loterias' },

  // Quina Grupo
  { id: 'quina_gp', nome: 'QUINA GP 8/5', multiplicador: 1000, digitos: 10, categoria: 'quina_grupo', jogo: 'loterias' },
  { id: 'quina_gp_esq', nome: 'QUINA GP 8/5 ESQ', multiplicador: 1000, digitos: 10, categoria: 'quina_grupo', jogo: 'loterias' },
  { id: 'quina_gp_meio', nome: 'QUINA GP 8/5 MEIO', multiplicador: 1000, digitos: 10, categoria: 'quina_grupo', jogo: 'loterias' },

  // Sena Grupo
  { id: 'sena_gp', nome: 'SENA GP 10/6', multiplicador: 1000, digitos: 12, categoria: 'sena_grupo', jogo: 'loterias' },
  { id: 'sena_gp_esq', nome: 'SENA GP 10/6 ESQ', multiplicador: 1000, digitos: 12, categoria: 'sena_grupo', jogo: 'loterias' },
  { id: 'sena_gp_meio', nome: 'SENA GP 10/6 MEIO', multiplicador: 1000, digitos: 12, categoria: 'sena_grupo', jogo: 'loterias' },

  // Passe
  { id: 'passe_vai', nome: 'PASSE VAI', multiplicador: 90, digitos: 4, categoria: 'passe', jogo: 'loterias' },
  { id: 'passe_vai_vem', nome: 'PASSE VAI VEM', multiplicador: 45, digitos: 4, categoria: 'passe', jogo: 'loterias' },

  // Palpitao
  { id: 'palpitao', nome: 'PALPITAO', multiplicador: 1, digitos: 0, categoria: 'palpitao', jogo: 'loterias' },
];

// ==================== QUININHA ====================
export const MODALIDADES_QUININHA: Modalidade[] = [
  { id: 'quininha_13d', nome: 'QUININHA 13D', multiplicador: 5000, digitos: 13, jogo: 'quininha' },
  { id: 'quininha_14d', nome: 'QUININHA 14D', multiplicador: 3900, digitos: 14, jogo: 'quininha' },
  { id: 'quininha_15d', nome: 'QUININHA 15D', multiplicador: 2700, digitos: 15, jogo: 'quininha' },
  { id: 'quininha_16d', nome: 'QUININHA 16D', multiplicador: 2200, digitos: 16, jogo: 'quininha' },
  { id: 'quininha_17d', nome: 'QUININHA 17D', multiplicador: 1600, digitos: 17, jogo: 'quininha' },
  { id: 'quininha_18d', nome: 'QUININHA 18D', multiplicador: 1100, digitos: 18, jogo: 'quininha' },
  { id: 'quininha_19d', nome: 'QUININHA 19D', multiplicador: 800, digitos: 19, jogo: 'quininha' },
  { id: 'quininha_20d', nome: 'QUININHA 20D', multiplicador: 700, digitos: 20, jogo: 'quininha' },
  { id: 'quininha_25d', nome: 'QUININHA 25D', multiplicador: 180, digitos: 25, jogo: 'quininha' },
  { id: 'quininha_30d', nome: 'QUININHA 30D', multiplicador: 65, digitos: 30, jogo: 'quininha' },
  { id: 'quininha_35d', nome: 'QUININHA 35D', multiplicador: 29, digitos: 35, jogo: 'quininha' },
  { id: 'quininha_40d', nome: 'QUININHA 40D', multiplicador: 10, digitos: 40, jogo: 'quininha' },
  { id: 'quininha_45d', nome: 'QUININHA 45D', multiplicador: 7, digitos: 45, jogo: 'quininha' },
];

// ==================== SENINHA ====================
export const MODALIDADES_SENINHA: Modalidade[] = [
  { id: 'seninha_14d', nome: 'SENINHA 14D', multiplicador: 5000, digitos: 14, jogo: 'seninha' },
  { id: 'seninha_15d', nome: 'SENINHA 15D', multiplicador: 3500, digitos: 15, jogo: 'seninha' },
  { id: 'seninha_16d', nome: 'SENINHA 16D', multiplicador: 2000, digitos: 16, jogo: 'seninha' },
  { id: 'seninha_17d', nome: 'SENINHA 17D', multiplicador: 1500, digitos: 17, jogo: 'seninha' },
  { id: 'seninha_18d', nome: 'SENINHA 18D', multiplicador: 850, digitos: 18, jogo: 'seninha' },
  { id: 'seninha_19d', nome: 'SENINHA 19D', multiplicador: 650, digitos: 19, jogo: 'seninha' },
  { id: 'seninha_20d', nome: 'SENINHA 20D', multiplicador: 500, digitos: 20, jogo: 'seninha' },
  { id: 'seninha_25d', nome: 'SENINHA 25D', multiplicador: 110, digitos: 25, jogo: 'seninha' },
  { id: 'seninha_30d', nome: 'SENINHA 30D', multiplicador: 28, digitos: 30, jogo: 'seninha' },
  { id: 'seninha_35d', nome: 'SENINHA 35D', multiplicador: 8, digitos: 35, jogo: 'seninha' },
  { id: 'seninha_40d', nome: 'SENINHA 40D', multiplicador: 5, digitos: 40, jogo: 'seninha' },
];

// ==================== LOTINHA ====================
export const MODALIDADES_LOTINHA: Modalidade[] = [
  { id: 'lotinha_16d', nome: 'LOTINHA 16D', multiplicador: 5000, digitos: 16, jogo: 'lotinha' },
  { id: 'lotinha_17d', nome: 'LOTINHA 17D', multiplicador: 200, digitos: 17, jogo: 'lotinha' },
  { id: 'lotinha_18d', nome: 'LOTINHA 18D', multiplicador: 100, digitos: 18, jogo: 'lotinha' },
  { id: 'lotinha_19d', nome: 'LOTINHA 19D', multiplicador: 50, digitos: 19, jogo: 'lotinha' },
  { id: 'lotinha_20d', nome: 'LOTINHA 20D', multiplicador: 25, digitos: 20, jogo: 'lotinha' },
  { id: 'lotinha_21d', nome: 'LOTINHA 21D', multiplicador: 15, digitos: 21, jogo: 'lotinha' },
  { id: 'lotinha_22d', nome: 'LOTINHA 22D', multiplicador: 8, digitos: 22, jogo: 'lotinha' },
];

// Todas as modalidades combinadas
export const MODALIDADES: Modalidade[] = [
  ...MODALIDADES_LOTERIAS,
  ...MODALIDADES_QUININHA,
  ...MODALIDADES_SENINHA,
  ...MODALIDADES_LOTINHA,
];

// Categorias para organizar no UI (apenas para Loterias)
export const CATEGORIAS_MODALIDADES = [
  { id: 'centena', nome: 'Centenas' },
  { id: 'milhar', nome: 'Milhares' },
  { id: 'unidade', nome: 'Unidade' },
  { id: 'dezena', nome: 'Dezenas' },
  { id: 'duque_dezena', nome: 'Duque Dezena' },
  { id: 'terno_dezena_seco', nome: 'Terno Dezena Seco' },
  { id: 'terno_dezena', nome: 'Terno Dezena' },
  { id: 'grupo', nome: 'Grupo' },
  { id: 'duque_grupo', nome: 'Duque Grupo' },
  { id: 'terno_grupo', nome: 'Terno Grupo' },
  { id: 'quadra_grupo', nome: 'Quadra Grupo' },
  { id: 'quina_grupo', nome: 'Quina Grupo' },
  { id: 'sena_grupo', nome: 'Sena Grupo' },
  { id: 'passe', nome: 'Passe' },
  { id: 'palpitao', nome: 'Palpitão' },
];

export function getModalidadeById(id: string): Modalidade | undefined {
  return MODALIDADES.find((m) => m.id === id);
}

export function getModalidadesByCategoria(categoria: string): Modalidade[] {
  return MODALIDADES.filter((m) => m.categoria === categoria);
}

export function getModalidadesByJogo(jogo: string): Modalidade[] {
  return MODALIDADES.filter((m) => m.jogo === jogo);
}

export function formatMultiplicador(multiplicador: number): string {
  if (multiplicador >= 1000) {
    return `${(multiplicador / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).replace(',', '.')}x`;
  }
  return `${multiplicador}x`;
}
