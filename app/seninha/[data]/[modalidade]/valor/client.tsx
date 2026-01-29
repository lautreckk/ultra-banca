'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff, Info } from 'lucide-react';
import type { ModalidadeDB } from '@/lib/actions/modalidades';

interface SeninhaValorClientProps {
  data: string;
  modalidade: ModalidadeDB;
}

function SeninhaValorContent({ data, modalidade }: SeninhaValorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const modalidadeId = modalidade.codigo;
  const palpitesStr = searchParams.get('palpites') || '';

  const palpites = palpitesStr.split('|').filter(Boolean);

  const [valor, setValor] = useState('');

  const handleQuickAdd = (amount: number) => {
    const current = parseFloat(valor.replace(',', '.')) || 0;
    const newValue = (current + amount).toFixed(2).replace('.', ',');
    setValor(newValue);
  };

  const handleModeSelect = (mode: 'todos' | 'cada') => {
    if (!valor) return;
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) return;
    router.push(`/seninha/${data}/${modalidadeId}/resumo?palpites=${encodeURIComponent(palpitesStr)}&valor=${valorNum}&mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-[#1A202C]">
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center">
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">ESCOLHA O VALOR</span>
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

      <div className="bg-white min-h-screen">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-gray-900">SENINHA</h1>
            <div className="text-right">
              <div className="text-red-500 font-bold">{modalidade.nome}</div>
              <div className="text-red-500 text-sm">14 RESTANTES</div>
            </div>
          </div>
          <div className="text-right mt-1">
            <span className="text-gray-900 font-medium">{palpites.length} PALPITES</span>
          </div>
        </div>

        <div className="p-4">
          <button className="flex items-center gap-2 text-blue-600 text-sm mb-4">
            <Info className="h-4 w-4" />
            <span>VER REGRAS DE ARREDONDAMENTO</span>
          </button>

          <div className="flex items-center border border-gray-300 rounded-lg mb-4">
            <span className="pl-4 text-gray-500">R$</span>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^0-9,]/g, ''))}
              placeholder="0,00..."
              className="flex-1 h-12 px-2 text-gray-900 focus:outline-none"
            />
            <button onClick={() => setValor('')} className="px-4 text-gray-500 hover:text-gray-700">
              Limpar
            </button>
          </div>

          <div className="mb-6">
            <span className="text-sm text-gray-700 mb-2 block">Valores rápidos:</span>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((v) => (
                <button key={v} onClick={() => handleQuickAdd(v)} className="h-10 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                  +{v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleModeSelect('todos')} disabled={!valor} className="h-12 bg-[#1A202C] rounded-lg font-semibold text-white disabled:opacity-50">
              Todos
            </button>
            <button onClick={() => handleModeSelect('cada')} disabled={!valor} className="h-12 bg-[#1A202C] rounded-lg font-semibold text-white disabled:opacity-50">
              Cada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SeninhaValorClient(props: SeninhaValorClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A202C]" />}>
      <SeninhaValorContent {...props} />
    </Suspense>
  );
}
