'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, StatCard } from '@/components/admin/shared';
import { getAuditLogs, getAuditStats, type AuditLog } from '@/lib/admin/actions/audit';
import {
  Filter, Shield, Activity, Users, Clock, MapPin, ChevronDown, ChevronUp,
  Building2, UserCog, CreditCard, Gamepad2, Settings, Webhook
} from 'lucide-react';

// Ações da Banca (usuários)
const BANCA_ACTIONS = [
  'LOGIN', 'LOGOUT', 'SIGNUP', 'PASSWORD_RESET',
  'PIX_GENERATED', 'DEPOSIT_CREATED', 'DEPOSIT_CONFIRMED', 'DEPOSIT_FAILED',
  'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_PAID',
  'BET_PLACED', 'BET_WON', 'BET_CANCELLED',
];

// Ações do Admin (administradores)
const ADMIN_ACTIONS = [
  'LOGIN_ADMIN', 'MFA_ENABLED', 'MFA_DISABLED',
  'DEPOSIT_APPROVED', 'DEPOSIT_REJECTED',
  'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED',
  'USER_UPDATED', 'USER_BLOCKED', 'USER_UNBLOCKED',
  'BALANCE_ADJUSTED', 'BONUS_GRANTED', 'CONFIG_UPDATED',
  'GATEWAY_WEBHOOK_RECEIVED', 'GATEWAY_ERROR',
];

// Configuração de badges por tipo de ação
const actionConfig: Record<string, { label: string; color: string; icon?: string }> = {
  // Autenticação
  LOGIN: { label: 'Login', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '🔐' },
  LOGIN_ADMIN: { label: 'Login Admin', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: '🔐' },
  LOGOUT: { label: 'Logout', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: '👋' },
  SIGNUP: { label: 'Cadastro', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '👤' },
  PASSWORD_RESET: { label: 'Reset Senha', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: '🔑' },
  MFA_ENABLED: { label: 'MFA Ativado', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: '🛡️' },
  MFA_DISABLED: { label: 'MFA Desativado', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '⚠️' },

  // Financeiro - Depósitos
  PIX_GENERATED: { label: 'PIX Gerado', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: '💳' },
  DEPOSIT_CREATED: { label: 'Depósito Criado', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: '💳' },
  DEPOSIT_CONFIRMED: { label: 'Depósito Confirmado', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: '✅' },
  DEPOSIT_FAILED: { label: 'Depósito Falhou', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '❌' },
  DEPOSIT_APPROVED: { label: 'Depósito Aprovado', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: '✅' },
  DEPOSIT_REJECTED: { label: 'Depósito Rejeitado', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '❌' },

  // Financeiro - Saques
  WITHDRAWAL_REQUESTED: { label: 'Saque Solicitado', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: '💰' },
  WITHDRAWAL_APPROVED: { label: 'Saque Aprovado', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: '✅' },
  WITHDRAWAL_REJECTED: { label: 'Saque Rejeitado', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '❌' },
  WITHDRAWAL_PAID: { label: 'Saque Pago', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: '💸' },

  // Apostas
  BET_PLACED: { label: 'Aposta Realizada', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: '🎰' },
  BET_WON: { label: 'Aposta Ganha', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '🏆' },
  BET_CANCELLED: { label: 'Aposta Cancelada', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: '🚫' },

  // Admin
  USER_UPDATED: { label: 'Usuário Atualizado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '👤' },
  USER_BLOCKED: { label: 'Usuário Bloqueado', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '🚫' },
  USER_UNBLOCKED: { label: 'Usuário Desbloqueado', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: '✅' },
  BALANCE_ADJUSTED: { label: 'Saldo Ajustado', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: '💵' },
  BONUS_GRANTED: { label: 'Bônus Concedido', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: '🎁' },
  CONFIG_UPDATED: { label: 'Config Atualizada', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: '⚙️' },

  // Gateway
  GATEWAY_WEBHOOK_RECEIVED: { label: 'Webhook Recebido', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', icon: '📡' },
  GATEWAY_ERROR: { label: 'Erro Gateway', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '⚠️' },
};

type TabType = 'banca' | 'admin';

function ActionBadge({ action }: { action: string }) {
  const config = actionConfig[action] || { label: action, color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}>
      {config.icon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}

function DetailsAccordion({ details }: { details: Record<string, unknown> }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!details || Object.keys(details).length === 0) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  // Formatar detalhes de forma mais legível
  const formatValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      if (key.includes('valor') || key.includes('saldo') || key.includes('diferenca') || key.includes('bonus')) {
        return `R$ ${value.toFixed(2)}`;
      }
      return value.toString();
    }
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const importantKeys = ['valor', 'saldo_anterior', 'saldo_novo', 'diferenca_saldo', 'bonus_aplicado', 'user_name', 'gateway'];
  const importantDetails = Object.entries(details).filter(([key]) =>
    importantKeys.some(ik => key.includes(ik))
  );

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
        <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg text-xs space-y-1">
          {importantDetails.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-zinc-700">
              {importantDetails.map(([key, value]) => (
                <div key={key}>
                  <span className="text-gray-500">{key.replace(/_/g, ' ')}: </span>
                  <span className="text-gray-300">{formatValue(key, value)}</span>
                </div>
              ))}
            </div>
          )}
          <details className="pt-2">
            <summary className="text-gray-500 cursor-pointer hover:text-gray-400">JSON completo</summary>
            <pre className="mt-2 text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono text-[10px]">
              {JSON.stringify(details, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function AuditoriaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('banca');
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

  // Filtros rápidos por aba
  const bancaFilters = [
    { value: '', label: 'Todos', icon: Activity },
    { value: 'SIGNUP', label: 'Cadastros', icon: Users },
    { value: 'LOGIN', label: 'Logins', icon: Users },
    { value: 'PIX_GENERATED', label: 'PIX Gerado', icon: CreditCard },
    { value: 'DEPOSIT_CONFIRMED', label: 'Depósitos', icon: CreditCard },
    { value: 'WITHDRAWAL_REQUESTED', label: 'Saques', icon: CreditCard },
    { value: 'BET_PLACED', label: 'Apostas', icon: Gamepad2 },
  ];

  const adminFilters = [
    { value: '', label: 'Todos', icon: Activity },
    { value: 'LOGIN_ADMIN', label: 'Login Admin', icon: Shield },
    { value: 'WITHDRAWAL_APPROVED', label: 'Saques Aprovados', icon: CreditCard },
    { value: 'WITHDRAWAL_REJECTED', label: 'Saques Rejeitados', icon: CreditCard },
    { value: 'BALANCE_ADJUSTED', label: 'Ajustes Saldo', icon: CreditCard },
    { value: 'USER_UPDATED', label: 'Usuários', icon: UserCog },
    { value: 'CONFIG_UPDATED', label: 'Configs', icon: Settings },
    { value: 'GATEWAY_WEBHOOK_RECEIVED', label: 'Webhooks', icon: Webhook },
  ];

  const currentFilters = activeTab === 'banca' ? bancaFilters : adminFilters;

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAuditLogs({
        page,
        pageSize,
        action: actionFilter || undefined,
        search,
      });

      // Filtrar logs pela aba ativa
      const actionsForTab = activeTab === 'banca' ? BANCA_ACTIONS : ADMIN_ACTIONS;
      let filteredLogs = result.logs;

      // Se não há filtro de ação específico, filtrar pela aba
      if (!actionFilter) {
        filteredLogs = result.logs.filter(log => actionsForTab.includes(log.action));
      }

      setLogs(filteredLogs);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, actionFilter, activeTab]);

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

  // Reset filtros ao trocar de aba
  useEffect(() => {
    setActionFilter('');
    setPage(1);
  }, [activeTab]);

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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-400" />
          Auditoria do Sistema
        </h1>
        <p className="text-sm md:text-base text-gray-400">
          Rastreabilidade completa de ações no sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-0">
        <button
          onClick={() => setActiveTab('banca')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'banca'
              ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
              : 'text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Logs da Banca
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            activeTab === 'banca' ? 'bg-emerald-500/20' : 'bg-zinc-800'
          }`}>
            Usuários
          </span>
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
            activeTab === 'admin'
              ? 'text-indigo-400 border-indigo-400 bg-indigo-500/5'
              : 'text-gray-400 border-transparent hover:text-gray-200'
          }`}
        >
          <UserCog className="h-4 w-4" />
          Logs do Admin
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            activeTab === 'admin' ? 'bg-indigo-500/20' : 'bg-zinc-800'
          }`}>
            Administradores
          </span>
        </button>
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

      {/* Tab Description */}
      <div className={`p-3 rounded-lg text-sm ${
        activeTab === 'banca'
          ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-300'
          : 'bg-indigo-500/5 border border-indigo-500/20 text-indigo-300'
      }`}>
        {activeTab === 'banca' ? (
          <p>
            <strong>Logs da Banca:</strong> Ações dos usuários no sistema - cadastros, logins, depósitos, saques e apostas.
          </p>
        ) : (
          <p>
            <strong>Logs do Admin:</strong> Ações administrativas - aprovações, rejeições, ajustes de saldo e alterações de configuração.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filtrar:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.value}
                onClick={() => {
                  setActionFilter(filter.value);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  actionFilter === filter.value
                    ? activeTab === 'banca'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                <Icon className="h-3 w-3" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyMessage={`Nenhum log de ${activeTab === 'banca' ? 'usuário' : 'admin'} encontrado`}
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
