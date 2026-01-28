'use server';

import { createClient } from '@/lib/supabase/server';

// =============================================
// GATEWAY CONFIG
// =============================================

export interface GatewayConfig {
  id: string;
  gateway_name: string;
  ativo: boolean;
  client_id: string | null;
  client_secret: string | null;        // Sempre mascarado no retorno
  client_secret_masked: boolean;       // Indica se o secret existe (sem expor)
  webhook_url: string | null;
  config: Record<string, unknown>;
  updated_at: string;
}

// Constante para identificar valores mascarados
const MASKED_PREFIX = '••••••••';

// Funcao helper para mascarar secrets
function maskSecret(secret: string | null): string | null {
  if (!secret) return null;
  // Mostra apenas os ultimos 4 caracteres
  return MASKED_PREFIX + secret.slice(-4);
}

export async function getGatewayConfig(gatewayName: string): Promise<GatewayConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gateway_config')
    .select('id, gateway_name, ativo, client_id, client_secret, webhook_url, config, updated_at')
    .eq('gateway_name', gatewayName)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    gateway_name: data.gateway_name,
    ativo: data.ativo,
    client_id: data.client_id,
    // 🛡️ SEGURANCA: Nunca enviar secret real para o frontend
    client_secret: maskSecret(data.client_secret),
    client_secret_masked: !!data.client_secret,
    webhook_url: data.webhook_url,
    config: data.config || {},
    updated_at: data.updated_at,
  };
}

export async function getAllGateways(): Promise<GatewayConfig[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gateway_config')
    .select('id, gateway_name, ativo, client_id, client_secret, webhook_url, config, updated_at')
    .order('gateway_name');

  if (error) {
    console.error('Error fetching gateways:', error);
    return [];
  }

  return (data || []).map((g) => ({
    id: g.id,
    gateway_name: g.gateway_name,
    ativo: g.ativo,
    client_id: g.client_id,
    // 🛡️ SEGURANCA: Nunca enviar secret real para o frontend
    client_secret: maskSecret(g.client_secret),
    client_secret_masked: !!g.client_secret,
    webhook_url: g.webhook_url,
    config: g.config || {},
    updated_at: g.updated_at,
  }));
}

export async function setPrimaryGateway(gatewayName: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Update both primary_gateway and active_gateway settings
  const { error: error1 } = await supabase
    .from('system_settings')
    .upsert({
      key: 'primary_gateway',
      value: gatewayName,
      description: 'Gateway de pagamento principal para depósitos',
      category: 'payments',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  const { error: error2 } = await supabase
    .from('system_settings')
    .upsert({
      key: 'active_gateway',
      value: gatewayName,
      description: 'Gateway de pagamento ativo (bspay ou washpay)',
      category: 'payments',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  if (error1 || error2) {
    return { success: false, error: error1?.message || error2?.message };
  }

  return { success: true };
}

export async function getPrimaryGateway(): Promise<string> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'active_gateway')
    .single();

  return data?.value || 'bspay';
}

export async function getActiveGateway(): Promise<string> {
  return getPrimaryGateway();
}

export async function updateGatewayConfig(
  gatewayName: string,
  config: {
    ativo?: boolean;
    client_id?: string;
    client_secret?: string;
    webhook_url?: string;
    config?: Record<string, unknown>;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (config.ativo !== undefined) updateData.ativo = config.ativo;
  if (config.client_id !== undefined) updateData.client_id = config.client_id;

  // 🛡️ SEGURANCA: Ignorar secrets mascarados
  // Se o valor comecar com '••••••••', significa que o admin nao alterou
  // Isso evita sobrescrever o secret real com o valor mascarado
  if (config.client_secret !== undefined && !config.client_secret.startsWith(MASKED_PREFIX)) {
    updateData.client_secret = config.client_secret;
  }

  if (config.webhook_url !== undefined) updateData.webhook_url = config.webhook_url;
  if (config.config !== undefined) updateData.config = config.config;

  const { error } = await supabase
    .from('gateway_config')
    .update(updateData)
    .eq('gateway_name', gatewayName);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// MODALIDADES CONFIG
// =============================================

export interface ModalidadeConfig {
  id: string;
  categoria: string;
  nome: string;
  codigo: string;
  multiplicador: number;
  valor_minimo: number;
  valor_maximo: number;
  posicoes_1_5: boolean;
  posicoes_1_6: boolean;
  posicoes_1_7: boolean;
  posicoes_1_10: boolean;
  posicoes_5_6: boolean;
  ativo: boolean;
  ordem: number;
  updated_at: string;
}

export async function getModalidades(): Promise<ModalidadeConfig[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('modalidades_config')
    .select('id, categoria, nome, codigo, multiplicador, valor_minimo, valor_maximo, posicoes_1_5, posicoes_1_6, posicoes_1_7, posicoes_1_10, posicoes_5_6, ativo, ordem, updated_at')
    .order('ordem', { ascending: true });

  if (error) {
    console.error('Error fetching modalidades:', error);
    return [];
  }

  return (data || []).map((m) => ({
    id: m.id,
    categoria: m.categoria,
    nome: m.nome,
    codigo: m.codigo,
    multiplicador: Number(m.multiplicador) || 0,
    valor_minimo: Number(m.valor_minimo) || 1,
    valor_maximo: Number(m.valor_maximo) || 1000,
    posicoes_1_5: m.posicoes_1_5,
    posicoes_1_6: m.posicoes_1_6,
    posicoes_1_7: m.posicoes_1_7,
    posicoes_1_10: m.posicoes_1_10,
    posicoes_5_6: m.posicoes_5_6,
    ativo: m.ativo,
    ordem: m.ordem || 0,
    updated_at: m.updated_at,
  }));
}

export async function updateModalidade(
  id: string,
  config: {
    multiplicador?: number;
    valor_minimo?: number;
    valor_maximo?: number;
    posicoes_1_5?: boolean;
    posicoes_1_6?: boolean;
    posicoes_1_7?: boolean;
    posicoes_1_10?: boolean;
    posicoes_5_6?: boolean;
    ativo?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (config.multiplicador !== undefined) updateData.multiplicador = config.multiplicador;
  if (config.valor_minimo !== undefined) updateData.valor_minimo = config.valor_minimo;
  if (config.valor_maximo !== undefined) updateData.valor_maximo = config.valor_maximo;
  if (config.posicoes_1_5 !== undefined) updateData.posicoes_1_5 = config.posicoes_1_5;
  if (config.posicoes_1_6 !== undefined) updateData.posicoes_1_6 = config.posicoes_1_6;
  if (config.posicoes_1_7 !== undefined) updateData.posicoes_1_7 = config.posicoes_1_7;
  if (config.posicoes_1_10 !== undefined) updateData.posicoes_1_10 = config.posicoes_1_10;
  if (config.posicoes_5_6 !== undefined) updateData.posicoes_5_6 = config.posicoes_5_6;
  if (config.ativo !== undefined) updateData.ativo = config.ativo;

  const { error } = await supabase
    .from('modalidades_config')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// SYSTEM SETTINGS
// =============================================

export interface SystemSetting {
  key: string;
  value: string | null;
  description: string | null;
  category: string;
}

export async function getSystemSettings(category?: string): Promise<SystemSetting[]> {
  const supabase = await createClient();

  let query = supabase.from('system_settings').select('key, value, description, category');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching system settings:', error);
    return [];
  }

  return data || [];
}

export async function updateSystemSetting(
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('system_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getSystemSetting(key: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) {
    return null;
  }

  return data.value;
}
