'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout';

export default function FazendinhaPage() {
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
    <PageLayout title="FAZENDINHA" showBack>
      <div className="divide-y divide-gray-200 bg-white">
        {dates.map((date) => (
          <Link
            key={date.param}
            href={`/relatorios/fazendinha/${date.param}`}
            className="flex items-center justify-between px-4 py-4 active:bg-gray-50"
          >
            <span className="text-gray-800">{date.display}</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}
