'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff } from 'lucide-react';
import type { ModalidadeDB } from '@/lib/actions/modalidades';

interface QuininhaNumbersClientProps {
  data: string;
  modalidade: ModalidadeDB;
}

export function QuininhaNumbersClient({ data, modalidade }: QuininhaNumbersClientProps) {
  const router = useRouter();
  const modalidadeId = modalidade.codigo;
  const requiredNumbers = 13; // Quininha sempre usa 13 números base

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [palpites, setPalpites] = useState<number[][]>([]);

  const restantes = requiredNumbers - selectedNumbers.length;

  // Set de números que já estão em palpites completos
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

      // If we've selected all required numbers, add to palpites
      if (newSelected.length === requiredNumbers) {
        setPalpites([...palpites, newSelected.sort((a, b) => a - b)]);
        setSelectedNumbers([]);
      }
    }
  };

  const handleSurpresinha = () => {
    // Generate random numbers
    const available = Array.from({ length: 80 }, (_, i) => i + 1);
    const shuffled = available.sort(() => Math.random() - 0.5);
    const randomNumbers = shuffled.slice(0, requiredNumbers).sort((a, b) => a - b);
    setPalpites([...palpites, randomNumbers]);
    setSelectedNumbers([]);
  };

  const handleAvancar = () => {
    if (palpites.length === 0) return;

    // Store palpites and navigate to value selection
    const palpitesStr = palpites.map((p) => p.map((n) => n.toString().padStart(2, '0')).join('-')).join('|');
    router.push(`/quininha/${data}/${modalidadeId}/valor?palpites=${encodeURIComponent(palpitesStr)}`);
  };

  return (
    <div className="min-h-screen bg-[#1A202C]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">COLOCAÇÕES</span>
          <button className="flex h-10 w-10 items-center justify-center">
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* Balance Bar */}
      <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
        <RefreshCw className="h-5 w-5 text-white" />
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">R$ ******* | *******</span>
          <EyeOff className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white min-h-screen">
        {/* Info Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold text-gray-900">QUININHA</h1>
            <div className="text-right">
              <div className="text-red-500 font-bold">{modalidade.nome}</div>
              <div className="text-red-500 text-sm">{restantes} RESTANTES</div>
            </div>
          </div>
          <div className="text-right mt-1">
            <span className="text-gray-900 font-medium">{palpites.length} PALPITES</span>
          </div>
        </div>

        {/* Numbers Grid */}
        <div className="p-4">
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedNumbers.includes(num);
              const isInPalpite = palpitesNumbers.has(num);
              return (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#1A202C] text-white'
                      : isInPalpite
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
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
            className="flex-1 h-12 bg-gray-200 rounded-lg font-semibold text-gray-700"
          >
            Surpresinha
          </button>
          <button
            onClick={handleAvancar}
            disabled={palpites.length === 0}
            className="flex-1 h-12 bg-[#1A202C] rounded-lg font-semibold text-white disabled:opacity-50"
          >
            Avançar
          </button>
        </div>
      </div>
    </div>
  );
}
