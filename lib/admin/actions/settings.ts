'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getPlatformId } from '@/lib/utils/platform';

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
  const platformId = await getPlatformId();

  const { data, error } = await supabase
    .from('gateway_config')
    .select('id, gateway_name, ativo, client_id, client_secret, webhook_url, config, updated_at')
    .eq('gateway_name', gatewayName)
    .eq('platform_id', platformId)
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
  const platformId = await getPlatformId();

  const { data, error } = await supabase
    .from('gateway_config')
    .select('id, gateway_name, ativo, client_id, client_secret, webhook_url, config, updated_at')
    .eq('platform_id', platformId)
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
  const platformId = await getPlatformId();

  // Verificar se o usuario e admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nao autenticado' };

  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminRole) return { success: false, error: 'Acesso nao autorizado' };

  // Usar admin client (service role) para bypass de RLS
  // RLS de platforms so permite UPDATE para super_admin
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('platforms')
    .update({
      active_gateway: gatewayName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', platformId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/pagamentos');
  revalidatePath('/', 'layout');

  return { success: true };
}

export async function getPrimaryGateway(): Promise<string> {
  const supabase = await createClient();
  const platformId = await getPlatformId();

  // Ler de platforms.active_gateway (mesma fonte que a Edge Function usa)
  const { data } = await supabase
    .from('platforms')
    .select('active_gateway')
    .eq('id', platformId)
    .single();

  return data?.active_gateway || 'bspay';
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

  const platformId = await getPlatformId();

  const { error } = await supabase
    .from('gateway_config')
    .update(updateData)
    .eq('gateway_name', gatewayName)
    .eq('platform_id', platformId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// MODALIDADES CONFIG (Multi-tenant)
// =============================================
// Estrutura (nome, categoria, posições) = modalidades_config (global)
// Valores (multiplicador, limites, ativo) = platform_modalidades (por banca)

export interface ModalidadeConfig {
  id: string;                // ID da modalidade na platform_modalidades
  global_id: string;         // ID da modalidade na modalidades_config
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

/**
 * Busca modalidades para a plataforma atual.
 * Combina estrutura global (modalidades_config) com valores por plataforma (platform_modalidades).
 */
export async function getModalidades(): Promise<ModalidadeConfig[]> {
  const supabase = await createClient();
  const platformId = await getPlatformId();

  // 1. Buscar estrutura global das modalidades
  const { data: globalData, error: globalError } = await supabase
    .from('modalidades_config')
    .select('id, categoria, nome, codigo, multiplicador, valor_minimo, valor_maximo, posicoes_1_5, posicoes_1_6, posicoes_1_7, posicoes_1_10, posicoes_5_6, ativo, ordem, updated_at')
    .order('ordem', { ascending: true });

  if (globalError) {
    console.error('Error fetching global modalidades:', globalError);
    return [];
  }

  // 2. Buscar configurações da plataforma (sobrescreve valores globais)
  const { data: platformData, error: platformError } = await supabase
    .from('platform_modalidades')
    .select('id, codigo, multiplicador, valor_minimo, valor_maximo, ativo, ordem, updated_at')
    .eq('platform_id', platformId);

  if (platformError) {
    console.error('Error fetching platform modalidades:', platformError);
  }

  // 3. Indexar configs da plataforma por codigo
  type PlatformModalidade = {
    id: string;
    codigo: string;
    multiplicador: number;
    valor_minimo: number;
    valor_maximo: number;
    ativo: boolean;
    ordem: number;
    updated_at: string;
  };
  const platformMap = new Map<string, PlatformModalidade>();
  (platformData || []).forEach(pm => {
    platformMap.set(pm.codigo, pm as PlatformModalidade);
  });

  // 4. Combinar: estrutura global + valores da plataforma
  return (globalData || []).map((global) => {
    const platform = platformMap.get(global.codigo);

    return {
      // Se existe config da plataforma, usar o ID dela; senão usar o global
      id: platform?.id || global.id,
      global_id: global.id,
      categoria: global.categoria,
      nome: global.nome,
      codigo: global.codigo,
      // Valores da plataforma sobrescrevem os globais
      multiplicador: platform ? Number(platform.multiplicador) : Number(global.multiplicador) || 0,
      valor_minimo: platform ? Number(platform.valor_minimo) : Number(global.valor_minimo) || 1,
      valor_maximo: platform ? Number(platform.valor_maximo) : Number(global.valor_maximo) || 1000,
      // Posições são globais (estrutura do jogo)
      posicoes_1_5: global.posicoes_1_5,
      posicoes_1_6: global.posicoes_1_6,
      posicoes_1_7: global.posicoes_1_7,
      posicoes_1_10: global.posicoes_1_10,
      posicoes_5_6: global.posicoes_5_6,
      // Ativo e ordem da plataforma (se existir)
      ativo: platform ? platform.ativo : global.ativo,
      ordem: platform ? (platform.ordem || 0) : (global.ordem || 0),
      updated_at: platform?.updated_at || global.updated_at,
    };
  });
}

/**
 * Atualiza configuração de modalidade para a plataforma atual.
 * Usa UPSERT em platform_modalidades (cria se não existir).
 */
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
  const platformId = await getPlatformId();

  // 1. Buscar o código da modalidade (pode ser ID de platform_modalidades ou de modalidades_config)
  // Primeiro tenta em platform_modalidades
  let codigo: string | null = null;

  const { data: platformMod } = await supabase
    .from('platform_modalidades')
    .select('codigo')
    .eq('id', id)
    .single();

  if (platformMod) {
    codigo = platformMod.codigo;
  } else {
    // Tenta em modalidades_config (ID global)
    const { data: globalMod } = await supabase
      .from('modalidades_config')
      .select('codigo')
      .eq('id', id)
      .single();

    if (globalMod) {
      codigo = globalMod.codigo;
    }
  }

  if (!codigo) {
    return { success: false, error: 'Modalidade não encontrada' };
  }

  // 2. Preparar dados para UPSERT
  const upsertData: Record<string, unknown> = {
    platform_id: platformId,
    codigo: codigo,
    updated_at: new Date().toISOString(),
  };

  if (config.multiplicador !== undefined) upsertData.multiplicador = config.multiplicador;
  if (config.valor_minimo !== undefined) upsertData.valor_minimo = config.valor_minimo;
  if (config.valor_maximo !== undefined) upsertData.valor_maximo = config.valor_maximo;
  if (config.ativo !== undefined) upsertData.ativo = config.ativo;

  // 3. Upsert em platform_modalidades
  const { error } = await supabase
    .from('platform_modalidades')
    .upsert(upsertData, { onConflict: 'platform_id,codigo' });

  if (error) {
    return { success: false, error: error.message };
  }

  // 4. Atualizar posições na tabela global (se for super_admin)
  // As posições são configurações globais do jogo, não por plataforma
  const hasPositionChanges = config.posicoes_1_5 !== undefined ||
    config.posicoes_1_6 !== undefined ||
    config.posicoes_1_7 !== undefined ||
    config.posicoes_1_10 !== undefined ||
    config.posicoes_5_6 !== undefined;

  if (hasPositionChanges) {
    // Verificar se é super_admin
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (adminRole?.role === 'super_admin') {
        // Buscar ID global
        const { data: globalMod } = await supabase
          .from('modalidades_config')
          .select('id')
          .eq('codigo', codigo)
          .single();

        if (globalMod) {
          const positionUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (config.posicoes_1_5 !== undefined) positionUpdate.posicoes_1_5 = config.posicoes_1_5;
          if (config.posicoes_1_6 !== undefined) positionUpdate.posicoes_1_6 = config.posicoes_1_6;
          if (config.posicoes_1_7 !== undefined) positionUpdate.posicoes_1_7 = config.posicoes_1_7;
          if (config.posicoes_1_10 !== undefined) positionUpdate.posicoes_1_10 = config.posicoes_1_10;
          if (config.posicoes_5_6 !== undefined) positionUpdate.posicoes_5_6 = config.posicoes_5_6;

          await supabase
            .from('modalidades_config')
            .update(positionUpdate)
            .eq('id', globalMod.id);
        }
      }
    }
  }

  // 5. Invalidar cache
  revalidatePath('/loterias', 'layout');
  revalidatePath('/calculadora');
  revalidatePath('/relatorios/cotacoes', 'layout');
  revalidatePath('/admin/modalidades');

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
