'use server';

import { createClient } from '@/lib/supabase/server';

export interface LastBet {
  id: string;
  tipo: string;
  modalidade: string;
  colocacao: string;
  palpites: string[];
  horarios: string[];
  loterias: string[];
  data_jogo: string;
  valor_unitario: number;
  valor_total: number;
  multiplicador: number;
  pule: string;
  created_at: string;
}

/**
 * Gera a URL para repetir uma aposta baseada nos dados da última aposta
 */
function buildRepeatBetUrl(bet: LastBet): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  switch (bet.tipo) {
    case 'loterias':
      // Para loterias, redireciona para a página de valor com os palpites
      const palpitesParam = bet.palpites.join(',');
      const loteriasParam = bet.loterias.join(',');
      const horariosParam = bet.horarios.join(',');
      return `/loterias/loterias/${dateStr}/${bet.modalidade}/valor?palpites=${encodeURIComponent(palpitesParam)}&colocacao=${bet.colocacao}&loterias=${encodeURIComponent(loteriasParam)}&horarios=${encodeURIComponent(horariosParam)}`;

    case 'quininha':
      // Para quininha, redireciona para seleção de valor
      const quininhaModalidade = bet.modalidade;
      const quininhaPalpites = bet.palpites.join('|');
      return `/quininha/${dateStr}/${quininhaModalidade}/valor?palpites=${encodeURIComponent(quininhaPalpites)}`;

    case 'seninha':
      // Para seninha, redireciona para seleção de valor
      const seninhaModalidade = bet.modalidade;
      const seninhaPalpites = bet.palpites.join('|');
      return `/seninha/${dateStr}/${seninhaModalidade}/valor?palpites=${encodeURIComponent(seninhaPalpites)}`;

    case 'lotinha':
      // Para lotinha, redireciona para seleção de valor
      const lotinhaModalidade = bet.modalidade;
      const lotinhaPalpites = bet.palpites.join('|');
      return `/lotinha/${dateStr}/${lotinhaModalidade}/valor?palpites=${encodeURIComponent(lotinhaPalpites)}`;

    default:
      // Fallback para loterias
      return '/loterias/loterias';
  }
}

/**
 * Busca a última aposta do usuário autenticado e retorna a URL para repetir
 */
export async function getLastBetAndBuildUrl(): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await supabase
      .from('apostas')
      .select('id, tipo, modalidade, colocacao, palpites, horarios, loterias, data_jogo, valor_unitario, valor_total, multiplicador, pule, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return { success: false, error: 'Nenhuma aposta encontrada' };
      }
      return { success: false, error: error.message };
    }

    const bet: LastBet = {
      ...data,
      valor_unitario: Number(data.valor_unitario),
      valor_total: Number(data.valor_total),
      multiplicador: Number(data.multiplicador),
    };

    const url = buildRepeatBetUrl(bet);

    return { success: true, url };
  } catch (error) {
    console.error('Error fetching last bet:', error);
    return { success: false, error: 'Erro ao buscar última aposta' };
  }
}
