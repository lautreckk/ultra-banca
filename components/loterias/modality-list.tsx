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
import type { ModalidadeDB } from '@/lib/actions/modalidades';

// Categorias para exibição (do banco)
const CATEGORIAS_DB = [
  { id: 'centena', nome: 'Centenas' },
  { id: 'milhar', nome: 'Milhares' },
  { id: 'unidade', nome: 'Unidade' },
  { id: 'dezena', nome: 'Dezenas' },
  { id: 'duque_dezena', nome: 'Duque Dezena' },
  { id: 'terno_dezena_seco', nome: 'Terno Dezena Seco' },
  { id: 'terno_dezena', nome: 'Terno Dezena' },
  { id: 'grupo', nome: 'Grupo' },
  { id: 'duque_grupo', nome: 'Duque Grupo' },
  { id: 'terno_grupo', nome: 'Terno Grupo' },
  { id: 'quadra_grupo', nome: 'Quadra Grupo' },
  { id: 'quina_grupo', nome: 'Quina Grupo' },
  { id: 'sena_grupo', nome: 'Sena Grupo' },
  { id: 'passe', nome: 'Passe' },
  { id: 'palpitao', nome: 'Palpitão' },
];

interface ModalityListProps {
  baseHref: string;
  tipoJogo?: string;
  className?: string;
  modalidadesFromDB?: ModalidadeDB[];
}

export function ModalityList({ baseHref, tipoJogo = 'loterias', className, modalidadesFromDB }: ModalityListProps) {
  // Se tiver modalidades do banco e for loterias, usa elas
  const useDBModalidades = modalidadesFromDB && modalidadesFromDB.length > 0 && tipoJogo === 'loterias';

  // Fallback para hardcoded (quininha, seninha, lotinha)
  const modalidades = useDBModalidades ? [] : getModalidadesByJogo(tipoJogo);

  // Para Loterias com dados do banco
  if (useDBModalidades && modalidadesFromDB) {
    return (
      <div className={cn('bg-[#1A1F2B]', className)}>
        {CATEGORIAS_DB.map((categoria) => {
          const modalidadesCategoria = modalidadesFromDB.filter(
            (m) => m.categoria === categoria.id
          );

          if (modalidadesCategoria.length === 0) return null;

          return (
            <div key={categoria.id} className="mb-2">
              <div className="bg-zinc-800/50 px-4 py-2 text-sm font-bold text-zinc-300 uppercase tracking-wide">
                {categoria.nome}
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {modalidadesCategoria.map((modalidade) => (
                  <ModalityItemDB
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

  // Para Loterias com dados hardcoded (fallback)
  if (tipoJogo === 'loterias') {
    return (
      <div className={cn('bg-[#1A1F2B]', className)}>
        {CATEGORIAS_MODALIDADES.map((categoria) => {
          const modalidadesCategoria = modalidades.filter(
            (m) => m.categoria === categoria.id
          );

          if (modalidadesCategoria.length === 0) return null;

          return (
            <div key={categoria.id} className="mb-2">
              <div className="bg-zinc-800/50 px-4 py-2 text-sm font-bold text-zinc-300 uppercase tracking-wide">
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
    <div className={cn('bg-[#1A1F2B] divide-y divide-zinc-700/40', className)}>
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
      className="flex h-14 items-center justify-between px-4 min-h-[56px] transition-colors duration-200 active:bg-zinc-700/30"
    >
      <span className="font-semibold text-white">{modalidade.nome}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-400">
          {formatMultiplicador(modalidade.multiplicador)}
        </span>
        <ChevronRight className="h-5 w-5 text-zinc-500" />
      </div>
    </Link>
  );
}

// Componente para modalidades do banco de dados
interface ModalityItemDBProps {
  modalidade: ModalidadeDB;
  baseHref: string;
}

function ModalityItemDB({ modalidade, baseHref }: ModalityItemDBProps) {
  return (
    <Link
      href={`${baseHref}/${modalidade.codigo}`}
      className="flex h-14 items-center justify-between px-4 min-h-[56px] transition-colors duration-200 active:bg-zinc-700/30"
    >
      <span className="font-semibold text-white">{modalidade.nome}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-400">
          {formatMultiplicador(modalidade.multiplicador)}
        </span>
        <ChevronRight className="h-5 w-5 text-zinc-500" />
      </div>
    </Link>
  );
}
