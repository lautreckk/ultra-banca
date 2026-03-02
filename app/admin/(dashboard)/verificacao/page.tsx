'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, StatCard, StatusBadge } from '@/components/admin/shared';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format-currency';
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RefreshCw,
  Calendar,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

interface VerificationStats {
  pendentes: number;
  premiadas: number;
  perderam: number;
}

interface VerificationResult {
  data: string;
  horario: string | null;
  total_verificadas: number;
  total_premiadas: number;
  total_perderam: number;
  total_creditos: number;
  executado_em: string;
}

interface ApostaPremiada {
  id: string;
  user_id: string;
  user_name?: string;
  user_cpf?: string;
  tipo: string;
  modalidade: string;
  palpites: string[];
  horarios: string[];
  data_jogo: string;
  valor_total: number;
  premio_valor: number;
  status: string;
  created_at: string;
}

interface VerificacaoLog {
  id: string;
  aposta_id: string;
  resultado_id: string;
  palpite: string;
  premio_posicao: number;
  premio_numero: string;
  ganhou: boolean;
  premio_calculado: number;
  created_at: string;
}

export default function AdminVerificacaoPage() {
  const [stats, setStats] = useState<VerificationStats>({ pendentes: 0, premiadas: 0, perderam: 0 });
  const [apostasPremiadas, setApostasPremiadas] = useState<ApostaPremiada[]>([]);
  const [logs, setLogs] = useState<VerificacaoLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<VerificationResult | null>(null);
  const [dataFilter, setDataFilter] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/admin/verificar-premios');
      const statsData = await statsResponse.json();

      if (statsData.stats) {
        setStats(statsData.stats);
      }
      if (statsData.ultimasVerificacoes) {
        setLogs(statsData.ultimasVerificacoes);
      }

      // Fetch apostas premiadas
      const { data: premiadas, count, error } = await supabase
        .from('apostas')
        .select(`
          *,
          profiles:user_id (nome, cpf)
        `, { count: 'exact' })
        .eq('status', 'premiada')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (!error && premiadas) {
        const formattedPremiadas = premiadas.map((a) => ({
          ...a,
          user_name: a.profiles?.nome || 'N/A',
          user_cpf: a.profiles?.cpf || 'N/A',
        }));
        setApostasPremiadas(formattedPremiadas);
        setTotal(count || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerificar = async (data?: string, horario?: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/admin/verificar-premios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data || dataFilter, horario }),
      });

      const result = await response.json();

      if (result.success) {
        setLastResult(result.result);
        await fetchData();
      } else {
        console.error('Erro na verificação:', result.error);
      }
    } catch (error) {
      console.error('Erro ao verificar:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const columns: Column<ApostaPremiada>[] = [
    {
      key: 'user_name',
      header: 'Usuário',
      mobileHeader: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-white">{value as string}</p>
          <p className="text-xs text-zinc-500">
            {(row.user_cpf as string)?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
          </p>
        </div>
      ),
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
        return (
          <span className="font-mono text-cyan-400">
            {palpites.slice(0, 2).join(', ')}
            {palpites.length > 2 ? ` +${palpites.length - 2}` : ''}
          </span>
        );
      },
    },
    {
      key: 'valor_total',
      header: 'Aposta',
      hideOnMobile: true,
      render: (value) => formatCurrency(value as number),
    },
    {
      key: 'premio_valor',
      header: 'Prêmio',
      render: (value) => (
        <span className="text-emerald-400 font-bold">
          {formatCurrency(value as number)}
        </span>
      ),
    },
    {
      key: 'data_jogo',
      header: 'Data',
      hideOnMobile: true,
      render: (value) => new Date(value as string).toLocaleDateString('pt-BR'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Verificação de Prêmios</h1>
          <p className="text-zinc-500">Dashboard de verificação e pagamento de apostas</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="date"
              value={dataFilter}
              onChange={(e) => setDataFilter(e.target.value)}
              className="pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <button
            onClick={() => handleVerificar()}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
          >
            {isVerifying ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Verificar Apostas
          </button>

          <button
            onClick={() => fetchData()}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pendentes"
          value={stats.pendentes}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Premiadas"
          value={stats.premiadas}
          icon={Trophy}
          variant="success"
        />
        <StatCard
          title="Perderam"
          value={stats.perderam}
          icon={XCircle}
          variant="danger"
        />
        <StatCard
          title="Total Verificadas"
          value={stats.premiadas + stats.perderam}
          icon={CheckCircle}
          variant="info"
        />
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-xl p-4">
          <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Última Verificação
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Data</p>
              <p className="text-white">{new Date(lastResult.data).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-zinc-500">Verificadas</p>
              <p className="text-white">{lastResult.total_verificadas}</p>
            </div>
            <div>
              <p className="text-zinc-500">Premiadas</p>
              <p className="text-emerald-400">{lastResult.total_premiadas}</p>
            </div>
            <div>
              <p className="text-zinc-500">Perderam</p>
              <p className="text-red-400">{lastResult.total_perderam}</p>
            </div>
            <div>
              <p className="text-zinc-500">Créditos Pagos</p>
              <p className="text-emerald-400 font-bold">{formatCurrency(lastResult.total_creditos)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Apostas Premiadas Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Apostas Premiadas
        </h2>

        <DataTable
          columns={columns}
          data={apostasPremiadas}
          isLoading={isLoading}
          emptyMessage="Nenhuma aposta premiada encontrada"
          rowKey="id"
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
          }}
        />
      </div>

      {/* Logs de Verificação */}
      {logs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Últimas Verificações</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Palpite</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Posição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Prêmio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Resultado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-800/30 last:border-0">
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-cyan-400">
                        {log.palpite}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {log.premio_posicao}º
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-amber-400">
                        {log.premio_numero}
                      </td>
                      <td className="px-4 py-3">
                        {log.ganhou ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Ganhou
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Perdeu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-400">
                        {log.ganhou ? formatCurrency(log.premio_calculado) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Cron Jobs Ativos</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Manhã (12:15, 12:30, 12:45)</span>
              <span className="text-emerald-400">Ativo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Tarde (15:15, 15:30, 15:45)</span>
              <span className="text-emerald-400">Ativo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Noite (19:15, 19:30, 19:45)</span>
              <span className="text-emerald-400">Ativo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Coruja (21:30, 21:45, 22:00)</span>
              <span className="text-emerald-400">Ativo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Cleanup (00:00)</span>
              <span className="text-emerald-400">Ativo</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Regras de Verificação</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">MILHAR</span>
              <span className="text-cyan-400 font-mono">4 dígitos exatos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">CENTENA</span>
              <span className="text-cyan-400 font-mono">últimos 3 dígitos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">DEZENA</span>
              <span className="text-cyan-400 font-mono">últimos 2 dígitos</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">GRUPO</span>
              <span className="text-cyan-400 font-mono">grupo do bicho (1-25)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">UNIDADE</span>
              <span className="text-cyan-400 font-mono">último dígito</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
