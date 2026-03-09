'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';
import { getPlatformId } from '@/lib/utils/platform';
import { ALL_PLATFORMS_ID } from '@/lib/utils/platform-constants';

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
  depositosPromotores: number;
  cadastrosTotal: number;
}

/**
 * getDashboardStats - USA RPC (função SQL no banco)
 *
 * Faz toda a agregação direto no PostgreSQL via função get_dashboard_stats().
 * Resolve o problema do limite de 1000 linhas do PostgREST que causava
 * valores incorretos nos totais (ex: depósitos mostrando ~27k em vez de ~51k).
 *
 * Uma única chamada RPC retorna todas as 10 métricas.
 */
export async function getDashboardStats(dateFrom?: string, dateTo?: string): Promise<DashboardStats> {
  await requireAdmin();

  const platformId = await getPlatformId();
  const isAll = platformId === ALL_PLATFORMS_ID;

  // Use admin client for cross-platform queries to bypass RLS
  const supabase = isAll ? createAdminClient() : await createClient();

  const hasDateFilter = dateFrom || dateTo;

  // Se tem filtro de data, faz queries diretas; senão usa RPC padrão
  if (!hasDateFilter) {
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      p_platform_id: isAll ? 'all' : platformId,
    });

    // Buscar depósitos de promotores e cadastros separadamente
    const [depositosPromotores, cadastrosTotal] = await Promise.all([
      getDepositosPromotores(supabase, platformId, isAll),
      getCadastrosTotal(supabase, platformId, isAll),
    ]);

    if (error || !data) {
      console.error('[Dashboard] RPC error:', error);
      return {
        totalGanhos: 0,
        totalApostas: 0,
        totalDepositos: 0,
        totalSaques: 0,
        depositosDiario: 0,
        depositosSemanal: 0,
        depositosMensal: 0,
        saquesHoje: 0,
        apostasHoje: 0,
        usuariosAtivos: 0,
        depositosPromotores,
        cadastrosTotal,
      };
    }

    return {
      totalGanhos: Number(data.totalGanhos) || 0,
      totalApostas: Number(data.totalApostas) || 0,
      totalDepositos: Number(data.totalDepositos) || 0,
      totalSaques: Number(data.totalSaques) || 0,
      depositosDiario: Number(data.depositosDiario) || 0,
      depositosSemanal: Number(data.depositosSemanal) || 0,
      depositosMensal: Number(data.depositosMensal) || 0,
      saquesHoje: Number(data.saquesHoje) || 0,
      apostasHoje: Number(data.apostasHoje) || 0,
      usuariosAtivos: Number(data.usuariosAtivos) || 0,
      depositosPromotores,
      cadastrosTotal,
    };
  }

  // Com filtro de data: queries diretas
  const startDate = dateFrom ? `${dateFrom}T00:00:00` : undefined;
  const endDate = dateTo ? `${dateTo}T23:59:59` : undefined;

  const buildQuery = (table: string, select: string) => {
    let query = supabase.from(table).select(select);
    if (!isAll) query = query.eq('platform_id', platformId);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    return query;
  };

  // Queries com filtro de data
  const ganhosQuery = buildQuery('apostas', 'premio_valor').in('status', ['ganhou']);
  const apostasQuery = buildQuery('apostas', 'id');
  const depositosQuery = buildQuery('pagamentos', 'valor').eq('tipo', 'deposito').eq('status', 'PAID');
  const saquesQuery = buildQuery('saques', 'valor_liquido').eq('status', 'PAID');
  const usuariosQuery = buildQuery('profiles', 'id');

  const [
    ganhosRes,
    apostasRes,
    depositosRes,
    saquesRes,
    usuariosRes,
    depositosPromotores,
    cadastrosTotal,
  ] = await Promise.all([
    ganhosQuery,
    apostasQuery,
    depositosQuery,
    saquesQuery,
    usuariosQuery,
    getDepositosPromotores(supabase, platformId, isAll, startDate, endDate),
    getCadastrosTotal(supabase, platformId, isAll, startDate, endDate),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ganhosData = (ganhosRes.data || []) as any[];
  const ganhosResult = ganhosData.reduce((sum, a) => sum + (Number(a.premio_valor) || 0), 0);
  const apostasResult = (apostasRes.data || []).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const depositosData = (depositosRes.data || []) as any[];
  const depositosResult = depositosData.reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saquesData = (saquesRes.data || []) as any[];
  const saquesResult = saquesData.reduce((sum, s) => sum + (Number(s.valor_liquido) || 0), 0);
  const usuariosResult = (usuariosRes.data || []).length;

  return {
    totalGanhos: ganhosResult,
    totalApostas: apostasResult,
    totalDepositos: depositosResult,
    totalSaques: saquesResult,
    depositosDiario: depositosResult, // No filtro de data, diário = total filtrado
    depositosSemanal: depositosResult,
    depositosMensal: depositosResult,
    saquesHoje: saquesResult,
    apostasHoje: apostasResult,
    usuariosAtivos: usuariosResult,
    depositosPromotores,
    cadastrosTotal,
  };
}

/**
 * Soma dos depósitos (PAID) de usuários indicados por promotores da banca
 */
async function getDepositosPromotores(
  supabase: ReturnType<typeof createAdminClient>,
  platformId: string,
  isAll: boolean,
  startDate?: string,
  endDate?: string,
): Promise<number> {
  // 1. Buscar user_ids dos referidos dos promotores desta plataforma
  let refQuery = supabase
    .from('promotor_referidos')
    .select('user_id, promotores!inner(platform_id)');
  if (!isAll) {
    refQuery = refQuery.eq('promotores.platform_id', platformId);
  }
  const { data: referidos } = await refQuery;

  if (!referidos || referidos.length === 0) return 0;

  const userIds = referidos.map((r) => r.user_id);

  // 2. Somar depósitos PAID desses usuários
  let depQuery = supabase
    .from('pagamentos')
    .select('valor')
    .eq('tipo', 'deposito')
    .eq('status', 'PAID')
    .in('user_id', userIds);
  if (!isAll) depQuery = depQuery.eq('platform_id', platformId);
  if (startDate) depQuery = depQuery.gte('created_at', startDate);
  if (endDate) depQuery = depQuery.lte('created_at', endDate);

  const { data: depositos } = await depQuery;

  return (depositos || []).reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
}

/**
 * Total de cadastros (profiles) na plataforma
 */
async function getCadastrosTotal(
  supabase: ReturnType<typeof createAdminClient>,
  platformId: string,
  isAll: boolean,
  startDate?: string,
  endDate?: string,
): Promise<number> {
  let query = supabase.from('profiles').select('id', { count: 'exact', head: true });
  if (!isAll) query = query.eq('platform_id', platformId);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  const { count } = await query;
  return count || 0;
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
