'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, Calendar, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/admin/shared';
import {
  HouseProfitGauge,
  GameAccessBarChart,
  VisitorLineChart,
  RealTimeVisitorCard,
} from '@/components/admin/charts';
import {
  getVisitorStats,
  getGameAccessStats,
  getHouseProfitData,
  type VisitorStats,
  type GameAccessStat,
  type HouseProfitData,
} from '@/lib/admin/actions/analytics';

type Period = 7 | 30 | 90;

export default function GraficosPage() {
  const [period, setPeriod] = useState<Period>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);
  const [gameStats, setGameStats] = useState<GameAccessStat[]>([]);
  const [profitData, setProfitData] = useState<HouseProfitData | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [visitors, games, profit] = await Promise.all([
        getVisitorStats(period),
        getGameAccessStats(period),
        getHouseProfitData(),
      ]);

      setVisitorStats(visitors);
      setGameStats(games);
      setProfitData(profit);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodOptions: { value: Period; label: string }[] = [
    { value: 7, label: '7 dias' },
    { value: 30, label: '30 dias' },
    { value: 90, label: '90 dias' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
            Graficos e Analytics
          </h1>
          <p className="text-sm md:text-base text-gray-400">
            Acompanhe o desempenho da plataforma em tempo real
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-1">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Real-time Visitors Card */}
        <RealTimeVisitorCard initialCount={visitorStats?.realtime || 0} />

        <StatCard
          title="Visitantes Hoje"
          value={isLoading ? '-' : (visitorStats?.today || 0).toLocaleString('pt-BR')}
          icon={Users}
          variant="info"
        />
        <StatCard
          title="Visitantes (7d)"
          value={isLoading ? '-' : (visitorStats?.week || 0).toLocaleString('pt-BR')}
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="Visitantes (30d)"
          value={isLoading ? '-' : (visitorStats?.month || 0).toLocaleString('pt-BR')}
          icon={TrendingUp}
          variant="warning"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* House Profit Gauge */}
        {profitData ? (
          <HouseProfitGauge
            profitPercentage={profitData.profitPercentage}
            isHouseWinning={profitData.isHouseWinning}
            houseProfit={profitData.houseProfit}
            totalBets={profitData.totalBets}
            totalPrizesPaid={profitData.totalPrizesPaid}
          />
        ) : (
          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50 h-80 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Carregando...</div>
          </div>
        )}

        {/* Game Access Chart */}
        <GameAccessBarChart data={gameStats} />
      </div>

      {/* Profit by Period */}
      {profitData && profitData.periodStats.length > 0 && (
        <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Lucro por Periodo</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {profitData.periodStats.map((stat) => (
              <div
                key={stat.period}
                className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/30"
              >
                <p className="text-sm text-gray-400 mb-2">{stat.period}</p>
                <p
                  className={`text-2xl font-bold ${
                    stat.isHouseWinning ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {stat.profitPercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(stat.totalBets - stat.totalPrizesPaid)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visitor Line Chart */}
      <VisitorLineChart data={visitorStats?.trend || []} />
    </div>
  );
}
