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
// DOMÍNIO EXCLUSIVO PARA ADMINISTRAÇÃO
// ============================================================================
// Apenas este domínio pode acessar /admin/* e /admin-master/*
// Outros domínios são exclusivos para a banca (apostadores)
const ADMIN_DOMAIN = 'gabrielsena.net';
const ADMIN_ALLOWED_DOMAINS = [
  'gabrielsena.net',
  'www.gabrielsena.net',
  'localhost', // Para desenvolvimento
  '127.0.0.1',
];

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
  '/',
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
  '/home',
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

function isAdminDomain(host: string): boolean {
  const domain = host.split(':')[0].toLowerCase().replace(/^www\./, '');
  return ADMIN_ALLOWED_DOMAINS.some(d =>
    domain === d || domain === `www.${d}`
  );
}

function redirect(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

function redirectToExternal(url: string): NextResponse {
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
  let domain = host.split(':')[0];

  // Normalizar: remover www. e converter para minúsculas
  domain = domain.toLowerCase().replace(/^www\./, '');

  // 1. Tentar pelo domínio completo
  const { data: platform, error } = await supabase
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
  // SEGREGAÇÃO DE DOMÍNIOS: ADMIN vs BANCA
  // ============================================================================
  const host = request.headers.get('host') || 'localhost';
  const pathname = request.nextUrl.pathname;
  const adminDomainAccess = isAdminDomain(host);

  // SEGURANÇA: Bloquear acesso a rotas admin em domínios de banca
  if (!adminDomainAccess && (isAdminRoute(pathname) || isAdminMasterRoute(pathname))) {
    console.warn('[SECURITY] Tentativa de acesso admin bloqueada:', { host, pathname });
    // Redirecionar para o login da banca (não para / que pode causar loop com admins)
    return redirect(request, '/login');
  }

  // SEGURANÇA: No domínio admin, bloquear acesso à banca (opcional - redireciona para admin)
  // Permitir rotas de promotor no domínio admin (promotores acessam pelo mesmo domínio)
  // EXCEÇÃO: localhost/127.0.0.1 funciona como domínio dual (admin + banca) para desenvolvimento
  const devDomain = host.split(':')[0] === 'localhost' || host.split(':')[0] === '127.0.0.1';
  if (adminDomainAccess && !devDomain && !isAdminRoute(pathname) && !isAdminMasterRoute(pathname) && !isPromotorRoute(pathname) && pathname !== '/') {
    // Se está no domínio admin mas tentando acessar área da banca
    // Redirecionar para o login do admin
    if (!pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
      console.log('[SECURITY] Domínio admin, redirecionando para área admin:', { host, pathname });
      return redirect(request, '/admin/login');
    }
  }

  // Raiz do domínio admin -> redirecionar para admin login (exceto dev)
  if (adminDomainAccess && !devDomain && pathname === '/') {
    return redirect(request, '/admin/login');
  }

  // ============================================================================
  // MULTI-TENANT: RESOLVER PLATAFORMA PELO DOMÍNIO
  // ============================================================================
  const existingPlatformId = request.cookies.get('platform_id')?.value;

  // Para rotas de ADMIN: respeitar o cookie existente (admin pode escolher plataforma)
  // Para banca: usar cookie existente se já resolvido, senão resolver pelo domínio
  const isAdminPath = pathname.startsWith('/admin');

  let platformId: string;

  if (existingPlatformId) {
    // Cookie já existe - reusar sem query ao banco
    platformId = existingPlatformId;
  } else {
    // Primeiro acesso: resolver pelo domínio
    const platformResult = await resolvePlatformByDomain(supabase, host);

    if (!platformResult) {
      console.warn('[MULTI-TENANT] ⚠️ FALLBACK PARA DEFAULT:', { host });
    }

    platformId = platformResult?.platformId || DEFAULT_PLATFORM_ID;

    // Setar cookies no REQUEST para que server components possam lê-los
    // durante esta mesma requisição (via cookies() do next/headers)
    request.cookies.set('platform_id', platformId);
    request.cookies.set('platform_slug', platformResult?.platform?.slug || '');
  }

  // IMPORTANTE: getUser() pode chamar setAll() que recria supabaseResponse.
  // Por isso, cookies de plataforma são setados no request (acima) E
  // no response (abaixo) DEPOIS do getUser().
  const { data: { user } } = await supabase.auth.getUser();

  // Setar cookies no RESPONSE para o browser armazenar.
  // Feito DEPOIS do getUser() porque ele pode recriar supabaseResponse.
  if (!isAdminPath || !existingPlatformId) {
    supabaseResponse.cookies.set('platform_id', platformId, {
      httpOnly: false, // Client precisa acessar para passar no signup
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 ano
    });

    supabaseResponse.cookies.set('platform_slug', request.cookies.get('platform_slug')?.value || '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 ano
    });
  }

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

    // A2.5: Em domínios de banca, a landing page (/) NÃO deve ser acessível
    // A Cupula só pode ser acessada pelo domínio admin (gabrielsena.net)
    // Domínios de banca devem ir direto para o login
    if (!adminDomainAccess && pathname === '/') {
      return redirect(request, '/login');
    }

    // A3: Rotas públicas ou auth -> Permitir
    return supabaseResponse;
  }

  // ============================================================================
  // CENÁRIO B: USUÁRIO ESTÁ LOGADO
  // ============================================================================

  // OTIMIZAÇÃO: Em domínios de banca, o usuário SÓ pode ser jogador comum.
  // Admins/promotores em domínio de banca já foram bloqueados nas linhas acima.
  // Economiza 2 queries (admin_roles + promotor_roles) para CADA request de jogador.
  const isBancaDomain = !adminDomainAccess;
  const isBancaOrPublicPath = !isAdminRoute(pathname) && !isAdminMasterRoute(pathname) && !isPromotorRoute(pathname);

  if (isBancaDomain && isBancaOrPublicPath) {
    // FAST PATH: Jogador da banca - apenas verificar platform_id (1 query ao invés de 3)
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.platform_id && profile.platform_id !== platformId) {
      await supabase.auth.signOut();
      return redirect(request, '/login');
    }

    // Jogador logado tentando acessar login/cadastro -> home
    if (isBancaAuthRoute(pathname) || pathname === '/') {
      return redirect(request, '/home');
    }

    // Jogador em área da banca -> Permitir
    return supabaseResponse;
  }

  // SLOW PATH: Domínio admin ou rotas admin/promotor - precisa de todas as queries
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
  if (!isAdmin && userPlatformId && userPlatformId !== platformId) {
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
    if (!isSuperAdmin) {
      if (isAdmin) {
        return redirect(request, '/admin/dashboard');
      }
      return redirect(request, '/home');
    }

    if (isAdminMasterAuthRoute(pathname)) {
      return redirect(request, '/admin-master/dashboard');
    }

    return supabaseResponse;
  }

  // ============================================================================
  // CENÁRIO B1: É ADMIN
  // ============================================================================
  if (isAdmin) {
    if (!adminDomainAccess) {
      await supabase.auth.signOut();
      return redirect(request, '/login');
    }

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const mfaPending = aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1';
    const mfaComplete = aalData?.currentLevel === 'aal2' || aalData?.nextLevel === 'aal1';

    if (!isAdminRoute(pathname)) {
      if (mfaPending) {
        return redirect(request, '/admin/login');
      }
      return redirect(request, '/admin/dashboard');
    }

    if (isAdminAuthRoute(pathname)) {
      if (mfaComplete) {
        return redirect(request, '/admin/dashboard');
      }
      return supabaseResponse;
    }

    if (mfaPending) {
      return redirect(request, '/admin/login');
    }

    return supabaseResponse;
  }

  // ============================================================================
  // CENÁRIO B2: É PROMOTOR
  // ============================================================================
  if (isPromotor) {
    if (isAdminRoute(pathname)) {
      return redirect(request, '/promotor');
    }

    if (isPromotorAuthRoute(pathname)) {
      return redirect(request, '/promotor');
    }

    if (isPromotorRoute(pathname)) {
      const { data: promotorData } = await supabase
        .from('promotores')
        .select('ativo')
        .eq('id', promotorRoleResult.data?.promotor_id)
        .single();

      if (!promotorData?.ativo) {
        await supabase.auth.signOut();
        return redirect(request, '/promotor/login');
      }

      return supabaseResponse;
    }

    if (isBancaProtectedRoute(pathname)) {
      return redirect(request, '/promotor');
    }

    if (pathname === '/' || isBancaAuthRoute(pathname)) {
      return redirect(request, '/promotor');
    }

    return supabaseResponse;
  }

  // ============================================================================
  // CENÁRIO B3: É USUÁRIO COMUM (NÃO é admin NEM promotor)
  // ============================================================================

  if (isAdminRoute(pathname)) {
    return redirect(request, '/home');
  }

  if (isPromotorRoute(pathname)) {
    return redirect(request, '/home');
  }

  if (isBancaAuthRoute(pathname)) {
    return redirect(request, '/home');
  }

  if (pathname === '/') {
    return redirect(request, '/home');
  }

  return supabaseResponse;
}
