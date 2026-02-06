'use server';

import { createClient } from '@/lib/supabase/server';
import { getPlatformId } from '@/lib/utils/platform';

const PLAYFIVER_API_BASE = 'https://api.playfivers.com/api/v2';

// =============================================
// TYPES
// =============================================

export interface PlayfiverConfig {
  id: string;
  platform_id: string;
  agent_token: string;
  secret_key: string;
  callback_url: string;
  ativo: boolean;
  default_rtp: number;
  limit_enable: boolean;
  limit_amount: number;
  limit_hours: number;
  bonus_enable: boolean;
}

export interface SavePlayfiverConfigInput {
  agent_token: string;
  secret_key: string;
  callback_url: string;
  ativo: boolean;
  default_rtp: number;
  limit_enable: boolean;
  limit_amount: number;
  limit_hours: number;
  bonus_enable: boolean;
}

export interface CasinoTransaction {
  id: string;
  user_id: string;
  user_name: string;
  user_cpf: string;
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

export interface CasinoTransactionsParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CasinoTransactionsResult {
  transactions: CasinoTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GGRSummary {
  totalBets: number;
  totalWins: number;
  ggr: number;
  totalPlayers: number;
  byProvider: {
    provider: string;
    bets: number;
    wins: number;
    ggr: number;
    players: number;
  }[];
}

// =============================================
// CONFIG MANAGEMENT
// =============================================

/**
 * Get PlayFivers config for current platform
 */
export async function getPlayfiverConfig(): Promise<{ success: boolean; config?: PlayfiverConfig; error?: string }> {
  try {
    const supabase = await createClient();
    const platformId = await getPlatformId();

    const { data, error } = await supabase
      .from('playfiver_config')
      .select('*')
      .eq('platform_id', platformId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, config: undefined };
    }

    return {
      success: true,
      config: {
        id: data.id,
        platform_id: data.platform_id,
        agent_token: data.agent_token,
        secret_key: data.secret_key,
        callback_url: data.callback_url,
        ativo: data.ativo,
        default_rtp: data.default_rtp,
        limit_enable: data.limit_enable,
        limit_amount: Number(data.limit_amount) || 0,
        limit_hours: data.limit_hours || 24,
        bonus_enable: data.bonus_enable,
      },
    };
  } catch (error) {
    console.error('[CASINO ADMIN] Get config error:', error);
    return { success: false, error: 'Erro ao buscar configuração' };
  }
}

/**
 * Upsert PlayFivers config
 */
export async function savePlayfiverConfig(
  input: SavePlayfiverConfigInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const platformId = await getPlatformId();

    const { data: existing } = await supabase
      .from('playfiver_config')
      .select('id')
      .eq('platform_id', platformId)
      .single();

    const configData = {
      platform_id: platformId,
      agent_token: input.agent_token,
      secret_key: input.secret_key,
      callback_url: input.callback_url,
      ativo: input.ativo,
      default_rtp: input.default_rtp,
      limit_enable: input.limit_enable,
      limit_amount: input.limit_amount,
      limit_hours: input.limit_hours,
      bonus_enable: input.bonus_enable,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from('playfiver_config')
        .update(configData)
        .eq('id', existing.id);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('playfiver_config')
        .insert(configData);

      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[CASINO ADMIN] Save config error:', error);
    return { success: false, error: 'Erro ao salvar configuração' };
  }
}

// =============================================
// GGR REPORT
// =============================================

/**
 * Get GGR (Gross Gaming Revenue) summary
 */
export async function getCasinoGGR(
  startDate: string,
  endDate: string,
  provider?: string
): Promise<{ success: boolean; summary?: GGRSummary; error?: string }> {
  try {
    const supabase = await createClient();
    const platformId = await getPlatformId();

    let query = supabase
      .from('playfiver_transactions')
      .select('provider_code, bet, win, user_id')
      .eq('platform_id', platformId)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (provider) {
      query = query.eq('provider_code', provider);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const txns = data || [];

    // Aggregate totals
    let totalBets = 0;
    let totalWins = 0;
    const uniquePlayers = new Set<string>();
    const providerMap = new Map<string, { bets: number; wins: number; players: Set<string> }>();

    for (const t of txns) {
      const b = Number(t.bet) || 0;
      const w = Number(t.win) || 0;
      totalBets += b;
      totalWins += w;
      uniquePlayers.add(t.user_id);

      const prov = t.provider_code || 'Unknown';
      if (!providerMap.has(prov)) {
        providerMap.set(prov, { bets: 0, wins: 0, players: new Set() });
      }
      const entry = providerMap.get(prov)!;
      entry.bets += b;
      entry.wins += w;
      entry.players.add(t.user_id);
    }

    const byProvider = Array.from(providerMap.entries()).map(([prov, data]) => ({
      provider: prov,
      bets: Math.round(data.bets * 100) / 100,
      wins: Math.round(data.wins * 100) / 100,
      ggr: Math.round((data.bets - data.wins) * 100) / 100,
      players: data.players.size,
    })).sort((a, b) => b.ggr - a.ggr);

    return {
      success: true,
      summary: {
        totalBets: Math.round(totalBets * 100) / 100,
        totalWins: Math.round(totalWins * 100) / 100,
        ggr: Math.round((totalBets - totalWins) * 100) / 100,
        totalPlayers: uniquePlayers.size,
        byProvider,
      },
    };
  } catch (error) {
    console.error('[CASINO ADMIN] GGR error:', error);
    return { success: false, error: 'Erro ao calcular GGR' };
  }
}

// =============================================
// TRANSACTIONS
// =============================================

/**
 * Get paginated casino transactions (admin)
 */
export async function getCasinoTransactions(
  params: CasinoTransactionsParams = {}
): Promise<CasinoTransactionsResult> {
  const supabase = await createClient();
  const platformId = await getPlatformId();
  const { page = 1, pageSize = 20, userId, provider, dateFrom, dateTo } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('playfiver_transactions')
    .select(`
      id,
      user_id,
      txn_id,
      round_id,
      txn_type,
      provider_code,
      game_code,
      game_type,
      bet,
      win,
      balance_before,
      balance_after,
      created_at,
      profiles!inner(nome, cpf)
    `, { count: 'exact' })
    .eq('platform_id', platformId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (provider) {
    query = query.eq('provider_code', provider);
  }

  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00`);
  }

  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('[CASINO ADMIN] Transactions error:', error);
    return { transactions: [], total: 0, page, pageSize };
  }

  const transactions = (data || []).map((t) => ({
    id: t.id,
    user_id: t.user_id,
    user_name: (t.profiles as unknown as { nome: string; cpf: string })?.nome || 'N/A',
    user_cpf: (t.profiles as unknown as { nome: string; cpf: string })?.cpf || 'N/A',
    txn_id: t.txn_id,
    round_id: t.round_id,
    txn_type: t.txn_type,
    provider_code: t.provider_code,
    game_code: t.game_code,
    game_type: t.game_type,
    bet: Number(t.bet) || 0,
    win: Number(t.win) || 0,
    balance_before: Number(t.balance_before) || 0,
    balance_after: Number(t.balance_after) || 0,
    created_at: t.created_at,
  }));

  return { transactions, total: count || 0, page, pageSize };
}

// =============================================
// GAMES CACHE (ADMIN)
// =============================================

/**
 * Force refresh games cache (admin version)
 */
export async function refreshGamesCacheAdmin(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const platformId = await getPlatformId();

    const { data: config } = await supabase
      .from('playfiver_config')
      .select('agent_token, secret_key')
      .eq('platform_id', platformId)
      .single();

    if (!config) {
      return { success: false, error: 'Configuração do cassino não encontrada' };
    }

    const url = `${PLAYFIVER_API_BASE}/games?agent_code=${config.agent_token}&agent_secret=${config.secret_key}`;
    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok || data.status === 0) {
      return { success: false, error: data.msg || 'Erro ao buscar jogos' };
    }

    const games = data.data || data.games || [];
    if (!Array.isArray(games) || games.length === 0) {
      return { success: false, error: 'Nenhum jogo retornado pela API' };
    }

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
        console.error('[CASINO ADMIN] Upsert error batch', i, ':', upsertError);
      } else {
        totalUpserted += batch.length;
      }
    }

    return { success: true, count: totalUpserted };
  } catch (error) {
    console.error('[CASINO ADMIN] Refresh cache error:', error);
    return { success: false, error: 'Erro ao atualizar cache de jogos' };
  }
}

/**
 * Test connection to PlayFivers API
 */
export async function testPlayfiverConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const platformId = await getPlatformId();

    const { data: config } = await supabase
      .from('playfiver_config')
      .select('agent_token, secret_key')
      .eq('platform_id', platformId)
      .single();

    if (!config) {
      return { success: false, error: 'Configuração não encontrada' };
    }

    const url = `${PLAYFIVER_API_BASE}/agent?agentToken=${config.agent_token}&secretKey=${config.secret_key}`;
    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok || data.status === 0) {
      return { success: false, error: data.msg || 'Falha na conexão' };
    }

    return { success: true };
  } catch (error) {
    console.error('[CASINO ADMIN] Test connection error:', error);
    return { success: false, error: 'Erro de conexão' };
  }
}
