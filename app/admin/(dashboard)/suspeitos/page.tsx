'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';
import {
  getSuspeitos,
  addSuspeito,
  updateSuspeito,
  deleteSuspeito,
  getSuspeitoDetails,
  searchUsersForSuspeito,
  type Suspeito,
  type SuspeitosListParams,
} from '@/lib/admin/actions/suspeitos';
import {
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Eye,
  Filter,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

// =============================================
// NIVEL HELPERS
// =============================================

const NIVEL_CONFIG = {
  A: { label: 'Alta', color: 'red', border: 'border-red-500', bg: 'bg-red-500/20', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  B: { label: 'Média', color: 'yellow', border: 'border-yellow-500', bg: 'bg-yellow-500/20', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  C: { label: 'Baixa', color: 'green', border: 'border-green-500', bg: 'bg-green-500/20', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
} as const;

// =============================================
// ADD/EDIT MODAL
// =============================================

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingSuspeito?: Suspeito | null;
}

function AddEditModal({ isOpen, onClose, onSave, editingSuspeito }: AddEditModalProps) {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; nome: string; cpf: string; saldo: number }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; nome: string; cpf: string } | null>(null);
  const [nivel, setNivel] = useState<'A' | 'B' | 'C'>('B');
  const [motivo, setMotivo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSuspeito) {
      setSelectedUser({ id: editingSuspeito.user_id, nome: editingSuspeito.user_nome, cpf: editingSuspeito.user_cpf });
      setNivel(editingSuspeito.nivel);
      setMotivo(editingSuspeito.motivo);
    } else {
      setSelectedUser(null);
      setNivel('B');
      setMotivo('');
      setSearchInput('');
      setSearchResults([]);
    }
    setError('');
  }, [editingSuspeito, isOpen]);

  useEffect(() => {
    if (editingSuspeito || !searchInput || searchInput.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchUsersForSuspeito(searchInput);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, editingSuspeito]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!editingSuspeito && !selectedUser) {
      setError('Selecione um usuário');
      return;
    }
    if (!motivo.trim()) {
      setError('Informe o motivo');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (editingSuspeito) {
        const result = await updateSuspeito(editingSuspeito.id, { nivel, motivo });
        if (!result.success) {
          setError(result.error || 'Erro ao atualizar');
          return;
        }
      } else {
        const result = await addSuspeito({
          user_id: selectedUser!.id,
          nivel,
          motivo,
        });
        if (!result.success) {
          setError(result.error || 'Erro ao adicionar');
          return;
        }
      }
      onSave();
      onClose();
    } catch {
      setError('Erro inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1f2937] rounded-xl shadow-2xl border border-zinc-800/50 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 sticky top-0 bg-[#1f2937] z-10">
          <h2 className="text-lg font-semibold text-white">
            {editingSuspeito ? 'Editar Suspeito' : 'Adicionar Suspeito'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* User selection */}
          {editingSuspeito ? (
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <p className="text-sm text-zinc-400">Usuário</p>
              <p className="font-medium text-white">{selectedUser?.nome}</p>
              <p className="text-sm text-zinc-400">{selectedUser?.cpf ? formatCPF(selectedUser.cpf) : ''}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Buscar Usuário</label>
              {selectedUser ? (
                <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-white">{selectedUser.nome}</p>
                    <p className="text-sm text-zinc-400">{formatCPF(selectedUser.cpf)}</p>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setSearchInput(''); }} className="text-zinc-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Buscar por nome ou CPF..."
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 animate-spin" />
                  )}
                  {searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => { setSelectedUser(user); setSearchResults([]); setSearchInput(''); }}
                          className="w-full text-left px-3 py-2 hover:bg-zinc-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          <p className="text-sm font-medium text-white">{user.nome}</p>
                          <p className="text-xs text-zinc-400">{formatCPF(user.cpf)} - Saldo: {formatCurrency(user.saldo)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nivel */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nível de Suspeita</label>
            <div className="grid grid-cols-3 gap-2">
              {(['A', 'B', 'C'] as const).map((n) => {
                const cfg = NIVEL_CONFIG[n];
                return (
                  <button
                    key={n}
                    onClick={() => setNivel(n)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      nivel === n
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {n} - {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Motivo</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da suspeita..."
              rows={3}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-zinc-800/50 sticky bottom-0 bg-[#1f2937]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// DETAILS PANEL
// =============================================

interface DetailsPanelProps {
  suspeito: Suspeito;
  onClose: () => void;
}

function DetailsPanel({ suspeito, onClose }: DetailsPanelProps) {
  const [details, setDetails] = useState<{
    ultimasApostas: Array<Record<string, unknown>>;
    depositos: Array<Record<string, unknown>>;
    saques: Array<Record<string, unknown>>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [suspeito.user_id]);

  const loadDetails = async () => {
    setIsLoading(true);
    const data = await getSuspeitoDetails(suspeito.user_id);
    setDetails(data);
    setIsLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const cfg = NIVEL_CONFIG[suspeito.nivel];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#1f2937] rounded-xl shadow-2xl border border-zinc-800/50 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 sticky top-0 bg-[#1f2937] z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
              <ShieldAlert className={`h-5 w-5 ${cfg.text}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{suspeito.user_nome}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                Nível {suspeito.nivel} - {cfg.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{formatCurrency(suspeito.user_saldo)}</p>
              <p className="text-xs text-zinc-400">Saldo</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{suspeito.total_apostas}</p>
              <p className="text-xs text-zinc-400">Apostas</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-400">{formatCurrency(suspeito.total_ganhos)}</p>
              <p className="text-xs text-zinc-400">Ganhos</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${suspeito.status === 'ativo' ? 'text-red-400' : 'text-green-400'}`}>
                {suspeito.status === 'ativo' ? 'Ativo' : 'Resolvido'}
              </p>
              <p className="text-xs text-zinc-400">Status</p>
            </div>
          </div>

          {/* Motivo */}
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-sm font-medium text-zinc-300 mb-1">Motivo</p>
            <p className="text-sm text-white">{suspeito.motivo}</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : details ? (
            <>
              {/* Winning bets */}
              {details.ultimasApostas.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-2">Apostas Premiadas ({details.ultimasApostas.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {details.ultimasApostas.map((a) => (
                      <div key={a.id as string} className="bg-zinc-800/50 rounded-lg p-2 flex items-center justify-between text-sm">
                        <div>
                          <span className="text-white font-medium">#{a.pule as string}</span>
                          <span className="text-zinc-400 ml-2">{(a.tipo as string).toUpperCase()} - {(a.modalidade as string)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-green-400 font-medium">{formatCurrency(Number(a.premio_valor))}</span>
                          <p className="text-xs text-zinc-500">{formatDate(a.created_at as string)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deposits */}
              {details.depositos.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-2">Depósitos ({details.depositos.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {details.depositos.map((d) => (
                      <div key={d.id as string} className="bg-zinc-800/50 rounded-lg p-2 flex items-center justify-between text-sm">
                        <div>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            d.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {d.status as string}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-medium">{formatCurrency(Number(d.valor))}</span>
                          <p className="text-xs text-zinc-500">{formatDate(d.created_at as string)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Withdrawals */}
              {details.saques.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-2">Saques ({details.saques.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {details.saques.map((s) => (
                      <div key={s.id as string} className="bg-zinc-800/50 rounded-lg p-2 flex items-center justify-between text-sm">
                        <div>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            s.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                            s.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {s.status as string}
                          </span>
                          <span className="text-zinc-400 ml-2 text-xs">{s.chave_pix as string}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-medium">{formatCurrency(Number(s.valor))}</span>
                          <p className="text-xs text-zinc-500">{formatDate(s.created_at as string)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {details.ultimasApostas.length === 0 && details.depositos.length === 0 && details.saques.length === 0 && (
                <p className="text-center text-zinc-400 py-4">Nenhum dado encontrado</p>
              )}
            </>
          ) : (
            <p className="text-center text-zinc-400 py-4">Erro ao carregar detalhes</p>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// SUSPECT CARD (Mobile)
// =============================================

interface SuspeitoCardProps {
  suspeito: Suspeito;
  onView: (s: Suspeito) => void;
  onEdit: (s: Suspeito) => void;
  onDelete: (s: Suspeito) => void;
  onToggleStatus: (s: Suspeito) => void;
}

function SuspeitoCard({ suspeito, onView, onEdit, onDelete, onToggleStatus }: SuspeitoCardProps) {
  const cfg = NIVEL_CONFIG[suspeito.nivel];
  const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  return (
    <div className={`bg-zinc-900/50 border-l-4 ${cfg.border} border border-zinc-800 rounded-xl p-4 space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
            <ShieldAlert className={`h-5 w-5 ${cfg.text}`} />
          </div>
          <div>
            <p className="font-medium text-white">{suspeito.user_nome}</p>
            <p className="text-sm text-zinc-400">{suspeito.user_cpf ? formatCPF(suspeito.user_cpf) : '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.badge}`}>
            {suspeito.nivel}
          </span>
          {suspeito.status === 'resolvido' && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-green-500/20 text-green-400 border-green-500/30 ml-1">
              Resolvido
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-zinc-300 line-clamp-2">{suspeito.motivo}</p>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Saldo</p>
          <p className="text-white font-medium">{formatCurrency(suspeito.user_saldo)}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Apostas</p>
          <p className="text-white font-medium">{suspeito.total_apostas}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Ganhos</p>
          <p className="text-green-400 font-medium">{formatCurrency(suspeito.total_ganhos)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button onClick={() => onView(suspeito)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-sm transition-colors">
          <Eye className="h-3.5 w-3.5" /> Detalhes
        </button>
        <button onClick={() => onEdit(suspeito)} className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={() => onToggleStatus(suspeito)} className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors" title={suspeito.status === 'ativo' ? 'Marcar como resolvido' : 'Reativar'}>
          {suspeito.status === 'ativo' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        </button>
        <button onClick={() => onDelete(suspeito)} className="p-2 rounded-xl hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================
// MAIN PAGE
// =============================================

export default function AdminSuspeitosPage() {
  const [suspeitos, setSuspeitos] = useState<Suspeito[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Filters
  const [nivelFiltro, setNivelFiltro] = useState<SuspeitosListParams['nivel']>('todos');
  const [statusFiltro, setStatusFiltro] = useState<SuspeitosListParams['status']>('ativo');
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = nivelFiltro !== 'todos' || statusFiltro !== 'ativo';

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSuspeito, setEditingSuspeito] = useState<Suspeito | null>(null);
  const [viewingSuspeito, setViewingSuspeito] = useState<Suspeito | null>(null);

  const fetchSuspeitos = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSuspeitos({
        page,
        pageSize,
        nivel: nivelFiltro,
        status: statusFiltro,
      });
      setSuspeitos(result.suspeitos);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching suspeitos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, nivelFiltro, statusFiltro]);

  useEffect(() => {
    fetchSuspeitos();
  }, [fetchSuspeitos]);

  const handleDelete = async (suspeito: Suspeito) => {
    if (!confirm(`Deseja remover ${suspeito.user_nome} da lista de suspeitos?`)) return;
    const result = await deleteSuspeito(suspeito.id);
    if (result.success) {
      fetchSuspeitos();
    }
  };

  const handleToggleStatus = async (suspeito: Suspeito) => {
    const newStatus = suspeito.status === 'ativo' ? 'resolvido' : 'ativo';
    const result = await updateSuspeito(suspeito.id, { status: newStatus });
    if (result.success) {
      fetchSuspeitos();
    }
  };

  const clearFilters = () => {
    setNivelFiltro('todos');
    setStatusFiltro('ativo');
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);
  const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            Suspeitos
          </h1>
          <p className="text-sm md:text-base text-zinc-400">Monitoramento de usuários suspeitos</p>
        </div>
        <button
          onClick={() => { setEditingSuspeito(null); setIsAddModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
            hasActiveFilters
              ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
              : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Nível</label>
                <select
                  value={nivelFiltro}
                  onChange={(e) => { setNivelFiltro(e.target.value as SuspeitosListParams['nivel']); setPage(1); }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="todos">Todos</option>
                  <option value="A">A - Alta Suspeita</option>
                  <option value="B">B - Média Suspeita</option>
                  <option value="C">C - Baixa Suspeita</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Status</label>
                <select
                  value={statusFiltro}
                  onChange={(e) => { setStatusFiltro(e.target.value as SuspeitosListParams['status']); setPage(1); }}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="todos">Todos</option>
                  <option value="ativo">Ativos</option>
                  <option value="resolvido">Resolvidos</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end">
                <button onClick={clearFilters} className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="mt-2 text-zinc-400">Carregando...</p>
        </div>
      ) : suspeitos.length === 0 ? (
        <div className="text-center py-12">
          <ShieldAlert className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">Nenhum suspeito encontrado</p>
          <p className="text-sm text-zinc-500 mt-1">Clique em &quot;Adicionar&quot; para monitorar um usuário</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {suspeitos.map((suspeito) => (
              <SuspeitoCard
                key={suspeito.id}
                suspeito={suspeito}
                onView={setViewingSuspeito}
                onEdit={(s) => { setEditingSuspeito(s); setIsAddModalOpen(true); }}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-zinc-900/50 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nível</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Saldo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Apostas</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Ganhos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Motivo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider w-32">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {suspeitos.map((suspeito) => {
                    const cfg = NIVEL_CONFIG[suspeito.nivel];
                    return (
                      <tr key={suspeito.id} className={`hover:bg-zinc-800/50 transition-colors border-l-4 ${cfg.border}`}>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full border text-xs font-medium ${cfg.badge}`}>
                            {suspeito.nivel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium text-white">{suspeito.user_nome}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">
                          {suspeito.user_cpf ? formatCPF(suspeito.user_cpf) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">
                          {formatCurrency(suspeito.user_saldo)}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">
                          {suspeito.total_apostas.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-green-400">{formatCurrency(suspeito.total_ganhos)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300 max-w-[200px] truncate" title={suspeito.motivo}>
                          {suspeito.motivo}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            suspeito.status === 'ativo'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {suspeito.status === 'ativo' ? 'Ativo' : 'Resolvido'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setViewingSuspeito(suspeito)}
                              className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setEditingSuspeito(suspeito); setIsAddModalOpen(true); }}
                              className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(suspeito)}
                              className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                              title={suspeito.status === 'ativo' ? 'Marcar como resolvido' : 'Reativar'}
                            >
                              {suspeito.status === 'ativo' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(suspeito)}
                              className="p-1.5 rounded-xl hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
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
              Mostrando {((page - 1) * pageSize) + 1} a{' '}
              {Math.min(page * pageSize, total)} de {total} registros
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

      {/* Modals */}
      <AddEditModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingSuspeito(null); }}
        onSave={fetchSuspeitos}
        editingSuspeito={editingSuspeito}
      />

      {viewingSuspeito && (
        <DetailsPanel
          suspeito={viewingSuspeito}
          onClose={() => setViewingSuspeito(null)}
        />
      )}
    </div>
  );
}
