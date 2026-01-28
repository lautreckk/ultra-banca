'use client';

import { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff, ChevronUp, Info, Clock } from 'lucide-react';
import { getModalidadeById } from '@/lib/constants/modalidades';

// Generate next 6 days for sorteio
function getNextSorteioDays(): { date: Date; dateStr: string; dayName: string; isToday: boolean }[] {
  const days = [];
  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    days.push({
      date,
      dateStr,
      dayName: i === 0 ? 'Hoje' : dayNames[date.getDay()],
      isToday: i === 0,
    });
  }
  return days;
}

function QuininhaDiasContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const data = params.data as string;
  const modalidadeId = params.modalidade as string;
  const palpitesStr = searchParams.get('palpites') || '';
  const valorParam = searchParams.get('valor') || '0';
  const totalParam = searchParams.get('total') || '0';

  const modalidade = getModalidadeById(modalidadeId);
  const palpites = palpitesStr.split('|').filter(Boolean);
  const valorPorPalpite = parseFloat(valorParam);
  const valorTotalBase = parseFloat(totalParam);

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [sorteExtra, setSorteExtra] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(true);

  const sorteioDays = getNextSorteioDays();

  const handleToggleDay = (dateStr: string) => {
    if (selectedDays.includes(dateStr)) {
      setSelectedDays(selectedDays.filter((d) => d !== dateStr));
    } else {
      setSelectedDays([...selectedDays, dateStr]);
    }
  };

  const valorTotal = valorTotalBase * selectedDays.length;

  const handleApostar = () => {
    if (selectedDays.length === 0) return;

    // Navigate to finalizar
    router.push(
      `/quininha/${data}/${modalidadeId}/finalizar?palpites=${encodeURIComponent(palpitesStr)}&valor=${valorPorPalpite}&dias=${encodeURIComponent(selectedDays.join(','))}`
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
          <span className="text-sm font-bold text-white">SELECIONAR DIAS</span>
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
        {/* Total Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <span className="font-bold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">R$ {formatCurrency(valorTotal)}</span>
        </div>

        {/* Accordion */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full flex justify-between items-center p-4"
          >
            <span className="font-medium text-gray-900">QUININHA</span>
            <ChevronUp className={`h-5 w-5 text-gray-400 transition-transform ${accordionOpen ? '' : 'rotate-180'}`} />
          </button>

          {accordionOpen && (
            <div className="px-4 pb-4">
              {/* Sorte Extra Toggle */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-blue-500 font-bold">SORTE EXTRA?</span>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-sm">NÃO</span>
                  <button
                    onClick={() => setSorteExtra(!sorteExtra)}
                    className={`w-12 h-6 rounded-full transition-colors ${sorteExtra ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${sorteExtra ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Days List */}
              <div className="space-y-3">
                {sorteioDays.map((day) => (
                  <button
                    key={day.dateStr}
                    onClick={() => handleToggleDay(day.dateStr)}
                    className="w-full flex items-center gap-3 py-3 border-b border-gray-100"
                  >
                    <div className={`w-5 h-5 border-2 rounded ${selectedDays.includes(day.dateStr) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {selectedDays.includes(day.dateStr) && (
                        <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-gray-900">{day.dateStr} - {day.dayName}</div>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
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

        {/* Bottom Section */}
        <div className="p-4">
          <div className="border-t border-dashed border-gray-300 pt-4">
            <button
              onClick={handleApostar}
              disabled={selectedDays.length === 0}
              className="w-full h-12 bg-gray-300 rounded-lg font-semibold text-white disabled:opacity-50 enabled:bg-[#1A202C]"
            >
              APOSTAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuininhaDiasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A202C]" />}>
      <QuininhaDiasContent />
    </Suspense>
  );
}
