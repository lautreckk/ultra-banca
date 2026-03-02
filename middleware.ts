import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { rateLimit } from '@/lib/rate-limit';

/**
 * MIDDLEWARE DE SEGREGAÇÃO DE CONTEXTOS + RATE LIMITING
 *
 * 1. Rate limiting por IP para proteção contra abuso
 * 2. Segregação Admin vs Banca (via updateSession)
 */

// ============================================================================
// RATE LIMITING - CONFIGURAÇÃO POR TIPO DE ROTA
// ============================================================================

// Rotas de autenticação: mais restritivas (brute-force / spam de cadastro)
const AUTH_ROUTES = ['/login', '/cadastro', '/admin/login', '/admin-master/login', '/promotor/login'];
const AUTH_LIMIT = 15; // requests
const AUTH_WINDOW = 60_000; // 1 minuto

// API routes: proteção contra flood
const API_LIMIT = 30;
const API_WINDOW = 60_000;

// Global: proteção DDoS geral
const GLOBAL_LIMIT = 100;
const GLOBAL_WINDOW = 60_000;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((r) => pathname === r || pathname === r + '/');
}

function rateLimitResponse(resetIn: number): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: 'Muitas tentativas. Tente novamente em breve.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(resetIn / 1000)),
      },
    }
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request);

  // 1. Rate limit em rotas de autenticação (mais restritivo)
  if (isAuthRoute(pathname)) {
    const result = rateLimit(`auth:${ip}`, AUTH_LIMIT, AUTH_WINDOW);
    if (!result.allowed) {
      return rateLimitResponse(result.resetIn);
    }
  }

  // 2. Rate limit em API routes
  if (pathname.startsWith('/api/')) {
    const result = rateLimit(`api:${ip}`, API_LIMIT, API_WINDOW);
    if (!result.allowed) {
      return rateLimitResponse(result.resetIn);
    }
  }

  // 3. Rate limit global
  const globalResult = rateLimit(`global:${ip}`, GLOBAL_LIMIT, GLOBAL_WINDOW);
  if (!globalResult.allowed) {
    return rateLimitResponse(globalResult.resetIn);
  }

  // 4. Segregação de contextos + auth (middleware existente)
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Arquivos estáticos (images, fonts, etc)
     * - API routes de webhook (processados separadamente)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
