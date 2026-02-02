'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Home, Share2, Printer, Check, X, Loader2, Trash2 } from 'lucide-react';
import { BetHeader } from '@/components/layout';
import { useBetStore, BetItem } from '@/stores/bet-store';
import { getModalidadeById, getColocacaoById, getSubLoteriaById } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { usePlatformConfig } from '@/contexts/platform-config-context';

export default function FinalizarApostaPage() {
  const router = useRouter();
  const config = usePlatformConfig();
  const { items, clearCart, removeItem } = useBetStore();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [puleNumbers, setPuleNumbers] = useState<string[]>([]);
  const [confirmationTime, setConfirmationTime] = useState<string | null>(null);
  const [novoSaldo, setNovoSaldo] = useState<number | null>(null);

  const supabase = createClient();

  // Redirect if no items
  if (items.length === 0) {
    router.push('/');
    return null;
  }

  // Get date from first item for display
  const firstItem = items[0];
  const dateObj = new Date(firstItem.data + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('pt-BR');

  // Calculate totals across ALL items
  const calcularTotalItem = (item: BetItem) => {
    return item.palpites.length * item.valorUnitario * Math.max(item.loterias.length, 1);
  };

  const valorTotalGeral = items.reduce((acc, item) => acc + calcularTotalItem(item), 0);

  // Get all unique lotteries across all items
  const todasLoterias = [...new Set(items.flatMap(item => item.loterias))];

  const handleVoltar = () => {
    if (isConfirmed) {
      clearCart();
    }
    router.push('/');
  };

  const handleFinalizar = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pules: string[] = [];
      let ultimoSaldo: number | null = null;
      const now = new Date();

      // Process each bet item
      for (const item of items) {
        // Validate date and time
        const betTime = new Date(`${item.data}T23:59:59`); // End of day check first

        // If bet is for today, check specific lottery times
        const isToday = item.data === now.toISOString().split('T')[0];

        if (isToday && item.horarios) {
          for (const horario of item.horarios) {
            const [hora, minuto] = horario.split(':').map(Number);
            const drawTime = new Date(now);
            drawTime.setHours(hora, minuto, 0, 0);

            // Add 5 min tolerance or strict? Usually strict.
            // If current time > draw time, throw error.
            if (now > drawTime) {
              throw new Error(`O horário ${horario} já passou para a data de hoje.`);
            }
          }
        } else if (new Date(item.data) < new Date(now.toISOString().split('T')[0])) {
          throw new Error(`A data ${item.data.split('-').reverse().join('/')} já passou.`);
        }

        const { data, error: rpcError } = await supabase.rpc('place_bet', {
          p_tipo: item.tipo || 'loterias',
          p_modalidade: item.modalidade,
          p_colocacao: item.colocacao,
          p_palpites: item.palpites,
          p_horarios: item.horarios || [],
          p_loterias: item.loterias || [],
          p_data_jogo: item.data,
          p_valor_unitario: item.valorUnitario,
          p_multiplicador: item.multiplicador || 1,
        });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        if (data && !data.success) {
          throw new Error(data.error || 'Erro ao registrar aposta');
        }

        pules.push(data.pule);
        ultimoSaldo = data.saldo_restante;
      }

      setPuleNumbers(pules);
      setNovoSaldo(ultimoSaldo);

      // Set confirmation time
      const now = new Date();
      const timeStr = now.toLocaleDateString('pt-BR') + ' - ' +
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setConfirmationTime(timeStr);

      setIsConfirmed(true);
      setShowToast(true);

      // Hide toast after 5 seconds
      setTimeout(() => setShowToast(false), 5000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar aposta';
      setError(errorMessage);
      console.error('Erro ao finalizar aposta:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompartilhar = () => {
    if (navigator.share) {
      navigator.share({
        title: `Minha Aposta - ${config.site_name}`,
        text: `Pules #${puleNumbers.join(', #')} - R$ ${valorTotalGeral.toFixed(2).replace('.', ',')}`,
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-300 flex justify-center">
      <div className="w-full max-w-md bg-zinc-50 min-h-screen shadow-xl flex flex-col">
        <BetHeader title="FINALIZAR APOSTA" onBack={() => router.back()} />

        {/* Success Toast */}
        {showToast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
            <div className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>{items.length > 1 ? 'Pules registradas' : 'Pule registrada'} com sucesso. Boa sorte!!!</span>
              </div>
              <button onClick={() => setShowToast(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
            <div className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 bg-gray-100 p-4">
          {/* Receipt Card */}
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
            {/* Pule # */}
            <div className="text-sm font-medium text-gray-700 mb-2">
              {puleNumbers.length > 0
                ? `PULE #${puleNumbers.join(', #')}`
                : `${items.length} ${items.length > 1 ? 'APOSTAS' : 'APOSTA'}`}
            </div>

            {/* Banca Name & Logo */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-3">{config.site_name.toUpperCase()}</h2>
              <div className="flex justify-center">
                {config.logo_url ? (
                  <Image
                    src={config.logo_url}
                    alt={config.site_name}
                    width={120}
                    height={80}
                    className="object-contain"
                    unoptimized={config.logo_url.includes('supabase.co')}
                  />
                ) : (
                  <div className="w-28 h-20 bg-[#1A202C] rounded-lg flex items-center justify-center">
                    <span className="text-[#E5A220] font-bold text-lg text-center">{config.site_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vale Date */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-3 text-sm font-medium text-gray-700">
                VALE: {formattedDate}
              </span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            {/* Vendedor & Status */}
            <div className="flex justify-between mb-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase">Vendedor</div>
                <div className="text-lg font-bold text-gray-900">979536</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase">Status</div>
                <div className={`text-lg font-bold ${isConfirmed ? 'text-green-600' : 'text-red-500'}`}>
                  {isConfirmed ? 'REGISTRADA' : 'PENDENTE'}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 my-4" />

            {/* Selected Lotteries */}
            <div className="mb-4">
              {todasLoterias.map((loteriaId) => {
                const loteria = getSubLoteriaById(loteriaId);
                return (
                  <div key={loteriaId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                      <span className={isConfirmed ? 'text-green-600 font-medium' : 'text-gray-700'}>
                        {loteria?.nome || loteriaId} {loteria?.horario}
                      </span>
                    </div>
                    {isConfirmed && (
                      <span className="text-green-600 font-medium text-xs">REGISTRADA</span>
                    )}
                  </div>
                );
              })}
              {todasLoterias.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                  <span>Todas as loterias</span>
                </div>
              )}
            </div>

            {/* Modalidades Header */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-3 text-sm font-medium text-gray-700">MODALIDADES</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            {/* ALL ITEMS - Loop through each bet */}
            {items.map((item, index) => {
              const modalidadeInfo = getModalidadeById(item.modalidade);
              const colocacaoInfo = getColocacaoById(item.colocacao);
              const valorTotalItem = calcularTotalItem(item);
              const possivelPremio = item.valorUnitario * item.multiplicador;

              return (
                <div key={item.id || index} className={index > 0 ? 'mt-4 pt-4 border-t border-gray-200' : ''}>
                  {/* Modalidade & Colocacao */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-bold text-gray-900">
                      {modalidadeInfo?.nome || item.modalidade.toUpperCase()} - {colocacaoInfo?.nome || item.colocacao.toUpperCase()}
                    </div>
                    {!isConfirmed && items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover aposta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Palpites */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.palpites.map((palpite) => (
                      <span
                        key={palpite}
                        className="inline-flex items-center px-2 py-1 border border-gray-400 rounded text-sm font-medium text-gray-900"
                      >
                        {palpite}
                      </span>
                    ))}
                  </div>

                  {/* Value & Prize */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      R$ {valorTotalItem.toFixed(2).replace('.', ',')} ({item.valorUnitario.toFixed(2).replace('.', ',')} / CADA)
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      Premio: R$ {possivelPremio.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Dashed Separator */}
            <div className="border-t-2 border-dashed border-gray-300 my-4" />

            {/* Total */}
            <div className="text-center py-2">
              <span className="text-xl font-bold text-gray-900">
                TOTAL: R$ {valorTotalGeral.toFixed(2).replace('.', ',')}
              </span>
              {items.length > 1 && (
                <p className="text-sm text-gray-500 mt-1">
                  ({items.length} apostas)
                </p>
              )}
            </div>

            {/* Dashed Separator */}
            <div className="border-t-2 border-dashed border-gray-300 my-4" />

            {/* Confirmation message (only after confirmed) */}
            {isConfirmed && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-600">Confira suas apostas.</p>
                <p className="text-sm text-gray-600">Reclame no maximo em 3 dias.</p>
                <p className="text-sm font-bold text-gray-900 mt-3">{confirmationTime}</p>
                {novoSaldo !== null && (
                  <p className="text-sm text-green-600 mt-2">
                    Novo saldo: R$ {novoSaldo.toFixed(2).replace('.', ',')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dashed separator outside card */}
          <div className="border-t-2 border-dashed border-gray-300 my-6" />

          {/* Action Buttons */}
          {!isConfirmed ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleVoltar}
                disabled={isLoading}
                className="h-14 bg-[#1A202C] rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Home className="h-5 w-5" />
                Voltar
              </button>
              <button
                onClick={handleFinalizar}
                disabled={isLoading}
                className="h-14 bg-[#3B82F6] rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
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
            <div className="flex gap-3">
              <button
                onClick={handleVoltar}
                className="flex-1 h-14 bg-[#1A202C] rounded-lg font-semibold text-white flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" />
                Voltar
              </button>
              <button
                onClick={handleCompartilhar}
                className="flex-1 h-14 bg-[#3B82F6] rounded-lg font-semibold text-white flex items-center justify-center gap-2"
              >
                <Share2 className="h-5 w-5" />
                Compartilhar
              </button>
              <button
                onClick={handlePrint}
                className="h-14 w-14 bg-[#3B82F6] rounded-lg font-semibold text-white flex items-center justify-center"
              >
                <Printer className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
