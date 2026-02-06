'use client';

import { useState, useEffect, use } from 'react';
import { PageLayout } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Loader2, Share2, AlertCircle, XCircle, Clock } from 'lucide-react';

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
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Check if bet can be cancelled (at least 1 hour before first draw)
  const canCancelBet = (bet: ApostaDetalhada): { allowed: boolean; reason?: string } => {
    // Only pending bets can be cancelled
    if (bet.status !== 'pendente') {
      return { allowed: false, reason: 'Apenas apostas pendentes podem ser canceladas' };
    }

    // Get the earliest draw time
    const drawTimes = bet.horarios.map(h => {
      const [hours, minutes] = h.split(':').map(Number);
      return hours * 60 + minutes; // Convert to minutes
    });
    const earliestDrawMinutes = Math.min(...drawTimes);
    const earliestDrawTime = `${String(Math.floor(earliestDrawMinutes / 60)).padStart(2, '0')}:${String(earliestDrawMinutes % 60).padStart(2, '0')}`;

    // Create date-time for the draw
    const drawDate = new Date(bet.data_jogo + 'T' + earliestDrawTime + ':00');
    const now = new Date();

    // Calculate cutoff time (1 hour before draw)
    const cutoffTime = new Date(drawDate.getTime() - 60 * 60 * 1000);

    if (now >= cutoffTime) {
      const diffMinutes = Math.round((drawDate.getTime() - now.getTime()) / (60 * 1000));
      if (diffMinutes > 0) {
        return { allowed: false, reason: `Prazo expirado. Faltam apenas ${diffMinutes} minutos para o sorteio das ${earliestDrawTime}` };
      }
      return { allowed: false, reason: 'O sorteio ja ocorreu ou esta em andamento' };
    }

    return { allowed: true };
  };

  const handleCancelBet = async () => {
    if (!aposta) return;

    setCancelling(true);
    const supabase = createClient();

    try {
      // Call the cancel_bet function
      const { error: cancelError } = await supabase.rpc('cancel_bet', {
        p_aposta_id: aposta.id
      });

      if (cancelError) {
        alert(cancelError.message || 'Erro ao cancelar aposta');
        setCancelling(false);
        return;
      }

      // Reload the bet data
      const { data: updatedBet } = await supabase
        .from('apostas')
        .select('*')
        .eq('id', aposta.id)
        .single();

      if (updatedBet) {
        setAposta(updatedBet);
      }

      setShowCancelConfirm(false);
      alert('Aposta cancelada com sucesso! O valor foi estornado para seu saldo.');
    } catch (err) {
      alert('Erro ao cancelar aposta');
    } finally {
      setCancelling(false);
    }
  };

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
Data do Jogo: ${new Date(aposta.data_jogo + 'T12:00:00').toLocaleDateString('pt-BR')}

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
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </PageLayout>
    );
  }

  if (error || !aposta) {
    return (
      <PageLayout title="PULE" showBack>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <p className="text-zinc-500">{error || 'Pule nao encontrada'}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="PULE" showBack>
      <div className="space-y-4 p-4">
        {/* Header com codigo e status */}
        <div className="overflow-hidden rounded-lg bg-[#1A1F2B] shadow-sm">
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
          <div className="px-4 py-3 text-center text-sm text-zinc-500">
            Criada em {new Date(aposta.created_at).toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Informacoes do Jogo */}
        <div className="overflow-hidden rounded-lg bg-[#1A1F2B] shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">INFORMACOES DO JOGO</span>
          </div>
          <div className="divide-y divide-zinc-700/30 px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Tipo</span>
              <span className="font-semibold text-white">{aposta.tipo.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Modalidade</span>
              <span className="font-semibold text-white">{aposta.modalidade.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Colocacao</span>
              <span className="font-semibold text-white">{aposta.colocacao}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Data do Jogo</span>
              <span className="font-semibold text-white">
                {new Date(aposta.data_jogo + 'T12:00:00').toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Palpites */}
        <div className="overflow-hidden rounded-lg bg-[#1A1F2B] shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">PALPITES</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {aposta.palpites.map((palpite, index) => (
                <span
                  key={index}
                  className="rounded-lg bg-zinc-800/30 px-3 py-2 font-mono font-semibold text-white"
                >
                  {palpite}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="overflow-hidden rounded-lg bg-[#1A1F2B] shadow-sm">
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
        <div className="overflow-hidden rounded-lg bg-[#1A1F2B] shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">VALORES</span>
          </div>
          <div className="divide-y divide-zinc-700/30 px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Valor Unitario</span>
              <span className="font-semibold text-white">
                {formatCurrency(aposta.valor_unitario)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Multiplicador</span>
              <span className="font-semibold text-white">{aposta.multiplicador}x</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Valor Total</span>
              <span className="text-lg font-bold text-white">
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

        {/* Cancel Button (if allowed) */}
        {aposta.status === 'pendente' && (() => {
          const cancelCheck = canCancelBet(aposta);
          return (
            <div className="space-y-2">
              {cancelCheck.allowed ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 py-4 text-white active:bg-red-600"
                >
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Cancelar Aposta</span>
                </button>
              ) : (
                <div className="rounded-lg bg-zinc-800/30 p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Cancelamento indisponivel</p>
                      <p className="text-xs text-zinc-500">{cancelCheck.reason}</p>
                      <p className="text-xs text-zinc-500 mt-1">Prazo: ate 1 hora antes do sorteio</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 py-4 text-white active:bg-zinc-700"
        >
          <Share2 className="h-5 w-5" />
          <span className="font-semibold">Compartilhar</span>
        </button>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#1A1F2B] p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-white">Cancelar Aposta?</h3>
                <p className="text-sm text-zinc-500">Esta acao nao pode ser desfeita</p>
              </div>
            </div>

            <div className="mb-4 rounded-lg bg-zinc-800/30 p-3">
              <p className="text-sm text-zinc-400">
                O valor de <strong className="text-white">{formatCurrency(aposta?.valor_total || 0)}</strong> sera
                estornado para seu saldo.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1 rounded-lg bg-zinc-700 py-3 font-semibold text-zinc-200 active:bg-zinc-600 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelBet}
                disabled={cancelling}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 py-3 font-semibold text-white active:bg-red-600 disabled:opacity-50"
              >
                {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
