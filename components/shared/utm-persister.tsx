'use client';

import { useEffect } from 'react';

/**
 * UtmPersister - Preserva parametros UTM durante navegacao SPA (Next.js)
 *
 * O Utmify (utms/latest.js) modifica <a> tags no DOM, mas o Next.js
 * usa history.pushState para navegacao client-side, ignorando o href.
 * Este componente intercepta pushState/replaceState e reaplicar os UTMs.
 */

const UTM_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  // Utmify-specific tracking params
  'src', 'sck', 'xcod',
];

const STORAGE_KEY = '__utms';

export function UtmPersister() {
  useEffect(() => {
    // 1. Capture UTMs from current URL (landing page)
    const params = new URLSearchParams(window.location.search);
    const utms: Record<string, string> = {};

    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val) utms[key] = val;
    }

    // Store new UTMs if found on this page load
    if (Object.keys(utms).length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
      } catch { /* sessionStorage unavailable */ }
    }

    // 2. Read stored UTMs
    let stored: Record<string, string> = {};
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch { /* ignore */ }

    // Nothing to persist
    if (Object.keys(stored).length === 0) return;

    // 3. Patch pushState / replaceState to append UTMs
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    function appendUtms(url?: string | URL | null): string | URL | null | undefined {
      if (!url) return url;
      const str = typeof url === 'string' ? url : url.toString();
      try {
        const u = new URL(str, window.location.origin);
        // Only same-origin, skip admin/api routes
        if (u.origin !== window.location.origin) return url;
        if (u.pathname.startsWith('/admin') || u.pathname.startsWith('/api')) return url;

        let modified = false;
        for (const [k, v] of Object.entries(stored)) {
          if (!u.searchParams.has(k)) {
            u.searchParams.set(k, v);
            modified = true;
          }
        }
        return modified ? u.pathname + u.search + u.hash : url;
      } catch {
        return url;
      }
    }

    history.pushState = function (data: unknown, unused: string, url?: string | URL | null) {
      return origPush(data, unused, appendUtms(url));
    };

    history.replaceState = function (data: unknown, unused: string, url?: string | URL | null) {
      return origReplace(data, unused, appendUtms(url));
    };

    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  return null;
}
