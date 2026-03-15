'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLiveMetrics, getActiveUsers, getHourlyChartData, getRecentActivities } from '@/lib/admin/actions/live';
import type { LiveMetrics, ActiveUser, HourlyMetric, RecentActivity } from '@/lib/admin/actions/live';
import { LiveStatCards } from './live-stat-cards';
import { ActiveUsersTable } from './active-users-table';
import { LiveActivityFeed } from './live-activity-feed';
import { LiveFilters } from './live-filters';
import { HourlyUsersChart } from './charts/hourly-users-chart';
import { BetsVolumeChart } from './charts/bets-volume-chart';
import { BetsCountChart } from './charts/bets-count-chart';
import { DepositsChart } from './charts/deposits-chart';

interface Props {
  initialMetrics: LiveMetrics;
  initialUsers: ActiveUser[];
  initialUsersTotal: number;
  initialChartData: HourlyMetric[];
  initialActivities: RecentActivity[];
  platformId: string;
}

export function LiveDashboardContent({
  initialMetrics,
  initialUsers,
  initialUsersTotal,
  initialChartData,
  initialActivities,
  platformId,
}: Props) {
  // State
  const [metrics, setMetrics] = useState<LiveMetrics>(initialMetrics);
  const [users, setUsers] = useState<ActiveUser[]>(initialUsers);
  const [usersTotal, setUsersTotal] = useState(initialUsersTotal);
  const [usersPage, setUsersPage] = useState(1);
  const [chartData, setChartData] = useState<HourlyMetric[]>(initialChartData);
  const [activities, setActivities] = useState<RecentActivity[]>(initialActivities);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasFilter, setHasFilter] = useState(false);

  // Refs
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh metrics
  const refreshMetrics = useCallback(async () => {
    try {
      const data = await getLiveMetrics();
      setMetrics(data);
    } catch (e) {
      console.debug('Live metrics refresh error:', e);
    }
  }, []);

  // Refresh active users
  const refreshUsers = useCallback(async (page = 1) => {
    setUsersLoading(true);
    try {
      const { users: u, total } = await getActiveUsers(page, 20);
      setUsers(u);
      setUsersTotal(total);
    } catch (e) {
      console.debug('Active users refresh error:', e);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Refresh activities
  const refreshActivities = useCallback(async () => {
    try {
      const data = await getRecentActivities(15);
      setActivities(data);
    } catch (e) {
      console.debug('Activities refresh error:', e);
    }
  }, []);

  // Refresh chart data
  const refreshChartData = useCallback(async (from?: string, to?: string) => {
    setChartLoading(true);
    try {
      const data = await getHourlyChartData(from, to);
      setChartData(data);
    } catch (e) {
      console.debug('Chart data refresh error:', e);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // Polling: refresh metrics every 30s
  useEffect(() => {
    pollRef.current = setInterval(() => {
      refreshMetrics();
      refreshUsers(usersPage);
      refreshActivities();
    }, 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshMetrics, refreshUsers, refreshActivities, usersPage]);

  // Escutar evento de refresh global do header
  useEffect(() => {
    const handleAdminRefresh = () => {
      refreshMetrics();
      refreshUsers(usersPage);
      refreshActivities();
      refreshChartData(hasFilter ? dateFrom || undefined : undefined, hasFilter ? dateTo || undefined : undefined);
    };
    window.addEventListener('admin-refresh', handleAdminRefresh);
    return () => window.removeEventListener('admin-refresh', handleAdminRefresh);
  }, [refreshMetrics, refreshUsers, refreshActivities, refreshChartData, usersPage, hasFilter, dateFrom, dateTo]);

  // Supabase Realtime: listen for new activity events
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('live-activity-admin')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_events',
          ...(platformId !== 'all' ? { filter: `platform_id=eq.${platformId}` } : {}),
        },
        () => {
          // Debounce: wait 1s before refreshing to batch multiple events
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            refreshMetrics();
            refreshActivities();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [platformId, refreshMetrics, refreshActivities]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setUsersPage(page);
    refreshUsers(page);
  };

  // Handle filter
  const handleFilter = () => {
    if (dateFrom || dateTo) {
      setHasFilter(true);
      refreshChartData(dateFrom || undefined, dateTo || undefined);
    }
  };

  const handleClearFilter = () => {
    setDateFrom('');
    setDateTo('');
    setHasFilter(false);
    refreshChartData();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            Live
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">ao vivo</span>
            </span>
          </h1>
          <p className="text-sm text-zinc-500">Monitoramento em tempo real da plataforma</p>
        </div>
      </div>

      {/* Stat Cards */}
      <LiveStatCards metrics={metrics} loading={metricsLoading} />

      {/* Grid: Active Users + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Users - 2/3 */}
        <div className="lg:col-span-2">
          <ActiveUsersTable
            users={users}
            total={usersTotal}
            page={usersPage}
            pageSize={20}
            onPageChange={handlePageChange}
            loading={usersLoading}
          />
        </div>

        {/* Activity Feed - 1/3 */}
        <div>
          <LiveActivityFeed activities={activities} />
        </div>
      </div>

      {/* Filters */}
      <div className="pt-2">
        <LiveFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onFilter={handleFilter}
          onClear={handleClearFilter}
          hasFilter={hasFilter}
        />
      </div>

      {/* Charts */}
      {chartLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-[340px] animate-pulse" />
          ))}
        </div>
      ) : chartData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HourlyUsersChart data={chartData} />
          <BetsVolumeChart data={chartData} />
          <BetsCountChart data={chartData} />
          <DepositsChart data={chartData} />
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500 text-sm">
            {hasFilter
              ? 'Nenhum dado encontrado para o período selecionado'
              : 'Os gráficos serão populados conforme os dados forem agregados (a cada 5 minutos)'}
          </p>
        </div>
      )}
    </div>
  );
}
