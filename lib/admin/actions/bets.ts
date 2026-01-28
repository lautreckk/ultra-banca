'use server';

import { createClient } from '@/lib/supabase/server';

export interface Bet {
  id: string;
  user_id: string;
  user_name: string;
  user_cpf: string;
  tipo: string;
  modalidade: string;
  colocacao: string;
  palpites: string[];
  horarios: string[];
  data_jogo: string;
  valor_unitario: number;
  valor_total: number;
  multiplicador: number;
  status: string;
  premio_valor: number | null;
  created_at: string;
}

export interface BetsListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BetsListResult {
  bets: Bet[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getBets(params: BetsListParams = {}): Promise<BetsListResult> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, status, search, dateFrom, dateTo } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('apostas')
    .select(`
      id,
      user_id,
      tipo,
      modalidade,
      colocacao,
      palpites,
      horarios,
      data_jogo,
      valor_unitario,
      valor_total,
      multiplicador,
      status,
      premio_valor,
      created_at,
      profiles!inner(nome, cpf)
    `, { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`profiles.nome.ilike.%${search}%,profiles.cpf.ilike.%${search}%`);
  }

  if (dateFrom) {
    query = query.gte('data_jogo', dateFrom);
  }

  if (dateTo) {
    query = query.lte('data_jogo', dateTo);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching bets:', error);
    return { bets: [], total: 0, page, pageSize };
  }

  const bets = (data || []).map((b) => ({
    id: b.id,
    user_id: b.user_id,
    user_name: (b.profiles as unknown as { nome: string; cpf: string })?.nome || 'N/A',
    user_cpf: (b.profiles as unknown as { nome: string; cpf: string })?.cpf || 'N/A',
    tipo: b.tipo,
    modalidade: b.modalidade,
    colocacao: b.colocacao,
    palpites: b.palpites || [],
    horarios: b.horarios || [],
    data_jogo: b.data_jogo,
    valor_unitario: Number(b.valor_unitario) || 0,
    valor_total: Number(b.valor_total) || 0,
    multiplicador: b.multiplicador || 0,
    status: b.status,
    premio_valor: b.premio_valor ? Number(b.premio_valor) : null,
    created_at: b.created_at,
  }));

  return { bets, total: count || 0, page, pageSize };
}

export async function getBetById(id: string): Promise<Bet | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('apostas')
    .select(`
      id,
      user_id,
      tipo,
      modalidade,
      colocacao,
      palpites,
      horarios,
      data_jogo,
      valor_unitario,
      valor_total,
      multiplicador,
      status,
      premio_valor,
      created_at,
      profiles!inner(nome, cpf)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    user_name: (data.profiles as unknown as { nome: string; cpf: string })?.nome || 'N/A',
    user_cpf: (data.profiles as unknown as { nome: string; cpf: string })?.cpf || 'N/A',
    tipo: data.tipo,
    modalidade: data.modalidade,
    colocacao: data.colocacao,
    palpites: data.palpites || [],
    horarios: data.horarios || [],
    data_jogo: data.data_jogo,
    valor_unitario: Number(data.valor_unitario) || 0,
    valor_total: Number(data.valor_total) || 0,
    multiplicador: data.multiplicador || 0,
    status: data.status,
    premio_valor: data.premio_valor ? Number(data.premio_valor) : null,
    created_at: data.created_at,
  };
}
