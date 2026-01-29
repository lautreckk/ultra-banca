'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { GameAccessStat } from '@/lib/admin/actions/analytics';

interface GameAccessBarChartProps {
  data: GameAccessStat[];
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
];

interface ChartDataItem extends GameAccessStat {
  color: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload as ChartDataItem;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="font-semibold text-white mb-2">{item.gameName}</p>
      <div className="space-y-1 text-sm">
        <p className="text-gray-300">
          Acessos: <span className="text-white font-medium">{item.accessCount.toLocaleString('pt-BR')}</span>
        </p>
        <p className="text-gray-300">
          Visitantes únicos: <span className="text-white font-medium">{item.uniqueVisitors.toLocaleString('pt-BR')}</span>
        </p>
        <p className="text-gray-300">
          % do total: <span className="text-white font-medium">{item.percentageOfTotal.toFixed(1)}%</span>
        </p>
      </div>
    </div>
  );
}

export function GameAccessBarChart({ data }: GameAccessBarChartProps) {
  const chartData: ChartDataItem[] = data.slice(0, 8).map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  if (data.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Jogos Mais Acessados</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Nenhum dado de acesso disponível
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Jogos Mais Acessados</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <XAxis type="number" stroke="#71717a" fontSize={12} />
            <YAxis
              type="category"
              dataKey="gameName"
              stroke="#71717a"
              fontSize={12}
              width={75}
              tick={{ fill: '#a1a1aa' }}
            />
            <Tooltip content={renderCustomTooltip} cursor={{ fill: 'rgba(113, 113, 122, 0.1)' }} />
            <Bar dataKey="accessCount" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-zinc-700/50">
        <div className="flex flex-wrap gap-3">
          {chartData.slice(0, 4).map((item) => (
            <div key={item.gameType} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-400">
                {item.gameName} ({item.percentageOfTotal.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
