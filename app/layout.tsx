import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { ConfigProvider, defaultConfig } from '@/contexts/platform-config-context';
import { ThemeInjector } from '@/components/theme-injector';
import { getPlatformConfig } from '@/lib/admin/actions/platform-config';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPlatformConfig();

  return {
    title: config.site_name,
    description: config.site_description,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: config.site_name,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: config.favicon_url,
      apple: '/icons/icon-192x192.png',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getPlatformConfig();

  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Facebook Pixel */}
        {config.facebook_pixel_id && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${config.facebook_pixel_id}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
        {/* Google Analytics */}
        {config.google_analytics_id && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${config.google_analytics_id}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${config.google_analytics_id}');
                `,
              }}
            />
          </>
        )}
        {/* Custom Head Scripts */}
        {config.custom_head_scripts && (
          <script
            dangerouslySetInnerHTML={{ __html: config.custom_head_scripts }}
          />
        )}
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ConfigProvider config={config}>
          <ThemeInjector />
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
