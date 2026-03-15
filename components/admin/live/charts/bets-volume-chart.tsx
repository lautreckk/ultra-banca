'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartWrapper } from './chart-wrapper';
import { CHART_THEME } from './chart-theme';
import type { HourlyMetric } from '@/lib/admin/actions/live';

interface Props {
  data: HourlyMetric[];
}

export function BetsVolumeChart({ data }: Props) {
  return (
    <ChartWrapper title="Volume de Apostas por Hora">
      <ComposedChart data={data}>
        <CartesianGrid {...CHART_THEME.grid} />
        <XAxis dataKey="hour_label" tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <Tooltip {...CHART_THEME.tooltip} />
        <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: 12 }} />
        <Bar
          yAxisId="left"
          dataKey="bets_volume"
          name="Volume (R$)"
          fill={CHART_THEME.colors.bets}
          radius={[4, 4, 0, 0]}
          opacity={0.8}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="bets_count"
          name="Qtd Apostas"
          stroke={CHART_THEME.colors.betCount}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartWrapper>
  );
}
