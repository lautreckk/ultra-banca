'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PageLayout } from '@/components/layout';

interface AccordionItemProps {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionItem({ id, title, expanded, onToggle, children }: AccordionItemProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50"
        aria-expanded={expanded}
        aria-controls={`content-${id}`}
      >
        <span className="font-medium text-gray-800 text-sm">{title}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {expanded && (
        <div id={`content-${id}`} className="px-4 pb-4 text-gray-600 text-sm">
          {children}
        </div>
      )}
    </div>
  );
}

// Dados das modalidades de jogo
const modalidades = [
  {
    id: 'centena',
    title: 'CENTENA',
    content: 'Aposte nos 3 ultimos numeros do resultado. Exemplo: se o resultado for 2584, a centena e 584. Cotacao: 600x.',
  },
  {
    id: 'centena-inv',
    title: 'CENTENA INVERTIDA',
    content: 'Sua aposta vale para todas as combinacoes possiveis dos 3 numeros. Exemplo: 123 vale 123, 132, 213, 231, 312, 321. Cotacao reduzida conforme combinacoes.',
  },
  {
    id: 'centena-3x',
    title: 'CENTENA 3X',
    content: 'Aposte em 3 centenas ao mesmo tempo. Cada numero digitado gera uma aposta. Ideal para cobrir mais opcoes.',
  },
  {
    id: 'centena-esquerda',
    title: 'CENTENA ESQUERDA',
    content: 'Aposte nos 3 primeiros numeros do resultado (da esquerda). Exemplo: se o resultado for 2584, a centena esquerda e 258.',
  },
  {
    id: 'centena-inv-esq',
    title: 'CENTENA INV. ESQ.',
    content: 'Combinacao da centena esquerda com inversao. Vale para todas as combinacoes dos 3 primeiros numeros.',
  },
  {
    id: 'milhar',
    title: 'MILHAR',
    content: 'Aposte nos 4 numeros do resultado. Exemplo: 2584. E a aposta com maior cotacao: 4000x.',
  },
  {
    id: 'milhar-inv',
    title: 'MILHAR INVERTIDA',
    content: 'Sua aposta vale para todas as combinacoes possiveis dos 4 numeros. Cotacao reduzida conforme quantidade de combinacoes.',
  },
  {
    id: 'milhar-ct',
    title: 'MILHAR E CENTENA',
    content: 'Aposta combinada: voce joga a milhar e automaticamente a centena correspondente. Duas chances de ganhar.',
  },
  {
    id: 'unidade',
    title: 'UNIDADE',
    content: 'Aposte no ultimo numero do resultado (0-9). Exemplo: se o resultado for 2584, a unidade e 4. Cotacao: 7x.',
  },
  {
    id: 'dezena',
    title: 'DEZENA',
    content: 'Aposte nos 2 ultimos numeros do resultado. Exemplo: se o resultado for 2584, a dezena e 84. Cotacao: 60x.',
  },
  {
    id: 'dezena-esq',
    title: 'DEZENA ESQUERDA',
    content: 'Aposte nos 2 primeiros numeros do resultado. Exemplo: se o resultado for 2584, a dezena esquerda e 25.',
  },
  {
    id: 'dezena-meio',
    title: 'DEZENA DO MEIO',
    content: 'Aposte nos 2 numeros do meio do resultado. Exemplo: se o resultado for 2584, a dezena do meio e 58.',
  },
  {
    id: 'duque-dezena',
    title: 'DUQUE DE DEZENA',
    content: 'Escolha 2 dezenas diferentes. Ambas precisam sair em qualquer ordem para ganhar. Cotacao variavel.',
  },
  {
    id: 'terno-dezena',
    title: 'TERNO DE DEZENA SECO',
    content: 'Escolha 3 dezenas diferentes. Todas precisam sair em qualquer ordem para ganhar.',
  },
  {
    id: 'grupo',
    title: 'GRUPO',
    content: 'Aposte em um dos 25 grupos de bichos (01-25). Cada grupo contem 4 dezenas. Cotacao: 18x.',
  },
  {
    id: 'duque-grupo',
    title: 'DUQUE DE GRUPO',
    content: 'Escolha 2 grupos diferentes. Ambos precisam sair em qualquer ordem para ganhar. Cotacao: 18.5x.',
  },
  {
    id: 'terno-grupo',
    title: 'TERNO DE GRUPO',
    content: 'Escolha 3 grupos diferentes. Todos precisam sair em qualquer ordem para ganhar. Cotacao: 130x.',
  },
  {
    id: 'quadra-grupo',
    title: 'QUADRA DE GRUPO',
    content: 'Escolha 4 grupos diferentes. Todos precisam sair em qualquer ordem para ganhar. Cotacao: 650x.',
  },
  {
    id: 'quina-grupo',
    title: 'QUINA DE GRUPO',
    content: 'Escolha 5 grupos diferentes. Todos precisam sair entre os 5 primeiros premios. Cotacao: 3200x.',
  },
  {
    id: 'sena-grupo',
    title: 'SENA DE GRUPO',
    content: 'Escolha 6 grupos diferentes. Todos precisam sair entre os 6 primeiros premios. Cotacao altissima!',
  },
  {
    id: 'palpitao',
    title: 'PALPITAO',
    content: 'Modalidade especial com sorteio proprio. Escolha 5 dezenas de 01 a 80. Cotacao: ate 100.000x.',
  },
  {
    id: 'seninha',
    title: 'SENINHA',
    content: 'Escolha 6 numeros de 01 a 60. Sorteio proprio com premiacoes progressivas.',
  },
  {
    id: 'quininha',
    title: 'QUININHA',
    content: 'Escolha 5 numeros de 01 a 50. Sorteio proprio com premiacoes progressivas.',
  },
  {
    id: 'lotinha',
    title: 'LOTINHA',
    content: 'Escolha numeros para o sorteio da Lotinha. Premiacoes variaveis conforme acertos.',
  },
  {
    id: 'passe-vai',
    title: 'PASSE VAI',
    content: 'Aposte em 2 grupos consecutivos. Se o primeiro grupo sair, a aposta passa para o proximo sorteio automaticamente.',
  },
  {
    id: 'passe-vai-vem',
    title: 'PASSE VAI E VEM',
    content: 'Semelhante ao Passe Vai, mas a aposta retorna se o segundo grupo sair.',
  },
];

// Dados das tabelas de inversao
const tabelasInversao = [
  {
    id: 'duque-grupo-dezena',
    title: 'Duque de Grupo/Dezena',
    description: 'Combinacoes possiveis para duque:',
    data: [
      { combinacao: '2 numeros iguais', quantidade: '1 combinacao' },
      { combinacao: '2 numeros diferentes', quantidade: '2 combinacoes' },
    ],
  },
  {
    id: 'terno-grupo-dezena',
    title: 'Terno de Grupo/Dezena',
    description: 'Combinacoes possiveis para terno:',
    data: [
      { combinacao: '3 numeros iguais', quantidade: '1 combinacao' },
      { combinacao: '2 iguais + 1 diferente', quantidade: '3 combinacoes' },
      { combinacao: '3 numeros diferentes', quantidade: '6 combinacoes' },
    ],
  },
  {
    id: 'quadra-grupos',
    title: 'Quadra de Grupos',
    description: 'Combinacoes possiveis para quadra:',
    data: [
      { combinacao: '4 numeros iguais', quantidade: '1 combinacao' },
      { combinacao: '3 iguais + 1 diferente', quantidade: '4 combinacoes' },
      { combinacao: '2 pares iguais', quantidade: '6 combinacoes' },
      { combinacao: '2 iguais + 2 diferentes', quantidade: '12 combinacoes' },
      { combinacao: '4 numeros diferentes', quantidade: '24 combinacoes' },
    ],
  },
  {
    id: 'quina-grupo',
    title: 'Quina de Grupo',
    description: 'Total de 120 combinacoes para 5 numeros diferentes.',
    data: [],
  },
  {
    id: 'centena-invertida',
    title: 'Centena Invertida',
    description: 'Exemplos de combinacoes:',
    examples: [
      { numero: '123', combinacoes: '123, 132, 213, 231, 312, 321', total: '6 jogos' },
      { numero: '112', combinacoes: '112, 121, 211', total: '3 jogos' },
      { numero: '111', combinacoes: '111', total: '1 jogo' },
    ],
  },
  {
    id: 'milhar-invertida',
    title: 'Milhar Invertida',
    description: 'Exemplos de combinacoes:',
    examples: [
      { numero: '1234', combinacoes: 'Todas as combinacoes de 4 algarismos diferentes', total: '24 jogos' },
      { numero: '1123', combinacoes: 'Combinacoes com 1 algarismo repetido', total: '12 jogos' },
      { numero: '1122', combinacoes: 'Combinacoes com 2 pares', total: '6 jogos' },
      { numero: '1112', combinacoes: 'Combinacoes com 3 algarismos iguais', total: '4 jogos' },
      { numero: '1111', combinacoes: 'Numero unico', total: '1 jogo' },
    ],
  },
];

export default function ComoJogarPage() {
  const [activeTab, setActiveTab] = useState<'como-jogar' | 'tabela'>('como-jogar');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <PageLayout title="COMO JOGAR">
      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('como-jogar')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'como-jogar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Como Jogar
          </button>
          <button
            onClick={() => setActiveTab('tabela')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tabela'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tabela de Inversao
          </button>
        </div>

        {/* Content */}
        {activeTab === 'como-jogar' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#E5A220] text-white font-bold text-center py-3">
              Modalidades de Jogo
            </div>
            <div className="divide-y divide-gray-100">
              {modalidades.map((modalidade) => (
                <AccordionItem
                  key={modalidade.id}
                  id={modalidade.id}
                  title={modalidade.title}
                  expanded={expandedItems.includes(modalidade.id)}
                  onToggle={() => toggleItem(modalidade.id)}
                >
                  {modalidade.content}
                </AccordionItem>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tabelasInversao.map((tabela) => (
              <div
                key={tabela.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(tabela.id)}
                  className="w-full flex items-center justify-between py-3 px-4 bg-[#1A202C] text-white"
                >
                  <span className="font-medium text-sm">{tabela.title}</span>
                  {expandedItems.includes(tabela.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {expandedItems.includes(tabela.id) && (
                  <div className="p-4">
                    <p className="text-gray-600 text-sm mb-3">{tabela.description}</p>

                    {tabela.data && tabela.data.length > 0 && (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 bg-gray-100 font-medium text-sm">
                          <div className="px-3 py-2 border-r border-gray-200">Combinacao</div>
                          <div className="px-3 py-2">Quantidade</div>
                        </div>
                        {tabela.data.map((row, index) => (
                          <div
                            key={index}
                            className={`grid grid-cols-2 text-sm ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            <div className="px-3 py-2 border-r border-gray-200 text-gray-700">
                              {row.combinacao}
                            </div>
                            <div className="px-3 py-2 text-gray-700">{row.quantidade}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {tabela.examples && tabela.examples.length > 0 && (
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <div className="grid grid-cols-3 bg-gray-100 font-medium text-sm">
                          <div className="px-3 py-2 border-r border-gray-200">Numero</div>
                          <div className="px-3 py-2 border-r border-gray-200">Combinacoes</div>
                          <div className="px-3 py-2">Total</div>
                        </div>
                        {tabela.examples.map((row, index) => (
                          <div
                            key={index}
                            className={`grid grid-cols-3 text-sm ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            <div className="px-3 py-2 border-r border-gray-200 font-mono text-gray-800">
                              {row.numero}
                            </div>
                            <div className="px-3 py-2 border-r border-gray-200 text-gray-600 text-xs">
                              {row.combinacoes}
                            </div>
                            <div className="px-3 py-2 text-gray-700">{row.total}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
