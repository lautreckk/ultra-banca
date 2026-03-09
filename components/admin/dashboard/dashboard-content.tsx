'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatCard } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getDashboardStats, type DashboardStats } from '@/lib/admin/actions/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Search, X, Loader2 } from 'lucide-react';

interface DashboardContentProps {
  initialStats: DashboardStats;
}

export function DashboardContent({ initialStats }: DashboardContentProps) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(false);

  const fetchStats = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const data = await getDashboardStats(from || undefined, to || undefined);
      setStats(data);
      setActiveFilter(!!(from || to));
    } catch (err) {
      console.error('[Dashboard] Error fetching filtered stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilter = () => {
    if (dateFrom || dateTo) {
      fetchStats(dateFrom, dateTo);
    }
  };

  const handleClearFilter = () => {
    setDateFrom('');
    setDateTo('');
    setActiveFilter(false);
    setStats(initialStats);
  };

  return (
    <div className="space-y-4">
      {/* Date Filter */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">Filtrar por data</span>
          {activeFilter && (
            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
              Filtro ativo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-zinc-400">De:</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto h-8 bg-zinc-800 border-zinc-700 text-white text-sm !min-h-0 !h-8 !py-1"
          />
          <label className="text-xs text-zinc-400">Até:</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto h-8 bg-zinc-800 border-zinc-700 text-white text-sm !min-h-0 !h-8 !py-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleFilter}
            disabled={loading || (!dateFrom && !dateTo)}
            className="h-8"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            <span className="ml-1">Filtrar</span>
          </Button>
          {activeFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilter}
              className="h-8 text-zinc-400 hover:text-white"
            >
              <X className="h-3 w-3" />
              <span className="ml-1">Limpar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total de Ganhos (Apostadores)"
          value={formatCurrency(stats.totalGanhos)}
          icon="TrendingUp"
          variant="success"
          loading={loading}
        />
        <StatCard
          title="Total de Apostas"
          value={stats.totalApostas.toLocaleString('pt-BR')}
          subtitle={activeFilter ? undefined : `${stats.apostasHoje} hoje`}
          icon="Receipt"
          variant="info"
          loading={loading}
        />
        <StatCard
          title="Total de Depósitos"
          value={formatCurrency(stats.totalDepositos)}
          icon="ArrowDownToLine"
          variant="default"
          loading={loading}
        />
        <StatCard
          title="Total de Saques"
          value={formatCurrency(stats.totalSaques)}
          subtitle={activeFilter ? undefined : `${formatCurrency(stats.saquesHoje)} hoje`}
          icon="ArrowUpFromLine"
          variant="warning"
          loading={loading}
        />
        {!activeFilter && (
          <>
            <StatCard
              title="Depósitos Diário"
              value={formatCurrency(stats.depositosDiario)}
              icon="Calendar"
              variant="default"
              loading={loading}
            />
            <StatCard
              title="Depósitos Semanal"
              value={formatCurrency(stats.depositosSemanal)}
              icon="CalendarDays"
              variant="default"
              loading={loading}
            />
            <StatCard
              title="Depósitos Mensal"
              value={formatCurrency(stats.depositosMensal)}
              icon="CalendarRange"
              variant="default"
              loading={loading}
            />
          </>
        )}
        <StatCard
          title="Depósitos (Promotores)"
          value={formatCurrency(stats.depositosPromotores)}
          icon="Users"
          variant="primary"
          loading={loading}
        />
        <StatCard
          title="Cadastros"
          value={stats.cadastrosTotal.toLocaleString('pt-BR')}
          icon="Users"
          variant="info"
          loading={loading}
        />
        <StatCard
          title="Usuários Ativos (7d)"
          value={stats.usuariosAtivos.toLocaleString('pt-BR')}
          icon="Activity"
          variant="info"
          loading={loading}
        />
      </div>
    </div>
  );
}
