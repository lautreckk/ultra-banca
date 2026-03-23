const BOT_NAMES = [
  'Cleide', 'Neire', 'Claudiozinho', 'Dona Rosa', 'Seu Jorge',
  'Marlene', 'Tião', 'Vera Lucia', 'Zezinho', 'Sandra',
  'Fatima', 'Reginaldo', 'Luzia', 'Carlinhos', 'Aparecida',
  'Valdirene', 'Toninho', 'Irene', 'Ademir', 'Terezinha',
  'Josefa', 'Nilton', 'Creuza', 'Geraldo', 'Edna',
  'Marilene', 'Sebastião', 'Ivone', 'Djalma', 'Neuza',
  'Raimunda', 'Osvaldo', 'Dalva', 'Expedito', 'Sonia',
  'Conceição', 'Valdomiro', 'Lourdes', 'Arlindo', 'Sueli',
];

// Avatar seed IDs for consistent, realistic-looking profile photos
const BOT_AVATAR_SEEDS = [
  'maria42', 'joao88', 'ana55', 'pedro33', 'julia77',
  'carlos61', 'ferna29', 'lucas44', 'pat82', 'rafa19',
  'cami56', 'bruno73', 'bea91', 'diego38', 'lari65',
  'thiago47', 'mari84', 'feli22', 'ama68', 'gus95',
  'van53', 'rob36', 'isa71', 'marc48', 'let89',
  'andre27', 'nat64', 'edu41', 'gabi78', 'rod15',
  'sil52', 'ren69', 'val86', 'leo23', 'pau57',
  'ale34', 'dri74', 'fer92', 'san46', 'ric63',
];

/**
 * Generate deterministic bot players from a room ID.
 * Same room ID always produces the same bots (consistent across clients).
 */
export function generateBotsForRoom(roomId: string): { id: string; name: string; avatarUrl: string }[] {
  // Simple hash from room ID to determine count and names
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = ((hash << 5) - hash) + roomId.charCodeAt(i);
    hash |= 0;
  }

  const count = 5 + (Math.abs(hash) % 6); // 5-10 bots
  const startIndex = Math.abs(hash) % BOT_NAMES.length;

  const bots: { id: string; name: string; avatarUrl: string }[] = [];
  for (let i = 0; i < count; i++) {
    const nameIndex = (startIndex + i) % BOT_NAMES.length;
    const avatarSeed = BOT_AVATAR_SEEDS[(startIndex + i) % BOT_AVATAR_SEEDS.length];
    bots.push({
      id: `bot-${roomId.slice(0, 8)}-${i}`,
      name: BOT_NAMES[nameIndex],
      avatarUrl: `https://i.pravatar.cc/80?u=${avatarSeed}`,
    });
  }

  return bots;
}
