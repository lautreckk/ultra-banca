'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff, Info } from 'lucide-react';
import type { ModalidadeDB } from '@/lib/actions/modalidades';

interface LotinhaValorClientProps {
  data: string;
  modalidade: ModalidadeDB;
}

function LotinhaValorContent({ data, modalidade }: LotinhaValorClientProps) {
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
    router.push(`/lotinha/${data}/${modalidadeId}/resumo?palpites=${encodeURIComponent(palpitesStr)}&valor=${valorNum}&mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-[#111318]">
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-base font-bold text-white">ESCOLHA O VALOR</span>
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
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">R$ ******* | *******</span>
          <button className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10" aria-label="Mostrar saldo">
            <EyeOff className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="bg-[#1A1F2B] min-h-screen">
        <div className="p-4 border-b border-zinc-700/40">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-white">LOTINHA</h1>
            <div className="text-right">
              <div className="text-pink-500 font-bold">{modalidade.nome}</div>
              <div className="text-pink-500 text-sm">16 RESTANTES</div>
            </div>
          </div>
          <div className="text-right mt-1">
            <span className="text-white font-medium">{palpites.length} PALPITES</span>
          </div>
        </div>

        <div className="p-4">
          <button
            className="flex items-center gap-2 text-blue-500 text-sm mb-4 active:scale-[0.98] transition-all"
            aria-label="Ver regras de arredondamento"
          >
            <Info className="h-4 w-4" />
            <span>VER REGRAS DE ARREDONDAMENTO</span>
          </button>

          <div className="flex items-center border border-zinc-700/40 rounded-xl mb-4 bg-zinc-900/80">
            <span className="pl-4 text-zinc-500">R$</span>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^0-9,]/g, ''))}
              placeholder="0,00..."
              className="flex-1 h-14 min-h-[48px] px-2 rounded-xl bg-transparent text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              aria-label="Valor da aposta"
            />
            <button
              onClick={() => setValor('')}
              className="px-4 text-zinc-500 hover:text-zinc-300 active:scale-[0.98] transition-all"
              aria-label="Limpar valor"
            >
              Limpar
            </button>
          </div>

          <div className="mb-6">
            <span className="text-sm text-zinc-300 mb-2 block">Valores rapidos:</span>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((v) => (
                <button
                  key={v}
                  onClick={() => handleQuickAdd(v)}
                  className="h-11 border border-zinc-700/40 rounded-xl text-zinc-300 font-medium hover:bg-zinc-700/30 active:scale-[0.98] transition-all"
                  aria-label={`Adicionar ${v} reais`}
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleModeSelect('todos')}
              disabled={!valor}
              className="h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-all"
              aria-label="Dividir valor entre todos"
            >
              Todos
            </button>
            <button
              onClick={() => handleModeSelect('cada')}
              disabled={!valor}
              className="h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-all"
              aria-label="Valor para cada palpite"
            >
              Cada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LotinhaValorClient(props: LotinhaValorClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111318]" />}>
      <LotinhaValorContent {...props} />
    </Suspense>
  );
}
