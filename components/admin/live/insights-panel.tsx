'use client';

import { Gamepad2, Clock, MapPin, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';
import type { InsightData } from '@/lib/admin/actions/live';

interface Props {
  data: InsightData;
  loading?: boolean;
}

function InsightCard({
  icon: Icon,
  label,
  value,
  subValue,
  accentColor,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  accentColor: string;
  loading?: boolean;
}) {
  const colorMap: Record<string, string> = {
    purple: 'text-purple-400 bg-purple-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    cyan: 'text-cyan-400 bg-cyan-400/10',
    green: 'text-emerald-400 bg-emerald-400/10',
  };
  const colors = colorMap[accentColor] || colorMap.blue;
  const [textColor, bgColor] = colors.split(' ');

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4">
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-700" />
          <div className="h-3 w-20 rounded bg-zinc-700" />
          <div className="h-5 w-16 rounded bg-zinc-700" />
        </div>
      ) : (
        <>
          <div className={`inline-flex p-2 rounded-lg ${bgColor} mb-2`}>
            <Icon className={`h-4 w-4 ${textColor}`} />
          </div>
          <p className="text-xs text-zinc-500 mb-1">{label}</p>
          <p className={`text-lg font-bold ${textColor}`}>{value}</p>
          {subValue && (
            <p className="text-xs text-zinc-500 mt-0.5">{subValue}</p>
          )}
        </>
      )}
    </div>
  );
}

export function InsightsPanel({ data, loading }: Props) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex p-1.5 rounded-lg bg-amber-400/10">
          <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white">Insights do Dia</h3>
        {loading && (
          <span className="text-xs text-zinc-500 animate-pulse">atualizando...</span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InsightCard
          icon={Gamepad2}
          label="Modalidade Top"
          value={data.topModalidade?.name || '-'}
          subValue={
            data.topModalidade
              ? `${data.topModalidade.count} apostas (${data.topModalidade.percentage.toFixed(0)}%)`
              : undefined
          }
          accentColor="purple"
          loading={loading}
        />

        <InsightCard
          icon={Clock}
          label="Horário Pico"
          value={data.peakHour?.hour || '-'}
          subValue={
            data.peakHour
              ? `${data.peakHour.count} apostas`
              : undefined
          }
          accentColor="blue"
          loading={loading}
        />

        <InsightCard
          icon={MapPin}
          label="Cidade Top"
          value={data.topCity?.name || '-'}
          subValue={
            data.topCity
              ? `${data.topCity.count} usuários`
              : undefined
          }
          accentColor="cyan"
          loading={loading}
        />

        <InsightCard
          icon={DollarSign}
          label="Aposta Média"
          value={data.avgBetValue > 0 ? formatCurrency(data.avgBetValue) : '-'}
          subValue={
            data.totalBetsToday > 0
              ? `${data.totalBetsToday} apostas hoje`
              : undefined
          }
          accentColor="green"
          loading={loading}
        />
      </div>
    </div>
  );
}
