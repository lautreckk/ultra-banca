'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CATEGORIAS_MODALIDADES,
  getModalidadesByJogo,
  formatMultiplicador,
  type Modalidade
} from '@/lib/constants';

interface ModalityListProps {
  baseHref: string;
  tipoJogo?: string;
  className?: string;
}

export function ModalityList({ baseHref, tipoJogo = 'loterias', className }: ModalityListProps) {
  const modalidades = getModalidadesByJogo(tipoJogo);

  // Para Loterias, agrupa por categoria
  if (tipoJogo === 'loterias') {
    return (
      <div className={cn('bg-white', className)}>
        {CATEGORIAS_MODALIDADES.map((categoria) => {
          const modalidadesCategoria = modalidades.filter(
            (m) => m.categoria === categoria.id
          );

          if (modalidadesCategoria.length === 0) return null;

          return (
            <div key={categoria.id} className="mb-2">
              <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {categoria.nome}
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {modalidadesCategoria.map((modalidade) => (
                  <ModalityItem
                    key={modalidade.id}
                    modalidade={modalidade}
                    baseHref={baseHref}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Para outros jogos (Quininha, Seninha, Lotinha), lista simples
  return (
    <div className={cn('bg-white divide-y divide-[var(--color-border)]', className)}>
      {modalidades.map((modalidade) => (
        <ModalityItem
          key={modalidade.id}
          modalidade={modalidade}
          baseHref={baseHref}
        />
      ))}
    </div>
  );
}

interface ModalityItemProps {
  modalidade: Modalidade;
  baseHref: string;
}

function ModalityItem({ modalidade, baseHref }: ModalityItemProps) {
  return (
    <Link
      href={`${baseHref}/${modalidade.id}`}
      className="flex h-14 items-center justify-between px-4 min-h-[44px] transition-colors duration-200 active:bg-gray-50"
    >
      <span className="font-medium text-gray-800">{modalidade.nome}</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[var(--color-accent-blue)]">
          {formatMultiplicador(modalidade.multiplicador)}
        </span>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </Link>
  );
}
