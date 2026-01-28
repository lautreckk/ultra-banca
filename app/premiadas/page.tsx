'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout';

export default function PremiadasPage() {
  return (
    <PageLayout title="PREMIADAS" showBack>
      <div className="bg-white">
        <Link
          href="/premiadas/consultar"
          className="flex items-center justify-between px-4 py-4 active:bg-gray-50"
        >
          <span className="font-medium text-gray-800">CONSULTAR POR PREMIADAS</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </Link>
      </div>
    </PageLayout>
  );
}
