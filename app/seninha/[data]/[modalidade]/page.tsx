'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff } from 'lucide-react';
import { getModalidadeById } from '@/lib/constants/modalidades';

export default function SeninhaNumbersPage() {
  const router = useRouter();
  const params = useParams();
  const data = params.data as string;
  const modalidadeId = params.modalidade as string;

  const modalidade = getModalidadeById(modalidadeId);
  const requiredNumbers = modalidade?.digitos || 14;

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [palpites, setPalpites] = useState<number[][]>([]);

  const restantes = requiredNumbers - selectedNumbers.length;

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
    <div className="min-h-screen bg-[#1A202C]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center">
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
            <h1 className="text-xl font-bold text-gray-900">SENINHA</h1>
            <div className="text-right">
              <div className="text-red-500 font-bold">{modalidade?.nome || 'SENINHA 14D'}</div>
              <div className="text-red-500 text-sm">{restantes} RESTANTES</div>
            </div>
          </div>
          <div className="text-right mt-1">
            <span className="text-gray-900 font-medium">{palpites.length} PALPITES</span>
          </div>
        </div>

        {/* Numbers Grid - 01 to 60 */}
        <div className="p-4">
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => {
              const isSelected = selectedNumbers.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isSelected ? 'bg-[#1A202C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {num.toString().padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Palpites */}
        {palpites.length > 0 && (
          <div className="px-4 pb-4">
            <div className="text-sm text-gray-500 mb-2">Palpites selecionados:</div>
            <div className="space-y-1">
              {palpites.map((palpite, index) => (
                <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded inline-block mr-2 mb-1">
                  {palpite.map((n) => n.toString().padStart(2, '0')).join('-')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="p-4 flex gap-3">
          <button onClick={handleSurpresinha} className="flex-1 h-12 bg-gray-200 rounded-lg font-semibold text-gray-700">
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
