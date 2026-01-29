'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Home, Share2, Check, X, Loader2, FileText } from 'lucide-react';
import { PageLayout } from '@/components/layout';
import { getFazendinhaModalidadeById, getFazendinhaLoteriaById } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { usePlatformConfig } from '@/contexts/platform-config-context';

function ConfirmarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const config = usePlatformConfig();

  // Get params from URL
  const modalidadeId = searchParams.get('modalidade') || 'dezena';
  const valor = parseFloat(searchParams.get('valor') || '1');
  const loteriaId = searchParams.get('loterias') || '';
  const numerosStr = searchParams.get('numeros') || '';
  const data = searchParams.get('data') || '';

  const modalidade = getFazendinhaModalidadeById(modalidadeId);
  const loteria = getFazendinhaLoteriaById(loteriaId);
  const numeros = numerosStr.split(',').filter(Boolean);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [puleNumber, setPuleNumber] = useState<string | null>(null);
  const [confirmationTime, setConfirmationTime] = useState<string | null>(null);
  const [novoSaldo, setNovoSaldo] = useState<number | null>(null);

  // Calculate values
  const valorTotal = numeros.length * valor;
  const possivelPremio = valor * (modalidade?.multiplicador || 1);

  // Format date
  const formattedDate = data
    ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  const handleVoltar = () => {
    router.push('/');
  };

  const handleFinalizar = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('place_bet', {
        p_tipo: 'fazendinha',
        p_modalidade: modalidadeId,
        p_colocacao: '1_premio', // Fazendinha is always 1st prize
        p_palpites: numeros,
        p_horarios: [],
        p_loterias: [loteriaId],
        p_data_jogo: data,
        p_valor_unitario: valor,
        p_multiplicador: modalidade?.multiplicador || 1,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (rpcData && !rpcData.success) {
        throw new Error(rpcData.error || 'Erro ao registrar aposta');
      }

      setPuleNumber(rpcData.pule);
      setNovoSaldo(rpcData.saldo_restante);

      const now = new Date();
      const timeStr =
        now.toLocaleDateString('pt-BR') +
        ' ' +
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      setConfirmationTime(timeStr);

      setIsConfirmed(true);
      setShowToast(true);
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
        title: 'Minha Aposta - Fazendinha',
        text: `Pule #${puleNumber} - FAZENDINHA (${modalidade?.nome}) - R$ ${valorTotal.toFixed(2).replace('.', ',')}`,
      });
    }
  };

  // If no data or loading initially
  if (!numeros.length || !modalidade) {
    return (
      <PageLayout title="SELECIONAR NÚMEROS">
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="SELECIONAR NÚMEROS">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>Pule registrada com sucesso. Boa sorte!</span>
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

      <div className="bg-gray-100 min-h-screen">
        {/* Header Info */}
        <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">FAZENDINHA</h2>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-red-500">{modalidade?.nome}</span>
              <p className="text-sm text-gray-600">
                R$ {valor.toFixed(2).replace('.', ',')} pra R${' '}
                {possivelPremio.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </div>

        {/* Receipt Card */}
        <div className="p-4">
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
            {/* Pule # */}
            <div className="text-sm font-medium text-gray-700 mb-2">
              PULE #{puleNumber || '...'}
            </div>

            {/* Banca Name & Logo */}
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2">{config.site_name.toUpperCase()}</h2>
              <div className="flex justify-center">
                {config.logo_url ? (
                  <Image
                    src={config.logo_url}
                    alt={config.site_name}
                    width={96}
                    height={64}
                    className="object-contain"
                    unoptimized={config.logo_url.includes('supabase.co')}
                  />
                ) : (
                  <div className="w-24 h-16 bg-[#1A202C] rounded-lg flex items-center justify-center">
                    <span className="text-[#E5A220] font-bold text-sm text-center">{config.site_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vale Date */}
            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-3 text-sm font-medium text-gray-700">VALE: {formattedDate}</span>
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
                <div
                  className={`text-lg font-bold ${isConfirmed ? 'text-green-600' : 'text-yellow-600'}`}
                >
                  {isConfirmed ? 'Registrada' : 'Pendente'}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 my-3" />

            {/* Game Type */}
            <div className="text-center font-bold text-gray-900 mb-2">
              FAZENDINHA
              <br />({modalidade?.nome})
            </div>

            {/* Prize Info */}
            <ul className="mb-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                R$ {valor.toFixed(2).replace('.', ',')} pra R${' '}
                {possivelPremio.toFixed(2).replace('.', ',')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-700 rounded-full" />
                {loteria?.nome}
              </li>
            </ul>

            {/* Palpites Header */}
            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-3 text-xs font-medium text-gray-700">
                PALPITES
                <br />
                (1o PREMIO)
              </span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            {/* Selected Numbers */}
            <div className="flex flex-wrap gap-2 mb-3 justify-center">
              {numeros.map((num) => (
                <span
                  key={num}
                  className="inline-flex items-center px-3 py-1 border border-gray-400 rounded text-sm font-medium text-gray-900"
                >
                  {num}
                </span>
              ))}
            </div>

            {/* Dashed Separator */}
            <div className="border-t-2 border-dashed border-gray-300 my-4" />

            {/* Total */}
            <div className="text-center py-2">
              <span className="text-xl font-bold text-gray-900">
                TOTAL: R$ {valorTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Dashed Separator */}
            <div className="border-t-2 border-dashed border-gray-300 my-4" />

            {/* Note */}
            <p className="text-sm text-gray-600 text-center">
              Pules de fazendinha nao podem ser canceladas.
            </p>

            {/* Confirmation Time */}
            {isConfirmed && (
              <div className="text-center mt-4">
                <p className="text-sm font-bold text-gray-900">{confirmationTime}</p>
                {novoSaldo !== null && (
                  <p className="text-sm text-green-600 mt-1">
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
            <button
              onClick={handleCompartilhar}
              className="w-full h-14 bg-white border border-gray-300 rounded-lg font-semibold text-gray-900 flex items-center justify-center gap-2"
            >
              <FileText className="h-5 w-5" />
              Compartilhar
            </button>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function FazendinhaConfirmarPage() {
  return (
    <Suspense
      fallback={
        <PageLayout title="SELECIONAR NÚMEROS">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </PageLayout>
      }
    >
      <ConfirmarContent />
    </Suspense>
  );
}
