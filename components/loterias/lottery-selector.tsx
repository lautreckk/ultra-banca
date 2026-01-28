'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BANCAS } from '@/lib/constants';

interface LotterySelectorProps {
  selectedLotteries: string[];
  onToggleLottery: (lotteryId: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  total?: number;
  className?: string;
}

export function LotterySelector({
  selectedLotteries,
  onToggleLottery,
  onConfirm,
  onBack,
  total = 0,
  className,
}: LotterySelectorProps) {
  const [expandedBancas, setExpandedBancas] = useState<string[]>(['rio_federal']);

  const toggleBanca = (bancaId: string) => {
    setExpandedBancas((prev) =>
      prev.includes(bancaId)
        ? prev.filter((id) => id !== bancaId)
        : [...prev, bancaId]
    );
  };

  const isAllSelectedInBanca = (bancaId: string): boolean => {
    const banca = BANCAS.find((b) => b.id === bancaId);
    if (!banca) return false;
    return banca.subLoterias.every((sub) => selectedLotteries.includes(sub.id));
  };

  const isSomeSelectedInBanca = (bancaId: string): boolean => {
    const banca = BANCAS.find((b) => b.id === bancaId);
    if (!banca) return false;
    return banca.subLoterias.some((sub) => selectedLotteries.includes(sub.id));
  };

  const toggleAllInBanca = (bancaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const banca = BANCAS.find((b) => b.id === bancaId);
    if (!banca) return;

    const allSelected = isAllSelectedInBanca(bancaId);

    if (allSelected) {
      banca.subLoterias.forEach((sub) => {
        if (selectedLotteries.includes(sub.id)) {
          onToggleLottery(sub.id);
        }
      });
    } else {
      banca.subLoterias.forEach((sub) => {
        if (!selectedLotteries.includes(sub.id)) {
          onToggleLottery(sub.id);
        }
      });
    }
  };

  const totalValue = total.toFixed(2).replace('.', ',');

  return (
    <div className={cn('bg-white min-h-screen', className)}>
      {/* Total Row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="font-bold text-gray-900">Total</span>
        <span className="font-bold text-gray-900">R$ {totalValue}</span>
      </div>

      {/* Section Label */}
      <div className="px-4 py-3">
        <span className="text-gray-700 font-medium">Selecione as loterias:</span>
      </div>

      {/* Bancas Accordion */}
      <div className="mx-4 border border-gray-200 rounded-lg overflow-hidden">
        {BANCAS.map((banca, index) => {
          const isExpanded = expandedBancas.includes(banca.id);
          const allSelected = isAllSelectedInBanca(banca.id);
          const someSelected = isSomeSelectedInBanca(banca.id);

          return (
            <div key={banca.id} className={index > 0 ? 'border-t border-gray-200' : ''}>
              {/* Banca Header */}
              <button
                onClick={() => toggleBanca(banca.id)}
                className="w-full flex items-center justify-between px-4 py-4 bg-white"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => toggleAllInBanca(banca.id, e)}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                      allSelected
                        ? 'bg-[#1A202C] border-[#1A202C]'
                        : someSelected
                        ? 'border-[#1A202C] bg-gray-100'
                        : 'border-gray-300'
                    )}
                  >
                    {allSelected && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <span className="font-bold text-gray-900">{banca.nome}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Sub-Loterias - Vertical List */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {banca.subLoterias.map((sub) => {
                    const isSelected = selectedLotteries.includes(sub.id);
                    const isMaluca = sub.nome.toLowerCase().includes('maluca');

                    return (
                      <button
                        key={sub.id}
                        onClick={() => onToggleLottery(sub.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                          isSelected ? 'bg-[#E5A220]/10' : 'bg-white hover:bg-gray-50'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                            isSelected
                              ? 'bg-[#E5A220] border-[#E5A220]'
                              : 'border-gray-300'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-black" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {sub.nome} {sub.horario.replace(':', 'H').replace(':00', 'HS').replace(':20', 'HS').replace(':15', 'HS')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{sub.horario}</span>
                            {isMaluca && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                MALUCA
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Spacer for fixed buttons */}
      <div className="h-32" />

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-3">
        <button
          onClick={onConfirm}
          disabled={selectedLotteries.length === 0}
          className="w-full h-12 bg-[#E5A220] rounded-lg font-semibold text-white disabled:opacity-50"
        >
          Confirmar
        </button>
        <button
          onClick={onBack}
          className="w-full h-12 bg-[#1A202C] rounded-lg font-semibold text-white"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
