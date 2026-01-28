'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, StatusBadge, ConfirmModal } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getWithdrawals, approveWithdrawal, rejectWithdrawal, type Withdrawal } from '@/lib/admin/actions/financial';
import { Button } from '@/components/ui/button';
import { Check, X, Filter, Copy, CheckCheck } from 'lucide-react';

export default function AdminSaquesPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    withdrawalId: string | null;
    action: 'approve' | 'reject';
  }>({
    open: false,
    withdrawalId: null,
    action: 'approve',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pageSize = 10;

  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getWithdrawals({ page, pageSize, status: statusFilter || undefined, search });
      setWithdrawals(result.withdrawals);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleCopyPix = (pixKey: string, id: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = async () => {
    if (!confirmModal.withdrawalId) return;

    setIsProcessing(true);
    try {
      const result = confirmModal.action === 'approve'
        ? await approveWithdrawal(confirmModal.withdrawalId)
        : await rejectWithdrawal(confirmModal.withdrawalId);

      if (result.success) {
        fetchWithdrawals();
      } else {
        alert(result.error || `Erro ao ${confirmModal.action === 'approve' ? 'aprovar' : 'rejeitar'} saque`);
      }
    } catch {
      alert(`Erro ao ${confirmModal.action === 'approve' ? 'aprovar' : 'rejeitar'} saque`);
    } finally {
      setIsProcessing(false);
      setConfirmModal({ open: false, withdrawalId: null, action: 'approve' });
    }
  };

  const columns: Column<Withdrawal>[] = [
    {
      key: 'user_name',
      header: 'Usuário',
      mobileHeader: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-white">{value as string}</p>
          <p className="text-xs text-gray-400">
            {(row.user_cpf as string).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
          </p>
        </div>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (value, row) => (
        <div>
          <p className="font-semibold text-white">{formatCurrency(value as number)}</p>
          <p className="text-xs text-gray-400">
            Líquido: <span className="text-green-400">{formatCurrency(row.valor_liquido)}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'chave_pix',
      header: 'Chave PIX',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-300 truncate" title={value as string}>
              {value as string}
            </p>
            <p className="text-xs text-gray-500 uppercase">{row.tipo_chave}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyPix(value as string, row.id);
            }}
            className="p-2 md:p-1.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white transition-colors flex-shrink-0"
            title="Copiar chave PIX"
          >
            {copiedId === row.id ? (
              <CheckCheck className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'created_at',
      header: 'Data',
      hideOnMobile: true,
      render: (value) => new Date(value as string).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      key: 'actions',
      header: 'Ações',
      className: 'w-40',
      render: (_, row) => (
        row.status === 'PENDING' ? (
          <div className="flex items-center gap-2">
            <Button
              variant="teal"
              size="sm"
              className="flex-1 md:flex-none"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModal({ open: true, withdrawalId: row.id, action: 'approve' });
              }}
            >
              <Check className="h-4 w-4 mr-1 md:mr-0" />
              <span className="md:hidden">Pagar</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 md:flex-none"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModal({ open: true, withdrawalId: row.id, action: 'reject' });
              }}
            >
              <X className="h-4 w-4 mr-1 md:mr-0" />
              <span className="md:hidden">Recusar</span>
            </Button>
          </div>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Saques</h1>
        <p className="text-sm md:text-base text-gray-400">Gerenciamento de solicitações de saque</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Status:</span>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          {['', 'PENDING', 'PAID', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-3 py-2 md:py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {status === '' ? 'Todos' : status === 'PENDING' ? 'Pendentes' : status === 'PAID' ? 'Pagos' : 'Rejeitados'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={withdrawals}
        isLoading={isLoading}
        emptyMessage="Nenhum saque encontrado"
        searchable
        searchPlaceholder="Buscar por nome, CPF ou chave PIX..."
        onSearch={handleSearch}
        rowKey="id"
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
        }}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, withdrawalId: null, action: 'approve' })}
        onConfirm={handleAction}
        title={confirmModal.action === 'approve' ? 'Finalizar Saque' : 'Recusar Saque'}
        message={
          confirmModal.action === 'approve'
            ? 'Confirma que o pagamento via PIX foi realizado? O saque será marcado como pago.'
            : 'Tem certeza que deseja recusar este saque? O valor será devolvido ao saldo do usuário.'
        }
        confirmText={confirmModal.action === 'approve' ? 'Finalizar' : 'Recusar'}
        variant={confirmModal.action === 'approve' ? 'success' : 'danger'}
        isLoading={isProcessing}
      />
    </div>
  );
}
