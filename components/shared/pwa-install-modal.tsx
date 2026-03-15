'use client';

import { useState, useEffect } from 'react';
import { Download, X, CheckCircle, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { usePlatformConfig } from '@/contexts/platform-config-context';

interface PWAInstallModalProps {
  onClose: () => void;
}

export function PWAInstallModal({ onClose }: PWAInstallModalProps) {
  const { canInstall, isInstalled, promptInstall, isIOS } = usePWAInstall();
  const { site_name, logo_url } = usePlatformConfig();
  const [installed, setInstalled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isInstalled && !installed) {
    return null;
  }

  const handleInstall = async () => {
    setInstalling(true);

    if (canInstall) {
      // Android/Chrome — prompt nativo direto
      const accepted = await promptInstall();
      if (accepted) {
        setInstalled(true);
        setTimeout(onClose, 2000);
        return;
      }
    }

    // iOS Safari — tenta abrir via share sheet se disponível
    if (isIOS && navigator.share) {
      try {
        await navigator.share({
          title: site_name,
          url: window.location.origin,
        });
      } catch {
        // Usuário cancelou o share — mostrar fallback
      }
    }

    setInstalling(false);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // Tela de sucesso
  if (installed) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative w-full max-w-sm rounded-2xl bg-[#1A1F2B] border border-zinc-700/50 p-8 text-center shadow-2xl">
          <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">App Instalado!</h3>
          <p className="text-zinc-400 text-sm">O app foi adicionado à sua tela inicial.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      <div
        className={`relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-[#1A1F2B] border border-zinc-700/50 shadow-2xl transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-8 opacity-0'
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white z-10"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-8 text-center">
          {/* App icon */}
          <div className="mx-auto mb-4 h-20 w-20 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            {logo_url ? (
              <img
                src={logo_url}
                alt={site_name}
                className="h-full w-full object-contain bg-black/50 p-2"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-emerald-600 text-white text-2xl font-bold">
                {site_name.charAt(0)}
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-1">Instale o {site_name}</h3>
          <p className="text-zinc-400 text-sm mb-6">
            Acesso rápido direto da sua tela inicial, como um app nativo.
          </p>

          {/* Botão principal de instalar */}
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-60 mb-3"
          >
            {installing ? (
              <>
                <Smartphone className="h-5 w-5 animate-pulse" />
                Instalando...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Instalar App
              </>
            )}
          </button>

          {/* Nota para iOS se share não disponível */}
          {isIOS && !canInstall && (
            <p className="text-xs text-zinc-500 mt-2">
              No Safari: toque em Compartilhar e depois &quot;Tela de Início&quot;
            </p>
          )}

          <button
            onClick={handleClose}
            className="mt-3 w-full h-12 rounded-xl border border-zinc-700/50 text-zinc-400 text-sm font-medium active:bg-white/5 transition-all"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
