'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Printer, Share2 } from 'lucide-react';
import { PageLayout } from '@/components/layout';
import { BANCAS, getBichoByDezena } from '@/lib/constants';

// Mock results - replace with actual data from Supabase
function generateMockResults(loteriaId: string) {
  const results = [];
  for (let i = 1; i <= 10; i++) {
    const numero = Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0');
    const grupo = Math.floor(1 + Math.random() * 25).toString().padStart(2, '0');
    const dezena = parseInt(numero.slice(-2));
    const bicho = getBichoByDezena(dezena);
    results.push({
      posicao: i,
      numero,
      grupo: `G.${grupo}`,
      bicho: bicho?.nome || 'Desconhecido',
    });
  }
  return results;
}

export default function ResultadoVerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const data = params.data as string;
  const loteriasParam = searchParams.get('loterias') || '';
  const selectedLoterias = loteriasParam.split(',').filter(Boolean);

  // Format date
  const dateObj = new Date(data + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR');

  // Get lottery info
  const getLoteriaInfo = (loteriaId: string) => {
    for (const banca of BANCAS) {
      const sub = banca.subLoterias.find((s) => s.id === loteriaId);
      if (sub) {
        const hour = sub.horario.split(':')[0];
        return {
          nome: `LT ${sub.nome} ${hour}HS`,
          banca: banca.nome,
        };
      }
    }
    return { nome: loteriaId, banca: '' };
  };

  const handleShare = async () => {
    const text = `Resultados - ${formattedDate}\n\n` +
      selectedLoterias.map((id) => {
        const info = getLoteriaInfo(id);
        return info.nome;
      }).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Resultados - Banca Forte',
          text: text,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageLayout title="RESULTADO" showBack>
      <div className="bg-white min-h-screen">
        {/* Header Info */}
        <div className="px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-center text-gray-900 mb-4">BANCA FORTE</h1>

          <div className="flex justify-between text-sm mb-2">
            <div>
              <p className="text-gray-500 text-xs uppercase">Vendedor</p>
              <p className="font-medium text-gray-900">{formattedDate}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">979536</p>
              <p className="font-medium text-gray-900">{currentTime}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 text-xs uppercase">Resultados</span>
              <span className="font-medium text-gray-900">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Results per Loteria */}
        <div className="px-4 py-4 space-y-6">
          {selectedLoterias.map((loteriaId) => {
            const info = getLoteriaInfo(loteriaId);
            const results = generateMockResults(loteriaId);

            return (
              <div key={loteriaId} className="border-b border-gray-200 pb-4">
                {/* Loteria Header */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">{info.nome}</h2>
                  <button
                    onClick={handlePrint}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                </div>

                {/* Results List */}
                <div className="space-y-1">
                  {results.map((result) => (
                    <div
                      key={result.posicao}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 w-6">{result.posicao}:</span>
                        <span className="text-gray-700">
                          {result.numero} - {result.grupo}
                        </span>
                      </div>
                      <span className="text-gray-700">{result.bicho}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Share Button */}
        <div className="px-4 pb-8">
          <button
            onClick={handleShare}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="h-5 w-5" />
            Compartilhar
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
