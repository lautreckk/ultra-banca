'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/format-currency';
import {
  getPromotorById,
  getPromotorStats,
  getPromotorReferidos,
  getPromotorComissoes,
  updatePromotor,
  addBonusToPromotor,
  resetPromotorPassword,
  deletePromotor,
  type Promotor,
  type PromotorStats,
  type PromotorReferido,
  type PromotorComissao,
  type UpdatePromotorData,
} from '@/lib/admin/actions/promotores';
import {
  ArrowLeft,
  Edit,
  X,
  Loader2,
  UserPlus,
  Users,
  Wallet,
  Percent,
  Phone,
  Lock,
  Mail,
  Link as LinkIcon,
  Copy,
  Check,
  DollarSign,
  Trash2,
  ArrowDownToLine,
  TrendingDown,
  Gift,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// =============================================
// EDIT MODAL
// =============================================

interface EditModalProps {
  promotor: Promotor;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdatePromotorData) => Promise<{ success: boolean; error?: string }>;
}

function EditModal({ promotor, isOpen, onClose, onSave }: EditModalProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [comissaoDeposito, setComissaoDeposito] = useState('');
  const [comissaoPerda, setComissaoPerda] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (promotor && isOpen) {
      setNome(promotor.nome);
      setTelefone(promotor.telefone || '');
      setComissaoDeposito(promotor.comissao_deposito_percentual?.toString() || '');
      setComissaoPerda(promotor.comissao_perda_percentual?.toString() || '');
      setAtivo(promotor.ativo);
      setError('');
    }
  }, [promotor, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');

    if (!nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const data: UpdatePromotorData = {
        nome,
        telefone: telefone || undefined,
        comissao_deposito_percentual: comissaoDeposito ? parseFloat(comissaoDeposito) : null,
        comissao_perda_percentual: comissaoPerda ? parseFloat(comissaoPerda) : null,
        ativo,
      };
      const result = await onSave(data);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Erro ao salvar');
      }
    } catch (err) {
      setError('Erro inesperado');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#1f2937] rounded-xl shadow-2xl border border-zinc-800/50 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 sticky top-0 bg-[#1f2937] z-10">
          <h2 className="text-lg font-semibold text-white">Editar Promotor</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nome *</label>
            <Input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-gray-700 border-zinc-800 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="pl-10 bg-gray-700 border-zinc-800 text-white"
              />
            </div>
          </div>

          <div className="border-t border-zinc-700 my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">% Comissão Depósito</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={comissaoDeposito}
                  onChange={(e) => setComissaoDeposito(e.target.value)}
                  className="pl-10 bg-gray-700 border-zinc-800 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">% Comissão Perda</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={comissaoPerda}
                  onChange={(e) => setComissaoPerda(e.target.value)}
                  className="pl-10 bg-gray-700 border-zinc-800 text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Status</label>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                ativo
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}
            >
              <span>{ativo ? 'Ativo' : 'Inativo'}</span>
              {ativo ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-zinc-800/50 sticky bottom-0 bg-[#1f2937]">
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
// BONUS MODAL
// =============================================

interface BonusModalProps {
  promotor: Promotor;
  isOpen: boolean;
  onClose: () => void;
  onSave: (valor: number, motivo?: string) => Promise<{ success: boolean; error?: string }>;
}

function BonusModal({ promotor, isOpen, onClose, onSave }: BonusModalProps) {
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValor('');
      setMotivo('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');

    const valorNum = parseFloat(valor);
    if (!valorNum || valorNum <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }

    setIsSaving(true);
    try {
      const result = await onSave(valorNum, motivo || undefined);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Erro ao adicionar bônus');
      }
    } catch (err) {
      setError('Erro inesperado');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#1f2937] rounded-xl shadow-2xl border border-zinc-800/50">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-semibold text-white">Adicionar Bônus</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-sm text-zinc-400">Saldo atual</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(promotor.saldo)}</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Valor do Bônus (R$) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="pl-10 bg-gray-700 border-zinc-800 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Motivo (opcional)</label>
            <Input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Bônus de performance"
              className="bg-gray-700 border-zinc-800 text-white"
            />
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
            {isSaving ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// DELETE CONFIRM MODAL
// =============================================

interface DeleteModalProps {
  promotor: Promotor;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function DeleteModal({ promotor, isOpen, onClose, onConfirm }: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = confirmText.toLowerCase() === 'deletar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#1f2937] rounded-xl shadow-2xl border border-zinc-800/50">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-semibold text-red-400">Deletar Promotor</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <Trash2 className="h-12 w-12 text-red-400 mx-auto mb-2" />
            <p className="text-white font-medium">{promotor.nome}</p>
            <p className="text-sm text-zinc-400 mt-1">
              Esta ação é irreversível. Todos os dados do promotor serão perdidos.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              Digite &quot;deletar&quot; para confirmar
            </label>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="deletar"
              className="bg-gray-700 border-zinc-800 text-white"
            />
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
            variant="danger"
            className="flex-1"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? 'Deletando...' : 'Deletar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN PAGE
// =============================================

export default function PromotorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const promotorId = params.id as string;

  const [promotor, setPromotor] = useState<Promotor | null>(null);
  const [stats, setStats] = useState<PromotorStats | null>(null);
  const [referidos, setReferidos] = useState<PromotorReferido[]>([]);
  const [referidosTotal, setReferidosTotal] = useState(0);
  const [referidosPage, setReferidosPage] = useState(1);
  const [comissoes, setComissoes] = useState<PromotorComissao[]>([]);
  const [comissoesTotal, setComissoesTotal] = useState(0);
  const [comissoesPage, setComissoesPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const pageSize = 10;

  const fetchPromotor = useCallback(async () => {
    try {
      const data = await getPromotorById(promotorId);
      setPromotor(data);
    } catch (error) {
      console.error('Error fetching promotor:', error);
    }
  }, [promotorId]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getPromotorStats(promotorId);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [promotorId]);

  const fetchReferidos = useCallback(async () => {
    try {
      const result = await getPromotorReferidos(promotorId, { page: referidosPage, pageSize });
      setReferidos(result.referidos);
      setReferidosTotal(result.total);
    } catch (error) {
      console.error('Error fetching referidos:', error);
    }
  }, [promotorId, referidosPage]);

  const fetchComissoes = useCallback(async () => {
    try {
      const result = await getPromotorComissoes(promotorId, { page: comissoesPage, pageSize });
      setComissoes(result.comissoes);
      setComissoesTotal(result.total);
    } catch (error) {
      console.error('Error fetching comissoes:', error);
    }
  }, [promotorId, comissoesPage]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPromotor(), fetchStats()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchPromotor, fetchStats]);

  useEffect(() => {
    fetchReferidos();
  }, [fetchReferidos]);

  useEffect(() => {
    fetchComissoes();
  }, [fetchComissoes]);

  const handleCopyLink = () => {
    if (!promotor) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}?ref=${promotor.codigo_afiliado}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdate = async (data: UpdatePromotorData): Promise<{ success: boolean; error?: string }> => {
    const result = await updatePromotor(promotorId, data);
    if (result.success) {
      await fetchPromotor();
      await fetchStats();
    }
    return result;
  };

  const handleBonus = async (valor: number, motivo?: string): Promise<{ success: boolean; error?: string }> => {
    const result = await addBonusToPromotor(promotorId, valor, motivo);
    if (result.success) {
      await fetchPromotor();
      await fetchStats();
      await fetchComissoes();
    }
    return result;
  };

  const handleDelete = async () => {
    const result = await deletePromotor(promotorId);
    if (result.success) {
      router.push('/admin/promotores');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="mt-2 text-zinc-400">Carregando...</p>
      </div>
    );
  }

  if (!promotor) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Promotor não encontrado</p>
        <Link href="/admin/promotores" className="text-indigo-400 hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  const referidosTotalPages = Math.ceil(referidosTotal / pageSize);
  const comissoesTotalPages = Math.ceil(comissoesTotal / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/promotores"
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white">{promotor.nome}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                promotor.ativo
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {promotor.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-sm text-zinc-400">{promotor.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsBonusModalOpen(true)}
            className="border-zinc-700"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Bônus
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="border-zinc-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        </div>
      </div>

      {/* Link de Afiliado */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center">
            <LinkIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="font-medium text-white">Link de Afiliado</p>
            <p className="text-sm text-zinc-400">Código: {promotor.codigo_afiliado}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 font-mono text-sm text-zinc-300 truncate">
            {typeof window !== 'undefined' ? `${window.location.origin}?ref=${promotor.codigo_afiliado}` : `...?ref=${promotor.codigo_afiliado}`}
          </div>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="border-zinc-700"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-green-400" />
            <span className="text-xs text-zinc-400">Saldo</span>
          </div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(stats?.saldo_atual || 0)}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-zinc-400">Indicados</span>
          </div>
          <p className="text-xl font-bold text-white">{stats?.total_indicados || 0}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownToLine className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-400">Tot. Depositado</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats?.total_depositado || 0)}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-zinc-400">Tot. Apostado</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats?.total_apostado || 0)}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-zinc-400">Com. Depósito</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats?.total_comissoes_deposito || 0)}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-pink-400" />
            <span className="text-xs text-zinc-400">Bônus</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats?.total_comissoes_bonus || 0)}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Configuração */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-4">Configurações</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">% Comissão Depósito</span>
              <span className="text-white font-medium">
                {promotor.comissao_deposito_percentual ? `${promotor.comissao_deposito_percentual}%` : 'Não configurado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">% Comissão Perda</span>
              <span className="text-white font-medium">
                {promotor.comissao_perda_percentual ? `${promotor.comissao_perda_percentual}%` : 'Não configurado'}
              </span>
            </div>
            {promotor.telefone && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Telefone</span>
                <span className="text-white font-medium">{promotor.telefone}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Cadastrado em</span>
              <span className="text-white font-medium">{formatDate(promotor.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Últimas Comissões */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-4">Últimas Comissões</h3>
          {comissoes.length === 0 ? (
            <p className="text-zinc-400 text-sm">Nenhuma comissão registrada</p>
          ) : (
            <div className="space-y-2">
              {comissoes.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm text-white">{formatCurrency(c.valor_comissao)}</p>
                    <p className="text-xs text-zinc-400">
                      {c.tipo === 'deposito' ? 'Depósito' : c.tipo === 'perda' ? 'Perda' : 'Bônus'} - {c.user_nome}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(c.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Referidos Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Indicados ({referidosTotal})</h3>
        </div>
        {referidos.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            Nenhum indicado ainda
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Cadastro</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Depositado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Apostado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {referidos.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{r.nome}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatCPF(r.cpf)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-green-400">{formatCurrency(r.total_depositado)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatCurrency(r.total_apostado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {referidosTotalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-zinc-800">
                <span className="text-sm text-zinc-400">
                  Página {referidosPage} de {referidosTotalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReferidosPage(referidosPage - 1)}
                    disabled={referidosPage === 1}
                    className="border-zinc-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReferidosPage(referidosPage + 1)}
                    disabled={referidosPage === referidosTotalPages}
                    className="border-zinc-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comissões Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white">Histórico de Comissões ({comissoesTotal})</h3>
        </div>
        {comissoes.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            Nenhuma comissão registrada
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Valor Base</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">%</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {comissoes.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatDateTime(c.created_at)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.tipo === 'deposito'
                            ? 'bg-green-500/20 text-green-400'
                            : c.tipo === 'perda'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {c.tipo === 'deposito' ? 'Depósito' : c.tipo === 'perda' ? 'Perda' : 'Bônus'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{c.user_nome}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatCurrency(c.valor_base)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{c.percentual_aplicado}%</td>
                      <td className="px-4 py-3 text-sm text-green-400 font-medium">{formatCurrency(c.valor_comissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {comissoesTotalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-zinc-800">
                <span className="text-sm text-zinc-400">
                  Página {comissoesPage} de {comissoesTotalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComissoesPage(comissoesPage - 1)}
                    disabled={comissoesPage === 1}
                    className="border-zinc-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComissoesPage(comissoesPage + 1)}
                    disabled={comissoesPage === comissoesTotalPages}
                    className="border-zinc-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <EditModal
        promotor={promotor}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdate}
      />

      <BonusModal
        promotor={promotor}
        isOpen={isBonusModalOpen}
        onClose={() => setIsBonusModalOpen(false)}
        onSave={handleBonus}
      />

      <DeleteModal
        promotor={promotor}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
