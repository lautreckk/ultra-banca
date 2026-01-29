'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BANCAS } from '@/lib/constants';

interface LotterySelectorProps {
  selectedLotteries: string[];
  onToggleLottery: (lotteryId: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  total?: number;
  className?: string;
  dataJogo?: string; // Data da aposta no formato YYYY-MM-DD
}

export function LotterySelector({
  selectedLotteries,
  onToggleLottery,
  onConfirm,
  onBack,
  total = 0,
  className,
  dataJogo,
}: LotterySelectorProps) {
  const [expandedBancas, setExpandedBancas] = useState<string[]>(['rio_federal']);

  // Verifica se um horário já passou (com margem de 5 minutos antes do sorteio)
  const isHorarioPassado = useMemo(() => {
    const agora = new Date();
    const hojeStr = agora.toLocaleDateString('en-CA'); // YYYY-MM-DD

    return (horario: string): boolean => {
      // Se a data da aposta é futura, nenhum horário passou
      if (dataJogo && dataJogo > hojeStr) {
        return false;
      }

      // Se a data da aposta é passada, todos os horários passaram
      if (dataJogo && dataJogo < hojeStr) {
        return true;
      }

      // Se é hoje, verifica o horário
      const [hora, minuto] = horario.split(':').map(Number);
      const horarioDate = new Date();
      horarioDate.setHours(hora, minuto, 0, 0);

      // Margem de 5 minutos antes do sorteio (fecha apostas 5min antes)
      const margemMs = 5 * 60 * 1000;

      return agora.getTime() > (horarioDate.getTime() - margemMs);
    };
  }, [dataJogo]);

  const toggleBanca = (bancaId: string) => {
    setExpandedBancas((prev) =>
      prev.includes(bancaId)
        ? prev.filter((id) => id !== bancaId)
        : [...prev, bancaId]
    );
  };

  // Filtra subLoterias disponíveis (horários que ainda não passaram)
  const getSubLoteriasDisponiveis = (bancaId: string) => {
    const banca = BANCAS.find((b) => b.id === bancaId);
    if (!banca) return [];
    return banca.subLoterias.filter((sub) => !isHorarioPassado(sub.horario));
  };

  const isAllSelectedInBanca = (bancaId: string): boolean => {
    const disponiveis = getSubLoteriasDisponiveis(bancaId);
    if (disponiveis.length === 0) return false;
    return disponiveis.every((sub) => selectedLotteries.includes(sub.id));
  };

  const isSomeSelectedInBanca = (bancaId: string): boolean => {
    const disponiveis = getSubLoteriasDisponiveis(bancaId);
    return disponiveis.some((sub) => selectedLotteries.includes(sub.id));
  };

  const toggleAllInBanca = (bancaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const disponiveis = getSubLoteriasDisponiveis(bancaId);
    if (disponiveis.length === 0) return;

    const allSelected = isAllSelectedInBanca(bancaId);

    if (allSelected) {
      disponiveis.forEach((sub) => {
        if (selectedLotteries.includes(sub.id)) {
          onToggleLottery(sub.id);
        }
      });
    } else {
      disponiveis.forEach((sub) => {
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
                        ? 'bg-zinc-900 border-zinc-900'
                        : someSelected
                        ? 'border-zinc-900 bg-gray-100'
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
                    const passado = isHorarioPassado(sub.horario);

                    // Se horário já passou, mostra desabilitado
                    if (passado) {
                      return (
                        <div
                          key={sub.id}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-100 opacity-50 cursor-not-allowed"
                        >
                          <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-3 w-3 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-500 line-through">
                                {sub.nome} {sub.horario.replace(':', 'H').replace(':00', 'HS').replace(':20', 'HS').replace(':15', 'HS')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-red-500 font-medium">ENCERRADO</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

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
          className="w-full h-12 bg-zinc-900 rounded-lg font-semibold text-white"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
