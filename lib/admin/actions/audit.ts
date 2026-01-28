'use server';

import { createClient } from '@/lib/supabase/server';

// =============================================
// TIPOS
// =============================================

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  entity: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  location: {
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    isp?: string;
  };
  created_at: string;
}

export interface AuditLogsListParams {
  page?: number;
  pageSize?: number;
  action?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogsListResult {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================
// FUNCOES
// =============================================

/**
 * Busca logs de auditoria com paginação e filtros
 */
export async function getAuditLogs(params: AuditLogsListParams = {}): Promise<AuditLogsListResult> {
  const supabase = await createClient();
  const { page = 1, pageSize = 50, action, search, startDate, endDate } = params;
  const offset = (page - 1) * pageSize;

  // Query base
  let query = supabase
    .from('audit_logs')
    .select(`
      id,
      actor_id,
      action,
      entity,
      details,
      ip_address,
      location,
      created_at
    `, { count: 'exact' });

  // Filtros
  if (action) {
    query = query.eq('action', action);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  // Ordenação e paginação
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return { logs: [], total: 0, page, pageSize };
  }

  // Buscar nomes dos atores
  const actorIds = [...new Set((data || []).map(log => log.actor_id).filter(Boolean))];

  let actorsMap: Record<string, { nome: string; email: string }> = {};

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nome')
      .in('id', actorIds);

    const { data: users } = await supabase.auth.admin.listUsers();

    if (profiles) {
      profiles.forEach(p => {
        const user = users?.users?.find(u => u.id === p.id);
        actorsMap[p.id] = {
          nome: p.nome || 'Usuário',
          email: user?.email || 'N/A',
        };
      });
    }
  }

  // Mapear logs com informações do ator
  const logs: AuditLog[] = (data || []).map(log => ({
    id: log.id,
    actor_id: log.actor_id,
    actor_name: log.actor_id ? actorsMap[log.actor_id]?.nome || 'Usuário' : 'Sistema',
    actor_email: log.actor_id ? actorsMap[log.actor_id]?.email || null : null,
    action: log.action,
    entity: log.entity,
    details: log.details || {},
    ip_address: log.ip_address,
    location: log.location || {},
    created_at: log.created_at,
  }));

  // Filtro de busca por nome/email (client-side por simplicidade)
  let filteredLogs = logs;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredLogs = logs.filter(
      log =>
        log.actor_name?.toLowerCase().includes(searchLower) ||
        log.actor_email?.toLowerCase().includes(searchLower) ||
        log.entity?.toLowerCase().includes(searchLower) ||
        log.ip_address?.includes(search)
    );
  }

  return { logs: filteredLogs, total: count || 0, page, pageSize };
}

/**
 * Lista tipos de ação únicos para filtro
 */
export async function getAuditActionTypes(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .select('action')
    .order('action');

  if (error) {
    console.error('Error fetching action types:', error);
    return [];
  }

  // Retornar ações únicas
  const uniqueActions = [...new Set((data || []).map(d => d.action))];
  return uniqueActions;
}

/**
 * Busca estatísticas de auditoria
 */
export async function getAuditStats(): Promise<{
  totalLogs: number;
  todayLogs: number;
  uniqueActors: number;
  topActions: { action: string; count: number }[];
}> {
  const supabase = await createClient();

  // Total de logs
  const { count: totalLogs } = await supabase
    .from('audit_logs')
    .select('id', { count: 'exact', head: true });

  // Logs de hoje
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: todayLogs } = await supabase
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  // Atores únicos (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: actorsData } = await supabase
    .from('audit_logs')
    .select('actor_id')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .not('actor_id', 'is', null);

  const uniqueActors = new Set((actorsData || []).map(a => a.actor_id)).size;

  // Top ações (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: actionsData } = await supabase
    .from('audit_logs')
    .select('action')
    .gte('created_at', sevenDaysAgo.toISOString());

  const actionCounts: Record<string, number> = {};
  (actionsData || []).forEach(a => {
    actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
  });

  const topActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalLogs: totalLogs || 0,
    todayLogs: todayLogs || 0,
    uniqueActors,
    topActions,
  };
}
