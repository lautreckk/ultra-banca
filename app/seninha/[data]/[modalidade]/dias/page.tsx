'use client';

import { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, ChevronUp, Clock } from 'lucide-react';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

function getNextSorteioDays(): { dateStr: string; dayName: string }[] {
  const days = [];
  const dayNames = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
  // Mega-Sena draws on Wed and Sat
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 3 || dayOfWeek === 6 || dayOfWeek === 2) { // Tue, Wed, Sat
      const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      days.push({ dateStr, dayName: dayNames[dayOfWeek] });
    }
  }
  return days.slice(0, 6);
}

function SeninhaDiasContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const { saldo, saldoBonus, refresh } = useUserBalance();

  const data = params.data as string;
  const modalidadeId = params.modalidade as string;
  const palpitesStr = searchParams.get('palpites') || '';
  const valorParam = searchParams.get('valor') || '0';
  const totalParam = searchParams.get('total') || '0';

  const valorTotalBase = parseFloat(totalParam);
  const valorPorPalpite = parseFloat(valorParam);

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [accordionOpen, setAccordionOpen] = useState(true);

  const sorteioDays = getNextSorteioDays();
  const valorTotal = valorTotalBase * selectedDays.length;

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#111318] flex justify-center">
      <div className="w-full max-w-md bg-[#111318] min-h-screen shadow-xl flex flex-col">
        <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
          <div className="flex h-12 items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <span className="text-base font-bold text-white">SELECIONAR DIAS</span>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
          </div>
        </header>

        <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
          <button onClick={refresh} className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10" aria-label="Atualizar saldo">
            <RefreshCw className="h-5 w-5 text-white" />
          </button>
          <span className="text-white font-medium">R$ {formatCurrencyCompact(saldo)} | {formatCurrencyCompact(saldoBonus)}</span>
        </div>

        <div className="bg-[#1A1F2B] flex-1">
        <div className="flex justify-between items-center p-4 border-b border-zinc-700/40">
          <span className="font-bold text-white">Total</span>
          <span className="font-bold text-white">R$ {formatCurrency(valorTotal)}</span>
        </div>

        <div className="border-b border-zinc-700/40">
          <button
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full flex justify-between items-center p-4 active:scale-[0.98] transition-all"
            aria-label="Expandir ou recolher seninha"
          >
            <span className="font-medium text-white">SENINHA</span>
            <ChevronUp className={`h-5 w-5 text-zinc-500 transition-transform ${accordionOpen ? '' : 'rotate-180'}`} />
          </button>

          {accordionOpen && (
            <div className="px-4 pb-4">
              <div className="space-y-3">
                {sorteioDays.map((day) => (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDays(selectedDays.includes(day.dateStr) ? selectedDays.filter((d) => d !== day.dateStr) : [...selectedDays, day.dateStr])}
                    className="w-full flex items-center gap-3 py-3 border-b border-zinc-700/40 active:scale-[0.98] transition-all"
                    aria-label={`Selecionar ${day.dateStr} ${day.dayName}`}
                  >
                    <div className={`w-5 h-5 border-2 rounded ${selectedDays.includes(day.dateStr) ? 'bg-blue-500 border-blue-500' : 'border-zinc-700/40'}`}>
                      {selectedDays.includes(day.dateStr) && (
                        <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white">{day.dateStr} - {day.dayName}</div>
                      <div className="flex items-center gap-1 text-zinc-500 text-sm">
                        <Clock className="h-3 w-3" />
                        <span>20:45</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="border-t border-dashed border-zinc-700/40 pt-4">
            <button
              onClick={() => selectedDays.length > 0 && router.push(`/seninha/${data}/${modalidadeId}/finalizar?palpites=${encodeURIComponent(palpitesStr)}&valor=${valorPorPalpite}&dias=${encodeURIComponent(selectedDays.join(','))}`)}
              disabled={selectedDays.length === 0}
              className="w-full h-14 min-h-[56px] bg-[#E5A220] rounded-xl font-bold text-zinc-900 disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-400 active:scale-[0.98] transition-all"
              aria-label="Confirmar aposta"
            >
              APOSTAR
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function SeninhaDiasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111318]" />}>
      <SeninhaDiasContent />
    </Suspense>
  );
}
