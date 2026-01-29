'use client';

import Link from 'next/link';
import { ChevronRight, Search, Calendar } from 'lucide-react';
import { PageLayout } from '@/components/layout';

const menuItems = [
  { icon: Search, label: 'CONSULTAR POR CODIGO', href: '/relatorios/pules/codigo' },
  { icon: Calendar, label: 'CONSULTAR POR DATA', href: '/relatorios/pules/data' },
];

export default function PulesPage() {
  return (
    <PageLayout title="PULES" showBack>
      <div className="divide-y divide-gray-200 bg-white">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-4 active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-800">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
          );
        })}
      </div>
    </PageLayout>
  );
}
