'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';
import { getPlatformId } from '@/lib/utils/platform';

// =============================================
// TYPES
// =============================================

export interface Suspeito {
  id: string;
  user_id: string;
  nivel: 'A' | 'B' | 'C';
  motivo: string;
  detalhes: Record<string, unknown>;
  status: 'ativo' | 'resolvido';
  created_by: string | null;
  platform_id: string;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  user_nome: string;
  user_cpf: string;
  user_saldo: number;
  user_telefone: string | null;
  total_apostas: number;
  total_ganhos: number;
}

export interface SuspeitosListParams {
  page?: number;
  pageSize?: number;
  nivel?: 'A' | 'B' | 'C' | 'todos';
  status?: 'ativo' | 'resolvido' | 'todos';
}

export interface SuspeitosListResult {
  suspeitos: Suspeito[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AddSuspeitoData {
  user_id: string;
  nivel: 'A' | 'B' | 'C';
  motivo: string;
  detalhes?: Record<string, unknown>;
}

export interface UpdateSuspeitoData {
  nivel?: 'A' | 'B' | 'C';
  status?: 'ativo' | 'resolvido';
  motivo?: string;
  detalhes?: Record<string, unknown>;
}

// =============================================
// GET SUSPEITOS
// =============================================

export async function getSuspeitos(params: SuspeitosListParams = {}): Promise<SuspeitosListResult> {
  await requireAdmin();
  const supabase = await createClient();
  const platformId = await getPlatformId();

  const {
    page = 1,
    pageSize = 20,
    nivel = 'todos',
    status = 'todos',
  } = params;

  const offset = (page - 1) * pageSize;

  // Query suspeitos with join to profiles
  let query = supabase
    .from('suspeitos')
    .select('*, profiles!suspeitos_user_id_fkey(nome, cpf, saldo, telefone)', { count: 'exact' })
    .eq('platform_id', platformId)
    .order('created_at', { ascending: false });

  if (nivel !== 'todos') {
    query = query.eq('nivel', nivel);
  }

  if (status !== 'todos') {
    query = query.eq('status', status);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data: suspeitosRaw, count, error } = await query;

  if (error) {
    console.error('Error fetching suspeitos:', error);
    return { suspeitos: [], total: 0, page, pageSize };
  }

  if (!suspeitosRaw || suspeitosRaw.length === 0) {
    return { suspeitos: [], total: count || 0, page, pageSize };
  }

  // Get bet stats for all suspect users
  const userIds = suspeitosRaw.map((s: Record<string, unknown>) => s.user_id as string);

  const [apostasResult, ganhosResult] = await Promise.all([
    supabase
      .from('apostas')
      .select('user_id')
      .in('user_id', userIds),
    supabase
      .from('apostas')
      .select('user_id, premio_valor')
      .in('user_id', userIds)
      .eq('status', 'ganhou'),
  ]);

  const apostasCountMap = new Map<string, number>();
  apostasResult.data?.forEach((row) => {
    apostasCountMap.set(row.user_id, (apostasCountMap.get(row.user_id) || 0) + 1);
  });

  const ganhosMap = new Map<string, number>();
  ganhosResult.data?.forEach((row) => {
    const current = ganhosMap.get(row.user_id) || 0;
    ganhosMap.set(row.user_id, current + (Number(row.premio_valor) || 0));
  });

  const suspeitos: Suspeito[] = suspeitosRaw.map((s: Record<string, unknown>) => {
    const profile = s.profiles as Record<string, unknown> | null;
    return {
      id: s.id as string,
      user_id: s.user_id as string,
      nivel: s.nivel as 'A' | 'B' | 'C',
      motivo: s.motivo as string,
      detalhes: (s.detalhes as Record<string, unknown>) || {},
      status: s.status as 'ativo' | 'resolvido',
      created_by: s.created_by as string | null,
      platform_id: s.platform_id as string,
      created_at: s.created_at as string,
      updated_at: s.updated_at as string,
      user_nome: (profile?.nome as string) || 'N/A',
      user_cpf: (profile?.cpf as string) || '',
      user_saldo: Number(profile?.saldo) || 0,
      user_telefone: (profile?.telefone as string) || null,
      total_apostas: apostasCountMap.get(s.user_id as string) || 0,
      total_ganhos: ganhosMap.get(s.user_id as string) || 0,
    };
  });

  return {
    suspeitos,
    total: count || 0,
    page,
    pageSize,
  };
}

// =============================================
// ADD SUSPEITO
// =============================================

export async function addSuspeito(
  data: AddSuspeitoData
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { user } = await requireAdmin();
  const supabase = await createClient();
  const platformId = await getPlatformId();

  // Check if user already exists as suspeito (ativo) for this platform
  const { data: existing } = await supabase
    .from('suspeitos')
    .select('id')
    .eq('user_id', data.user_id)
    .eq('platform_id', platformId)
    .eq('status', 'ativo')
    .single();

  if (existing) {
    return { success: false, error: 'Usuário já está marcado como suspeito ativo' };
  }

  const { data: inserted, error } = await supabase
    .from('suspeitos')
    .insert({
      user_id: data.user_id,
      nivel: data.nivel,
      motivo: data.motivo,
      detalhes: data.detalhes || {},
      status: 'ativo',
      created_by: user.id,
      platform_id: platformId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error adding suspeito:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: inserted.id };
}

// =============================================
// UPDATE SUSPEITO
// =============================================

export async function updateSuspeito(
  id: string,
  data: UpdateSuspeitoData
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const platformId = await getPlatformId();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.nivel !== undefined) updateData.nivel = data.nivel;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.motivo !== undefined) updateData.motivo = data.motivo;
  if (data.detalhes !== undefined) updateData.detalhes = data.detalhes;

  const { error } = await supabase
    .from('suspeitos')
    .update(updateData)
    .eq('id', id)
    .eq('platform_id', platformId);

  if (error) {
    console.error('Error updating suspeito:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// DELETE SUSPEITO
// =============================================

export async function deleteSuspeito(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const platformId = await getPlatformId();

  const { error } = await supabase
    .from('suspeitos')
    .delete()
    .eq('id', id)
    .eq('platform_id', platformId);

  if (error) {
    console.error('Error deleting suspeito:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// GET SUSPEITO DETAILS
// =============================================

export async function getSuspeitoDetails(userId: string): Promise<{
  ultimasApostas: Array<Record<string, unknown>>;
  depositos: Array<Record<string, unknown>>;
  saques: Array<Record<string, unknown>>;
} | null> {
  await requireAdmin();
  const supabase = await createClient();
  const platformId = await getPlatformId();

  // Verify user belongs to this platform
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .eq('platform_id', platformId)
    .single();

  if (!profile) return null;

  const [apostasResult, depositosResult, saquesResult] = await Promise.all([
    // Last winning bets
    supabase
      .from('apostas')
      .select('id, pule, tipo, modalidade, valor_total, premio_valor, status, created_at, palpites, horarios, loterias')
      .eq('user_id', userId)
      .eq('status', 'ganhou')
      .order('created_at', { ascending: false })
      .limit(20),

    // Recent deposits
    supabase
      .from('pagamentos')
      .select('id, valor, status, metodo_pagamento, created_at, paid_at')
      .eq('user_id', userId)
      .eq('tipo', 'deposito')
      .order('created_at', { ascending: false })
      .limit(20),

    // Recent withdrawals
    supabase
      .from('saques')
      .select('id, valor, valor_liquido, taxa, status, chave_pix, created_at, paid_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return {
    ultimasApostas: apostasResult.data || [],
    depositos: depositosResult.data || [],
    saques: saquesResult.data || [],
  };
}

// =============================================
// SEARCH USERS (for adding new suspeito)
// =============================================

export async function searchUsersForSuspeito(search: string): Promise<Array<{
  id: string;
  nome: string;
  cpf: string;
  saldo: number;
}>> {
  await requireAdmin();
  const supabase = await createClient();
  const platformId = await getPlatformId();

  if (!search || search.length < 2) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, cpf, saldo')
    .eq('platform_id', platformId)
    .or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`)
    .limit(10);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return (data || []).map((u) => ({
    id: u.id,
    nome: u.nome,
    cpf: u.cpf,
    saldo: Number(u.saldo) || 0,
  }));
}
