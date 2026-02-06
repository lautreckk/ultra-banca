'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCasinoTransactions, type CasinoTransaction, type CasinoTransactionsParams } from '@/lib/admin/actions/casino';
import { DataTable, type Column } from '@/components/admin/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const txnTypeLabels: Record<string, { label: string; color: string }> = {
  debit: { label: 'Aposta', color: 'text-red-400' },
  credit: { label: 'Ganho', color: 'text-green-400' },
  debit_credit: { label: 'Aposta+Ganho', color: 'text-yellow-400' },
  bonus: { label: 'Bônus', color: 'text-purple-400' },
};

export default function AdminCassinoTransacoesPage() {
  const [transactions, setTransactions] = useState<CasinoTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [provider, setProvider] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const params: CasinoTransactionsParams = { page, pageSize };
    if (provider) params.provider = provider;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const result = await getCasinoTransactions(params);
    setTransactions(result.transactions);
    setTotal(result.total);
    setIsLoading(false);
  }, [page, provider, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleFilter() {
    setPage(1);
    fetchData();
  }

  const columns: Column<CasinoTransaction>[] = [
    {
      key: 'created_at',
      header: 'Data',
      render: (value) => <span className="text-zinc-300 text-sm">{formatDate(value as string)}</span>,
    },
    {
      key: 'user_name',
      header: 'Usuário',
      render: (value, row) => (
        <div>
          <span className="font-medium text-white text-sm">{value as string}</span>
          <p className="text-xs text-zinc-500">{row.user_cpf}</p>
        </div>
      ),
    },
    {
      key: 'provider_code',
      header: 'Provedor',
      render: (value) => <span className="text-zinc-300 text-sm">{(value as string) || '-'}</span>,
    },
    {
      key: 'game_code',
      header: 'Jogo',
      render: (value) => <span className="text-zinc-300 text-sm truncate max-w-[120px] block">{(value as string) || '-'}</span>,
    },
    {
      key: 'txn_type',
      header: 'Tipo',
      render: (value) => {
        const type = txnTypeLabels[value as string] || { label: value as string, color: 'text-zinc-500' };
        return <span className={`text-sm font-medium ${type.color}`}>{type.label}</span>;
      },
    },
    {
      key: 'bet',
      header: 'Aposta',
      render: (value) => {
        const v = value as number;
        return <span className={v > 0 ? 'text-red-400 text-sm' : 'text-zinc-500 text-sm'}>{v > 0 ? formatCurrency(v) : '-'}</span>;
      },
    },
    {
      key: 'win',
      header: 'Ganho',
      render: (value) => {
        const v = value as number;
        return <span className={v > 0 ? 'text-green-400 text-sm' : 'text-zinc-500 text-sm'}>{v > 0 ? formatCurrency(v) : '-'}</span>;
      },
    },
    {
      key: 'balance_after',
      header: 'Saldo',
      render: (value) => <span className="text-zinc-300 text-sm">{formatCurrency(value as number)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cassino - Transações</h1>
        <p className="text-zinc-500">Histórico de transações do cassino</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
        <div>
          <label className="text-sm font-medium text-zinc-300">Provedor</label>
          <Input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
            placeholder="Ex: pragmatic"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300">Data Início</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300">Data Fim</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
          />
        </div>
        <Button variant="teal" onClick={handleFilter}>
          Filtrar
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        emptyMessage="Nenhuma transação encontrada"
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
