'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/tracker';
import { AuditActions } from '@/lib/security/audit-actions';

// =============================================
// TYPES
// =============================================

export interface Promotor {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  codigo_afiliado: string;
  comissao_deposito_percentual: number | null;
  comissao_perda_percentual: number | null;
  saldo: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Computed fields
  total_indicados?: number;
  total_comissoes?: number;
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

export interface PromotoresListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'todos' | 'ativos' | 'inativos';
}

export interface PromotoresListResult {
  promotores: Promotor[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreatePromotorData {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  codigo_afiliado?: string;
  comissao_deposito_percentual?: number;
  comissao_perda_percentual?: number;
}

export interface UpdatePromotorData {
  nome?: string;
  telefone?: string;
  comissao_deposito_percentual?: number | null;
  comissao_perda_percentual?: number | null;
  ativo?: boolean;
}

// =============================================
// PROMOTORES CRUD
// =============================================

export async function getPromotores(params: PromotoresListParams = {}): Promise<PromotoresListResult> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, search, status = 'todos' } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('promotores')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,codigo_afiliado.ilike.%${search}%`);
  }

  if (status === 'ativos') {
    query = query.eq('ativo', true);
  } else if (status === 'inativos') {
    query = query.eq('ativo', false);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching promotores:', error);
    return { promotores: [], total: 0, page, pageSize };
  }

  // Buscar contagem de indicados e comissões para cada promotor
  const promotorIds = data?.map((p) => p.id) || [];

  const [referidosResult, comissoesResult] = await Promise.all([
    supabase
      .from('promotor_referidos')
      .select('promotor_id')
      .in('promotor_id', promotorIds),
    supabase
      .from('promotor_comissoes')
      .select('promotor_id, valor_comissao')
      .in('promotor_id', promotorIds),
  ]);

  // Agregar contagens
  const referidosCount = new Map<string, number>();
  referidosResult.data?.forEach((r) => {
    referidosCount.set(r.promotor_id, (referidosCount.get(r.promotor_id) || 0) + 1);
  });

  const comissoesTotal = new Map<string, number>();
  comissoesResult.data?.forEach((c) => {
    comissoesTotal.set(c.promotor_id, (comissoesTotal.get(c.promotor_id) || 0) + Number(c.valor_comissao));
  });

  const promotores: Promotor[] = (data || []).map((p) => ({
    id: p.id,
    user_id: p.user_id,
    nome: p.nome,
    email: p.email,
    telefone: p.telefone,
    codigo_afiliado: p.codigo_afiliado,
    comissao_deposito_percentual: p.comissao_deposito_percentual ? Number(p.comissao_deposito_percentual) : null,
    comissao_perda_percentual: p.comissao_perda_percentual ? Number(p.comissao_perda_percentual) : null,
    saldo: Number(p.saldo) || 0,
    ativo: p.ativo,
    created_at: p.created_at,
    updated_at: p.updated_at,
    created_by: p.created_by,
    total_indicados: referidosCount.get(p.id) || 0,
    total_comissoes: comissoesTotal.get(p.id) || 0,
  }));

  return { promotores, total: count || 0, page, pageSize };
}

export async function getPromotorById(id: string): Promise<Promotor | null> {
  const supabase = await createClient();

  const { data: promotor, error } = await supabase
    .from('promotores')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !promotor) {
    return null;
  }

  // Buscar stats
  const [referidosResult, comissoesResult] = await Promise.all([
    supabase
      .from('promotor_referidos')
      .select('*', { count: 'exact', head: true })
      .eq('promotor_id', id),
    supabase
      .from('promotor_comissoes')
      .select('valor_comissao')
      .eq('promotor_id', id),
  ]);

  const totalComissoes = comissoesResult.data?.reduce(
    (sum, c) => sum + Number(c.valor_comissao),
    0
  ) || 0;

  return {
    id: promotor.id,
    user_id: promotor.user_id,
    nome: promotor.nome,
    email: promotor.email,
    telefone: promotor.telefone,
    codigo_afiliado: promotor.codigo_afiliado,
    comissao_deposito_percentual: promotor.comissao_deposito_percentual ? Number(promotor.comissao_deposito_percentual) : null,
    comissao_perda_percentual: promotor.comissao_perda_percentual ? Number(promotor.comissao_perda_percentual) : null,
    saldo: Number(promotor.saldo) || 0,
    ativo: promotor.ativo,
    created_at: promotor.created_at,
    updated_at: promotor.updated_at,
    created_by: promotor.created_by,
    total_indicados: referidosResult.count || 0,
    total_comissoes: totalComissoes,
  };
}

function generateCodigoAfiliado(nome: string): string {
  // Pegar as primeiras letras do nome e adicionar números aleatórios
  const prefix = nome
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4);
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${randomNum}`;
}

export async function createPromotor(data: CreatePromotorData): Promise<{ success: boolean; error?: string; promotor?: Promotor }> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Gerar código de afiliado se não fornecido
  const codigoAfiliado = data.codigo_afiliado || generateCodigoAfiliado(data.nome);

  // Verificar se código já existe
  const { data: existingCode } = await supabase
    .from('promotores')
    .select('id')
    .eq('codigo_afiliado', codigoAfiliado.toUpperCase())
    .single();

  if (existingCode) {
    return { success: false, error: 'Código de afiliado já existe' };
  }

  // Verificar se email já existe
  const { data: existingEmail } = await supabase
    .from('promotores')
    .select('id')
    .eq('email', data.email.toLowerCase())
    .single();

  if (existingEmail) {
    return { success: false, error: 'Email já cadastrado como promotor' };
  }

  // Criar usuário no auth
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email.toLowerCase(),
    password: data.senha,
    email_confirm: true,
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return { success: false, error: `Erro ao criar usuário: ${authError.message}` };
  }

  // Criar registro do promotor
  const { data: promotor, error: promotorError } = await supabase
    .from('promotores')
    .insert({
      user_id: authUser.user.id,
      nome: data.nome,
      email: data.email.toLowerCase(),
      telefone: data.telefone || null,
      codigo_afiliado: codigoAfiliado.toUpperCase(),
      comissao_deposito_percentual: data.comissao_deposito_percentual || null,
      comissao_perda_percentual: data.comissao_perda_percentual || null,
      created_by: admin?.id || null,
    })
    .select()
    .single();

  if (promotorError) {
    // Rollback: deletar usuário criado
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    console.error('Error creating promotor:', promotorError);
    return { success: false, error: `Erro ao criar promotor: ${promotorError.message}` };
  }

  // Criar role de promotor
  const { error: roleError } = await supabase
    .from('promotor_roles')
    .insert({
      user_id: authUser.user.id,
      promotor_id: promotor.id,
    });

  if (roleError) {
    console.error('Error creating promotor role:', roleError);
    // Não fazemos rollback completo aqui, pois o promotor já foi criado
  }

  // Log de auditoria
  await logAudit({
    actorId: admin?.id || null,
    action: AuditActions.USER_CREATED,
    entity: `promotor:${promotor.id}`,
    details: {
      promotor_id: promotor.id,
      nome: data.nome,
      email: data.email,
      codigo_afiliado: codigoAfiliado.toUpperCase(),
      timestamp: new Date().toISOString(),
    },
  });

  return {
    success: true,
    promotor: {
      ...promotor,
      comissao_deposito_percentual: promotor.comissao_deposito_percentual ? Number(promotor.comissao_deposito_percentual) : null,
      comissao_perda_percentual: promotor.comissao_perda_percentual ? Number(promotor.comissao_perda_percentual) : null,
      saldo: Number(promotor.saldo) || 0,
      total_indicados: 0,
      total_comissoes: 0,
    },
  };
}

export async function updatePromotor(id: string, data: UpdatePromotorData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Buscar dados anteriores
  const { data: currentPromotor } = await supabase
    .from('promotores')
    .select('*')
    .eq('id', id)
    .single();

  if (!currentPromotor) {
    return { success: false, error: 'Promotor não encontrado' };
  }

  const updates: Record<string, unknown> = {};

  if (data.nome !== undefined) updates.nome = data.nome;
  if (data.telefone !== undefined) updates.telefone = data.telefone;
  if (data.comissao_deposito_percentual !== undefined) updates.comissao_deposito_percentual = data.comissao_deposito_percentual;
  if (data.comissao_perda_percentual !== undefined) updates.comissao_perda_percentual = data.comissao_perda_percentual;
  if (data.ativo !== undefined) updates.ativo = data.ativo;

  const { error } = await supabase
    .from('promotores')
    .update(updates)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Log de auditoria
  await logAudit({
    actorId: admin?.id || null,
    action: AuditActions.USER_UPDATED,
    entity: `promotor:${id}`,
    details: {
      promotor_id: id,
      changes: data,
      previous: {
        nome: currentPromotor.nome,
        telefone: currentPromotor.telefone,
        comissao_deposito_percentual: currentPromotor.comissao_deposito_percentual,
        comissao_perda_percentual: currentPromotor.comissao_perda_percentual,
        ativo: currentPromotor.ativo,
      },
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true };
}

export async function deletePromotor(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Buscar promotor
  const { data: promotor } = await supabase
    .from('promotores')
    .select('user_id, nome, email')
    .eq('id', id)
    .single();

  if (!promotor) {
    return { success: false, error: 'Promotor não encontrado' };
  }

  // Deletar usuário do auth (cascadeia para promotores e promotor_roles)
  const { error: authError } = await adminClient.auth.admin.deleteUser(promotor.user_id);

  if (authError) {
    console.error('Error deleting auth user:', authError);
    return { success: false, error: `Erro ao deletar usuário: ${authError.message}` };
  }

  // Log de auditoria
  await logAudit({
    actorId: admin?.id || null,
    action: AuditActions.USER_DELETED,
    entity: `promotor:${id}`,
    details: {
      promotor_id: id,
      nome: promotor.nome,
      email: promotor.email,
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true };
}

// =============================================
// BONUS / SALDO
// =============================================

export async function addBonusToPromotor(
  promotorId: string,
  valor: number,
  motivo?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Buscar promotor
  const { data: promotor } = await supabase
    .from('promotores')
    .select('saldo, nome')
    .eq('id', promotorId)
    .single();

  if (!promotor) {
    return { success: false, error: 'Promotor não encontrado' };
  }

  const novoSaldo = Number(promotor.saldo) + valor;

  // Atualizar saldo
  const { error: updateError } = await supabase
    .from('promotores')
    .update({ saldo: novoSaldo })
    .eq('id', promotorId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Registrar comissão como bônus
  const { error: comissaoError } = await supabase
    .from('promotor_comissoes')
    .insert({
      promotor_id: promotorId,
      user_id: admin?.id || promotorId, // Usa o admin como referência
      tipo: 'bonus',
      referencia_id: promotorId, // Auto-referência para bônus
      valor_base: valor,
      percentual_aplicado: 100,
      valor_comissao: valor,
    });

  if (comissaoError) {
    console.error('Error registering bonus commission:', comissaoError);
  }

  // Log de auditoria
  await logAudit({
    actorId: admin?.id || null,
    action: AuditActions.BALANCE_ADJUSTED,
    entity: `promotor:${promotorId}`,
    details: {
      promotor_id: promotorId,
      promotor_nome: promotor.nome,
      tipo: 'bonus',
      valor: valor,
      saldo_anterior: Number(promotor.saldo),
      saldo_novo: novoSaldo,
      motivo: motivo || 'Bônus adicionado pelo admin',
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true };
}

export async function resetPromotorPassword(
  promotorId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Buscar promotor
  const { data: promotor } = await supabase
    .from('promotores')
    .select('user_id, nome')
    .eq('id', promotorId)
    .single();

  if (!promotor) {
    return { success: false, error: 'Promotor não encontrado' };
  }

  // Atualizar senha
  const { error } = await adminClient.auth.admin.updateUserById(
    promotor.user_id,
    { password: newPassword }
  );

  if (error) {
    return { success: false, error: `Erro ao atualizar senha: ${error.message}` };
  }

  // Log de auditoria
  await logAudit({
    actorId: admin?.id || null,
    action: AuditActions.USER_UPDATED,
    entity: `promotor:${promotorId}`,
    details: {
      promotor_id: promotorId,
      promotor_nome: promotor.nome,
      field: 'password',
      change: 'Senha alterada pelo administrador',
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true };
}

// =============================================
// REFERIDOS E COMISSÕES
// =============================================

export async function getPromotorReferidos(
  promotorId: string,
  params: { page?: number; pageSize?: number } = {}
): Promise<{ referidos: PromotorReferido[]; total: number }> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;

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
    supabase
      .from('pagamentos')
      .select('user_id, valor')
      .in('user_id', userIds)
      .eq('tipo', 'deposito')
      .eq('status', 'PAID'),
    supabase
      .from('apostas')
      .select('user_id, valor_total')
      .in('user_id', userIds),
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

export async function getPromotorComissoes(
  promotorId: string,
  params: { page?: number; pageSize?: number; tipo?: string } = {}
): Promise<{ comissoes: PromotorComissao[]; total: number }> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, tipo } = params;
  const offset = (page - 1) * pageSize;

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
// ESTATÍSTICAS DO PROMOTOR
// =============================================

export interface PromotorStats {
  total_indicados: number;
  total_depositado: number;
  total_apostado: number;
  total_comissoes_deposito: number;
  total_comissoes_perda: number;
  total_comissoes_bonus: number;
  saldo_atual: number;
}

export async function getPromotorStats(promotorId: string): Promise<PromotorStats | null> {
  const supabase = await createClient();

  // Buscar promotor
  const { data: promotor } = await supabase
    .from('promotores')
    .select('saldo')
    .eq('id', promotorId)
    .single();

  if (!promotor) {
    return null;
  }

  // Buscar referidos
  const { data: referidos, count: totalIndicados } = await supabase
    .from('promotor_referidos')
    .select('user_id', { count: 'exact' })
    .eq('promotor_id', promotorId);

  const userIds = referidos?.map((r) => r.user_id) || [];

  // Buscar totais em paralelo
  const [depositosResult, apostasResult, comissoesResult] = await Promise.all([
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
  let comissoesBonus = 0;

  comissoesResult.data?.forEach((c) => {
    const valor = Number(c.valor_comissao);
    if (c.tipo === 'deposito') comissoesDeposito += valor;
    else if (c.tipo === 'perda') comissoesPerda += valor;
    else if (c.tipo === 'bonus') comissoesBonus += valor;
  });

  return {
    total_indicados: totalIndicados || 0,
    total_depositado: totalDepositado,
    total_apostado: totalApostado,
    total_comissoes_deposito: comissoesDeposito,
    total_comissoes_perda: comissoesPerda,
    total_comissoes_bonus: comissoesBonus,
    saldo_atual: Number(promotor.saldo) || 0,
  };
}

// =============================================
// CONFIGURAÇÃO DE COMISSÃO AUTOMÁTICA
// =============================================

export async function getComissaoAutomaticaSetting(): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('platform_config')
    .select('comissao_promotor_automatica')
    .single();

  return data?.comissao_promotor_automatica ?? true;
}

export async function updateComissaoAutomaticaSetting(value: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('platform_config')
    .update({ comissao_promotor_automatica: value })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Atualiza qualquer registro

  if (error) {
    return { success: false, error: error.message };
  }

  // Log de auditoria
  await logAudit({
    actorId: admin?.id || null,
    action: AuditActions.SETTINGS_UPDATED,
    entity: 'platform_config',
    details: {
      setting: 'comissao_promotor_automatica',
      value: value,
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true };
}

// =============================================
// PROCESSAR COMISSÃO DE DEPÓSITO
// =============================================

export async function processarComissaoDeposito(
  userId: string,
  depositoId: string,
  valorDeposito: number
): Promise<{ success: boolean; comissao?: number }> {
  const supabase = await createClient();

  // Verificar se usuário foi indicado por promotor
  const { data: referido } = await supabase
    .from('promotor_referidos')
    .select(`
      promotor_id,
      promotores!inner(
        id,
        comissao_deposito_percentual,
        ativo,
        saldo
      )
    `)
    .eq('user_id', userId)
    .single();

  if (!referido) {
    return { success: true }; // Usuário não foi indicado
  }

  const promotor = referido.promotores as unknown as {
    id: string;
    comissao_deposito_percentual: number | null;
    ativo: boolean;
    saldo: number;
  };

  // Verificar se promotor está ativo e tem comissão configurada
  if (!promotor.ativo || !promotor.comissao_deposito_percentual) {
    return { success: true }; // Promotor inativo ou sem comissão
  }

  const percentual = Number(promotor.comissao_deposito_percentual);
  const valorComissao = (valorDeposito * percentual) / 100;

  // Registrar comissão
  const { error: comissaoError } = await supabase
    .from('promotor_comissoes')
    .insert({
      promotor_id: promotor.id,
      user_id: userId,
      tipo: 'deposito',
      referencia_id: depositoId,
      valor_base: valorDeposito,
      percentual_aplicado: percentual,
      valor_comissao: valorComissao,
    });

  if (comissaoError) {
    console.error('Error registering commission:', comissaoError);
    return { success: false };
  }

  // Creditar saldo do promotor
  const novoSaldo = Number(promotor.saldo) + valorComissao;
  const { error: saldoError } = await supabase
    .from('promotores')
    .update({ saldo: novoSaldo })
    .eq('id', promotor.id);

  if (saldoError) {
    console.error('Error updating promotor balance:', saldoError);
  }

  return { success: true, comissao: valorComissao };
}
