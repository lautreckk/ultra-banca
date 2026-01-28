'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/layout';

export default function FazendinhaPage() {
  // Gerar próximos 7 dias
  const dates = generateNext7Days();

  return (
    <PageLayout title="SELECIONAR DATA">
      <div className="bg-white min-h-screen">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-6">FAZENDINHA</h2>

          {/* Grid de Datas 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {dates.map((date, index) => (
              <Link
                key={date.value}
                href={`/fazendinha/${date.value}`}
                className="flex flex-col items-center justify-center bg-[#1A202C] rounded-lg py-6 px-4 min-h-[100px] transition-transform active:scale-[0.98]"
              >
                <span className="text-2xl font-bold text-white border-2 border-white rounded px-3 py-1">
                  {date.day}
                </span>
                <span className="text-white font-semibold mt-2 uppercase tracking-wide">
                  {index === 0 ? 'HOJE' : date.weekday}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function generateNext7Days(): { value: string; day: string; weekday: string }[] {
  const days: { value: string; day: string; weekday: string }[] = [];
  const weekdays = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];

  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const value = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const day = date.getDate().toString().padStart(2, '0');
    const weekday = weekdays[date.getDay()];

    days.push({ value, day, weekday });
  }

  return days;
}
