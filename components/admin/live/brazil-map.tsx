'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, Users } from 'lucide-react';
import type { LocationDataPoint } from '@/lib/admin/actions/live';

// Mercator projection centered on South America
function project(lat: number, lng: number, width: number, height: number): [number, number] {
  const minLat = -36, maxLat = 8, minLng = -76, maxLng = -32;
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

// Brazilian state labels with approximate center coordinates
const STATE_LABELS = [
  { uf: 'AM', lat: -3.5, lng: -64.5 }, { uf: 'PA', lat: -4.5, lng: -52 },
  { uf: 'MT', lat: -13, lng: -56 }, { uf: 'GO', lat: -15.5, lng: -49.5 },
  { uf: 'MG', lat: -18.5, lng: -44 }, { uf: 'SP', lat: -22.5, lng: -49 },
  { uf: 'RJ', lat: -22.5, lng: -43 }, { uf: 'BA', lat: -12.5, lng: -41.5 },
  { uf: 'MA', lat: -5, lng: -45 }, { uf: 'CE', lat: -5, lng: -39 },
  { uf: 'PE', lat: -8.5, lng: -37.5 }, { uf: 'PI', lat: -7, lng: -42.5 },
  { uf: 'PR', lat: -25, lng: -51.5 }, { uf: 'SC', lat: -27.5, lng: -50.5 },
  { uf: 'RS', lat: -29.5, lng: -53 }, { uf: 'MS', lat: -20.5, lng: -55 },
  { uf: 'TO', lat: -10, lng: -48.5 }, { uf: 'RO', lat: -11, lng: -63 },
  { uf: 'AC', lat: -9, lng: -70 }, { uf: 'RR', lat: 2, lng: -61 },
  { uf: 'AP', lat: 1.5, lng: -51.5 }, { uf: 'AL', lat: -9.5, lng: -36.5 },
  { uf: 'SE', lat: -10.5, lng: -37.5 }, { uf: 'RN', lat: -5.8, lng: -36.5 },
  { uf: 'PB', lat: -7, lng: -36.5 }, { uf: 'ES', lat: -19.5, lng: -40.5 },
  { uf: 'DF', lat: -15.8, lng: -47.8 },
];

// Country labels around Brazil
const COUNTRY_LABELS = [
  { name: 'Venezuela', lat: 7, lng: -66 },
  { name: 'Colômbia', lat: 4, lng: -72 },
  { name: 'Peru', lat: -10, lng: -75 },
  { name: 'Bolívia', lat: -17, lng: -65 },
  { name: 'Paraguai', lat: -23, lng: -58 },
  { name: 'Argentina', lat: -34, lng: -64 },
  { name: 'Uruguai', lat: -33, lng: -56 },
  { name: 'Guiana', lat: 5, lng: -59 },
  { name: 'Suriname', lat: 4, lng: -56 },
  { name: 'Equador', lat: -1, lng: -75 },
  { name: 'Chile', lat: -30, lng: -71 },
];

interface Props {
  data: LocationDataPoint[];
  loading?: boolean;
}

export function BrazilMap({ data, loading }: Props) {
  const [tooltip, setTooltip] = useState<{ city: string; count: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [pulseKey, setPulseKey] = useState(0);

  // Re-trigger pulse animation when data changes
  useEffect(() => {
    setPulseKey(k => k + 1);
  }, [data]);

  const W = 700, H = 620;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const totalVisitors = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0f1923' }}>
      {/* Header bar like Shopify Live View */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Live View</h2>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Agora mesmo</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <span className="text-xs text-zinc-400">Visitantes agora</span>
          </div>
          {loading && <span className="text-xs text-zinc-500 animate-pulse">atualizando...</span>}
        </div>
      </div>

      {/* Visitor count bar */}
      <div className="flex items-center gap-6 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Visitantes agora</p>
          <p className="text-2xl font-bold text-white">{totalVisitors}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Cidades</p>
          <p className="text-2xl font-bold text-white">{data.length}</p>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          style={{ minHeight: 450, maxHeight: 600 }}
        >
          <defs>
            <radialGradient id="pointGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            {/* Pulse animation */}
            <style>{`
              @keyframes mapPulse {
                0% { r: 4; opacity: 0.9; }
                50% { r: 12; opacity: 0.3; }
                100% { r: 20; opacity: 0; }
              }
              .map-pulse {
                animation: mapPulse 2s ease-out infinite;
              }
              .map-pulse-delay {
                animation: mapPulse 2s ease-out infinite;
                animation-delay: 0.5s;
              }
            `}</style>
          </defs>

          {/* Background */}
          <rect width={W} height={H} fill="#0f1923" />

          {/* Grid */}
          {Array.from({ length: 15 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * (H / 14)} x2={W} y2={i * (H / 14)} stroke="#1a2634" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 15 }, (_, i) => (
            <line key={`v${i}`} x1={i * (W / 14)} y1={0} x2={i * (W / 14)} y2={H} stroke="#1a2634" strokeWidth={0.5} />
          ))}

          {/* Country labels */}
          {COUNTRY_LABELS.map((c) => {
            const [x, y] = project(c.lat, c.lng, W, H);
            return (
              <text key={c.name} x={x} y={y} textAnchor="middle" fill="#334155" fontSize={10} fontWeight={500}>
                {c.name}
              </text>
            );
          })}

          {/* "Brasil" label large */}
          {(() => {
            const [bx, by] = project(-14, -51, W, H);
            return (
              <text x={bx} y={by} textAnchor="middle" fill="#1e3a50" fontSize={28} fontWeight={800} letterSpacing={8}>
                Brasil
              </text>
            );
          })()}

          {/* State labels */}
          {STATE_LABELS.map((s) => {
            const [x, y] = project(s.lat, s.lng, W, H);
            return (
              <text key={s.uf} x={x} y={y} textAnchor="middle" fill="#2d4a5e" fontSize={11} fontWeight={700}>
                {s.uf}
              </text>
            );
          })}

          {/* Data points with pulse animation */}
          {data.map((point, i) => {
            const [x, y] = project(point.lat, point.lng, W, H);
            const size = Math.max(4, Math.sqrt(point.count / maxCount) * 16);
            return (
              <g
                key={`${point.city}-${i}-${pulseKey}`}
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      city: `${point.city}${point.region ? ', ' + point.region : ''}`,
                      count: point.count,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulsing ring */}
                <circle cx={x} cy={y} r={size} fill="none" stroke="#06b6d4" strokeWidth={1.5} className="map-pulse" />
                <circle cx={x} cy={y} r={size} fill="none" stroke="#06b6d4" strokeWidth={1} className="map-pulse-delay" />
                {/* Glow */}
                <circle cx={x} cy={y} r={size * 2.5} fill="url(#pointGlow)" />
                {/* Solid dot */}
                <circle cx={x} cy={y} r={Math.max(3, size * 0.5)} fill="#06b6d4" fillOpacity={0.9} />
                {/* City label */}
                {point.count >= 2 && (
                  <text x={x} y={y - size - 6} textAnchor="middle" fill="#7dd3fc" fontSize={9} fontWeight={600}>
                    {point.city}: {point.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-50 pointer-events-none bg-zinc-900/95 border border-cyan-500/40 rounded-lg px-4 py-2.5 shadow-xl backdrop-blur-sm"
            style={{ left: tooltip.x + 14, top: tooltip.y - 12, transform: 'translateY(-100%)' }}
          >
            <p className="text-white text-sm font-semibold">{tooltip.city}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Users className="h-3 w-3 text-cyan-400" />
              <p className="text-cyan-400 text-xs font-bold">{tooltip.count} usuário{tooltip.count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
