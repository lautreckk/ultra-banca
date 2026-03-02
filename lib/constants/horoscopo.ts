export interface Signo {
  id: string;
  nome: string;
  emoji: string;
  dataInicio: string;
  dataFim: string;
  elemento: string;
  bicho: string;
  bichoEmoji: string;
  grupo: number;
}

export const SIGNOS: Signo[] = [
  { id: 'aries', nome: 'Áries', emoji: '♈', dataInicio: '21/03', dataFim: '19/04', elemento: 'Fogo', bicho: 'CARNEIRO', bichoEmoji: '🐏', grupo: 7 },
  { id: 'touro', nome: 'Touro', emoji: '♉', dataInicio: '20/04', dataFim: '20/05', elemento: 'Terra', bicho: 'CABRA', bichoEmoji: '🐐', grupo: 6 },
  { id: 'gemeos', nome: 'Gêmeos', emoji: '♊', dataInicio: '21/05', dataFim: '20/06', elemento: 'Ar', bicho: 'MACACO', bichoEmoji: '🐒', grupo: 17 },
  { id: 'cancer', nome: 'Câncer', emoji: '♋', dataInicio: '21/06', dataFim: '22/07', elemento: 'Água', bicho: 'CARANGUEJO', bichoEmoji: '🦀', grupo: 10 },
  { id: 'leao', nome: 'Leão', emoji: '♌', dataInicio: '23/07', dataFim: '22/08', elemento: 'Fogo', bicho: 'LEÃO', bichoEmoji: '🦁', grupo: 16 },
  { id: 'virgem', nome: 'Virgem', emoji: '♍', dataInicio: '23/08', dataFim: '22/09', elemento: 'Terra', bicho: 'GATO', bichoEmoji: '🐱', grupo: 14 },
  { id: 'libra', nome: 'Libra', emoji: '♎', dataInicio: '23/09', dataFim: '22/10', elemento: 'Ar', bicho: 'BORBOLETA', bichoEmoji: '🦋', grupo: 4 },
  { id: 'escorpiao', nome: 'Escorpião', emoji: '♏', dataInicio: '23/10', dataFim: '21/11', elemento: 'Água', bicho: 'COBRA', bichoEmoji: '🐍', grupo: 9 },
  { id: 'sagitario', nome: 'Sagitário', emoji: '♐', dataInicio: '22/11', dataFim: '21/12', elemento: 'Fogo', bicho: 'CAVALO', bichoEmoji: '🐴', grupo: 11 },
  { id: 'capricornio', nome: 'Capricórnio', emoji: '♑', dataInicio: '22/12', dataFim: '19/01', elemento: 'Terra', bicho: 'CABRA', bichoEmoji: '🐐', grupo: 6 },
  { id: 'aquario', nome: 'Aquário', emoji: '♒', dataInicio: '20/01', dataFim: '18/02', elemento: 'Ar', bicho: 'ÁGUIA', bichoEmoji: '🦅', grupo: 2 },
  { id: 'peixes', nome: 'Peixes', emoji: '♓', dataInicio: '19/02', dataFim: '20/03', elemento: 'Água', bicho: 'PEIXE', bichoEmoji: '🐟', grupo: 6 },
];

// Previsões genéricas que serão selecionadas aleatoriamente baseado no dia
const PREVISOES = [
  'A manhã favorece decisões práticas sobre trabalho e finanças. O trígono da Lua com o Sol oferece visão estratégica e uma sensação de ordem interna. Conforme o dia avança, conversas profissionais fluem com leveza e podem abrir caminhos inesperados.',
  'Hoje é um dia favorável para novos começos. A energia astral indica que projetos iniciados agora terão boa continuidade. Aproveite para fazer contatos importantes.',
  'O momento pede cautela nas decisões financeiras. Analise bem antes de agir. No amor, surpresas agradáveis podem surgir no final do dia.',
  'Sua criatividade está em alta hoje. Use isso a seu favor em projetos pessoais e profissionais. Cuidado com discussões desnecessárias à tarde.',
  'Dia propício para resolver pendências do passado. A comunicação flui bem, facilitando acordos e negociações. Cuide da saúde.',
  'As estrelas indicam um dia de reflexão e planejamento. Evite tomar decisões impulsivas. O período da noite traz boas energias para o romance.',
  'Momento de expansão e crescimento pessoal. Oportunidades surgirão de onde menos espera. Mantenha-se aberto a novas possibilidades.',
  'A intuição está aguçada hoje. Confie nos seus instintos para tomar decisões importantes. Bom dia para atividades em grupo.',
  'Foco no trabalho trará recompensas. Sua dedicação será reconhecida. No amor, demonstre mais seus sentimentos.',
  'Dia de energia renovada e disposição. Aproveite para começar uma atividade física ou cuidar mais de si mesmo. Finanças em alta.',
  'A harmonia prevalece nos relacionamentos hoje. Bom momento para resolver conflitos antigos. Cuidado com gastos impulsivos.',
  'Sua capacidade de liderança está em destaque. Assuma responsabilidades com confiança. Surpresas agradáveis no campo afetivo.',
];

export function getSignoById(id: string): Signo | undefined {
  return SIGNOS.find(s => s.id === id);
}

export function getPrevisaoDoDia(signoId: string): string {
  // Usa a data atual e o signo para gerar um índice "aleatório" mas consistente para o dia
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const signoIndex = SIGNOS.findIndex(s => s.id === signoId);
  const index = (dayOfYear + signoIndex) % PREVISOES.length;
  return PREVISOES[index];
}

export function gerarNumerosDoHoroscopo(grupo: number): { grupo: number; dezena: number; centena: number; milhar: number } {
  // O grupo determina as dezenas finais (cada grupo tem 4 dezenas)
  const dezenaBase = ((grupo - 1) * 4) + 1;
  const dezenaOffset = Math.floor(Math.random() * 4);
  const dezena = dezenaBase + dezenaOffset;

  // Centena: número aleatório de 3 dígitos terminando na dezena
  const centenaPrefix = Math.floor(Math.random() * 10);
  const centena = centenaPrefix * 100 + dezena;

  // Milhar: número aleatório de 4 dígitos terminando na centena
  const milharPrefix = Math.floor(Math.random() * 10);
  const milhar = milharPrefix * 1000 + centena;

  return {
    grupo,
    dezena,
    centena,
    milhar,
  };
}
