'use server';

import { createClient } from '@/lib/supabase/server';

// =============================================
// TYPES
// =============================================

export interface InactiveLead {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  saldo: number;
  saldo_bonus: number;
  created_at: string;
  last_login: string | null;
  ultima_aposta: string | null;
  ultimo_deposito: string | null;
  dias_inativo: number;
  total_apostas: number;
}

export interface InactiveLeadsStats {
  inativos_7_dias: number;
  inativos_30_dias: number;
  nunca_apostaram: number;
  com_saldo_parado: number;
}

export interface InactiveLeadsParams {
  page?: number;
  pageSize?: number;
  diasInatividade?: number;
  tipoFiltro?: 'todos' | 'com_saldo' | 'sem_saldo' | 'nunca_apostou';
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface InactiveLeadsResult {
  leads: InactiveLead[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InactivityConfig {
  threshold_days: number;
  with_balance_alert: boolean;
}

// =============================================
// GET INACTIVE LEADS STATS
// =============================================

export async function getInactiveLeadsStats(): Promise<InactiveLeadsStats> {
  const supabase = await createClient();

  const now = new Date();
  const seteDiasAtras = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const trintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Buscar todos os profiles com suas últimas apostas
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, saldo, saldo_bonus');

  if (!profiles || profiles.length === 0) {
    return {
      inativos_7_dias: 0,
      inativos_30_dias: 0,
      nunca_apostaram: 0,
      com_saldo_parado: 0,
    };
  }

  const userIds = profiles.map((p) => p.id);

  // Buscar última aposta de cada usuário
  const { data: apostas } = await supabase
    .from('apostas')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  // Mapear última aposta por usuário
  const ultimaApostaMap = new Map<string, string>();
  apostas?.forEach((a) => {
    if (!ultimaApostaMap.has(a.user_id)) {
      ultimaApostaMap.set(a.user_id, a.created_at);
    }
  });

  let inativos7Dias = 0;
  let inativos30Dias = 0;
  let nuncaApostaram = 0;
  let comSaldoParado = 0;

  profiles.forEach((profile) => {
    const ultimaAposta = ultimaApostaMap.get(profile.id);
    const saldoTotal = (Number(profile.saldo) || 0) + (Number(profile.saldo_bonus) || 0);

    if (!ultimaAposta) {
      // Nunca apostou
      nuncaApostaram++;
      inativos7Dias++;
      inativos30Dias++;
      if (saldoTotal > 0) {
        comSaldoParado++;
      }
    } else {
      // Verificar inatividade
      if (ultimaAposta < seteDiasAtras) {
        inativos7Dias++;
        if (saldoTotal > 0) {
          comSaldoParado++;
        }
      }
      if (ultimaAposta < trintaDiasAtras) {
        inativos30Dias++;
      }
    }
  });

  return {
    inativos_7_dias: inativos7Dias,
    inativos_30_dias: inativos30Dias,
    nunca_apostaram: nuncaApostaram,
    com_saldo_parado: comSaldoParado,
  };
}

// =============================================
// GET INACTIVE LEADS (PAGINATED)
// =============================================

export async function getInactiveLeads(
  params: InactiveLeadsParams = {}
): Promise<InactiveLeadsResult> {
  const supabase = await createClient();

  const {
    page = 1,
    pageSize = 20,
    diasInatividade = 7,
    tipoFiltro = 'todos',
    orderBy = 'dias_inativo',
    orderDir = 'desc',
  } = params;

  const now = new Date();
  const dataLimite = new Date(now.getTime() - diasInatividade * 24 * 60 * 60 * 1000).toISOString();

  // Buscar todos os profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nome, cpf, telefone, saldo, saldo_bonus, created_at, last_login');

  if (!profiles || profiles.length === 0) {
    return { leads: [], total: 0, page, pageSize };
  }

  const userIds = profiles.map((p) => p.id);

  // Buscar última aposta e último depósito em paralelo
  const [apostasResult, depositosResult, apostasCountResult] = await Promise.all([
    // Última aposta de cada usuário
    supabase
      .from('apostas')
      .select('user_id, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
    // Último depósito pago de cada usuário
    supabase
      .from('pagamentos')
      .select('user_id, paid_at')
      .in('user_id', userIds)
      .eq('status', 'PAID')
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false }),
    // Contagem de apostas por usuário
    supabase
      .from('apostas')
      .select('user_id')
      .in('user_id', userIds),
  ]);

  // Mapear última aposta por usuário
  const ultimaApostaMap = new Map<string, string>();
  apostasResult.data?.forEach((a) => {
    if (!ultimaApostaMap.has(a.user_id)) {
      ultimaApostaMap.set(a.user_id, a.created_at);
    }
  });

  // Mapear último depósito por usuário
  const ultimoDepositoMap = new Map<string, string>();
  depositosResult.data?.forEach((d) => {
    if (!ultimoDepositoMap.has(d.user_id) && d.paid_at) {
      ultimoDepositoMap.set(d.user_id, d.paid_at);
    }
  });

  // Contar apostas por usuário
  const apostasCountMap = new Map<string, number>();
  apostasCountResult.data?.forEach((a) => {
    apostasCountMap.set(a.user_id, (apostasCountMap.get(a.user_id) || 0) + 1);
  });

  // Processar leads inativos
  let leads: InactiveLead[] = profiles
    .map((profile) => {
      const ultimaAposta = ultimaApostaMap.get(profile.id) || null;
      const ultimoDeposito = ultimoDepositoMap.get(profile.id) || null;
      const totalApostas = apostasCountMap.get(profile.id) || 0;
      const saldo = Number(profile.saldo) || 0;
      const saldoBonus = Number(profile.saldo_bonus) || 0;

      // Calcular dias de inatividade
      let diasInativo = 0;
      if (ultimaAposta) {
        const diff = now.getTime() - new Date(ultimaAposta).getTime();
        diasInativo = Math.floor(diff / (24 * 60 * 60 * 1000));
      } else {
        // Se nunca apostou, calcular desde o cadastro
        const diff = now.getTime() - new Date(profile.created_at).getTime();
        diasInativo = Math.floor(diff / (24 * 60 * 60 * 1000));
      }

      return {
        id: profile.id,
        nome: profile.nome,
        cpf: profile.cpf,
        telefone: profile.telefone,
        saldo,
        saldo_bonus: saldoBonus,
        created_at: profile.created_at,
        last_login: profile.last_login,
        ultima_aposta: ultimaAposta,
        ultimo_deposito: ultimoDeposito,
        dias_inativo: diasInativo,
        total_apostas: totalApostas,
      };
    })
    .filter((lead) => {
      // Filtrar por inatividade
      const isInativo = !lead.ultima_aposta || lead.ultima_aposta < dataLimite;
      if (!isInativo) return false;

      // Filtrar por tipo
      const saldoTotal = lead.saldo + lead.saldo_bonus;
      switch (tipoFiltro) {
        case 'com_saldo':
          return saldoTotal > 0;
        case 'sem_saldo':
          return saldoTotal === 0;
        case 'nunca_apostou':
          return lead.total_apostas === 0;
        default:
          return true;
      }
    });

  // Ordenar
  leads.sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (orderBy) {
      case 'nome':
        aValue = a.nome.toLowerCase();
        bValue = b.nome.toLowerCase();
        break;
      case 'saldo':
        aValue = a.saldo + a.saldo_bonus;
        bValue = b.saldo + b.saldo_bonus;
        break;
      case 'ultima_aposta':
        aValue = a.ultima_aposta || '1970-01-01';
        bValue = b.ultima_aposta || '1970-01-01';
        break;
      case 'dias_inativo':
      default:
        aValue = a.dias_inativo;
        bValue = b.dias_inativo;
        break;
    }

    if (orderDir === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const total = leads.length;
  const offset = (page - 1) * pageSize;
  leads = leads.slice(offset, offset + pageSize);

  return {
    leads,
    total,
    page,
    pageSize,
  };
}

// =============================================
// INACTIVITY CONFIG (using system_settings)
// =============================================

export async function getInactivityConfig(): Promise<InactivityConfig> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['inactive_leads_threshold_days', 'inactive_leads_with_balance_alert']);

  const settings: Record<string, string> = {};
  data?.forEach((s) => {
    settings[s.key] = s.value || '';
  });

  return {
    threshold_days: parseInt(settings['inactive_leads_threshold_days'] || '7', 10),
    with_balance_alert: settings['inactive_leads_with_balance_alert'] === 'true',
  };
}

export async function updateInactivityConfig(
  config: Partial<InactivityConfig>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const updates: { key: string; value: string; category: string; description: string }[] = [];

  if (config.threshold_days !== undefined) {
    updates.push({
      key: 'inactive_leads_threshold_days',
      value: String(config.threshold_days),
      category: 'leads',
      description: 'Número de dias para considerar um lead como inativo',
    });
  }

  if (config.with_balance_alert !== undefined) {
    updates.push({
      key: 'inactive_leads_with_balance_alert',
      value: String(config.with_balance_alert),
      category: 'leads',
      description: 'Alertar sobre leads inativos com saldo',
    });
  }

  for (const update of updates) {
    const { error } = await supabase
      .from('system_settings')
      .upsert(
        {
          key: update.key,
          value: update.value,
          category: update.category,
          description: update.description,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}
