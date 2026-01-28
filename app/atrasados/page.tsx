'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, ChevronDown, RefreshCw, EyeOff, Share2 } from 'lucide-react';
import { BANCAS } from '@/lib/constants/bancas';
import { BICHOS } from '@/lib/constants/bichos';

interface LoteriaOption {
  id: string;
  nome: string;
  displayName: string;
}

interface AtrasadoItem {
  grupo: number;
  nome: string;
  emoji: string;
  diasAtras: number;
}

// Generate all lottery options with their times
const LOTERIAS_OPTIONS: LoteriaOption[] = BANCAS.flatMap((banca) =>
  banca.subLoterias.map((sub) => ({
    id: sub.id,
    nome: sub.nome,
    displayName: `LT ${sub.nome} ${sub.horario.replace(':', 'H').replace(':00', 'HS').replace(':20', 'HS')}`,
  }))
).sort((a, b) => a.displayName.localeCompare(b.displayName));

// Colocação options for atrasados
const COLOCACOES_ATRASADOS = [
  { id: '1_premio', nome: '1º PRÊMIO' },
  { id: '2_premio', nome: '2º PRÊMIO' },
  { id: '3_premio', nome: '3º PRÊMIO' },
  { id: '4_premio', nome: '4º PRÊMIO' },
  { id: '5_premio', nome: '5º PRÊMIO' },
];

// Generate mock atrasados data based on lottery and colocação
function generateAtrasados(loteriaId: string, colocacaoId: string): AtrasadoItem[] {
  // Use lottery and colocação to seed the random-ish data
  const seed = loteriaId.length + colocacaoId.length;

  const atrasados: AtrasadoItem[] = BICHOS.map((bicho, index) => {
    // Generate pseudo-random days based on index and seed
    const baseDays = ((index * 7 + seed) % 80) + 1;
    return {
      grupo: bicho.numero,
      nome: bicho.nome,
      emoji: bicho.emoji || '🐾',
      diasAtras: baseDays,
    };
  });

  // Sort by days (most delayed first)
  return atrasados.sort((a, b) => b.diasAtras - a.diasAtras);
}

export default function AtrasadosPage() {
  const router = useRouter();
  const [selectedLoteria, setSelectedLoteria] = useState<LoteriaOption | null>(null);
  const [selectedColocacao, setSelectedColocacao] = useState<{ id: string; nome: string } | null>(null);
  const [showLoteriaDropdown, setShowLoteriaDropdown] = useState(false);
  const [showColocacaoDropdown, setShowColocacaoDropdown] = useState(false);
  const [atrasados, setAtrasados] = useState<AtrasadoItem[] | null>(null);

  const handleBuscar = () => {
    if (!selectedLoteria || !selectedColocacao) {
      return;
    }
    const result = generateAtrasados(selectedLoteria.id, selectedColocacao.id);
    setAtrasados(result);
  };

  const handleShare = () => {
    if (!selectedLoteria || !selectedColocacao || !atrasados) return;

    const text = `Atrasados - ${selectedLoteria.displayName} - ${selectedColocacao.nome}\n\n` +
      atrasados.slice(0, 10).map((a) =>
        `${a.grupo.toString().padStart(2, '0')} - ${a.nome}: ${a.diasAtras === 1 ? 'ontem' : `${a.diasAtras} dias atrás`}`
      ).join('\n');

    if (navigator.share) {
      navigator.share({
        title: 'Atrasados - Banca Forte',
        text,
      });
    }
  };

  const formatDiasAtras = (dias: number): string => {
    if (dias === 1) return 'ontem!';
    return `${dias} dias atrás.`;
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
      <div className="bg-white min-h-screen p-4">
        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Lista de atrasados
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          Escolha uma das Loterias para visualizar os mais atrasados dela.
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4" />

        {/* Loteria Select */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Loteria:
          </label>
          <div className="relative">
            <button
              onClick={() => {
                setShowLoteriaDropdown(!showLoteriaDropdown);
                setShowColocacaoDropdown(false);
              }}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg flex items-center justify-between bg-white text-left focus:outline-none focus:border-blue-500"
            >
              <span className={selectedLoteria ? 'text-gray-900' : 'text-gray-400'}>
                {selectedLoteria?.displayName || 'Selecione...'}
              </span>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </button>

            {showLoteriaDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#4A5568] rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                {LOTERIAS_OPTIONS.map((loteria) => (
                  <button
                    key={loteria.id}
                    onClick={() => {
                      setSelectedLoteria(loteria);
                      setShowLoteriaDropdown(false);
                      setAtrasados(null);
                    }}
                    className={`w-full px-4 py-3 text-left text-white hover:bg-[#5A6578] ${
                      selectedLoteria?.id === loteria.id ? 'bg-blue-600' : ''
                    }`}
                  >
                    {loteria.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colocação Select */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Colocação:
          </label>
          <div className="relative">
            <button
              onClick={() => {
                setShowColocacaoDropdown(!showColocacaoDropdown);
                setShowLoteriaDropdown(false);
              }}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg flex items-center justify-between bg-white text-left focus:outline-none focus:border-blue-500"
            >
              <span className={selectedColocacao ? 'text-gray-900' : 'text-gray-400'}>
                {selectedColocacao?.nome || 'Selecione...'}
              </span>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </button>

            {showColocacaoDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#4A5568] rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                {COLOCACOES_ATRASADOS.map((colocacao) => (
                  <button
                    key={colocacao.id}
                    onClick={() => {
                      setSelectedColocacao(colocacao);
                      setShowColocacaoDropdown(false);
                      setAtrasados(null);
                    }}
                    className={`w-full px-4 py-3 text-left text-white hover:bg-[#5A6578] ${
                      selectedColocacao?.id === colocacao.id ? 'bg-blue-600' : ''
                    }`}
                  >
                    {colocacao.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buscar Button */}
        <button
          onClick={handleBuscar}
          disabled={!selectedLoteria || !selectedColocacao}
          className="w-full h-12 bg-[#1A202C] rounded-lg font-semibold text-white disabled:opacity-50 mb-6"
        >
          Buscar :)
        </button>

        {/* Results */}
        {atrasados && selectedLoteria && selectedColocacao && (
          <>
            {/* Divider */}
            <div className="border-t border-gray-200 mb-6" />

            {/* Banca Logo */}
            <div className="text-center mb-4">
              <span className="text-sm font-bold text-gray-700">BANCA FORTE</span>
              <div className="flex justify-center mt-2">
                <div className="w-24 h-20 bg-[#1A202C] rounded-lg flex items-center justify-center">
                  <span className="text-[#E5A220] font-bold text-sm text-center">BANCA<br/>FORTE</span>
                </div>
              </div>
            </div>

            {/* Results Header */}
            <h2 className="text-xl font-bold text-gray-900 mb-1">Atrasados</h2>
            <p className="text-gray-600 text-sm mb-6">
              {selectedLoteria.displayName} - {selectedColocacao.nome}
            </p>

            {/* Animals List */}
            <div className="space-y-4 mb-6">
              {atrasados.map((item) => (
                <div key={item.grupo} className="flex items-center gap-3">
                  {/* Group Number Badge */}
                  <div className="w-12 h-12 bg-[#38A169] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {item.grupo.toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Animal Emoji */}
                  <div className="text-4xl flex-shrink-0">
                    {item.emoji}
                  </div>

                  {/* Animal Info */}
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{item.nome}</div>
                    <div className="text-sm text-gray-600">
                      {item.diasAtras === 1 ? (
                        <>Saiu <span className="font-bold">ontem!</span></>
                      ) : (
                        <>Saiu há <span className="font-bold">{item.diasAtras}</span> dias atrás.</>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full h-12 bg-[#3B82F6] rounded-lg font-semibold text-white flex items-center justify-center gap-2"
            >
              <Share2 className="h-5 w-5" />
              Compartilhar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
