'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLOCACOES, calcularMultiplicadorEfetivo, formatMultiplicador } from '@/lib/constants';

interface PlacementListProps {
  baseHref: string;
  multiplicadorBase?: number;
  className?: string;
}

export function PlacementList({ baseHref, multiplicadorBase = 800, className }: PlacementListProps) {
  const [search, setSearch] = useState('');

  const filteredColocacoes = COLOCACOES.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn('bg-white', className)}>
      {/* Search Input */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--color-accent-blue)]"
          />
        </div>
      </div>

      {/* Colocações List */}
      <div className="divide-y divide-[var(--color-border)]">
        {filteredColocacoes.map((colocacao) => {
          const multiplicadorEfetivo = calcularMultiplicadorEfetivo(multiplicadorBase, colocacao.id);

          return (
            <Link
              key={colocacao.id}
              href={`${baseHref}/${colocacao.id}`}
              className="flex h-14 items-center justify-between px-4 min-h-[44px] transition-colors duration-200 active:bg-gray-50"
            >
              <span className="font-medium text-gray-800">{colocacao.nome}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--color-accent-blue)]">
                  {formatMultiplicador(multiplicadorEfetivo)}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          );
        })}
      </div>

      {filteredColocacoes.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-500">
          Nenhuma colocação encontrada
        </div>
      )}
    </div>
  );
}
