'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMessageLogs, type EvolutionMessageLog } from '@/lib/admin/actions/evolution';

interface MessageLogTableProps {
  limit?: number;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  sent: { label: 'Enviado', icon: CheckCircle, color: 'text-green-400' },
  failed: { label: 'Falhou', icon: XCircle, color: 'text-red-400' },
  pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-400' },
};

export function MessageLogTable({ limit = 20 }: MessageLogTableProps) {
  const [logs, setLogs] = useState<EvolutionMessageLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMessageLogs({
        limit,
        offset: page * limit,
        status: statusFilter as 'pending' | 'sent' | 'failed' | undefined
      });
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['', 'sent', 'failed', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(0);
              }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              )}
            >
              {status === '' ? 'Todos' :
               status === 'sent' ? 'Enviados' :
               status === 'failed' ? 'Falhas' : 'Pendentes'}
            </button>
          ))}
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Destinatário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Gatilho
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Conteúdo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Data/Hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Carregando...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Nenhum log encontrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const statusInfo = statusConfig[log.status] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn('h-4 w-4', statusInfo.color)} />
                          <span className={cn('text-sm', statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </div>
                        {log.error_message && (
                          <p className="text-xs text-red-400 mt-1">{log.error_message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white font-mono">{log.recipient_phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        {log.trigger_type ? (
                          <span className="text-sm text-zinc-300 capitalize">{log.trigger_type}</span>
                        ) : (
                          <span className="text-sm text-zinc-500">Manual</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-zinc-400 truncate max-w-xs" title={log.message_content || ''}>
                          {log.message_content || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-zinc-400">
                          {new Date(log.sent_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-sm text-zinc-400">
              {total} mensagem(ns) no total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded hover:text-white disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-zinc-400">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded hover:text-white disabled:opacity-50 transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
