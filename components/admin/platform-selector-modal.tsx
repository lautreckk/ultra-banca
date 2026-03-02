'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getUserAdminPlatforms, switchPlatform, getPlatformId } from '@/lib/utils/platform';
import type { Platform } from '@/lib/utils/platform-constants';
import { Building2, Check, Loader2, Crown } from 'lucide-react';

interface PlatformSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlatformId?: string;
}

export function PlatformSelectorModal({
  isOpen,
  onClose,
  currentPlatformId,
}: PlatformSelectorModalProps) {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPlatforms();
    }
  }, [isOpen]);

  async function loadPlatforms() {
    setLoading(true);
    const data = await getUserAdminPlatforms();
    setPlatforms(data as Platform[]);
    setLoading(false);
  }

  async function handleSelect(platformId: string) {
    setSelectedId(platformId);
    startTransition(async () => {
      const result = await switchPlatform(platformId);
      if (result.success) {
        router.refresh();
        onClose();
      } else {
        alert(result.error);
        setSelectedId(null);
      }
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Selecionar Banca</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Escolha qual banca deseja gerenciar
          </p>
        </div>

        {/* Content */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : platforms.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              Nenhuma banca disponivel
            </div>
          ) : (
            <div className="space-y-2">
              {platforms.map((platform) => {
                const isSelected = selectedId === platform.id;
                const isCurrent = currentPlatformId === platform.id;

                return (
                  <button
                    key={platform.id}
                    onClick={() => handleSelect(platform.id)}
                    disabled={isPending || isCurrent}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl border transition-all
                      ${isCurrent
                        ? 'bg-indigo-500/20 border-indigo-500/50 cursor-default'
                        : 'bg-zinc-800/50 border-zinc-700 hover:border-indigo-500/50 hover:bg-zinc-800'}
                      disabled:opacity-50
                    `}
                  >
                    {/* Platform Icon */}
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{ backgroundColor: platform.color_primary }}
                    >
                      {platform.logo_url ? (
                        <img
                          src={platform.logo_url}
                          alt={platform.name}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        platform.name.charAt(0)
                      )}
                    </div>

                    {/* Platform Info */}
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">{platform.name}</p>
                      <p className="text-sm text-zinc-400">{platform.domain}</p>
                    </div>

                    {/* Status */}
                    {isSelected && isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-400 shrink-0" />
                    ) : isCurrent ? (
                      <div className="flex items-center gap-1 text-indigo-400 shrink-0">
                        <Check className="h-5 w-5" />
                        <span className="text-sm font-medium">Atual</span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para verificar se o usuario tem multiplas plataformas
 * e deve mostrar o seletor automaticamente.
 */
export function usePlatformSelector() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [currentPlatformId, setCurrentPlatformId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      const [platformsData, platformId] = await Promise.all([
        getUserAdminPlatforms(),
        getPlatformId(),
      ]);
      setPlatforms(platformsData as Platform[]);
      setCurrentPlatformId(platformId);
      setLoading(false);

      // Mostrar modal automaticamente se tiver mais de uma plataforma
      // e nao tiver um platform_id definido no cookie
      if (platformsData.length > 1) {
        // Verificar se ja tem um cookie definido pelo middleware
        const cookieValue = document.cookie
          .split('; ')
          .find((row) => row.startsWith('platform_id='));

        if (!cookieValue) {
          setShowModal(true);
        }
      }
    }
    load();
  }, []);

  return {
    platforms,
    currentPlatformId,
    loading,
    showModal,
    setShowModal,
    hasMultiplePlatforms: platforms.length > 1,
  };
}
