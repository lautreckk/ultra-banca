'use client';

import { StatCard } from '@/components/admin/shared/stat-card';
import type { LiveMetrics } from '@/lib/admin/actions/live';

interface Props {
  metrics: LiveMetrics;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function LiveStatCards({ metrics, loading = false }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
      <StatCard
        title="Usuários Online"
        value={metrics.usersOnline}
        subtitle={
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ao vivo</span>
          </span>
        }
        icon="Users"
        variant="info"
        loading={loading}
      />
      <StatCard
        title="Apenas Navegando"
        value={metrics.usersBrowsing}
        subtitle="sem apostar"
        icon="Users"
        variant="default"
        loading={loading}
      />
      <StatCard
        title="Depósitos Agora"
        value={metrics.depositsNow}
        subtitle="últimos 5 min"
        icon="ArrowDownToLine"
        variant="success"
        loading={loading}
      />
      <StatCard
        title="Apostas Agora"
        value={metrics.betsNow}
        subtitle="últimos 5 min"
        icon="Receipt"
        variant="warning"
        loading={loading}
      />
      <StatCard
        title="Volume Apostado"
        value={formatCurrency(metrics.betValueNow)}
        subtitle="últimos 5 min"
        icon="DollarSign"
        variant="primary"
        loading={loading}
        className="col-span-2 md:col-span-1"
      />
    </div>
  );
}
