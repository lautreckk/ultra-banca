'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column, ConfirmModal, ToggleSwitch } from '@/components/admin/shared';
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  toggleWebhookStatus,
  testWebhook,
  type WebhookConfig,
} from '@/lib/admin/actions/webhooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Play,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface WebhookFormData {
  name: string;
  description: string;
  url: string;
  events: string[];
  max_retries: string;
  retry_delay_seconds: string;
  timeout_seconds: string;
  ativo: boolean;
}

const initialFormData: WebhookFormData = {
  name: 'Scalecore Lead',
  description: '',
  url: '',
  events: ['lead.created'],
  max_retries: '3',
  retry_delay_seconds: '60',
  timeout_seconds: '30',
  ativo: true,
};

const eventOptions = [
  { value: 'lead.created', label: 'Lead Criado', description: 'Dispara quando um novo usuario se cadastra' },
  { value: 'deposit.created', label: 'Deposito Confirmado', description: 'Dispara quando um deposito e aprovado' },
  { value: 'withdrawal.created', label: 'Saque Solicitado', description: 'Dispara quando um saque e solicitado' },
];

export default function AdminWebhooksPage() {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WebhookFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const pageSize = 20;

  const fetchWebhooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getWebhooks({ page, pageSize });
      setWebhooks(result.webhooks);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleEdit = (webhook: WebhookConfig) => {
    setEditingId(webhook.id);
    setFormData({
      name: webhook.name,
      description: webhook.description || '',
      url: webhook.url,
      events: webhook.events || ['lead.created'],
      max_retries: webhook.max_retries.toString(),
      retry_delay_seconds: webhook.retry_delay_seconds.toString(),
      timeout_seconds: webhook.timeout_seconds.toString(),
      ativo: webhook.ativo,
    });
    setShowForm(true);
  };

  const handleEventToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(value)
        ? prev.events.filter((e) => e !== value)
        : [...prev.events, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.url) {
      alert('A URL do webhook e obrigatoria');
      return;
    }

    if (formData.events.length === 0) {
      alert('Selecione pelo menos um evento');
      return;
    }

    setIsSaving(true);

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      url: formData.url,
      events: formData.events,
      max_retries: parseInt(formData.max_retries) || 3,
      retry_delay_seconds: parseInt(formData.retry_delay_seconds) || 60,
      timeout_seconds: parseInt(formData.timeout_seconds) || 30,
      ativo: formData.ativo,
    };

    try {
      if (editingId) {
        const result = await updateWebhook(editingId, data);
        if (result.success) {
          setShowForm(false);
          setEditingId(null);
          setFormData(initialFormData);
          fetchWebhooks();
        } else {
          alert(result.error || 'Erro ao atualizar webhook');
        }
      } else {
        const result = await createWebhook(data);
        if (result.success) {
          setNewSecretKey(result.secret_key || null);
          setShowForm(false);
          setFormData(initialFormData);
          fetchWebhooks();
        } else {
          alert(result.error || 'Erro ao criar webhook');
        }
      }
    } catch {
      alert('Erro ao salvar webhook');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteWebhook(deleteModal.id);
      if (result.success) {
        fetchWebhooks();
      } else {
        alert(result.error || 'Erro ao deletar webhook');
      }
    } catch {
      alert('Erro ao deletar webhook');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const result = await toggleWebhookStatus(id);
      if (result.success) {
        setWebhooks((prev) =>
          prev.map((w) => (w.id === id ? { ...w, ativo: result.newStatus! } : w))
        );
      }
    } catch {
      alert('Erro ao alterar status');
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const result = await testWebhook(id);
      setTestResult({
        id,
        success: result.success,
        message: result.success
          ? `Sucesso! Status ${result.status} em ${result.responseTime}ms`
          : result.error || 'Falha no teste',
      });
      fetchWebhooks();
    } catch {
      setTestResult({
        id,
        success: false,
        message: 'Erro ao testar webhook',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleCopySecret = () => {
    if (newSecretKey) {
      navigator.clipboard.writeText(newSecretKey);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const getStatusIcon = (webhook: WebhookConfig) => {
    if (!webhook.last_triggered_at) {
      return <Clock className="h-4 w-4 text-zinc-500" />;
    }
    if (webhook.last_error) {
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
    if (webhook.last_success_at) {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
    return <Clock className="h-4 w-4 text-zinc-500" />;
  };

  const getLastStatus = (webhook: WebhookConfig) => {
    if (!webhook.last_triggered_at) {
      return <span className="text-zinc-500 text-sm">Nunca disparado</span>;
    }

    const lastTriggered = new Date(webhook.last_triggered_at);
    const timeAgo = getTimeAgo(lastTriggered);

    if (webhook.last_error) {
      return (
        <div className="flex flex-col">
          <span className="text-red-400 text-sm">Falha</span>
          <span className="text-zinc-500 text-xs">{timeAgo}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <span className="text-green-400 text-sm">Sucesso</span>
        <span className="text-zinc-500 text-xs">{timeAgo}</span>
      </div>
    );
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min atras`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atras`;
    return `${Math.floor(seconds / 86400)}d atras`;
  };

  const columns: Column<WebhookConfig>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row)}
          <span className="font-medium text-white">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'url',
      header: 'URL',
      render: (value) => (
        <span className="text-zinc-300 text-sm truncate max-w-[200px] block">
          {value as string}
        </span>
      ),
    },
    {
      key: 'events',
      header: 'Eventos',
      render: (value) => {
        const events = value as string[];
        const labels: Record<string, string> = {
          'lead.created': 'Lead Criado',
        };
        return (
          <div className="flex flex-wrap gap-1">
            {events.map((e) => (
              <span
                key={e}
                className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded"
              >
                {labels[e] || e}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'last_triggered_at',
      header: 'Ultimo Status',
      render: (_, row) => getLastStatus(row),
    },
    {
      key: 'ativo',
      header: 'Ativo',
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
      header: 'Acoes',
      className: 'w-36',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {testResult?.id === row.id && (
            <span
              className={`text-xs mr-1 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}
            >
              {testResult.success ? 'OK!' : 'Erro'}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTest(row.id);
            }}
            disabled={testingId === row.id}
            className="p-1.5 rounded-lg hover:bg-zinc-700/30 text-zinc-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
            title="Testar webhook"
          >
            {testingId === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/webhooks/${row.id}`);
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-700/30 text-zinc-500 hover:text-white transition-colors"
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-700/30 text-zinc-500 hover:text-white transition-colors"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ open: true, id: row.id });
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-700/30 text-zinc-500 hover:text-red-400 transition-colors"
            title="Deletar"
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
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-zinc-500">Configure endpoints para receber notificacoes de eventos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchWebhooks} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="teal" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Webhook
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={webhooks}
        isLoading={isLoading}
        emptyMessage="Nenhum webhook configurado"
        rowKey="id"
        onRowClick={(row) => router.push(`/admin/webhooks/${row.id}`)}
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
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-700/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Editar Webhook' : 'Novo Webhook'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                  placeholder="Ex: Scalecore Lead"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300">Descricao</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-zinc-800 border border-zinc-700/40 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={2}
                  placeholder="Descricao opcional do webhook"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300">URL do Endpoint *</label>
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                  placeholder="https://api.scalecore.com/webhook/leads"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  O endpoint deve aceitar requisicoes POST com JSON
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">Eventos *</label>
                <div className="space-y-2">
                  {eventOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleEventToggle(option.value)}
                      className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${
                        formData.events.includes(option.value)
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                          : 'bg-zinc-800 border-zinc-700/40 text-zinc-300 hover:bg-zinc-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.label}</span>
                        {formData.events.includes(option.value) && (
                          <Check className="h-4 w-4 text-cyan-400" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-zinc-300">Retries</label>
                  <Input
                    type="number"
                    value={formData.max_retries}
                    onChange={(e) => setFormData({ ...formData, max_retries: e.target.value })}
                    className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">Delay (s)</label>
                  <Input
                    type="number"
                    value={formData.retry_delay_seconds}
                    onChange={(e) => setFormData({ ...formData, retry_delay_seconds: e.target.value })}
                    className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                    min="10"
                    max="300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">Timeout (s)</label>
                  <Input
                    type="number"
                    value={formData.timeout_seconds}
                    onChange={(e) => setFormData({ ...formData, timeout_seconds: e.target.value })}
                    className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                    min="5"
                    max="60"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500 -mt-2">
                Em caso de falha, o sistema fara ate {formData.max_retries} tentativas com delay
                exponencial
              </p>

              <div>
                <ToggleSwitch
                  checked={formData.ativo}
                  onChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  label="Ativo"
                  description="O webhook sera disparado quando os eventos ocorrerem"
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

      {/* Secret Key Modal */}
      {newSecretKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setNewSecretKey(null)} />
          <div className="relative bg-[#1f2937] rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Webhook Criado!</h2>
                <p className="text-zinc-500 text-sm">Copie a secret key abaixo</p>
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <label className="text-xs font-medium text-zinc-500 block mb-2">
                Secret Key (HMAC-SHA256)
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-cyan-400 bg-zinc-900 px-3 py-2 rounded font-mono break-all">
                  {newSecretKey}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/30 text-white transition-colors"
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-yellow-400 text-sm">
                  Esta e a unica vez que a secret key sera exibida. Salve-a em um local seguro para
                  validar as assinaturas dos webhooks no Scalecore.
                </p>
              </div>
            </div>

            <Button variant="teal" fullWidth onClick={() => setNewSecretKey(null)}>
              Entendi, ja copiei
            </Button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Deletar Webhook"
        message="Tem certeza que deseja deletar este webhook? Esta acao nao pode ser desfeita e todos os logs serao removidos."
        confirmText="Deletar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
