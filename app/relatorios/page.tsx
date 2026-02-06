'use client';

import Link from 'next/link';
import { ChevronRight, Wallet, FileText, PawPrint, TrendingUp, Table } from 'lucide-react';
import { PageLayout } from '@/components/layout';

const menuItems = [
  { icon: Wallet, label: 'SALDO', href: '/relatorios/saldo' },
  { icon: FileText, label: 'PULES', href: '/relatorios/pules' },
  { icon: PawPrint, label: 'FAZENDINHA', href: '/relatorios/fazendinha' },
  { icon: TrendingUp, label: 'MOVIMENTO LOTERIAS', href: '/relatorios/movimento' },
  { icon: Table, label: 'COTACOES', href: '/relatorios/cotacoes' },
];

export default function RelatoriosPage() {
  return (
    <PageLayout title="RELATORIOS">
      <div className="divide-y divide-zinc-700/30 bg-[#1A1F2B]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-4 active:bg-zinc-700/50"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-zinc-400" />
                <span className="font-medium text-white">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </Link>
          );
        })}
      </div>
    </PageLayout>
  );
}
