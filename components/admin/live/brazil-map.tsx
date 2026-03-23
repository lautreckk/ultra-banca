'use client';

import { useState, useRef } from 'react';
import { MapPin } from 'lucide-react';
import type { LocationDataPoint } from '@/lib/admin/actions/live';

// Mercator projection for Brazil
function project(lat: number, lng: number, width: number, height: number): [number, number] {
  // Brazil bounds: lat -34 to 5, lng -74 to -35
  const minLat = -34, maxLat = 6, minLng = -75, maxLng = -34;
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const minLatRad = (minLat * Math.PI) / 180;
  const maxLatRad = (maxLat * Math.PI) / 180;
  const minMercN = Math.log(Math.tan(Math.PI / 4 + minLatRad / 2));
  const maxMercN = Math.log(Math.tan(Math.PI / 4 + maxLatRad / 2));
  const y = height - ((mercN - minMercN) / (maxMercN - minMercN)) * height;
  return [x, y];
}

interface Props {
  data: LocationDataPoint[];
  loading?: boolean;
}

export function BrazilMap({ data, loading }: Props) {
  const [tooltip, setTooltip] = useState<{ city: string; count: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 500, H = 480;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 relative">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Mapa de Acessos</h3>
        {data.length > 0 && (
          <span className="text-xs text-zinc-500">{data.reduce((s, d) => s + d.count, 0)} acessos</span>
        )}
        {loading && <span className="text-xs text-zinc-500 animate-pulse">atualizando...</span>}
      </div>

      {data.length === 0 && !loading ? (
        <div className="flex items-center justify-center h-[360px] text-zinc-500 text-sm">
          Nenhum dado de localização disponível
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg" style={{ background: '#0c1222' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto"
            style={{ maxHeight: 420 }}
          >
            {/* Grid lines for futuristic feel */}
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Subtle grid */}
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={i * (H / 10)} x2={W} y2={i * (H / 10)} stroke="#1e293b" strokeWidth={0.5} />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <line key={`v${i}`} x1={i * (W / 10)} y1={0} x2={i * (W / 10)} y2={H} stroke="#1e293b" strokeWidth={0.5} />
            ))}

            {/* Data points */}
            {data.map((point, i) => {
              const [x, y] = project(point.lat, point.lng, W, H);
              const size = Math.max(5, Math.sqrt(point.count / maxCount) * 22);
              return (
                <g
                  key={`${point.city}-${i}`}
                  onMouseEnter={(e) => {
                    const rect = svgRef.current?.getBoundingClientRect();
                    if (rect) {
                      setTooltip({ city: `${point.city}, ${point.region}`, count: point.count, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer glow */}
                  <circle cx={x} cy={y} r={size * 2} fill="url(#glow)" />
                  {/* Main circle */}
                  <circle cx={x} cy={y} r={size} fill="#06b6d4" fillOpacity={0.35} stroke="#06b6d4" strokeWidth={1} strokeOpacity={0.6} />
                  {/* Inner dot */}
                  <circle cx={x} cy={y} r={Math.max(2, size * 0.35)} fill="#06b6d4" fillOpacity={0.9} />
                  {/* Label for large points */}
                  {point.count >= 3 && (
                    <text x={x} y={y + size + 12} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight={600}>
                      {point.city}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-50 pointer-events-none bg-zinc-800/95 border border-cyan-500/30 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm"
              style={{ left: tooltip.x + 12, top: tooltip.y - 10, transform: 'translateY(-100%)' }}
            >
              <p className="text-white text-sm font-medium">{tooltip.city}</p>
              <p className="text-cyan-400 text-xs font-bold">{tooltip.count} usuário{tooltip.count !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
