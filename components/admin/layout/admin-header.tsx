'use client';

import { useState } from 'react';
import { Menu, Bell, User, Building2, ChevronDown } from 'lucide-react';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { PlatformSelectorModal, usePlatformSelector } from '@/components/admin/platform-selector-modal';

interface AdminHeaderProps {
  onMenuClick: () => void;
  userName?: string;
}

export function AdminHeader({ onMenuClick, userName = 'Admin' }: AdminHeaderProps) {
  const config = usePlatformConfig();
  const {
    hasMultiplePlatforms,
    currentPlatformId,
    showModal,
    setShowModal,
  } = usePlatformSelector();

  return (
    <>
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
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-indigo-500/50 transition-colors"
            >
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">{config.site_name}</span>
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </button>
          ) : (
            <h1 className="text-lg font-semibold text-white">
              {config.site_name} - Painel Administrativo
            </h1>
          )}
        </div>

        {/* Mobile platform name */}
        <div className="lg:hidden flex-1 flex justify-center">
          {hasMultiplePlatforms ? (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700"
            >
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white truncate max-w-32">{config.site_name}</span>
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </button>
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

      {/* Platform Selector Modal */}
      <PlatformSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentPlatformId={currentPlatformId || undefined}
      />
    </>
  );
}
