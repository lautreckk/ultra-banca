'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, StatCard } from '@/components/admin/shared';
import { getAuditLogs, getAuditStats, type AuditLog } from '@/lib/admin/actions/audit';
import { Filter, Shield, Activity, Users, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

// Configuração de badges por tipo de ação
const actionConfig: Record<string, { label: string; color: string }> = {
  // Autenticação
  LOGIN: { label: 'Login', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  LOGIN_ADMIN: { label: 'Login Admin', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  LOGOUT: { label: 'Logout', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  SIGNUP: { label: 'Cadastro', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  PASSWORD_RESET: { label: 'Reset Senha', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  MFA_ENABLED: { label: 'MFA Ativado', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  MFA_DISABLED: { label: 'MFA Desativado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },

  // Financeiro
  DEPOSIT_CREATED: { label: 'Depósito Criado', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  DEPOSIT_APPROVED: { label: 'Depósito Aprovado', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  DEPOSIT_REJECTED: { label: 'Depósito Rejeitado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  WITHDRAWAL_REQUESTED: { label: 'Saque Solicitado', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  WITHDRAWAL_APPROVED: { label: 'Saque Aprovado', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  WITHDRAWAL_REJECTED: { label: 'Saque Rejeitado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },

  // Apostas
  BET_PLACED: { label: 'Aposta Realizada', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  BET_WON: { label: 'Aposta Ganha', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  BET_CANCELLED: { label: 'Aposta Cancelada', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },

  // Admin
  USER_UPDATED: { label: 'Usuário Atualizado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  USER_BLOCKED: { label: 'Usuário Bloqueado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  USER_UNBLOCKED: { label: 'Usuário Desbloqueado', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  BALANCE_ADJUSTED: { label: 'Saldo Ajustado', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  CONFIG_UPDATED: { label: 'Config Atualizada', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
};

function ActionBadge({ action }: { action: string }) {
  const config = actionConfig[action] || { label: action, color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}

function DetailsAccordion({ details }: { details: Record<string, unknown> }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!details || Object.keys(details).length === 0) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {isOpen ? 'Ocultar' : 'Ver detalhes'}
      </button>
      {isOpen && (
        <div className="mt-2 p-2 bg-zinc-800/50 rounded-lg text-xs font-mono">
          <pre className="text-gray-300 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    uniqueActors: 0,
    topActions: [] as { action: string; count: number }[],
  });
  const pageSize = 20;

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAuditLogs({
        page,
        pageSize,
        action: actionFilter || undefined,
        search,
      });
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, actionFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getAuditStats();
      setStats(result);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Data/Hora',
      className: 'w-40',
      render: (value) => (
        <div className="text-sm">
          <p className="text-white">
            {new Date(value as string).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-gray-400 text-xs">
            {new Date(value as string).toLocaleTimeString('pt-BR')}
          </p>
        </div>
      ),
    },
    {
      key: 'actor_name',
      header: 'Quem',
      mobileHeader: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-white">{value as string || 'Sistema'}</p>
          {row.actor_email && (
            <p className="text-xs text-gray-400 truncate max-w-[150px]" title={row.actor_email}>
              {row.actor_email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Ação',
      render: (value) => <ActionBadge action={value as string} />,
    },
    {
      key: 'entity',
      header: 'Entidade',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-sm text-gray-300 font-mono">
          {(value as string) || '-'}
        </span>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP / Local',
      hideOnMobile: true,
      render: (value, row) => (
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-300 font-mono">{value as string || 'N/A'}</p>
            {row.location?.city && (
              <p className="text-xs text-gray-500">
                {row.location.city}, {row.location.region}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Detalhes',
      hideOnMobile: true,
      render: (value) => <DetailsAccordion details={value as Record<string, unknown>} />,
    },
  ];

  // Filtros rápidos de ações
  const quickFilters = [
    { value: '', label: 'Todas' },
    { value: 'LOGIN_ADMIN', label: 'Login Admin' },
    { value: 'WITHDRAWAL_APPROVED', label: 'Saques Aprovados' },
    { value: 'WITHDRAWAL_REJECTED', label: 'Saques Rejeitados' },
    { value: 'SIGNUP', label: 'Cadastros' },
    { value: 'LOGIN', label: 'Logins' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-400" />
          Auditoria
        </h1>
        <p className="text-sm md:text-base text-gray-400">
          Rastreabilidade completa de ações no sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Logs"
          value={stats.totalLogs.toLocaleString('pt-BR')}
          icon={Activity}
          variant="default"
        />
        <StatCard
          title="Hoje"
          value={stats.todayLogs.toLocaleString('pt-BR')}
          icon={Clock}
          variant="info"
        />
        <StatCard
          title="Usuários Ativos (30d)"
          value={stats.uniqueActors.toLocaleString('pt-BR')}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Top Ação (7d)"
          value={stats.topActions[0]?.action ? actionConfig[stats.topActions[0].action]?.label || stats.topActions[0].action : '-'}
          subtitle={stats.topActions[0]?.count ? `${stats.topActions[0].count} vezes` : undefined}
          icon={Shield}
          variant="warning"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filtrar:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setActionFilter(filter.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                actionFilter === filter.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyMessage="Nenhum log de auditoria encontrado"
        searchable
        searchPlaceholder="Buscar por nome, email ou IP..."
        onSearch={handleSearch}
        rowKey="id"
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
