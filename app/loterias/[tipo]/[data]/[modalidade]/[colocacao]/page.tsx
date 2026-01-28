'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useBetStore } from '@/stores/bet-store';
import { getModalidadeById, getColocacaoById, calcularMultiplicadorEfetivo } from '@/lib/constants';
import { BetHeader } from '@/components/layout';
import { ValueSelector, BetSummary, LotterySelector } from '@/components/loterias';
import { TipoJogo } from '@/types/bet';

interface ColocacaoPageProps {
  params: Promise<{ tipo: string; data: string; modalidade: string; colocacao: string }>;
}

type Step = 'palpite' | 'valor' | 'resumo' | 'loterias';

export default function ColocacaoPage({ params }: ColocacaoPageProps) {
  const { tipo, data, modalidade, colocacao } = use(params);
  const router = useRouter();
  const { addItem } = useBetStore();

  const [step, setStep] = useState<Step>('palpite');
  const [palpites, setPalpites] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [valorUnitario, setValorUnitario] = useState(0.1);
  const [valorMode, setValorMode] = useState<'todos' | 'cada'>('todos');
  const [selectedLotteries, setSelectedLotteries] = useState<string[]>([]);

  const modalidadeInfo = getModalidadeById(modalidade);
  const colocacaoInfo = getColocacaoById(colocacao);
  const multiplicadorEfetivo = calcularMultiplicadorEfetivo(
    modalidadeInfo?.multiplicador || 800,
    colocacao
  );

  const maxDigits = modalidadeInfo?.digitos || 3;

  // Format date as DD/MM/YYYY
  const dateObj = new Date(data + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('pt-BR');

  // Auto-add palpite when max digits reached
  useEffect(() => {
    if (inputValue.length === maxDigits && !palpites.includes(inputValue)) {
      setPalpites((prev) => [...prev, inputValue]);
      setInputValue('');
    }
  }, [inputValue, maxDigits, palpites]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input.length <= maxDigits) {
      setInputValue(input);
    }
  };

  const handleRemovePalpite = (palpite: string) => {
    setPalpites(palpites.filter((p) => p !== palpite));
  };

  const handleSurpresinha = () => {
    const max = Math.pow(10, maxDigits);
    const random = Math.floor(Math.random() * max)
      .toString()
      .padStart(maxDigits, '0');

    if (!palpites.includes(random)) {
      setPalpites([...palpites, random]);
    }
  };

  const handleToggleLottery = (lotteryId: string) => {
    setSelectedLotteries((prev) =>
      prev.includes(lotteryId)
        ? prev.filter((id) => id !== lotteryId)
        : [...prev, lotteryId]
    );
  };

  const handleModeSelect = (mode: 'todos' | 'cada') => {
    setValorMode(mode);
    setStep('resumo');
  };

  const handleValendo = () => {
    if (palpites.length === 0) return;

    addItem({
      tipo: tipo as TipoJogo,
      data,
      modalidade,
      colocacao,
      palpites,
      horarios: [],
      loterias: selectedLotteries,
      valorUnitario,
      multiplicador: multiplicadorEfetivo,
    });

    router.push('/apostas/finalizar');
  };

  const handleMaisApostas = () => {
    router.push(`/loterias/${tipo}/${data}`);
  };

  const handleConfirmarLoterias = () => {
    if (palpites.length === 0 || selectedLotteries.length === 0) return;

    addItem({
      tipo: tipo as TipoJogo,
      data,
      modalidade,
      colocacao,
      palpites,
      horarios: [],
      loterias: selectedLotteries,
      valorUnitario,
      multiplicador: multiplicadorEfetivo,
    });

    router.push('/apostas/finalizar');
  };

  const handleBack = () => {
    switch (step) {
      case 'palpite':
        router.back();
        break;
      case 'valor':
        setStep('palpite');
        break;
      case 'resumo':
        setStep('valor');
        break;
      case 'loterias':
        setStep('resumo');
        break;
    }
  };

  const getHeaderTitle = () => {
    switch (step) {
      case 'palpite':
        return 'PREENCHA SEU PALPITE';
      case 'valor':
        return 'ESCOLHA O VALOR';
      case 'resumo':
        return 'APOSTAS';
      case 'loterias':
        return 'SELECIONAR LOTERIAS';
    }
  };

  // Render palpite input step
  if (step === 'palpite') {
    return (
      <div className="min-h-screen bg-[#1A202C]">
        <BetHeader title={getHeaderTitle()} onBack={handleBack} />

        <div className="bg-white min-h-screen">
          {/* Info Header */}
          <div className="px-4 pt-4">
            {/* LOTERIAS | CENTENA row */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">LOTERIAS</h1>
                <p className="text-sm text-gray-500">{formattedDate}</p>
              </div>
              <span className="text-lg font-bold text-[#D97706]">
                {modalidadeInfo?.nome || modalidade.toUpperCase()}
              </span>
            </div>

            {/* Divider */}
            <div className="border-b border-gray-200 my-3" />

            {/* Colocacao | Palpites row */}
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-semibold text-gray-900">
                {colocacaoInfo?.nome || colocacao.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {palpites.length} PALPITES
              </span>
            </div>

            {/* Divider */}
            <div className="border-b border-gray-200" />
          </div>

          {/* Input Section */}
          <div className="px-4 py-6">
            <input
              type="tel"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Palpite..."
              className="w-full h-14 px-4 text-lg border-2 border-[#3B82F6] rounded-xl focus:outline-none focus:border-[#2563EB] placeholder:text-gray-400"
            />

            {/* Palpites List */}
            {palpites.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {palpites.map((palpite) => (
                  <span
                    key={palpite}
                    className="inline-flex items-center gap-2 bg-[#1A202C] text-white px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    {palpite}
                    <button
                      onClick={() => handleRemovePalpite(palpite)}
                      className="text-white/70 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-4 grid grid-cols-2 gap-3">
            <button
              onClick={handleSurpresinha}
              className="h-12 bg-[#1A202C] rounded-xl font-semibold text-white"
            >
              Surpresinha
            </button>
            <button
              onClick={() => setStep('valor')}
              disabled={palpites.length === 0}
              className="h-12 bg-[#E5A220] rounded-xl font-semibold text-black disabled:opacity-50"
            >
              Avançar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render value selection step
  if (step === 'valor') {
    return (
      <div className="min-h-screen bg-[#1A202C]">
        <BetHeader title={getHeaderTitle()} onBack={handleBack} />

        <ValueSelector
          value={valorUnitario}
          onChange={setValorUnitario}
          onModeSelect={handleModeSelect}
          modalidade={modalidadeInfo?.nome || modalidade.toUpperCase()}
          data={formattedDate}
        />
      </div>
    );
  }

  // Render bet summary step
  if (step === 'resumo') {
    return (
      <div className="min-h-screen bg-[#1A202C]">
        <BetHeader title={getHeaderTitle()} onBack={handleBack} />

        <BetSummary
          modalidade={modalidadeInfo?.nome || modalidade}
          colocacao={colocacaoInfo?.nome || colocacao}
          palpites={palpites}
          valorUnitario={valorUnitario}
          onValendo={handleValendo}
          onMaisApostas={handleMaisApostas}
          onAvancar={() => setStep('loterias')}
        />
      </div>
    );
  }

  // Render lottery selection step
  return (
    <div className="min-h-screen bg-[#1A202C]">
      <BetHeader title={getHeaderTitle()} onBack={handleBack} />

      <LotterySelector
        selectedLotteries={selectedLotteries}
        onToggleLottery={handleToggleLottery}
        onConfirm={handleConfirmarLoterias}
        onBack={handleBack}
        total={palpites.length * valorUnitario * Math.max(selectedLotteries.length, 1)}
      />
    </div>
  );
}
