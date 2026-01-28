'use client';

import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Calendar,
  CalendarDays,
  CalendarRange,
  DollarSign,
  CreditCard,
  Activity,
  Clock,
  Shield,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Calendar,
  CalendarDays,
  CalendarRange,
  DollarSign,
  CreditCard,
  Activity,
  Clock,
  Shield,
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string | LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

// Glass/Border style - Linear/Vercel aesthetic
const variantStyles = {
  default: 'bg-zinc-900/50 border border-zinc-800',
  success: 'bg-emerald-500/5 border border-emerald-500/20',
  warning: 'bg-amber-500/5 border border-amber-500/20',
  danger: 'bg-red-500/5 border border-red-500/20',
  info: 'bg-cyan-500/5 border border-cyan-500/20',
};

const iconVariantStyles = {
  default: 'bg-zinc-800 text-zinc-400',
  success: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  danger: 'bg-red-500/10 text-red-400',
  info: 'bg-cyan-500/10 text-cyan-400',
};

const valueVariantStyles = {
  default: 'text-white',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
  info: 'text-cyan-400',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  // Suporta tanto string (nome do ícone) quanto componente LucideIcon diretamente
  const Icon = icon
    ? typeof icon === 'string'
      ? iconMap[icon]
      : icon
    : null;

  return (
    <div
      className={cn(
        'rounded-xl p-4 md:p-5 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-zinc-400 uppercase tracking-wider truncate">{title}</p>
          <p className={cn(
            'mt-2 md:mt-3 text-2xl md:text-3xl font-bold truncate',
            valueVariantStyles[variant]
          )}>{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500 truncate">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-2 md:mt-3 text-xs font-medium',
                trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'p-2.5 md:p-3 rounded-xl ml-3 flex-shrink-0',
              iconVariantStyles[variant]
            )}
          >
            <Icon className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
