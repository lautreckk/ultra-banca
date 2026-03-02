'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, ConfirmModal, ToggleSwitch } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/utils/format-currency';
import {
  getBonusTiers,
  createBonusTier,
  updateBonusTier,
  deleteBonusTier,
  toggleBonusTierStatus,
  type BonusTier,
  type CarteiraType,
} from '@/lib/admin/actions/bonus-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, X, Info, Wallet, Gamepad2 } from 'lucide-react';

interface BonusTierFormData {
  deposito_minimo: string;
  bonus_percentual: string;
  bonus_maximo: string;
  carteira: CarteiraType;
  ativo: boolean;
}

const initialFormData: BonusTierFormData = {
  deposito_minimo: '',
  bonus_percentual: '',
  bonus_maximo: '',
  carteira: 'ambas',
  ativo: true,
};

const CARTEIRA_LABELS: Record<CarteiraType, string> = {
  tradicional: 'Loterias',
  cassino: 'Cassino',
  ambas: 'Ambas',
};

export default function AdminBonusDepositoPage() {
  const [tiers, setTiers] = useState<BonusTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BonusTierFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const pageSize = 20;

  const fetchTiers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getBonusTiers({ page, pageSize });
      setTiers(result.tiers);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching bonus tiers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleEdit = (tier: BonusTier) => {
    setEditingId(tier.id);
    setFormData({
      deposito_minimo: tier.deposito_minimo.toString(),
      bonus_percentual: tier.bonus_percentual.toString(),
      bonus_maximo: tier.bonus_maximo?.toString() || '',
      carteira: tier.carteira,
      ativo: tier.ativo,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const data = {
      deposito_minimo: parseFloat(formData.deposito_minimo),
      bonus_percentual: parseFloat(formData.bonus_percentual),
      bonus_maximo: formData.bonus_maximo ? parseFloat(formData.bonus_maximo) : null,
      carteira: formData.carteira,
      ativo: formData.ativo,
    };

    try {
      const result = editingId
        ? await updateBonusTier(editingId, data)
        : await createBonusTier(data);

      if (result.success) {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        fetchTiers();
      } else {
        alert(result.error || 'Erro ao salvar faixa de bônus');
      }
    } catch {
      alert('Erro ao salvar faixa de bônus');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteBonusTier(deleteModal.id);
      if (result.success) {
        fetchTiers();
      } else {
        alert(result.error || 'Erro ao deletar faixa de bônus');
      }
    } catch {
      alert('Erro ao deletar faixa de bônus');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const result = await toggleBonusTierStatus(id);
      if (result.success) {
        setTiers((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ativo: result.newStatus! } : t))
        );
      }
    } catch {
      alert('Erro ao alterar status');
    }
  };

  const columns: Column<BonusTier>[] = [
    {
      key: 'deposito_minimo',
      header: 'Depósito Mínimo',
      render: (value) => (
        <span className="font-medium text-white">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: 'bonus_percentual',
      header: 'Bônus (%)',
      render: (value) => (
        <span className="text-cyan-400 font-semibold">{value as number}%</span>
      ),
    },
    {
      key: 'bonus_maximo',
      header: 'Máximo',
      render: (value) => {
        if (!value) return <span className="text-zinc-500">Sem limite</span>;
        return <span className="text-green-400">{formatCurrency(value as number)}</span>;
      },
    },
    {
      key: 'carteira',
      header: 'Carteira',
      render: (value) => {
        const carteira = (value as CarteiraType) || 'ambas';
        const colors: Record<CarteiraType, string> = {
          tradicional: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
          cassino: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
          ambas: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
        };
        return (
          <span className={`text-xs px-2 py-1 rounded-full border ${colors[carteira]}`}>
            {CARTEIRA_LABELS[carteira]}
          </span>
        );
      },
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (value, row) => (
        <ToggleSwitch
          checked={value as boolean}
          onChange={() => handleToggleStatus(row.id)}
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-24',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-700/30 text-zinc-500 hover:text-white transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ open: true, id: row.id });
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-700/30 text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bônus de Depósito</h1>
          <p className="text-zinc-500">Configure as faixas de bônus por valor de depósito</p>
        </div>
        <Button variant="teal" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Faixa
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-[#1f2937] border border-cyan-500/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-zinc-300">
          <p className="font-medium text-cyan-400 mb-1">Como funciona:</p>
          <ul className="space-y-1 text-zinc-500">
            <li>• O bônus é creditado automaticamente na carteira configurada quando o depósito é aprovado.</li>
            <li>• <span className="text-cyan-400">Loterias</span>: credita em <code className="text-cyan-300 bg-zinc-800 px-1 rounded">saldo_bonus</code> (só para depósitos de loterias).</li>
            <li>• <span className="text-purple-400">Cassino</span>: credita em <code className="text-purple-300 bg-zinc-800 px-1 rounded">saldo_bonus_cassino</code> (só para depósitos de cassino).</li>
            <li>• <span className="text-amber-400">Ambas</span>: aplica para depósitos de qualquer carteira, creditando no bônus correspondente.</li>
            <li>• É aplicada a maior faixa em que o valor do depósito se encaixa (ex: depósito de R$80 usa a faixa de R$50).</li>
          </ul>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tiers}
        isLoading={isLoading}
        emptyMessage="Nenhuma faixa de bônus configurada"
        rowKey="id"
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
        }}
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative bg-[#1f2937] rounded-lg shadow-xl max-w-md w-full p-6">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData(initialFormData);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Editar Faixa de Bônus' : 'Nova Faixa de Bônus'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300">Depósito Mínimo (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.deposito_minimo}
                  onChange={(e) => setFormData({ ...formData, deposito_minimo: e.target.value })}
                  className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                  placeholder="Ex: 50.00"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Valor mínimo do depósito para ativar esta faixa
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300">Percentual de Bônus (%) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.bonus_percentual}
                  onChange={(e) => setFormData({ ...formData, bonus_percentual: e.target.value })}
                  className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                  placeholder="Ex: 70"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Percentual do depósito que será creditado como bônus
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300">Bônus Máximo (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.bonus_maximo}
                  onChange={(e) => setFormData({ ...formData, bonus_maximo: e.target.value })}
                  className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                  placeholder="Deixe vazio para sem limite"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Teto máximo do bônus (opcional)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">Carteira de Destino *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['tradicional', 'cassino', 'ambas'] as CarteiraType[]).map((tipo) => {
                    const isSelected = formData.carteira === tipo;
                    const icons: Record<CarteiraType, typeof Wallet> = {
                      tradicional: Wallet,
                      cassino: Gamepad2,
                      ambas: Wallet,
                    };
                    const Icon = icons[tipo];
                    const colors: Record<CarteiraType, string> = {
                      tradicional: isSelected ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400',
                      cassino: isSelected ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400',
                      ambas: isSelected ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400',
                    };
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setFormData({ ...formData, carteira: tipo })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${colors[tipo]}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{CARTEIRA_LABELS[tipo]}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Em qual carteira o bônus será creditado ao depositar
                </p>
              </div>

              <div>
                <ToggleSwitch
                  checked={formData.ativo}
                  onChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  label="Ativa"
                  description="A faixa estará disponível para aplicação"
                />
              </div>

              {/* Preview */}
              {formData.deposito_minimo && formData.bonus_percentual && (
                <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/40">
                  <p className="text-xs text-zinc-500 mb-2">Exemplo de cálculo:</p>
                  <p className="text-sm text-white">
                    Depósito de <span className="text-cyan-400">{formatCurrency(parseFloat(formData.deposito_minimo) || 0)}</span>
                    {' → '}
                    Bônus de <span className="text-green-400">
                      {formatCurrency(
                        Math.min(
                          (parseFloat(formData.deposito_minimo) || 0) * ((parseFloat(formData.bonus_percentual) || 0) / 100),
                          formData.bonus_maximo ? parseFloat(formData.bonus_maximo) : Infinity
                        )
                      )}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData(initialFormData);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="teal" fullWidth disabled={isSaving}>
                  {isSaving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Deletar Faixa de Bônus"
        message="Tem certeza que deseja deletar esta faixa de bônus? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
