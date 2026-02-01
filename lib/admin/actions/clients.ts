'use server';

import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from './master';

// =============================================
// TYPES
// =============================================

export interface Client {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  total_platforms?: number;
  total_users?: number;
}

export interface CreateClientData {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  logo_url?: string;
}

export interface UpdateClientData {
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  ativo?: boolean;
}

export interface ClientPlatform {
  id: string;
  name: string;
  domain: string;
  slug: string;
  color_primary: string;
  ativo: boolean;
  total_users?: number;
  total_deposits?: number;
}

// =============================================
// GET CLIENTS
// =============================================

export async function getClients(): Promise<Client[]> {
  await requireSuperAdmin();

  const supabase = await createSupabaseClient();

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  // Buscar estatísticas para cada cliente
  const clientsWithStats = await Promise.all(
    (clients || []).map(async (client) => {
      // Contar plataformas do cliente
      const { count: platformsCount } = await supabase
        .from('platforms')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id);

      // Buscar IDs das plataformas do cliente
      const { data: platforms } = await supabase
        .from('platforms')
        .select('id')
        .eq('client_id', client.id);

      // Contar usuários das plataformas do cliente
      let totalUsers = 0;
      if (platforms && platforms.length > 0) {
        const platformIds = platforms.map(p => p.id);
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('platform_id', platformIds);
        totalUsers = usersCount || 0;
      }

      return {
        ...client,
        total_platforms: platformsCount || 0,
        total_users: totalUsers,
      };
    })
  );

  return clientsWithStats;
}

// =============================================
// GET CLIENT BY ID
// =============================================

export async function getClientById(id: string): Promise<Client | null> {
  await requireSuperAdmin();

  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  // Buscar estatísticas
  const { count: platformsCount } = await supabase
    .from('platforms')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', id);

  const { data: platforms } = await supabase
    .from('platforms')
    .select('id')
    .eq('client_id', id);

  let totalUsers = 0;
  if (platforms && platforms.length > 0) {
    const platformIds = platforms.map(p => p.id);
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('platform_id', platformIds);
    totalUsers = usersCount || 0;
  }

  return {
    ...data,
    total_platforms: platformsCount || 0,
    total_users: totalUsers,
  };
}

// =============================================
// CREATE CLIENT
// =============================================

export async function createClientRecord(
  data: CreateClientData
): Promise<{ success: boolean; clientId?: string; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createSupabaseClient();

  // Verificar se slug já existe
  const { data: existingSlug } = await supabase
    .from('clients')
    .select('id')
    .eq('slug', data.slug)
    .single();

  if (existingSlug) {
    return { success: false, error: 'Slug já está em uso' };
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      name: data.name,
      slug: data.slug,
      email: data.email || null,
      phone: data.phone || null,
      logo_url: data.logo_url || null,
      ativo: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating client:', error);
    return { success: false, error: error.message };
  }

  return { success: true, clientId: client.id };
}

// =============================================
// UPDATE CLIENT
// =============================================

export async function updateClient(
  id: string,
  data: UpdateClientData
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createSupabaseClient();

  // Se está alterando o slug, verificar se já existe
  if (data.slug) {
    const { data: existingSlug } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', id)
      .single();

    if (existingSlug) {
      return { success: false, error: 'Slug já está em uso' };
    }
  }

  const { error } = await supabase
    .from('clients')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating client:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// DELETE CLIENT
// =============================================

export async function deleteClient(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin();

  const supabase = await createSupabaseClient();

  // Verificar se há plataformas vinculadas
  const { count: platformsCount } = await supabase
    .from('platforms')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', id);

  if (platformsCount && platformsCount > 0) {
    return {
      success: false,
      error: `Não é possível excluir. Existem ${platformsCount} plataforma(s) vinculada(s) a este cliente.`,
    };
  }

  const { error } = await supabase.from('clients').delete().eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// GET CLIENT PLATFORMS
// =============================================

export async function getClientPlatforms(clientId: string): Promise<ClientPlatform[]> {
  await requireSuperAdmin();

  const supabase = await createSupabaseClient();

  const { data: platforms, error } = await supabase
    .from('platforms')
    .select('id, name, domain, slug, color_primary, ativo')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client platforms:', error);
    return [];
  }

  // Buscar estatísticas para cada plataforma
  const platformsWithStats = await Promise.all(
    (platforms || []).map(async (platform) => {
      const [usersResult, depositsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('platform_id', platform.id),
        supabase
          .from('pagamentos')
          .select('valor')
          .eq('platform_id', platform.id)
          .eq('status', 'PAID'),
      ]);

      const totalDeposits = depositsResult.data?.reduce(
        (sum, d) => sum + Number(d.valor || 0),
        0
      ) || 0;

      return {
        ...platform,
        total_users: usersResult.count || 0,
        total_deposits: totalDeposits,
      };
    })
  );

  return platformsWithStats;
}
