'use server';

import { createClient } from '@/lib/supabase/server';

export interface VisitorStats {
  realtime: number;
  today: number;
  week: number;
  month: number;
  trend: { date: string; visitors: number; pageViews: number }[];
}

export interface GameAccessStat {
  gameType: string;
  gameName: string;
  accessCount: number;
  uniqueVisitors: number;
  percentageOfTotal: number;
}

export interface HouseProfitData {
  totalBets: number;
  totalPrizesPaid: number;
  profitPercentage: number;
  isHouseWinning: boolean;
  houseProfit: number;
  periodStats: {
    period: string;
    totalBets: number;
    totalPrizesPaid: number;
    profitPercentage: number;
    isHouseWinning: boolean;
  }[];
}

// Mapeamento de game_type para nome legível
const gameTypeNames: Record<string, string> = {
  'loterias': 'Loterias',
  'fazendinha': 'Fazendinha',
  'quininha': 'Quininha',
  'resultados': 'Resultados',
  'apostas': 'Minhas Apostas',
  'saques': 'Saques',
  'amigos': 'Amigos',
  'relatorios': 'Relatórios',
  'premiadas': 'Premiadas',
};

export async function getVisitorStats(days: number = 30): Promise<VisitorStats> {
  const supabase = await createClient();

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Visitantes em tempo real (last_seen_at > 5 minutos atrás)
  const { count: realtimeCount } = await supabase
    .from('visitor_presence')
    .select('*', { count: 'exact', head: true })
    .gte('last_seen_at', fiveMinutesAgo.toISOString());

  // Visitantes únicos hoje
  const { data: todayData } = await supabase
    .from('page_views')
    .select('session_id')
    .gte('created_at', todayStart.toISOString());

  const todayUnique = new Set(todayData?.map(d => d.session_id) || []).size;

  // Visitantes únicos últimos 7 dias
  const { data: weekData } = await supabase
    .from('page_views')
    .select('session_id')
    .gte('created_at', weekAgo.toISOString());

  const weekUnique = new Set(weekData?.map(d => d.session_id) || []).size;

  // Visitantes únicos últimos 30 dias
  const { data: monthData } = await supabase
    .from('page_views')
    .select('session_id')
    .gte('created_at', monthAgo.toISOString());

  const monthUnique = new Set(monthData?.map(d => d.session_id) || []).size;

  // Trend data para gráfico de linha
  const { data: trendData } = await supabase
    .from('page_views')
    .select('session_id, created_at')
    .gte('created_at', daysAgo.toISOString())
    .order('created_at', { ascending: true });

  // Agrupar por dia
  const trendMap = new Map<string, { visitors: Set<string>; pageViews: number }>();

  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    trendMap.set(dateStr, { visitors: new Set(), pageViews: 0 });
  }

  trendData?.forEach(item => {
    const dateStr = new Date(item.created_at).toISOString().split('T')[0];
    const entry = trendMap.get(dateStr);
    if (entry) {
      entry.visitors.add(item.session_id);
      entry.pageViews++;
    }
  });

  const trend = Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      visitors: data.visitors.size,
      pageViews: data.pageViews,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    realtime: realtimeCount || 0,
    today: todayUnique,
    week: weekUnique,
    month: monthUnique,
    trend,
  };
}

export async function getGameAccessStats(days: number = 30): Promise<GameAccessStat[]> {
  const supabase = await createClient();

  const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from('page_views')
    .select('game_type, session_id')
    .gte('created_at', daysAgo.toISOString())
    .not('game_type', 'is', null);

  if (!data || data.length === 0) {
    return [];
  }

  // Agrupar por game_type
  const statsMap = new Map<string, { accessCount: number; sessions: Set<string> }>();

  data.forEach(item => {
    if (!item.game_type) return;

    if (!statsMap.has(item.game_type)) {
      statsMap.set(item.game_type, { accessCount: 0, sessions: new Set() });
    }

    const stat = statsMap.get(item.game_type)!;
    stat.accessCount++;
    stat.sessions.add(item.session_id);
  });

  const totalAccess = data.length;

  const stats: GameAccessStat[] = Array.from(statsMap.entries())
    .map(([gameType, stat]) => ({
      gameType,
      gameName: gameTypeNames[gameType] || gameType,
      accessCount: stat.accessCount,
      uniqueVisitors: stat.sessions.size,
      percentageOfTotal: totalAccess > 0 ? (stat.accessCount / totalAccess) * 100 : 0,
    }))
    .sort((a, b) => b.accessCount - a.accessCount);

  return stats;
}

export async function getHouseProfitData(): Promise<HouseProfitData> {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  async function getPeriodStats(startDate?: Date) {
    let betsQuery = supabase
      .from('apostas')
      .select('valor_total, premio_valor, status')
      .in('status', ['ganhou', 'perdeu']);

    if (startDate) {
      betsQuery = betsQuery.gte('created_at', startDate.toISOString());
    }

    const { data: bets } = await betsQuery;

    let totalBets = 0;
    let totalPrizesPaid = 0;

    bets?.forEach(bet => {
      totalBets += Number(bet.valor_total) || 0;
      if (bet.status === 'ganhou' && bet.premio_valor) {
        totalPrizesPaid += Number(bet.premio_valor) || 0;
      }
    });

    const houseProfit = totalBets - totalPrizesPaid;
    const profitPercentage = totalBets > 0
      ? ((totalBets - totalPrizesPaid) / totalBets) * 100
      : 50;

    return {
      totalBets,
      totalPrizesPaid,
      profitPercentage,
      isHouseWinning: profitPercentage >= 50,
      houseProfit,
    };
  }

  // Stats gerais (todos os tempos)
  const totalStats = await getPeriodStats();

  // Stats por período
  const todayStats = await getPeriodStats(todayStart);
  const weekStats = await getPeriodStats(weekAgo);
  const monthStats = await getPeriodStats(monthAgo);

  return {
    ...totalStats,
    periodStats: [
      { period: 'Hoje', ...todayStats },
      { period: '7 dias', ...weekStats },
      { period: '30 dias', ...monthStats },
      { period: 'Total', ...totalStats },
    ],
  };
}

export async function getRealtimeVisitorCount(): Promise<number> {
  const supabase = await createClient();

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const { count } = await supabase
    .from('visitor_presence')
    .select('*', { count: 'exact', head: true })
    .gte('last_seen_at', fiveMinutesAgo.toISOString());

  return count || 0;
}
