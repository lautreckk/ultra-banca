export interface Sonho {
  id: string;
  palavra: string;
  descricao: string;
  bicho: string;
  bichoEmoji: string;
  grupo: number;
}

// Mapeamento de sonhos para bichos do jogo do bicho
export const SONHOS: Sonho[] = [
  { id: 'cavalo', palavra: 'CAVALO', descricao: 'Sonhar com cavalo agitado ou espantado simboliza que enfrentará problemas de relacionamento com seu par. Se o cavalo no seu sonho é um animal tranqüilo indica relacionamento muito satisfatório', bicho: 'COBRA', bichoEmoji: '🐍', grupo: 9 },
  { id: 'cabelo', palavra: 'CABELO', descricao: 'Sonhar com cabelo indica vaidade e preocupação com a aparência. Cabelo bonito significa sucesso, cabelo caindo pode indicar perdas.', bicho: 'LEÃO', bichoEmoji: '🦁', grupo: 16 },
  { id: 'camaleao', palavra: 'CAMALEÃO', descricao: 'Sonhar com camaleão indica adaptabilidade e mudanças em sua vida. Pode significar que você precisa se adaptar a novas situações.', bicho: 'JACARÉ', bichoEmoji: '🐊', grupo: 15 },
  { id: 'camelo', palavra: 'CAMELO', descricao: 'Sonhar com camelo simboliza resistência e perseverança. Indica que você conseguirá superar dificuldades com paciência.', bicho: 'CAMELO', bichoEmoji: '🐪', grupo: 8 },
  { id: 'carvalho', palavra: 'CARVALHO', descricao: 'Sonhar com carvalho representa força, estabilidade e longevidade. Indica momentos de segurança e proteção.', bicho: 'ELEFANTE', bichoEmoji: '🐘', grupo: 12 },
  { id: 'cachorro', palavra: 'CACHORRO', descricao: 'Sonhar com cachorro representa lealdade e amizade. Cachorro bravo pode indicar traição de amigo próximo.', bicho: 'CACHORRO', bichoEmoji: '🐕', grupo: 5 },
  { id: 'cobra', palavra: 'COBRA', descricao: 'Sonhar com cobra indica traição ou inveja ao seu redor. Mate a cobra no sonho significa vitória sobre inimigos.', bicho: 'COBRA', bichoEmoji: '🐍', grupo: 9 },
  { id: 'gato', palavra: 'GATO', descricao: 'Sonhar com gato pode indicar falsidade e traição. Gato preto traz sorte no jogo.', bicho: 'GATO', bichoEmoji: '🐱', grupo: 14 },
  { id: 'leao', palavra: 'LEÃO', descricao: 'Sonhar com leão representa poder e autoridade. Indica que você terá força para enfrentar desafios.', bicho: 'LEÃO', bichoEmoji: '🦁', grupo: 16 },
  { id: 'elefante', palavra: 'ELEFANTE', descricao: 'Sonhar com elefante simboliza memória, sabedoria e boa sorte. Grandes conquistas estão por vir.', bicho: 'ELEFANTE', bichoEmoji: '🐘', grupo: 12 },
  { id: 'aguia', palavra: 'ÁGUIA', descricao: 'Sonhar com águia indica liberdade e visão clara do futuro. Sucesso nos negócios.', bicho: 'ÁGUIA', bichoEmoji: '🦅', grupo: 2 },
  { id: 'avestruz', palavra: 'AVESTRUZ', descricao: 'Sonhar com avestruz pode indicar que está fugindo de problemas. Enfrente suas dificuldades.', bicho: 'AVESTRUZ', bichoEmoji: '🦢', grupo: 1 },
  { id: 'burro', palavra: 'BURRO', descricao: 'Sonhar com burro indica trabalho árduo e perseverança. Recompensas virão com esforço.', bicho: 'BURRO', bichoEmoji: '🫏', grupo: 3 },
  { id: 'borboleta', palavra: 'BORBOLETA', descricao: 'Sonhar com borboleta simboliza transformação e renovação. Mudanças positivas estão chegando.', bicho: 'BORBOLETA', bichoEmoji: '🦋', grupo: 4 },
  { id: 'coelho', palavra: 'COELHO', descricao: 'Sonhar com coelho indica fertilidade e abundância. Sorte no amor e nos negócios.', bicho: 'COELHO', bichoEmoji: '🐰', grupo: 10 },
  { id: 'peru', palavra: 'PERU', descricao: 'Sonhar com peru indica celebração e fartura. Boas notícias na família.', bicho: 'PERU', bichoEmoji: '🦃', grupo: 20 },
  { id: 'macaco', palavra: 'MACACO', descricao: 'Sonhar com macaco indica brincadeiras e diversão, mas também pode significar falsidade.', bicho: 'MACACO', bichoEmoji: '🐒', grupo: 17 },
  { id: 'porco', palavra: 'PORCO', descricao: 'Sonhar com porco simboliza prosperidade e abundância financeira. Bons negócios à vista.', bicho: 'PORCO', bichoEmoji: '🐷', grupo: 18 },
  { id: 'pavao', palavra: 'PAVÃO', descricao: 'Sonhar com pavão indica vaidade e ostentação. Cuidado com a arrogância.', bicho: 'PAVÃO', bichoEmoji: '🦚', grupo: 19 },
  { id: 'touro', palavra: 'TOURO', descricao: 'Sonhar com touro representa força e determinação. Momento de agir com firmeza.', bicho: 'TOURO', bichoEmoji: '🐂', grupo: 21 },
  { id: 'tigre', palavra: 'TIGRE', descricao: 'Sonhar com tigre indica coragem e poder. Você vencerá seus adversários.', bicho: 'TIGRE', bichoEmoji: '🐅', grupo: 22 },
  { id: 'urso', palavra: 'URSO', descricao: 'Sonhar com urso simboliza proteção e força interior. Momento de introspecção.', bicho: 'URSO', bichoEmoji: '🐻', grupo: 23 },
  { id: 'veado', palavra: 'VEADO', descricao: 'Sonhar com veado indica sensibilidade e gentileza. Paz interior e harmonia.', bicho: 'VEADO', bichoEmoji: '🦌', grupo: 24 },
  { id: 'vaca', palavra: 'VACA', descricao: 'Sonhar com vaca simboliza fertilidade e abundância. Prosperidade na família.', bicho: 'VACA', bichoEmoji: '🐄', grupo: 25 },
  { id: 'dinheiro', palavra: 'DINHEIRO', descricao: 'Sonhar com dinheiro pode indicar preocupações financeiras ou prosperidade chegando.', bicho: 'BORBOLETA', bichoEmoji: '🦋', grupo: 4 },
  { id: 'agua', palavra: 'ÁGUA', descricao: 'Sonhar com água limpa indica purificação e renovação. Água suja indica problemas.', bicho: 'PEIXE', bichoEmoji: '🐟', grupo: 6 },
  { id: 'fogo', palavra: 'FOGO', descricao: 'Sonhar com fogo indica paixão e transformação. Cuidado com a raiva.', bicho: 'DRAGÃO', bichoEmoji: '🐉', grupo: 7 },
  { id: 'morte', palavra: 'MORTE', descricao: 'Sonhar com morte não é mau presságio, indica fim de ciclos e novos começos.', bicho: 'CARNEIRO', bichoEmoji: '🐏', grupo: 7 },
  { id: 'casamento', palavra: 'CASAMENTO', descricao: 'Sonhar com casamento indica união e compromisso. Mudanças importantes na vida.', bicho: 'PAVÃO', bichoEmoji: '🦚', grupo: 19 },
  { id: 'bebe', palavra: 'BEBÊ', descricao: 'Sonhar com bebê indica novos projetos e inocência. Novos começos.', bicho: 'COELHO', bichoEmoji: '🐰', grupo: 10 },
];

export function searchSonhos(query: string): Sonho[] {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return SONHOS.filter(sonho => {
    const normalizedPalavra = sonho.palavra.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedPalavra.includes(normalizedQuery) || normalizedPalavra.startsWith(normalizedQuery);
  }).slice(0, 5);
}

export function getSonhoByPalavra(palavra: string): Sonho | undefined {
  return SONHOS.find(s => s.palavra.toLowerCase() === palavra.toLowerCase());
}

// Gera números aleatórios baseados no grupo do bicho
export function gerarNumerosDoSonho(grupo: number): { grupo: number; dezena: number; centena: number; milhar: number } {
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
