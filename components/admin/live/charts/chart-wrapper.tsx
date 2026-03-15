'use client';

import { ResponsiveContainer } from 'recharts';

interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

export function ChartWrapper({ title, children, height = 280 }: ChartWrapperProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 md:p-6">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
