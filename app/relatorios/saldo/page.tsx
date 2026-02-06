'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout';

export default function SaldoPage() {
  // Generate last 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      display: date.toLocaleDateString('pt-BR'),
      param: date.toISOString().split('T')[0],
    };
  });

  return (
    <PageLayout title="SALDO" showBack>
      <div className="divide-y divide-zinc-700/30 bg-[#1A1F2B] rounded-xl border border-zinc-700/40 mx-4 mt-4 overflow-hidden">
        {dates.map((date) => (
          <Link
            key={date.param}
            href={`/relatorios/saldo/${date.param}`}
            className="flex items-center justify-between px-4 py-4 min-h-[56px] active:bg-zinc-700/50 active:scale-[0.98] transition-all"
          >
            <span className="text-white">{date.display}</span>
            <ChevronRight className="h-5 w-5 text-zinc-500" />
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}
