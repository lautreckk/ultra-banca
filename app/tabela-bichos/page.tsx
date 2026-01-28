'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, EyeOff } from 'lucide-react';
import { BICHOS } from '@/lib/constants/bichos';

export default function TabelaBichosPage() {
  const router = useRouter();

  const formatDezena = (num: number): string => {
    return num.toString().padStart(2, '0');
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
          <span className="text-sm font-bold text-white">BANCA FORTE</span>
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
      <div className="bg-gray-100 min-h-screen p-4">
        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          Tabela de Bichos
        </h1>

        {/* Grid of Animals */}
        <div className="grid grid-cols-4 gap-2">
          {BICHOS.map((bicho) => (
            <div
              key={bicho.numero}
              className="bg-white rounded-lg border border-gray-200 p-2 flex flex-col items-center"
            >
              {/* Group Number */}
              <div className="self-start text-xs font-bold text-gray-900">
                {formatDezena(bicho.numero)}
              </div>

              {/* Animal Emoji */}
              <div className="text-4xl my-2">
                {bicho.emoji}
              </div>

              {/* Dezenas */}
              <div className="text-xs text-gray-600 text-center">
                {bicho.dezenas.map(d => formatDezena(d)).join(' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
