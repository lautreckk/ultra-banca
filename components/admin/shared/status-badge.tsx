'use client';

import { cn } from '@/lib/utils';

type BadgeStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'processing' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Payment/Financial statuses
  pending: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  PENDING: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Aprovado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  APPROVED: { label: 'Aprovado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  PAID: { label: 'Pago', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  FAILED: { label: 'Falhou', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  completed: { label: 'Concluído', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  COMPLETED: { label: 'Concluído', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  cancelled: { label: 'Cancelado', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  CANCELLED: { label: 'Cancelado', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  processing: { label: 'Processando', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  PROCESSING: { label: 'Processando', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },

  // Bet statuses
  pendente: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  confirmada: { label: 'Confirmada', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  premiada: { label: 'Premiada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ganhou: { label: 'Ganhou', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  perdeu: { label: 'Perdeu', className: 'bg-red-500/10 text-red-400 border-red-500/20' },

  // General statuses
  active: { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  inactive: { label: 'Inativo', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border backdrop-blur-sm',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
