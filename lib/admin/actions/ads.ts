'use server';

import { createClient } from '@/lib/supabase/server';

export interface Propaganda {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem_url: string;
  link_url: string | null;
  gatilhos: string[];
  prioridade: number;
  ativo: boolean;
  data_inicio: string;
  data_fim: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

export interface AdsListParams {
  page?: number;
  pageSize?: number;
  ativo?: boolean;
}

export interface AdsListResult {
  ads: Propaganda[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getAds(params: AdsListParams = {}): Promise<AdsListResult> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, ativo } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('propagandas')
    .select(`
      *,
      profiles(nome)
    `, { count: 'exact' });

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, count, error } = await query
    .order('prioridade', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching ads:', error);
    return { ads: [], total: 0, page, pageSize };
  }

  const ads = (data || []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    descricao: p.descricao,
    imagem_url: p.imagem_url,
    link_url: p.link_url,
    gatilhos: p.gatilhos || [],
    prioridade: p.prioridade || 0,
    ativo: p.ativo,
    data_inicio: p.data_inicio,
    data_fim: p.data_fim,
    created_by: p.created_by,
    created_at: p.created_at,
    updated_at: p.updated_at,
    creator_name: (p.profiles as { nome: string } | null)?.nome || 'Sistema',
  }));

  return { ads, total: count || 0, page, pageSize };
}

export interface CreateAdInput {
  titulo: string;
  descricao?: string;
  imagem_url: string;
  link_url?: string;
  gatilhos: string[];
  prioridade?: number;
  data_inicio?: string;
  data_fim?: string;
  ativo?: boolean;
}

export async function createAd(input: CreateAdInput): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('propagandas')
    .insert({
      titulo: input.titulo,
      descricao: input.descricao || null,
      imagem_url: input.imagem_url,
      link_url: input.link_url || null,
      gatilhos: input.gatilhos || [],
      prioridade: input.prioridade || 0,
      data_inicio: input.data_inicio || new Date().toISOString(),
      data_fim: input.data_fim || null,
      ativo: input.ativo ?? true,
      created_by: user?.id || null,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function updateAd(
  id: string,
  input: Partial<CreateAdInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.titulo !== undefined) updateData.titulo = input.titulo;
  if (input.descricao !== undefined) updateData.descricao = input.descricao;
  if (input.imagem_url !== undefined) updateData.imagem_url = input.imagem_url;
  if (input.link_url !== undefined) updateData.link_url = input.link_url;
  if (input.gatilhos !== undefined) updateData.gatilhos = input.gatilhos;
  if (input.prioridade !== undefined) updateData.prioridade = input.prioridade;
  if (input.data_inicio !== undefined) updateData.data_inicio = input.data_inicio;
  if (input.data_fim !== undefined) updateData.data_fim = input.data_fim;
  if (input.ativo !== undefined) updateData.ativo = input.ativo;

  const { error } = await supabase
    .from('propagandas')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteAd(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('propagandas')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function toggleAdStatus(id: string): Promise<{ success: boolean; error?: string; newStatus?: boolean }> {
  const supabase = await createClient();

  // Get current status
  const { data: ad, error: fetchError } = await supabase
    .from('propagandas')
    .select('ativo')
    .eq('id', id)
    .single();

  if (fetchError || !ad) {
    return { success: false, error: 'Propaganda não encontrada' };
  }

  const newStatus = !ad.ativo;

  const { error } = await supabase
    .from('propagandas')
    .update({ ativo: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, newStatus };
}

// Function for user-facing: get active ads by trigger
export async function getActiveAdsByTrigger(trigger: 'login' | 'saque' | 'deposito'): Promise<Propaganda[]> {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('propagandas')
    .select('*')
    .eq('ativo', true)
    .contains('gatilhos', [trigger])
    .or(`data_inicio.is.null,data_inicio.lte.${now}`)
    .or(`data_fim.is.null,data_fim.gte.${now}`)
    .order('prioridade', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching ads by trigger:', error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    descricao: p.descricao,
    imagem_url: p.imagem_url,
    link_url: p.link_url,
    gatilhos: p.gatilhos || [],
    prioridade: p.prioridade || 0,
    ativo: p.ativo,
    data_inicio: p.data_inicio,
    data_fim: p.data_fim,
    created_by: p.created_by,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));
}
