'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, ConfirmModal, ToggleSwitch } from '@/components/admin/shared';
import { ImageUpload } from '@/components/admin/image-upload';
import {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  toggleAdStatus,
  type Propaganda,
} from '@/lib/admin/actions/ads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface AdFormData {
  titulo: string;
  descricao: string;
  imagem_url: string;
  link_url: string;
  gatilhos: string[];
  prioridade: string;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
}

const initialFormData: AdFormData = {
  titulo: '',
  descricao: '',
  imagem_url: '',
  link_url: '',
  gatilhos: [],
  prioridade: '0',
  data_inicio: new Date().toISOString().split('T')[0],
  data_fim: '',
  ativo: true,
};

const gatilhosOptions = [
  { value: 'login', label: 'Após Login' },
  { value: 'saque', label: 'Após Saque' },
  { value: 'deposito', label: 'Após Depósito' },
];

export default function AdminPropagandaPage() {
  const [ads, setAds] = useState<Propaganda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const pageSize = 20;

  const fetchAds = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getAds({ page, pageSize });
      setAds(result.ads);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleEdit = (ad: Propaganda) => {
    setEditingId(ad.id);
    setFormData({
      titulo: ad.titulo,
      descricao: ad.descricao || '',
      imagem_url: ad.imagem_url,
      link_url: ad.link_url || '',
      gatilhos: ad.gatilhos || [],
      prioridade: ad.prioridade.toString(),
      data_inicio: ad.data_inicio?.split('T')[0] || '',
      data_fim: ad.data_fim?.split('T')[0] || '',
      ativo: ad.ativo,
    });
    setShowForm(true);
  };

  const handleGatilhoToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      gatilhos: prev.gatilhos.includes(value)
        ? prev.gatilhos.filter((g) => g !== value)
        : [...prev.gatilhos, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.imagem_url) {
      alert('A imagem é obrigatória');
      return;
    }

    if (formData.gatilhos.length === 0) {
      alert('Selecione pelo menos um gatilho');
      return;
    }

    setIsSaving(true);

    const data = {
      titulo: formData.titulo,
      descricao: formData.descricao || undefined,
      imagem_url: formData.imagem_url,
      link_url: formData.link_url || undefined,
      gatilhos: formData.gatilhos,
      prioridade: parseInt(formData.prioridade) || 0,
      data_inicio: formData.data_inicio || undefined,
      data_fim: formData.data_fim || undefined,
      ativo: formData.ativo,
    };

    try {
      const result = editingId
        ? await updateAd(editingId, data)
        : await createAd(data);

      if (result.success) {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        fetchAds();
      } else {
        alert(result.error || 'Erro ao salvar propaganda');
      }
    } catch {
      alert('Erro ao salvar propaganda');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteAd(deleteModal.id);
      if (result.success) {
        fetchAds();
      } else {
        alert(result.error || 'Erro ao deletar propaganda');
      }
    } catch {
      alert('Erro ao deletar propaganda');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const result = await toggleAdStatus(id);
      if (result.success) {
        setAds((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ativo: result.newStatus! } : a))
        );
      }
    } catch {
      alert('Erro ao alterar status');
    }
  };

  const columns: Column<Propaganda>[] = [
    {
      key: 'imagem_url',
      header: 'Imagem',
      className: 'w-20',
      render: (value) => (
        <div className="w-16 h-12 bg-gray-700 rounded overflow-hidden">
          {value ? (
            <img
              src={value as string}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-gray-500" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'titulo',
      header: 'Título',
      render: (value) => <span className="font-medium text-white">{value as string}</span>,
    },
    {
      key: 'gatilhos',
      header: 'Gatilhos',
      render: (value) => {
        const gatilhos = value as string[];
        const labels: Record<string, string> = {
          login: 'Login',
          saque: 'Saque',
          deposito: 'Depósito',
        };
        return (
          <div className="flex flex-wrap gap-1">
            {gatilhos.map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded"
              >
                {labels[g] || g}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      render: (value) => <span className="text-gray-400">{value as number}</span>,
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
      key: 'actions',
      header: 'Ações',
      className: 'w-24',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.link_url && (
            <a
              href={row.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
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
          <h1 className="text-2xl font-bold text-white">Propaganda</h1>
          <p className="text-gray-400">Gerenciamento de banners e anúncios</p>
        </div>
        <Button variant="teal" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Propaganda
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={ads}
        isLoading={isLoading}
        emptyMessage="Nenhuma propaganda encontrada"
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
              {editingId ? 'Editar Propaganda' : 'Nova Propaganda'}
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
                  rows={2}
                />
              </div>

              <ImageUpload
                value={formData.imagem_url}
                onChange={(url) => setFormData({ ...formData, imagem_url: url })}
                label="Imagem *"
                recommendedSize="1080x1920 ou 1200x628"
                bucket="platform-assets"
                folder="propaganda"
              />

              <div>
                <label className="text-sm font-medium text-gray-300">Link URL (opcional)</label>
                <Input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Gatilhos *</label>
                <div className="flex flex-wrap gap-2">
                  {gatilhosOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleGatilhoToggle(option.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.gatilhos.includes(option.value)
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selecione quando a propaganda deve aparecer
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Prioridade</label>
                <Input
                  type="number"
                  value={formData.prioridade}
                  onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maior número = maior prioridade de exibição
                </p>
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
                  description="A propaganda será exibida para os usuários"
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
        title="Deletar Propaganda"
        message="Tem certeza que deseja deletar esta propaganda? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
