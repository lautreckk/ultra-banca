'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartWrapper } from './chart-wrapper';
import { CHART_THEME } from './chart-theme';
import type { HourlyMetric } from '@/lib/admin/actions/live';

interface Props {
  data: HourlyMetric[];
}

export function HourlyUsersChart({ data }: Props) {
  return (
    <ChartWrapper title="Usuários Online por Hora">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_THEME.colors.users} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_THEME.colors.users} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...CHART_THEME.grid} />
        <XAxis dataKey="hour_label" tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <YAxis tick={CHART_THEME.axis} axisLine={false} tickLine={false} />
        <Tooltip {...CHART_THEME.tooltip} />
        <Area
          type="monotone"
          dataKey="users_online_peak"
          name="Usuários Online"
          stroke={CHART_THEME.colors.users}
          fill="url(#colorUsers)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartWrapper>
  );
}
