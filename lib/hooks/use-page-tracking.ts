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
  if (pathname.startsWith('/loterias')) return 'game';
  if (pathname.startsWith('/fazendinha')) return 'game';
  if (pathname.startsWith('/quininha')) return 'game';
  if (pathname.startsWith('/resultados')) return 'results';
  if (pathname.startsWith('/apostas')) return 'bets';
  if (pathname.startsWith('/saques')) return 'withdraw';
  if (pathname.startsWith('/amigos')) return 'referral';
  if (pathname.startsWith('/relatorios')) return 'reports';
  if (pathname.startsWith('/premiadas')) return 'winners';
  return 'other';
}

/**
 * Hook de tracking otimizado.
 * Recebe userId do layout pai para evitar chamar getUser() repetidamente.
 */
export function usePageTracking(userId: string | null) {
  const pathname = usePathname();
  const supabaseRef = useRef(createClient());
  const lastPathRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      await supabaseRef.current.from('visitor_presence').upsert(
        {
          session_id: sessionId,
          user_id: userId,
          current_page: pathname,
          last_seen_at: new Date().toISOString(),
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

  // Atualizar presença a cada 60 segundos (era 30s - reduzido para menos carga)
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
