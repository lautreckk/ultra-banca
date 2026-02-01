'use server';

import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/security/tracker';
import { AuditActions } from '@/lib/security/audit-actions';
import { executeTrigger } from './evolution';
import { dispatchDepositWebhook } from '@/lib/webhooks/dispatcher';
import { applyDepositBonus } from './bonus-config';
import { processarComissaoDeposito, getComissaoAutomaticaSetting } from './promotores';

// =============================================
// DEPOSITS
// =============================================

export interface Deposit {
  id: string;
  user_id: string;
  user_name: string;
  user_cpf: string;
  valor: number;
  status: string;
  tipo: string;
  created_at: string;
  paid_at: string | null;
}

export interface DepositsListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface DepositsListResult {
  deposits: Deposit[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getDeposits(params: DepositsListParams = {}): Promise<DepositsListResult> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, status, search } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('pagamentos')
    .select(`
      id,
      user_id,
      valor,
      status,
      tipo,
      created_at,
      paid_at,
      profiles!inner(nome, cpf)
    `, { count: 'exact' })
    .eq('tipo', 'deposito');

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`profiles.nome.ilike.%${search}%,profiles.cpf.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching deposits:', error);
    return { deposits: [], total: 0, page, pageSize };
  }

  const deposits = (data || []).map((d) => ({
    id: d.id,
    user_id: d.user_id,
    user_name: (d.profiles as unknown as { nome: string; cpf: string })?.nome || 'N/A',
    user_cpf: (d.profiles as unknown as { nome: string; cpf: string })?.cpf || 'N/A',
    valor: Number(d.valor) || 0,
    status: d.status,
    tipo: d.tipo,
    created_at: d.created_at,
    paid_at: d.paid_at,
  }));

  return { deposits, total: count || 0, page, pageSize };
}

export async function approveDeposit(depositId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get deposit info
  const { data: deposit, error: fetchError } = await supabase
    .from('pagamentos')
    .select('user_id, valor, status')
    .eq('id', depositId)
    .single();

  if (fetchError || !deposit) {
    return { success: false, error: 'Depósito não encontrado' };
  }

  if (deposit.status !== 'PENDING') {
    return { success: false, error: 'Depósito já foi processado' };
  }

  // Update deposit status
  const { error: updateError } = await supabase
    .from('pagamentos')
    .update({
      status: 'PAID',
      paid_at: new Date().toISOString(),
    })
    .eq('id', depositId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Update user balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('saldo')
    .eq('id', deposit.user_id)
    .single();

  const newBalance = (Number(profile?.saldo) || 0) + Number(deposit.valor);

  const { error: balanceError } = await supabase
    .from('profiles')
    .update({ saldo: newBalance })
    .eq('id', deposit.user_id);

  if (balanceError) {
    // Rollback deposit status
    await supabase
      .from('pagamentos')
      .update({ status: 'PENDING', paid_at: null })
      .eq('id', depositId);
    return { success: false, error: 'Erro ao atualizar saldo do usuário' };
  }

  // Aplicar bônus de depósito (se houver faixa configurada)
  let bonusApplied = 0;
  try {
    const bonusResult = await applyDepositBonus(
      deposit.user_id,
      depositId,
      Number(deposit.valor)
    );

    if (bonusResult.success && bonusResult.bonusApplied > 0) {
      bonusApplied = bonusResult.bonusApplied;
      console.log(`Bônus de R$ ${bonusApplied} aplicado para depósito ${depositId}`);
    }
  } catch (error) {
    console.error('Erro ao aplicar bônus de depósito:', error);
    // Não falha a operação se o bônus falhar
  }

  // Disparar gatilho de depósito (WhatsApp)
  try {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('nome, telefone, saldo_bonus')
      .eq('id', deposit.user_id)
      .single();

    if (userProfile?.telefone) {
      await executeTrigger('deposito', {
        nome: userProfile.nome || 'Cliente',
        telefone: userProfile.telefone,
        valor: Number(deposit.valor),
        saldo: newBalance,
        bonus: bonusApplied,
        saldo_bonus: Number(userProfile.saldo_bonus) || 0
      });
    }
  } catch (error) {
    console.error('Erro ao disparar gatilho de depósito:', error);
    // Não falha a operação se o gatilho falhar
  }

  // Disparar webhook de depósito (CRM/Integrações externas)
  dispatchDepositWebhook(depositId, deposit.user_id).catch((err) => {
    console.error('Erro ao disparar webhook de depósito:', err);
  });

  // Processar comissão de promotor (se comissão automática estiver ativada)
  try {
    const comissaoAutomatica = await getComissaoAutomaticaSetting();
    if (comissaoAutomatica) {
      const comissaoResult = await processarComissaoDeposito(
        deposit.user_id,
        depositId,
        Number(deposit.valor)
      );
      if (comissaoResult.comissao) {
        console.log(`Comissão de promotor de R$ ${comissaoResult.comissao} processada para depósito ${depositId}`);
      }
    }
  } catch (error) {
    console.error('Erro ao processar comissão de promotor:', error);
    // Não falha a operação se a comissão falhar
  }

  return { success: true };
}

// =============================================
// WITHDRAWALS
// =============================================

export interface Withdrawal {
  id: string;
  user_id: string;
  user_name: string;
  user_cpf: string;
  valor: number;
  valor_liquido: number;
  taxa: number;
  chave_pix: string;
  tipo_chave: string;
  status: string;
  error_message: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface WithdrawalsListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface WithdrawalsListResult {
  withdrawals: Withdrawal[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getWithdrawals(params: WithdrawalsListParams = {}): Promise<WithdrawalsListResult> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, status, search } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('saques')
    .select(`
      id,
      user_id,
      valor,
      valor_liquido,
      taxa,
      chave_pix,
      tipo_chave,
      status,
      error_message,
      created_at,
      paid_at,
      profiles!inner(nome, cpf)
    `, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`profiles.nome.ilike.%${search}%,profiles.cpf.ilike.%${search}%,chave_pix.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching withdrawals:', error);
    return { withdrawals: [], total: 0, page, pageSize };
  }

  const withdrawals = (data || []).map((w) => ({
    id: w.id,
    user_id: w.user_id,
    user_name: (w.profiles as unknown as { nome: string; cpf: string })?.nome || 'N/A',
    user_cpf: (w.profiles as unknown as { nome: string; cpf: string })?.cpf || 'N/A',
    valor: Number(w.valor) || 0,
    valor_liquido: Number(w.valor_liquido) || 0,
    taxa: Number(w.taxa) || 0,
    chave_pix: w.chave_pix,
    tipo_chave: w.tipo_chave,
    status: w.status,
    error_message: w.error_message,
    created_at: w.created_at,
    paid_at: w.paid_at,
  }));

  return { withdrawals, total: count || 0, page, pageSize };
}

export async function approveWithdrawal(withdrawalId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Get withdrawal info
  const { data: withdrawal, error: fetchError } = await supabase
    .from('saques')
    .select('user_id, valor, valor_liquido, chave_pix, tipo_chave, status')
    .eq('id', withdrawalId)
    .single();

  if (fetchError || !withdrawal) {
    return { success: false, error: 'Saque não encontrado' };
  }

  if (withdrawal.status !== 'PENDING') {
    return { success: false, error: 'Saque já foi processado' };
  }

  // Obter dados do usuário
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('nome, cpf')
    .eq('id', withdrawal.user_id)
    .single();

  // Update withdrawal status
  const { error: updateError } = await supabase
    .from('saques')
    .update({
      status: 'PAID',
      paid_at: new Date().toISOString(),
    })
    .eq('id', withdrawalId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Registrar no log de auditoria
  await logAudit({
    actorId: admin?.id || null,
    action: AuditActions.WITHDRAWAL_APPROVED,
    entity: `withdrawal:${withdrawalId}`,
    details: {
      user_id: withdrawal.user_id,
      user_name: userProfile?.nome || 'N/A',
      user_cpf: userProfile?.cpf ? userProfile.cpf.slice(0, 3) + '.***.***-' + userProfile.cpf.slice(-2) : 'N/A',
      valor: withdrawal.valor,
      valor_liquido: withdrawal.valor_liquido,
      chave_pix: withdrawal.chave_pix.slice(0, 4) + '****',
      tipo_chave: withdrawal.tipo_chave,
      timestamp: new Date().toISOString(),
    },
  });

  // Disparar gatilho de saque (WhatsApp)
  try {
    const { data: userProfileWithPhone } = await supabase
      .from('profiles')
      .select('nome, telefone')
      .eq('id', withdrawal.user_id)
      .single();

    if (userProfileWithPhone?.telefone) {
      await executeTrigger('saque', {
        nome: userProfileWithPhone.nome || 'Cliente',
        telefone: userProfileWithPhone.telefone,
        valor: Number(withdrawal.valor_liquido)
      });
    }
  } catch (error) {
    console.error('Erro ao disparar gatilho de saque:', error);
    // Não falha a operação se o gatilho falhar
  }

  return { success: true };
}

export async function rejectWithdrawal(
  withdrawalId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Get withdrawal info
  const { data: withdrawal, error: fetchError } = await supabase
    .from('saques')
    .select('user_id, valor, chave_pix, tipo_chave, status')
    .eq('id', withdrawalId)
    .single();

  if (fetchError || !withdrawal) {
    return { success: false, error: 'Saque não encontrado' };
  }

  if (withdrawal.status !== 'PENDING') {
    return { success: false, error: 'Saque já foi processado' };
  }

  // Obter dados do usuário
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('nome, cpf, saldo')
    .eq('id', withdrawal.user_id)
    .single();

  // Update withdrawal status
  const { error: updateError } = await supabase
    .from('saques')
    .update({
      status: 'REJECTED',
      error_message: reason || 'Rejeitado pelo administrador',
    })
    .eq('id', withdrawalId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Return the balance to user
  const newBalance = (Number(userProfile?.saldo) || 0) + Number(withdrawal.valor);

  const { error: balanceError } = await supabase
    .from('profiles')
    .update({ saldo: newBalance })
    .eq('id', withdrawal.user_id);

  if (balanceError) {
    console.error('Error returning balance to user:', balanceError);
  }

  // Registrar no log de auditoria
  await logAudit({
    actorId: admin?.id || null,
    action: AuditActions.WITHDRAWAL_REJECTED,
    entity: `withdrawal:${withdrawalId}`,
    details: {
      user_id: withdrawal.user_id,
      user_name: userProfile?.nome || 'N/A',
      user_cpf: userProfile?.cpf ? userProfile.cpf.slice(0, 3) + '.***.***-' + userProfile.cpf.slice(-2) : 'N/A',
      valor: withdrawal.valor,
      chave_pix: withdrawal.chave_pix.slice(0, 4) + '****',
      tipo_chave: withdrawal.tipo_chave,
      reason: reason || 'Rejeitado pelo administrador',
      balance_returned: true,
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true };
}
