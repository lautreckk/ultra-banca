'use server';

import { createClient } from '@/lib/supabase/server';

export interface UserProfile {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  saldo: number;
  saldo_bonus: number;
  codigo_convite: string | null;
  created_at: string;
  total_apostas: number;
  total_ganhos: number;
}

export interface UsersListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface UsersListResult {
  users: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * getUsers - OTIMIZADO PARA ELIMINAR N+1
 *
 * Antes: 1 query (profiles) + 2*N queries (stats por usuário) = 1 + 2N queries
 * Para 20 usuários: 41 queries
 *
 * Depois: 1 query (profiles) + 2 queries (stats em batch) = 3 queries
 * Redução: ~93% das queries
 */
export async function getUsers(params: UsersListParams = {}): Promise<UsersListResult> {
  const supabase = await createClient();
  const {
    page = 1,
    pageSize = 20,
    search = '',
    orderBy = 'created_at',
    orderDir = 'desc',
  } = params;

  const offset = (page - 1) * pageSize;

  // ============================================================================
  // QUERY 1: Buscar usuários com paginação
  // ============================================================================
  let query = supabase
    .from('profiles')
    .select('id, nome, cpf, telefone, saldo, saldo_bonus, codigo_convite, created_at', { count: 'exact' });

  if (search) {
    query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
  }

  const { data: users, count, error } = await query
    .order(orderBy, { ascending: orderDir === 'asc' })
    .range(offset, offset + pageSize - 1);

  if (error || !users || users.length === 0) {
    return { users: [], total: count || 0, page, pageSize };
  }

  // ============================================================================
  // QUERIES 2 e 3: Buscar stats em BATCH (todos os usuários de uma vez)
  // ============================================================================
  const userIds = users.map((u) => u.id);

  const [apostasResult, ganhosResult] = await Promise.all([
    // Query 2: Todas as apostas dos usuários da página (para contar)
    supabase
      .from('apostas')
      .select('user_id')
      .in('user_id', userIds),

    // Query 3: Todas as apostas ganhas dos usuários da página (para somar prêmios)
    supabase
      .from('apostas')
      .select('user_id, premio_valor')
      .in('user_id', userIds)
      .eq('status', 'ganhou'),
  ]);

  // ============================================================================
  // PROCESSAR RESULTADOS: Agregar por user_id
  // ============================================================================

  // Contar apostas por usuário
  const apostasCountMap = new Map<string, number>();
  apostasResult.data?.forEach((row) => {
    apostasCountMap.set(row.user_id, (apostasCountMap.get(row.user_id) || 0) + 1);
  });

  // Somar ganhos por usuário
  const ganhosMap = new Map<string, number>();
  ganhosResult.data?.forEach((row) => {
    const current = ganhosMap.get(row.user_id) || 0;
    ganhosMap.set(row.user_id, current + (Number(row.premio_valor) || 0));
  });

  // ============================================================================
  // MONTAR RESULTADO FINAL
  // ============================================================================
  const usersWithStats: UserProfile[] = users.map((user) => ({
    id: user.id,
    nome: user.nome,
    cpf: user.cpf,
    telefone: user.telefone,
    saldo: Number(user.saldo) || 0,
    saldo_bonus: Number(user.saldo_bonus) || 0,
    codigo_convite: user.codigo_convite,
    created_at: user.created_at,
    total_apostas: apostasCountMap.get(user.id) || 0,
    total_ganhos: ganhosMap.get(user.id) || 0,
  }));

  return {
    users: usersWithStats,
    total: count || 0,
    page,
    pageSize,
  };
}

/**
 * getUserById - OTIMIZADO COM Promise.all
 *
 * Antes: 3 queries sequenciais
 * Depois: 1 query + 2 queries paralelas = tempo de 2 queries
 */
export async function getUserById(id: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  // Query 1: Buscar usuário
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, nome, cpf, telefone, saldo, saldo_bonus, codigo_convite, created_at')
    .eq('id', id)
    .single();

  if (error || !user) {
    return null;
  }

  // Queries 2 e 3 em paralelo: Stats do usuário
  const [apostasResult, ganhosResult] = await Promise.all([
    // Contar apostas
    supabase
      .from('apostas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),

    // Buscar ganhos
    supabase
      .from('apostas')
      .select('premio_valor')
      .eq('user_id', user.id)
      .eq('status', 'ganhou'),
  ]);

  const totalGanhos = ganhosResult.data?.reduce(
    (sum, a) => sum + (Number(a.premio_valor) || 0),
    0
  ) || 0;

  return {
    id: user.id,
    nome: user.nome,
    cpf: user.cpf,
    telefone: user.telefone,
    saldo: Number(user.saldo) || 0,
    saldo_bonus: Number(user.saldo_bonus) || 0,
    codigo_convite: user.codigo_convite,
    created_at: user.created_at,
    total_apostas: apostasResult.count || 0,
    total_ganhos: totalGanhos,
  };
}

export async function updateUserBalance(
  userId: string,
  saldo: number,
  saldoBonus: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      saldo,
      saldo_bonus: saldoBonus,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
