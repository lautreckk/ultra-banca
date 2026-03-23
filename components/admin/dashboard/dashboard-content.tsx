'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatCard } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getDashboardStats, type DashboardStats } from '@/lib/admin/actions/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Search, X, Loader2, Eye, EyeOff, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DashboardContentProps {
  initialStats: DashboardStats;
}

export function DashboardContent({ initialStats }: DashboardContentProps) {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(false);
  const [hideValues, setHideValues] = useState(false);

  // Atualizar stats quando initialStats mudar (server refresh via router.refresh)
  useEffect(() => {
    if (!activeFilter) {
      setStats(initialStats);
    }
  }, [initialStats, activeFilter]);

  const fetchStats = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const data = await getDashboardStats(from || undefined, to || undefined);
      setStats(data);
      setActiveFilter(!!(from || to));
    } catch (err) {
      console.error('[Dashboard] Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Escutar evento de refresh global do header
  useEffect(() => {
    const handleRefresh = () => {
      fetchStats(activeFilter ? dateFrom || undefined : undefined, activeFilter ? dateTo || undefined : undefined);
    };
    window.addEventListener('admin-refresh', handleRefresh);
    return () => window.removeEventListener('admin-refresh', handleRefresh);
  }, [fetchStats, activeFilter, dateFrom, dateTo]);

  const handleFilter = () => {
    if (dateFrom || dateTo) {
      fetchStats(dateFrom, dateTo);
    }
  };

  const handleClearFilter = () => {
    setDateFrom('');
    setDateTo('');
    setActiveFilter(false);
    fetchStats();
  };

  // Helper para mascarar valores
  const fv = (value: string) => hideValues ? '•••••••' : value;
  const fn = (value: number) => hideValues ? '•••' : value.toLocaleString('pt-BR');

  // Cálculos financeiros
  const totalEntradas = stats.totalDepositos;
  const totalPremios = stats.totalGanhos;
  const totalSaques = stats.totalSaques;
  const totalComissoes = stats.totalComissoes;
  const lucroOperacional = totalEntradas - totalPremios - totalSaques;
  const lucroLiquido = lucroOperacional - totalComissoes;

  return (
    <div className="space-y-4">
      {/* Filter + Privacy Toggle */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">Filtrar por data</span>
            {activeFilter && (
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                Filtro ativo
              </span>
            )}
          </div>
          {/* Toggle ocultar valores */}
          <button
            onClick={() => setHideValues(!hideValues)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">{hideValues ? 'Mostrar' : 'Ocultar'}</span>
          </button>
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

      {/* Bloco Financeiro: Prêmios x Recebimentos */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-5">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Resumo Financeiro</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {/* Entradas */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-emerald-400/70 font-medium uppercase tracking-wider">Recebimentos</p>
            <p className="text-lg md:text-2xl font-bold text-emerald-400 mt-1">
              {fv(formatCurrency(totalEntradas))}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">Depósitos confirmados</p>
          </div>

          {/* Prêmios */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-red-400/70 font-medium uppercase tracking-wider">Prêmios</p>
            <p className="text-lg md:text-2xl font-bold text-red-400 mt-1">
              {fv(formatCurrency(totalPremios))}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">Total ganho por apostadores</p>
          </div>

          {/* Saques */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-amber-400/70 font-medium uppercase tracking-wider">Saques</p>
            <p className="text-lg md:text-2xl font-bold text-amber-400 mt-1">
              {fv(formatCurrency(totalSaques))}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">Saques efetuados</p>
          </div>

          {/* Comissões */}
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-purple-400/70 font-medium uppercase tracking-wider">Comissões</p>
            <p className="text-lg md:text-2xl font-bold text-purple-400 mt-1">
              {fv(formatCurrency(totalComissoes))}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">Comissão de promotores</p>
          </div>

          {/* Resultado Bruto = Total de Recebimentos */}
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 md:p-4">
            <p className="text-[10px] md:text-xs text-cyan-400/70 font-medium uppercase tracking-wider">Resultado Bruto</p>
            <p className="text-lg md:text-2xl font-bold text-cyan-400 mt-1">
              {fv(formatCurrency(totalEntradas))}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">Total de recebimentos</p>
          </div>

          {/* Lucro Líquido */}
          <div className={`rounded-xl p-3 md:p-4 border ${
            lucroLiquido >= 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <p className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${
              lucroLiquido >= 0 ? 'text-emerald-300/70' : 'text-red-300/70'
            }`}>
              Lucro Líquido
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {lucroLiquido > 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              ) : lucroLiquido < 0 ? (
                <TrendingDown className="h-5 w-5 text-red-400 flex-shrink-0" />
              ) : (
                <Minus className="h-5 w-5 text-zinc-400 flex-shrink-0" />
              )}
              <p className={`text-lg md:text-2xl font-black ${
                lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {fv(formatCurrency(Math.abs(lucroLiquido)))}
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Bruto - Comissões promotores</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total de Ganhos (Apostadores)"
          value={fv(formatCurrency(stats.totalGanhos))}
          icon="TrendingUp"
          variant="success"
          loading={loading}
        />
        <StatCard
          title="Total de Apostas"
          value={fn(stats.totalApostas)}
          subtitle={activeFilter ? undefined : `${fn(stats.apostasHoje)} hoje`}
          icon="Receipt"
          variant="info"
          loading={loading}
        />
        <StatCard
          title="Total de Depósitos"
          value={fv(formatCurrency(stats.totalDepositos))}
          icon="ArrowDownToLine"
          variant="default"
          loading={loading}
        />
        <StatCard
          title="Total de Saques"
          value={fv(formatCurrency(stats.totalSaques))}
          subtitle={activeFilter ? undefined : `${fv(formatCurrency(stats.saquesHoje))} hoje`}
          icon="ArrowUpFromLine"
          variant="warning"
          loading={loading}
        />
        {!activeFilter && (
          <>
            <StatCard
              title="Depósitos Diário"
              value={fv(formatCurrency(stats.depositosDiario))}
              icon="Calendar"
              variant="default"
              loading={loading}
            />
            <StatCard
              title="Depósitos Semanal"
              value={fv(formatCurrency(stats.depositosSemanal))}
              icon="CalendarDays"
              variant="default"
              loading={loading}
            />
            <StatCard
              title="Depósitos Mensal"
              value={fv(formatCurrency(stats.depositosMensal))}
              icon="CalendarRange"
              variant="default"
              loading={loading}
            />
          </>
        )}
        <StatCard
          title="Depósitos (Promotores)"
          value={fv(formatCurrency(stats.depositosPromotores))}
          icon="Users"
          variant="primary"
          loading={loading}
        />
        <StatCard
          title="Cadastros"
          value={fn(stats.cadastrosTotal)}
          icon="Users"
          variant="info"
          loading={loading}
        />
        <StatCard
          title="Usuários Ativos (7d)"
          value={fn(stats.usuariosAtivos)}
          icon="Activity"
          variant="info"
          loading={loading}
        />
      </div>
    </div>
  );
}
