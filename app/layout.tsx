import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { ConfigProvider } from '@/contexts/platform-config-context';
import { ThemeInjector } from '@/components/theme-injector';
import { getPlatformConfig } from '@/lib/admin/actions/platform-config';
import { PaymentWatcherProvider } from '@/components/shared/payment-watcher-provider';

// Força renderização dinâmica - não cacheia o layout
export const dynamic = 'force-dynamic';

// ============================================================================
// SECURITY: Sanitização de Scripts para prevenir XSS
// Implementação sem dependências externas para compatibilidade com Vercel Edge
// ============================================================================

/**
 * Valida que um ID de tracking contém apenas caracteres seguros
 * Previne injeção de código via IDs malformados
 */
function sanitizeTrackingId(id: string | null | undefined): string | null {
  if (!id) return null;
  // Apenas letras, números, hífens e underscores são permitidos
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '');
  // Verificar se o ID parece válido (não vazio após sanitização)
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Sanitiza scripts customizados do admin
 * IMPORTANTE: Por segurança, apenas permite tags <script src="..."> externas
 * Scripts inline são BLOQUEADOS para prevenir XSS
 *
 * Regras de segurança:
 * 1. Apenas tags <script> com atributo src são permitidas
 * 2. O src deve apontar para domínios HTTPS confiáveis
 * 3. Qualquer conteúdo entre <script> e </script> é bloqueado
 * 4. Atributos perigosos (onerror, onload, etc) são removidos
 */
function sanitizeCustomScripts(scripts: string | null | undefined): string | null {
  if (!scripts) return null;

  // Lista de domínios confiáveis para scripts externos
  const trustedDomains = [
    'googletagmanager.com',
    'google-analytics.com',
    'connect.facebook.net',
    'static.hotjar.com',
    'js.hs-scripts.com',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'unpkg.com',
  ];

  // Regex para encontrar tags script
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  const sanitizedScripts: string[] = [];

  let match;
  while ((match = scriptRegex.exec(scripts)) !== null) {
    const attributes = match[1];
    const content = match[2].trim();

    // BLOQUEAR: Scripts com conteúdo inline
    if (content.length > 0) {
      console.warn('[SECURITY] Blocked inline script in custom_head_scripts');
      continue;
    }

    // Extrair o atributo src
    const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) {
      console.warn('[SECURITY] Blocked script without src attribute');
      continue;
    }

    const src = srcMatch[1];

    // Validar que é HTTPS
    if (!src.startsWith('https://')) {
      console.warn('[SECURITY] Blocked non-HTTPS script:', src);
      continue;
    }

    // Validar domínio confiável
    const url = new URL(src);
    const isTrusted = trustedDomains.some(domain =>
      url.hostname === domain || url.hostname.endsWith('.' + domain)
    );

    if (!isTrusted) {
      console.warn('[SECURITY] Blocked script from untrusted domain:', url.hostname);
      continue;
    }

    // Remover atributos perigosos e manter apenas os seguros
    const safeAttrs: string[] = [];

    // Extrair atributos seguros
    const asyncMatch = attributes.match(/\basync\b/i);
    const deferMatch = attributes.match(/\bdefer\b/i);
    const typeMatch = attributes.match(/type\s*=\s*["']([^"']+)["']/i);
    const idMatch = attributes.match(/id\s*=\s*["']([^"']+)["']/i);

    safeAttrs.push(`src="${src}"`);
    if (asyncMatch) safeAttrs.push('async');
    if (deferMatch) safeAttrs.push('defer');
    if (typeMatch && /^(text\/javascript|module)$/.test(typeMatch[1])) {
      safeAttrs.push(`type="${typeMatch[1]}"`);
    }
    if (idMatch && /^[a-zA-Z0-9_-]+$/.test(idMatch[1])) {
      safeAttrs.push(`id="${idMatch[1]}"`);
    }

    sanitizedScripts.push(`<script ${safeAttrs.join(' ')}></script>`);
  }

  return sanitizedScripts.length > 0 ? sanitizedScripts.join('\n') : null;
}

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

  // ============================================================================
  // SECURITY: Sanitizar todos os valores de tracking antes de usar
  // ============================================================================
  const safePixelId = sanitizeTrackingId(config.facebook_pixel_id);
  const safeAnalyticsId = sanitizeTrackingId(config.google_analytics_id);
  const safeCustomScripts = sanitizeCustomScripts(config.custom_head_scripts);

  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Facebook Pixel - ID sanitizado para prevenir XSS */}
        {safePixelId && (
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
                fbq('init', '${safePixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
        {/* Google Analytics - ID sanitizado para prevenir XSS */}
        {safeAnalyticsId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${safeAnalyticsId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${safeAnalyticsId}');
                `,
              }}
            />
          </>
        )}
        {/* Custom Head Scripts - SANITIZADO com DOMPurify */}
        {/* IMPORTANTE: Scripts inline são BLOQUEADOS por segurança */}
        {/* Apenas tags <script src="..."> de fontes externas são permitidas */}
        {safeCustomScripts && (
          <div dangerouslySetInnerHTML={{ __html: safeCustomScripts }} />
        )}
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ConfigProvider config={config}>
          <ThemeInjector />
          <PaymentWatcherProvider>
            {children}
          </PaymentWatcherProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
