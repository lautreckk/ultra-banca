'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw } from 'lucide-react';
import type { ModalidadeDB } from '@/lib/actions/modalidades';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';

interface QuininhaModalidadesClientProps {
  data: string;
  modalidades: ModalidadeDB[];
}

export function QuininhaModalidadesClient({ data, modalidades }: QuininhaModalidadesClientProps) {
  const router = useRouter();
  const { saldo, saldoBonus } = useUserBalance();

  const handleSelectModalidade = (codigo: string) => {
    router.push(`/quininha/${data}/${codigo}`);
  };

  return (
    <div className="min-h-screen bg-[#111318]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-base font-bold text-white">MODALIDADES</span>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* Balance Bar */}
      <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
        <button className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10" aria-label="Atualizar saldo">
          <RefreshCw className="h-5 w-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">R$ {formatCurrencyCompact(saldo)} | {formatCurrencyCompact(saldoBonus)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#1A1F2B] min-h-screen p-4">
        {/* Title */}
        <h1 className="text-xl font-bold text-white mb-1">QUININHA</h1>
        <p className="text-zinc-500 text-sm mb-6">Selecione a modalidade</p>

        {/* Modalidades Grid */}
        <div className="grid grid-cols-2 gap-3">
          {modalidades.map((modalidade) => (
            <button
              key={modalidade.id}
              onClick={() => handleSelectModalidade(modalidade.codigo)}
              className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-4 text-center hover:bg-[#2D3748] active:scale-[0.98] transition-all"
              aria-label={`Selecionar ${modalidade.nome}`}
            >
              <span className="text-white font-bold text-sm">{modalidade.nome}</span>
              <div className="text-[#E5A220] text-xs mt-1">
                {modalidade.multiplicador}x
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
