'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, ChevronDown, RefreshCw, EyeOff, Loader2 } from 'lucide-react';
import { getModalidadesAtivas, type ModalidadeDB } from '@/lib/actions/modalidades';
import { type Colocacao } from '@/lib/constants/colocacoes';
import { usePlatformConfig } from '@/contexts/platform-config-context';

// Colocações ordenadas como no site
const COLOCACOES_CALCULADORA: Colocacao[] = [
  // Prêmios individuais primeiro
  { id: '1_premio', nome: '1 PRÊMIO', fator: 1 },
  { id: '1_5_premio', nome: '1/5 PRÊMIO', fator: 5 },
  { id: '1_10_premio', nome: '1/10 PRÊMIO', fator: 10 },
  { id: '2_premio', nome: '2 PRÊMIO', fator: 1 },
  { id: '3_premio', nome: '3 PRÊMIO', fator: 1 },
  { id: '4_premio', nome: '4 PRÊMIO', fator: 1 },
  { id: '5_premio', nome: '5 PRÊMIO', fator: 1 },
  { id: '6_premio', nome: '6 PRÊMIO', fator: 1 },
  { id: '7_premio', nome: '7 PRÊMIO', fator: 1 },
  { id: '8_premio', nome: '8 PRÊMIO', fator: 1 },
  { id: '9_premio', nome: '9 PRÊMIO', fator: 1 },
  { id: '10_premio', nome: '10 PRÊMIO', fator: 1 },
  // Combinações com 1º
  { id: '1_2_premio', nome: '1/2 PRÊMIO', fator: 2 },
  { id: '1_3_premio', nome: '1/3 PRÊMIO', fator: 3 },
  { id: '1_4_premio', nome: '1/4 PRÊMIO', fator: 4 },
  { id: '1_6_premio', nome: '1/6 PRÊMIO', fator: 6 },
  { id: '1_7_premio', nome: '1/7 PRÊMIO', fator: 7 },
  { id: '1_8_premio', nome: '1/8 PRÊMIO', fator: 8 },
  { id: '1_9_premio', nome: '1/9 PRÊMIO', fator: 9 },
  // Combinações com 2º
  { id: '2_3_premio', nome: '2/3 PRÊMIO', fator: 2 },
  { id: '2_4_premio', nome: '2/4 PRÊMIO', fator: 3 },
  { id: '2_5_premio', nome: '2/5 PRÊMIO', fator: 4 },
  { id: '2_6_premio', nome: '2/6 PRÊMIO', fator: 5 },
  { id: '2_7_premio', nome: '2/7 PRÊMIO', fator: 6 },
  { id: '2_8_premio', nome: '2/8 PRÊMIO', fator: 7 },
  { id: '2_9_premio', nome: '2/9 PRÊMIO', fator: 8 },
  { id: '2_10_premio', nome: '2/10 PRÊMIO', fator: 9 },
  // Combinações com 3º
  { id: '3_4_premio', nome: '3/4 PRÊMIO', fator: 2 },
  { id: '3_5_premio', nome: '3/5 PRÊMIO', fator: 3 },
  { id: '3_6_premio', nome: '3/6 PRÊMIO', fator: 4 },
  { id: '3_7_premio', nome: '3/7 PRÊMIO', fator: 5 },
  { id: '3_8_premio', nome: '3/8 PRÊMIO', fator: 6 },
  { id: '3_9_premio', nome: '3/9 PRÊMIO', fator: 7 },
  { id: '3_10_premio', nome: '3/10 PRÊMIO', fator: 8 },
  // Combinações com 4º
  { id: '4_5_premio', nome: '4/5 PRÊMIO', fator: 2 },
  { id: '4_6_premio', nome: '4/6 PRÊMIO', fator: 3 },
  { id: '4_7_premio', nome: '4/7 PRÊMIO', fator: 4 },
  { id: '4_8_premio', nome: '4/8 PRÊMIO', fator: 5 },
  { id: '4_9_premio', nome: '4/9 PRÊMIO', fator: 6 },
  { id: '4_10_premio', nome: '4/10 PRÊMIO', fator: 7 },
  // Combinações com 5º
  { id: '5_6_premio', nome: '5/6 PRÊMIO', fator: 2 },
  { id: '5_7_premio', nome: '5/7 PRÊMIO', fator: 3 },
  { id: '5_8_premio', nome: '5/8 PRÊMIO', fator: 4 },
  { id: '5_9_premio', nome: '5/9 PRÊMIO', fator: 5 },
  { id: '5_10_premio', nome: '5/10 PRÊMIO', fator: 6 },
  // Combinações com 6º
  { id: '6_7_premio', nome: '6/7 PRÊMIO', fator: 2 },
  { id: '6_8_premio', nome: '6/8 PRÊMIO', fator: 3 },
  { id: '6_9_premio', nome: '6/9 PRÊMIO', fator: 4 },
  { id: '6_10_premio', nome: '6/10 PRÊMIO', fator: 5 },
  // Combinações com 7º
  { id: '7_8_premio', nome: '7/8 PRÊMIO', fator: 2 },
  { id: '7_9_premio', nome: '7/9 PRÊMIO', fator: 3 },
  { id: '7_10_premio', nome: '7/10 PRÊMIO', fator: 4 },
  // Combinações com 8º
  { id: '8_9_premio', nome: '8/9 PRÊMIO', fator: 2 },
  { id: '8_10_premio', nome: '8/10 PRÊMIO', fator: 3 },
  // Combinação com 9º
  { id: '9_10_premio', nome: '9/10 PRÊMIO', fator: 2 },
];

// Ordem das categorias para exibição
const CATEGORIA_ORDEM: Record<string, number> = {
  'centena': 1,
  'milhar': 2,
  'unidade': 3,
  'dezena': 4,
  'duque_dezena': 5,
  'terno_dezena_seco': 6,
  'terno_dezena': 7,
  'grupo': 8,
  'duque_grupo': 9,
  'terno_grupo': 10,
  'quadra_grupo': 11,
  'quina_grupo': 12,
  'sena_grupo': 13,
  'passe': 14,
  'palpitao': 15,
};

export default function CalculadoraPage() {
  const router = useRouter();
  const config = usePlatformConfig();
  const [modalidades, setModalidades] = useState<ModalidadeDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModalidade, setSelectedModalidade] = useState<ModalidadeDB | null>(null);
  const [selectedColocacao, setSelectedColocacao] = useState<Colocacao | null>(null);
  const [valorAposta, setValorAposta] = useState('');
  const [showModalidadeDropdown, setShowModalidadeDropdown] = useState(false);
  const [showColocacaoDropdown, setShowColocacaoDropdown] = useState(false);
  const [resultado, setResultado] = useState<{ premio: number; cotacao: number } | null>(null);

  useEffect(() => {
    const fetchModalidades = async () => {
      try {
        const data = await getModalidadesAtivas();
        // Ordenar por categoria e nome
        const sorted = data.sort((a, b) => {
          const ordemA = CATEGORIA_ORDEM[a.categoria] || 99;
          const ordemB = CATEGORIA_ORDEM[b.categoria] || 99;
          if (ordemA !== ordemB) return ordemA - ordemB;
          return a.nome.localeCompare(b.nome);
        });
        setModalidades(sorted);
      } catch (error) {
        console.error('Erro ao carregar modalidades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModalidades();
  }, []);

  const handleCalcular = () => {
    if (!selectedModalidade || !selectedColocacao || !valorAposta) {
      return;
    }

    const valor = parseFloat(valorAposta.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      return;
    }

    const cotacao = selectedModalidade.multiplicador;
    const premio = (valor * cotacao) / selectedColocacao.fator;

    setResultado({ premio, cotacao });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9,]/g, '');
    setValorAposta(value);
    setResultado(null);
  };

  return (
    <div className="min-h-screen bg-gray-300 flex justify-center">
      <div className="w-full max-w-md bg-[#1A202C] min-h-screen shadow-xl flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
          <div className="flex h-12 items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <span className="text-sm font-bold text-white">{config.site_name.toUpperCase()}</span>
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
        <div className="bg-white flex-1 p-4">
        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Calculadora de Prêmios
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          Informe o valor da aposta e iremos calcular seu possível prêmio.
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4" />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Modalidade Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Modalidade:
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowModalidadeDropdown(!showModalidadeDropdown);
                    setShowColocacaoDropdown(false);
                  }}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg flex items-center justify-between bg-white text-left focus:outline-none focus:border-blue-500"
                >
                  <span className={selectedModalidade ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedModalidade?.nome || 'Selecione...'}
                  </span>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>

                {showModalidadeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#4A5568] rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                    {/* Empty option */}
                    <button
                      onClick={() => {
                        setSelectedModalidade(null);
                        setShowModalidadeDropdown(false);
                        setResultado(null);
                      }}
                      className={`w-full px-4 py-3 text-left text-white hover:bg-[#5A6578] flex items-center gap-2 ${
                        !selectedModalidade ? 'bg-blue-600' : ''
                      }`}
                    >
                      {!selectedModalidade && <span className="text-white">✓</span>}
                    </button>
                    {modalidades.map((modalidade) => (
                      <button
                        key={modalidade.id}
                        onClick={() => {
                          setSelectedModalidade(modalidade);
                          setShowModalidadeDropdown(false);
                          setResultado(null);
                        }}
                        className={`w-full px-4 py-3 text-left text-white hover:bg-[#5A6578] ${
                          selectedModalidade?.id === modalidade.id ? 'bg-blue-600' : ''
                        }`}
                      >
                        {modalidade.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colocação Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Colocação:
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowColocacaoDropdown(!showColocacaoDropdown);
                    setShowModalidadeDropdown(false);
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
                    {/* Empty option */}
                    <button
                      onClick={() => {
                        setSelectedColocacao(null);
                        setShowColocacaoDropdown(false);
                        setResultado(null);
                      }}
                      className={`w-full px-4 py-3 text-left text-white hover:bg-[#5A6578] flex items-center gap-2 ${
                        !selectedColocacao ? 'bg-blue-600' : ''
                      }`}
                    >
                      {!selectedColocacao && <span className="text-white">✓</span>}
                    </button>
                    {COLOCACOES_CALCULADORA.map((colocacao) => (
                      <button
                        key={colocacao.id}
                        onClick={() => {
                          setSelectedColocacao(colocacao);
                          setShowColocacaoDropdown(false);
                          setResultado(null);
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

            {/* Valor da Aposta */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Valor da aposta:
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-gray-500">R$</span>
                <input
                  type="text"
                  value={valorAposta}
                  onChange={handleValorChange}
                  placeholder="Aposta..."
                  className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Resultado */}
            {resultado && (
              <div className="mb-6 border border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-gray-500 font-medium">PRÊMIO</div>
                    <div className="text-2xl font-bold text-gray-900">
                      R$ {formatCurrency(resultado.premio)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 font-medium">COTAÇÃO</div>
                    <div className="text-2xl font-bold text-gray-900">
                      R$ {formatCurrency(resultado.cotacao)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calcular Button */}
            <button
              onClick={handleCalcular}
              disabled={!selectedModalidade || !selectedColocacao || !valorAposta}
              className="w-full h-12 bg-[#1A202C] rounded-lg font-semibold text-white disabled:opacity-50"
            >
              Calcular :)
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
