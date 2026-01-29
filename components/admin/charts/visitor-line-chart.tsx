'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface TrendData {
  date: string;
  visitors: number;
  pageViews: number;
}

interface VisitorLineChartProps {
  data: TrendData[];
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const date = new Date(label || '');
  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm text-gray-400 mb-2 capitalize">{formattedDate}</p>
      <div className="space-y-1">
        {payload.map((entry: { dataKey: string; value: number }) => (
          <p key={entry.dataKey} className="text-sm">
            <span className="text-gray-300">
              {entry.dataKey === 'visitors' ? 'Visitantes' : 'Page Views'}:
            </span>{' '}
            <span className="text-white font-semibold">
              {entry.value.toLocaleString('pt-BR')}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
};

export function VisitorLineChart({ data }: VisitorLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Tendência de Visitantes</h3>
        <div className="h-80 flex items-center justify-center text-gray-400">
          Nenhum dado de tendência disponível
        </div>
      </div>
    );
  }

  const maxVisitors = Math.max(...data.map(d => d.visitors), 1);
  const maxPageViews = Math.max(...data.map(d => d.pageViews), 1);

  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Tendência de Visitantes</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-xs text-gray-400">Visitantes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-400">Page Views</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, Math.max(maxVisitors, maxPageViews) * 1.1]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVisitors)"
            />
            <Area
              type="monotone"
              dataKey="pageViews"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPageViews)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
