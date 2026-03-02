import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com https://static.hotjar.com https://js.hs-scripts.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://cdn.utmify.com.br",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://api.playfivers.com https://api.qrserver.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.playfivers.com https://graph.facebook.com https://ipapi.co https://cdn.utmify.com.br https://www.google-analytics.com https://static.hotjar.com",
              "frame-src 'self' https://*.playfivers.com https://*.playfiver.com",
              "font-src 'self' https://fonts.gstatic.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
