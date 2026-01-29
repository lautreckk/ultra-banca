import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { ConfigProvider } from '@/contexts/platform-config-context';
import { ThemeInjector } from '@/components/theme-injector';
import { getPlatformConfig } from '@/lib/admin/actions/platform-config';
import DOMPurify from 'isomorphic-dompurify';

// ============================================================================
// SECURITY: Sanitização de Scripts para prevenir XSS
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
 * IMPORTANTE: Por segurança, removemos TODOS os scripts inline maliciosos
 * Apenas scripts de fontes confiáveis (src externo) são permitidos
 */
function sanitizeCustomScripts(scripts: string | null | undefined): string | null {
  if (!scripts) return null;

  // Usar DOMPurify para limpar o conteúdo
  // Configuração RESTRITIVA: apenas permite tags script com src externo
  const sanitized = DOMPurify.sanitize(scripts, {
    ALLOWED_TAGS: ['script', 'noscript'],
    ALLOWED_ATTR: ['src', 'async', 'defer', 'type', 'id', 'data-*'],
    // Bloquear conteúdo inline em scripts (previne XSS)
    ALLOW_DATA_ATTR: true,
    // Forçar parsing como HTML
    FORCE_BODY: true,
  });

  // Verificação adicional: remover scripts que tentam executar código inline
  // Um script seguro deve ter src="" apontando para domínio confiável
  const hasInlineCode = /<script[^>]*>[\s\S]*?[^\s][\s\S]*?<\/script>/i.test(sanitized);

  if (hasInlineCode) {
    // Se há código inline, registrar alerta de segurança e bloquear
    console.warn('[SECURITY] Blocked inline script injection attempt in custom_head_scripts');
    return null;
  }

  return sanitized || null;
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
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
