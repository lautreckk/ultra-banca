'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getPromotorReferidos, type PromotorReferido } from '@/lib/promotor/actions/dashboard';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PromotorReferidosPage() {
  const [referidos, setReferidos] = useState<PromotorReferido[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 20;

  const fetchReferidos = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPromotorReferidos({ page, pageSize });
      setReferidos(result.referidos);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching referidos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReferidos();
  }, [fetchReferidos]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCPF = (cpf: string) => {
    // Mascarar CPF para privacidade
    if (cpf.length === 11) {
      return `${cpf.slice(0, 3)}.***.***-${cpf.slice(-2)}`;
    }
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Indicados</h1>
        <p className="text-zinc-400">Pessoas que se cadastraram usando seu link</p>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="mt-2 text-zinc-400">Carregando...</p>
        </div>
      ) : referidos.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">Nenhum indicado ainda</p>
          <p className="text-sm text-zinc-500 mt-2">
            Compartilhe seu link de afiliado para começar a indicar
          </p>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-sm text-zinc-400">Total de Indicados</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(referidos.reduce((sum, r) => sum + r.total_depositado, 0))}
              </p>
              <p className="text-sm text-zinc-400">Total Depositado</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {formatCurrency(referidos.reduce((sum, r) => sum + r.total_apostado, 0))}
              </p>
              <p className="text-sm text-zinc-400">Total Apostado</p>
            </div>
          </div>

          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {referidos.map((referido) => (
              <div
                key={referido.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3"
              >
                <div>
                  <p className="font-medium text-white">{referido.nome}</p>
                  <p className="text-sm text-zinc-400">{formatCPF(referido.cpf)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-zinc-800/50 rounded-xl p-2">
                    <p className="text-zinc-400 text-xs">Cadastro</p>
                    <p className="text-white">{formatDate(referido.created_at)}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-2">
                    <p className="text-zinc-400 text-xs">Depositado</p>
                    <p className="text-green-400">{formatCurrency(referido.total_depositado)}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-2 col-span-2">
                    <p className="text-zinc-400 text-xs">Apostado</p>
                    <p className="text-white">{formatCurrency(referido.total_apostado)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Cadastro</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Depositado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Apostado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {referidos.map((referido) => (
                    <tr key={referido.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{referido.nome}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatCPF(referido.cpf)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatDate(referido.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-green-400">{formatCurrency(referido.total_depositado)}</td>
                      <td className="px-4 py-3 text-sm text-zinc-300">{formatCurrency(referido.total_apostado)}</td>
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
                Página {page} de {totalPages}
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
