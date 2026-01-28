import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * SEGREGAÇÃO ESTRITA DE CONTEXTOS
 *
 * Este middleware trata Admin e Banca como dois aplicativos completamente separados.
 * Um admin NUNCA pode ver a área de apostas e um usuário comum NUNCA pode ver o admin.
 *
 * Contexto ADMIN: /admin/*
 * Contexto BANCA: Tudo que não é /admin/*
 */

// ============================================================================
// DEFINIÇÃO DE ROTAS
// ============================================================================

// Rotas do contexto ADMIN
const ADMIN_PREFIX = '/admin';
const ADMIN_AUTH_ROUTES = ['/admin/login'];

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = [
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/api',
  '/webhook',
];

// Rotas protegidas da BANCA (requerem autenticação de usuário comum)
const BANCA_PROTECTED_ROUTES = [
  '/',
  '/loterias',
  '/fazendinha',
  '/lotinha',
  '/quininha',
  '/seninha',
  '/resultados',
  '/premiadas',
  '/relatorios',
  '/recarga-pix',
  '/saques',
  '/apostas',
  '/amigos',
  '/promotor',
  '/perfil',
];

// ============================================================================
// HELPERS
// ============================================================================

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith(ADMIN_PREFIX);
}

function isAdminAuthRoute(pathname: string): boolean {
  return ADMIN_AUTH_ROUTES.includes(pathname);
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
}

function isBancaProtectedRoute(pathname: string): boolean {
  return BANCA_PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );
}

function isBancaAuthRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/cadastro';
}

function redirect(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: Não adicione código entre createServerClient e getUser()
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ============================================================================
  // CENÁRIO A: USUÁRIO NÃO ESTÁ LOGADO
  // ============================================================================
  if (!user) {
    // A1: Tentando acessar área admin -> Redirecionar para /admin/login
    if (isAdminRoute(pathname) && !isAdminAuthRoute(pathname)) {
      return redirect(request, '/admin/login');
    }

    // A2: Tentando acessar rotas protegidas da Banca -> Redirecionar para /login
    if (isBancaProtectedRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      // Preservar código de convite
      const inviteCode = request.nextUrl.searchParams.get('p');
      if (inviteCode) {
        url.searchParams.set('p', inviteCode);
      }
      return NextResponse.redirect(url);
    }

    // A3: Rotas públicas ou auth -> Permitir
    return supabaseResponse;
  }

  // ============================================================================
  // CENÁRIO B: USUÁRIO ESTÁ LOGADO
  // Verificar se é ADMIN ou USUÁRIO COMUM
  // ============================================================================

  // Query performática: apenas verifica existência (não precisa de todos os dados)
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = !!adminRole;

  // ============================================================================
  // CENÁRIO B1: É ADMIN
  // ============================================================================
  if (isAdmin) {
    // Verificar MFA se necessário
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const mfaPending = aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1';
    const mfaComplete = aalData?.currentLevel === 'aal2' || aalData?.nextLevel === 'aal1';

    // B1.1: Admin tentando acessar área da BANCA -> PROIBIDO, redirecionar para dashboard
    if (!isAdminRoute(pathname)) {
      // Se MFA está pendente, redirecionar para login para completar
      if (mfaPending) {
        return redirect(request, '/admin/login');
      }
      // Admin não pode ver a banca, forçar para dashboard
      return redirect(request, '/admin/dashboard');
    }

    // B1.2: Admin na página de login do admin
    if (isAdminAuthRoute(pathname)) {
      // Se MFA completo ou não requerido, redirecionar para dashboard
      if (mfaComplete) {
        return redirect(request, '/admin/dashboard');
      }
      // MFA pendente: permitir ficar na página de login para completar verificação
      return supabaseResponse;
    }

    // B1.3: Admin em rota admin protegida, verificar MFA
    if (mfaPending) {
      return redirect(request, '/admin/login');
    }

    // B1.4: Admin em área admin com MFA ok -> Permitir
    return supabaseResponse;
  }

  // ============================================================================
  // CENÁRIO B2: É USUÁRIO COMUM (NÃO é admin)
  // ============================================================================

  // B2.1: Usuário comum tentando acessar área ADMIN -> PROIBIDO
  if (isAdminRoute(pathname)) {
    // Redirecionar para home da banca (ou poderia ser 403/404)
    return redirect(request, '/');
  }

  // B2.2: Usuário comum já logado tentando acessar login/cadastro -> Redirecionar para home
  if (isBancaAuthRoute(pathname)) {
    return redirect(request, '/');
  }

  // B2.3: Usuário comum em área da banca -> Permitir
  return supabaseResponse;
}
