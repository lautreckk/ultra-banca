'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, StatusBadge } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getBets, type Bet } from '@/lib/admin/actions/bets';
import { Filter } from 'lucide-react';
import { BANCAS } from '@/lib/constants/bancas';

// Função para converter ID da loteria para nome legível
function getLoteriaDisplay(loterias: string[], horarios: string[]): string {
  if (!loterias || loterias.length === 0) {
    if (horarios && horarios.length > 0) {
      return horarios.join(', ');
    }
    return '-';
  }

  const names = loterias.map(id => {
    for (const banca of BANCAS) {
      const sub = banca.subLoterias.find(s => s.id === id);
      if (sub) {
        return `${sub.nome} ${sub.horario}`;
      }
    }
    return id;
  });

  if (names.length <= 2) {
    return names.join(', ');
  }
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

// Função para formatar colocação
function formatColocacao(colocacao: string): string {
  const map: Record<string, string> = {
    '1_premio': '1º Prêmio',
    '2_premio': '2º Prêmio',
    '3_premio': '3º Prêmio',
    '4_premio': '4º Prêmio',
    '5_premio': '5º Prêmio',
    '1_5_premio': '1º ao 5º',
    '1_7_premio': '1º ao 7º',
  };
  return map[colocacao] || colocacao;
}

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
      key: 'loterias',
      header: 'Loteria/Horário',
      hideOnMobile: true,
      render: (value, row) => (
        <span className="text-xs" title={(value as string[])?.join(', ')}>
          {getLoteriaDisplay(value as string[], row.horarios as string[])}
        </span>
      ),
    },
    {
      key: 'modalidade',
      header: 'Modalidade',
      render: (value) => <span className="capitalize">{value as string}</span>,
    },
    {
      key: 'colocacao',
      header: 'Colocação',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-xs text-gray-300">{formatColocacao(value as string)}</span>
      ),
    },
    {
      key: 'palpites',
      header: 'Palpites',
      render: (value) => {
        const palpites = value as string[];
        const display = palpites.slice(0, 3).join(', ');
        return (
          <span className="text-gray-300 font-mono" title={palpites.join(', ')}>
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
      render: (value) => {
        // Adiciona T12:00:00 para evitar problema de timezone (UTC-3 mostrando dia anterior)
        const dateStr = value as string;
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
      },
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
          {['', 'pendente', 'confirmada', 'premiada', 'perdeu'].map((status) => (
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
              {status === '' ? 'Todas' : status === 'pendente' ? 'Pendentes' : status === 'confirmada' ? 'Confirmadas' : status === 'premiada' ? 'Premiadas' : 'Perdeu'}
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
