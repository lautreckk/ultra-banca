// Loterias específicas da Fazendinha
export interface FazendinhaLoteria {
  id: string;
  nome: string;
  horario: string;
}

export const FAZENDINHA_LOTERIAS: FazendinhaLoteria[] = [
  { id: 'lt_look_23hs', nome: 'LT LOOK 23HS', horario: '23:19' },
  { id: 'lt_nacional_23hs', nome: 'LT NACIONAL 23HS', horario: '22:59' },
];

// Modalidades da Fazendinha com seus multiplicadores
export interface FazendinhaModalidade {
  id: string;
  nome: string;
  multiplicador: number;
  digitos: number;
  maxNumero: number;
}

export const FAZENDINHA_MODALIDADES: FazendinhaModalidade[] = [
  { id: 'dezena', nome: 'DEZENA', multiplicador: 82, digitos: 2, maxNumero: 99 },
  { id: 'grupo', nome: 'GRUPO', multiplicador: 21, digitos: 2, maxNumero: 25 },
  { id: 'centena', nome: 'CENTENA', multiplicador: 820, digitos: 3, maxNumero: 999 },
];

// Valores rapidos disponiveis por modalidade
export const FAZENDINHA_VALORES_DEZENA = [1, 3, 5, 7, 10, 15, 20];
export const FAZENDINHA_VALORES_GRUPO = [1, 2, 3, 5, 7, 10, 15, 20];
export const FAZENDINHA_VALORES_CENTENA = [1, 3, 5, 7, 10, 15, 20];

export function getValoresByModalidade(modalidadeId: string): number[] {
  switch (modalidadeId) {
    case 'grupo':
      return FAZENDINHA_VALORES_GRUPO;
    case 'dezena':
      return FAZENDINHA_VALORES_DEZENA;
    case 'centena':
      return FAZENDINHA_VALORES_CENTENA;
    default:
      return FAZENDINHA_VALORES_DEZENA;
  }
}

export function getModalidadeById(id: string): FazendinhaModalidade | undefined {
  return FAZENDINHA_MODALIDADES.find((m) => m.id === id);
}

export function getLoteriaById(id: string): FazendinhaLoteria | undefined {
  return FAZENDINHA_LOTERIAS.find((l) => l.id === id);
}

export function formatPremio(valor: number, multiplicador: number): string {
  const premio = valor * multiplicador;
  return premio.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}
