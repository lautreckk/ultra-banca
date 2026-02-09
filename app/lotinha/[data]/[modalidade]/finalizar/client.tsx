'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Menu, RefreshCw, Home, Share2, Printer, Loader2, X } from 'lucide-react';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';
import { createClient } from '@/lib/supabase/client';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import type { ModalidadeDB } from '@/lib/actions/modalidades';

interface LotinhaFinalizarClientProps {
  data: string;
  modalidade: ModalidadeDB;
}

function LotinhaFinalizarContent({ data: dataJogo, modalidade }: LotinhaFinalizarClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const config = usePlatformConfig();
  const { saldo, saldoBonus } = useUserBalance();

  const modalidadeId = modalidade.codigo;
  const palpitesStr = searchParams.get('palpites') || '';
  const valorParam = searchParams.get('valor') || '0';
  const diasParam = searchParams.get('dias') || '';

  const palpites = palpitesStr.split('|').filter(Boolean);
  const valorPorPalpite = parseFloat(valorParam);
  const dias = diasParam.split(',').filter(Boolean);
  const valorTotal = valorPorPalpite * palpites.length * dias.length;

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puleNumber, setPuleNumber] = useState('');
  const [novoSaldo, setNovoSaldo] = useState<number | null>(null);
  const [confirmationTime, setConfirmationTime] = useState('');

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleFinalizar = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('place_bet', {
        p_tipo: 'lotinha',
        p_modalidade: modalidadeId,
        p_colocacao: 'geral',
        p_palpites: palpites,
        p_horarios: dias,
        p_loterias: [],
        p_data_jogo: dataJogo,
        p_valor_unitario: valorPorPalpite,
        p_multiplicador: modalidade.multiplicador,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Erro ao registrar aposta');
      }

      setPuleNumber(data.pule);
      setNovoSaldo(data.saldo_restante);

      const now = new Date();
      const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setConfirmationTime(timeStr);

      setIsConfirmed(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar aposta';
      setError(errorMessage);
      console.error('Erro ao finalizar aposta:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoltar = () => {
    router.push('/');
  };

  const handleShare = () => {
    navigator.share?.({
      title: `Aposta Lotinha - ${config.site_name}`,
      text: `PULE #${puleNumber}\n${modalidade.nome}\nTotal: R$ ${formatCurrency(valorTotal)}`,
    });
  };

  return (
    <div className="min-h-screen bg-[#111318] flex justify-center">
      <div className="w-full max-w-md bg-[#111318] min-h-screen shadow-xl flex flex-col">
        <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
          <div className="flex h-12 items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <span className="text-base font-bold text-white">FINALIZAR APOSTA</span>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
          </div>
        </header>

        <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
          <button className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10" aria-label="Atualizar saldo">
            <RefreshCw className="h-5 w-5 text-white" />
          </button>
          <span className="text-white font-medium">
            {novoSaldo !== null ? `R$ ${formatCurrency(novoSaldo)}` : `R$ ${formatCurrencyCompact(saldo)} | ${formatCurrencyCompact(saldoBonus)}`}
          </span>
        </div>

        {error && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
            <div className="bg-red-600 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-lg">
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="flex h-11 w-11 items-center justify-center"
                aria-label="Fechar erro"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-zinc-800/50 flex-1 p-4">
        <div className="bg-[#1A1F2B] rounded-xl border border-zinc-700/40 p-4 mb-4">
          <div className="text-xs text-zinc-500 mb-2">PULE #{puleNumber || ''}</div>
          <div className="text-center mb-4">
            <span className="text-lg font-bold text-white">{config.site_name.toUpperCase()}</span>
            <div className="flex justify-center mt-2">
              {config.logo_url ? (
                <Image
                  src={config.logo_url}
                  alt={config.site_name}
                  width={100}
                  height={70}
                  className="object-contain"
                  unoptimized={config.logo_url.includes('supabase.co')}
                />
              ) : (
                <div className="w-20 h-16 bg-[#111318] rounded-xl flex items-center justify-center">
                  <span className="text-[#E5A220] font-bold text-xs text-center">{config.site_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-center flex-1">
              <div className="text-xs text-zinc-500">VENDEDOR</div>
              <div className="text-sm font-bold text-white">979536</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs text-zinc-500">STATUS</div>
              <div className={`text-sm font-bold ${isConfirmed ? 'text-green-500' : 'text-yellow-500'}`}>
                {isConfirmed ? 'REGISTRADA' : 'PENDENTE'}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-700/40 my-3" />

          <div className="mb-4">
            {dias.map((dia, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-zinc-300 mb-1">
                <span className="text-zinc-500">-</span>
                <span className={isConfirmed ? 'text-green-600' : ''}>LOTO FACIL - {dia}</span>
                {isConfirmed && <span className="text-green-600 text-xs ml-auto">REGISTRADA</span>}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="flex-1 border-t border-zinc-700/40" />
              <span className="px-2 text-xs text-zinc-500">MODALIDADES</span>
              <div className="flex-1 border-t border-zinc-700/40" />
            </div>
            <div className="font-bold text-white mb-2">{modalidade.nome}</div>
            <div className="space-y-1 mb-3">
              {palpites.map((palpite, index) => (
                <div key={index} className="inline-block bg-zinc-800/50 border border-zinc-700/40 rounded-xl px-2 py-1 text-xs mr-2 mb-1">
                  {palpite}
                </div>
              ))}
            </div>
            <div className="text-sm text-zinc-400">R$ {formatCurrency(valorPorPalpite)} / CADA</div>
          </div>

          <div className="border-t border-dashed border-zinc-700/40 pt-3">
            <div className="text-center font-bold text-lg">TOTAL: R$ {formatCurrency(valorTotal)}</div>
          </div>

          {isConfirmed && (
            <div className="mt-4 text-center">
              <div className="text-green-600 text-sm mb-1">Aposta registrada com sucesso!</div>
              <div className="text-zinc-500 text-xs">{confirmationTime}</div>
              {novoSaldo !== null && (
                <div className="text-green-600 text-sm mt-2">
                  Novo saldo: R$ {formatCurrency(novoSaldo)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-zinc-700/40 my-4" />

        {!isConfirmed ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleVoltar}
              disabled={isLoading}
              className="h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
              aria-label="Voltar ao inicio"
            >
              <Home className="h-5 w-5" />
              Voltar
            </button>
            <button
              onClick={handleFinalizar}
              disabled={isLoading}
              className="h-14 min-h-[56px] bg-[#3B82F6] rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
              aria-label="Finalizar e salvar aposta"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                'Finalizar e salvar'
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="h-14 min-h-[56px] bg-[#3B82F6] rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              aria-label="Compartilhar aposta"
            >
              <Share2 className="h-5 w-5" />
              Compartilhar
            </button>
            <button
              onClick={() => window.print()}
              className="h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              aria-label="Imprimir comprovante"
            >
              <Printer className="h-5 w-5" />
              Imprimir
            </button>
          </div>
        )}

        {isConfirmed && (
          <button
            onClick={handleVoltar}
            className="w-full mt-3 h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-zinc-300 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            aria-label="Voltar ao inicio"
          >
            <Home className="h-5 w-5" />
            Voltar ao Inicio
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

export function LotinhaFinalizarClient(props: LotinhaFinalizarClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111318]" />}>
      <LotinhaFinalizarContent {...props} />
    </Suspense>
  );
}
