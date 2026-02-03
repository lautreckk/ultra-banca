'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';
import {
  getInactiveLeadsStats,
  getInactiveLeads,
  getInactivityConfig,
  updateInactivityConfig,
  type InactiveLead,
  type InactiveLeadsStats,
  type InactivityConfig,
} from '@/lib/admin/actions/inactive-leads';
import {
  UserX,
  Users,
  Wallet,
  Calendar,
  Phone,
  Eye,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// =============================================
// STAT CARD COMPONENT
// =============================================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'amber' | 'red' | 'emerald' | 'indigo';
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  };

  const iconColorClasses = {
    amber: 'text-amber-400',
    red: 'text-red-400',
    emerald: 'text-emerald-400',
    indigo: 'text-indigo-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value.toLocaleString('pt-BR')}</p>
          {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-zinc-800/50 ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// =============================================
// CONFIG MODAL COMPONENT
// =============================================

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InactivityConfig;
  onSave: (config: Partial<InactivityConfig>) => Promise<void>;
}

function ConfigModal({ isOpen, onClose, config, onSave }: ConfigModalProps) {
  const [thresholdDays, setThresholdDays] = useState(config.threshold_days);
  const [withBalanceAlert, setWithBalanceAlert] = useState(config.with_balance_alert);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setThresholdDays(config.threshold_days);
    setWithBalanceAlert(config.with_balance_alert);
  }, [config]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        threshold_days: thresholdDays,
        with_balance_alert: withBalanceAlert,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1f2937] rounded-xl shadow-2xl border border-zinc-800/50">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-semibold text-white">Configurar Alertas</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Dias para considerar inativo
            </label>
            <Input
              type="number"
              min={1}
              max={365}
              value={thresholdDays}
              onChange={(e) => setThresholdDays(parseInt(e.target.value) || 7)}
              className="bg-gray-700 border-zinc-800 text-white"
            />
            <p className="text-xs text-zinc-500">
              Usuários sem apostas neste período serão listados como inativos
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={withBalanceAlert}
                onChange={(e) => setWithBalanceAlert(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-300">
                Destacar usuários com saldo parado
              </span>
            </label>
            <p className="text-xs text-zinc-500 ml-7">
              Usuários inativos que possuem saldo terão destaque especial
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-zinc-800/50">
          <Button
            variant="outline"
            className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="teal"
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// LEAD CARD COMPONENT (Mobile)
// =============================================

interface LeadCardProps {
  lead: InactiveLead;
  onView: (lead: InactiveLead) => void;
  onWhatsApp: (lead: InactiveLead) => void;
}

function LeadCard({ lead, onView, onWhatsApp }: LeadCardProps) {
  const formatCPF = (cpf: string) =>
    cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const saldoTotal = lead.saldo + lead.saldo_bonus;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
            <UserX className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <p className="font-medium text-white">{lead.nome}</p>
            <p className="text-sm text-zinc-400">{formatCPF(lead.cpf)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {lead.telefone && (
            <button
              onClick={() => onWhatsApp(lead)}
              className="p-2 rounded-xl hover:bg-green-500/20 text-green-400 transition-colors"
              title="Enviar WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onView(lead)}
            className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Ver perfil"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Saldo</p>
          <p className={`font-medium ${saldoTotal > 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
            {formatCurrency(saldoTotal)}
          </p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Dias Inativo</p>
          <p className={`font-medium ${lead.dias_inativo > 30 ? 'text-red-400' : 'text-zinc-300'}`}>
            {lead.dias_inativo} dias
          </p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Última Aposta</p>
          <p className="text-zinc-300 font-medium">{formatDate(lead.ultima_aposta)}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Último Login</p>
          <p className="text-zinc-300 font-medium">{formatDate(lead.last_login)}</p>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN PAGE COMPONENT
// =============================================

export default function LeadsInativosPage() {
  const [stats, setStats] = useState<InactiveLeadsStats | null>(null);
  const [leads, setLeads] = useState<InactiveLead[]>([]);
  const [config, setConfig] = useState<InactivityConfig>({ threshold_days: 7, with_balance_alert: true });
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Filtros
  const [diasInatividade, setDiasInatividade] = useState<number | 'all'>(7);
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'com_saldo' | 'sem_saldo' | 'nunca_apostou'>('todos');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, leadsData, configData] = await Promise.all([
        getInactiveLeadsStats(),
        getInactiveLeads({ page, pageSize, diasInatividade, tipoFiltro }),
        getInactivityConfig(),
      ]);
      setStats(statsData);
      setLeads(leadsData.leads);
      setTotal(leadsData.total);
      setConfig(configData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, diasInatividade, tipoFiltro]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveConfig = async (newConfig: Partial<InactivityConfig>) => {
    await updateInactivityConfig(newConfig);
    setConfig((prev) => ({ ...prev, ...newConfig }));
    fetchData();
  };

  const handleView = (lead: InactiveLead) => {
    window.location.href = `/admin/clientes/${lead.id}`;
  };

  const handleWhatsApp = (lead: InactiveLead) => {
    if (lead.telefone) {
      const phone = lead.telefone.replace(/\D/g, '');
      const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
      window.open(`https://wa.me/${phoneWithCountry}`, '_blank');
    }
  };

  const formatCPF = (cpf: string) =>
    cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Leads Inativos</h1>
          <p className="text-sm md:text-base text-zinc-400">
            Usuários sem atividade recente na plataforma
          </p>
        </div>
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 w-full sm:w-auto"
          onClick={() => setIsConfigOpen(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Inativos 7+ dias"
            value={stats.inativos_7_dias}
            icon={<Clock className="h-5 w-5" />}
            color="amber"
            subtitle="Sem apostas na última semana"
          />
          <StatCard
            title="Nunca apostaram"
            value={stats.nunca_apostaram}
            icon={<UserX className="h-5 w-5" />}
            color="red"
            subtitle="Cadastrados sem apostas"
          />
          <StatCard
            title="Saldo parado"
            value={stats.com_saldo_parado}
            icon={<Wallet className="h-5 w-5" />}
            color="emerald"
            subtitle="Inativos com saldo disponível"
          />
          <StatCard
            title="Inativos 30+ dias"
            value={stats.inativos_30_dias}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="indigo"
            subtitle="Sem apostas no último mês"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 mb-1 block">Período de Inatividade</label>
          <select
            value={diasInatividade}
            onChange={(e) => {
              const value = e.target.value;
              setDiasInatividade(value === 'all' ? 'all' : parseInt(value));
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value={7}>7+ dias</option>
            <option value={15}>15+ dias</option>
            <option value={30}>30+ dias</option>
            <option value={60}>60+ dias</option>
            <option value={90}>90+ dias</option>
            <option value="all">Todo o tempo</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-zinc-500 mb-1 block">Tipo</label>
          <select
            value={tipoFiltro}
            onChange={(e) => {
              setTipoFiltro(e.target.value as typeof tipoFiltro);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="todos">Todos</option>
            <option value="com_saldo">Com saldo</option>
            <option value="sem_saldo">Sem saldo</option>
            <option value="nunca_apostou">Nunca apostou</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="mt-2 text-zinc-400">Carregando...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <UserX className="h-12 w-12 mx-auto mb-3 text-zinc-600" />
          <p>Nenhum lead inativo encontrado com os filtros selecionados</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onView={handleView}
                onWhatsApp={handleWhatsApp}
              />
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-zinc-900/50 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Última Aposta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Dias Inativo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider w-24">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {leads.map((lead) => {
                    const saldoTotal = lead.saldo + lead.saldo_bonus;
                    return (
                      <tr key={lead.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <span className="font-medium text-white">{lead.nome}</span>
                            <p className="text-xs text-zinc-400">{formatCPF(lead.cpf)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">
                          {lead.telefone || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">
                          {formatDate(lead.ultima_aposta)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">
                          {formatDate(lead.last_login)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={saldoTotal > 0 ? 'text-amber-400 font-medium' : 'text-zinc-300'}>
                            {formatCurrency(saldoTotal)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                              lead.dias_inativo > 30
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : lead.dias_inativo > 14
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                            }`}
                          >
                            {lead.dias_inativo} dias
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            {lead.telefone && (
                              <button
                                onClick={() => handleWhatsApp(lead)}
                                className="p-1.5 rounded-xl hover:bg-green-500/20 text-green-400 transition-colors"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleView(lead)}
                              className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                              title="Ver perfil"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm text-zinc-400 text-center sm:text-left">
              Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, total)} de{' '}
              {total} registros
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-sm transition-colors ${
                          page === pageNum
                            ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Config Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
