'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff, Trash2 } from 'lucide-react';
import type { ModalidadeDB } from '@/lib/actions/modalidades';

interface LotinhaResumoClientProps {
  data: string;
  modalidade: ModalidadeDB;
}

function LotinhaResumoContent({ data, modalidade }: LotinhaResumoClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modalidadeId = modalidade.codigo;
  const palpitesStr = searchParams.get('palpites') || '';
  const valorParam = searchParams.get('valor') || '0';
  const mode = searchParams.get('mode') || 'cada';

  const [palpites, setPalpites] = useState(palpitesStr.split('|').filter(Boolean));
  const valor = parseFloat(valorParam);

  const valorPorPalpite = mode === 'cada' ? valor : valor / palpites.length;
  const valorTotal = mode === 'cada' ? valor * palpites.length : valor;

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#1A202C]">
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center">
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">APOSTAS</span>
          <button className="flex h-10 w-10 items-center justify-center">
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
        <RefreshCw className="h-5 w-5 text-white" />
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">R$ ******* | *******</span>
          <EyeOff className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="bg-gray-100 min-h-screen p-4">
        {palpites.length > 0 ? (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-900">{modalidade.nome} -</span>
                <button onClick={() => setPalpites([])} className="text-red-500">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2 mb-4">
                {palpites.map((palpite, index) => (
                  <div key={index} className="inline-block bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs mr-2 mb-1">
                    {palpite}
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">R$ {formatCurrency(valorTotal)}</span>
                <span className="text-gray-500 text-sm">{formatCurrency(valorPorPalpite)} / CADA</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 py-4 mb-4">
              <div className="text-center">
                <span className="text-gray-600">Total: </span>
                <span className="font-bold text-gray-900">R$ {formatCurrency(valorTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => router.push(`/lotinha/${data}/${modalidadeId}`)} className="h-12 bg-[#E5A220] rounded-lg font-semibold text-white">
                Mais Apostas
              </button>
              <button
                onClick={() => router.push(`/lotinha/${data}/${modalidadeId}/dias?palpites=${encodeURIComponent(palpites.join('|'))}&valor=${valorPorPalpite}&total=${valorTotal}`)}
                className="h-12 bg-[#1A202C] rounded-lg font-semibold text-white"
              >
                Avançar
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-500">Nenhuma aposta adicionada</div>
        )}
      </div>
    </div>
  );
}

export function LotinhaResumoClient(props: LotinhaResumoClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A202C]" />}>
      <LotinhaResumoContent {...props} />
    </Suspense>
  );
}
