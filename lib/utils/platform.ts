'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PLATFORM_ID } from './platform-constants';

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
  // 1. Tentar obter do cookie (definido pelo middleware)
  const cookieStore = await cookies();
  const platformIdFromCookie = cookieStore.get('platform_id')?.value;

  if (platformIdFromCookie) {
    return platformIdFromCookie;
  }

  // 2. Tentar obter do profile do usuário autenticado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_id')
      .eq('id', user.id)
      .single();

    if (profile?.platform_id) {
      return profile.platform_id;
    }
  }

  // 3. Fallback para plataforma default
  return DEFAULT_PLATFORM_ID;
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

  const isSuperAdmin = adminRole?.role === 'super_admin';

  if (!isSuperAdmin) {
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

  if (!platform.ativo && !isSuperAdmin) {
    return { success: false, error: 'Plataforma inativa' };
  }

  // Definir cookie com a nova plataforma
  const cookieStore = await cookies();
  cookieStore.set('platform_id', platformId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });

  return { success: true };
}
