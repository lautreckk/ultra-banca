'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';
import { getPlatformId } from '@/lib/utils/platform';

export interface DashboardStats {
  totalGanhos: number;
  totalApostas: number;
  totalDepositos: number;
  totalSaques: number;
  depositosDiario: number;
  depositosSemanal: number;
  depositosMensal: number;
  saquesHoje: number;
  apostasHoje: number;
  usuariosAtivos: number;
}

/**
 * getDashboardStats - OTIMIZADO COM Promise.all
 *
 * Antes: 10 queries sequenciais (~2000ms)
 * Depois: 10 queries paralelas (~200ms)
 *
 * Redução estimada: 90% do tempo de resposta
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();
  const supabase = await createClient();

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

  // Calcular datas em horário de Brasília (UTC-3)
  // Brasil não usa horário de verão desde 2019
  const now = new Date();
  const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;
  const nowBRT = new Date(now.getTime() - BRT_OFFSET_MS);

  // Meia-noite BRT = 03:00 UTC
  const startOfDay = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), nowBRT.getUTCDate(), 3)).toISOString();
  const startOfWeek = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), nowBRT.getUTCDate() - nowBRT.getUTCDay(), 3)).toISOString();
  const startOfMonth = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), 1, 3)).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // ============================================================================
  // EXECUTAR TODAS AS QUERIES EM PARALELO
  // Todas as queries filtram por platform_id para isolamento multi-tenant
  // ============================================================================
  const [
    ganhosResult,
    totalApostasResult,
    depositosResult,
    saquesResult,
    depositosDiarioResult,
    depositosSemanalResult,
    depositosMensalResult,
    saquesHojeResult,
    apostasHojeResult,
    activeUsersResult,
  ] = await Promise.all([
    // 1. Total de ganhos (prêmios pagos aos apostadores)
    supabase
      .from('apostas')
      .select('premio_valor')
      .eq('platform_id', platformId)
      .eq('status', 'ganhou'),

    // 2. Total de apostas (count)
    supabase
      .from('apostas')
      .select('*', { count: 'exact', head: true })
      .eq('platform_id', platformId),

    // 3. Total de depósitos aprovados
    supabase
      .from('pagamentos')
      .select('valor')
      .eq('platform_id', platformId)
      .eq('status', 'PAID'),

    // 4. Total de saques pagos
    supabase
      .from('saques')
      .select('valor')
      .eq('platform_id', platformId)
      .eq('status', 'PAID'),

    // 5. Depósitos do dia
    supabase
      .from('pagamentos')
      .select('valor')
      .eq('platform_id', platformId)
      .eq('status', 'PAID')
      .gte('paid_at', startOfDay),

    // 6. Depósitos da semana
    supabase
      .from('pagamentos')
      .select('valor')
      .eq('platform_id', platformId)
      .eq('status', 'PAID')
      .gte('paid_at', startOfWeek),

    // 7. Depósitos do mês
    supabase
      .from('pagamentos')
      .select('valor')
      .eq('platform_id', platformId)
      .eq('status', 'PAID')
      .gte('paid_at', startOfMonth),

    // 8. Saques de hoje
    supabase
      .from('saques')
      .select('valor')
      .eq('platform_id', platformId)
      .gte('created_at', startOfDay),

    // 9. Apostas de hoje (count)
    supabase
      .from('apostas')
      .select('*', { count: 'exact', head: true })
      .eq('platform_id', platformId)
      .gte('created_at', startOfDay),

    // 10. Usuários ativos (últimos 7 dias)
    supabase
      .from('apostas')
      .select('user_id')
      .eq('platform_id', platformId)
      .gte('created_at', sevenDaysAgo),
  ]);

  // ============================================================================
  // PROCESSAR RESULTADOS
  // ============================================================================

  // Somar valores dos arrays
  const sumValues = (data: { valor?: number; premio_valor?: number }[] | null, field: 'valor' | 'premio_valor') =>
    data?.reduce((sum, item) => sum + (Number(item[field]) || 0), 0) || 0;

  const totalGanhos = sumValues(ganhosResult.data, 'premio_valor');
  const totalDepositos = sumValues(depositosResult.data, 'valor');
  const totalSaques = sumValues(saquesResult.data, 'valor');
  const depositosDiario = sumValues(depositosDiarioResult.data, 'valor');
  const depositosSemanal = sumValues(depositosSemanalResult.data, 'valor');
  const depositosMensal = sumValues(depositosMensalResult.data, 'valor');
  const saquesHoje = sumValues(saquesHojeResult.data, 'valor');

  // Contar usuários únicos
  const uniqueUsers = new Set(activeUsersResult.data?.map((a) => a.user_id) || []);

  return {
    totalGanhos,
    totalApostas: totalApostasResult.count || 0,
    totalDepositos,
    totalSaques,
    depositosDiario,
    depositosSemanal,
    depositosMensal,
    saquesHoje,
    apostasHoje: apostasHojeResult.count || 0,
    usuariosAtivos: uniqueUsers.size,
  };
}

export interface RecentBet {
  id: string;
  user_id: string;
  user_name: string;
  tipo: string;
  modalidade: string;
  valor_total: number;
  premio_valor: number | null;
  status: string;
  created_at: string;
}

export async function getRecentBets(limit = 7): Promise<RecentBet[]> {
  await requireAdmin();
  const supabase = await createClient();

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

  // Já otimizado com JOIN (profiles!inner)
  const { data } = await supabase
    .from('apostas')
    .select(`
      id,
      user_id,
      tipo,
      modalidade,
      valor_total,
      premio_valor,
      status,
      created_at,
      profiles!inner(nome)
    `)
    .eq('platform_id', platformId)  // MULTI-TENANT: Filtro por plataforma
    .in('status', ['ganhou', 'perdeu'])
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((bet) => ({
    id: bet.id,
    user_id: bet.user_id,
    user_name: (bet.profiles as unknown as { nome: string })?.nome || 'N/A',
    tipo: bet.tipo,
    modalidade: bet.modalidade,
    valor_total: Number(bet.valor_total) || 0,
    premio_valor: bet.premio_valor ? Number(bet.premio_valor) : null,
    status: bet.status,
    created_at: bet.created_at,
  }));
}

export interface RecentDeposit {
  id: string;
  user_id: string;
  user_name: string;
  valor: number;
  status: string;
  created_at: string;
}

export async function getRecentDeposits(limit = 7): Promise<RecentDeposit[]> {
  await requireAdmin();
  const supabase = await createClient();

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

  // Já otimizado com JOIN (profiles!inner)
  const { data } = await supabase
    .from('pagamentos')
    .select(`
      id,
      user_id,
      valor,
      status,
      created_at,
      profiles!inner(nome)
    `)
    .eq('platform_id', platformId)  // MULTI-TENANT: Filtro por plataforma
    .eq('tipo', 'deposito')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((deposit) => ({
    id: deposit.id,
    user_id: deposit.user_id,
    user_name: (deposit.profiles as unknown as { nome: string })?.nome || 'N/A',
    valor: Number(deposit.valor) || 0,
    status: deposit.status,
    created_at: deposit.created_at,
  }));
}

export interface RecentWithdrawal {
  id: string;
  user_id: string;
  user_name: string;
  valor: number;
  valor_liquido: number;
  chave_pix: string;
  tipo_chave: string;
  status: string;
  created_at: string;
}

export async function getPendingWithdrawals(limit = 7): Promise<RecentWithdrawal[]> {
  await requireAdmin();
  const supabase = await createClient();

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

  // Já otimizado com JOIN (profiles!inner)
  const { data } = await supabase
    .from('saques')
    .select(`
      id,
      user_id,
      valor,
      valor_liquido,
      chave_pix,
      tipo_chave,
      status,
      created_at,
      profiles!inner(nome)
    `)
    .eq('platform_id', platformId)  // MULTI-TENANT: Filtro por plataforma
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((withdrawal) => ({
    id: withdrawal.id,
    user_id: withdrawal.user_id,
    user_name: (withdrawal.profiles as unknown as { nome: string })?.nome || 'N/A',
    valor: Number(withdrawal.valor) || 0,
    valor_liquido: Number(withdrawal.valor_liquido) || 0,
    chave_pix: withdrawal.chave_pix,
    tipo_chave: withdrawal.tipo_chave,
    status: withdrawal.status,
    created_at: withdrawal.created_at,
  }));
}
