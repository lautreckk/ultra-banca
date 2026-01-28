'use server';

import { createClient } from '@/lib/supabase/server';

export interface Promotion {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  valor: number | null;
  percentual: number | null;
  valor_minimo: number;
  valor_maximo: number | null;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  creator_name?: string;
}

export interface PromotionsListParams {
  page?: number;
  pageSize?: number;
  ativo?: boolean;
}

export interface PromotionsListResult {
  promotions: Promotion[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getPromotions(params: PromotionsListParams = {}): Promise<PromotionsListResult> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, ativo } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('promocoes')
    .select(`
      *,
      profiles(nome)
    `, { count: 'exact' });

  if (ativo !== undefined) {
    query = query.eq('ativo', ativo);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching promotions:', error);
    return { promotions: [], total: 0, page, pageSize };
  }

  const promotions = (data || []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    descricao: p.descricao,
    tipo: p.tipo,
    valor: p.valor ? Number(p.valor) : null,
    percentual: p.percentual ? Number(p.percentual) : null,
    valor_minimo: Number(p.valor_minimo) || 0,
    valor_maximo: p.valor_maximo ? Number(p.valor_maximo) : null,
    data_inicio: p.data_inicio,
    data_fim: p.data_fim,
    ativo: p.ativo,
    created_by: p.created_by,
    created_at: p.created_at,
    creator_name: (p.profiles as { nome: string } | null)?.nome || 'Sistema',
  }));

  return { promotions, total: count || 0, page, pageSize };
}

export interface CreatePromotionInput {
  titulo: string;
  descricao?: string;
  tipo: string;
  valor?: number;
  percentual?: number;
  valor_minimo?: number;
  valor_maximo?: number;
  data_inicio?: string;
  data_fim?: string;
  ativo?: boolean;
}

export async function createPromotion(input: CreatePromotionInput): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('promocoes')
    .insert({
      titulo: input.titulo,
      descricao: input.descricao || null,
      tipo: input.tipo,
      valor: input.valor || null,
      percentual: input.percentual || null,
      valor_minimo: input.valor_minimo || 0,
      valor_maximo: input.valor_maximo || null,
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

export async function updatePromotion(
  id: string,
  input: Partial<CreatePromotionInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.titulo !== undefined) updateData.titulo = input.titulo;
  if (input.descricao !== undefined) updateData.descricao = input.descricao;
  if (input.tipo !== undefined) updateData.tipo = input.tipo;
  if (input.valor !== undefined) updateData.valor = input.valor;
  if (input.percentual !== undefined) updateData.percentual = input.percentual;
  if (input.valor_minimo !== undefined) updateData.valor_minimo = input.valor_minimo;
  if (input.valor_maximo !== undefined) updateData.valor_maximo = input.valor_maximo;
  if (input.data_inicio !== undefined) updateData.data_inicio = input.data_inicio;
  if (input.data_fim !== undefined) updateData.data_fim = input.data_fim;
  if (input.ativo !== undefined) updateData.ativo = input.ativo;

  const { error } = await supabase
    .from('promocoes')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deletePromotion(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('promocoes')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function togglePromotionStatus(id: string): Promise<{ success: boolean; error?: string; newStatus?: boolean }> {
  const supabase = await createClient();

  // Get current status
  const { data: promotion, error: fetchError } = await supabase
    .from('promocoes')
    .select('ativo')
    .eq('id', id)
    .single();

  if (fetchError || !promotion) {
    return { success: false, error: 'Promoção não encontrada' };
  }

  const newStatus = !promotion.ativo;

  const { error } = await supabase
    .from('promocoes')
    .update({ ativo: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, newStatus };
}
