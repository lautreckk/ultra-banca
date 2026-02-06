'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout';

export default function ConsultarPremiadasPage() {
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
    <PageLayout title="CONSULTAR POR PREMIADAS" showBack>
      <div className="bg-[#111318] min-h-screen p-4 space-y-3">
        {dates.map((date) => (
          <Link
            key={date.param}
            href={`/premiadas/consultar/${date.param}`}
            className="flex items-center justify-between px-4 h-14 bg-[#1A1F2B] border border-zinc-700/40 rounded-xl active:scale-[0.98] transition-all"
          >
            <span className="text-white">{date.display}</span>
            <ChevronRight className="h-5 w-5 text-zinc-500" />
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}
