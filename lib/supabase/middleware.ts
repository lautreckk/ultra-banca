import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * MIDDLEWARE MULTI-TENANT + SEGREGAÇÃO DE CONTEXTOS
 *
 * Este middleware:
 * 1. Resolve a plataforma pelo domínio da requisição
 * 2. Armazena platform_id em cookies para uso em server actions
 * 3. Trata Admin, Promotor e Banca como aplicativos separados
 *
 * Contexto ADMIN: /admin/*
 * Contexto PROMOTOR: /promotor/*
 * Contexto BANCA: Tudo que não é /admin/* nem /promotor/*
 */

// ID da plataforma padrão (Banca Pantanal)
const DEFAULT_PLATFORM_ID = 'ff61b7a2-1098-4bc4-99c5-5afb600fbc57';

// ============================================================================
// DEFINIÇÃO DE ROTAS
// ============================================================================

// Rotas do contexto ADMIN-MASTER (Super Admin)
const ADMIN_MASTER_PREFIX = '/admin-master';
const ADMIN_MASTER_AUTH_ROUTES = ['/admin-master/login'];

// Rotas do contexto ADMIN
const ADMIN_PREFIX = '/admin';
const ADMIN_AUTH_ROUTES = ['/admin/login'];

// Rotas do contexto PROMOTOR
const PROMOTOR_PREFIX = '/promotor';
const PROMOTOR_AUTH_ROUTES = ['/promotor/login'];

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = [
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/api',
  '/webhook',
  '/promotor/login',
  '/admin-master/login',
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

function isAdminMasterRoute(pathname: string): boolean {
  return pathname.startsWith(ADMIN_MASTER_PREFIX);
}

function isAdminMasterAuthRoute(pathname: string): boolean {
  // Normalizar pathname removendo trailing slash
  const normalizedPath = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;
  return ADMIN_MASTER_AUTH_ROUTES.includes(normalizedPath);
}

function isAdminRoute(pathname: string): boolean {
  // Excluir rotas admin-master da verificação de admin
  if (isAdminMasterRoute(pathname)) return false;
  return pathname.startsWith(ADMIN_PREFIX);
}

function isAdminAuthRoute(pathname: string): boolean {
  return ADMIN_AUTH_ROUTES.includes(pathname);
}

function isPromotorRoute(pathname: string): boolean {
  return pathname.startsWith(PROMOTOR_PREFIX);
}

function isPromotorAuthRoute(pathname: string): boolean {
  return PROMOTOR_AUTH_ROUTES.includes(pathname);
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
// MULTI-TENANT: RESOLUÇÃO DE PLATAFORMA
// ============================================================================

interface PlatformResult {
  platformId: string;
  platform: {
    id: string;
    domain: string;
    slug: string;
    name: string;
    ativo: boolean;
  };
}

/**
 * Resolve a plataforma pelo domínio da requisição.
 * Tenta primeiro pelo domínio completo, depois pelo slug (subdomínio).
 */
async function resolvePlatformByDomain(
  supabase: ReturnType<typeof createServerClient>,
  host: string
): Promise<PlatformResult | null> {
  // Remove porta se existir (localhost:3000)
  const domain = host.split(':')[0];

  // 1. Tentar pelo domínio completo
  const { data: platform } = await supabase
    .from('platforms')
    .select('id, domain, slug, name, ativo')
    .eq('domain', domain)
    .eq('ativo', true)
    .single();

  if (platform) {
    return { platformId: platform.id, platform };
  }

  // 2. Tentar pelo slug (primeiro segmento do domínio)
  // Ex: bancapantanal.vercel.app -> slug = bancapantanal
  const subdomain = domain.split('.')[0];
  const { data: platformBySlug } = await supabase
    .from('platforms')
    .select('id, domain, slug, name, ativo')
    .eq('slug', subdomain)
    .eq('ativo', true)
    .single();

  if (platformBySlug) {
    return { platformId: platformBySlug.id, platform: platformBySlug };
  }

  // 3. Fallback: retornar plataforma default para localhost/desenvolvimento
  if (domain === 'localhost' || domain === '127.0.0.1') {
    const { data: defaultPlatform } = await supabase
      .from('platforms')
      .select('id, domain, slug, name, ativo')
      .eq('id', DEFAULT_PLATFORM_ID)
      .single();

    if (defaultPlatform) {
      return { platformId: defaultPlatform.id, platform: defaultPlatform };
    }
  }

  return null;
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

  // ============================================================================
  // MULTI-TENANT: RESOLVER PLATAFORMA PELO DOMÍNIO
  // ============================================================================
  const host = request.headers.get('host') || 'localhost';
  const platformResult = await resolvePlatformByDomain(supabase, host);

  // Se não encontrou plataforma e não é localhost, poderia redirecionar para erro
  // Por enquanto, usamos fallback para default para não quebrar em desenvolvimento
  const platformId = platformResult?.platformId || DEFAULT_PLATFORM_ID;

  // Armazenar platform_id em cookie para acesso em server actions
  supabaseResponse.cookies.set('platform_id', platformId, {
    httpOnly: false, // Client precisa acessar para passar no signup
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 ano
  });

  // IMPORTANTE: Não adicione código entre createServerClient e getUser()
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ============================================================================
  // CENÁRIO A: USUÁRIO NÃO ESTÁ LOGADO
  // ============================================================================
  if (!user) {
    // A0: Tentando acessar área admin-master -> Redirecionar para /admin-master/login
    if (isAdminMasterRoute(pathname) && !isAdminMasterAuthRoute(pathname)) {
      return redirect(request, '/admin-master/login');
    }

    // A1: Tentando acessar área admin -> Redirecionar para /admin/login
    if (isAdminRoute(pathname) && !isAdminAuthRoute(pathname)) {
      return redirect(request, '/admin/login');
    }

    // A1.5: Tentando acessar área promotor -> Redirecionar para /promotor/login
    if (isPromotorRoute(pathname) && !isPromotorAuthRoute(pathname)) {
      return redirect(request, '/promotor/login');
    }

    // A2: Tentando acessar rotas protegidas da Banca -> Redirecionar para /login
    if (isBancaProtectedRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      // Preservar código de convite (tanto ?p= quanto ?ref=)
      const inviteCode = request.nextUrl.searchParams.get('p') || request.nextUrl.searchParams.get('ref');
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
  // Verificar se é ADMIN, PROMOTOR ou USUÁRIO COMUM
  // ============================================================================

  // Queries performáticas: apenas verificam existência
  const [adminRoleResult, promotorRoleResult, profileResult] = await Promise.all([
    supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('promotor_roles')
      .select('promotor_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('platform_id')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  const isAdmin = !!adminRoleResult.data;
  const isSuperAdmin = adminRoleResult.data?.role === 'super_admin';
  const isPromotor = !!promotorRoleResult.data;
  const userPlatformId = profileResult.data?.platform_id;

  // ============================================================================
  // VERIFICAÇÃO DE PERTENCIMENTO À PLATAFORMA (Multi-Tenant)
  // ============================================================================
  // Admins podem administrar múltiplas plataformas, então não verificamos aqui.
  // Para usuários comuns e promotores, verificamos se pertencem à plataforma atual.
  if (!isAdmin && userPlatformId && userPlatformId !== platformId) {
    // Usuário não pertence a esta plataforma
    // Fazer logout e redirecionar para login
    await supabase.auth.signOut();

    if (isPromotorRoute(pathname)) {
      return redirect(request, '/promotor/login');
    }
    return redirect(request, '/login');
  }

  // ============================================================================
  // CENÁRIO B0: ROTAS ADMIN-MASTER (requer super_admin)
  // ============================================================================
  if (isAdminMasterRoute(pathname)) {
    // Apenas super_admin pode acessar admin-master
    if (!isSuperAdmin) {
      // Se é admin mas não super_admin, redirecionar para dashboard normal
      if (isAdmin) {
        return redirect(request, '/admin/dashboard');
      }
      // Se não é admin, redirecionar para home
      return redirect(request, '/');
    }

    // Super admin na página de login do admin-master
    if (isAdminMasterAuthRoute(pathname)) {
      return redirect(request, '/admin-master/dashboard');
    }

    // Super admin em área admin-master protegida -> Permitir
    return supabaseResponse;
  }

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
  // CENÁRIO B2: É PROMOTOR
  // ============================================================================
  if (isPromotor) {
    // B2.1: Promotor tentando acessar área ADMIN -> PROIBIDO
    if (isAdminRoute(pathname)) {
      return redirect(request, '/promotor');
    }

    // B2.2: Promotor na página de login do promotor -> Redirecionar para dashboard
    if (isPromotorAuthRoute(pathname)) {
      return redirect(request, '/promotor');
    }

    // B2.3: Promotor em área do promotor -> Verificar se promotor está ativo
    if (isPromotorRoute(pathname)) {
      // Verificar se o promotor está ativo
      const { data: promotorData } = await supabase
        .from('promotores')
        .select('ativo')
        .eq('id', promotorRoleResult.data?.promotor_id)
        .single();

      if (!promotorData?.ativo) {
        // Promotor inativo -> Deslogar e redirecionar
        await supabase.auth.signOut();
        return redirect(request, '/promotor/login');
      }

      return supabaseResponse;
    }

    // B2.4: Promotor tentando acessar área da banca -> Redirecionar para dashboard do promotor
    if (isBancaProtectedRoute(pathname)) {
      return redirect(request, '/promotor');
    }

    return supabaseResponse;
  }

  // ============================================================================
  // CENÁRIO B3: É USUÁRIO COMUM (NÃO é admin NEM promotor)
  // ============================================================================

  // B3.1: Usuário comum tentando acessar área ADMIN -> PROIBIDO
  if (isAdminRoute(pathname)) {
    return redirect(request, '/');
  }

  // B3.2: Usuário comum tentando acessar área PROMOTOR -> PROIBIDO
  if (isPromotorRoute(pathname)) {
    return redirect(request, '/');
  }

  // B3.3: Usuário comum já logado tentando acessar login/cadastro -> Redirecionar para home
  if (isBancaAuthRoute(pathname)) {
    return redirect(request, '/');
  }

  // B3.4: Usuário comum em área da banca -> Permitir
  return supabaseResponse;
}
