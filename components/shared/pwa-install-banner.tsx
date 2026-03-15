'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { usePlatformConfig } from '@/contexts/platform-config-context';

const STORAGE_KEY = 'pwa-install-banner-dismissed';

export function PWAInstallBanner() {
  const { canInstall, isInstalled, promptInstall, isIOS } = usePWAInstall();
  const { site_name, logo_url, color_primary } = usePlatformConfig();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp > 3 * 24 * 60 * 60 * 1000) {
        setDismissed(false);
      }
    } else {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }));
  };

  const handleInstall = async () => {
    if (canInstall) {
      // Android/Chrome — prompt nativo direto
      const accepted = await promptInstall();
      if (accepted) handleDismiss();
    } else if (isIOS && navigator.share) {
      // iOS — abre share sheet para "Tela de Início"
      try {
        await navigator.share({
          title: site_name,
          url: window.location.origin,
        });
        handleDismiss();
      } catch {
        // Usuário cancelou
      }
    }
  };

  if (isInstalled || dismissed) return null;

  const shouldShow = canInstall || isIOS;
  if (!shouldShow) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-300"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: '#22c55e' }}
      >
        {/* Logo */}
        {logo_url ? (
          <img
            src={logo_url}
            alt={site_name}
            className="h-10 w-10 rounded-lg object-contain flex-shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          />
        ) : (
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
            style={{ backgroundColor: color_primary }}
          >
            {site_name.charAt(0)}
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">
            Instalar {site_name}
          </p>
          <p className="text-white/80 text-xs leading-tight">
            Adicione à tela inicial para acesso rápido
          </p>
        </div>

        {/* Install Button */}
        <button
          onClick={handleInstall}
          className="flex-shrink-0 px-4 py-1.5 bg-white rounded-lg font-semibold text-sm transition-transform active:scale-95"
          style={{ color: '#22c55e' }}
        >
          Instalar
        </button>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-white/70 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
