'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getPromotorDashboard, type PromotorDashboardData } from '@/lib/promotor/actions/dashboard';
import {
  Wallet,
  Users,
  ArrowDownToLine,
  TrendingDown,
  Percent,
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';

export default function PromotorDashboardPage() {
  const [data, setData] = useState<PromotorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getPromotorDashboard();
        setData(result);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopyLink = () => {
    if (!data) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${baseUrl}?ref=${data.promotor.codigo_afiliado}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="mt-2 text-zinc-400">Carregando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-zinc-400">
        Erro ao carregar dados
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400">Bem-vindo de volta, {data.promotor.nome}</p>
      </div>

      {/* Link de Afiliado */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
            <LinkIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-white">Seu Link de Afiliado</p>
            <p className="text-sm text-zinc-400">Código: {data.promotor.codigo_afiliado}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 font-mono text-sm text-zinc-300 truncate">
            {typeof window !== 'undefined' ? `${window.location.origin}?ref=${data.promotor.codigo_afiliado}` : `...?ref=${data.promotor.codigo_afiliado}`}
          </div>
          <button
            onClick={handleCopyLink}
            className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 transition-colors"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-sm text-zinc-400">Seu Saldo</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(data.promotor.saldo)}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-sm text-zinc-400">Indicados</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.stats.total_indicados}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
              <ArrowDownToLine className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-sm text-zinc-400">Tot. Depositado</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.total_depositado)}</p>
        </div>
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-sm text-zinc-400">Tot. Apostado</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.total_apostado)}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center justify-center">
              <Percent className="h-5 w-5 text-yellow-400" />
            </div>
            <span className="text-sm text-zinc-400">Com. Depósito</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.total_comissoes_deposito)}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
              <Percent className="h-5 w-5 text-red-400" />
            </div>
            <span className="text-sm text-zinc-400">Com. Perda</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.stats.total_comissoes_perda)}</p>
        </div>
      </div>

      {/* Configuração de Comissões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-4">Suas Taxas de Comissão</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">% em Depósitos</span>
              <span className="text-white font-medium">
                {data.promotor.comissao_deposito_percentual
                  ? `${data.promotor.comissao_deposito_percentual}%`
                  : 'Não configurado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">% em Perdas</span>
              <span className="text-white font-medium">
                {data.promotor.comissao_perda_percentual
                  ? `${data.promotor.comissao_perda_percentual}%`
                  : 'Não configurado'}
              </span>
            </div>
          </div>
        </div>

        {/* Últimas Comissões */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-4">Últimas Comissões</h3>
          {data.ultimasComissoes.length === 0 ? (
            <p className="text-zinc-400 text-sm">Nenhuma comissão ainda</p>
          ) : (
            <div className="space-y-2">
              {data.ultimasComissoes.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                >
                  <div>
                    <p className="text-sm text-green-400">{formatCurrency(c.valor_comissao)}</p>
                    <p className="text-xs text-zinc-500">
                      {c.tipo === 'deposito' ? 'Depósito' : c.tipo === 'perda' ? 'Perda' : 'Bônus'} - {c.user_nome}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(c.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
