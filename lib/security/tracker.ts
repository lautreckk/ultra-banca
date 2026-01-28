'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { LocationInfo, AuditLogParams } from './audit-actions';

// =============================================
// FUNCOES DE IP E LOCALIZACAO
// =============================================

/**
 * Obtém o IP do cliente a partir dos headers da requisição
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();

  // Tenta obter o IP de diferentes headers (proxies, load balancers)
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const cfConnectingIp = headersList.get('cf-connecting-ip'); // Cloudflare

  let ip = 'unknown';

  if (forwardedFor) {
    // x-forwarded-for pode conter múltiplos IPs, pegar o primeiro
    ip = forwardedFor.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  }

  // Normaliza localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  return ip;
}

/**
 * Obtém informações de localização baseado no IP
 */
export async function getLocationFromIp(ip: string): Promise<LocationInfo> {
  // Localhost - retorna dados simulados
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === 'unknown') {
    return {
      city: 'Localhost',
      region: 'Dev',
      country: 'BR',
      countryCode: 'BR',
      isp: 'Local Development',
    };
  }

  // IPs privados - retorna dados genéricos
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return {
      city: 'Rede Privada',
      region: 'Internal',
      country: 'BR',
      countryCode: 'BR',
      isp: 'Private Network',
    };
  }

  try {
    // Usa ip-api.com para geolocalização (grátis, sem API key)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,countryCode,isp`, {
      next: { revalidate: 3600 }, // Cache por 1 hora
    });

    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }

    const data = await response.json();

    if (data.status === 'success') {
      return {
        city: data.city || 'Desconhecida',
        region: data.regionName || 'Desconhecida',
        country: data.country || 'Desconhecido',
        countryCode: data.countryCode || 'XX',
        isp: data.isp || 'Desconhecido',
      };
    }

    throw new Error('Location lookup failed');
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      city: 'Desconhecida',
      region: 'Desconhecida',
      country: 'Desconhecido',
      countryCode: 'XX',
    };
  }
}

// =============================================
// FUNCAO PRINCIPAL DE AUDITORIA
// =============================================

/**
 * Registra uma ação no log de auditoria
 */
export async function logAudit({
  actorId,
  action,
  entity,
  details = {},
}: AuditLogParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Obter IP e localização
    const ip = await getClientIp();
    const location = await getLocationFromIp(ip);

    // Inserir log de auditoria
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action,
      entity: entity || null,
      details,
      ip_address: ip,
      location,
    });

    if (error) {
      console.error('Error inserting audit log:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logAudit:', error);
    return { success: false, error: 'Failed to log audit' };
  }
}

// =============================================
// FUNCOES DE RASTREAMENTO DE PERFIL
// =============================================

/**
 * Atualiza o perfil do usuário com informações de IP e localização
 */
export async function trackUserLogin(userId: string): Promise<void> {
  try {
    const supabase = await createClient();

    const ip = await getClientIp();
    const location = await getLocationFromIp(ip);

    await supabase
      .from('profiles')
      .update({
        last_ip: ip,
        last_location: location,
        last_login: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Error tracking user login:', error);
  }
}

/**
 * Registra o IP de cadastro do usuário
 */
export async function trackUserSignup(userId: string): Promise<void> {
  try {
    const supabase = await createClient();

    const ip = await getClientIp();
    const location = await getLocationFromIp(ip);

    await supabase
      .from('profiles')
      .update({
        signup_ip: ip,
        last_ip: ip,
        last_location: location,
        last_login: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (error) {
    console.error('Error tracking user signup:', error);
  }
}

