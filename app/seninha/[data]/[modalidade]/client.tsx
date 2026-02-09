'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw } from 'lucide-react';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';
import type { ModalidadeDB } from '@/lib/actions/modalidades';

interface SeninhaNumbersClientProps {
  data: string;
  modalidade: ModalidadeDB;
}

export function SeninhaNumbersClient({ data, modalidade }: SeninhaNumbersClientProps) {
  const router = useRouter();
  const { saldo, saldoBonus, refresh } = useUserBalance();
  const modalidadeId = modalidade.codigo;
  const requiredNumbers = 14; // Seninha sempre usa 14 numeros base

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [palpites, setPalpites] = useState<number[][]>([]);

  const restantes = requiredNumbers - selectedNumbers.length;

  // Set de numeros que ja estao em palpites completos
  const palpitesNumbers = useMemo(() => {
    const set = new Set<number>();
    palpites.forEach(p => p.forEach(n => set.add(n)));
    return set;
  }, [palpites]);

  const handleNumberClick = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else if (selectedNumbers.length < requiredNumbers) {
      const newSelected = [...selectedNumbers, num];
      setSelectedNumbers(newSelected);

      if (newSelected.length === requiredNumbers) {
        setPalpites([...palpites, newSelected.sort((a, b) => a - b)]);
        setSelectedNumbers([]);
      }
    }
  };

  const handleSurpresinha = () => {
    const available = Array.from({ length: 60 }, (_, i) => i + 1);
    const shuffled = available.sort(() => Math.random() - 0.5);
    const randomNumbers = shuffled.slice(0, requiredNumbers).sort((a, b) => a - b);
    setPalpites([...palpites, randomNumbers]);
    setSelectedNumbers([]);
  };

  const handleAvancar = () => {
    if (palpites.length === 0) return;
    const palpitesStr = palpites.map((p) => p.map((n) => n.toString().padStart(2, '0')).join('-')).join('|');
    router.push(`/seninha/${data}/${modalidadeId}/valor?palpites=${encodeURIComponent(palpitesStr)}`);
  };

  return (
    <div className="min-h-screen bg-[#111318]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-base font-bold text-white">COLOCACOES</span>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* Balance Bar */}
      <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
        <button onClick={refresh} className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10" aria-label="Atualizar saldo">
          <RefreshCw className="h-5 w-5 text-white" />
        </button>
        <span className="text-white font-medium">R$ {formatCurrencyCompact(saldo)} | {formatCurrencyCompact(saldoBonus)}</span>
      </div>

      {/* Content */}
      <div className="bg-[#1A1F2B] min-h-screen">
        {/* Info Header */}
        <div className="p-4 border-b border-zinc-700/40">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-white">SENINHA</h1>
            <div className="text-right">
              <div className="text-red-500 font-bold">{modalidade.nome}</div>
              <div className="text-red-500 text-sm">{restantes} RESTANTES</div>
            </div>
          </div>
          <div className="text-right mt-1">
            <span className="text-white font-medium">{palpites.length} PALPITES</span>
          </div>
        </div>

        {/* Numbers Grid - 01 to 60 */}
        <div className="p-4">
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedNumbers.includes(num);
              const isInPalpite = palpitesNumbers.has(num);
              return (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[#111318] text-white'
                      : isInPalpite
                      ? 'bg-green-500 text-white'
                      : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50'
                  }`}
                  aria-label={`Numero ${num.toString().padStart(2, '0')}`}
                >
                  {num.toString().padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 flex gap-3">
          <button
            onClick={handleSurpresinha}
            className="flex-1 h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-zinc-300 active:scale-[0.98] transition-all"
            aria-label="Gerar numeros aleatorios"
          >
            Surpresinha
          </button>
          <button
            onClick={handleAvancar}
            disabled={palpites.length === 0}
            className="flex-1 h-14 min-h-[56px] bg-[#E5A220] rounded-xl font-bold text-zinc-900 disabled:opacity-50 active:scale-[0.98] transition-all"
            aria-label="Avancar para valor"
          >
            Avancar
          </button>
        </div>
      </div>
    </div>
  );
}
