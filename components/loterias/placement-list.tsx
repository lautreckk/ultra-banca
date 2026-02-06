'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLOCACOES, calcularMultiplicadorEfetivo, formatMultiplicador } from '@/lib/constants';
import type { ModalidadeDB } from '@/lib/actions/modalidades';

interface PlacementListProps {
  baseHref: string;
  multiplicadorBase?: number;
  className?: string;
  modalidadeDB?: ModalidadeDB | null;
}

// Mapeamento de colocação para campo de permissão
function isColocacaoPermitida(modalidade: ModalidadeDB | null | undefined, colocacaoId: string): boolean {
  if (!modalidade) return true; // Se não tiver dados do banco, permite todas

  switch (colocacaoId) {
    case '1_ao_5':
      return modalidade.posicoes_1_5;
    case '1_ao_6':
      return modalidade.posicoes_1_6;
    case '1_ao_7':
      return modalidade.posicoes_1_7;
    case '1_ao_10':
      return modalidade.posicoes_1_10;
    case '5_e_6':
      return modalidade.posicoes_5_6;
    default:
      return true;
  }
}

export function PlacementList({ baseHref, multiplicadorBase = 800, className, modalidadeDB }: PlacementListProps) {
  const [search, setSearch] = useState('');

  // Filtra por busca e por permissões da modalidade
  const filteredColocacoes = COLOCACOES.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) &&
    isColocacaoPermitida(modalidadeDB, c.id)
  );

  return (
    <div className={cn('bg-[#1A1F2B]', className)}>
      {/* Search Input */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-10 pr-4 py-2 bg-zinc-900/80 border border-zinc-700/40 rounded-xl text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              className="flex h-14 items-center justify-between px-4 min-h-[56px] transition-colors duration-200 active:bg-zinc-700/30"
            >
              <span className="font-semibold text-white">{colocacao.nome}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-400">
                  {formatMultiplicador(multiplicadorEfetivo)}
                </span>
                <ChevronRight className="h-5 w-5 text-zinc-500" />
              </div>
            </Link>
          );
        })}
      </div>

      {filteredColocacoes.length === 0 && (
        <div className="px-4 py-8 text-center text-zinc-500">
          Nenhuma colocação encontrada
        </div>
      )}
    </div>
  );
}
