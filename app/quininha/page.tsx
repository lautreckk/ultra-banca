'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff } from 'lucide-react';
import { BrasiliaClock } from '@/components/layout';

// Generate next 6 days
function getNextDays(): { date: Date; dayNum: number; dayName: string }[] {
  const days = [];
  const dayNames = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];

  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push({
      date,
      dayNum: date.getDate(),
      dayName: dayNames[date.getDay()],
    });
  }
  return days;
}

export default function QuininhaPage() {
  const router = useRouter();
  const days = getNextDays();

  const handleSelectDay = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-CA');
    router.push(`/quininha/${dateStr}`);
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
          <span className="text-base font-bold text-white">TIPO DE JOGO</span>
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

      <BrasiliaClock />

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h1 className="text-2xl font-bold text-[#E5A220] mb-1" style={{ fontFamily: 'serif' }}>
          QUININHA
        </h1>
        <p className="text-zinc-500 text-sm mb-6">
          SELECIONE O DIA DO SORTEIO
        </p>

        {/* Days Grid */}
        <div className="grid grid-cols-2 gap-3">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => handleSelectDay(day.date)}
              className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-[#2D3748] active:scale-[0.98] transition-all"
              aria-label={`Selecionar dia ${day.dayNum} ${day.dayName}`}
            >
              <div className="bg-[#111318] rounded-xl w-14 h-14 flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-white">{day.dayNum}</span>
              </div>
              <span className="text-white font-bold text-sm">{day.dayName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
