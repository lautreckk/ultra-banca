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
export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();

  const platformId = await getPlatformId();
  const isAll = platformId === ALL_PLATFORMS_ID;

  // Use admin client for cross-platform queries to bypass RLS
  const supabase = isAll ? createAdminClient() : await createClient();

  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    p_platform_id: isAll ? 'all' : platformId,
  });

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
