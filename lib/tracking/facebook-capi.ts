'use server';

import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getPlatformId } from '@/lib/utils/platform';

/**
 * Hash SHA256 para dados do usuário (requerido pelo Facebook CAPI)
 */
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

interface CAPIEventParams {
  eventName: 'Purchase' | 'CompleteRegistration' | 'Lead' | 'InitiateCheckout';
  eventId?: string;
  value?: number;
  currency?: string;
  email?: string;
  phone?: string;
  clientIp?: string;
  clientUserAgent?: string;
  eventSourceUrl?: string;
}

/**
 * Envia evento para Facebook Conversions API
 */
export async function sendCAPIEvent(params: CAPIEventParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Buscar configurações do Pixel (multi-tenant: tabela platforms)
    const platformId = await getPlatformId();
    const { data: config, error: configError } = await supabase
      .from('platforms')
      .select('facebook_pixel_id, facebook_access_token')
      .eq('id', platformId)
      .single();

    if (configError || !config) {
      console.log('[CAPI] Configuração não encontrada');
      return { success: false, error: 'Configuração não encontrada' };
    }

    const { facebook_pixel_id, facebook_access_token } = config;

    if (!facebook_pixel_id || !facebook_access_token) {
      console.log('[CAPI] Pixel ID ou Access Token não configurado');
      return { success: false, error: 'Tracking não configurado' };
    }

    // Montar dados do usuário (com hash)
    const userData: Record<string, unknown> = {};

    if (params.email) {
      userData.em = [sha256(params.email)];
    }
    if (params.phone) {
      // Remove caracteres não numéricos e adiciona código do país se necessário
      const cleanPhone = params.phone.replace(/\D/g, '');
      const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      userData.ph = [sha256(phoneWithCountry)];
    }
    if (params.clientIp) {
      userData.client_ip_address = params.clientIp;
    }
    if (params.clientUserAgent) {
      userData.client_user_agent = params.clientUserAgent;
    }

    // Montar dados customizados (para Purchase)
    const customData: Record<string, unknown> = {};
    if (params.value !== undefined) {
      customData.value = params.value;
      customData.currency = params.currency || 'BRL';
    }

    // Montar payload do evento
    const eventPayload = {
      data: [{
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId || `${params.eventName.toLowerCase()}_${Date.now()}`,
        action_source: 'website',
        event_source_url: params.eventSourceUrl || undefined,
        user_data: Object.keys(userData).length > 0 ? userData : undefined,
        custom_data: Object.keys(customData).length > 0 ? customData : undefined,
      }],
    };

    // Enviar para Facebook
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${facebook_pixel_id}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${facebook_access_token}`,
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[CAPI] Erro ao enviar evento:', errorData);
      return { success: false, error: errorData.error?.message || 'Erro ao enviar evento' };
    }

    const result = await response.json();
    console.log(`[CAPI] Evento ${params.eventName} enviado com sucesso:`, result);

    return { success: true };
  } catch (error) {
    console.error('[CAPI] Erro:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/**
 * Envia evento de cadastro completo para CAPI
 */
export async function trackRegistrationCAPI(params: {
  email?: string;
  phone?: string;
  clientIp?: string;
  clientUserAgent?: string;
}): Promise<{ success: boolean }> {
  return sendCAPIEvent({
    eventName: 'CompleteRegistration',
    ...params,
  });
}

/**
 * Envia evento de compra/depósito para CAPI
 */
export async function trackPurchaseCAPI(params: {
  eventId: string;
  value: number;
  email?: string;
  phone?: string;
  clientIp?: string;
  clientUserAgent?: string;
  eventSourceUrl?: string;
}): Promise<{ success: boolean }> {
  return sendCAPIEvent({
    eventName: 'Purchase',
    eventId: params.eventId,
    value: params.value,
    currency: 'BRL',
    email: params.email,
    phone: params.phone,
    clientIp: params.clientIp,
    clientUserAgent: params.clientUserAgent,
    eventSourceUrl: params.eventSourceUrl,
  });
}

/**
 * Envia evento de lead para CAPI
 */
export async function trackLeadCAPI(params: {
  email?: string;
  phone?: string;
  clientIp?: string;
  clientUserAgent?: string;
}): Promise<{ success: boolean }> {
  return sendCAPIEvent({
    eventName: 'Lead',
    ...params,
  });
}

/**
 * Envia evento de início de checkout para CAPI
 */
export async function trackInitiateCheckoutCAPI(params: {
  eventId: string;
  value: number;
  email?: string;
  phone?: string;
  clientIp?: string;
  clientUserAgent?: string;
  eventSourceUrl?: string;
}): Promise<{ success: boolean }> {
  return sendCAPIEvent({
    eventName: 'InitiateCheckout',
    eventId: params.eventId,
    value: params.value,
    currency: 'BRL',
    email: params.email,
    phone: params.phone,
    clientIp: params.clientIp,
    clientUserAgent: params.clientUserAgent,
    eventSourceUrl: params.eventSourceUrl,
  });
}
