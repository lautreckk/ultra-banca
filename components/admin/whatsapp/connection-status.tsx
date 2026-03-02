'use client';

import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  status: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  open: { label: 'Conectado', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  close: { label: 'Desconectado', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  connecting: { label: 'Conectando', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  disconnected: { label: 'Desconectado', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  unknown: { label: 'Desconhecido', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
};

export function ConnectionStatus({ status, showLabel = true, size = 'md' }: ConnectionStatusProps) {
  const config = statusConfig[status] || statusConfig.unknown;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const Icon = status === 'open' ? Wifi : status === 'connecting' ? Loader2 : WifiOff;

  return (
    <div className={cn('flex items-center gap-2', config.bgColor, 'rounded-full px-3 py-1')}>
      <Icon
        className={cn(
          sizeClasses[size],
          config.color,
          status === 'connecting' && 'animate-spin'
        )}
      />
      {showLabel && (
        <span className={cn(textSize[size], config.color, 'font-medium')}>
          {config.label}
        </span>
      )}
    </div>
  );
}
