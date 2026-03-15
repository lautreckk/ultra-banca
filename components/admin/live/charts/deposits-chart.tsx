'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartWrapper } from './chart-wrapper';
import { CHART_THEME } from './chart-theme';
import type { HourlyMetric } from '@/lib/admin/actions/live';

interface Props {
  data: HourlyMetric[];
}

export function DepositsChart({ data }: Props) {
  return (
    <ChartWrapper title="Depósitos por Hora">
      <BarChart data={data}>
        <CartesianGrid {...CHART_THEME.grid} />
        <XAxis dataKey="hour_label" tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <YAxis tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <Tooltip {...CHART_THEME.tooltip} />
        <Bar
          dataKey="deposits_count"
          name="Depósitos"
          fill={CHART_THEME.colors.deposits}
          radius={[4, 4, 0, 0]}
          opacity={0.8}
        />
      </BarChart>
    </ChartWrapper>
  );
}
