'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff, Search, ChevronRight } from 'lucide-react';
import type { ModalidadeDB } from '@/lib/actions/modalidades';

interface LotinhaClientProps {
  modalidades: ModalidadeDB[];
}

export function LotinhaClient({ modalidades }: LotinhaClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModalidades = modalidades.filter((m) =>
    m.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectModalidade = (codigo: string) => {
    const today = new Date().toISOString().split('T')[0];
    router.push(`/lotinha/${today}/${codigo}`);
  };

  const formatMultiplicador = (mult: number): string => {
    if (mult >= 1000) {
      return `${(mult / 1000).toFixed(3).replace('.', '.')}x`;
    }
    return `${mult}x`;
  };

  return (
    <div className="min-h-screen bg-[#111318]">
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-base font-bold text-white">MODALIDADE</span>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
        <button className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10" aria-label="Atualizar saldo">
          <RefreshCw className="h-5 w-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">R$ ******* | *******</span>
          <button className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-black/10" aria-label="Mostrar saldo">
            <EyeOff className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="bg-[#1A1F2B] min-h-screen">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-700/40">
          <Search className="h-5 w-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar..."
            className="flex-1 h-14 min-h-[48px] rounded-xl bg-transparent text-white text-base focus:outline-none"
            aria-label="Pesquisar modalidade"
          />
        </div>

        <div className="divide-y divide-zinc-700/40">
          {filteredModalidades.map((modalidade) => (
            <button
              key={modalidade.id}
              onClick={() => handleSelectModalidade(modalidade.codigo)}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-zinc-700/30 active:scale-[0.98] transition-all"
              aria-label={`Selecionar ${modalidade.nome}`}
            >
              <span className="font-medium text-white">{modalidade.nome}</span>
              <div className="flex items-center gap-2">
                <span className="text-pink-500 font-medium">
                  {formatMultiplicador(modalidade.multiplicador)}
                </span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
