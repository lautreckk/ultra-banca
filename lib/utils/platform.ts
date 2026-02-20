'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PLATFORM_ID, ALL_PLATFORMS_ID } from './platform-constants';

/**
 * Obtém o platform_id do contexto atual.
 *
 * Ordem de prioridade:
 * 1. Cookie 'platform_id' (definido pelo middleware)
 * 2. Profile do usuário autenticado
 * 3. Plataforma default (fallback)
 *
 * @throws Error se não conseguir determinar o platform_id
 */
export async function getPlatformId(): Promise<string> {
  const cookieStore = await cookies();
  const platformIdFromCookie = cookieStore.get('platform_id')?.value;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_id')
      .eq('id', user.id)
      .single();

    if (profile?.platform_id) {
      // Admins podem trocar plataforma via cookie; jogadores não
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminRole && platformIdFromCookie && platformIdFromCookie !== profile.platform_id) {
        console.warn('[SECURITY] Cookie platform_id mismatch', {
          userId: user.id,
          cookie: platformIdFromCookie,
          profile: profile.platform_id,
        });
        return profile.platform_id;
      }

      // Admin com cookie válido ou jogador sem manipulação
      if (adminRole && platformIdFromCookie) {
        return platformIdFromCookie;
      }

      return profile.platform_id;
    }
  }

  // Usuário não autenticado ou sem profile: usar cookie ou fallback
  return platformIdFromCookie || DEFAULT_PLATFORM_ID;
}

/**
 * Obtém a configuração completa da plataforma atual.
 */
export async function getPlatformConfig() {
  const platformId = await getPlatformId();
  const supabase = await createClient();

  const { data: platform, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('id', platformId)
    .single();

  if (error || !platform) {
    // Fallback para plataforma default
    const { data: defaultPlatform } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', DEFAULT_PLATFORM_ID)
      .single();

    return defaultPlatform;
  }

  return platform;
}

/**
 * Verifica se o usuário atual é admin da plataforma atual.
 */
export async function isCurrentUserPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const platformId = await getPlatformId();

  // Verificar se é super_admin
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (adminRole?.role === 'super_admin') {
    return true;
  }

  // Verificar se está vinculado à plataforma
  const { data: platformAdmin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .eq('platform_id', platformId)
    .single();

  return !!platformAdmin;
}

/**
 * Verifica se o usuário atual é super_admin.
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return adminRole?.role === 'super_admin';
}

/**
 * Obtém todas as plataformas que o usuário atual pode administrar.
 * Super admins podem ver todas as plataformas ativas.
 * Admins comuns veem apenas as plataformas vinculadas.
 */
export async function getUserAdminPlatforms() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // Verificar se é super_admin
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (adminRole?.role === 'super_admin') {
    // Super admin: retornar todas as plataformas ativas
    const { data: platforms } = await supabase
      .from('platforms')
      .select('*')
      .eq('ativo', true)
      .order('name');

    return platforms || [];
  }

  // Admin comum: retornar apenas plataformas vinculadas
  const { data: platformAdmins } = await supabase
    .from('platform_admins')
    .select('platform_id, platforms(*)')
    .eq('user_id', user.id);

  if (!platformAdmins) return [];

  return platformAdmins
    .map(pa => pa.platforms)
    .filter(Boolean);
}

/**
 * Troca a plataforma ativa para o admin.
 * Define o platform_id no cookie para uso nas server actions.
 */
export async function switchPlatform(platformId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  // Verificar se usuário tem acesso à plataforma
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isSuperAdminUser = adminRole?.role === 'super_admin';

  // Handle "all platforms" mode (super_admin only)
  if (platformId === ALL_PLATFORMS_ID) {
    if (!isSuperAdminUser) {
      return { success: false, error: 'Acesso restrito a super administradores' };
    }
    const cookieStore = await cookies();
    cookieStore.set('platform_id', platformId, {
      httpOnly: false, // Client lê via document.cookie (signup, home). Validação server-side em getPlatformId()
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return { success: true };
  }

  if (!isSuperAdminUser) {
    // Verificar se está vinculado à plataforma
    const { data: platformAdmin } = await supabase
      .from('platform_admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform_id', platformId)
      .single();

    if (!platformAdmin) {
      return { success: false, error: 'Você não tem acesso a esta plataforma' };
    }
  }

  // Verificar se plataforma existe e está ativa
  const { data: platform } = await supabase
    .from('platforms')
    .select('id, ativo')
    .eq('id', platformId)
    .single();

  if (!platform) {
    return { success: false, error: 'Plataforma não encontrada' };
  }

  if (!platform.ativo && !isSuperAdminUser) {
    return { success: false, error: 'Plataforma inativa' };
  }

  // Definir cookie com a nova plataforma
  const cookieStore = await cookies();
  cookieStore.set('platform_id', platformId, {
    httpOnly: false, // Client lê via document.cookie (signup, home). Validação server-side em getPlatformId()
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });

  return { success: true };
}
