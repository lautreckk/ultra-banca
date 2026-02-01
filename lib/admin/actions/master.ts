'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// =============================================
// SUPER ADMIN CHECK
// =============================================

export async function checkSuperAdmin(): Promise<{
  isSuperAdmin: boolean;
  user: { id: string; email?: string } | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isSuperAdmin: false, user: null };
  }

  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminRole || adminRole.role !== 'super_admin') {
    return { isSuperAdmin: false, user };
  }

  return { isSuperAdmin: true, user };
}

export async function requireSuperAdmin() {
  const { isSuperAdmin, user } = await checkSuperAdmin();

  if (!user) {
    redirect('/admin-master/login');
  }

  if (!isSuperAdmin) {
    redirect('/admin/dashboard');
  }

  return { user };
}

// =============================================
// PLATFORMS MANAGEMENT
// =============================================

export interface Platform {
  id: string;
  client_id: string | null;
  client_name?: string;
  domain: string;
  slug: string;
  name: string;
  site_description: string | null;
  logo_url: string | null;
  color_primary: string;
  active_gateway: string;
  ativo: boolean;
  created_at: string;
  total_users?: number;
  total_deposits?: number;
  total_bets?: number;
}

export async function getPlatforms(): Promise<Platform[]> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { data: platforms, error } = await supabase
    .from('platforms')
    .select(`
      *,
      clients(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching platforms:', error);
    return [];
  }

  // Buscar estatísticas para cada plataforma
  const platformsWithStats = await Promise.all(
    (platforms || []).map(async (platform) => {
      const [usersResult, depositsResult, betsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('platform_id', platform.id),
        supabase
          .from('pagamentos')
          .select('valor')
          .eq('platform_id', platform.id)
          .eq('status', 'PAID'),
        supabase
          .from('apostas')
          .select('*', { count: 'exact', head: true })
          .eq('platform_id', platform.id),
      ]);

      const totalDeposits = depositsResult.data?.reduce(
        (sum, d) => sum + Number(d.valor || 0),
        0
      ) || 0;

      return {
        ...platform,
        client_name: (platform.clients as unknown as { name: string })?.name || null,
        total_users: usersResult.count || 0,
        total_deposits: totalDeposits,
        total_bets: betsResult.count || 0,
      };
    })
  );

  return platformsWithStats;
}

export async function getPlatformById(id: string): Promise<Platform | null> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export interface CreatePlatformData {
  client_id: string;
  domain: string;
  slug: string;
  name: string;
  site_description?: string;
  logo_url?: string;
  color_primary?: string;
  active_gateway?: string;
}

export async function createPlatform(
  data: CreatePlatformData
): Promise<{ success: boolean; platformId?: string; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createClient();

  // Verificar se domínio já existe
  const { data: existingDomain } = await supabase
    .from('platforms')
    .select('id')
    .eq('domain', data.domain)
    .single();

  if (existingDomain) {
    return { success: false, error: 'Domínio já está em uso' };
  }

  // Verificar se slug já existe
  const { data: existingSlug } = await supabase
    .from('platforms')
    .select('id')
    .eq('slug', data.slug)
    .single();

  if (existingSlug) {
    return { success: false, error: 'Slug já está em uso' };
  }

  // Verificar se cliente existe
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', data.client_id)
    .single();

  if (!client) {
    return { success: false, error: 'Cliente não encontrado' };
  }

  const { data: platform, error } = await supabase
    .from('platforms')
    .insert({
      client_id: data.client_id,
      domain: data.domain,
      slug: data.slug,
      name: data.name,
      site_description: data.site_description || null,
      logo_url: data.logo_url || null,
      color_primary: data.color_primary || '#FFD700',
      active_gateway: data.active_gateway || 'bspay',
      ativo: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating platform:', error);
    return { success: false, error: error.message };
  }

  return { success: true, platformId: platform.id };
}

export async function updatePlatform(
  id: string,
  data: Partial<CreatePlatformData> & { ativo?: boolean }
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from('platforms')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating platform:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deletePlatform(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createClient();

  // Verificar se há usuários na plataforma
  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('platform_id', id);

  if (usersCount && usersCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir. Existem ${usersCount} usuários nesta plataforma.`,
    };
  }

  const { error } = await supabase.from('platforms').delete().eq('id', id);

  if (error) {
    console.error('Error deleting platform:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// PLATFORM ADMINS MANAGEMENT
// =============================================

export interface PlatformAdmin {
  id: string;
  user_id: string;
  platform_id: string;
  platform_name?: string;
  user_name?: string;
  user_email?: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

export async function getPlatformAdmins(): Promise<PlatformAdmin[]> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('platform_admins')
    .select(`
      id,
      user_id,
      platform_id,
      permissions,
      created_at,
      platforms(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching platform admins:', error);
    return [];
  }

  // Buscar informações dos usuários
  const adminsWithUsers = await Promise.all(
    (data || []).map(async (admin) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', admin.user_id)
        .single();

      const { data: authUser } = await supabase.auth.admin.getUserById(admin.user_id);

      return {
        id: admin.id,
        user_id: admin.user_id,
        platform_id: admin.platform_id,
        platform_name: (admin.platforms as unknown as { name: string })?.name || 'N/A',
        user_name: profile?.nome || 'N/A',
        user_email: authUser?.user?.email || 'N/A',
        permissions: admin.permissions || {},
        created_at: admin.created_at,
      };
    })
  );

  return adminsWithUsers;
}

export async function linkAdminToPlatform(
  userId: string,
  platformId: string,
  permissions: Record<string, boolean> = {}
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireSuperAdmin();

  const supabase = await createClient();

  // Verificar se vínculo já existe
  const { data: existing } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .eq('platform_id', platformId)
    .single();

  if (existing) {
    return { success: false, error: 'Usuário já é admin desta plataforma' };
  }

  // Verificar se usuário existe
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { success: false, error: 'Usuário não encontrado' };
  }

  // Verificar se plataforma existe
  const { data: platform } = await supabase
    .from('platforms')
    .select('id')
    .eq('id', platformId)
    .single();

  if (!platform) {
    return { success: false, error: 'Plataforma não encontrada' };
  }

  // Criar vínculo
  const { error } = await supabase.from('platform_admins').insert({
    user_id: userId,
    platform_id: platformId,
    permissions,
    created_by: user.id,
  });

  if (error) {
    console.error('Error linking admin to platform:', error);
    return { success: false, error: error.message };
  }

  // Garantir que o usuário tenha role de admin
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!adminRole) {
    await supabase.from('admin_roles').insert({
      user_id: userId,
      role: 'admin',
      permissions: {},
    });
  }

  return { success: true };
}

export async function unlinkAdminFromPlatform(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from('platform_admins')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error('Error unlinking admin from platform:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// GLOBAL STATS (for super admin dashboard)
// =============================================

export interface GlobalStats {
  totalPlatforms: number;
  activePlatforms: number;
  totalUsers: number;
  totalDeposits: number;
  totalBets: number;
  totalRevenue: number;
}

export async function getGlobalStats(): Promise<GlobalStats> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const [
    platformsResult,
    activePlatformsResult,
    usersResult,
    depositsResult,
    betsResult,
  ] = await Promise.all([
    supabase.from('platforms').select('*', { count: 'exact', head: true }),
    supabase.from('platforms').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('pagamentos').select('valor').eq('status', 'PAID'),
    supabase.from('apostas').select('valor_total'),
  ]);

  const totalDeposits = depositsResult.data?.reduce(
    (sum, d) => sum + Number(d.valor || 0),
    0
  ) || 0;

  const totalBetsValue = betsResult.data?.reduce(
    (sum, b) => sum + Number(b.valor_total || 0),
    0
  ) || 0;

  return {
    totalPlatforms: platformsResult.count || 0,
    activePlatforms: activePlatformsResult.count || 0,
    totalUsers: usersResult.count || 0,
    totalDeposits,
    totalBets: betsResult.data?.length || 0,
    totalRevenue: totalBetsValue,
  };
}

// =============================================
// SEARCH USERS (for linking to platforms)
// =============================================

export interface UserSearchResult {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  platform_name?: string;
}

export async function searchUsersForAdmin(
  query: string
): Promise<UserSearchResult[]> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nome,
      cpf,
      platform_id,
      platforms(name)
    `)
    .or(`nome.ilike.%${query}%,cpf.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return (data || []).map((u) => ({
    id: u.id,
    nome: u.nome,
    cpf: u.cpf,
    platform_name: (u.platforms as unknown as { name: string })?.name || 'N/A',
  }));
}

// =============================================
// CLIENTS LIST (for platform creation dropdown)
// =============================================

export interface ClientOption {
  id: string;
  name: string;
  slug: string;
}

export async function getClientsForSelect(): Promise<ClientOption[]> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, slug')
    .eq('ativo', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return data || [];
}
