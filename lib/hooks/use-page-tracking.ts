'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Gera ou recupera session_id do sessionStorage
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
}

// Lê platform_id do cookie (setado pelo middleware)
function getPlatformIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)platform_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Detecta tipo de dispositivo
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// ============================================================================
// DETECÇÃO DE ORIGEM DO TRÁFEGO
// ============================================================================

interface TrafficSource {
  traffic_source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_url: string | null;
  promoter_code: string | null;
}

const TRAFFIC_SOURCE_KEY = '__traffic_source';

function detectTrafficSource(): TrafficSource | null {
  if (typeof window === 'undefined') return null;

  // Verificar se já detectou nesta sessão (só captura na primeira vez)
  const cached = sessionStorage.getItem(TRAFFIC_SOURCE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* ignore */ }
  }

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || '';

  // UTM params
  const utm_source = params.get('utm_source') || null;
  const utm_medium = params.get('utm_medium') || null;
  const utm_campaign = params.get('utm_campaign') || null;

  // Código de promotor (p= ou ref=)
  const promoter_code = params.get('p') || params.get('ref') || null;

  // Detectar traffic_source automaticamente
  let traffic_source: string | null = null;

  if (utm_source) {
    // Fonte explícita via UTM
    const src = utm_source.toLowerCase();
    if (src.includes('facebook') || src.includes('fb') || src.includes('meta') || src.includes('instagram') || src.includes('ig')) {
      traffic_source = 'Meta Ads';
    } else if (src.includes('tiktok') || src.includes('tt')) {
      traffic_source = 'TikTok';
    } else if (src.includes('kwai')) {
      traffic_source = 'Kwai';
    } else if (src.includes('google')) {
      traffic_source = 'Google Ads';
    } else if (src.includes('whatsapp') || src.includes('wpp')) {
      traffic_source = 'WhatsApp';
    } else if (src.includes('telegram')) {
      traffic_source = 'Telegram';
    } else {
      traffic_source = utm_source; // Usa o valor direto
    }
  } else if (promoter_code) {
    traffic_source = 'Promotor';
  } else if (referrer) {
    // Detectar pelo referrer
    const ref = referrer.toLowerCase();
    if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fbclid')) {
      traffic_source = 'Facebook';
    } else if (ref.includes('instagram.com')) {
      traffic_source = 'Instagram';
    } else if (ref.includes('tiktok.com')) {
      traffic_source = 'TikTok';
    } else if (ref.includes('kwai.com')) {
      traffic_source = 'Kwai';
    } else if (ref.includes('google.com') || ref.includes('google.com.br')) {
      traffic_source = 'Google';
    } else if (ref.includes('youtube.com')) {
      traffic_source = 'YouTube';
    } else if (ref.includes('t.me') || ref.includes('telegram')) {
      traffic_source = 'Telegram';
    } else if (ref.includes('twitter.com') || ref.includes('x.com')) {
      traffic_source = 'Twitter/X';
    } else {
      // Referrer externo desconhecido
      try {
        traffic_source = new URL(referrer).hostname;
      } catch {
        traffic_source = 'Externo';
      }
    }
  } else {
    traffic_source = 'Direto';
  }

  const source: TrafficSource = {
    traffic_source,
    utm_source,
    utm_medium,
    utm_campaign,
    referrer_url: referrer || null,
    promoter_code,
  };

  // Cache na sessão
  try {
    sessionStorage.setItem(TRAFFIC_SOURCE_KEY, JSON.stringify(source));
  } catch { /* ignore */ }

  return source;
}

// ============================================================================
// DETECÇÃO DE TIPO DE PÁGINA
// ============================================================================

// Detecta tipo de jogo/página com base no pathname
function getGameType(pathname: string): string | null {
  if (pathname.startsWith('/loterias')) return 'loterias';
  if (pathname.startsWith('/fazendinha')) return 'fazendinha';
  if (pathname.startsWith('/quininha')) return 'quininha';
  if (pathname.startsWith('/resultados')) return 'resultados';
  if (pathname.startsWith('/apostas')) return 'apostas';
  if (pathname.startsWith('/saques')) return 'saques';
  if (pathname.startsWith('/amigos')) return 'amigos';
  if (pathname.startsWith('/relatorios')) return 'relatorios';
  if (pathname.startsWith('/premiadas')) return 'premiadas';
  return null;
}

// Detecta tipo de página
function getPageType(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/cadastro')) return 'register';
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/loterias')) return 'game';
  if (pathname.startsWith('/fazendinha')) return 'game';
  if (pathname.startsWith('/quininha')) return 'game';
  if (pathname.startsWith('/resultados')) return 'results';
  if (pathname.startsWith('/apostas')) return 'bets';
  if (pathname.startsWith('/saques')) return 'withdraw';
  if (pathname.startsWith('/amigos')) return 'referral';
  if (pathname.startsWith('/relatorios')) return 'reports';
  if (pathname.startsWith('/premiadas')) return 'winners';
  if (pathname.startsWith('/recarga')) return 'deposit';
  if (pathname.startsWith('/cassino')) return 'casino';
  return 'other';
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook de tracking otimizado.
 * Recebe userId do layout pai para evitar chamar getUser() repetidamente.
 */
export function usePageTracking(userId: string | null) {
  const pathname = usePathname();
  const supabaseRef = useRef(createClient());
  const lastPathRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trafficSourceRef = useRef<TrafficSource | null>(null);

  // Detectar origem do tráfego uma vez por sessão
  useEffect(() => {
    trafficSourceRef.current = detectTrafficSource();
  }, []);

  // Registra page view
  const trackPageView = useCallback(async () => {
    if (pathname.startsWith('/admin')) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    try {
      await supabaseRef.current.from('page_views').insert({
        session_id: sessionId,
        user_id: userId,
        page_path: pathname,
        page_type: getPageType(pathname),
        game_type: getGameType(pathname),
        device_type: getDeviceType(),
      });
    } catch (error) {
      console.debug('Page tracking error:', error);
    }
  }, [pathname, userId]);

  // Atualiza presença (sem chamar getUser - usa userId do pai)
  const updatePresence = useCallback(async () => {
    if (pathname.startsWith('/admin')) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    try {
      const platformId = getPlatformIdFromCookie();
      const ts = trafficSourceRef.current;

      await supabaseRef.current.from('visitor_presence').upsert(
        {
          session_id: sessionId,
          user_id: userId,
          current_page: pathname,
          last_seen_at: new Date().toISOString(),
          ...(platformId ? { platform_id: platformId } : {}),
          // Origem do tráfego (só envia se tem dados)
          ...(ts?.traffic_source ? {
            traffic_source: ts.traffic_source,
            utm_source: ts.utm_source,
            utm_medium: ts.utm_medium,
            utm_campaign: ts.utm_campaign,
            referrer_url: ts.referrer_url,
            promoter_code: ts.promoter_code,
          } : {}),
        },
        {
          onConflict: 'session_id',
        }
      );
    } catch (error) {
      console.debug('Presence update error:', error);
    }
  }, [pathname, userId]);

  // Track page view quando o pathname muda
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      trackPageView();
      updatePresence();
    }
  }, [pathname, trackPageView, updatePresence]);

  // Atualizar presença a cada 60 segundos
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    intervalRef.current = setInterval(() => {
      updatePresence();
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pathname, updatePresence]);
}
