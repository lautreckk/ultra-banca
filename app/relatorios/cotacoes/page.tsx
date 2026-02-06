'use client';

import Link from 'next/link';
import { ChevronRight, Dices, Star, Sparkles, Clover } from 'lucide-react';
import { PageLayout } from '@/components/layout';

const menuItems = [
  { icon: Dices, label: 'LOTERIAS', href: '/relatorios/cotacoes/loterias' },
  { icon: Star, label: 'QUININHA', href: '/relatorios/cotacoes/quininha' },
  { icon: Sparkles, label: 'SENINHA', href: '/relatorios/cotacoes/seninha' },
  { icon: Clover, label: 'LOTINHA', href: '/relatorios/cotacoes/lotinha' },
];

export default function CotacoesPage() {
  return (
    <PageLayout title="COTACOES" showBack>
      <div className="divide-y divide-zinc-700/40 bg-[#1A1F2B] rounded-xl border border-zinc-700/40 mx-4 mt-4 overflow-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-4 min-h-[56px] active:bg-zinc-700/30 active:scale-[0.98] transition-all"
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
