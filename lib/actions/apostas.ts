'use server';

import { createClient } from '@/lib/supabase/server';
import { getPlatformId } from '@/lib/utils/platform';

export interface BetSummary {
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
 * Busca as últimas apostas do usuário autenticado
 */
export async function getRecentBets(limit: number = 20): Promise<{ success: boolean; bets?: BetSummary[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // MULTI-TENANT: Obter platform_id da plataforma atual
    const platformId = await getPlatformId();

    const { data, error } = await supabase
      .from('apostas')
      .select('id, tipo, modalidade, colocacao, palpites, horarios, loterias, data_jogo, valor_unitario, valor_total, multiplicador, pule, created_at')
      .eq('user_id', user.id)
      .eq('platform_id', platformId)  // MULTI-TENANT: Filtro por plataforma
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Nenhuma aposta encontrada' };
    }

    const bets: BetSummary[] = data.map(d => ({
      ...d,
      valor_unitario: Number(d.valor_unitario),
      valor_total: Number(d.valor_total),
      multiplicador: Number(d.multiplicador),
    }));

    return { success: true, bets };
  } catch (error) {
    console.error('Error fetching recent bets:', error);
    return { success: false, error: 'Erro ao buscar apostas' };
  }
}

/**
 * Gera a URL para repetir uma aposta baseada nos dados
 */
export async function buildRepeatBetUrl(bet: BetSummary): Promise<string> {
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
