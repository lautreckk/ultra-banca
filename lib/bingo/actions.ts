'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { joinGameSchema, tickGameSchema, callBingoSchema } from '@/lib/bingo/validations';
import { generateCartela, validateBingo } from '@/lib/bingo/cartela';
import { checkPhaseCompletion, pickPhaseWinner } from '@/lib/bingo/phases';
import type { BingoRoomWithPlayers, TickResult } from '@/lib/bingo/types';

const ENTRY_FEE = 2.00;
const DRAW_SPEED = 5; // seconds
const LOBBY_DURATION = 60; // seconds between games

// ─── Get or create the current game ───────────────────────────────────────────

export async function getCurrentGame(): Promise<BingoRoomWithPlayers | null> {
  const admin = createAdminClient();

  // Find the latest active game (waiting or playing)
  const { data: activeRoom } = await admin
    .from('bingo_rooms')
    .select('*, bingo_players(*, profiles(nome))')
    .in('status', ['waiting', 'playing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (activeRoom) {
    return formatRoom(activeRoom);
  }

  // Check the latest finished game
  const { data: lastFinished } = await admin
    .from('bingo_rooms')
    .select('finished_at')
    .eq('status', 'finished')
    .order('finished_at', { ascending: false })
    .limit(1)
    .single();

  // If last game finished less than 10 seconds ago, wait (results display)
  if (lastFinished?.finished_at) {
    const finishedAt = new Date(lastFinished.finished_at).getTime();
    const now = Date.now();
    if (now - finishedAt < 10_000) {
      const { data: finishedRoom } = await admin
        .from('bingo_rooms')
        .select('*, bingo_players(*, profiles(nome))')
        .eq('status', 'finished')
        .order('finished_at', { ascending: false })
        .limit(1)
        .single();
      if (finishedRoom) return formatRoom(finishedRoom);
    }
  }

  // Create a new game
  return createNewGame();
}

async function createNewGame(): Promise<BingoRoomWithPlayers | null> {
  const admin = createAdminClient();

  const startsAt = new Date(Date.now() + LOBBY_DURATION * 1000).toISOString();

  const { data: room, error } = await admin
    .from('bingo_rooms')
    .insert({
      host_id: null,
      status: 'waiting',
      entry_fee: ENTRY_FEE,
      draw_speed: DRAW_SPEED,
      game_mode: 'casual',
      max_players: 50,
      starts_at: startsAt,
      drawn_numbers: [],
      total_pot: 0,
    })
    .select('*')
    .single();

  if (error || !room) return null;

  return {
    ...room,
    bingo_players: [],
    player_count: 0,
  } as unknown as BingoRoomWithPlayers;
}

// ─── Join the current game ────────────────────────────────────────────────────

export async function joinCurrentGame(input: unknown) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nao autenticado' };

  const parsed = joinGameSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Dados invalidos' };
  const { roomId } = parsed.data;

  const admin = createAdminClient();

  // Fetch room
  const { data: room } = await admin
    .from('bingo_rooms')
    .select('*')
    .eq('id', roomId)
    .eq('status', 'waiting')
    .single();

  if (!room) return { success: false, error: 'Jogo nao encontrado ou ja iniciado' };

  // Check not already joined
  const { data: existing } = await admin
    .from('bingo_players')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single();

  if (existing) return { success: true, alreadyJoined: true };

  // Debit entry fee (direct balance update to avoid fn_change_balance overload issue)
  try {
    // 1. Check current balance
    const { data: profile } = await admin
      .from('profiles')
      .select('saldo, nome')
      .eq('id', user.id)
      .single();

    if (!profile) return { success: false, error: 'Perfil nao encontrado' };

    const currentBalance = profile.saldo ?? 0;
    if (currentBalance < room.entry_fee) {
      return { success: false, error: 'Saldo insuficiente' };
    }

    const newBalance = currentBalance - room.entry_fee;

    // 2. Update balance (CHECK constraint prevents negative)
    const { error: balanceError } = await admin
      .from('profiles')
      .update({ saldo: newBalance })
      .eq('id', user.id);

    if (balanceError) {
      console.error('[BINGO] Balance update error:', JSON.stringify(balanceError));
      return { success: false, error: 'Erro ao debitar saldo' };
    }

    // 3. Generate cartela and insert player
    const cartela = generateCartela();

    const { error: insertError } = await admin.from('bingo_players').insert({
      room_id: roomId,
      user_id: user.id,
      cartela,
      entry_tx_id: null,
      is_bot: false,
    });

    if (insertError) {
      console.error('[BINGO] Insert player error:', JSON.stringify(insertError));
      // Refund
      await admin.from('profiles').update({ saldo: currentBalance }).eq('id', user.id);
      return { success: false, error: 'Erro ao registrar jogador' };
    }

    // 5. Update pot
    await admin
      .from('bingo_rooms')
      .update({ total_pot: room.total_pot + room.entry_fee })
      .eq('id', roomId);

    // 6. Count total players
    const { count } = await admin
      .from('bingo_players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    // 7. Broadcast
    await admin.channel(`bingo:room:${roomId}`).send({
      type: 'broadcast',
      event: 'player_joined',
      payload: {
        userId: user.id,
        playerName: profile.nome || 'Jogador',
        playerCount: count ?? 0,
      },
    });

    return { success: true, cartela };
  } catch (err) {
    console.error('[BINGO] joinCurrentGame exception:', err);
    return { success: false, error: 'Erro interno ao processar pagamento' };
  }
}

// ─── Tick game (handles start + draws, called by any client) ──────────────────

export async function tickGame(input: unknown): Promise<TickResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { action: 'none', room: null };

  const parsed = tickGameSchema.safeParse(input);
  if (!parsed.success) return { action: 'none', room: null };
  const { roomId } = parsed.data;

  const admin = createAdminClient();

  // Fetch room
  const { data: room } = await admin
    .from('bingo_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (!room) return { action: 'none', room: null };

  const now = new Date();

  // ── WAITING → PLAYING transition ──
  if (room.status === 'waiting' && room.starts_at) {
    const startsAt = new Date(room.starts_at);
    if (now >= startsAt) {
      const firstDrawAt = new Date(now.getTime() + room.draw_speed * 1000).toISOString();

      const { data: updated } = await admin
        .from('bingo_rooms')
        .update({
          status: 'playing',
          started_at: now.toISOString(),
          next_draw_at: firstDrawAt,
        })
        .eq('id', roomId)
        .eq('status', 'waiting')
        .select('id')
        .single();

      if (updated) {
        await admin.channel(`bingo:room:${roomId}`).send({
          type: 'broadcast',
          event: 'game_started',
          payload: { startedAt: now.toISOString() },
        });

        return { action: 'game_started', room: null };
      }

      return { action: 'already_handled', room: null };
    }
  }

  // ── PLAYING: draw next number ──
  if (room.status === 'playing' && room.next_draw_at) {
    const nextDrawAt = new Date(room.next_draw_at);
    if (now >= nextDrawAt) {
      const drawnNumbers: number[] = (room.drawn_numbers as number[]) || [];

      // All 90 drawn — end game
      if (drawnNumbers.length >= 90) {
        await admin
          .from('bingo_rooms')
          .update({ status: 'finished', finished_at: now.toISOString() })
          .eq('id', roomId)
          .eq('status', 'playing');

        await admin.channel(`bingo:room:${roomId}`).send({
          type: 'broadcast',
          event: 'game_over',
          payload: {},
        });

        return { action: 'game_over', room: null };
      }

      // Pick random undrawn number
      const available = Array.from({ length: 90 }, (_, i) => i + 1)
        .filter(n => !drawnNumbers.includes(n));
      const number = available[Math.floor(Math.random() * available.length)];
      const newDrawn = [...drawnNumbers, number];

      const newNextDrawAt = new Date(now.getTime() + room.draw_speed * 1000).toISOString();

      // Atomic update: use next_draw_at as concurrency guard
      const { data: updated } = await admin
        .from('bingo_rooms')
        .update({
          drawn_numbers: newDrawn,
          current_number: number,
          next_draw_at: newNextDrawAt,
        })
        .eq('id', roomId)
        .eq('status', 'playing')
        .eq('next_draw_at', room.next_draw_at)
        .select('id')
        .single();

      if (updated) {
        // Check for phase completion
        const completedPhase = checkPhaseCompletion(roomId, newDrawn.length);
        let phaseWinner = null;

        if (completedPhase) {
          phaseWinner = pickPhaseWinner(roomId, completedPhase, room.total_pot);

          // If KENO phase completed, end the game
          if (completedPhase === 'keno') {
            await admin
              .from('bingo_rooms')
              .update({ status: 'finished', finished_at: now.toISOString() })
              .eq('id', roomId);
          }
        }

        // Broadcast number + phase winner (if any)
        await admin.channel(`bingo:room:${roomId}`).send({
          type: 'broadcast',
          event: 'number_drawn',
          payload: {
            number,
            drawnNumbers: newDrawn,
            drawIndex: newDrawn.length,
            phaseWinner,
          },
        });

        // If KENO completed, also broadcast game_over
        if (completedPhase === 'keno') {
          await admin.channel(`bingo:room:${roomId}`).send({
            type: 'broadcast',
            event: 'game_over',
            payload: { phaseEnd: true },
          });
        }

        return {
          action: completedPhase === 'keno' ? 'game_over' : 'number_drawn',
          room: null,
          number,
          drawnNumbers: newDrawn,
          drawIndex: newDrawn.length,
        };
      }

      return { action: 'already_handled', room: null };
    }
  }

  return { action: 'none', room: null };
}

// ─── Call BINGO ───────────────────────────────────────────────────────────────

export async function callBingo(input: unknown) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nao autenticado' };

  const parsed = callBingoSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Dados invalidos' };
  const { roomId } = parsed.data;

  const admin = createAdminClient();

  // Fetch room
  const { data: room } = await admin
    .from('bingo_rooms')
    .select('*')
    .eq('id', roomId)
    .eq('status', 'playing')
    .single();

  if (!room) return { success: false, error: 'Jogo nao encontrado ou nao esta ativo' };

  // Fetch player's cartela
  const { data: player } = await admin
    .from('bingo_players')
    .select('cartela')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single();

  if (!player) return { success: false, error: 'Voce nao esta neste jogo' };

  // Validate bingo
  const drawnNumbers: number[] = (room.drawn_numbers as number[]) || [];
  const isValid = validateBingo(player.cartela, drawnNumbers);

  if (!isValid) {
    return { success: false, error: 'Bingo invalido! Confira sua cartela.' };
  }

  // Atomic winner update
  const { data: updatedRoom, error: updateError } = await admin
    .from('bingo_rooms')
    .update({
      status: 'finished',
      winner_id: user.id,
      finished_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .eq('status', 'playing')
    .select('id')
    .single();

  if (updateError || !updatedRoom) {
    return { success: false, error: 'Outro jogador ja ganhou!' };
  }

  // Calculate prize (KENO portion: 60% of pot after 10% house fee)
  const houseFee = 0.10;
  const prize = Math.round(room.total_pot * (1 - houseFee) * 0.60 * 100) / 100;

  if (prize > 0) {
    // Credit winner balance directly
    const { data: winnerProfile } = await admin
      .from('profiles')
      .select('saldo')
      .eq('id', user.id)
      .single();

    const winnerBalance = (winnerProfile?.saldo ?? 0) + prize;
    await admin.from('profiles').update({ saldo: winnerBalance }).eq('id', user.id);
  }

  await admin
    .from('bingo_players')
    .update({ prize })
    .eq('room_id', roomId)
    .eq('user_id', user.id);

  const { data: profile } = await admin
    .from('profiles')
    .select('nome')
    .eq('id', user.id)
    .single();

  const winnerName = profile?.nome || 'Jogador';

  await admin.channel(`bingo:room:${roomId}`).send({
    type: 'broadcast',
    event: 'bingo_winner',
    payload: { winnerId: user.id, winnerName, prize },
  });

  return { success: true, prize, winnerName };
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getBingoHistory(page = 1, limit = 20) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { games: [], total: 0 };

  const admin = createAdminClient();
  const offset = (page - 1) * limit;

  const { data: games, count } = await admin
    .from('bingo_players')
    .select(`
      id, prize, joined_at,
      bingo_rooms!inner(
        id, status, entry_fee, draw_speed,
        total_pot, winner_id, started_at, finished_at
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_bot', false)
    .eq('bingo_rooms.status', 'finished')
    .order('joined_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { games: games || [], total: count || 0 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRoom(room: Record<string, unknown>): BingoRoomWithPlayers {
  const players = (room.bingo_players as Record<string, unknown>[]) || [];
  return {
    ...room,
    bingo_players: players.map((p) => ({
      ...p,
      profiles: (p.profiles as { nome: string }) || { nome: 'Jogador' },
    })),
    player_count: players.length,
  } as unknown as BingoRoomWithPlayers;
}
