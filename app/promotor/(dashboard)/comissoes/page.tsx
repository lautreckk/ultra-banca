'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getPromotorComissoes, type PromotorComissao } from '@/lib/promotor/actions/dashboard';
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowDownToLine,
  TrendingDown,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PromotorComissoesPage() {
  const [comissoes, setComissoes] = useState<PromotorComissao[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 20;

  const fetchComissoes = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPromotorComissoes({
        page,
        pageSize,
        tipo: tipoFilter || undefined,
      });
      setComissoes(result.comissoes);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching comissoes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, tipoFilter]);

  useEffect(() => {
    fetchComissoes();
  }, [fetchComissoes]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'deposito':
        return <ArrowDownToLine className="h-4 w-4 text-green-400" />;
      case 'perda':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-purple-400" />;
      default:
        return <Wallet className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'deposito':
        return 'Depósito';
      case 'perda':
        return 'Perda';
      case 'bonus':
        return 'Bônus';
      default:
        return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'deposito':
        return 'bg-green-500/20 text-green-400';
      case 'perda':
        return 'bg-red-500/20 text-red-400';
      case 'bonus':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const totalComissoes = comissoes.reduce((sum, c) => sum + c.valor_comissao, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Comissões</h1>
        <p className="text-zinc-400">Histórico de todas as suas comissões</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={tipoFilter}
          onChange={(e) => {
            setTipoFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Todos os tipos</option>
          <option value="deposito">Depósito</option>
          <option value="perda">Perda</option>
          <option value="bonus">Bônus</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="mt-2 text-zinc-400">Carregando...</p>
        </div>
      ) : comissoes.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">Nenhuma comissão encontrada</p>
          <p className="text-sm text-zinc-500 mt-2">
            Suas comissões aparecerão aqui quando seus indicados fizerem depósitos
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Total de comissões na página:</span>
              <span className="text-xl font-bold text-green-400">{formatCurrency(totalComissoes)}</span>
            </div>
          </div>

          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {comissoes.map((comissao) => (
              <div
                key={comissao.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTipoIcon(comissao.tipo)}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoColor(comissao.tipo)}`}>
                      {getTipoLabel(comissao.tipo)}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-400">{formatCurrency(comissao.valor_comissao)}</span>
                </div>
                <div className="text-sm">
                  <p className="text-white">{comissao.user_nome}</p>
                  <p className="text-zinc-400">
                    Base: {formatCurrency(comissao.valor_base)} ({comissao.percentual_aplicado}%)
                  </p>
                </div>
                <p className="text-xs text-zinc-500">{formatDateTime(comissao.created_at)}</p>
              </div>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Valor Base</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">%</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {comissoes.map((comissao) => (
                    <tr key={comissao.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatDateTime(comissao.created_at)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTipoColor(comissao.tipo)}`}>
                          {getTipoIcon(comissao.tipo)}
                          {getTipoLabel(comissao.tipo)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{comissao.user_nome}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatCurrency(comissao.valor_base)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{comissao.percentual_aplicado}%</td>
                      <td className="px-4 py-3 text-sm text-green-400 font-medium">{formatCurrency(comissao.valor_comissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <span className="text-sm text-zinc-400">
                Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, total)} de {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="border-zinc-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="border-zinc-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
