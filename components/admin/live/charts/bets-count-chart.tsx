'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartWrapper } from './chart-wrapper';
import { CHART_THEME } from './chart-theme';
import type { HourlyMetric } from '@/lib/admin/actions/live';

interface Props {
  data: HourlyMetric[];
}

export function BetsCountChart({ data }: Props) {
  return (
    <ChartWrapper title="Quantidade de Apostas por Hora">
      <LineChart data={data}>
        <CartesianGrid {...CHART_THEME.grid} />
        <XAxis dataKey="hour_label" tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <YAxis tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <Tooltip {...CHART_THEME.tooltip} />
        <Line
          type="monotone"
          dataKey="bets_count"
          name="Apostas"
          stroke={CHART_THEME.colors.betCount}
          strokeWidth={2}
          dot={{ fill: CHART_THEME.colors.betCount, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartWrapper>
  );
}
