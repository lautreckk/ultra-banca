'use client';

interface PlayerListProps {
  players: { id: string; name: string }[];
}

const AVATAR_COLORS = [
  'from-green-500 to-green-700',
  'from-blue-500 to-blue-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-purple-500 to-purple-700',
  'from-cyan-500 to-cyan-700',
  'from-red-500 to-red-700',
  'from-indigo-500 to-indigo-700',
];

export function PlayerList({ players }: PlayerListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] text-purple-400 font-black uppercase tracking-[0.15em]">
          Jogadores
        </h3>
        <span className="text-[10px] text-white/30 font-bold">{players.length}</span>
      </div>
      <div className="space-y-1.5">
        {players.map((player, i) => (
          <div key={player.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/3 border border-white/5">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-[10px] font-black text-white`}>
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-white/70">{player.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
