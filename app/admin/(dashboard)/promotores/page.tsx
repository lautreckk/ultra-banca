'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';
import {
  getPromotores,
  createPromotor,
  updatePromotor,
  addBonusToPromotor,
  resetPromotorPassword,
  getComissaoAutomaticaSetting,
  updateComissaoAutomaticaSetting,
  type Promotor,
  type CreatePromotorData,
  type UpdatePromotorData,
} from '@/lib/admin/actions/promotores';
import {
  Eye,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
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
  Plus,
  ToggleLeft,
  ToggleRight,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// =============================================
// CREATE/EDIT MODAL
// =============================================

interface PromotorModalProps {
  promotor: Promotor | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePromotorData | UpdatePromotorData, id?: string) => Promise<{ success: boolean; error?: string }>;
}

function PromotorModal({ promotor, isOpen, onClose, onSave }: PromotorModalProps) {
  const isEdit = !!promotor;
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [codigoAfiliado, setCodigoAfiliado] = useState('');
  const [comissaoDeposito, setComissaoDeposito] = useState('');
  const [comissaoPerda, setComissaoPerda] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (promotor) {
      setNome(promotor.nome);
      setEmail(promotor.email);
      setTelefone(promotor.telefone || '');
      setSenha('');
      setCodigoAfiliado(promotor.codigo_afiliado);
      setComissaoDeposito(promotor.comissao_deposito_percentual?.toString() || '');
      setComissaoPerda(promotor.comissao_perda_percentual?.toString() || '');
      setAtivo(promotor.ativo);
      setError('');
    } else {
      setNome('');
      setEmail('');
      setTelefone('');
      setSenha('');
      setCodigoAfiliado('');
      setComissaoDeposito('');
      setComissaoPerda('');
      setAtivo(true);
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

    if (!isEdit) {
      if (!email.trim()) {
        setError('Email é obrigatório');
        return;
      }
      if (!senha || senha.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        const data: UpdatePromotorData = {
          nome,
          telefone: telefone || undefined,
          comissao_deposito_percentual: comissaoDeposito ? parseFloat(comissaoDeposito) : null,
          comissao_perda_percentual: comissaoPerda ? parseFloat(comissaoPerda) : null,
          ativo,
        };
        const result = await onSave(data, promotor.id);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || 'Erro ao salvar');
        }
      } else {
        const data: CreatePromotorData = {
          nome,
          email,
          telefone: telefone || undefined,
          senha,
          codigo_afiliado: codigoAfiliado || undefined,
          comissao_deposito_percentual: comissaoDeposito ? parseFloat(comissaoDeposito) : undefined,
          comissao_perda_percentual: comissaoPerda ? parseFloat(comissaoPerda) : undefined,
        };
        const result = await onSave(data);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || 'Erro ao criar promotor');
        }
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
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? 'Editar Promotor' : 'Novo Promotor'}
          </h2>
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

          {/* Nome */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nome *</label>
            <Input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do promotor"
              className="bg-gray-700 border-zinc-800 text-white"
            />
          </div>

          {/* Email (apenas no create) */}
          {!isEdit && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="pl-10 bg-gray-700 border-zinc-800 text-white"
                />
              </div>
            </div>
          )}

          {/* Telefone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="pl-10 bg-gray-700 border-zinc-800 text-white"
              />
            </div>
          </div>

          {/* Senha (apenas no create) */}
          {!isEdit && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Senha *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 bg-gray-700 border-zinc-800 text-white"
                />
              </div>
            </div>
          )}

          {/* Código de Afiliado (apenas no create) */}
          {!isEdit && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Código de Afiliado</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  value={codigoAfiliado}
                  onChange={(e) => setCodigoAfiliado(e.target.value.toUpperCase())}
                  placeholder="Deixe vazio para gerar automaticamente"
                  className="pl-10 bg-gray-700 border-zinc-800 text-white uppercase"
                />
              </div>
            </div>
          )}

          <div className="border-t border-zinc-700 my-4" />

          {/* Comissões */}
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
                  placeholder="0.00"
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
                  placeholder="0.00"
                  className="pl-10 bg-gray-700 border-zinc-800 text-white"
                />
              </div>
            </div>
          </div>

          {/* Status (apenas no edit) */}
          {isEdit && (
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
          )}
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
  promotor: Promotor | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (promotorId: string, valor: number, motivo?: string) => Promise<{ success: boolean; error?: string }>;
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

  if (!isOpen || !promotor) return null;

  const handleSave = async () => {
    setError('');

    const valorNum = parseFloat(valor);
    if (!valorNum || valorNum <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }

    setIsSaving(true);
    try {
      const result = await onSave(promotor.id, valorNum, motivo || undefined);
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
            <p className="text-sm text-zinc-400">Promotor</p>
            <p className="font-medium text-white">{promotor.nome}</p>
            <p className="text-sm text-zinc-400 mt-1">Saldo atual: {formatCurrency(promotor.saldo)}</p>
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
                placeholder="0.00"
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
// RESET PASSWORD MODAL
// =============================================

interface ResetPasswordModalProps {
  promotor: Promotor | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (promotorId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

function ResetPasswordModal({ promotor, isOpen, onClose, onSave }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !promotor) return null;

  const handleSave = async () => {
    setError('');

    if (newPassword.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsSaving(true);
    try {
      const result = await onSave(promotor.id, newPassword);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Erro ao redefinir senha');
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
          <h2 className="text-lg font-semibold text-white">Redefinir Senha</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-sm text-zinc-400">Promotor</p>
            <p className="font-medium text-white">{promotor.nome}</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nova Senha *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pl-10 bg-gray-700 border-zinc-800 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Confirmar Senha *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                className="pl-10 bg-gray-700 border-zinc-800 text-white"
              />
            </div>
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
// PROMOTOR CARD (Mobile)
// =============================================

interface PromotorCardProps {
  promotor: Promotor;
  onView: (promotor: Promotor) => void;
  onEdit: (promotor: Promotor) => void;
  onBonus: (promotor: Promotor) => void;
  onCopyLink: (codigo: string) => void;
}

function PromotorCard({ promotor, onView, onEdit, onBonus, onCopyLink }: PromotorCardProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            promotor.ativo ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
          }`}>
            <UserPlus className={`h-5 w-5 ${promotor.ativo ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <div>
            <p className="font-medium text-white">{promotor.nome}</p>
            <p className="text-sm text-zinc-400">{promotor.codigo_afiliado}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCopyLink(promotor.codigo_afiliado)}
            className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Copiar link"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onBonus(promotor)}
            className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-green-400 transition-colors"
            title="Adicionar bônus"
          >
            <DollarSign className="h-4 w-4" />
          </button>
          <button
            onClick={() => onView(promotor)}
            className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(promotor)}
            className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Dep. %</p>
          <p className="text-white font-medium">
            {promotor.comissao_deposito_percentual ? `${promotor.comissao_deposito_percentual}%` : '-'}
          </p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Perda %</p>
          <p className="text-white font-medium">
            {promotor.comissao_perda_percentual ? `${promotor.comissao_perda_percentual}%` : '-'}
          </p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Indicados</p>
          <p className="text-white font-medium">{promotor.total_indicados || 0}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Saldo</p>
          <p className="text-green-400 font-medium">{formatCurrency(promotor.saldo)}</p>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN PAGE
// =============================================

export default function AdminPromotoresPage() {
  const [promotores, setPromotores] = useState<Promotor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const pageSize = 10;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPromotor, setEditingPromotor] = useState<Promotor | null>(null);
  const [bonusPromotor, setBonusPromotor] = useState<Promotor | null>(null);
  const [resetPasswordPromotor, setResetPasswordPromotor] = useState<Promotor | null>(null);

  // Comissão automática
  const [comissaoAutomatica, setComissaoAutomatica] = useState(true);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchPromotores = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPromotores({
        page,
        pageSize,
        search,
        status: statusFilter,
      });
      setPromotores(result.promotores);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching promotores:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchConfig = useCallback(async () => {
    try {
      const value = await getComissaoAutomaticaSetting();
      setComissaoAutomatica(value);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  }, []);

  useEffect(() => {
    fetchPromotores();
  }, [fetchPromotores]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleToggleComissaoAutomatica = async () => {
    setIsUpdatingConfig(true);
    try {
      const result = await updateComissaoAutomaticaSetting(!comissaoAutomatica);
      if (result.success) {
        setComissaoAutomatica(!comissaoAutomatica);
      }
    } catch (error) {
      console.error('Error updating config:', error);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const handleCreateOrUpdate = async (
    data: CreatePromotorData | UpdatePromotorData,
    id?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (id) {
      const result = await updatePromotor(id, data as UpdatePromotorData);
      if (result.success) {
        fetchPromotores();
      }
      return result;
    } else {
      const result = await createPromotor(data as CreatePromotorData);
      if (result.success) {
        fetchPromotores();
      }
      return result;
    }
  };

  const handleBonus = async (
    promotorId: string,
    valor: number,
    motivo?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await addBonusToPromotor(promotorId, valor, motivo);
    if (result.success) {
      fetchPromotores();
    }
    return result;
  };

  const handleResetPassword = async (
    promotorId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    return await resetPromotorPassword(promotorId, newPassword);
  };

  const handleCopyLink = (codigo: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}?ref=${codigo}`;
    navigator.clipboard.writeText(link);
    setCopied(codigo);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleView = (promotor: Promotor) => {
    window.location.href = `/admin/promotores/${promotor.id}`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Promotores</h1>
          <p className="text-sm md:text-base text-zinc-400">Gerencie os promotores e suas comissões</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Promotor
        </Button>
      </div>

      {/* Config: Comissão Automática */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-medium text-white">Comissão Automática</p>
              <p className="text-sm text-zinc-400">
                {comissaoAutomatica
                  ? 'Comissão creditada automaticamente ao confirmar depósito'
                  : 'Comissão deve ser aprovada manualmente'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleComissaoAutomatica}
            disabled={isUpdatingConfig}
            className={`p-2 rounded-xl transition-colors ${
              comissaoAutomatica
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {isUpdatingConfig ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : comissaoAutomatica ? (
              <ToggleRight className="h-6 w-6" />
            ) : (
              <ToggleLeft className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome, email ou código..."
            className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'todos' | 'ativos' | 'inativos');
            setPage(1);
          }}
          className="px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="todos">Todos</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="mt-2 text-zinc-400">Carregando...</p>
        </div>
      ) : promotores.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">Nenhum promotor encontrado</p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Promotor
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {promotores.map((promotor) => (
              <PromotorCard
                key={promotor.id}
                promotor={promotor}
                onView={handleView}
                onEdit={(p) => setEditingPromotor(p)}
                onBonus={(p) => setBonusPromotor(p)}
                onCopyLink={handleCopyLink}
              />
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-zinc-900/50 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Dep. %</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Perda %</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Indicados</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Saldo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider w-32">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {promotores.map((promotor) => (
                    <tr key={promotor.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-white">{promotor.nome}</span>
                        <br />
                        <span className="text-xs text-zinc-400">{promotor.email}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono">{promotor.codigo_afiliado}</span>
                          <button
                            onClick={() => handleCopyLink(promotor.codigo_afiliado)}
                            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            title="Copiar link"
                          >
                            {copied === promotor.codigo_afiliado ? (
                              <Check className="h-3.5 w-3.5 text-green-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {promotor.comissao_deposito_percentual ? `${promotor.comissao_deposito_percentual}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {promotor.comissao_perda_percentual ? `${promotor.comissao_perda_percentual}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {promotor.total_indicados || 0}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-green-400">{formatCurrency(promotor.saldo)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          promotor.ativo
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {promotor.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setBonusPromotor(promotor)}
                            className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-green-400 transition-colors"
                            title="Adicionar bônus"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setResetPasswordPromotor(promotor)}
                            className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-yellow-400 transition-colors"
                            title="Redefinir senha"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/promotores/${promotor.id}`}
                            className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setEditingPromotor(promotor)}
                            className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="text-sm text-zinc-400 text-center sm:text-left">
                Mostrando {((page - 1) * pageSize) + 1} a{' '}
                {Math.min(page * pageSize, total)} de {total} registros
              </div>
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
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <PromotorModal
        promotor={editingPromotor}
        isOpen={isCreateModalOpen || !!editingPromotor}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPromotor(null);
        }}
        onSave={handleCreateOrUpdate}
      />

      <BonusModal
        promotor={bonusPromotor}
        isOpen={!!bonusPromotor}
        onClose={() => setBonusPromotor(null)}
        onSave={handleBonus}
      />

      <ResetPasswordModal
        promotor={resetPasswordPromotor}
        isOpen={!!resetPasswordPromotor}
        onClose={() => setResetPasswordPromotor(null)}
        onSave={handleResetPassword}
      />
    </div>
  );
}
