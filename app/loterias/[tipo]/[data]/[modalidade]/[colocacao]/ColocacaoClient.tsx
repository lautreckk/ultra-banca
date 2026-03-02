'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useBetStore, PendingBet } from '@/stores/bet-store';
import { getModalidadeById, getColocacaoById, calcularMultiplicadorEfetivo, BANCAS } from '@/lib/constants';
import { BetHeader } from '@/components/layout';
import { ValueSelector, BetSummary, LotterySelector } from '@/components/loterias';
import { TipoJogo } from '@/types/bet';

interface ColocacaoClientProps {
  tipo: string;
  data: string;
  modalidade: string;
  colocacao: string;
  multiplicadorDB: number | null;
}

type Step = 'palpite' | 'valor' | 'resumo' | 'loterias';

export function ColocacaoClient({
  tipo,
  data,
  modalidade,
  colocacao,
  multiplicadorDB,
}: ColocacaoClientProps) {
  const router = useRouter();
  const { addPendingItem, pendingItems, finalizePendingItems, clearPendingItems, removePendingItem, editingBet, setEditingBet } = useBetStore();

  const [step, setStep] = useState<Step>('palpite');
  const [palpites, setPalpites] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [valorUnitario, setValorUnitario] = useState(0.1);
  const [valorMode, setValorMode] = useState<'todos' | 'cada'>('todos');
  const [selectedLotteries, setSelectedLotteries] = useState<string[]>([]);

  // Fallback para hardcoded se não encontrar no banco
  const modalidadeInfo = getModalidadeById(modalidade);
  const colocacaoInfo = getColocacaoById(colocacao);

  // Usa multiplicador do banco se disponível, senão usa hardcoded
  const multiplicadorBase = multiplicadorDB ?? modalidadeInfo?.multiplicador ?? 800;
  const multiplicadorEfetivo = calcularMultiplicadorEfetivo(
    multiplicadorBase,
    colocacao
  );

  // Usa digitos do hardcoded (estrutura da aposta não muda)
  const maxDigits = modalidadeInfo?.digitos || 3;

  // Format date as DD/MM/YYYY
  const dateObj = new Date(data + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('pt-BR');

  // Pre-fill form when editing a pending bet
  useEffect(() => {
    if (
      editingBet &&
      editingBet.modalidade === modalidade &&
      editingBet.colocacao === colocacao
    ) {
      setPalpites(editingBet.palpites);
      setValorUnitario(editingBet.valorUnitario);
      setEditingBet(null);
    }
  }, [editingBet, modalidade, colocacao, setEditingBet]);

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

  // Remove um palpite pendente
  const handleRemovePendingItem = (id: string) => {
    removePendingItem(id);
  };

  // Edita um palpite pendente: remove dos pendentes, navega para a rota correta e pre-fill
  const handleEditPendingItem = (item: PendingBet) => {
    removePendingItem(item.id);
    setEditingBet(item);

    // Se é a mesma modalidade/colocacao, pre-fill localmente
    if (item.modalidade === modalidade && item.colocacao === colocacao) {
      setPalpites(item.palpites);
      setValorUnitario(item.valorUnitario);
      setStep('palpite');
    } else {
      // Navega para a rota da aposta sendo editada
      router.push(`/loterias/${item.tipo}/${item.data}/${item.modalidade}/${item.colocacao}`);
    }
  };

  // Extrai os horários das loterias selecionadas
  const getHorariosFromLotteries = (lotteryIds: string[]): string[] => {
    const horarios: string[] = [];
    for (const banca of BANCAS) {
      for (const subLoteria of banca.subLoterias) {
        if (lotteryIds.includes(subLoteria.id) && subLoteria.horario) {
          if (!horarios.includes(subLoteria.horario)) {
            horarios.push(subLoteria.horario);
          }
        }
      }
    }
    return horarios;
  };

  const handleModeSelect = (mode: 'todos' | 'cada') => {
    setValorMode(mode);
    setStep('resumo');
  };

  // Adiciona aposta atual aos pendentes e navega para adicionar mais
  const handleMaisApostas = () => {
    if (palpites.length === 0) return;

    // Salva a aposta atual como pendente (sem loterias ainda)
    addPendingItem({
      tipo: tipo as TipoJogo,
      data,
      modalidade,
      colocacao,
      palpites,
      valorUnitario,
      multiplicador: multiplicadorEfetivo,
    });

    // Navega para selecionar outra modalidade
    router.push(`/loterias/${tipo}/${data}`);
  };

  // Adiciona aposta atual aos pendentes e vai para seleção de loterias
  const handleAvancarParaLoterias = () => {
    if (palpites.length === 0) return;

    // Salva a aposta atual como pendente
    addPendingItem({
      tipo: tipo as TipoJogo,
      data,
      modalidade,
      colocacao,
      palpites,
      valorUnitario,
      multiplicador: multiplicadorEfetivo,
    });

    setStep('loterias');
  };

  // Confirma as loterias e finaliza todas as apostas pendentes
  const handleConfirmarLoterias = () => {
    if (pendingItems.length === 0 || selectedLotteries.length === 0) return;

    // Extrai horários das loterias selecionadas
    const horarios = getHorariosFromLotteries(selectedLotteries);

    // Finaliza todas as apostas pendentes com as loterias selecionadas
    finalizePendingItems(selectedLotteries, horarios);

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
        // Ao voltar da seleção de loterias, removemos o último item pendente
        // (o que acabamos de adicionar ao ir para loterias)
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

  // Calcula total de todas as apostas pendentes + a atual
  const calcularTotalPendentes = () => {
    const totalPendentes = pendingItems.reduce(
      (acc, item) => acc + item.palpites.length * item.valorUnitario,
      0
    );
    return totalPendentes;
  };

  // Render palpite input step
  if (step === 'palpite') {
    return (
      <div className="flex-1 bg-[#111318]">
        <BetHeader title={getHeaderTitle()} onBack={handleBack} />

        <div className="bg-[#111318] min-h-screen">
          {/* Info Header */}
          <div className="px-4 pt-4">
            {/* LOTERIAS | CENTENA row */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">LOTERIAS</h1>
                <p className="text-sm text-zinc-500">{formattedDate}</p>
              </div>
              <span className="text-lg font-bold text-[#D97706]">
                {modalidadeInfo?.nome || modalidade.toUpperCase()}
              </span>
            </div>

            {/* Divider */}
            <div className="border-b border-zinc-700/40 my-3" />

            {/* Colocacao | Palpites row */}
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-semibold text-white">
                {colocacaoInfo?.nome || colocacao.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-sm font-semibold text-white">
                {palpites.length} PALPITES
              </span>
            </div>

            {/* Divider */}
            <div className="border-b border-zinc-700/40" />
          </div>

          {/* Input Section */}
          <div className="px-4 py-6">
            <input
              type="tel"
              inputMode="numeric"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Palpite..."
              className="w-full h-14 min-h-[56px] px-4 text-lg text-white bg-zinc-900/80 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-zinc-500"
            />

            {/* Palpites List */}
            {palpites.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {palpites.map((palpite) => (
                  <span
                    key={palpite}
                    className="inline-flex items-center gap-2 bg-zinc-900 text-white px-3 py-2 rounded-lg text-sm font-medium"
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
              className="h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
            >
              Surpresinha
            </button>
            <button
              onClick={() => setStep('valor')}
              disabled={palpites.length === 0}
              className="h-14 min-h-[56px] bg-[#E5A220] rounded-xl font-bold text-zinc-900 disabled:opacity-50 active:scale-[0.98] transition-all"
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
      <div className="flex-1 bg-[#111318]">
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
      <div className="flex-1 bg-[#111318]">
        <BetHeader title={getHeaderTitle()} onBack={handleBack} />

        <BetSummary
          modalidade={modalidadeInfo?.nome || modalidade}
          colocacao={colocacaoInfo?.nome || colocacao}
          palpites={palpites}
          valorUnitario={valorUnitario}
          pendingItems={pendingItems}
          onRemovePendingItem={handleRemovePendingItem}
          onEditPendingItem={handleEditPendingItem}
          onMaisApostas={handleMaisApostas}
          onAvancar={handleAvancarParaLoterias}
        />
      </div>
    );
  }

  // Render lottery selection step
  // Calcula o total considerando TODAS as apostas pendentes
  const totalPendentes = pendingItems.reduce(
    (acc, item) => acc + item.palpites.length * item.valorUnitario,
    0
  );

  return (
    <div className="min-h-screen bg-[#111318]">
      <BetHeader title={getHeaderTitle()} onBack={handleBack} />

      <LotterySelector
        selectedLotteries={selectedLotteries}
        onToggleLottery={handleToggleLottery}
        onConfirm={handleConfirmarLoterias}
        onBack={handleBack}
        total={totalPendentes * Math.max(selectedLotteries.length, 1)}
        dataJogo={data}
        pendingItemsCount={pendingItems.length}
      />
    </div>
  );
}
