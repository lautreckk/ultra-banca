'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff, Search, ChevronRight } from 'lucide-react';
import { MODALIDADES_LOTINHA } from '@/lib/constants/modalidades';

export default function LotinhaPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModalidades = MODALIDADES_LOTINHA.filter((m) =>
    m.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectModalidade = (modalidadeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    router.push(`/lotinha/${today}/${modalidadeId}`);
  };

  const formatMultiplicador = (mult: number): string => {
    if (mult >= 1000) {
      return `${(mult / 1000).toFixed(3).replace('.', '.')}x`;
    }
    return `${mult}x`;
  };

  return (
    <div className="min-h-screen bg-[#1A202C]">
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">MODALIDADE</span>
          <button className="flex h-10 w-10 items-center justify-center">
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
        <RefreshCw className="h-5 w-5 text-white" />
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">R$ ******* | *******</span>
          <EyeOff className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="bg-white min-h-screen">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar..."
            className="flex-1 text-gray-900 focus:outline-none"
          />
        </div>

        <div className="divide-y divide-gray-100">
          {filteredModalidades.map((modalidade) => (
            <button
              key={modalidade.id}
              onClick={() => handleSelectModalidade(modalidade.id)}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{modalidade.nome}</span>
              <div className="flex items-center gap-2">
                <span className="text-pink-500 font-medium">
                  {formatMultiplicador(modalidade.multiplicador)}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
