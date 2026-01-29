'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HouseProfitGaugeProps {
  profitPercentage: number;
  isHouseWinning: boolean;
  houseProfit: number;
  totalBets: number;
  totalPrizesPaid: number;
}

export function HouseProfitGauge({
  profitPercentage,
  isHouseWinning,
  houseProfit,
  totalBets,
  totalPrizesPaid,
}: HouseProfitGaugeProps) {
  const gaugeData = useMemo(() => {
    const value = Math.min(Math.max(profitPercentage, 0), 100);
    return [
      { name: 'value', value },
      { name: 'empty', value: 100 - value },
    ];
  }, [profitPercentage]);

  const getColor = () => {
    if (profitPercentage >= 60) return '#22c55e'; // green-500
    if (profitPercentage >= 50) return '#84cc16'; // lime-500
    if (profitPercentage >= 40) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Lucro da Casa</h3>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isHouseWinning
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {isHouseWinning ? (
            <>
              <TrendingUp className="h-3 w-3" />
              Ganhando
            </>
          ) : (
            <>
              <TrendingDown className="h-3 w-3" />
              Perdendo
            </>
          )}
        </div>
      </div>

      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="90%"
              dataKey="value"
              stroke="none"
            >
              <Cell fill={getColor()} />
              <Cell fill="#3f3f46" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '20%' }}>
          <span
            className="text-4xl font-bold"
            style={{ color: getColor() }}
          >
            {profitPercentage.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-400 mt-1">
            Retenção
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-700/50">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Total Apostado</p>
          <p className="text-sm font-semibold text-white">
            {formatCurrency(totalBets)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Prêmios Pagos</p>
          <p className="text-sm font-semibold text-red-400">
            {formatCurrency(totalPrizesPaid)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Lucro</p>
          <p
            className={`text-sm font-semibold ${
              houseProfit >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(houseProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}
