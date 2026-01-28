'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, StatusBadge, ConfirmModal, ToggleSwitch } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/utils/format-currency';
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  type Promotion,
} from '@/lib/admin/actions/promotions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface PromotionFormData {
  titulo: string;
  descricao: string;
  tipo: string;
  valor: string;
  percentual: string;
  valor_minimo: string;
  valor_maximo: string;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
}

const initialFormData: PromotionFormData = {
  titulo: '',
  descricao: '',
  tipo: 'bonus_deposito',
  valor: '',
  percentual: '',
  valor_minimo: '0',
  valor_maximo: '',
  data_inicio: new Date().toISOString().split('T')[0],
  data_fim: '',
  ativo: true,
};

export default function AdminPromocoesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const pageSize = 20;

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPromotions({ page, pageSize });
      setPromotions(result.promotions);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleEdit = (promotion: Promotion) => {
    setEditingId(promotion.id);
    setFormData({
      titulo: promotion.titulo,
      descricao: promotion.descricao || '',
      tipo: promotion.tipo,
      valor: promotion.valor?.toString() || '',
      percentual: promotion.percentual?.toString() || '',
      valor_minimo: promotion.valor_minimo.toString(),
      valor_maximo: promotion.valor_maximo?.toString() || '',
      data_inicio: promotion.data_inicio.split('T')[0],
      data_fim: promotion.data_fim?.split('T')[0] || '',
      ativo: promotion.ativo,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const data = {
      titulo: formData.titulo,
      descricao: formData.descricao || undefined,
      tipo: formData.tipo,
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      percentual: formData.percentual ? parseFloat(formData.percentual) : undefined,
      valor_minimo: parseFloat(formData.valor_minimo) || 0,
      valor_maximo: formData.valor_maximo ? parseFloat(formData.valor_maximo) : undefined,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || undefined,
      ativo: formData.ativo,
    };

    try {
      const result = editingId
        ? await updatePromotion(editingId, data)
        : await createPromotion(data);

      if (result.success) {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        fetchPromotions();
      } else {
        alert(result.error || 'Erro ao salvar promoção');
      }
    } catch {
      alert('Erro ao salvar promoção');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    setIsDeleting(true);
    try {
      const result = await deletePromotion(deleteModal.id);
      if (result.success) {
        fetchPromotions();
      } else {
        alert(result.error || 'Erro ao deletar promoção');
      }
    } catch {
      alert('Erro ao deletar promoção');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const result = await togglePromotionStatus(id);
      if (result.success) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ativo: result.newStatus! } : p))
        );
      }
    } catch {
      alert('Erro ao alterar status');
    }
  };

  const columns: Column<Promotion>[] = [
    {
      key: 'titulo',
      header: 'Título',
      render: (value) => <span className="font-medium text-white">{value as string}</span>,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (value) => {
        const tipos: Record<string, string> = {
          bonus_deposito: 'Bônus Depósito',
          cashback: 'Cashback',
          desconto: 'Desconto',
          frete_gratis: 'Frete Grátis',
        };
        return tipos[value as string] || (value as string);
      },
    },
    {
      key: 'valor',
      header: 'Valor/Percentual',
      render: (value, row) => {
        if (row.percentual) {
          return <span className="text-cyan-400">{row.percentual}%</span>;
        }
        if (value) {
          return <span className="text-green-400">{formatCurrency(value as number)}</span>;
        }
        return '-';
      },
    },
    {
      key: 'data_fim',
      header: 'Validade',
      render: (value) => {
        if (!value) return <span className="text-gray-400">Sem limite</span>;
        const date = new Date(value as string);
        const now = new Date();
        const isExpired = date < now;
        return (
          <span className={isExpired ? 'text-red-400' : 'text-gray-300'}>
            {date.toLocaleDateString('pt-BR')}
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
      key: 'creator_name',
      header: 'Criador',
      render: (value) => <span className="text-gray-400">{value as string}</span>,
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
            className="p-1.5 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ open: true, id: row.id });
            }}
            className="p-1.5 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-red-400 transition-colors"
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
          <h1 className="text-2xl font-bold text-white">Promoções</h1>
          <p className="text-gray-400">Gerenciamento de promoções da plataforma</p>
        </div>
        <Button variant="teal" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={promotions}
        isLoading={isLoading}
        emptyMessage="Nenhuma promoção encontrada"
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
          <div className="relative bg-[#1f2937] rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData(initialFormData);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Editar Promoção' : 'Nova Promoção'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Título *</label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="bonus_deposito">Bônus de Depósito</option>
                  <option value="cashback">Cashback</option>
                  <option value="desconto">Desconto</option>
                  <option value="frete_gratis">Frete Grátis</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Valor (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Percentual (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.percentual}
                    onChange={(e) => setFormData({ ...formData, percentual: e.target.value })}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Valor Mínimo</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_minimo}
                    onChange={(e) => setFormData({ ...formData, valor_minimo: e.target.value })}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Valor Máximo</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor_maximo}
                    onChange={(e) => setFormData({ ...formData, valor_maximo: e.target.value })}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Data Início</label>
                  <Input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Data Fim</label>
                  <Input
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <ToggleSwitch
                  checked={formData.ativo}
                  onChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  label="Ativa"
                  description="A promoção estará disponível para os usuários"
                />
              </div>

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
        title="Deletar Promoção"
        message="Tem certeza que deseja deletar esta promoção? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
