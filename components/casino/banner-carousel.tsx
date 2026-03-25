'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Banner {
  id: string;
  titulo: string;
  imagem_url: string;
  link_url: string | null;
}

// Gradient fallback banners when no image is set
const FALLBACK_STYLES = [
  { bg: 'linear-gradient(135deg, #1B2440 0%, #2D1B4E 50%, #0C0E14 100%)', accent: '#FFD700' },
  { bg: 'linear-gradient(135deg, #0C2E1E 0%, #1B4332 50%, #0C0E14 100%)', accent: '#22C55E' },
  { bg: 'linear-gradient(135deg, #2E1B0C 0%, #4A2C0C 50%, #0C0E14 100%)', accent: '#F59E0B' },
];

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[current];
  const fallback = FALLBACK_STYLES[current % FALLBACK_STYLES.length];
  const hasImage = banner.imagem_url && banner.imagem_url.length > 0;

  const content = (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ minHeight: '160px' }}
    >
      {hasImage ? (
        <img
          src={banner.imagem_url}
          alt={banner.titulo}
          className="w-full h-auto object-cover rounded-2xl"
          style={{ minHeight: '160px', maxHeight: '280px' }}
        />
      ) : (
        /* Gradient fallback with text */
        <div
          className="w-full flex items-center justify-between px-6 md:px-10 py-8 md:py-12 rounded-2xl"
          style={{ background: fallback.bg, minHeight: '160px' }}
        >
          <div className="flex-1">
            <p className="text-2xl md:text-3xl font-black text-white leading-tight">
              {banner.titulo}
            </p>
            <div
              className="mt-3 inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold text-black"
              style={{ backgroundColor: fallback.accent }}
            >
              Saiba mais →
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
            <div className="h-32 w-32 rounded-full" style={{ backgroundColor: fallback.accent }} />
          </div>
          <div className="absolute right-16 bottom-2 opacity-5">
            <div className="h-20 w-20 rounded-full" style={{ backgroundColor: fallback.accent }} />
          </div>
        </div>
      )}

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
              className="rounded-full transition-all"
              style={{
                width: i === current ? '24px' : '6px',
                height: '6px',
                backgroundColor: i === current ? '#FFD700' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (banner.link_url) {
    return <Link href={banner.link_url} className="block">{content}</Link>;
  }

  return content;
}
