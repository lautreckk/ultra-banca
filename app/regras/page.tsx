'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PageLayout } from '@/components/layout';

// Componente da tabela de 10 premios
function TabelaPremios() {
  const premios = [
    { posicao: '1', numero: '2584', grupo: 'Cobra' },
    { posicao: '2', numero: '7329', grupo: 'Touro' },
    { posicao: '3', numero: '4156', grupo: 'Macaco' },
    { posicao: '4', numero: '9872', grupo: 'Galo' },
    { posicao: '5', numero: '3641', grupo: 'Borboleta' },
    { posicao: '6', numero: '8205', grupo: 'Cachorro' },
    { posicao: '7', numero: '1947', grupo: 'Leao' },
    { posicao: '8', numero: '6583', grupo: 'Gato' },
    { posicao: '9', numero: '2716', grupo: 'Cavalo' },
    { posicao: '10', numero: '5394', grupo: 'Veado' },
  ];

  return (
    <div className="rounded-xl overflow-hidden border border-[#E5A220]">
      <div className="bg-[#E5A220] text-zinc-900 font-bold text-center py-2">
        Exemplo de Resultado - 10 Premios
      </div>
      <div className="divide-y divide-[#E5A220]/30">
        {premios.map((premio, index) => (
          <div
            key={premio.posicao}
            className={`flex items-center py-2 px-3 ${
              index % 2 === 0 ? 'bg-[#1A1F2B]' : 'bg-zinc-800/30'
            }`}
          >
            <span className="w-10 font-bold text-[#E5A220]">{premio.posicao}o</span>
            <span className="w-16 font-mono font-bold text-white">{premio.numero}</span>
            <span className="flex-1 text-zinc-300">{premio.grupo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AccordionSectionProps {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ id, title, expanded, onToggle, children }: AccordionSectionProps) {
  return (
    <div className="bg-[#1A1F2B] rounded-xl shadow-sm overflow-hidden border border-zinc-700/40">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left active:scale-[0.98] transition-all"
        aria-expanded={expanded}
        aria-controls={`section-${id}`}
      >
        <span className="font-bold text-white">{title}</span>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-zinc-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-zinc-500" />
        )}
      </button>
      {expanded && (
        <div id={`section-${id}`} className="px-4 pb-4 border-t border-zinc-700/40">
          {children}
        </div>
      )}
    </div>
  );
}

export default function RegrasPage() {
  const [expanded, setExpanded] = useState<string[]>(['saques']);

  const toggleSection = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <PageLayout title="DUVIDAS & REGRAS">
      <div className="p-4 space-y-4">
        <AccordionSection
          id="saques"
          title="Saques"
          expanded={expanded.includes('saques')}
          onToggle={() => toggleSection('saques')}
        >
          <div className="space-y-4 pt-3">
            <p className="text-zinc-300 text-sm">
              Confira as regras para solicitar saques na plataforma:
            </p>

            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-400 text-sm">Quantidade diaria</span>
                <span className="font-medium text-white">100x</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-400 text-sm">Valor minimo</span>
                <span className="font-medium text-white">R$ 1,00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-400 text-sm">Valor maximo</span>
                <span className="font-medium text-white">R$ 5.000,00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-400 text-sm">Limite diario</span>
                <span className="font-medium text-white">R$ 100.000,00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-400 text-sm">Taxa</span>
                <span className="font-medium text-white">1%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-400 text-sm">Tempo de processamento</span>
                <span className="font-medium text-white">2 minutos</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400 text-sm">Horario</span>
                <span className="font-medium text-white">24 horas</span>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 mt-4">
              <p className="text-yellow-400 text-xs">
                <strong>Importante:</strong> O saque sera creditado na chave PIX cadastrada em sua conta.
                Certifique-se de que a chave esta correta antes de solicitar.
              </p>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          id="apostas-10-premios"
          title="Apostas de 10 Premios"
          expanded={expanded.includes('apostas-10-premios')}
          onToggle={() => toggleSection('apostas-10-premios')}
        >
          <div className="space-y-4 pt-3">
            <p className="text-zinc-300 text-sm">
              O sistema de 10 premios permite que voce aposte em ate 10 sorteios consecutivos.
              Cada premio corresponde a uma extracao do resultado.
            </p>

            <h3 className="font-bold text-white text-sm">Como funciona:</h3>
            <ul className="space-y-2 text-zinc-300 text-sm list-disc list-inside">
              <li>Cada loteria sorteia 10 numeros (1o ao 10o premio)</li>
              <li>Voce pode apostar em um ou mais premios</li>
              <li>Se apostar no 1o ao 5o, sua aposta vale para os 5 primeiros premios</li>
              <li>Se apostar no 1o ao 10o, vale para todos os premios</li>
            </ul>

            <h3 className="font-bold text-white text-sm mt-4">Calculo do premio:</h3>
            <p className="text-zinc-300 text-sm">
              O valor do premio e calculado com base na cotacao da modalidade dividido pela
              quantidade de premios apostados. Por exemplo:
            </p>
            <ul className="space-y-2 text-zinc-300 text-sm list-disc list-inside mt-2">
              <li>Milhar no 1o premio: cotacao cheia (ex: 4000x)</li>
              <li>Milhar 1o ao 5o: cotacao dividida por 5 (ex: 800x cada)</li>
              <li>Milhar 1o ao 10o: cotacao dividida por 10 (ex: 400x cada)</li>
            </ul>

            <div className="mt-4">
              <TabelaPremios />
            </div>

            <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-3 mt-4">
              <p className="text-blue-400 text-xs">
                <strong>Dica:</strong> Apostar em mais premios aumenta suas chances de ganhar,
                mas reduz o valor do premio proporcional.
              </p>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          id="depositos"
          title="Depositos PIX"
          expanded={expanded.includes('depositos')}
          onToggle={() => toggleSection('depositos')}
        >
          <div className="space-y-4 pt-3">
            <p className="text-zinc-300 text-sm">
              Os depositos via PIX sao creditados instantaneamente em sua conta.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-400 text-sm">Valor minimo</span>
                <span className="font-medium text-white">R$ 1,00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-400 text-sm">Valor maximo</span>
                <span className="font-medium text-white">R$ 50.000,00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-400 text-sm">Taxa</span>
                <span className="font-medium text-white">Gratis</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-400 text-sm">Tempo de credito</span>
                <span className="font-medium text-white">Instantaneo</span>
              </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          id="apostas-gerais"
          title="Regras Gerais de Apostas"
          expanded={expanded.includes('apostas-gerais')}
          onToggle={() => toggleSection('apostas-gerais')}
        >
          <div className="space-y-4 pt-3">
            <p className="text-zinc-300 text-sm">
              Regras gerais que se aplicam a todas as modalidades de apostas:
            </p>

            <ul className="space-y-2 text-zinc-300 text-sm list-disc list-inside">
              <li>Apostas sao aceitas ate 5 minutos antes do sorteio</li>
              <li>Nao e possivel cancelar apostas confirmadas</li>
              <li>Premios sao creditados automaticamente</li>
              <li>O valor minimo de aposta varia por modalidade</li>
              <li>Apostas duplicadas sao bloqueadas automaticamente</li>
            </ul>

            <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-3 mt-4">
              <p className="text-zinc-400 text-xs">
                Em caso de duvidas, entre em contato com o suporte atraves do chat.
              </p>
            </div>
          </div>
        </AccordionSection>
      </div>
    </PageLayout>
  );
}
