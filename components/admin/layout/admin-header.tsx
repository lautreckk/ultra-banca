'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, User, Building2, ChevronDown, Check, Loader2 } from 'lucide-react';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { getUserAdminPlatforms, switchPlatform, getPlatformId } from '@/lib/utils/platform';
import type { Platform } from '@/lib/utils/platform-constants';

interface AdminHeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

export function AdminHeader({ onMenuClick, userName = 'Admin' }: AdminHeaderProps) {
  const router = useRouter();
  const config = usePlatformConfig();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [currentPlatformId, setCurrentPlatformId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const hasMultiplePlatforms = platforms.length > 1;

  useEffect(() => {
    loadPlatforms();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadPlatforms() {
    setLoading(true);
    const [platformsData, platformId] = await Promise.all([
      getUserAdminPlatforms(),
      getPlatformId(),
    ]);
    setPlatforms(platformsData as Platform[]);
    setCurrentPlatformId(platformId);
    setLoading(false);
  }

  async function handleSelect(platformId: string) {
    if (platformId === currentPlatformId) {
      setDropdownOpen(false);
      return;
    }

    setSwitchingId(platformId);
    startTransition(async () => {
      const result = await switchPlatform(platformId);
      if (result.success) {
        setCurrentPlatformId(platformId);
        router.refresh();
        setDropdownOpen(false);
      } else {
        alert(result.error);
      }
      setSwitchingId(null);
    });
  }

  const currentPlatform = platforms.find(p => p.id === currentPlatformId);

  return (
    <header className="h-16 bg-zinc-900/50 border-b border-zinc-800/50 flex items-center justify-between px-4 backdrop-blur-sm">
      {/* Menu button (mobile) */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden transition-colors"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Title (desktop) with platform switcher */}
      <div className="hidden lg:flex items-center gap-3">
        {hasMultiplePlatforms ? (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-indigo-500/50 transition-colors"
            >
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">{config.site_name}</span>
              <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-zinc-800">
                  <p className="text-xs font-medium text-zinc-500 uppercase">Selecionar Banca</p>
                </div>
                <div className="max-h-64 overflow-y-auto py-2">
                  {platforms.map((platform) => {
                    const isSelected = platform.id === currentPlatformId;
                    const isSwitching = switchingId === platform.id;

                    return (
                      <button
                        key={platform.id}
                        onClick={() => handleSelect(platform.id)}
                        disabled={isPending}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/50 transition-colors ${
                          isSelected ? 'bg-indigo-500/10' : ''
                        } disabled:opacity-50`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
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
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-white text-sm truncate">{platform.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{platform.domain}</p>
                        </div>
                        {isSwitching ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
                        ) : isSelected ? (
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-white">
            {config.site_name} - Painel Administrativo
          </h1>
        )}
      </div>

      {/* Mobile platform name */}
      <div className="lg:hidden flex-1 flex justify-center">
        {hasMultiplePlatforms ? (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700"
            >
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white truncate max-w-32">{config.site_name}</span>
              <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Mobile */}
            {dropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-zinc-800">
                  <p className="text-xs font-medium text-zinc-500 uppercase">Selecionar Banca</p>
                </div>
                <div className="max-h-64 overflow-y-auto py-2">
                  {platforms.map((platform) => {
                    const isSelected = platform.id === currentPlatformId;
                    const isSwitching = switchingId === platform.id;

                    return (
                      <button
                        key={platform.id}
                        onClick={() => handleSelect(platform.id)}
                        disabled={isPending}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/50 transition-colors ${
                          isSelected ? 'bg-indigo-500/10' : ''
                        } disabled:opacity-50`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
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
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-white text-sm truncate">{platform.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{platform.domain}</p>
                        </div>
                        {isSwitching ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
                        ) : isSelected ? (
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm font-semibold text-white truncate">
            {config.site_name}
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-all duration-150">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-zinc-900" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all duration-150 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <User className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-sm font-medium text-zinc-300 hidden sm:block">{userName}</span>
        </div>
      </div>
    </header>
  );
}
