'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';
import { logAudit } from '@/lib/security/tracker';
import { AuditActions } from '@/lib/security/audit-actions';
import { executeTrigger } from './evolution';
import { dispatchDepositWebhook } from '@/lib/webhooks/dispatcher';
import { applyDepositBonus } from './bonus-config';
import { processarComissaoDeposito, getComissaoAutomaticaSetting } from './promotores';
import { getPlatformId } from '@/lib/utils/platform';
import { WashPayClient, type WashPayPixKeyType } from '@/lib/washpay/client';
import { sanitizeSearchParam } from '@/lib/utils/sanitize';

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
  await requireAdmin();
  const supabase = await createClient();
  const { page = 1, pageSize = 20, status, search } = params;
  const offset = (page - 1) * pageSize;

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

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
    .eq('tipo', 'deposito')
    .eq('platform_id', platformId);  // MULTI-TENANT: Filtro por plataforma

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    const safe = sanitizeSearchParam(search);
    if (safe.length > 0) {
      query = query.or(`profiles.nome.ilike.%${safe}%,profiles.cpf.ilike.%${safe}%`);
    }
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
  await requireAdmin();
  const supabase = await createClient();

  // Get deposit info (including wallet_type)
  const { data: deposit, error: fetchError } = await supabase
    .from('pagamentos')
    .select('user_id, valor, status, wallet_type')
    .eq('id', depositId)
    .single();

  if (fetchError || !deposit) {
    return { success: false, error: 'Depósito não encontrado' };
  }

  if (deposit.status !== 'PENDING') {
    return { success: false, error: 'Depósito já foi processado' };
  }

  // SECURITY: Use service_role client for atomic operations
  const adminClient = createAdminClient();

  // ATOMIC: Transition status PENDING→PAID (prevents double-approve race condition)
  const { data: transitioned } = await adminClient.rpc('atomic_status_transition', {
    p_table: 'pagamentos',
    p_id: depositId,
    p_from_status: 'PENDING',
    p_to_status: 'PAID',
  });

  if (!transitioned) {
    return { success: false, error: 'Depósito já foi processado por outro operador' };
  }

  // Update paid_at
  await adminClient.from('pagamentos').update({ paid_at: new Date().toISOString() }).eq('id', depositId);

  // ATOMIC: Credit balance (no read-modify-write race condition)
  const walletType = deposit.wallet_type || 'tradicional';
  const balanceField = walletType === 'cassino' ? 'saldo_cassino' : 'saldo';

  const { data: newBalance, error: balanceError } = await adminClient.rpc('atomic_credit_balance', {
    p_user_id: deposit.user_id,
    p_amount: Number(deposit.valor),
    p_wallet: balanceField,
  });

  if (balanceError) {
    // Rollback deposit status
    await adminClient.rpc('atomic_status_transition', {
      p_table: 'pagamentos', p_id: depositId, p_from_status: 'PAID', p_to_status: 'PENDING',
    });
    return { success: false, error: 'Erro ao atualizar saldo do usuário' };
  }

  // Aplicar bônus de depósito (se houver faixa configurada)
  let bonusApplied = 0;
  try {
    const bonusResult = await applyDepositBonus(
      deposit.user_id,
      depositId,
      Number(deposit.valor),
      undefined,
      walletType as 'tradicional' | 'cassino'
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
  await requireAdmin();
  const supabase = await createClient();
  const { page = 1, pageSize = 20, status, search } = params;
  const offset = (page - 1) * pageSize;

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

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
    `, { count: 'exact' })
    .eq('platform_id', platformId);  // MULTI-TENANT: Filtro por plataforma

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    const safe = sanitizeSearchParam(search);
    if (safe.length > 0) {
      query = query.or(`profiles.nome.ilike.%${safe}%,profiles.cpf.ilike.%${safe}%,chave_pix.ilike.%${safe}%`);
    }
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

// Mapeia tipo_chave do banco para o formato da WashPay API
function mapTipoChaveToWashPay(tipoChave: string): WashPayPixKeyType {
  const mapping: Record<string, WashPayPixKeyType> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    telefone: 'PHONE',
    email: 'EMAIL',
    aleatoria: 'RANDOM_KEY',
  };
  return mapping[tipoChave.toLowerCase()] || 'CPF';
}

export async function approveWithdrawal(withdrawalId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
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

  // SECURITY: Use service_role client for atomic operations
  const adminClient = createAdminClient();

  // ATOMIC: Transition status PENDING→PROCESSING (prevents double-approve race condition)
  const { data: transitioned } = await adminClient.rpc('atomic_status_transition', {
    p_table: 'saques',
    p_id: withdrawalId,
    p_from_status: 'PENDING',
    p_to_status: 'PROCESSING',
  });

  if (!transitioned) {
    return { success: false, error: 'Saque já está sendo processado por outro operador' };
  }

  // Buscar API key do WashPay na gateway_config
  const platformId = await getPlatformId();
  const { data: gatewayConfig } = await supabase
    .from('gateway_config')
    .select('client_id')
    .eq('gateway_name', 'washpay')
    .eq('platform_id', platformId)
    .single();

  if (!gatewayConfig?.client_id) {
    await adminClient.rpc('atomic_status_transition', {
      p_table: 'saques', p_id: withdrawalId, p_from_status: 'PROCESSING', p_to_status: 'PENDING',
    });
    return { success: false, error: 'API Key do WashPay não configurada. Vá em Pagamentos > WashPay para configurar.' };
  }

  // Chamar WashPay API para fazer o PIX automaticamente
  try {
    const washpay = new WashPayClient(gatewayConfig.client_id);
    const washpayResponse = await washpay.requestWithdrawal({
      pixKeyType: mapTipoChaveToWashPay(withdrawal.tipo_chave),
      pixKey: withdrawal.chave_pix,
      amount: Number(withdrawal.valor_liquido),
    });

    if (!washpayResponse.success) {
      // WashPay rejeitou — voltar para PENDING (atomic)
      await adminClient.rpc('atomic_status_transition', {
        p_table: 'saques', p_id: withdrawalId, p_from_status: 'PROCESSING', p_to_status: 'PENDING',
      });
      return { success: false, error: 'WashPay recusou o saque. Tente novamente.' };
    }

    // ATOMIC: Transition PROCESSING→PAID and save transaction ID
    const { data: paidTransitioned } = await adminClient.rpc('atomic_status_transition', {
      p_table: 'saques',
      p_id: withdrawalId,
      p_from_status: 'PROCESSING',
      p_to_status: 'PAID',
    });

    if (!paidTransitioned) {
      return { success: false, error: 'Estado do saque mudou inesperadamente' };
    }

    // Update paid_at and transaction ID
    await adminClient.from('saques').update({
      paid_at: new Date().toISOString(),
      bspay_transaction_id: washpayResponse.data.id,
    }).eq('id', withdrawalId);
  } catch (error) {
    // Erro na chamada — voltar para PENDING (atomic)
    console.error('Erro ao chamar WashPay withdrawal:', error);
    await adminClient.rpc('atomic_status_transition', {
      p_table: 'saques', p_id: withdrawalId, p_from_status: 'PROCESSING', p_to_status: 'PENDING',
    });
    return {
      success: false,
      error: `Erro ao processar PIX via WashPay: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
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
      gateway: 'washpay',
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
  await requireAdmin();
  const supabase = await createClient();

  // Obter admin atual
  const { data: { user: admin } } = await supabase.auth.getUser();

  // Get withdrawal info (including wallet_type)
  const { data: withdrawal, error: fetchError } = await supabase
    .from('saques')
    .select('user_id, valor, chave_pix, tipo_chave, status, wallet_type')
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

  // SECURITY: Use service_role client for atomic operations
  const adminClient = createAdminClient();

  // ATOMIC: Transition status PENDING→REJECTED (prevents double-reject race condition)
  const { data: transitioned } = await adminClient.rpc('atomic_status_transition', {
    p_table: 'saques',
    p_id: withdrawalId,
    p_from_status: 'PENDING',
    p_to_status: 'REJECTED',
  });

  if (!transitioned) {
    return { success: false, error: 'Saque já foi processado por outro operador' };
  }

  // Update error message
  await adminClient.from('saques').update({
    error_message: reason || 'Rejeitado pelo administrador',
  }).eq('id', withdrawalId);

  // ATOMIC: Return balance to correct wallet (no read-modify-write race condition)
  const saqueWalletType = withdrawal.wallet_type || 'tradicional';
  const saqueBalanceField = saqueWalletType === 'cassino' ? 'saldo_cassino' : 'saldo';

  const { error: balanceError } = await adminClient.rpc('atomic_credit_balance', {
    p_user_id: withdrawal.user_id,
    p_amount: Number(withdrawal.valor),
    p_wallet: saqueBalanceField,
  });

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

// =============================================
// CHECK PENDING PAYMENTS (POLLING)
// =============================================

export interface CheckPendingResult {
  success: boolean;
  checked: number;
  confirmed: number;
  errors: number;
  total_pending: number;
  results?: Array<{ id: string; status: string; provider: string; confirmed: boolean }>;
  error?: string;
}

export async function checkPendingPayments(): Promise<CheckPendingResult> {
  await requireAdmin();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { success: false, checked: 0, confirmed: 0, errors: 0, total_pending: 0, error: 'Missing env vars' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/check-pending-payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hours_back: 48, limit: 200 }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, checked: 0, confirmed: 0, errors: 0, total_pending: 0, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
    }

    const data = await response.json();
    return {
      success: true,
      checked: data.checked || 0,
      confirmed: data.confirmed || 0,
      errors: data.errors || 0,
      total_pending: data.total_pending || 0,
      results: data.results,
    };
  } catch (error) {
    return { success: false, checked: 0, confirmed: 0, errors: 0, total_pending: 0, error: String(error) };
  }
}
