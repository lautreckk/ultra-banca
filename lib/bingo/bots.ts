const BOT_NAMES = [
  'Maria', 'João', 'Ana', 'Pedro', 'Juliana', 'Carlos',
  'Fernanda', 'Lucas', 'Patricia', 'Rafael', 'Camila', 'Bruno',
  'Beatriz', 'Diego', 'Larissa', 'Thiago', 'Mariana', 'Felipe',
  'Amanda', 'Gustavo', 'Vanessa', 'Roberto', 'Isabela', 'Marcelo',
  'Leticia', 'Andre', 'Natalia', 'Eduardo', 'Gabriela', 'Rodrigo',
];

/**
 * Generate deterministic bot players from a room ID.
 * Same room ID always produces the same bots (consistent across clients).
 */
export function generateBotsForRoom(roomId: string): { id: string; name: string }[] {
  // Simple hash from room ID to determine count and names
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = ((hash << 5) - hash) + roomId.charCodeAt(i);
    hash |= 0;
  }

  const count = 3 + (Math.abs(hash) % 4); // 3-6 bots
  const startIndex = Math.abs(hash) % BOT_NAMES.length;

  const bots: { id: string; name: string }[] = [];
  for (let i = 0; i < count; i++) {
    const nameIndex = (startIndex + i) % BOT_NAMES.length;
    bots.push({
      id: `bot-${roomId.slice(0, 8)}-${i}`,
      name: BOT_NAMES[nameIndex],
    });
  }

  return bots;
}
