'use client';

import { useState, useEffect } from 'react';
import { Download, Share, Plus, X, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    // Delay to animate in
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // If already installed, don't show
  if (isInstalled && !installed) {
    return null;
  }

  const handleInstall = async () => {
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) {
        setInstalled(true);
        setTimeout(onClose, 2000);
      }
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // Success screen
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
        {/* Close button */}
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

          <h3 className="text-xl font-bold text-white mb-1">Instale o {site_name}!</h3>
          <p className="text-zinc-400 text-sm mb-6">
            Adicione à tela inicial para acesso rápido e a melhor experiência.
          </p>

          {/* Native install button (Chrome/Android) */}
          {canInstall && (
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-3 h-14 rounded-xl bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all mb-3"
            >
              <Download className="h-5 w-5" />
              Instalar Agora
            </button>
          )}

          {/* iOS Instructions */}
          {isIOS && !canInstall && (
            <div className="space-y-4 text-left">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                <p className="text-sm font-semibold text-white text-center mb-3">
                  Siga os passos abaixo:
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">1</div>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    Toque no botão <Share className="h-5 w-5 text-blue-400 inline-block" /> <span className="font-semibold text-white">Compartilhar</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">2</div>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    Selecione <Plus className="h-5 w-5 text-white inline-block" /> <span className="font-semibold text-white">Tela de Início</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">3</div>
                  <p className="text-sm text-zinc-300">
                    Toque em <span className="font-semibold text-white">Adicionar</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generic Android/Desktop without beforeinstallprompt */}
          {!canInstall && !isIOS && (
            <div className="space-y-4 text-left">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                <p className="text-sm font-semibold text-white text-center mb-3">
                  Siga os passos abaixo:
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm">1</div>
                  <p className="text-sm text-zinc-300">
                    Toque no menu <span className="font-semibold text-white">⋮</span> do navegador
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm">2</div>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    Selecione <Download className="h-4 w-4 text-emerald-400 inline-block" /> <span className="font-semibold text-white">Instalar app</span> ou <span className="font-semibold text-white">Adicionar à tela inicial</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm">3</div>
                  <p className="text-sm text-zinc-300">
                    Confirme tocando em <span className="font-semibold text-white">Instalar</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Skip button */}
          <button
            onClick={handleClose}
            className="mt-4 w-full h-12 rounded-xl border border-zinc-700/50 text-zinc-400 text-sm font-medium active:bg-white/5 transition-all"
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}
