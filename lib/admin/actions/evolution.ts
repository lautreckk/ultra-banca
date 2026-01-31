'use server';

import { createClient } from '@/lib/supabase/server';

// =============================================
// TYPES
// =============================================

export interface EvolutionConfig {
  id: string;
  base_url: string;
  global_apikey: string;
  global_apikey_masked: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvolutionInstance {
  id: string;
  instance_name: string;
  instance_apikey: string | null;
  phone_number: string | null;
  status: string;
  qrcode_base64: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvolutionTrigger {
  id: string;
  instance_id: string | null;
  trigger_type: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  instance?: EvolutionInstance;
  messages?: EvolutionTriggerMessage[];
}

export interface EvolutionTriggerMessage {
  id: string;
  trigger_id: string;
  order_index: number;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  content: string | null;
  caption: string | null;
  delay_seconds: number;
  created_at: string;
}

export interface EvolutionMessageLog {
  id: string;
  instance_id: string | null;
  trigger_type: string | null;
  recipient_phone: string;
  message_content: string | null;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string;
}

// =============================================
// HELPERS
// =============================================

const MASKED_PREFIX = '••••••••';

function maskSecret(secret: string | null): string | null {
  if (!secret) return null;
  return MASKED_PREFIX + secret.slice(-4);
}

async function getEvolutionApiConfig(): Promise<{ baseUrl: string; apiKey: string } | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('evolution_config')
    .select('*')
    .eq('ativo', true)
    .single();

  if (!data) return null;

  return {
    baseUrl: data.base_url,
    apiKey: data.global_apikey
  };
}

async function callEvolutionApi(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const config = await getEvolutionApiConfig();

  if (!config) {
    return { success: false, error: 'Evolution API não configurada. Vá em WhatsApp > Configuração para configurar.' };
  }

  const url = `${config.baseUrl}${endpoint}`;

  try {
    // Criar um AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey
      },
      signal: controller.signal
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    // Tentar parsear o JSON, mas pode não ter corpo
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Erro ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMsg };
    }

    return { success: true, data };
  } catch (error) {
    // Tratar diferentes tipos de erros
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: `Timeout: A Evolution API (${config.baseUrl}) não respondeu em 15 segundos. Verifique se o servidor está online.` };
      }

      // Erros de rede comuns
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        return { success: false, error: `Não foi possível conectar à Evolution API (${config.baseUrl}). Verifique se o servidor está online e acessível.` };
      }

      if (error.message.includes('ENOTFOUND')) {
        return { success: false, error: `Endereço não encontrado: ${config.baseUrl}. Verifique se a URL está correta.` };
      }

      if (error.message.includes('certificate') || error.message.includes('SSL')) {
        return { success: false, error: `Erro de certificado SSL ao conectar com ${config.baseUrl}. Verifique o certificado do servidor.` };
      }

      return { success: false, error: `Erro ao conectar: ${error.message}` };
    }

    return { success: false, error: 'Erro desconhecido ao conectar com a Evolution API' };
  }
}

// =============================================
// CONFIGURATION
// =============================================

export async function getEvolutionConfig(): Promise<EvolutionConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('evolution_config')
    .select('*')
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    base_url: data.base_url,
    global_apikey: maskSecret(data.global_apikey) || '',
    global_apikey_masked: !!data.global_apikey,
    ativo: data.ativo,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

export async function saveEvolutionConfig(
  baseUrl: string,
  globalApikey: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verificar se já existe config
  const { data: existing } = await supabase
    .from('evolution_config')
    .select('id, global_apikey')
    .single();

  const updateData: Record<string, unknown> = {
    base_url: baseUrl.replace(/\/$/, ''), // Remove trailing slash
    ativo: true,
    updated_at: new Date().toISOString()
  };

  // Só atualiza apikey se não estiver mascarada
  if (!globalApikey.startsWith(MASKED_PREFIX)) {
    updateData.global_apikey = globalApikey;
  }

  if (existing) {
    const { error } = await supabase
      .from('evolution_config')
      .update(updateData)
      .eq('id', existing.id);

    if (error) return { success: false, error: error.message };
  } else {
    updateData.global_apikey = globalApikey;
    const { error } = await supabase
      .from('evolution_config')
      .insert(updateData);

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function testEvolutionConnection(): Promise<{ success: boolean; error?: string }> {
  const result = await callEvolutionApi('/instance/fetchInstances');
  return result;
}

// =============================================
// INSTANCES
// =============================================

export async function getInstances(): Promise<EvolutionInstance[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('evolution_instances')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

export async function createInstance(
  instanceName: string,
  options?: {
    qrcode?: boolean;
    integration?: string;
    rejectCall?: boolean;
    msgCall?: string;
    groupsIgnore?: boolean;
    alwaysOnline?: boolean;
    readMessages?: boolean;
    readStatus?: boolean;
    syncFullHistory?: boolean;
  }
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const supabase = await createClient();

  // Criar na Evolution API
  const result = await callEvolutionApi('/instance/create', 'POST', {
    instanceName,
    qrcode: options?.qrcode ?? true,
    integration: options?.integration ?? 'WHATSAPP-BAILEYS',
    rejectCall: options?.rejectCall ?? false,
    msgCall: options?.msgCall ?? '',
    groupsIgnore: options?.groupsIgnore ?? true,
    alwaysOnline: options?.alwaysOnline ?? false,
    readMessages: options?.readMessages ?? false,
    readStatus: options?.readStatus ?? false,
    syncFullHistory: options?.syncFullHistory ?? false
  });

  if (!result.success) {
    return result;
  }

  // Salvar no banco local
  const instanceData = result.data as { instance?: { instanceName: string }; hash?: string; qrcode?: { base64?: string } };

  const { error } = await supabase
    .from('evolution_instances')
    .insert({
      instance_name: instanceName,
      instance_apikey: instanceData?.hash || null,
      status: 'disconnected',
      qrcode_base64: instanceData?.qrcode?.base64 || null
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: result.data };
}

export async function connectInstance(instanceName: string): Promise<{ success: boolean; qrcode?: string; error?: string }> {
  const result = await callEvolutionApi(`/instance/connect/${instanceName}`);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const data = result.data as { base64?: string; code?: string };
  const qrcode = data?.base64 || data?.code;

  // Atualizar QR code no banco
  if (qrcode) {
    const supabase = await createClient();
    await supabase
      .from('evolution_instances')
      .update({ qrcode_base64: qrcode, updated_at: new Date().toISOString() })
      .eq('instance_name', instanceName);
  }

  return { success: true, qrcode };
}

export async function getConnectionState(instanceName: string): Promise<{ success: boolean; state?: string; error?: string }> {
  const result = await callEvolutionApi(`/instance/connectionState/${instanceName}`);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const data = result.data as { instance?: { state?: string } };
  const state = data?.instance?.state || 'unknown';

  // Atualizar status no banco
  const supabase = await createClient();
  await supabase
    .from('evolution_instances')
    .update({ status: state, updated_at: new Date().toISOString() })
    .eq('instance_name', instanceName);

  return { success: true, state };
}

export async function restartInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
  const result = await callEvolutionApi(`/instance/restart/${instanceName}`, 'PUT');
  return result;
}

export async function logoutInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
  const result = await callEvolutionApi(`/instance/logout/${instanceName}`, 'DELETE');

  if (result.success) {
    const supabase = await createClient();
    await supabase
      .from('evolution_instances')
      .update({ status: 'disconnected', qrcode_base64: null, updated_at: new Date().toISOString() })
      .eq('instance_name', instanceName);
  }

  return result;
}

export async function deleteInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
  // Deletar da Evolution API
  const result = await callEvolutionApi(`/instance/delete/${instanceName}`, 'DELETE');

  // Deletar do banco local (mesmo se falhar na API)
  const supabase = await createClient();
  await supabase
    .from('evolution_instances')
    .delete()
    .eq('instance_name', instanceName);

  return result;
}

export async function setInstanceSettings(
  instanceName: string,
  settings: {
    rejectCall?: boolean;
    msgCall?: string;
    groupsIgnore?: boolean;
    alwaysOnline?: boolean;
    readMessages?: boolean;
    readStatus?: boolean;
    syncFullHistory?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  return await callEvolutionApi(`/settings/set/${instanceName}`, 'POST', settings);
}

export async function getInstanceSettings(instanceName: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return await callEvolutionApi(`/settings/find/${instanceName}`);
}

// =============================================
// MESSAGES
// =============================================

export async function sendTextMessage(
  instanceName: string,
  number: string,
  text: string,
  options?: { delay?: number; linkPreview?: boolean }
): Promise<{ success: boolean; error?: string }> {
  // Formatar número (remover caracteres especiais, adicionar código do país se necessário)
  const formattedNumber = formatPhoneNumber(number);

  const result = await callEvolutionApi(`/message/sendText/${instanceName}`, 'POST', {
    number: formattedNumber,
    text,
    delay: options?.delay,
    linkPreview: options?.linkPreview ?? false
  });

  // Log da mensagem
  const supabase = await createClient();
  const { data: instance } = await supabase
    .from('evolution_instances')
    .select('id')
    .eq('instance_name', instanceName)
    .single();

  await supabase.from('evolution_messages_log').insert({
    instance_id: instance?.id,
    recipient_phone: formattedNumber,
    message_content: text,
    status: result.success ? 'sent' : 'failed',
    error_message: result.error
  });

  return result;
}

export async function sendMediaMessage(
  instanceName: string,
  number: string,
  mediaType: 'image' | 'video' | 'document',
  mediaUrl: string,
  caption?: string,
  options?: { delay?: number; fileName?: string }
): Promise<{ success: boolean; error?: string }> {
  const formattedNumber = formatPhoneNumber(number);

  const result = await callEvolutionApi(`/message/sendMedia/${instanceName}`, 'POST', {
    number: formattedNumber,
    mediatype: mediaType,
    media: mediaUrl,
    caption,
    delay: options?.delay,
    fileName: options?.fileName
  });

  // Log
  const supabase = await createClient();
  const { data: instance } = await supabase
    .from('evolution_instances')
    .select('id')
    .eq('instance_name', instanceName)
    .single();

  await supabase.from('evolution_messages_log').insert({
    instance_id: instance?.id,
    recipient_phone: formattedNumber,
    message_content: `[${mediaType}] ${mediaUrl}`,
    status: result.success ? 'sent' : 'failed',
    error_message: result.error
  });

  return result;
}

export async function sendAudioMessage(
  instanceName: string,
  number: string,
  audioUrl: string,
  options?: { delay?: number }
): Promise<{ success: boolean; error?: string }> {
  const formattedNumber = formatPhoneNumber(number);

  const result = await callEvolutionApi(`/message/sendWhatsAppAudio/${instanceName}`, 'POST', {
    number: formattedNumber,
    audio: audioUrl,
    delay: options?.delay
  });

  // Log
  const supabase = await createClient();
  const { data: instance } = await supabase
    .from('evolution_instances')
    .select('id')
    .eq('instance_name', instanceName)
    .single();

  await supabase.from('evolution_messages_log').insert({
    instance_id: instance?.id,
    recipient_phone: formattedNumber,
    message_content: `[audio] ${audioUrl}`,
    status: result.success ? 'sent' : 'failed',
    error_message: result.error
  });

  return result;
}

function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');

  // Se começar com 0, remove
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Se não tiver código do país (55), adiciona
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }

  return cleaned;
}

// =============================================
// TRIGGERS
// =============================================

export async function getTriggers(): Promise<EvolutionTrigger[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('evolution_triggers')
    .select(`
      *,
      instance:evolution_instances(*),
      messages:evolution_trigger_messages(*)
    `)
    .order('trigger_type');

  if (!data) return [];

  return data.map(t => ({
    ...t,
    messages: t.messages?.sort((a: EvolutionTriggerMessage, b: EvolutionTriggerMessage) => a.order_index - b.order_index)
  }));
}

export async function getTrigger(triggerId: string): Promise<EvolutionTrigger | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('evolution_triggers')
    .select(`
      *,
      instance:evolution_instances(*),
      messages:evolution_trigger_messages(*)
    `)
    .eq('id', triggerId)
    .single();

  if (!data) return null;

  return {
    ...data,
    messages: data.messages?.sort((a: EvolutionTriggerMessage, b: EvolutionTriggerMessage) => a.order_index - b.order_index)
  };
}

export async function getTriggerByType(triggerType: string): Promise<EvolutionTrigger | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('evolution_triggers')
    .select(`
      *,
      instance:evolution_instances(*),
      messages:evolution_trigger_messages(*)
    `)
    .eq('trigger_type', triggerType)
    .single();

  if (!data) return null;

  return {
    ...data,
    messages: data.messages?.sort((a: EvolutionTriggerMessage, b: EvolutionTriggerMessage) => a.order_index - b.order_index)
  };
}

export async function createTrigger(
  triggerType: string,
  instanceId: string | null
): Promise<{ success: boolean; data?: EvolutionTrigger; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('evolution_triggers')
    .insert({
      trigger_type: triggerType,
      instance_id: instanceId,
      enabled: true
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function updateTrigger(
  triggerId: string,
  updates: { enabled?: boolean; instance_id?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('evolution_triggers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', triggerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteTrigger(triggerId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('evolution_triggers')
    .delete()
    .eq('id', triggerId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// TRIGGER MESSAGES
// =============================================

export async function addTriggerMessage(
  triggerId: string,
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document',
  content: string,
  caption?: string,
  delaySeconds?: number,
  orderIndex?: number
): Promise<{ success: boolean; data?: EvolutionTriggerMessage; error?: string }> {
  const supabase = await createClient();

  // Se não especificado, pega o próximo índice
  if (orderIndex === undefined) {
    const { data: existing } = await supabase
      .from('evolution_trigger_messages')
      .select('order_index')
      .eq('trigger_id', triggerId)
      .order('order_index', { ascending: false })
      .limit(1);

    orderIndex = (existing?.[0]?.order_index ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from('evolution_trigger_messages')
    .insert({
      trigger_id: triggerId,
      message_type: messageType,
      content,
      caption,
      delay_seconds: delaySeconds ?? 0,
      order_index: orderIndex
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function updateTriggerMessage(
  messageId: string,
  updates: {
    message_type?: 'text' | 'image' | 'audio' | 'video' | 'document';
    content?: string;
    caption?: string;
    delay_seconds?: number;
    order_index?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('evolution_trigger_messages')
    .update(updates)
    .eq('id', messageId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteTriggerMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('evolution_trigger_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function reorderTriggerMessages(
  triggerId: string,
  messageIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Atualizar order_index de cada mensagem
  for (let i = 0; i < messageIds.length; i++) {
    const { error } = await supabase
      .from('evolution_trigger_messages')
      .update({ order_index: i })
      .eq('id', messageIds[i])
      .eq('trigger_id', triggerId);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}

// =============================================
// EXECUTE TRIGGER
// =============================================

interface UserData {
  id?: string;
  nome?: string;
  telefone?: string;
  valor?: number;
  saldo?: number;
  premio?: number;
  modalidade?: string;
  bonus?: number;
  saldo_bonus?: number;
}

function replaceTemplateVariables(text: string, userData: UserData): string {
  const now = new Date();
  const dataFormatada = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return text
    .replace(/\{\{nome\}\}/g, userData.nome || 'Cliente')
    .replace(/\{\{telefone\}\}/g, userData.telefone || '')
    .replace(/\{\{valor\}\}/g, userData.valor ? `R$ ${userData.valor.toFixed(2).replace('.', ',')}` : '')
    .replace(/\{\{data\}\}/g, dataFormatada)
    .replace(/\{\{saldo\}\}/g, userData.saldo ? `R$ ${userData.saldo.toFixed(2).replace('.', ',')}` : '')
    .replace(/\{\{premio\}\}/g, userData.premio ? `R$ ${userData.premio.toFixed(2).replace('.', ',')}` : '')
    .replace(/\{\{modalidade\}\}/g, userData.modalidade || '')
    .replace(/\{\{bonus\}\}/g, userData.bonus ? `R$ ${userData.bonus.toFixed(2).replace('.', ',')}` : '')
    .replace(/\{\{saldo_bonus\}\}/g, userData.saldo_bonus ? `R$ ${userData.saldo_bonus.toFixed(2).replace('.', ',')}` : '');
}

export async function executeTrigger(
  triggerType: string,
  userData: UserData
): Promise<{ success: boolean; sentCount?: number; error?: string }> {
  // Buscar trigger ativo
  const trigger = await getTriggerByType(triggerType);

  if (!trigger || !trigger.enabled) {
    return { success: false, error: 'Gatilho não encontrado ou desativado' };
  }

  if (!trigger.instance) {
    return { success: false, error: 'Nenhuma instância configurada para este gatilho' };
  }

  if (!userData.telefone) {
    return { success: false, error: 'Telefone do usuário não informado' };
  }

  const messages = trigger.messages || [];
  let sentCount = 0;

  for (const msg of messages) {
    // Aguardar delay se configurado
    if (msg.delay_seconds > 0) {
      await new Promise(resolve => setTimeout(resolve, msg.delay_seconds * 1000));
    }

    const content = msg.content ? replaceTemplateVariables(msg.content, userData) : '';
    const caption = msg.caption ? replaceTemplateVariables(msg.caption, userData) : undefined;

    let result: { success: boolean; error?: string };

    switch (msg.message_type) {
      case 'text':
        result = await sendTextMessage(trigger.instance.instance_name, userData.telefone, content);
        break;
      case 'image':
      case 'video':
      case 'document':
        result = await sendMediaMessage(
          trigger.instance.instance_name,
          userData.telefone,
          msg.message_type,
          content,
          caption
        );
        break;
      case 'audio':
        result = await sendAudioMessage(trigger.instance.instance_name, userData.telefone, content);
        break;
      default:
        result = { success: false, error: 'Tipo de mensagem não suportado' };
    }

    if (result.success) {
      sentCount++;
    }

    // Log com trigger_type
    const supabase = await createClient();
    await supabase
      .from('evolution_messages_log')
      .update({ trigger_type: triggerType })
      .eq('recipient_phone', formatPhoneNumber(userData.telefone))
      .order('sent_at', { ascending: false })
      .limit(1);
  }

  return { success: true, sentCount };
}

// =============================================
// MESSAGE LOGS
// =============================================

export async function getMessageLogs(options?: {
  limit?: number;
  offset?: number;
  status?: 'pending' | 'sent' | 'failed';
  triggerType?: string;
}): Promise<{ logs: EvolutionMessageLog[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('evolution_messages_log')
    .select('*', { count: 'exact' });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.triggerType) {
    query = query.eq('trigger_type', options.triggerType);
  }

  query = query
    .order('sent_at', { ascending: false })
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1);

  const { data, count } = await query;

  return {
    logs: data || [],
    total: count || 0
  };
}

// =============================================
// STATS
// =============================================

export async function getEvolutionStats(): Promise<{
  totalInstances: number;
  connectedInstances: number;
  totalMessagesSent: number;
  messagesSentToday: number;
  failedMessages: number;
}> {
  const supabase = await createClient();

  // Instâncias
  const { count: totalInstances } = await supabase
    .from('evolution_instances')
    .select('*', { count: 'exact', head: true });

  const { count: connectedInstances } = await supabase
    .from('evolution_instances')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');

  // Mensagens
  const { count: totalMessagesSent } = await supabase
    .from('evolution_messages_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: messagesSentToday } = await supabase
    .from('evolution_messages_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', today.toISOString());

  const { count: failedMessages } = await supabase
    .from('evolution_messages_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed');

  return {
    totalInstances: totalInstances || 0,
    connectedInstances: connectedInstances || 0,
    totalMessagesSent: totalMessagesSent || 0,
    messagesSentToday: messagesSentToday || 0,
    failedMessages: failedMessages || 0
  };
}
