'use server';

import { createClient } from '@/lib/supabase/server';

export interface ModalidadeDB {
  id: string;
  categoria: string;
  nome: string;
  codigo: string;
  multiplicador: number;
  valor_minimo: number;
  valor_maximo: number;
  posicoes_1_5: boolean;
  posicoes_1_6: boolean;
  posicoes_1_7: boolean;
  posicoes_1_10: boolean;
  posicoes_5_6: boolean;
  ativo: boolean;
  ordem: number;
}

/**
 * Busca todas as modalidades ativas do banco de dados
 */
export async function getModalidadesAtivas(): Promise<ModalidadeDB[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('modalidades_config')
    .select('id, categoria, nome, codigo, multiplicador, valor_minimo, valor_maximo, posicoes_1_5, posicoes_1_6, posicoes_1_7, posicoes_1_10, posicoes_5_6, ativo, ordem')
    .eq('ativo', true)
    .order('categoria')
    .order('ordem');

  if (error) {
    console.error('Erro ao buscar modalidades:', error);
    return [];
  }

  return (data || []).map((m) => ({
    id: m.id,
    categoria: m.categoria,
    nome: m.nome,
    codigo: m.codigo,
    multiplicador: Number(m.multiplicador) || 0,
    valor_minimo: Number(m.valor_minimo) || 1,
    valor_maximo: Number(m.valor_maximo) || 1000,
    posicoes_1_5: m.posicoes_1_5,
    posicoes_1_6: m.posicoes_1_6,
    posicoes_1_7: m.posicoes_1_7,
    posicoes_1_10: m.posicoes_1_10,
    posicoes_5_6: m.posicoes_5_6,
    ativo: m.ativo,
    ordem: m.ordem || 0,
  }));
}

/**
 * Busca uma modalidade específica pelo código
 */
export async function getModalidadeByCodigo(codigo: string): Promise<ModalidadeDB | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('modalidades_config')
    .select('id, categoria, nome, codigo, multiplicador, valor_minimo, valor_maximo, posicoes_1_5, posicoes_1_6, posicoes_1_7, posicoes_1_10, posicoes_5_6, ativo, ordem')
    .eq('codigo', codigo)
    .single();

  if (error || !data) {
    console.error('Erro ao buscar modalidade:', error);
    return null;
  }

  return {
    id: data.id,
    categoria: data.categoria,
    nome: data.nome,
    codigo: data.codigo,
    multiplicador: Number(data.multiplicador) || 0,
    valor_minimo: Number(data.valor_minimo) || 1,
    valor_maximo: Number(data.valor_maximo) || 1000,
    posicoes_1_5: data.posicoes_1_5,
    posicoes_1_6: data.posicoes_1_6,
    posicoes_1_7: data.posicoes_1_7,
    posicoes_1_10: data.posicoes_1_10,
    posicoes_5_6: data.posicoes_5_6,
    ativo: data.ativo,
    ordem: data.ordem || 0,
  };
}

/**
 * Busca modalidades por categoria
 */
export async function getModalidadesByCategoria(categoria: string): Promise<ModalidadeDB[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('modalidades_config')
    .select('id, categoria, nome, codigo, multiplicador, valor_minimo, valor_maximo, posicoes_1_5, posicoes_1_6, posicoes_1_7, posicoes_1_10, posicoes_5_6, ativo, ordem')
    .eq('categoria', categoria)
    .eq('ativo', true)
    .order('ordem');

  if (error) {
    console.error('Erro ao buscar modalidades por categoria:', error);
    return [];
  }

  return (data || []).map((m) => ({
    id: m.id,
    categoria: m.categoria,
    nome: m.nome,
    codigo: m.codigo,
    multiplicador: Number(m.multiplicador) || 0,
    valor_minimo: Number(m.valor_minimo) || 1,
    valor_maximo: Number(m.valor_maximo) || 1000,
    posicoes_1_5: m.posicoes_1_5,
    posicoes_1_6: m.posicoes_1_6,
    posicoes_1_7: m.posicoes_1_7,
    posicoes_1_10: m.posicoes_1_10,
    posicoes_5_6: m.posicoes_5_6,
    ativo: m.ativo,
    ordem: m.ordem || 0,
  }));
}

