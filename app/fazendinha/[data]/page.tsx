'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { BICHOS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface FazendinhaBichosPageProps {
  params: Promise<{ data: string }>;
}

export default function FazendinhaBichosPage({ params }: FazendinhaBichosPageProps) {
  const { data } = use(params);
  const router = useRouter();
  const [selectedBichos, setSelectedBichos] = useState<number[]>([]);

  // Formatar data para exibição
  const dateObj = new Date(data + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const toggleBicho = (numero: number) => {
    setSelectedBichos((prev) =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero]
    );
  };

  const handleContinue = () => {
    if (selectedBichos.length > 0) {
      router.push(`/fazendinha/${data}/apostar?bichos=${selectedBichos.join(',')}`);
    }
  };

  return (
    <PageLayout title="FAZENDINHA">
      <div className="bg-white min-h-screen pb-32">
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-1 capitalize">{formattedDate}</p>
          <p className="text-sm text-gray-500 mb-4">
            Selecione os bichos para apostar ({selectedBichos.length} selecionados)
          </p>

          {/* Bichos Grid */}
          <div className="grid grid-cols-5 gap-2">
            {BICHOS.map((bicho) => {
              const isSelected = selectedBichos.includes(bicho.numero);

              return (
                <button
                  key={bicho.numero}
                  onClick={() => toggleBicho(bicho.numero)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg p-2 transition-all active:scale-[0.95]',
                    isSelected
                      ? 'bg-[#E5A220] text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  )}
                >
                  <span className="text-2xl">{bicho.emoji}</span>
                  <span className="text-xs font-medium mt-1 truncate w-full text-center">
                    {bicho.numero.toString().padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Bichos */}
          {selectedBichos.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Selecionados:</p>
              <div className="flex flex-wrap gap-2">
                {selectedBichos.map((numero) => {
                  const bicho = BICHOS.find((b) => b.numero === numero);
                  return (
                    <span
                      key={numero}
                      className="inline-flex items-center gap-1 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      {bicho?.emoji} {bicho?.nome}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
          <button
            onClick={handleContinue}
            disabled={selectedBichos.length === 0}
            className="w-full rounded-xl bg-zinc-900 py-3.5 font-bold text-white disabled:opacity-50 transition-colors hover:bg-zinc-800"
          >
            Continuar com {selectedBichos.length} {selectedBichos.length === 1 ? 'bicho' : 'bichos'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
