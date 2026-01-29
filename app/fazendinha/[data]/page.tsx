'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FAZENDINHA_LOTERIAS,
  FAZENDINHA_MODALIDADES,
  getValoresByModalidade,
  formatPremio,
} from '@/lib/constants';

interface FazendinhaSelectPageProps {
  params: Promise<{ data: string }>;
}

export default function FazendinhaSelectPage({ params }: FazendinhaSelectPageProps) {
  const { data } = use(params);
  const router = useRouter();

  const [selectedModalidade, setSelectedModalidade] = useState('dezena');
  const [selectedValor, setSelectedValor] = useState(1);
  const [selectedLoterias, setSelectedLoterias] = useState<string[]>([]);
  const [showLoteriasDropdown, setShowLoteriasDropdown] = useState(false);

  const modalidade = FAZENDINHA_MODALIDADES.find((m) => m.id === selectedModalidade);
  const valores = getValoresByModalidade(selectedModalidade);

  const toggleLoteria = (loteriaId: string) => {
    setSelectedLoterias((prev) =>
      prev.includes(loteriaId)
        ? prev.filter((id) => id !== loteriaId)
        : [...prev, loteriaId]
    );
  };

  const handleLoteriaCardClick = (loteriaId: string) => {
    // Se já está selecionada, vai para selecionar números
    // Se não está, seleciona e vai para números
    if (!selectedLoterias.includes(loteriaId)) {
      setSelectedLoterias([loteriaId]);
    }

    // Navegar para a página de seleção de números
    router.push(
      `/fazendinha/${data}/numeros?modalidade=${selectedModalidade}&valor=${selectedValor}&loterias=${loteriaId}`
    );
  };

  const getLoteriasLabel = () => {
    if (selectedLoterias.length === 0 || selectedLoterias.length === FAZENDINHA_LOTERIAS.length) {
      return 'TODAS LOTERIAS';
    }
    if (selectedLoterias.length === 1) {
      const loteria = FAZENDINHA_LOTERIAS.find((l) => l.id === selectedLoterias[0]);
      return loteria?.nome || 'TODAS LOTERIAS';
    }
    return `${selectedLoterias.length} LOTERIAS`;
  };

  const filteredLoterias =
    selectedLoterias.length === 0
      ? FAZENDINHA_LOTERIAS
      : FAZENDINHA_LOTERIAS.filter((l) => selectedLoterias.includes(l.id));

  return (
    <PageLayout title="FAZENDINHA">
      <div className="bg-[#FFFBEB] min-h-screen pb-8">
        <div className="p-4">
          {/* Dropdown Loterias */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowLoteriasDropdown(!showLoteriasDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <span className="font-bold text-gray-900">{getLoteriasLabel()}</span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-400 transition-transform',
                  showLoteriasDropdown && 'rotate-180'
                )}
              />
            </button>

            {showLoteriasDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedLoterias([]);
                    setShowLoteriasDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-zinc-700"
                >
                  {selectedLoterias.length === 0 && <Check className="h-4 w-4" />}
                  <span className={selectedLoterias.length === 0 ? '' : 'ml-7'}>
                    TODAS LOTERIAS
                  </span>
                </button>
                {FAZENDINHA_LOTERIAS.map((loteria) => (
                  <button
                    key={loteria.id}
                    onClick={() => {
                      setSelectedLoterias([loteria.id]);
                      setShowLoteriasDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-zinc-700"
                  >
                    {selectedLoterias.includes(loteria.id) && selectedLoterias.length === 1 && (
                      <Check className="h-4 w-4" />
                    )}
                    <span
                      className={
                        selectedLoterias.includes(loteria.id) && selectedLoterias.length === 1
                          ? ''
                          : 'ml-7'
                      }
                    >
                      {loteria.nome}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Modalidade Tabs */}
          <div className="flex justify-center gap-2 mb-4">
            {FAZENDINHA_MODALIDADES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => {
                  setSelectedModalidade(mod.id);
                  // Reset valor to first available value
                  const newValores = getValoresByModalidade(mod.id);
                  if (!newValores.includes(selectedValor)) {
                    setSelectedValor(newValores[0]);
                  }
                }}
                className={cn(
                  'px-6 py-2 rounded-lg font-bold text-sm transition-all',
                  selectedModalidade === mod.id
                    ? 'bg-white border-2 border-gray-300 text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-600 hover:bg-white/50'
                )}
              >
                {mod.nome}
              </button>
            ))}
          </div>

          {/* Valores Grid */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {valores.map((valor) => (
              <button
                key={valor}
                onClick={() => setSelectedValor(valor)}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  selectedValor === valor
                    ? 'bg-white border-2 border-gray-400 text-gray-900 shadow-sm'
                    : 'bg-white/70 border border-gray-200 text-gray-600 hover:bg-white'
                )}
              >
                R$ {valor.toFixed(2).replace('.', ',')}
              </button>
            ))}
          </div>

          {/* Loterias Cards */}
          <div className="space-y-3">
            {filteredLoterias.map((loteria) => (
              <button
                key={loteria.id}
                onClick={() => handleLoteriaCardClick(loteria.id)}
                className="w-full bg-white rounded-lg border-l-4 border-l-[#C7E5C4] border border-gray-200 p-4 text-left shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded',
                      selectedModalidade === 'dezena' && 'bg-blue-100 text-blue-700',
                      selectedModalidade === 'grupo' && 'bg-green-100 text-green-700',
                      selectedModalidade === 'centena' && 'bg-yellow-100 text-yellow-700'
                    )}
                  >
                    {modalidade?.nome}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  R$ {selectedValor.toFixed(2).replace('.', ',')} pra R${' '}
                  {formatPremio(selectedValor, modalidade?.multiplicador || 1)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                    {loteria.nome} - {loteria.horario}
                  </span>
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
