import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * MIDDLEWARE DE SEGREGAÇÃO DE CONTEXTOS
 *
 * Este middleware implementa um "muro" entre os contextos Admin e Banca:
 * - Admins NUNCA podem acessar a área de apostas
 * - Usuários comuns NUNCA podem acessar o painel admin
 *
 * A sessão é compartilhada (mesmo cookie), mas os contextos são isolados.
 */
export async function middleware(request: NextRequest) {
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
