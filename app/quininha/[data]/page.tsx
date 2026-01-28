'use client';

import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff } from 'lucide-react';
import { MODALIDADES_QUININHA } from '@/lib/constants/modalidades';

export default function QuininhaModalidadesPage() {
  const router = useRouter();
  const params = useParams();
  const data = params.data as string;

  const handleSelectModalidade = (modalidadeId: string) => {
    router.push(`/quininha/${data}/${modalidadeId}`);
  };

  return (
    <div className="min-h-screen bg-[#1A202C]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">MODALIDADES</span>
          <button className="flex h-10 w-10 items-center justify-center">
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* Balance Bar */}
      <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between">
        <RefreshCw className="h-5 w-5 text-white" />
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">R$ ******* | *******</span>
          <EyeOff className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white min-h-screen p-4">
        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">QUININHA</h1>
        <p className="text-gray-500 text-sm mb-6">Selecione a modalidade</p>

        {/* Modalidades Grid */}
        <div className="grid grid-cols-2 gap-3">
          {MODALIDADES_QUININHA.map((modalidade) => (
            <button
              key={modalidade.id}
              onClick={() => handleSelectModalidade(modalidade.id)}
              className="bg-[#2D3748] rounded-lg p-4 text-center hover:bg-[#3D4758] transition-colors"
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
