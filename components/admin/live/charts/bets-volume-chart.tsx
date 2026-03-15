'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartWrapper } from './chart-wrapper';
import { CHART_THEME } from './chart-theme';
import type { HourlyMetric } from '@/lib/admin/actions/live';

interface Props {
  data: HourlyMetric[];
}

export function BetsVolumeChart({ data }: Props) {
  return (
    <ChartWrapper title="Volume de Apostas por Hora (R$)">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorBetsVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_THEME.colors.bets} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_THEME.colors.bets} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_THEME.grid} />
        <XAxis dataKey="hour_label" tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <YAxis tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <Tooltip {...CHART_THEME.tooltip} />
        <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="bets_volume"
          name="Volume (R$)"
          stroke={CHART_THEME.colors.bets}
          fill="url(#colorBetsVolume)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartWrapper>
  );
}
