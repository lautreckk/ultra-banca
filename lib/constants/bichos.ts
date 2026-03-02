export interface Bicho {
  numero: number;
  nome: string;
  dezenas: number[];
  emoji?: string;
}

export const BICHOS: Bicho[] = [
  { numero: 1, nome: 'Avestruz', dezenas: [1, 2, 3, 4], emoji: '🦤' },
  { numero: 2, nome: 'Aguia', dezenas: [5, 6, 7, 8], emoji: '🦅' },
  { numero: 3, nome: 'Burro', dezenas: [9, 10, 11, 12], emoji: '🫏' },
  { numero: 4, nome: 'Borboleta', dezenas: [13, 14, 15, 16], emoji: '🦋' },
  { numero: 5, nome: 'Cachorro', dezenas: [17, 18, 19, 20], emoji: '🐕' },
  { numero: 6, nome: 'Cabra', dezenas: [21, 22, 23, 24], emoji: '🐐' },
  { numero: 7, nome: 'Carneiro', dezenas: [25, 26, 27, 28], emoji: '🐏' },
  { numero: 8, nome: 'Camelo', dezenas: [29, 30, 31, 32], emoji: '🐪' },
  { numero: 9, nome: 'Cobra', dezenas: [33, 34, 35, 36], emoji: '🐍' },
  { numero: 10, nome: 'Coelho', dezenas: [37, 38, 39, 40], emoji: '🐰' },
  { numero: 11, nome: 'Cavalo', dezenas: [41, 42, 43, 44], emoji: '🐴' },
  { numero: 12, nome: 'Elefante', dezenas: [45, 46, 47, 48], emoji: '🐘' },
  { numero: 13, nome: 'Galo', dezenas: [49, 50, 51, 52], emoji: '🐓' },
  { numero: 14, nome: 'Gato', dezenas: [53, 54, 55, 56], emoji: '🐱' },
  { numero: 15, nome: 'Jacare', dezenas: [57, 58, 59, 60], emoji: '🐊' },
  { numero: 16, nome: 'Leao', dezenas: [61, 62, 63, 64], emoji: '🦁' },
  { numero: 17, nome: 'Macaco', dezenas: [65, 66, 67, 68], emoji: '🐒' },
  { numero: 18, nome: 'Porco', dezenas: [69, 70, 71, 72], emoji: '🐷' },
  { numero: 19, nome: 'Pavao', dezenas: [73, 74, 75, 76], emoji: '🦚' },
  { numero: 20, nome: 'Peru', dezenas: [77, 78, 79, 80], emoji: '🦃' },
  { numero: 21, nome: 'Touro', dezenas: [81, 82, 83, 84], emoji: '🐂' },
  { numero: 22, nome: 'Tigre', dezenas: [85, 86, 87, 88], emoji: '🐅' },
  { numero: 23, nome: 'Urso', dezenas: [89, 90, 91, 92], emoji: '🐻' },
  { numero: 24, nome: 'Veado', dezenas: [93, 94, 95, 96], emoji: '🦌' },
  { numero: 25, nome: 'Vaca', dezenas: [97, 98, 99, 0], emoji: '🐄' },
];

export function getBichoByDezena(dezena: number): Bicho | undefined {
  const normalizedDezena = dezena % 100;
  return BICHOS.find((b) => b.dezenas.includes(normalizedDezena));
}

export function getBichoByNumero(numero: number): Bicho | undefined {
  return BICHOS.find((b) => b.numero === numero);
}
