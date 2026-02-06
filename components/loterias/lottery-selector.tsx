'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, Clock, BadgeCheck } from 'lucide-react';
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
  pendingItemsCount?: number; // Quantidade de apostas pendentes
}

export function LotterySelector({
  selectedLotteries,
  onToggleLottery,
  onConfirm,
  onBack,
  total = 0,
  className,
  dataJogo,
  pendingItemsCount = 1,
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

  // Filtra bancas: Federal só aparece em Quarta (3) e Sábado (6)
  const bancasVisiveis = useMemo(() => {
    const dataRef = dataJogo ? new Date(dataJogo + 'T12:00:00') : new Date();
    const diaSemana = dataRef.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
    const isFederalDay = diaSemana === 3 || diaSemana === 6;

    return BANCAS.filter((banca) => {
      if (banca.id === 'federal') return isFederalDay;
      return true;
    });
  }, [dataJogo]);

  const totalValue = total.toFixed(2).replace('.', ',');

  return (
    <div className={cn('bg-[#1A1F2B] min-h-screen', className)}>
      {/* Total Row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/40">
        <div>
          <span className="font-bold text-white">Total</span>
          {pendingItemsCount > 1 && (
            <span className="text-sm text-zinc-500 ml-2">({pendingItemsCount} apostas)</span>
          )}
        </div>
        <span className="font-bold text-white">R$ {totalValue}</span>
      </div>

      {/* Section Label */}
      <div className="px-4 py-3">
        <span className="text-zinc-300 font-medium">Selecione as loterias:</span>
      </div>

      {/* Bancas Accordion */}
      <div className="mx-4 border border-zinc-700/40 rounded-lg overflow-hidden">
        {bancasVisiveis.map((banca, index) => {
          const isExpanded = expandedBancas.includes(banca.id);
          const allSelected = isAllSelectedInBanca(banca.id);
          const someSelected = isSomeSelectedInBanca(banca.id);

          return (
            <div key={banca.id} className={index > 0 ? 'border-t border-zinc-700/40' : ''}>
              {/* Banca Header */}
              <button
                onClick={() => toggleBanca(banca.id)}
                className="w-full flex items-center justify-between px-4 py-4 bg-[#1A1F2B]"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => toggleAllInBanca(banca.id, e)}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                      allSelected
                        ? 'bg-zinc-900 border-zinc-900'
                        : someSelected
                        ? 'border-zinc-900 bg-zinc-800/50'
                        : 'border-zinc-700/40'
                    )}
                  >
                    {allSelected && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <span className="font-bold text-white">{banca.nome}</span>
                  {banca.id === 'federal' && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      OFICIAL
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-zinc-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-zinc-500" />
                )}
              </button>

              {/* Sub-Loterias - Vertical List */}
              {isExpanded && (
                <div className="divide-y divide-zinc-700/40">
                  {banca.subLoterias.map((sub) => {
                    const isSelected = selectedLotteries.includes(sub.id);
                    const isMaluca = sub.nome.toLowerCase().includes('maluca');
                    const passado = isHorarioPassado(sub.horario);

                    // Se horário já passou, mostra desabilitado
                    if (passado) {
                      return (
                        <div
                          key={sub.id}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left bg-zinc-800/50 opacity-50 cursor-not-allowed"
                        >
                          <div className="w-5 h-5 rounded border-2 border-zinc-700/40 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-3 w-3 text-zinc-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-500 line-through">
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
                          isSelected ? 'bg-[#E5A220]/10' : 'bg-[#1A1F2B] hover:bg-zinc-700/30'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                            isSelected
                              ? 'bg-[#E5A220] border-[#E5A220]'
                              : 'border-zinc-700/40'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-black" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {sub.nome} {sub.horario.replace(':', 'H').replace(':00', 'HS').replace(':20', 'HS').replace(':15', 'HS')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-500">{sub.horario}</span>
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
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A1F2B] border-t border-zinc-700/40 p-4 pb-safe">
        <div className="max-w-md mx-auto space-y-3">
          <button
            onClick={onConfirm}
            disabled={selectedLotteries.length === 0}
            className="w-full h-16 min-h-[64px] bg-[#E5A220] rounded-xl font-bold text-zinc-900 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            Confirmar
          </button>
          <button
            onClick={onBack}
            className="w-full h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
