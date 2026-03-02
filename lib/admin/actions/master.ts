'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sanitizeSearchParam } from '@/lib/utils/sanitize';

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
  layout_id?: 1 | 2 | 3;
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

/**
 * Normaliza slug: lowercase, sem acentos, sem espaços, sem caracteres especiais
 */
function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Plataforma de referência para copiar modalidades ao criar nova plataforma
 */
const REFERENCE_PLATFORM_ID = 'ff61b7a2-1098-4bc4-99c5-5afb600fbc57'; // Banca Pantanal

export async function createPlatform(
  data: CreatePlatformData
): Promise<{ success: boolean; platformId?: string; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createClient();

  // Normalizar slug server-side (previne espaços, maiúsculas, acentos)
  const slug = normalizeSlug(data.slug || data.name);

  if (!slug) {
    return { success: false, error: 'Slug inválido' };
  }

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
    .eq('slug', slug)
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
      slug,
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

  const platformId = platform.id;

  // ===== AUTO-PROVISIONING: configurar plataforma automaticamente =====

  // 1. Copiar modalidades de loteria da plataforma de referência
  const { data: refModalidades } = await supabase
    .from('platform_modalidades')
    .select('codigo, multiplicador, valor_minimo, valor_maximo, ativo, ordem')
    .eq('platform_id', REFERENCE_PLATFORM_ID);

  if (refModalidades && refModalidades.length > 0) {
    await supabase.from('platform_modalidades').insert(
      refModalidades.map((m) => ({ ...m, platform_id: platformId }))
    );
  }

  // 2. Copiar config do gateway BSPay da plataforma de referência
  const { data: refGateway } = await supabase
    .from('gateway_config')
    .select('gateway_name, client_id, client_secret, webhook_secret')
    .eq('platform_id', REFERENCE_PLATFORM_ID)
    .eq('gateway_name', data.active_gateway || 'bspay')
    .single();

  if (refGateway) {
    await supabase.from('gateway_config').insert({
      ...refGateway,
      platform_id: platformId,
      ativo: true,
    });
  }

  // 3. Copiar config do PlayFivers (casino) da plataforma de referência
  const { data: refPlayfiver } = await supabase
    .from('playfiver_config')
    .select('agent_token, secret_key, callback_url, ativo, default_rtp')
    .eq('platform_id', REFERENCE_PLATFORM_ID)
    .single();

  if (refPlayfiver) {
    await supabase.from('playfiver_config').insert({
      ...refPlayfiver,
      platform_id: platformId,
    });
  }

  return { success: true, platformId };
}

export async function updatePlatform(
  id: string,
  data: Partial<CreatePlatformData> & { ativo?: boolean }
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createClient();

  // Normalizar slug se estiver sendo atualizado
  const updateData = { ...data };
  if (updateData.slug) {
    updateData.slug = normalizeSlug(updateData.slug);
  }

  const { error } = await supabase
    .from('platforms')
    .update({
      ...updateData,
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
  user_cpf?: string;
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

  // Garantir que o usuário tenha role de admin (via RPC com GUC flag)
  const adminClient = createAdminClient();

  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!adminRole) {
    const { data: roleResult, error: roleError } = await adminClient.rpc(
      'fn_grant_admin_role',
      {
        p_target_user_id: userId,
        p_role: 'admin',
        p_actor_id: user.id,
        p_permissions: permissions || {},
      }
    );

    if (roleError || !roleResult?.success) {
      console.error('Error creating admin role:', roleError || roleResult?.error);
      return { success: false, error: 'Falha ao criar role de admin' };
    }
  }

  // Criar vínculo via RPC (com GUC flag)
  const { data: linkResult, error: linkError } = await adminClient.rpc(
    'fn_link_platform_admin',
    {
      p_user_id: userId,
      p_platform_id: platformId,
      p_permissions: permissions || {},
      p_created_by: user.id,
    }
  );

  if (linkError || !linkResult?.success) {
    console.error('Error linking platform admin:', linkError || linkResult?.error);
    return { success: false, error: 'Falha ao linkar admin à plataforma' };
  }

  return { success: true };
}

export async function unlinkAdminFromPlatform(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireSuperAdmin();

  const adminClient = createAdminClient();

  const { data: result, error } = await adminClient.rpc(
    'fn_unlink_platform_admin',
    {
      p_link_id: linkId,
      p_actor_id: user.id,
    }
  );

  if (error || !result?.success) {
    console.error('Error unlinking admin from platform:', error || result?.error);
    return { success: false, error: error?.message || result?.error || 'Falha ao desvincular admin' };
  }

  return { success: true };
}

export async function getPlatformAdminsByPlatform(
  platformId: string
): Promise<PlatformAdmin[]> {
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
    .eq('platform_id', platformId)
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
        .select('nome, cpf')
        .eq('id', admin.user_id)
        .single();

      const { data: authUser } = await supabase.auth.admin.getUserById(admin.user_id);

      return {
        id: admin.id,
        user_id: admin.user_id,
        platform_id: admin.platform_id,
        platform_name: (admin.platforms as unknown as { name: string })?.name || 'N/A',
        user_name: profile?.nome || 'N/A',
        user_cpf: profile?.cpf || 'N/A',
        user_email: authUser?.user?.email || 'N/A',
        permissions: admin.permissions || {},
        created_at: admin.created_at,
      };
    })
  );

  return adminsWithUsers;
}

export async function resetAdminPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error('Error resetting password:', error);
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
    .or(`nome.ilike.%${sanitizeSearchParam(query)}%,cpf.ilike.%${sanitizeSearchParam(query)}%`)
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

// =============================================
// GATEWAY CONFIG (Super Admin - any platform)
// =============================================

const MASKED_PREFIX = '••••••••';

function maskSecret(secret: string | null): string | null {
  if (!secret) return null;
  return MASKED_PREFIX + secret.slice(-4);
}

export interface MasterGatewayConfig {
  id: string;
  gateway_name: string;
  ativo: boolean;
  client_id: string | null;
  client_secret: string | null;
  client_secret_masked: boolean;
  webhook_url: string | null;
  config: Record<string, unknown>;
}

export async function getGatewayConfigsForPlatform(platformId: string): Promise<MasterGatewayConfig[]> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('gateway_config')
    .select('id, gateway_name, ativo, client_id, client_secret, webhook_url, config')
    .eq('platform_id', platformId)
    .order('gateway_name');

  if (error) {
    console.error('Error fetching gateway configs:', error);
    return [];
  }

  return (data || []).map((g) => ({
    id: g.id,
    gateway_name: g.gateway_name,
    ativo: g.ativo ?? false,
    client_id: g.client_id,
    client_secret: maskSecret(g.client_secret),
    client_secret_masked: !!g.client_secret,
    webhook_url: g.webhook_url,
    config: (g.config as Record<string, unknown>) || {},
  }));
}

export async function updateGatewayConfigForPlatform(
  platformId: string,
  gatewayName: string,
  config: {
    ativo?: boolean;
    client_id?: string;
    client_secret?: string;
    webhook_url?: string;
    config?: Record<string, unknown>;
  }
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const adminClient = createAdminClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (config.ativo !== undefined) updateData.ativo = config.ativo;
  if (config.client_id !== undefined) updateData.client_id = config.client_id;
  if (config.client_secret !== undefined && !config.client_secret.startsWith(MASKED_PREFIX)) {
    updateData.client_secret = config.client_secret;
  }
  if (config.webhook_url !== undefined) updateData.webhook_url = config.webhook_url;
  if (config.config !== undefined) updateData.config = config.config;

  const { error } = await adminClient
    .from('gateway_config')
    .upsert(
      {
        ...updateData,
        gateway_name: gatewayName,
        platform_id: platformId,
      },
      { onConflict: 'gateway_name,platform_id' }
    );

  if (error) {
    console.error('Error updating gateway config:', error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin-master/plataformas/${platformId}`);
  return { success: true };
}

export async function setPrimaryGatewayForPlatform(
  platformId: string,
  gatewayName: string
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('platforms')
    .update({
      active_gateway: gatewayName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', platformId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin-master/plataformas/${platformId}`);
  return { success: true };
}
