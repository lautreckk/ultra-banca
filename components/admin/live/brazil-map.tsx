'use client';

import { useMemo } from 'react';
import { Globe } from '@/components/ui/cobe-globe';
import { Users, Globe as GlobeIcon } from 'lucide-react';
import type { LocationDataPoint } from '@/lib/admin/actions/live';

interface Props {
  data: LocationDataPoint[];
  loading?: boolean;
}

export function BrazilMap({ data, loading }: Props) {
  const totalVisitors = data.reduce((s, d) => s + d.count, 0);

  // Convert location data to cobe markers
  const markers = useMemo(() => {
    return data.map((point, i) => ({
      id: `loc-${i}`,
      location: [point.lat, point.lng] as [number, number],
      label: `${point.city}: ${point.count}`,
    }));
  }, [data]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0a0e1a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <GlobeIcon className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Live View</h2>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Agora mesmo</span>
          </div>
        </div>
        {loading && <span className="text-xs text-zinc-500 animate-pulse">atualizando...</span>}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-8 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-400" />
          <div>
            <p className="text-xs text-zinc-500">Visitantes</p>
            <p className="text-xl font-bold text-white">{totalVisitors}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Cidades</p>
          <p className="text-xl font-bold text-white">{data.length}</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
          <span className="text-xs text-zinc-400">Visitantes agora</span>
        </div>
      </div>

      {/* Globe */}
      <div className="flex items-center justify-center py-4 px-4" style={{ background: 'radial-gradient(circle at 50% 50%, #0f1a2e 0%, #0a0e1a 70%)' }}>
        <div className="w-full max-w-xl">
          <Globe
            markers={markers}
            markerColor={[0.1, 0.75, 0.85]}
            baseColor={[0.12, 0.16, 0.28]}
            glowColor={[0.05, 0.1, 0.2]}
            dark={1}
            mapBrightness={5}
            markerSize={0.045}
            markerElevation={0.015}
            speed={0.001}
            theta={0.35}
            phi={-0.8}
            diffuse={1.8}
            mapSamples={20000}
          />
        </div>
      </div>

      {/* City list */}
      {data.length > 0 && (
        <div className="px-5 pb-4 border-t border-white/5">
          <p className="text-xs text-zinc-500 py-3 uppercase tracking-wider font-semibold">Top Cidades</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {data.slice(0, 8).map((point, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.5)]" />
                <span className="text-xs text-zinc-300 truncate">{point.city}</span>
                <span className="text-xs text-cyan-400 font-bold ml-auto">{point.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
