'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const STORAGE_KEY = 'push-prompt-dismissed';

export function PushPermissionPrompt() {
  const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Don't show if not supported, already subscribed, or denied
    if (!isSupported || isSubscribed || permission === 'denied') return;

    // Check if dismissed recently (24h)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) return;
    }

    // Show after 5 seconds
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission]);

  const handleAllow = async () => {
    setLoading(true);
    await subscribe();
    setLoading(false);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }));
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[9998] max-w-md mx-auto animate-in slide-in-from-bottom duration-300"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="rounded-2xl bg-[#1A1F2B] border border-zinc-700/50 shadow-2xl p-4">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <Bell className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Ativar notificações?</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Receba alertas de resultados, promoções e novidades!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 text-zinc-500 hover:text-zinc-300"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 h-10 rounded-xl border border-zinc-700/50 text-sm font-medium text-zinc-400 active:bg-white/5 transition-all"
          >
            Depois
          </button>
          <button
            onClick={handleAllow}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-emerald-500 text-sm font-bold text-white active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Ativando...' : 'Ativar'}
          </button>
        </div>
      </div>
    </div>
  );
}
