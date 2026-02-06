'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, StatusBadge, ConfirmModal } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getDeposits, approveDeposit, type Deposit } from '@/lib/admin/actions/financial';
import { Button } from '@/components/ui/button';
import { Check, Filter } from 'lucide-react';

export default function AdminDepositosPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; depositId: string | null }>({
    open: false,
    depositId: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const pageSize = 10;

  const fetchDeposits = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getDeposits({ page, pageSize, status: statusFilter || undefined, search });
      setDeposits(result.deposits);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleApprove = async () => {
    if (!confirmModal.depositId) return;

    setIsProcessing(true);
    try {
      const result = await approveDeposit(confirmModal.depositId);
      if (result.success) {
        fetchDeposits();
      } else {
        alert(result.error || 'Erro ao aprovar depósito');
      }
    } catch {
      alert('Erro ao aprovar depósito');
    } finally {
      setIsProcessing(false);
      setConfirmModal({ open: false, depositId: null });
    }
  };

  const columns: Column<Deposit>[] = [
    {
      key: 'user_name',
      header: 'Usuário',
      mobileHeader: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-white">{value as string}</p>
          <p className="text-xs text-zinc-500">
            {(row.user_cpf as string).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
          </p>
        </div>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (value) => (
        <span className="font-semibold text-green-400">{formatCurrency(value as number)}</span>
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
      className: 'w-32',
      render: (_, row) => (
        row.status === 'PENDING' ? (
          <Button
            variant="teal"
            size="sm"
            className="w-full md:w-auto"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmModal({ open: true, depositId: row.id });
            }}
          >
            <Check className="h-4 w-4 mr-1" />
            Aprovar
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Depósitos</h1>
        <p className="text-sm md:text-base text-zinc-500">Gerenciamento de depósitos da plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Status:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['', 'PENDING', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-3 py-2 md:py-1.5 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none ${
                statusFilter === status
                  ? 'bg-cyan-600 text-white'
                  : 'bg-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              {status === '' ? 'Todos' : status === 'PENDING' ? 'Pendentes' : 'Aprovados'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={deposits}
        isLoading={isLoading}
        emptyMessage="Nenhum depósito encontrado"
        searchable
        searchPlaceholder="Buscar por nome ou CPF..."
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
        onClose={() => setConfirmModal({ open: false, depositId: null })}
        onConfirm={handleApprove}
        title="Aprovar Depósito"
        message="Tem certeza que deseja aprovar este depósito? O saldo do usuário será atualizado automaticamente."
        confirmText="Aprovar"
        variant="success"
        isLoading={isProcessing}
      />
    </div>
  );
}
