'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/tracker';
import { AuditActions } from '@/lib/security/audit-actions';
import { getPlatformId } from '@/lib/utils/platform';

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
  // Filtros avançados
  ultimoLoginFiltro?: 'todos' | 'hoje' | '7dias' | '30dias' | '60mais';
  ultimaApostaFiltro?: 'todos' | 'nunca' | '7dias' | '30dias' | '60mais';
  statusFiltro?: 'todos' | 'ativos' | 'inativos';
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
    ultimoLoginFiltro = 'todos',
    ultimaApostaFiltro = 'todos',
    statusFiltro = 'todos',
  } = params;

  const offset = (page - 1) * pageSize;
  const now = new Date();

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

  // Calcular datas de referência
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const seteDiasAtras = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const trintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sessentaDiasAtras = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // ============================================================================
  // QUERY 1: Buscar usuários com paginação
  // ============================================================================
  let query = supabase
    .from('profiles')
    .select('id, nome, cpf, telefone, saldo, saldo_bonus, codigo_convite, created_at, last_login', { count: 'exact' })
    .eq('platform_id', platformId);  // MULTI-TENANT: Filtro por plataforma

  if (search) {
    query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
  }

  // Filtro por último login
  if (ultimoLoginFiltro === 'hoje') {
    query = query.gte('last_login', hoje);
  } else if (ultimoLoginFiltro === '7dias') {
    query = query.gte('last_login', seteDiasAtras);
  } else if (ultimoLoginFiltro === '30dias') {
    query = query.gte('last_login', trintaDiasAtras);
  } else if (ultimoLoginFiltro === '60mais') {
    query = query.or(`last_login.lt.${sessentaDiasAtras},last_login.is.null`);
  }

  // Buscar todos os usuários primeiro (para filtros que precisam de dados de apostas)
  const needsApostaFilter = ultimaApostaFiltro !== 'todos' || statusFiltro !== 'todos';

  let allUsersQuery = supabase
    .from('profiles')
    .select('id, nome, cpf, telefone, saldo, saldo_bonus, codigo_convite, created_at, last_login')
    .eq('platform_id', platformId);  // MULTI-TENANT: Filtro por plataforma

  if (search) {
    allUsersQuery = allUsersQuery.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
  }

  // Aplicar filtro de login
  if (ultimoLoginFiltro === 'hoje') {
    allUsersQuery = allUsersQuery.gte('last_login', hoje);
  } else if (ultimoLoginFiltro === '7dias') {
    allUsersQuery = allUsersQuery.gte('last_login', seteDiasAtras);
  } else if (ultimoLoginFiltro === '30dias') {
    allUsersQuery = allUsersQuery.gte('last_login', trintaDiasAtras);
  } else if (ultimoLoginFiltro === '60mais') {
    allUsersQuery = allUsersQuery.or(`last_login.lt.${sessentaDiasAtras},last_login.is.null`);
  }

  const { data: allUsers } = await allUsersQuery;

  if (!allUsers || allUsers.length === 0) {
    return { users: [], total: 0, page, pageSize };
  }

  const allUserIds = allUsers.map((u) => u.id);

  // Buscar última aposta de cada usuário se necessário para filtros
  let ultimaApostaMap = new Map<string, string | null>();

  if (needsApostaFilter) {
    const { data: apostasData } = await supabase
      .from('apostas')
      .select('user_id, created_at')
      .in('user_id', allUserIds)
      .order('created_at', { ascending: false });

    apostasData?.forEach((a) => {
      if (!ultimaApostaMap.has(a.user_id)) {
        ultimaApostaMap.set(a.user_id, a.created_at);
      }
    });
  }

  // Filtrar usuários com base em última aposta e status
  let filteredUsers = allUsers;

  if (ultimaApostaFiltro !== 'todos') {
    filteredUsers = filteredUsers.filter((user) => {
      const ultimaAposta = ultimaApostaMap.get(user.id);

      if (ultimaApostaFiltro === 'nunca') {
        return !ultimaAposta;
      } else if (ultimaApostaFiltro === '7dias') {
        return ultimaAposta && ultimaAposta >= seteDiasAtras;
      } else if (ultimaApostaFiltro === '30dias') {
        return ultimaAposta && ultimaAposta >= trintaDiasAtras;
      } else if (ultimaApostaFiltro === '60mais') {
        return !ultimaAposta || ultimaAposta < sessentaDiasAtras;
      }
      return true;
    });
  }

  if (statusFiltro !== 'todos') {
    filteredUsers = filteredUsers.filter((user) => {
      const ultimaAposta = ultimaApostaMap.get(user.id);
      const isAtivo = ultimaAposta && ultimaAposta >= seteDiasAtras;

      if (statusFiltro === 'ativos') {
        return isAtivo;
      } else if (statusFiltro === 'inativos') {
        return !isAtivo;
      }
      return true;
    });
  }

  // Ordenar
  filteredUsers.sort((a, b) => {
    const aValue = a[orderBy as keyof typeof a] ?? '';
    const bValue = b[orderBy as keyof typeof b] ?? '';
    if (orderDir === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const total = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice(offset, offset + pageSize);

  if (paginatedUsers.length === 0) {
    return { users: [], total, page, pageSize };
  }

  // ============================================================================
  // QUERIES 2 e 3: Buscar stats em BATCH (todos os usuários de uma vez)
  // ============================================================================
  const userIds = paginatedUsers.map((u) => u.id);

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
  const usersWithStats: UserProfile[] = paginatedUsers.map((user) => ({
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
    total,
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

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

  // Query 1: Buscar usuário (garantindo que pertence à plataforma)
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, nome, cpf, telefone, saldo, saldo_bonus, codigo_convite, created_at')
    .eq('id', id)
    .eq('platform_id', platformId)  // MULTI-TENANT: Filtro por plataforma
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

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Buscar saldos anteriores e nome do usuário
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('saldo, saldo_bonus, nome')
    .eq('id', userId)
    .single();

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

  // Registrar no log de auditoria
  const saldoAnterior = Number(currentProfile?.saldo) || 0;
  const saldoBonusAnterior = Number(currentProfile?.saldo_bonus) || 0;
  const diferencaSaldo = saldo - saldoAnterior;
  const diferencaBonus = saldoBonus - saldoBonusAnterior;

  if (diferencaSaldo !== 0 || diferencaBonus !== 0) {
    await logAudit({
      actorId: admin?.id || null,
      action: AuditActions.BALANCE_ADJUSTED,
      entity: `user:${userId}`,
      details: {
        user_id: userId,
        user_name: currentProfile?.nome || 'N/A',
        saldo_anterior: saldoAnterior,
        saldo_novo: saldo,
        diferenca_saldo: diferencaSaldo,
        saldo_bonus_anterior: saldoBonusAnterior,
        saldo_bonus_novo: saldoBonus,
        diferenca_bonus: diferencaBonus,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return { success: true };
}

export interface UpdateUserProfileData {
  cpf?: string;
  saldo?: number;
  saldoBonus?: number;
  newPassword?: string;
}

export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Buscar dados anteriores do usuário
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('cpf, saldo, saldo_bonus, nome')
    .eq('id', userId)
    .single();

  // Atualizar dados na tabela profiles (CPF, saldo, saldo_bonus)
  const profileUpdates: Record<string, unknown> = {};

  if (data.cpf !== undefined) {
    profileUpdates.cpf = data.cpf;
  }
  if (data.saldo !== undefined) {
    profileUpdates.saldo = data.saldo;
  }
  if (data.saldoBonus !== undefined) {
    profileUpdates.saldo_bonus = data.saldoBonus;
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);

    if (profileError) {
      return { success: false, error: `Erro ao atualizar perfil: ${profileError.message}` };
    }

    // Verificar se houve alteração de saldo para logar BALANCE_ADJUSTED
    const saldoAnterior = Number(currentProfile?.saldo) || 0;
    const saldoBonusAnterior = Number(currentProfile?.saldo_bonus) || 0;
    const novoSaldo = data.saldo !== undefined ? data.saldo : saldoAnterior;
    const novoSaldoBonus = data.saldoBonus !== undefined ? data.saldoBonus : saldoBonusAnterior;
    const diferencaSaldo = novoSaldo - saldoAnterior;
    const diferencaBonus = novoSaldoBonus - saldoBonusAnterior;

    if (diferencaSaldo !== 0 || diferencaBonus !== 0) {
      await logAudit({
        actorId: admin?.id || null,
        action: AuditActions.BALANCE_ADJUSTED,
        entity: `user:${userId}`,
        details: {
          user_id: userId,
          user_name: currentProfile?.nome || 'N/A',
          saldo_anterior: saldoAnterior,
          saldo_novo: novoSaldo,
          diferenca_saldo: diferencaSaldo,
          saldo_bonus_anterior: saldoBonusAnterior,
          saldo_bonus_novo: novoSaldoBonus,
          diferenca_bonus: diferencaBonus,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Logar USER_UPDATED para outras alterações (CPF)
    if (data.cpf !== undefined && data.cpf !== currentProfile?.cpf) {
      await logAudit({
        actorId: admin?.id || null,
        action: AuditActions.USER_UPDATED,
        entity: `user:${userId}`,
        details: {
          user_id: userId,
          user_name: currentProfile?.nome || 'N/A',
          field: 'cpf',
          old_value: currentProfile?.cpf ? currentProfile.cpf.slice(0, 3) + '.***.***-' + currentProfile.cpf.slice(-2) : null,
          new_value: data.cpf.slice(0, 3) + '.***.***-' + data.cpf.slice(-2),
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Atualizar senha usando o cliente Admin com Service Role Key
  if (data.newPassword) {
    const adminClient = createAdminClient();
    const { error: passwordError } = await adminClient.auth.admin.updateUserById(
      userId,
      { password: data.newPassword }
    );

    if (passwordError) {
      return { success: false, error: `Erro ao atualizar senha: ${passwordError.message}` };
    }

    // Logar alteração de senha
    await logAudit({
      actorId: admin?.id || null,
      action: AuditActions.USER_UPDATED,
      entity: `user:${userId}`,
      details: {
        user_id: userId,
        user_name: currentProfile?.nome || 'N/A',
        field: 'password',
        change: 'Senha alterada pelo administrador',
        timestamp: new Date().toISOString(),
      },
    });
  }

  return { success: true };
}
