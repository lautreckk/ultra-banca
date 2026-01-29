'use client';

import { useState, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { cn } from '@/lib/utils';
import {
  FAZENDINHA_MODALIDADES,
  getFazendinhaLoteriaById,
  formatPremio,
} from '@/lib/constants';

interface FazendinhaNumbersPageProps {
  params: Promise<{ data: string }>;
}

function NumbersContent({ data }: { data: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modalidadeId = searchParams.get('modalidade') || 'dezena';
  const valor = parseFloat(searchParams.get('valor') || '1');
  const loteriaId = searchParams.get('loterias') || '';

  const modalidade = FAZENDINHA_MODALIDADES.find((m) => m.id === modalidadeId);
  const loteria = getFazendinhaLoteriaById(loteriaId);

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate numbers based on modalidade
  const generateNumbers = () => {
    const numbers: string[] = [];
    const max = modalidade?.maxNumero || 99;
    const digits = modalidade?.digitos || 2;

    // GRUPO starts from 01, others from 00
    const start = modalidadeId === 'grupo' ? 1 : 0;

    for (let i = start; i <= max; i++) {
      numbers.push(i.toString().padStart(digits, '0'));
    }
    return numbers;
  };

  const numbers = generateNumbers();

  const toggleNumber = (num: string) => {
    setSelectedNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const total = selectedNumbers.length * valor;
  const potentialPrize = selectedNumbers.length * valor * (modalidade?.multiplicador || 1);

  const handleBuy = () => {
    if (selectedNumbers.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);

    // Navigate to confirmation page with all parameters
    const params = new URLSearchParams({
      tipo: 'fazendinha',
      modalidade: modalidadeId,
      valor: valor.toString(),
      loterias: loteriaId,
      numeros: selectedNumbers.join(','),
      data: data,
    });

    router.push(`/fazendinha/confirmar?${params.toString()}`);
  };

  return (
    <PageLayout title="SELECIONAR NÚMEROS">
      <div className="bg-white min-h-screen pb-32">
        {/* Header Info */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">FAZENDINHA</h2>
              <p className="text-sm text-gray-500">{selectedNumbers.length} PALPITES</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-red-500">{modalidade?.nome}</span>
              <p className="text-sm text-gray-600">
                R$ {valor.toFixed(2).replace('.', ',')} pra R${' '}
                {formatPremio(valor, modalidade?.multiplicador || 1)}
              </p>
            </div>
          </div>
        </div>

        {/* Numbers Grid */}
        <div className="p-4">
          <div
            className={cn(
              'grid gap-1.5',
              modalidadeId === 'grupo' ? 'grid-cols-5' : 'grid-cols-6'
            )}
          >
            {numbers.map((num) => {
              const isSelected = selectedNumbers.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  className={cn(
                    'py-2 rounded-md text-sm font-medium transition-all',
                    isSelected
                      ? 'bg-[#4CAF50] text-white'
                      : 'bg-zinc-600 text-white hover:bg-zinc-500'
                  )}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          {/* Total */}
          <div className="px-4 py-3 border-b border-dashed border-gray-300">
            <div className="flex items-center justify-center gap-2">
              <span className="text-gray-600">Total:</span>
              <span className="text-xl font-bold text-gray-900">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Buy Button */}
          <div className="p-4">
            <button
              onClick={handleBuy}
              disabled={selectedNumbers.length === 0}
              className="w-full py-3.5 rounded-lg bg-[#4CAF50] text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#43A047]"
            >
              Comprar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Confirmar Compra?</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-6">Tem certeza de que deseja confirmar a compra?</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Não
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-lg bg-[#4CAF50] text-white font-semibold hover:bg-[#43A047] disabled:opacity-50"
              >
                {isProcessing ? 'Processando...' : 'Sim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default function FazendinhaNumbersPage({ params }: FazendinhaNumbersPageProps) {
  const { data } = use(params);

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
      <NumbersContent data={data} />
    </Suspense>
  );
}
