'use client';

import { useState, useEffect, use } from 'react';
import { PageLayout } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Loader2, Share2, AlertCircle } from 'lucide-react';

interface ApostaDetalhada {
  id: string;
  pule: string;
  tipo: string;
  modalidade: string;
  colocacao: string;
  palpites: string[];
  horarios: string[];
  data_jogo: string;
  valor_unitario: number;
  valor_total: number;
  multiplicador: number;
  status: string;
  premio_valor: number | null;
  created_at: string;
}

export default function PuleDetalhePage({ params }: { params: Promise<{ pule: string }> }) {
  const { pule: puleParam } = use(params);
  const [loading, setLoading] = useState(true);
  const [aposta, setAposta] = useState<ApostaDetalhada | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAposta = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Usuario nao autenticado');
        setLoading(false);
        return;
      }

      // Try to find by pule code first, then by ID
      let { data, error: queryError } = await supabase
        .from('apostas')
        .select('*')
        .eq('user_id', user.id)
        .eq('pule', puleParam)
        .single();

      if (queryError || !data) {
        // Try by ID
        const result = await supabase
          .from('apostas')
          .select('*')
          .eq('user_id', user.id)
          .eq('id', puleParam)
          .single();

        data = result.data;
        queryError = result.error;
      }

      if (queryError || !data) {
        setError('Pule nao encontrada');
      } else {
        setAposta(data);
      }

      setLoading(false);
    };

    fetchAposta();
  }, [puleParam]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'premiada':
        return 'bg-green-500';
      case 'cancelada':
        return 'bg-red-500';
      case 'pendente':
        return 'bg-yellow-500';
      case 'perdida':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'premiada':
        return 'PREMIADA';
      case 'cancelada':
        return 'CANCELADA';
      case 'pendente':
        return 'PENDENTE';
      case 'perdida':
        return 'PERDIDA';
      default:
        return status.toUpperCase();
    }
  };

  const handleShare = async () => {
    if (!aposta) return;

    const text = `
PULE #${aposta.pule || aposta.id.slice(0, 8).toUpperCase()}

Tipo: ${aposta.tipo.toUpperCase()}
Modalidade: ${aposta.modalidade.toUpperCase()}
Colocacao: ${aposta.colocacao}

Palpites: ${aposta.palpites.join(', ')}
Horarios: ${aposta.horarios.join(', ')}
Data do Jogo: ${new Date(aposta.data_jogo).toLocaleDateString('pt-BR')}

Valor Unitario: ${formatCurrency(aposta.valor_unitario)}
Valor Total: ${formatCurrency(aposta.valor_total)}
Multiplicador: ${aposta.multiplicador}x

Status: ${getStatusLabel(aposta.status)}
${aposta.premio_valor ? `Premio: ${formatCurrency(aposta.premio_valor)}` : ''}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copiado para a area de transferencia!');
    }
  };

  if (loading) {
    return (
      <PageLayout title="PULE" showBack>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </PageLayout>
    );
  }

  if (error || !aposta) {
    return (
      <PageLayout title="PULE" showBack>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <p className="text-gray-500">{error || 'Pule nao encontrada'}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="PULE" showBack>
      <div className="space-y-4 p-4">
        {/* Header com código e status */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className={`px-4 py-3 ${getStatusColor(aposta.status)}`}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">
                PULE #{aposta.pule || aposta.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="rounded bg-white/20 px-2 py-1 text-sm font-semibold text-white">
                {getStatusLabel(aposta.status)}
              </span>
            </div>
          </div>
          <div className="px-4 py-3 text-center text-sm text-gray-500">
            Criada em {new Date(aposta.created_at).toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Informações do Jogo */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">INFORMACOES DO JOGO</span>
          </div>
          <div className="divide-y divide-gray-100 px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Tipo</span>
              <span className="font-semibold text-gray-800">{aposta.tipo.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Modalidade</span>
              <span className="font-semibold text-gray-800">{aposta.modalidade.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Colocacao</span>
              <span className="font-semibold text-gray-800">{aposta.colocacao}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Data do Jogo</span>
              <span className="font-semibold text-gray-800">
                {new Date(aposta.data_jogo).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Palpites */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">PALPITES</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {aposta.palpites.map((palpite, index) => (
                <span
                  key={index}
                  className="rounded-lg bg-zinc-100 px-3 py-2 font-mono font-semibold text-zinc-800"
                >
                  {palpite}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Horários */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">HORARIOS</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {aposta.horarios.map((horario, index) => (
                <span
                  key={index}
                  className="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold text-white"
                >
                  {horario}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Valores */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">VALORES</span>
          </div>
          <div className="divide-y divide-gray-100 px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Valor Unitario</span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(aposta.valor_unitario)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Multiplicador</span>
              <span className="font-semibold text-gray-800">{aposta.multiplicador}x</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Valor Total</span>
              <span className="text-lg font-bold text-gray-800">
                {formatCurrency(aposta.valor_total)}
              </span>
            </div>
          </div>
        </div>

        {/* Premio (se ganhou) */}
        {aposta.status === 'premiada' && aposta.premio_valor && (
          <div className="overflow-hidden rounded-lg bg-green-500 shadow-sm">
            <div className="px-4 py-4 text-center">
              <p className="text-sm text-white/80">PREMIO</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(aposta.premio_valor)}
              </p>
            </div>
          </div>
        )}

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 py-4 text-white active:bg-zinc-700"
        >
          <Share2 className="h-5 w-5" />
          <span className="font-semibold">Compartilhar</span>
        </button>
      </div>
    </PageLayout>
  );
}
