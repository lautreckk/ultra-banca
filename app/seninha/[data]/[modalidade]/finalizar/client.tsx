'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Menu, RefreshCw, EyeOff, Home, Share2, Printer, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import type { ModalidadeDB } from '@/lib/actions/modalidades';

interface SeninhaFinalizarClientProps {
  data: string;
  modalidade: ModalidadeDB;
}

function SeninhaFinalizarContent({ data: dataJogo, modalidade }: SeninhaFinalizarClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const config = usePlatformConfig();

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
        p_tipo: 'seninha',
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
      title: `Aposta Seninha - ${config.site_name}`,
      text: `PULE #${puleNumber}\n${modalidade.nome}\nTotal: R$ ${formatCurrency(valorTotal)}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-300 flex justify-center">
      <div className="w-full max-w-md bg-[#1A202C] min-h-screen shadow-xl flex flex-col">
        <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
          <div className="flex h-12 items-center justify-between">
            <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center">
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <span className="text-sm font-bold text-white">FINALIZAR APOSTA</span>
            <button className="flex h-10 w-10 items-center justify-center">
              <Menu className="h-5 w-5 text-white" />
            </button>
          </div>
        </header>

        <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
          <RefreshCw className="h-5 w-5 text-white" />
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">
              {novoSaldo !== null ? `R$ ${formatCurrency(novoSaldo)}` : 'R$ *******'}
            </span>
            <EyeOff className="h-5 w-5 text-white" />
          </div>
        </div>

        {error && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
            <div className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-lg">
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-100 flex-1 p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="text-xs text-gray-500 mb-2">PULE #{puleNumber || ''}</div>
          <div className="text-center mb-4">
            <span className="text-lg font-bold text-gray-900">{config.site_name.toUpperCase()}</span>
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
                <div className="w-20 h-16 bg-[#1A202C] rounded-lg flex items-center justify-center">
                  <span className="text-[#E5A220] font-bold text-xs text-center">{config.site_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-center flex-1">
              <div className="text-xs text-gray-500">VENDEDOR</div>
              <div className="text-sm font-bold text-gray-900">979536</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs text-gray-500">STATUS</div>
              <div className={`text-sm font-bold ${isConfirmed ? 'text-green-500' : 'text-yellow-500'}`}>
                {isConfirmed ? 'REGISTRADA' : 'PENDENTE'}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-3" />

          <div className="mb-4">
            {dias.map((dia, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                <span className="text-gray-400">-</span>
                <span className={isConfirmed ? 'text-green-600' : ''}>SORTEIO SENA - {dia}</span>
                {isConfirmed && <span className="text-green-600 text-xs ml-auto">REGISTRADA</span>}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="flex-1 border-t border-gray-200" />
              <span className="px-2 text-xs text-gray-500">MODALIDADES</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <div className="font-bold text-gray-900 mb-2">{modalidade.nome}</div>
            <div className="space-y-1 mb-3">
              {palpites.map((palpite, index) => (
                <div key={index} className="inline-block bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs mr-2 mb-1">
                  {palpite}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600">R$ {formatCurrency(valorPorPalpite)} / CADA</div>
          </div>

          <div className="border-t border-dashed border-gray-300 pt-3">
            <div className="text-center font-bold text-lg">TOTAL: R$ {formatCurrency(valorTotal)}</div>
          </div>

          {isConfirmed && (
            <div className="mt-4 text-center">
              <div className="text-green-600 text-sm mb-1">Aposta registrada com sucesso!</div>
              <div className="text-gray-500 text-xs">{confirmationTime}</div>
              {novoSaldo !== null && (
                <div className="text-green-600 text-sm mt-2">
                  Novo saldo: R$ {formatCurrency(novoSaldo)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-300 my-4" />

        {!isConfirmed ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleVoltar}
              disabled={isLoading}
              className="h-12 bg-[#1A202C] rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Home className="h-5 w-5" />
              Voltar
            </button>
            <button
              onClick={handleFinalizar}
              disabled={isLoading}
              className="h-12 bg-[#3B82F6] rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
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
              className="h-12 bg-[#3B82F6] rounded-lg font-semibold text-white flex items-center justify-center gap-2"
            >
              <Share2 className="h-5 w-5" />
              Compartilhar
            </button>
            <button
              onClick={() => window.print()}
              className="h-12 bg-[#1A202C] rounded-lg font-semibold text-white flex items-center justify-center gap-2"
            >
              <Printer className="h-5 w-5" />
              Imprimir
            </button>
          </div>
        )}

        {isConfirmed && (
          <button
            onClick={handleVoltar}
            className="w-full mt-3 h-12 bg-gray-200 rounded-lg font-semibold text-gray-700 flex items-center justify-center gap-2"
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

export function SeninhaFinalizarClient(props: SeninhaFinalizarClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A202C]" />}>
      <SeninhaFinalizarContent {...props} />
    </Suspense>
  );
}
