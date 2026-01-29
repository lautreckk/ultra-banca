import { NextResponse } from 'next/server';
import { getPlatformConfig } from '@/lib/admin/actions/platform-config';

export async function GET() {
  const config = await getPlatformConfig();

  const manifest = {
    name: config.site_name,
    short_name: config.site_name,
    description: config.site_description,
    start_url: '/',
    display: 'standalone',
    background_color: config.color_background || '#000000',
    theme_color: config.color_primary || '#D4A84B',
    orientation: 'portrait',
    icons: [
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
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
