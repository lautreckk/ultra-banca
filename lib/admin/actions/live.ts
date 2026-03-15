'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';
import { getPlatformId } from '@/lib/utils/platform';
import { ALL_PLATFORMS_ID } from '@/lib/utils/platform-constants';

// ============================================================================
// TIPOS
// ============================================================================

export interface LiveMetrics {
  usersOnline: number;
  usersBrowsing: number;
  depositsNow: number;
  betsNow: number;
  betValueNow: number;
}

export interface ActiveUser {
  id: string;
  user_id: string | null;
  nome: string;
  telefone: string;
  current_page: string;
  started_at: string;
  last_seen_at: string;
  last_action: string;
  session_bet_total: number;
  last_deposit_value: number;
  traffic_source: string | null;
  promoter_code: string | null;
}

export interface HourlyMetric {
  hour_bucket: string;
  hour_label: string;
  users_online_peak: number;
  bets_count: number;
  bets_volume: number;
  deposits_count: number;
  deposits_volume: number;
  unique_users: number;
}

// ============================================================================
// MÉTRICAS LIVE (tempo real)
// ============================================================================

export async function getLiveMetrics(): Promise<LiveMetrics> {
  await requireAdmin();

  const platformId = await getPlatformId();
  const isAll = platformId === ALL_PLATFORMS_ID;
  const supabase = isAll ? createAdminClient() : await createClient();

  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // Queries em paralelo
  const [onlineRes, betsRes, depositsRes] = await Promise.all([
    // Usuários online (presença nos últimos 2 min)
    (() => {
      let q = supabase
        .from('visitor_presence')
        .select('user_id, last_action, session_bet_total', { count: 'exact' })
        .gte('last_seen_at', twoMinAgo);
      if (!isAll) q = q.eq('platform_id', platformId);
      return q;
    })(),

    // Apostas nos últimos 5 min
    (() => {
      let q = supabase
        .from('activity_events')
        .select('event_value')
        .eq('event_type', 'bet_placed')
        .gte('created_at', fiveMinAgo);
      if (!isAll) q = q.eq('platform_id', platformId);
      return q;
    })(),

    // Depósitos nos últimos 5 min
    (() => {
      let q = supabase
        .from('activity_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'deposit_made')
        .gte('created_at', fiveMinAgo);
      if (!isAll) q = q.eq('platform_id', platformId);
      return q;
    })(),
  ]);

  const onlineData = onlineRes.data || [];
  const usersOnline = onlineRes.count || onlineData.length;
  const usersBetting = onlineData.filter(u => (u.session_bet_total || 0) > 0).length;
  const usersBrowsing = usersOnline - usersBetting;

  const betsData = betsRes.data || [];
  const betsNow = betsData.length;
  const betValueNow = betsData.reduce((sum, b) => sum + (Number(b.event_value) || 0), 0);

  const depositsNow = depositsRes.count || 0;

  return {
    usersOnline,
    usersBrowsing,
    depositsNow,
    betsNow,
    betValueNow,
  };
}

// ============================================================================
// USUÁRIOS ATIVOS
// ============================================================================

export async function getActiveUsers(page = 1, pageSize = 20): Promise<{ users: ActiveUser[]; total: number }> {
  await requireAdmin();

  const platformId = await getPlatformId();
  const isAll = platformId === ALL_PLATFORMS_ID;
  const supabase = isAll ? createAdminClient() : await createClient();

  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('visitor_presence')
    .select(`
      id,
      user_id,
      current_page,
      started_at,
      last_seen_at,
      last_action,
      session_bet_total,
      last_deposit_value,
      traffic_source,
      promoter_code,
      profiles(nome, telefone)
    `, { count: 'exact' })
    .gte('last_seen_at', twoMinAgo)
    .order('last_seen_at', { ascending: false })
    .range(from, to);

  if (!isAll) query = query.eq('platform_id', platformId);

  const { data, count } = await query;

  const users: ActiveUser[] = (data || []).map((row) => {
    const profile = row.profiles as unknown as { nome: string; telefone: string } | null;
    return {
      id: row.id,
      user_id: row.user_id,
      nome: profile?.nome || 'Visitante',
      telefone: profile?.telefone || '',
      current_page: row.current_page || '/',
      started_at: row.started_at || row.last_seen_at || '',
      last_seen_at: row.last_seen_at || '',
      last_action: row.last_action || 'browsing',
      session_bet_total: Number(row.session_bet_total) || 0,
      last_deposit_value: Number(row.last_deposit_value) || 0,
      traffic_source: row.traffic_source || null,
      promoter_code: row.promoter_code || null,
    };
  });

  return { users, total: count || 0 };
}

// ============================================================================
// ATIVIDADES RECENTES (feed de eventos)
// ============================================================================

export interface RecentActivity {
  id: string;
  event_type: string;
  event_value: number;
  nome: string;
  telefone: string;
  created_at: string;
}

export async function getRecentActivities(limit = 15): Promise<RecentActivity[]> {
  await requireAdmin();

  const platformId = await getPlatformId();
  const isAll = platformId === ALL_PLATFORMS_ID;
  const supabase = isAll ? createAdminClient() : await createClient();

  let query = supabase
    .from('activity_events')
    .select(`
      id,
      event_type,
      event_value,
      created_at,
      profiles(nome, telefone)
    `)
    .in('event_type', ['bet_placed', 'deposit_made'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!isAll) query = query.eq('platform_id', platformId);

  const { data } = await query;

  return (data || []).map((row) => {
    const profile = row.profiles as unknown as { nome: string; telefone: string } | null;
    return {
      id: row.id,
      event_type: row.event_type,
      event_value: Number(row.event_value) || 0,
      nome: profile?.nome || 'Usuário',
      telefone: profile?.telefone || '',
      created_at: row.created_at,
    };
  });
}

// ============================================================================
// DADOS HORÁRIOS PARA GRÁFICOS
// ============================================================================

export async function getHourlyChartData(dateFrom?: string, dateTo?: string): Promise<HourlyMetric[]> {
  await requireAdmin();

  const platformId = await getPlatformId();
  const isAll = platformId === ALL_PLATFORMS_ID;
  const supabase = isAll ? createAdminClient() : await createClient();

  // Default: hoje
  const startDate = dateFrom
    ? `${dateFrom}T00:00:00`
    : new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const endDate = dateTo
    ? `${dateTo}T23:59:59`
    : new Date().toISOString();

  let query = supabase
    .from('hourly_metrics')
    .select('*')
    .gte('hour_bucket', startDate)
    .lte('hour_bucket', endDate)
    .order('hour_bucket', { ascending: true });

  if (!isAll) query = query.eq('platform_id', platformId);

  const { data } = await query;

  return (data || []).map((row) => ({
    hour_bucket: row.hour_bucket,
    hour_label: new Date(row.hour_bucket).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    users_online_peak: Number(row.users_online_peak) || 0,
    bets_count: Number(row.bets_count) || 0,
    bets_volume: Number(row.bets_volume) || 0,
    deposits_count: Number(row.deposits_count) || 0,
    deposits_volume: Number(row.deposits_volume) || 0,
    unique_users: Number(row.unique_users) || 0,
  }));
}
