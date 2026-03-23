import { createClient } from '@/lib/supabase/server';
import { getCurrentGame } from '@/lib/bingo/actions';
import { GameBoard } from '@/components/bingo/game-board';
import { redirect } from 'next/navigation';

export default async function BingoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const room = await getCurrentGame();

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <p className="text-sm text-zinc-400">Erro ao carregar o jogo. Tente novamente.</p>
      </div>
    );
  }

  return <GameBoard initialRoom={room} currentUserId={user.id} />;
}
