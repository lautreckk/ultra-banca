'use client';

import { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { MapPin } from 'lucide-react';
import type { LocationDataPoint } from '@/lib/admin/actions/live';

const BRAZIL_TOPO = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

interface Props {
  data: LocationDataPoint[];
  loading?: boolean;
}

export function BrazilMap({ data, loading }: Props) {
  const [tooltip, setTooltip] = useState<{
    city: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 relative">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Mapa de Acessos</h3>
        {loading && (
          <span className="text-xs text-zinc-500 animate-pulse">atualizando...</span>
        )}
      </div>

      {data.length === 0 && !loading ? (
        <div className="flex items-center justify-center h-[360px] text-zinc-500 text-sm">
          Nenhum dado de localização disponível
        </div>
      ) : (
        <div className="relative" style={{ height: 360 }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 600,
              center: [-54, -15],
            }}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomableGroup>
              <Geographies geography={BRAZIL_TOPO}>
                {({ geographies }) =>
                  geographies
                    .filter((geo) => geo.properties.name === 'Brazil')
                    .map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#1e293b"
                        stroke="#334155"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: '#1e293b' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    ))
                }
              </Geographies>

              {data.map((point, i) => {
                const size = Math.max(4, Math.sqrt(point.count / maxCount) * 18);
                return (
                  <Marker
                    key={`${point.city}-${i}`}
                    coordinates={[point.lng, point.lat]}
                    onMouseEnter={(e) => {
                      const rect = (e.target as SVGElement)
                        .closest('svg')
                        ?.getBoundingClientRect();
                      if (rect) {
                        setTooltip({
                          city: point.city,
                          count: point.count,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <circle
                      r={size}
                      fill="#06b6d4"
                      fillOpacity={0.6}
                      stroke="#06b6d4"
                      strokeWidth={1}
                      strokeOpacity={0.8}
                      style={{ cursor: 'pointer' }}
                    />
                    <circle
                      r={size * 0.4}
                      fill="#06b6d4"
                      fillOpacity={1}
                    />
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          {tooltip && (
            <div
              className="absolute z-50 pointer-events-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg"
              style={{
                left: tooltip.x + 12,
                top: tooltip.y - 10,
                transform: 'translateY(-100%)',
              }}
            >
              <p className="text-white text-sm font-medium">{tooltip.city}</p>
              <p className="text-cyan-400 text-xs">{tooltip.count} usuário{tooltip.count !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
