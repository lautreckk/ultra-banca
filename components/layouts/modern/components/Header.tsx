'use client';

import { Bell, RefreshCw, Menu, Wallet, Gamepad2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { usePlatformConfig } from '@/contexts/platform-config-context';

interface HeaderProps {
  saldo: number;
  saldoBonus: number;
  saldoCassino: number;
  saldoBonusCassino: number;
  onRefresh: () => void;
  loading: boolean;
  onMenuClick: () => void;
}

export function ModernHeader({ saldo, saldoBonus, saldoCassino, saldoBonusCassino, onRefresh, loading, onMenuClick }: HeaderProps) {
  const config = usePlatformConfig();

  return (
    <header
      className="sticky top-0 border-b backdrop-blur-lg"
      style={{
        height: '4.5rem',
        zIndex: 50,
        backgroundColor: 'rgba(var(--color-surface-rgb, 26, 26, 26), 0.8)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left - Menu (mobile) + Balance Display */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg transition-colors md:hidden"
            style={{ backgroundColor: 'var(--color-background)' }}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
          </button>

          {/* Logo for mobile */}
          <div className="md:hidden flex items-center gap-2">
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.site_name} className="h-8 w-auto" />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'var(--modern-gradient-primary)' }}
              >
                {config.site_name?.charAt(0) || 'B'}
              </div>
            )}
          </div>

          {/* Balance Display */}
          <div
            className="px-4 py-2 rounded-lg modern-glass hidden sm:flex gap-4"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Loterias */}
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <Wallet className="h-3 w-3 text-amber-400" />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Loterias</p>
              </div>
              <p className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>
                {loading ? <span className="animate-pulse">...</span> : formatCurrency(saldo)}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-accent-green)' }}>
                Bonus: {formatCurrency(saldoBonus)}
              </p>
            </div>

            <div className="w-px self-stretch" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

            {/* Cassino */}
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <Gamepad2 className="h-3 w-3 text-purple-400" />
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Cassino</p>
              </div>
              <p className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>
                {loading ? <span className="animate-pulse">...</span> : formatCurrency(saldoCassino)}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-accent-green)' }}>
                Bonus: {formatCurrency(saldoBonusCassino)}
              </p>
            </div>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Balance (simplified) */}
          <div className="sm:hidden text-right mr-2">
            <div className="flex items-center gap-1 justify-end">
              <Wallet className="h-3 w-3 text-amber-400" />
              <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                {loading ? '...' : formatCurrency(saldo)}
              </p>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <Gamepad2 className="h-3 w-3 text-purple-400" />
              <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                {loading ? '...' : formatCurrency(saldoCassino)}
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--color-background)' }}
            aria-label="Atualizar saldo"
          >
            <RefreshCw
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              style={{ color: 'var(--color-text)' }}
            />
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--color-background)' }}
            aria-label="Notificacoes"
          >
            <Bell className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
            {/* Badge de notificacao nao lida */}
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-accent-green)' }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
