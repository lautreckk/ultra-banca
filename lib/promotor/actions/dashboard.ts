'use server';

import { createClient } from '@/lib/supabase/server';

// =============================================
// TYPES
// =============================================

export interface PromotorDashboardData {
  promotor: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    codigo_afiliado: string;
    saldo: number;
    comissao_deposito_percentual: number | null;
    comissao_perda_percentual: number | null;
    ativo: boolean;
    created_at: string;
  };
  stats: {
    total_indicados: number;
    total_depositado: number;
    total_apostado: number;
    total_comissoes_deposito: number;
    total_comissoes_perda: number;
  };
  ultimasComissoes: {
    id: string;
    user_nome: string;
    tipo: 'deposito' | 'perda' | 'bonus';
    valor_comissao: number;
    created_at: string;
  }[];
}

export interface PromotorReferido {
  id: string;
  user_id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  created_at: string;
  total_depositado: number;
  total_apostado: number;
}

export interface PromotorComissao {
  id: string;
  user_id: string;
  user_nome: string;
  tipo: 'deposito' | 'perda' | 'bonus';
  referencia_id: string;
  valor_base: number;
  percentual_aplicado: number;
  valor_comissao: number;
  created_at: string;
}

// =============================================
// AUTHENTICATION
// =============================================

export async function checkPromotorAuth(): Promise<{ isPromotor: boolean; promotorId: string | null; userId: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isPromotor: false, promotorId: null, userId: null };
  }

  const { data: promotorRole } = await supabase
    .from('promotor_roles')
    .select('promotor_id')
    .eq('user_id', user.id)
    .single();

  if (!promotorRole) {
    return { isPromotor: false, promotorId: null, userId: user.id };
  }

  return { isPromotor: true, promotorId: promotorRole.promotor_id, userId: user.id };
}

// =============================================
// DASHBOARD DATA
// =============================================

export async function getPromotorDashboard(): Promise<PromotorDashboardData | null> {
  const supabase = await createClient();

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Buscar role do promotor
  const { data: promotorRole } = await supabase
    .from('promotor_roles')
    .select('promotor_id')
    .eq('user_id', user.id)
    .single();

  if (!promotorRole) return null;

  const promotorId = promotorRole.promotor_id;

  // Buscar dados do promotor
  const { data: promotor } = await supabase
    .from('promotores')
    .select('*')
    .eq('id', promotorId)
    .single();

  if (!promotor) return null;

  // Buscar referidos
  const { data: referidos, count: totalIndicados } = await supabase
    .from('promotor_referidos')
    .select('user_id', { count: 'exact' })
    .eq('promotor_id', promotorId);

  const userIds = referidos?.map((r) => r.user_id) || [];

  // Buscar totais em paralelo
  const [depositosResult, apostasResult, comissoesResult, ultimasComissoesResult] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from('pagamentos')
          .select('valor')
          .in('user_id', userIds)
          .eq('tipo', 'deposito')
          .eq('status', 'PAID')
      : { data: [] },
    userIds.length > 0
      ? supabase
          .from('apostas')
          .select('valor_total')
          .in('user_id', userIds)
      : { data: [] },
    supabase
      .from('promotor_comissoes')
      .select('tipo, valor_comissao')
      .eq('promotor_id', promotorId),
    supabase
      .from('promotor_comissoes')
      .select(`
        id,
        user_id,
        tipo,
        valor_comissao,
        created_at,
        profiles!inner(nome)
      `)
      .eq('promotor_id', promotorId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalDepositado = depositosResult.data?.reduce(
    (sum, d) => sum + Number(d.valor),
    0
  ) || 0;

  const totalApostado = apostasResult.data?.reduce(
    (sum, a) => sum + Number(a.valor_total),
    0
  ) || 0;

  // Agregar comissões por tipo
  let comissoesDeposito = 0;
  let comissoesPerda = 0;

  comissoesResult.data?.forEach((c) => {
    const valor = Number(c.valor_comissao);
    if (c.tipo === 'deposito') comissoesDeposito += valor;
    else if (c.tipo === 'perda') comissoesPerda += valor;
  });

  // Formatar últimas comissões
  const ultimasComissoes = (ultimasComissoesResult.data || []).map((c) => {
    const profile = c.profiles as unknown as { nome: string };
    return {
      id: c.id,
      user_nome: profile?.nome || 'N/A',
      tipo: c.tipo as 'deposito' | 'perda' | 'bonus',
      valor_comissao: Number(c.valor_comissao),
      created_at: c.created_at,
    };
  });

  return {
    promotor: {
      id: promotor.id,
      nome: promotor.nome,
      email: promotor.email,
      telefone: promotor.telefone,
      codigo_afiliado: promotor.codigo_afiliado,
      saldo: Number(promotor.saldo) || 0,
      comissao_deposito_percentual: promotor.comissao_deposito_percentual ? Number(promotor.comissao_deposito_percentual) : null,
      comissao_perda_percentual: promotor.comissao_perda_percentual ? Number(promotor.comissao_perda_percentual) : null,
      ativo: promotor.ativo,
      created_at: promotor.created_at,
    },
    stats: {
      total_indicados: totalIndicados || 0,
      total_depositado: totalDepositado,
      total_apostado: totalApostado,
      total_comissoes_deposito: comissoesDeposito,
      total_comissoes_perda: comissoesPerda,
    },
    ultimasComissoes,
  };
}

// =============================================
// REFERIDOS
// =============================================

export async function getPromotorReferidos(
  params: { page?: number; pageSize?: number } = {}
): Promise<{ referidos: PromotorReferido[]; total: number }> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { referidos: [], total: 0 };

  // Buscar role do promotor
  const { data: promotorRole } = await supabase
    .from('promotor_roles')
    .select('promotor_id')
    .eq('user_id', user.id)
    .single();

  if (!promotorRole) return { referidos: [], total: 0 };

  const promotorId = promotorRole.promotor_id;

  // Buscar referidos com dados do profile
  const { data: referidos, count, error } = await supabase
    .from('promotor_referidos')
    .select(`
      id,
      user_id,
      created_at,
      profiles!inner(nome, cpf, telefone)
    `, { count: 'exact' })
    .eq('promotor_id', promotorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching referidos:', error);
    return { referidos: [], total: 0 };
  }

  // Buscar totais de depósitos e apostas para cada referido
  const userIds = referidos?.map((r) => r.user_id) || [];

  const [depositosResult, apostasResult] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from('pagamentos')
          .select('user_id, valor')
          .in('user_id', userIds)
          .eq('tipo', 'deposito')
          .eq('status', 'PAID')
      : { data: [] },
    userIds.length > 0
      ? supabase
          .from('apostas')
          .select('user_id, valor_total')
          .in('user_id', userIds)
      : { data: [] },
  ]);

  // Agregar totais
  const depositosMap = new Map<string, number>();
  depositosResult.data?.forEach((d) => {
    depositosMap.set(d.user_id, (depositosMap.get(d.user_id) || 0) + Number(d.valor));
  });

  const apostasMap = new Map<string, number>();
  apostasResult.data?.forEach((a) => {
    apostasMap.set(a.user_id, (apostasMap.get(a.user_id) || 0) + Number(a.valor_total));
  });

  const result: PromotorReferido[] = (referidos || []).map((r) => {
    const profile = r.profiles as unknown as { nome: string; cpf: string; telefone: string | null };
    return {
      id: r.id,
      user_id: r.user_id,
      nome: profile?.nome || 'N/A',
      cpf: profile?.cpf || 'N/A',
      telefone: profile?.telefone || null,
      created_at: r.created_at,
      total_depositado: depositosMap.get(r.user_id) || 0,
      total_apostado: apostasMap.get(r.user_id) || 0,
    };
  });

  return { referidos: result, total: count || 0 };
}

// =============================================
// COMISSÕES
// =============================================

export async function getPromotorComissoes(
  params: { page?: number; pageSize?: number; tipo?: string } = {}
): Promise<{ comissoes: PromotorComissao[]; total: number }> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, tipo } = params;
  const offset = (page - 1) * pageSize;

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { comissoes: [], total: 0 };

  // Buscar role do promotor
  const { data: promotorRole } = await supabase
    .from('promotor_roles')
    .select('promotor_id')
    .eq('user_id', user.id)
    .single();

  if (!promotorRole) return { comissoes: [], total: 0 };

  const promotorId = promotorRole.promotor_id;

  let query = supabase
    .from('promotor_comissoes')
    .select(`
      id,
      user_id,
      tipo,
      referencia_id,
      valor_base,
      percentual_aplicado,
      valor_comissao,
      created_at,
      profiles!inner(nome)
    `, { count: 'exact' })
    .eq('promotor_id', promotorId);

  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching comissoes:', error);
    return { comissoes: [], total: 0 };
  }

  const comissoes: PromotorComissao[] = (data || []).map((c) => {
    const profile = c.profiles as unknown as { nome: string };
    return {
      id: c.id,
      user_id: c.user_id,
      user_nome: profile?.nome || 'N/A',
      tipo: c.tipo as 'deposito' | 'perda' | 'bonus',
      referencia_id: c.referencia_id,
      valor_base: Number(c.valor_base),
      percentual_aplicado: Number(c.percentual_aplicado),
      valor_comissao: Number(c.valor_comissao),
      created_at: c.created_at,
    };
  });

  return { comissoes, total: count || 0 };
}

// =============================================
// LOGOUT
// =============================================

export async function logoutPromotor(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
