export interface Colocacao {
  id: string;
  nome: string;
  fator: number; // Fator que divide o multiplicador base da modalidade
  descricao?: string;
}

export const COLOCACOES: Colocacao[] = [
  // Prêmios individuais (multiplicador cheio)
  { id: '1_premio', nome: '1 PRÊMIO', fator: 1 },
  { id: '2_premio', nome: '2 PRÊMIO', fator: 1 },
  { id: '3_premio', nome: '3 PRÊMIO', fator: 1 },
  { id: '4_premio', nome: '4 PRÊMIO', fator: 1 },
  { id: '5_premio', nome: '5 PRÊMIO', fator: 1 },
  { id: '6_premio', nome: '6 PRÊMIO', fator: 1 },
  { id: '7_premio', nome: '7 PRÊMIO', fator: 1 },
  { id: '8_premio', nome: '8 PRÊMIO', fator: 1 },
  { id: '9_premio', nome: '9 PRÊMIO', fator: 1 },
  { id: '10_premio', nome: '10 PRÊMIO', fator: 1 },

  // Prêmios combinados com 1º (1/X = divide por X)
  { id: '1_5_premio', nome: '1/5 PRÊMIO', fator: 5 },
  { id: '1_10_premio', nome: '1/10 PRÊMIO', fator: 10 },
  { id: '1_e_1_5_premio', nome: '1 E 1/5 PRÊMIO', fator: 1 },
  { id: '1_2_premio', nome: '1/2 PRÊMIO', fator: 2 },
  { id: '1_3_premio', nome: '1/3 PRÊMIO', fator: 3 },
  { id: '1_4_premio', nome: '1/4 PRÊMIO', fator: 4 },
  { id: '1_6_premio', nome: '1/6 PRÊMIO', fator: 6 },
  { id: '1_7_premio', nome: '1/7 PRÊMIO', fator: 7 },
  { id: '1_8_premio', nome: '1/8 PRÊMIO', fator: 8 },
  { id: '1_9_premio', nome: '1/9 PRÊMIO', fator: 9 },

  // Combinações com 2º prêmio
  { id: '2_3_premio', nome: '2/3 PRÊMIO', fator: 2 },
  { id: '2_4_premio', nome: '2/4 PRÊMIO', fator: 3 },
  { id: '2_5_premio', nome: '2/5 PRÊMIO', fator: 4 },
  { id: '2_6_premio', nome: '2/6 PRÊMIO', fator: 5 },
  { id: '2_7_premio', nome: '2/7 PRÊMIO', fator: 6 },
  { id: '2_8_premio', nome: '2/8 PRÊMIO', fator: 7 },
  { id: '2_9_premio', nome: '2/9 PRÊMIO', fator: 8 },
  { id: '2_10_premio', nome: '2/10 PRÊMIO', fator: 9 },

  // Combinações com 3º prêmio
  { id: '3_4_premio', nome: '3/4 PRÊMIO', fator: 2 },
  { id: '3_5_premio', nome: '3/5 PRÊMIO', fator: 3 },
  { id: '3_6_premio', nome: '3/6 PRÊMIO', fator: 4 },
  { id: '3_7_premio', nome: '3/7 PRÊMIO', fator: 5 },
  { id: '3_8_premio', nome: '3/8 PRÊMIO', fator: 6 },
  { id: '3_9_premio', nome: '3/9 PRÊMIO', fator: 7 },
  { id: '3_10_premio', nome: '3/10 PRÊMIO', fator: 8 },

  // Combinações com 4º prêmio
  { id: '4_5_premio', nome: '4/5 PRÊMIO', fator: 2 },
  { id: '4_6_premio', nome: '4/6 PRÊMIO', fator: 3 },
  { id: '4_7_premio', nome: '4/7 PRÊMIO', fator: 4 },
  { id: '4_8_premio', nome: '4/8 PRÊMIO', fator: 5 },
  { id: '4_9_premio', nome: '4/9 PRÊMIO', fator: 6 },
  { id: '4_10_premio', nome: '4/10 PRÊMIO', fator: 7 },

  // Combinações com 5º prêmio
  { id: '5_6_premio', nome: '5/6 PRÊMIO', fator: 2 },
  { id: '5_7_premio', nome: '5/7 PRÊMIO', fator: 3 },
  { id: '5_8_premio', nome: '5/8 PRÊMIO', fator: 4 },
  { id: '5_9_premio', nome: '5/9 PRÊMIO', fator: 5 },
  { id: '5_10_premio', nome: '5/10 PRÊMIO', fator: 6 },

  // Combinações com 6º prêmio
  { id: '6_7_premio', nome: '6/7 PRÊMIO', fator: 2 },
  { id: '6_8_premio', nome: '6/8 PRÊMIO', fator: 3 },
  { id: '6_9_premio', nome: '6/9 PRÊMIO', fator: 4 },
  { id: '6_10_premio', nome: '6/10 PRÊMIO', fator: 5 },

  // Combinações com 7º prêmio
  { id: '7_8_premio', nome: '7/8 PRÊMIO', fator: 2 },
  { id: '7_9_premio', nome: '7/9 PRÊMIO', fator: 3 },
  { id: '7_10_premio', nome: '7/10 PRÊMIO', fator: 4 },

  // Combinações com 8º prêmio
  { id: '8_9_premio', nome: '8/9 PRÊMIO', fator: 2 },
  { id: '8_10_premio', nome: '8/10 PRÊMIO', fator: 3 },

  // Combinação com 9º prêmio
  { id: '9_10_premio', nome: '9/10 PRÊMIO', fator: 2 },
];

export function getColocacaoById(id: string): Colocacao | undefined {
  return COLOCACOES.find((c) => c.id === id);
}

// Calcula o multiplicador efetivo baseado na modalidade e colocação
export function calcularMultiplicadorEfetivo(
  multiplicadorBase: number,
  colocacaoId: string
): number {
  const colocacao = getColocacaoById(colocacaoId);
  if (!colocacao) return multiplicadorBase;
  return Math.floor(multiplicadorBase / colocacao.fator);
}
