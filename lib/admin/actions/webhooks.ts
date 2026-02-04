'use server';

import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// =============================================
// TYPES
// =============================================

export interface WebhookConfig {
  id: string;
  name: string;
  description: string | null;
  url: string;
  method: string;
  headers: Record<string, string>;
  secret_key: string;
  events: string[];
  max_retries: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  ativo: boolean;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  event_id: string | null;
  request_url: string;
  request_method: string;
  request_headers: Record<string, string> | null;
  request_body: Record<string, unknown> | null;
  response_status: number | null;
  response_body: string | null;
  response_time_ms: number | null;
  attempt_number: number;
  next_retry_at: string | null;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface WebhookListParams {
  page?: number;
  pageSize?: number;
  ativo?: boolean;
}

export interface WebhookListResult {
  webhooks: WebhookConfig[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WebhookLogsParams {
  webhookId?: string;
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface WebhookLogsResult {
  logs: WebhookLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateWebhookInput {
  name: string;
  description?: string;
  url: string;
  events?: string[];
  max_retries?: number;
  retry_delay_seconds?: number;
  timeout_seconds?: number;
  ativo?: boolean;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Gera uma secret key segura para HMAC
 */
function generateSecretKey(): string {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Mascara uma secret key para exibicao
 */
function maskSecretKey(secret: string): string {
  if (!secret || secret.length < 12) return '****';
  return `${secret.slice(0, 8)}...${secret.slice(-4)}`;
}

// =============================================
// SERVER ACTIONS
// =============================================

/**
 * Lista todos os webhooks (secrets mascarados)
 */
export async function getWebhooks(params: WebhookListParams = {}): Promise<WebhookListResult> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, ativo } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('webhooks_config')
    .select('*', { count: 'exact' });

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching webhooks:', error);
    return { webhooks: [], total: 0, page, pageSize };
  }

  const webhooks = (data || []).map((w) => ({
    ...w,
    secret_key: maskSecretKey(w.secret_key),
  }));

  return { webhooks, total: count || 0, page, pageSize };
}

/**
 * Busca webhook especifico (secret mascarado)
 */
export async function getWebhook(id: string): Promise<{ webhook: WebhookConfig | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('webhooks_config')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching webhook:', error);
    return { webhook: null, error: error.message };
  }

  return {
    webhook: {
      ...data,
      secret_key: maskSecretKey(data.secret_key),
    },
  };
}

/**
 * Cria novo webhook (gera secret automaticamente)
 * Retorna a secret key apenas uma vez no momento da criacao
 */
export async function createWebhook(input: CreateWebhookInput): Promise<{
  success: boolean;
  error?: string;
  id?: string;
  secret_key?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const secretKey = generateSecretKey();

  const { data, error } = await supabase
    .from('webhooks_config')
    .insert({
      name: input.name,
      description: input.description || null,
      url: input.url,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      secret_key: secretKey,
      events: input.events || ['lead.created'],
      max_retries: input.max_retries ?? 3,
      retry_delay_seconds: input.retry_delay_seconds ?? 60,
      timeout_seconds: input.timeout_seconds ?? 30,
      ativo: input.ativo ?? true,
      created_by: user?.id || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating webhook:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    id: data.id,
    secret_key: secretKey, // Retorna apenas na criacao
  };
}

/**
 * Atualiza webhook
 */
export async function updateWebhook(
  id: string,
  input: Partial<Omit<CreateWebhookInput, 'secret_key'>>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.url !== undefined) updateData.url = input.url;
  if (input.events !== undefined) updateData.events = input.events;
  if (input.max_retries !== undefined) updateData.max_retries = input.max_retries;
  if (input.retry_delay_seconds !== undefined) updateData.retry_delay_seconds = input.retry_delay_seconds;
  if (input.timeout_seconds !== undefined) updateData.timeout_seconds = input.timeout_seconds;
  if (input.ativo !== undefined) updateData.ativo = input.ativo;

  const { error } = await supabase
    .from('webhooks_config')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating webhook:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove webhook
 */
export async function deleteWebhook(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('webhooks_config')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting webhook:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Alterna status do webhook
 */
export async function toggleWebhookStatus(id: string): Promise<{
  success: boolean;
  error?: string;
  newStatus?: boolean;
}> {
  const supabase = await createClient();

  const { data: webhook, error: fetchError } = await supabase
    .from('webhooks_config')
    .select('ativo')
    .eq('id', id)
    .single();

  if (fetchError || !webhook) {
    return { success: false, error: 'Webhook nao encontrado' };
  }

  const newStatus = !webhook.ativo;

  const { error } = await supabase
    .from('webhooks_config')
    .update({ ativo: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error toggling webhook status:', error);
    return { success: false, error: error.message };
  }

  return { success: true, newStatus };
}

/**
 * Regenera secret key do webhook
 * Retorna a nova secret key apenas uma vez
 */
export async function regenerateWebhookSecret(id: string): Promise<{
  success: boolean;
  error?: string;
  secret_key?: string;
}> {
  const supabase = await createClient();

  const newSecretKey = generateSecretKey();

  const { error } = await supabase
    .from('webhooks_config')
    .update({
      secret_key: newSecretKey,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error regenerating webhook secret:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    secret_key: newSecretKey, // Retorna apenas na regeneracao
  };
}

/**
 * Testa webhook com payload de teste
 */
export async function testWebhook(id: string): Promise<{
  success: boolean;
  error?: string;
  status?: number;
  responseTime?: number;
}> {
  const supabase = await createClient();

  // Buscar configuracao do webhook (com secret)
  const { data: webhook, error: fetchError } = await supabase
    .from('webhooks_config')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !webhook) {
    return { success: false, error: 'Webhook nao encontrado' };
  }

  // Montar payload de teste
  const eventId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // Payload de teste com ambos os formatos para compatibilidade
  const leadData = {
    id: '00000000-0000-0000-0000-000000000000',
    cpf: '000.000.000-00',
    nome: 'Lead de Teste',
    telefone: '+5511999999999',
    email: 'teste@ultrabanca.app',
    codigo_convite: 'TEST123',
    indicado_por: null,
    signup_ip: '127.0.0.1',
    signup_location: {
      city: 'Sao Paulo',
      region: 'SP',
      country: 'Brasil',
    },
    created_at: timestamp,
  };

  const testPayload = {
    event: 'test.webhook',
    event_id: eventId,
    timestamp,
    test: true,
    data: leadData, // Formato ScaleCore/CRMs modernos
    lead: leadData, // Compatibilidade legada
    platform: {
      name: 'Cúpula Barão',
      environment: process.env.NODE_ENV || 'development',
    },
  };

  const payloadStr = JSON.stringify(testPayload);

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
    'X-Webhook-Event': 'test.webhook',
    'X-Webhook-Timestamp': timestamp,
    'X-Webhook-Id': eventId,
    ...webhook.headers,
  };

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), (webhook.timeout_seconds || 30) * 1000);

    const response = await fetch(webhook.url, {
      method: webhook.method || 'POST',
      headers: requestHeaders,
      body: payloadStr,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    // Criar log do teste
    await supabase.from('webhook_logs').insert({
      webhook_id: id,
      event_type: 'test.webhook',
      event_id: eventId,
      request_url: webhook.url,
      request_method: webhook.method || 'POST',
      request_headers: requestHeaders,
      request_body: testPayload,
      response_status: response.status,
      response_body: responseBody.slice(0, 10000), // Limita tamanho
      response_time_ms: responseTime,
      attempt_number: 1,
      status: response.ok ? 'success' : 'failed',
      error_message: response.ok ? null : `HTTP ${response.status}`,
      completed_at: new Date().toISOString(),
    });

    // Atualizar webhook com resultado do teste
    await supabase
      .from('webhooks_config')
      .update({
        last_triggered_at: new Date().toISOString(),
        last_success_at: response.ok ? new Date().toISOString() : webhook.last_success_at,
        last_error: response.ok ? null : `HTTP ${response.status}: ${responseBody.slice(0, 200)}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return {
      success: response.ok,
      status: response.status,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    const responseTime = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

    // Criar log do erro
    await supabase.from('webhook_logs').insert({
      webhook_id: id,
      event_type: 'test.webhook',
      event_id: eventId,
      request_url: webhook.url,
      request_method: webhook.method || 'POST',
      request_headers: requestHeaders,
      request_body: testPayload,
      response_time_ms: responseTime,
      attempt_number: 1,
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    });

    // Atualizar webhook com erro
    await supabase
      .from('webhooks_config')
      .update({
        last_triggered_at: new Date().toISOString(),
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return {
      success: false,
      error: errorMessage,
      responseTime,
    };
  }
}

/**
 * Lista logs de webhooks
 */
export async function getWebhookLogs(params: WebhookLogsParams = {}): Promise<WebhookLogsResult> {
  const supabase = await createClient();
  const { webhookId, page = 1, pageSize = 50, status } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('webhook_logs')
    .select('*', { count: 'exact' });

  if (webhookId) {
    query = query.eq('webhook_id', webhookId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching webhook logs:', error);
    return { logs: [], total: 0, page, pageSize };
  }

  return { logs: data || [], total: count || 0, page, pageSize };
}

/**
 * Obtem estatisticas do webhook
 */
export async function getWebhookStats(webhookId: string): Promise<{
  total: number;
  success: number;
  failed: number;
  avgResponseTime: number;
}> {
  const supabase = await createClient();

  // Total de logs
  const { count: total } = await supabase
    .from('webhook_logs')
    .select('*', { count: 'exact', head: true })
    .eq('webhook_id', webhookId);

  // Logs de sucesso
  const { count: success } = await supabase
    .from('webhook_logs')
    .select('*', { count: 'exact', head: true })
    .eq('webhook_id', webhookId)
    .eq('status', 'success');

  // Logs de falha
  const { count: failed } = await supabase
    .from('webhook_logs')
    .select('*', { count: 'exact', head: true })
    .eq('webhook_id', webhookId)
    .eq('status', 'failed');

  // Media de tempo de resposta
  const { data: avgData } = await supabase
    .from('webhook_logs')
    .select('response_time_ms')
    .eq('webhook_id', webhookId)
    .not('response_time_ms', 'is', null)
    .limit(100);

  let avgResponseTime = 0;
  if (avgData && avgData.length > 0) {
    const sum = avgData.reduce((acc, log) => acc + (log.response_time_ms || 0), 0);
    avgResponseTime = Math.round(sum / avgData.length);
  }

  return {
    total: total || 0,
    success: success || 0,
    failed: failed || 0,
    avgResponseTime,
  };
}
