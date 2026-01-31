'use server';

import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// =============================================
// TYPES
// =============================================

export interface WebhookPayload {
  event: string;
  event_id: string;
  timestamp: string;
  data?: LeadPayload; // Campo principal para ScaleCore e outros CRMs
  lead?: LeadPayload; // Mantido para compatibilidade legada
  platform: {
    name: string;
    environment: string;
  };
  [key: string]: unknown;
}

export interface LeadPayload {
  id: string;
  cpf: string;
  nome: string;
  telefone: string | null;
  email: string;
  codigo_convite: string | null;
  indicado_por: string | null;
  signup_ip: string | null;
  signup_location: {
    city: string;
    region: string;
    country: string;
  } | null;
  created_at: string;
}

interface WebhookConfig {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  secret_key: string;
  max_retries: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
}

// =============================================
// CORE DISPATCHER FUNCTION
// =============================================

/**
 * Dispara webhooks para todos os endpoints ativos que escutam o evento
 * Esta funcao NAO deve bloquear o fluxo principal - use .catch(() => {})
 */
export async function dispatchWebhooks(
  eventType: string,
  payload: Omit<WebhookPayload, 'event' | 'event_id' | 'timestamp' | 'platform'>
): Promise<void> {
  try {
    const supabase = await createClient();

    // Buscar webhooks ativos que escutam este evento
    const { data: webhooks, error } = await supabase
      .from('webhooks_config')
      .select('id, url, method, headers, secret_key, max_retries, retry_delay_seconds, timeout_seconds')
      .eq('ativo', true)
      .contains('events', [eventType]);

    if (error) {
      console.error('[Webhook] Error fetching webhooks:', error);
      return;
    }

    if (!webhooks || webhooks.length === 0) {
      return; // Nenhum webhook configurado para este evento
    }

    // Montar payload completo
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const fullPayload: WebhookPayload = {
      event: eventType,
      event_id: eventId,
      timestamp,
      platform: {
        name: 'Ultra Banca',
        environment: process.env.NODE_ENV || 'production',
      },
      ...payload,
    };

    // Disparar para cada webhook (em paralelo, mas nao aguardar)
    for (const webhook of webhooks) {
      // Fire and forget - nao bloqueia o fluxo
      sendWebhook(webhook, fullPayload, eventType, eventId).catch((err) => {
        console.error(`[Webhook] Failed to send to ${webhook.url}:`, err);
      });
    }
  } catch (err) {
    console.error('[Webhook] Error in dispatchWebhooks:', err);
  }
}

/**
 * Envia webhook para um endpoint especifico
 */
async function sendWebhook(
  webhook: WebhookConfig,
  payload: WebhookPayload,
  eventType: string,
  eventId: string,
  attemptNumber: number = 1
): Promise<void> {
  const supabase = await createClient();
  const payloadStr = JSON.stringify(payload);
  const timestamp = new Date().toISOString();

  // Gerar assinatura HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', webhook.secret_key)
    .update(payloadStr)
    .digest('hex');

  // Preparar headers
  // Usa 'x-signature' para compatibilidade com ScaleCore e outros CRMs
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-signature': signature,
    'X-Webhook-Signature': `sha256=${signature}`, // Mantém compatibilidade legada
    'X-Webhook-Event': eventType,
    'X-Webhook-Timestamp': timestamp,
    'X-Webhook-Id': eventId,
    ...webhook.headers,
  };

  // Criar log inicial (pending)
  const { data: logEntry } = await supabase
    .from('webhook_logs')
    .insert({
      webhook_id: webhook.id,
      event_type: eventType,
      event_id: eventId,
      request_url: webhook.url,
      request_method: webhook.method || 'POST',
      request_headers: requestHeaders,
      request_body: payload,
      attempt_number: attemptNumber,
      status: 'pending',
    })
    .select('id')
    .single();

  const logId = logEntry?.id;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      (webhook.timeout_seconds || 30) * 1000
    );

    const response = await fetch(webhook.url, {
      method: webhook.method || 'POST',
      headers: requestHeaders,
      body: payloadStr,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    if (response.ok) {
      // Sucesso
      await updateWebhookLog(supabase, logId, {
        response_status: response.status,
        response_body: responseBody.slice(0, 10000),
        response_time_ms: responseTime,
        status: 'success',
        completed_at: new Date().toISOString(),
      });

      await updateWebhookConfig(supabase, webhook.id, {
        last_triggered_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_error: null,
      });
    } else {
      // Falha - verificar retry
      const errorMessage = `HTTP ${response.status}: ${responseBody.slice(0, 200)}`;

      if (attemptNumber < webhook.max_retries) {
        // Agendar retry
        const nextRetryAt = new Date(
          Date.now() + webhook.retry_delay_seconds * 1000 * attemptNumber
        ).toISOString();

        await updateWebhookLog(supabase, logId, {
          response_status: response.status,
          response_body: responseBody.slice(0, 10000),
          response_time_ms: responseTime,
          status: 'retrying',
          error_message: errorMessage,
          next_retry_at: nextRetryAt,
        });

        // Agendar retry com delay exponencial
        setTimeout(() => {
          sendWebhook(webhook, payload, eventType, eventId, attemptNumber + 1).catch(() => {});
        }, webhook.retry_delay_seconds * 1000 * attemptNumber);
      } else {
        // Falha final
        await updateWebhookLog(supabase, logId, {
          response_status: response.status,
          response_body: responseBody.slice(0, 10000),
          response_time_ms: responseTime,
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        });

        await updateWebhookConfig(supabase, webhook.id, {
          last_triggered_at: new Date().toISOString(),
          last_error: errorMessage,
        });
      }
    }
  } catch (err) {
    const responseTime = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

    if (attemptNumber < webhook.max_retries) {
      // Agendar retry
      const nextRetryAt = new Date(
        Date.now() + webhook.retry_delay_seconds * 1000 * attemptNumber
      ).toISOString();

      await updateWebhookLog(supabase, logId, {
        response_time_ms: responseTime,
        status: 'retrying',
        error_message: errorMessage,
        next_retry_at: nextRetryAt,
      });

      // Agendar retry com delay exponencial
      setTimeout(() => {
        sendWebhook(webhook, payload, eventType, eventId, attemptNumber + 1).catch(() => {});
      }, webhook.retry_delay_seconds * 1000 * attemptNumber);
    } else {
      // Falha final
      await updateWebhookLog(supabase, logId, {
        response_time_ms: responseTime,
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      });

      await updateWebhookConfig(supabase, webhook.id, {
        last_triggered_at: new Date().toISOString(),
        last_error: errorMessage,
      });
    }
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

async function updateWebhookLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  logId: string | undefined,
  updates: Record<string, unknown>
): Promise<void> {
  if (!logId) return;

  try {
    await supabase.from('webhook_logs').update(updates).eq('id', logId);
  } catch (err) {
    console.error('[Webhook] Error updating log:', err);
  }
}

async function updateWebhookConfig(
  supabase: Awaited<ReturnType<typeof createClient>>,
  webhookId: string,
  updates: Record<string, unknown>
): Promise<void> {
  try {
    await supabase
      .from('webhooks_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', webhookId);
  } catch (err) {
    console.error('[Webhook] Error updating config:', err);
  }
}

// =============================================
// LEAD-SPECIFIC DISPATCHER
// =============================================

/**
 * Dispara webhook de lead.created
 * Chamada a partir do trackSignup em auth.ts
 */
export async function dispatchLeadWebhook(userId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Buscar dados do perfil
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('[Webhook] Profile not found for lead dispatch:', userId);
      return;
    }

    // Buscar email do usuario em auth.users
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email || `${profile.cpf?.replace(/\D/g, '')}@ultrabanca.app`;

    // Formatar CPF
    const cpfNumeros = profile.cpf?.replace(/\D/g, '') || '';
    const cpfFormatado = cpfNumeros.length === 11
      ? `${cpfNumeros.slice(0, 3)}.${cpfNumeros.slice(3, 6)}.${cpfNumeros.slice(6, 9)}-${cpfNumeros.slice(9)}`
      : profile.cpf;

    // Formatar telefone
    const telefone = profile.telefone
      ? profile.telefone.startsWith('+')
        ? profile.telefone
        : `+55${profile.telefone.replace(/\D/g, '')}`
      : null;

    // Montar location
    const location = profile.last_location || null;
    const signupLocation = location
      ? {
          city: location.city || 'Desconhecida',
          region: location.region || 'Desconhecida',
          country: location.country || 'Brasil',
        }
      : null;

    // Montar dados do lead
    const leadData: LeadPayload = {
      id: profile.id,
      cpf: cpfFormatado,
      nome: profile.nome || 'Nome nao informado',
      telefone,
      email,
      codigo_convite: profile.codigo_convite || null,
      indicado_por: profile.indicado_por || null,
      signup_ip: profile.signup_ip || null,
      signup_location: signupLocation,
      created_at: profile.created_at,
    };

    // Disparar webhook com ambos os formatos para compatibilidade
    // - 'data' para ScaleCore e CRMs modernos
    // - 'lead' para sistemas legados
    await dispatchWebhooks('lead.created', {
      data: leadData,
      lead: leadData,
    });
  } catch (err) {
    console.error('[Webhook] Error dispatching lead webhook:', err);
  }
}

// =============================================
// DEPOSIT WEBHOOK DISPATCHER
// =============================================

export interface DepositPayload {
  id: string;
  user_id: string;
  user_name: string;
  user_cpf: string;
  user_phone: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
}

/**
 * Dispara webhook de deposit.created
 * Chamado quando um depósito é confirmado
 */
export async function dispatchDepositWebhook(
  depositId: string,
  userId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Buscar dados do depósito
    const { data: deposit, error: depositError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', depositId)
      .single();

    if (depositError || !deposit) {
      // Tentar buscar de pagamentos (tabela alternativa)
      const { data: pagamento, error: pagamentoError } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('id', depositId)
        .single();

      if (pagamentoError || !pagamento) {
        console.error('[Webhook] Deposit not found:', depositId);
        return;
      }

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, cpf, telefone')
        .eq('id', userId)
        .single();

      const depositData: DepositPayload = {
        id: pagamento.id,
        user_id: userId,
        user_name: profile?.nome || 'Nome nao informado',
        user_cpf: profile?.cpf || '',
        user_phone: profile?.telefone || null,
        amount: Number(pagamento.valor),
        status: pagamento.status,
        payment_method: pagamento.metodo_pagamento,
        created_at: pagamento.created_at,
        paid_at: pagamento.paid_at,
      };

      await dispatchWebhooks('deposit.created', {
        data: depositData,
      });
      return;
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, cpf, telefone')
      .eq('id', userId)
      .single();

    const depositData: DepositPayload = {
      id: deposit.id,
      user_id: userId,
      user_name: profile?.nome || 'Nome nao informado',
      user_cpf: profile?.cpf || '',
      user_phone: profile?.telefone || null,
      amount: Number(deposit.amount),
      status: deposit.status,
      payment_method: deposit.provider,
      created_at: deposit.created_at,
      paid_at: deposit.verified_at,
    };

    await dispatchWebhooks('deposit.created', {
      data: depositData,
    });
  } catch (err) {
    console.error('[Webhook] Error dispatching deposit webhook:', err);
  }
}

// =============================================
// WITHDRAWAL WEBHOOK DISPATCHER
// =============================================

export interface WithdrawalPayload {
  id: string;
  user_id: string;
  user_name: string;
  user_cpf: string;
  user_phone: string | null;
  amount: number;
  net_amount: number;
  fee: number;
  pix_key: string;
  pix_key_type: string;
  status: string;
  created_at: string;
}

/**
 * Dispara webhook de withdrawal.created
 * Chamado quando um saque é solicitado
 */
export async function dispatchWithdrawalWebhook(
  withdrawalId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Buscar dados do saque
    const { data: saque, error } = await supabase
      .from('saques')
      .select('*, profiles:user_id(nome, cpf, telefone)')
      .eq('id', withdrawalId)
      .single();

    if (error || !saque) {
      console.error('[Webhook] Withdrawal not found:', withdrawalId);
      return;
    }

    const profile = saque.profiles as { nome: string; cpf: string; telefone: string | null } | null;

    const withdrawalData: WithdrawalPayload = {
      id: saque.id,
      user_id: saque.user_id,
      user_name: profile?.nome || 'Nome nao informado',
      user_cpf: profile?.cpf || '',
      user_phone: profile?.telefone || null,
      amount: Number(saque.valor),
      net_amount: Number(saque.valor_liquido),
      fee: Number(saque.taxa),
      pix_key: saque.chave_pix,
      pix_key_type: saque.tipo_chave,
      status: saque.status,
      created_at: saque.created_at,
    };

    await dispatchWebhooks('withdrawal.created', {
      data: withdrawalData,
    });
  } catch (err) {
    console.error('[Webhook] Error dispatching withdrawal webhook:', err);
  }
}
