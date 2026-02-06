'use server';

import { createClient } from '@/lib/supabase/server';
import { getPlatformId } from '@/lib/utils/platform';

// =============================================
// BONUS DEPOSIT CONFIG TYPES
// =============================================

export interface BonusTier {
  id: string;
  deposito_minimo: number;
  bonus_percentual: number;
  bonus_maximo: number | null;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BonusTierListParams {
  page?: number;
  pageSize?: number;
  ativo?: boolean;
}

export interface BonusTierListResult {
  tiers: BonusTier[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateBonusTierInput {
  deposito_minimo: number;
  bonus_percentual: number;
  bonus_maximo?: number | null;
  ativo?: boolean;
}

export interface BonusAppliedRecord {
  id: string;
  user_id: string;
  pagamento_id: string;
  config_id: string | null;
  valor_deposito: number;
  percentual_aplicado: number;
  valor_bonus: number;
  created_at: string;
}

// =============================================
// BONUS TIER CRUD OPERATIONS
// =============================================

/**
 * Lista todas as faixas de bônus de depósito
 */
export async function getBonusTiers(params: BonusTierListParams = {}): Promise<BonusTierListResult> {
  const supabase = await createClient();
  const platformId = await getPlatformId();
  const { page = 1, pageSize = 50, ativo } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('bonus_deposito_config')
    .select('*', { count: 'exact' })
    .eq('platform_id', platformId);

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, count, error } = await query
    .order('deposito_minimo', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching bonus tiers:', error);
    return { tiers: [], total: 0, page, pageSize };
  }

  const tiers = (data || []).map((t) => ({
    id: t.id,
    deposito_minimo: Number(t.deposito_minimo),
    bonus_percentual: Number(t.bonus_percentual),
    bonus_maximo: t.bonus_maximo ? Number(t.bonus_maximo) : null,
    ativo: t.ativo,
    created_by: t.created_by,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));

  return { tiers, total: count || 0, page, pageSize };
}

/**
 * Cria uma nova faixa de bônus
 */
export async function createBonusTier(input: CreateBonusTierInput): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Validações
  if (input.deposito_minimo <= 0) {
    return { success: false, error: 'O depósito mínimo deve ser maior que zero' };
  }

  if (input.bonus_percentual <= 0) {
    return { success: false, error: 'O percentual de bônus deve ser maior que zero' };
  }

  const platformId = await getPlatformId();

  // Verificar se já existe uma faixa com o mesmo valor mínimo nesta plataforma
  const { data: existing } = await supabase
    .from('bonus_deposito_config')
    .select('id')
    .eq('deposito_minimo', input.deposito_minimo)
    .eq('platform_id', platformId)
    .single();

  if (existing) {
    return { success: false, error: 'Já existe uma faixa de bônus para este valor de depósito' };
  }

  const { data, error } = await supabase
    .from('bonus_deposito_config')
    .insert({
      deposito_minimo: input.deposito_minimo,
      bonus_percentual: input.bonus_percentual,
      bonus_maximo: input.bonus_maximo || null,
      ativo: input.ativo ?? true,
      created_by: user?.id || null,
      platform_id: platformId,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

/**
 * Atualiza uma faixa de bônus existente
 */
export async function updateBonusTier(
  id: string,
  input: Partial<CreateBonusTierInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Validações
  if (input.deposito_minimo !== undefined && input.deposito_minimo <= 0) {
    return { success: false, error: 'O depósito mínimo deve ser maior que zero' };
  }

  if (input.bonus_percentual !== undefined && input.bonus_percentual <= 0) {
    return { success: false, error: 'O percentual de bônus deve ser maior que zero' };
  }

  const platformId = await getPlatformId();

  // Se está alterando o deposito_minimo, verificar duplicação na mesma plataforma
  if (input.deposito_minimo !== undefined) {
    const { data: existing } = await supabase
      .from('bonus_deposito_config')
      .select('id')
      .eq('deposito_minimo', input.deposito_minimo)
      .eq('platform_id', platformId)
      .neq('id', id)
      .single();

    if (existing) {
      return { success: false, error: 'Já existe uma faixa de bônus para este valor de depósito' };
    }
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.deposito_minimo !== undefined) updateData.deposito_minimo = input.deposito_minimo;
  if (input.bonus_percentual !== undefined) updateData.bonus_percentual = input.bonus_percentual;
  if (input.bonus_maximo !== undefined) updateData.bonus_maximo = input.bonus_maximo;
  if (input.ativo !== undefined) updateData.ativo = input.ativo;

  const { error } = await supabase
    .from('bonus_deposito_config')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Deleta uma faixa de bônus
 */
export async function deleteBonusTier(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('bonus_deposito_config')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Alterna o status ativo/inativo de uma faixa de bônus
 */
export async function toggleBonusTierStatus(id: string): Promise<{ success: boolean; error?: string; newStatus?: boolean }> {
  const supabase = await createClient();

  // Buscar status atual
  const { data: tier, error: fetchError } = await supabase
    .from('bonus_deposito_config')
    .select('ativo')
    .eq('id', id)
    .single();

  if (fetchError || !tier) {
    return { success: false, error: 'Faixa de bônus não encontrada' };
  }

  const newStatus = !tier.ativo;

  const { error } = await supabase
    .from('bonus_deposito_config')
    .update({ ativo: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, newStatus };
}

// =============================================
// BONUS CALCULATION AND APPLICATION
// =============================================

/**
 * Calcula o bônus para um determinado valor de depósito
 * Retorna a faixa aplicável e o valor do bônus calculado
 */
export async function calculateBonus(valorDeposito: number, platformIdOverride?: string): Promise<{
  tierId: string | null;
  percentual: number;
  valorBonus: number;
  bonusMaximo: number | null;
}> {
  const supabase = await createClient();
  const platformId = platformIdOverride || await getPlatformId();

  // Buscar a faixa de bônus aplicável (maior deposito_minimo <= valorDeposito) para esta plataforma
  const { data: tier } = await supabase
    .from('bonus_deposito_config')
    .select('*')
    .eq('ativo', true)
    .eq('platform_id', platformId)
    .lte('deposito_minimo', valorDeposito)
    .order('deposito_minimo', { ascending: false })
    .limit(1)
    .single();

  if (!tier) {
    return { tierId: null, percentual: 0, valorBonus: 0, bonusMaximo: null };
  }

  const percentual = Number(tier.bonus_percentual);
  let valorBonus = valorDeposito * (percentual / 100);

  // Aplicar teto máximo se configurado
  const bonusMaximo = tier.bonus_maximo ? Number(tier.bonus_maximo) : null;
  if (bonusMaximo && valorBonus > bonusMaximo) {
    valorBonus = bonusMaximo;
  }

  return {
    tierId: tier.id,
    percentual,
    valorBonus: Math.round(valorBonus * 100) / 100, // Arredondar para 2 casas decimais
    bonusMaximo,
  };
}

/**
 * Aplica o bônus de depósito ao usuário
 * Chamado quando um depósito é aprovado
 */
export async function applyDepositBonus(
  userId: string,
  pagamentoId: string,
  valorDeposito: number,
  platformIdOverride?: string
): Promise<{
  success: boolean;
  error?: string;
  bonusApplied: number;
  percentualApplied: number;
}> {
  const supabase = await createClient();
  const platformId = platformIdOverride || await getPlatformId();

  // Verificar se já foi aplicado bônus para este pagamento
  const { data: existingBonus } = await supabase
    .from('bonus_deposito_aplicados')
    .select('id')
    .eq('pagamento_id', pagamentoId)
    .single();

  if (existingBonus) {
    return { success: true, bonusApplied: 0, percentualApplied: 0 }; // Já aplicado, não é erro
  }

  // Calcular bônus para esta plataforma
  const { tierId, percentual, valorBonus } = await calculateBonus(valorDeposito, platformId);

  if (!tierId || valorBonus <= 0) {
    return { success: true, bonusApplied: 0, percentualApplied: 0 }; // Sem bônus aplicável
  }

  // Registrar o bônus aplicado
  const { error: insertError } = await supabase
    .from('bonus_deposito_aplicados')
    .insert({
      user_id: userId,
      pagamento_id: pagamentoId,
      config_id: tierId,
      valor_deposito: valorDeposito,
      percentual_aplicado: percentual,
      valor_bonus: valorBonus,
      platform_id: platformId,
    });

  if (insertError) {
    console.error('Error inserting bonus record:', insertError);
    return { success: false, error: insertError.message, bonusApplied: 0, percentualApplied: 0 };
  }

  // Atualizar saldo_bonus do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('saldo_bonus')
    .eq('id', userId)
    .single();

  const currentBonusBalance = Number(profile?.saldo_bonus) || 0;
  const newBonusBalance = currentBonusBalance + valorBonus;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ saldo_bonus: newBonusBalance })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating bonus balance:', updateError);
    // Tentar reverter o registro de bônus
    await supabase
      .from('bonus_deposito_aplicados')
      .delete()
      .eq('pagamento_id', pagamentoId);
    return { success: false, error: 'Erro ao atualizar saldo de bônus', bonusApplied: 0, percentualApplied: 0 };
  }

  return { success: true, bonusApplied: valorBonus, percentualApplied: percentual };
}

/**
 * Lista histórico de bônus aplicados (para admin)
 */
export async function getBonusHistory(params: {
  page?: number;
  pageSize?: number;
  userId?: string;
}): Promise<{
  records: (BonusAppliedRecord & { user_name?: string; user_cpf?: string })[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await createClient();
  const platformId = await getPlatformId();
  const { page = 1, pageSize = 20, userId } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('bonus_deposito_aplicados')
    .select(`
      *,
      profiles(nome, cpf)
    `, { count: 'exact' })
    .eq('platform_id', platformId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching bonus history:', error);
    return { records: [], total: 0, page, pageSize };
  }

  const records = (data || []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    pagamento_id: r.pagamento_id,
    config_id: r.config_id,
    valor_deposito: Number(r.valor_deposito),
    percentual_aplicado: Number(r.percentual_aplicado),
    valor_bonus: Number(r.valor_bonus),
    created_at: r.created_at,
    user_name: (r.profiles as { nome: string; cpf: string } | null)?.nome || 'N/A',
    user_cpf: (r.profiles as { nome: string; cpf: string } | null)?.cpf || 'N/A',
  }));

  return { records, total: count || 0, page, pageSize };
}
