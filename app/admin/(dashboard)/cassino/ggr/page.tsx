'use client';

import { useState, useEffect } from 'react';
import { getCasinoGGR, type GGRSummary } from '@/lib/admin/actions/casino';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/admin/shared';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface ProviderRow {
  provider: string;
  bets: number;
  wins: number;
  ggr: number;
  players: number;
}

export default function AdminCassinoGGRPage() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<GGRSummary | null>(null);

  useEffect(() => {
    loadGGR();
  }, []);

  async function loadGGR() {
    setLoading(true);
    const result = await getCasinoGGR(startDate, endDate);
    if (result.success && result.summary) {
      setSummary(result.summary);
    }
    setLoading(false);
  }

  const columns: Column<ProviderRow>[] = [
    {
      key: 'provider',
      header: 'Provedor',
      render: (value) => <span className="font-medium text-white">{value as string}</span>,
    },
    {
      key: 'bets',
      header: 'Apostas',
      render: (value) => <span className="text-zinc-300">{formatCurrency(value as number)}</span>,
    },
    {
      key: 'wins',
      header: 'Ganhos',
      render: (value) => <span className="text-zinc-300">{formatCurrency(value as number)}</span>,
    },
    {
      key: 'ggr',
      header: 'GGR',
      render: (value) => {
        const v = value as number;
        return (
          <span className={v >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
            {formatCurrency(v)}
          </span>
        );
      },
    },
    {
      key: 'players',
      header: 'Jogadores',
      render: (value) => <span className="text-zinc-300">{value as number}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cassino - Relatório GGR</h1>
        <p className="text-zinc-500">Gross Gaming Revenue por período</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div>
          <label className="text-sm font-medium text-zinc-300">Data Início</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-300">Data Fim</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
          />
        </div>
        <Button variant="teal" onClick={loadGGR} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Filtrar'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm">Total Apostas</span>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(summary.totalBets)}</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Total Ganhos</span>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(summary.totalWins)}</p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">GGR</span>
              </div>
              <p className={`text-xl font-bold ${summary.ggr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(summary.ggr)}
              </p>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Jogadores</span>
              </div>
              <p className="text-xl font-bold text-white">{summary.totalPlayers}</p>
            </div>
          </div>

          {/* Provider Table */}
          <DataTable
            columns={columns}
            data={summary.byProvider}
            isLoading={false}
            emptyMessage="Sem transações no período"
            rowKey="provider"
          />
        </>
      ) : (
        <p className="text-zinc-500 text-center py-8">Nenhum dado disponível</p>
      )}
    </div>
  );
}
