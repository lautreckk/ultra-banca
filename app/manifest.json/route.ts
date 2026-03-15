import { NextResponse } from 'next/server';
import { getPlatformConfig } from '@/lib/admin/actions/platform-config';

export async function GET() {
  const config = await getPlatformConfig();

  // Use platform favicon/logo for PWA icons, fallback to static SVGs
  const iconUrl = config.favicon_url || config.logo_url;
  const icons = iconUrl
    ? [
        {
          src: iconUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: iconUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ]
    : [
        {
          src: '/icons/icon-192x192.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: '/icons/icon-512x512.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ];

  const manifest = {
    name: config.site_name,
    short_name: config.site_name,
    description: config.site_description,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: config.color_background || '#000000',
    theme_color: config.color_primary || '#D4A84B',
    orientation: 'portrait',
    gcm_sender_id: '103953800507',
    prefer_related_applications: false,
    categories: ['games', 'entertainment'],
    icons,
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
