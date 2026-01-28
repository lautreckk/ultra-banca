'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, StatusBadge } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getBets, type Bet } from '@/lib/admin/actions/bets';
import { Filter } from 'lucide-react';

export default function AdminApostasPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const pageSize = 10;

  const fetchBets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getBets({ page, pageSize, status: statusFilter || undefined, search });
      setBets(result.bets);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const columns: Column<Bet>[] = [
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
      key: 'tipo',
      header: 'Loteria',
      hideOnMobile: true,
      render: (value) => <span className="capitalize">{value as string}</span>,
    },
    {
      key: 'modalidade',
      header: 'Modalidade',
      render: (value) => <span className="capitalize">{value as string}</span>,
    },
    {
      key: 'palpites',
      header: 'Palpites',
      render: (value) => {
        const palpites = value as string[];
        const display = palpites.slice(0, 3).join(', ');
        return (
          <span className="text-gray-300" title={palpites.join(', ')}>
            {display}{palpites.length > 3 ? ` +${palpites.length - 3}` : ''}
          </span>
        );
      },
    },
    {
      key: 'valor_total',
      header: 'Valor',
      render: (value) => formatCurrency(value as number),
    },
    {
      key: 'premio_valor',
      header: 'Prêmio',
      render: (value) => (
        value ? (
          <span className="text-green-400 font-semibold">{formatCurrency(value as number)}</span>
        ) : '-'
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'data_jogo',
      header: 'Data Jogo',
      hideOnMobile: true,
      render: (value) => new Date(value as string).toLocaleDateString('pt-BR'),
    },
    {
      key: 'created_at',
      header: 'Criado em',
      hideOnMobile: true,
      render: (value) => new Date(value as string).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Apostas</h1>
        <p className="text-sm md:text-base text-gray-400">Histórico de todas as apostas da plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Status:</span>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          {['', 'pendente', 'ganhou', 'perdeu'].map((status) => (
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
              {status === '' ? 'Todas' : status === 'pendente' ? 'Pendentes' : status === 'ganhou' ? 'Ganhou' : 'Perdeu'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={bets}
        isLoading={isLoading}
        emptyMessage="Nenhuma aposta encontrada"
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
    </div>
  );
}
