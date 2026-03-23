import { createClient } from '@/lib/supabase/server';
import { getBingoHistory } from '@/lib/bingo/actions';
import { GameHistory } from '@/components/bingo/game-history';
import { redirect } from 'next/navigation';

export default async function BingoHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { games, total } = await getBingoHistory(1, 20);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-zinc-100">Historico de Bingo</h1>
      <GameHistory
        initialGames={games as any}
        initialTotal={total}
        currentUserId={user.id}
      />
    </div>
  );
}
