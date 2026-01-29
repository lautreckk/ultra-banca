'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DataTable, type Column, ConfirmModal, ToggleSwitch } from '@/components/admin/shared';
import {
  getWebhook,
  getWebhookLogs,
  getWebhookStats,
  updateWebhook,
  regenerateWebhookSecret,
  testWebhook,
  deleteWebhook,
  type WebhookConfig,
  type WebhookLog,
} from '@/lib/admin/actions/webhooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Play,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Eye,
  Loader2,
  ExternalLink,
  Key,
  Activity,
  Zap,
  Timer,
} from 'lucide-react';

export default function WebhookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const webhookId = params.id as string;

  const [webhook, setWebhook] = useState<WebhookConfig | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, avgResponseTime: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    url: '',
    max_retries: '3',
    retry_delay_seconds: '60',
    timeout_seconds: '30',
    ativo: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const logsPageSize = 20;

  const fetchWebhook = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getWebhook(webhookId);
      if (result.webhook) {
        setWebhook(result.webhook);
        setEditFormData({
          name: result.webhook.name,
          description: result.webhook.description || '',
          url: result.webhook.url,
          max_retries: result.webhook.max_retries.toString(),
          retry_delay_seconds: result.webhook.retry_delay_seconds.toString(),
          timeout_seconds: result.webhook.timeout_seconds.toString(),
          ativo: result.webhook.ativo,
        });
      }
    } catch (error) {
      console.error('Error fetching webhook:', error);
    } finally {
      setIsLoading(false);
    }
  }, [webhookId]);

  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const result = await getWebhookLogs({
        webhookId,
        page: logsPage,
        pageSize: logsPageSize,
      });
      setLogs(result.logs);
      setLogsTotal(result.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [webhookId, logsPage]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getWebhookStats(webhookId);
      setStats(result);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [webhookId]);

  useEffect(() => {
    fetchWebhook();
    fetchStats();
  }, [fetchWebhook, fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testWebhook(webhookId);
      setTestResult({
        success: result.success,
        message: result.success
          ? `Sucesso! Status ${result.status} em ${result.responseTime}ms`
          : result.error || 'Falha no teste',
      });
      fetchWebhook();
      fetchLogs();
      fetchStats();
    } catch {
      setTestResult({
        success: false,
        message: 'Erro ao testar webhook',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateWebhookSecret(webhookId);
      if (result.success && result.secret_key) {
        setNewSecretKey(result.secret_key);
        setShowRegenerateModal(false);
      } else {
        alert(result.error || 'Erro ao regenerar secret');
      }
    } catch {
      alert('Erro ao regenerar secret');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopySecret = () => {
    if (newSecretKey) {
      navigator.clipboard.writeText(newSecretKey);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteWebhook(webhookId);
      if (result.success) {
        router.push('/admin/webhooks');
      } else {
        alert(result.error || 'Erro ao deletar webhook');
      }
    } catch {
      alert('Erro ao deletar webhook');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateWebhook(webhookId, {
        name: editFormData.name,
        description: editFormData.description || undefined,
        url: editFormData.url,
        max_retries: parseInt(editFormData.max_retries) || 3,
        retry_delay_seconds: parseInt(editFormData.retry_delay_seconds) || 60,
        timeout_seconds: parseInt(editFormData.timeout_seconds) || 30,
        ativo: editFormData.ativo,
      });

      if (result.success) {
        setShowEditForm(false);
        fetchWebhook();
      } else {
        alert(result.error || 'Erro ao atualizar webhook');
      }
    } catch {
      alert('Erro ao atualizar webhook');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const result = await updateWebhook(webhookId, { ativo: !webhook?.ativo });
      if (result.success) {
        fetchWebhook();
      }
    } catch {
      alert('Erro ao alterar status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Sucesso
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Falha
          </span>
        );
      case 'retrying':
        return (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Tentando
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pendente
          </span>
        );
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const logsColumns: Column<WebhookLog>[] = [
    {
      key: 'created_at',
      header: 'Data',
      render: (value) => (
        <span className="text-gray-300 text-sm">{formatDate(value as string)}</span>
      ),
    },
    {
      key: 'event_type',
      header: 'Evento',
      render: (value) => {
        const eventType = value as string;
        const labels: Record<string, string> = {
          'lead.created': 'Lead Criado',
          'test.webhook': 'Teste',
        };
        return (
          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded">
            {labels[eventType] || eventType}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => getStatusBadge(value as string),
    },
    {
      key: 'response_status',
      header: 'HTTP',
      render: (value) => {
        if (!value) return <span className="text-gray-500">-</span>;
        const status = value as number;
        const color = status >= 200 && status < 300 ? 'text-green-400' : 'text-red-400';
        return <span className={`${color} font-mono text-sm`}>{status}</span>;
      },
    },
    {
      key: 'response_time_ms',
      header: 'Tempo',
      render: (value) => {
        if (!value) return <span className="text-gray-500">-</span>;
        return <span className="text-gray-300 text-sm">{value as number}ms</span>;
      },
    },
    {
      key: 'attempt_number',
      header: 'Tentativa',
      render: (value) => <span className="text-gray-400 text-sm">#{value as number}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(row);
          }}
          className="p-1.5 rounded-lg hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (isLoading || !webhook) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/webhooks')}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{webhook.name}</h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <ExternalLink className="h-3 w-3" />
              {webhook.url}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToggleSwitch
            checked={webhook.ativo}
            onChange={handleToggleStatus}
            label=""
            size="sm"
          />
          <span className={`text-sm ${webhook.ativo ? 'text-green-400' : 'text-gray-400'}`}>
            {webhook.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total de Disparos</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Sucessos</p>
              <p className="text-xl font-bold text-white">{stats.success}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Falhas</p>
              <p className="text-xl font-bold text-white">{stats.failed}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Timer className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tempo Medio</p>
              <p className="text-xl font-bold text-white">{stats.avgResponseTime}ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Config & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Configuracao</h2>
            <Button variant="secondary" size="sm" onClick={() => setShowEditForm(true)}>
              Editar
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400">URL</label>
              <p className="text-white text-sm break-all">{webhook.url}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">Eventos</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {webhook.events.map((e) => (
                  <span
                    key={e}
                    className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded"
                  >
                    {e === 'lead.created' ? 'Lead Criado' : e}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400">Retries</label>
                <p className="text-white text-sm">{webhook.max_retries}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Delay</label>
                <p className="text-white text-sm">{webhook.retry_delay_seconds}s</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Timeout</label>
                <p className="text-white text-sm">{webhook.timeout_seconds}s</p>
              </div>
            </div>
            {webhook.description && (
              <div>
                <label className="text-xs text-gray-400">Descricao</label>
                <p className="text-white text-sm">{webhook.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-bold text-white mb-4">Acoes</h2>

          <div className="space-y-4">
            {/* Secret Key */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-400" />
                  <label className="text-sm text-gray-300">Secret Key</label>
                </div>
                <button
                  onClick={() => setShowRegenerateModal(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Regenerar
                </button>
              </div>
              <code className="text-sm text-gray-400 font-mono">{webhook.secret_key}</code>
              <p className="text-xs text-gray-500 mt-2">
                Use esta chave para validar as assinaturas HMAC-SHA256
              </p>
            </div>

            {/* Test Button */}
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                onClick={handleTest}
                disabled={isTesting}
                className="justify-start"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Testar Webhook
              </Button>
              {testResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    testResult.success
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Zona de perigo</p>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                className="justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar Webhook
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Logs de Disparo</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchLogs} disabled={isLoadingLogs}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <DataTable
          columns={logsColumns}
          data={logs}
          isLoading={isLoadingLogs}
          emptyMessage="Nenhum log encontrado"
          rowKey="id"
          onRowClick={(row) => setSelectedLog(row)}
          pagination={{
            page: logsPage,
            pageSize: logsPageSize,
            total: logsTotal,
            onPageChange: setLogsPage,
          }}
        />
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEditForm(false)} />
          <div className="relative bg-[#1f2937] rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditForm(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">Editar Webhook</h2>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Nome</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Descricao</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">URL do Endpoint</label>
                <Input
                  type="url"
                  value={editFormData.url}
                  onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-300">Retries</label>
                  <Input
                    type="number"
                    value={editFormData.max_retries}
                    onChange={(e) => setEditFormData({ ...editFormData, max_retries: e.target.value })}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Delay (s)</label>
                  <Input
                    type="number"
                    value={editFormData.retry_delay_seconds}
                    onChange={(e) => setEditFormData({ ...editFormData, retry_delay_seconds: e.target.value })}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    min="10"
                    max="300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Timeout (s)</label>
                  <Input
                    type="number"
                    value={editFormData.timeout_seconds}
                    onChange={(e) => setEditFormData({ ...editFormData, timeout_seconds: e.target.value })}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                    min="5"
                    max="60"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" fullWidth onClick={() => setShowEditForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="teal" fullWidth disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerate Secret Modal */}
      <ConfirmModal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        onConfirm={handleRegenerate}
        title="Regenerar Secret Key"
        message="Tem certeza que deseja regenerar a secret key? A chave atual sera invalidada e voce precisara atualizar a configuracao no Scalecore."
        confirmText="Regenerar"
        variant="danger"
        isLoading={isRegenerating}
      />

      {/* New Secret Key Modal */}
      {newSecretKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setNewSecretKey(null)} />
          <div className="relative bg-[#1f2937] rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Key className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Nova Secret Key</h2>
                <p className="text-gray-400 text-sm">Copie a nova chave abaixo</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <label className="text-xs font-medium text-gray-400 block mb-2">
                Secret Key (HMAC-SHA256)
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-cyan-400 bg-gray-900 px-3 py-2 rounded font-mono break-all">
                  {newSecretKey}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
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
                  Esta e a unica vez que a nova secret key sera exibida. Atualize a configuracao no
                  Scalecore imediatamente.
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
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Deletar Webhook"
        message="Tem certeza que deseja deletar este webhook? Esta acao nao pode ser desfeita e todos os logs serao removidos."
        confirmText="Deletar"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-[#1f2937] rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-white">Detalhes do Log</h2>
              {getStatusBadge(selectedLog.status)}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Data</label>
                  <p className="text-white text-sm">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Evento</label>
                  <p className="text-white text-sm">{selectedLog.event_type}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">HTTP Status</label>
                  <p className="text-white text-sm">{selectedLog.response_status || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Tempo de Resposta</label>
                  <p className="text-white text-sm">{selectedLog.response_time_ms || '-'}ms</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Tentativa</label>
                  <p className="text-white text-sm">#{selectedLog.attempt_number}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Event ID</label>
                  <p className="text-white text-sm font-mono text-xs">{selectedLog.event_id || '-'}</p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div>
                  <label className="text-xs text-gray-400">Erro</label>
                  <div className="mt-1 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{selectedLog.error_message}</p>
                  </div>
                </div>
              )}

              {selectedLog.request_body && (
                <div>
                  <label className="text-xs text-gray-400">Request Body</label>
                  <pre className="mt-1 p-3 bg-gray-900 rounded-lg text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.request_body, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.response_body && (
                <div>
                  <label className="text-xs text-gray-400">Response Body</label>
                  <pre className="mt-1 p-3 bg-gray-900 rounded-lg text-xs text-gray-300 overflow-x-auto max-h-40">
                    {selectedLog.response_body}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
