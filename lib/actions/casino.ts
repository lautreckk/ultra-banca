'use server';

import { createClient } from '@/lib/supabase/server';
import { getPlatformId } from '@/lib/utils/platform';

const PLAYFIVER_API_BASE = 'https://api.playfivers.com/api/v2';

export interface CasinoGame {
  game_code: string;
  game_name: string;
  provider: string;
  image_url: string | null;
  original: boolean;
}

export interface CasinoTransaction {
  id: string;
  txn_id: string;
  round_id: string | null;
  txn_type: string;
  provider_code: string | null;
  game_code: string | null;
  game_type: string | null;
  bet: number;
  win: number;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

async function getConfig() {
  const supabase = await createClient();
  const platformId = await getPlatformId();

  const { data: config } = await supabase
    .from('playfiver_config')
    .select('agent_token, secret_key, callback_url, ativo')
    .eq('platform_id', platformId)
    .single();

  return { config, platformId, supabase };
}

/**
 * Launch a casino game - returns URL to open in new tab
 */
export async function launchGame(
  gameCode: string,
  provider: string,
  gameOriginal: boolean
): Promise<{ success: boolean; launch_url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { config } = await getConfig();
    if (!config || !config.ativo) return { success: false, error: 'Cassino não disponível' };

    const response = await fetch(`${PLAYFIVER_API_BASE}/game_launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentToken: config.agent_token,
        secretKey: config.secret_key,
        user_code: user.id,
        provider_code: provider,
        game_code: gameCode,
        game_original: gameOriginal,
        lang: 'pt',
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status === 0) {
      console.error('[CASINO] Launch error:', data);
      return { success: false, error: data.msg || 'Erro ao abrir jogo' };
    }

    return { success: true, launch_url: data.launch_url };
  } catch (error) {
    console.error('[CASINO] Launch error:', error);
    return { success: false, error: 'Erro ao abrir jogo' };
  }
}

/**
 * Get games from cache, refresh if stale (>24h)
 */
export async function getGames(
  providerFilter?: string
): Promise<{ success: boolean; games?: CasinoGame[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if cache is stale
    const { data: latestCache } = await supabase
      .from('playfiver_games_cache')
      .select('cached_at')
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();

    const isStale = !latestCache ||
      (new Date().getTime() - new Date(latestCache.cached_at).getTime()) > 24 * 60 * 60 * 1000;

    if (isStale) {
      await refreshGamesCache();
    }

    let query = supabase
      .from('playfiver_games_cache')
      .select('game_code, game_name, provider, image_url, original')
      .order('game_name', { ascending: true });

    if (providerFilter) {
      query = query.eq('provider', providerFilter);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, games: data || [] };
  } catch (error) {
    console.error('[CASINO] Get games error:', error);
    return { success: false, error: 'Erro ao buscar jogos' };
  }
}

/**
 * Get distinct providers from cache
 */
export async function getProviders(): Promise<{ success: boolean; providers?: string[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('playfiver_games_cache')
      .select('provider')
      .order('provider', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const providers = [...new Set((data || []).map(d => d.provider))];
    return { success: true, providers };
  } catch (error) {
    console.error('[CASINO] Get providers error:', error);
    return { success: false, error: 'Erro ao buscar provedores' };
  }
}

/**
 * Refresh games cache from PlayFivers API
 */
export async function refreshGamesCache(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { config, supabase } = await getConfig();
    if (!config) return { success: false, error: 'Configuração do cassino não encontrada' };

    const url = `${PLAYFIVER_API_BASE}/games?agent_code=${config.agent_token}&agent_secret=${config.secret_key}`;
    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok || data.status === 0) {
      console.error('[CASINO] Games fetch error:', data);
      return { success: false, error: data.msg || 'Erro ao buscar jogos da API' };
    }

    const games = data.data || data.games || [];
    if (!Array.isArray(games) || games.length === 0) {
      return { success: false, error: 'Nenhum jogo retornado pela API' };
    }

    // Upsert games into cache in batches
    const batchSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize).map((g: Record<string, unknown>) => {
        const prov = g.provider;
        const providerName = (typeof prov === 'object' && prov !== null) ? (prov as Record<string, string>).name : (prov as string);
        return {
          game_code: g.game_code || g.code,
          game_name: g.name || g.game_name,
          provider: providerName || 'Unknown',
          image_url: g.image_url || g.image || g.banner || null,
          original: g.original || g.game_original || false,
          cached_at: new Date().toISOString(),
        };
      });

      const { error: upsertError } = await supabase
        .from('playfiver_games_cache')
        .upsert(batch, { onConflict: 'game_code,provider' });

      if (upsertError) {
        console.error('[CASINO] Upsert error batch', i, ':', upsertError);
      } else {
        totalUpserted += batch.length;
      }
    }

    console.log(`[CASINO] Cache refreshed: ${totalUpserted} games`);
    return { success: true, count: totalUpserted };
  } catch (error) {
    console.error('[CASINO] Refresh cache error:', error);
    return { success: false, error: 'Erro ao atualizar cache de jogos' };
  }
}

/**
 * Get user's casino transaction history
 */
export async function getCasinoHistory(
  limit: number = 50
): Promise<{ success: boolean; transactions?: CasinoTransaction[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const platformId = await getPlatformId();

    const { data, error } = await supabase
      .from('playfiver_transactions')
      .select('id, txn_id, round_id, txn_type, provider_code, game_code, game_type, bet, win, balance_before, balance_after, created_at')
      .eq('user_id', user.id)
      .eq('platform_id', platformId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    const transactions = (data || []).map(t => ({
      ...t,
      bet: Number(t.bet),
      win: Number(t.win),
      balance_before: Number(t.balance_before),
      balance_after: Number(t.balance_after),
    }));

    return { success: true, transactions };
  } catch (error) {
    console.error('[CASINO] History error:', error);
    return { success: false, error: 'Erro ao buscar histórico' };
  }
}
