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
      <div className="bg-[#111318] min-h-screen pb-8">
        <div className="p-4">
          {/* Dropdown Loterias */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowLoteriasDropdown(!showLoteriasDropdown)}
              className="w-full flex items-center justify-between px-4 h-14 min-h-[56px] bg-[#1A1F2B] border border-zinc-700/40 rounded-xl shadow-sm active:scale-[0.98] transition-all"
            >
              <span className="font-bold text-white">{getLoteriasLabel()}</span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-zinc-500 transition-transform',
                  showLoteriasDropdown && 'rotate-180'
                )}
              />
            </button>

            {showLoteriasDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1F2B] border border-zinc-700/40 rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedLoterias([]);
                    setShowLoteriasDropdown(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-white active:bg-zinc-700/50 active:scale-[0.98] transition-all"
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
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-white active:bg-zinc-700/50 active:scale-[0.98] transition-all"
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
                  'px-6 py-2 rounded-xl font-bold text-sm active:scale-[0.98] transition-all',
                  selectedModalidade === mod.id
                    ? 'bg-[#1A1F2B] border-2 border-zinc-700/40 text-white shadow-sm'
                    : 'bg-transparent text-zinc-400 hover:bg-[#1A1F2B]/50'
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
                  'px-4 py-2 rounded-xl font-medium text-sm active:scale-[0.98] transition-all',
                  selectedValor === valor
                    ? 'bg-[#1A1F2B] border-2 border-zinc-700/40 text-white shadow-sm'
                    : 'bg-[#1A1F2B]/70 border border-zinc-700/40 text-zinc-400 hover:bg-[#1A1F2B]'
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
                className="w-full bg-[#1A1F2B] rounded-xl border-l-4 border-l-[#C7E5C4] border border-zinc-700/40 p-4 text-left shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-lg',
                      selectedModalidade === 'dezena' && 'bg-blue-900/30 text-blue-300',
                      selectedModalidade === 'grupo' && 'bg-green-900/30 text-green-300',
                      selectedModalidade === 'centena' && 'bg-yellow-900/30 text-yellow-300'
                    )}
                  >
                    {modalidade?.nome}
                  </span>
                </div>
                <p className="text-lg font-bold text-white">
                  R$ {selectedValor.toFixed(2).replace('.', ',')} pra R${' '}
                  {formatPremio(selectedValor, modalidade?.multiplicador || 1)}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  <span className="bg-zinc-800/50 px-2 py-0.5 rounded-lg text-xs font-medium">
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
