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
      <div className="bg-[#111318] min-h-screen pb-32">
        {/* Header Info */}
        <div className="px-4 pt-4 pb-3 border-b border-zinc-700/40">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">FAZENDINHA</h2>
              <p className="text-sm text-zinc-500">{selectedNumbers.length} PALPITES</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-red-500">{modalidade?.nome}</span>
              <p className="text-sm text-zinc-400">
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
                    'py-2 rounded-xl text-sm font-medium active:scale-[0.98] transition-all',
                    isSelected
                      ? 'bg-[#4CAF50] text-white'
                      : 'bg-[#1A1F2B] border border-zinc-700/40 text-white'
                  )}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1A1F2B] border-t border-zinc-700/40 max-w-md mx-auto">
          {/* Total */}
          <div className="px-4 py-3 border-b border-dashed border-zinc-700/40">
            <div className="flex items-center justify-center gap-2">
              <span className="text-zinc-400">Total:</span>
              <span className="text-xl font-bold text-white">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Buy Button */}
          <div className="p-4">
            <button
              onClick={handleBuy}
              disabled={selectedNumbers.length === 0}
              className="w-full h-14 min-h-[56px] rounded-xl bg-[#E5A220] text-zinc-900 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              Comprar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Confirmar Compra?</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-zinc-500 hover:text-zinc-400 active:scale-[0.98] transition-all"
              >
                ✕
              </button>
            </div>

            <p className="text-zinc-400 mb-6">Tem certeza de que deseja confirmar a compra?</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="flex-1 h-14 min-h-[56px] rounded-xl bg-zinc-900 border border-zinc-700/40 text-zinc-300 font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Nao
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 h-14 min-h-[56px] rounded-xl bg-[#E5A220] text-zinc-900 font-bold active:scale-[0.98] transition-all disabled:opacity-50"
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
          <div className="flex items-center justify-center min-h-screen bg-[#111318]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
          </div>
        </PageLayout>
      }
    >
      <NumbersContent data={data} />
    </Suspense>
  );
}
