'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { getLocationData, getInsightsData } from '@/lib/admin/actions/live';
import type { LocationDataPoint, InsightData } from '@/lib/admin/actions/live';
import { BrazilMap } from './brazil-map';
import { InsightsPanel } from './insights-panel';

interface Props {
  initialLocationData: LocationDataPoint[];
  initialInsights: InsightData;
}

export function GloboDashboard({ initialLocationData, initialInsights }: Props) {
  const [locationData, setLocationData] = useState<LocationDataPoint[]>(initialLocationData);
  const [insights, setInsights] = useState<InsightData>(initialInsights);
  const [mapLoading, setMapLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const refreshAll = useCallback(async (from?: string, to?: string) => {
    setMapLoading(true);
    setInsightsLoading(true);
    try {
      const [loc, ins] = await Promise.all([
        getLocationData(from, to),
        getInsightsData(),
      ]);
      setLocationData(loc);
      setInsights(ins);
    } catch (e) {
      console.debug('Globo refresh error:', e);
    } finally {
      setMapLoading(false);
      setInsightsLoading(false);
    }
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => refreshAll(dateFrom || undefined, dateTo || undefined), 30000);
    return () => clearInterval(interval);
  }, [refreshAll, dateFrom, dateTo]);

  const handleFilter = () => {
    if (dateFrom || dateTo) {
      refreshAll(dateFrom || undefined, dateTo || undefined);
    }
  };

  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
    refreshAll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="h-6 w-6 text-cyan-400" />
            Globo
          </h1>
          <p className="text-sm text-zinc-500">Mapa de acessos e insights em tempo real</p>
        </div>
        <button
          onClick={() => refreshAll(dateFrom || undefined, dateTo || undefined)}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${mapLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-end gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          onClick={handleFilter}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Filtrar
        </button>
        {(dateFrom || dateTo) && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded-lg transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Map */}
      <BrazilMap data={locationData} loading={mapLoading} />

      {/* Insights */}
      <InsightsPanel data={insights} loading={insightsLoading} />
    </div>
  );
}
