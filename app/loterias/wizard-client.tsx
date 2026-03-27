'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu, RefreshCw, X, Search, ChevronRight, Sparkles } from 'lucide-react';
import { useBetStore, PendingBet } from '@/stores/bet-store';
import {
  getModalidadeById, getColocacaoById, calcularMultiplicadorEfetivo,
  formatMultiplicador, BANCAS, COLOCACOES,
} from '@/lib/constants';
import { ValueSelector, BetSummary, LotterySelector } from '@/components/loterias';
import type { ModalidadeDB } from '@/lib/actions/modalidades';
import type { TipoJogo } from '@/types/bet';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';
import { cn } from '@/lib/utils';
import { getUrlWithUtm } from '@/lib/utm';

// ── Types ──────────────────────────────────────────────
type Step = 'data' | 'modalidade' | 'colocacao' | 'palpite' | 'valor' | 'resumo' | 'loterias';

const STEPS: Step[] = ['data', 'modalidade', 'colocacao', 'palpite', 'valor', 'resumo', 'loterias'];
const STEP_LABELS: Record<Step, string> = {
  data: 'Data',
  modalidade: 'Modalidade',
  colocacao: 'Colocacao',
  palpite: 'Palpite',
  valor: 'Valor',
  resumo: 'Resumo',
  loterias: 'Loterias',
};

// Categorias do banco de dados
const CATEGORIAS_DB = [
  { id: 'centena', nome: 'Centenas' },
  { id: 'milhar', nome: 'Milhares' },
  { id: 'unidade', nome: 'Unidade' },
  { id: 'dezena', nome: 'Dezenas' },
  { id: 'duque_dezena', nome: 'Duque Dezena' },
  { id: 'terno_dezena_seco', nome: 'Terno Dezena Seco' },
  { id: 'terno_dezena', nome: 'Terno Dezena' },
  { id: 'grupo', nome: 'Grupo' },
  { id: 'duque_grupo', nome: 'Duque Grupo' },
  { id: 'terno_grupo', nome: 'Terno Grupo' },
  { id: 'quadra_grupo', nome: 'Quadra Grupo' },
  { id: 'quina_grupo', nome: 'Quina Grupo' },
  { id: 'sena_grupo', nome: 'Sena Grupo' },
  { id: 'passe', nome: 'Passe' },
  { id: 'palpitao', nome: 'Palpitao' },
];

interface LoteriasWizardClientProps {
  modalidades: ModalidadeDB[];
}

// ── Helpers ────────────────────────────────────────────
function getNextDays(count: number) {
  const days = [];
  const dayNames = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push({
      dateStr: date.toLocaleDateString('en-CA'),
      dayNum: date.getDate(),
      dayName: dayNames[date.getDay()],
    });
  }
  return days;
}

function isColocacaoPermitida(modalidade: ModalidadeDB | null, colocacaoId: string): boolean {
  if (!modalidade) return true;
  switch (colocacaoId) {
    case '1_ao_5': return modalidade.posicoes_1_5;
    case '1_ao_6': return modalidade.posicoes_1_6;
    case '1_ao_7': return modalidade.posicoes_1_7;
    case '1_ao_10': return modalidade.posicoes_1_10;
    case '5_e_6': return modalidade.posicoes_5_6;
    default: return true;
  }
}

// ── Main Wizard ────────────────────────────────────────
export function LoteriasWizardClient({ modalidades }: LoteriasWizardClientProps) {
  const router = useRouter();
  const { saldo, saldoBonus } = useUserBalance();
  const {
    addPendingItem, pendingItems, finalizePendingItems,
    removePendingItem, editingBet, setEditingBet,
  } = useBetStore();

  // ── Wizard State ──
  const [step, setStep] = useState<Step>('data');

  // Step 1: Data
  const [selectedDate, setSelectedDate] = useState('');

  // Step 2: Modalidade
  const [selectedModalidade, setSelectedModalidade] = useState<ModalidadeDB | null>(null);

  // Step 3: Colocacao
  const [selectedColocacao, setSelectedColocacao] = useState('');
  const [colocacaoSearch, setColocacaoSearch] = useState('');

  // Step 4: Palpite
  const [palpites, setPalpites] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  // Step 5: Valor
  const [valorUnitario, setValorUnitario] = useState(0.1);

  // Step 6: Resumo (uses pendingItems from store)

  // Step 7: Loterias
  const [selectedLotteries, setSelectedLotteries] = useState<string[]>([]);

  // ── Derived Values ──
  const stepIndex = STEPS.indexOf(step);
  const days = useMemo(() => getNextDays(6), []);

  const modalidadeInfo = selectedModalidade ? getModalidadeById(selectedModalidade.codigo) : null;
  const colocacaoInfo = getColocacaoById(selectedColocacao);
  const multiplicadorBase = selectedModalidade?.multiplicador ?? modalidadeInfo?.multiplicador ?? 800;
  const multiplicadorEfetivo = selectedColocacao
    ? calcularMultiplicadorEfetivo(multiplicadorBase, selectedColocacao)
    : multiplicadorBase;
  const maxDigits = modalidadeInfo?.digitos || 3;

  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')
    : '';

  const filteredColocacoes = COLOCACOES.filter(
    (c) =>
      c.nome.toLowerCase().includes(colocacaoSearch.toLowerCase()) &&
      isColocacaoPermitida(selectedModalidade, c.id)
  );

  // ── Navigation ──
  const goTo = useCallback((target: Step) => setStep(target), []);

  const goBack = useCallback(() => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    goTo(STEPS[stepIndex - 1]);
  }, [stepIndex, router, goTo]);

  // ── Step Handlers ──
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    goTo('modalidade');
  };

  const handleSelectModalidade = (mod: ModalidadeDB) => {
    setSelectedModalidade(mod);
    goTo('colocacao');
  };

  const handleSelectColocacao = (colocacaoId: string) => {
    setSelectedColocacao(colocacaoId);
    goTo('palpite');
  };

  // Auto-add palpite when max digits reached
  useEffect(() => {
    if (inputValue.length === maxDigits && !palpites.includes(inputValue)) {
      setPalpites((prev) => [...prev, inputValue]);
      setInputValue('');
    }
  }, [inputValue, maxDigits, palpites]);

  // Pre-fill form when editing a pending bet
  useEffect(() => {
    if (
      editingBet &&
      selectedModalidade &&
      editingBet.modalidade === selectedModalidade.codigo &&
      editingBet.colocacao === selectedColocacao
    ) {
      setPalpites(editingBet.palpites);
      setValorUnitario(editingBet.valorUnitario);
      setEditingBet(null);
      goTo('palpite');
    }
  }, [editingBet, selectedModalidade, selectedColocacao, setEditingBet, goTo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input.length <= maxDigits) setInputValue(input);
  };

  const handleRemovePalpite = (palpite: string) => {
    setPalpites(palpites.filter((p) => p !== palpite));
  };

  const handleSurpresinha = () => {
    const max = Math.pow(10, maxDigits);
    const random = Math.floor(Math.random() * max).toString().padStart(maxDigits, '0');
    if (!palpites.includes(random)) setPalpites([...palpites, random]);
  };

  const handleModeSelect = (mode: 'todos' | 'cada') => {
    goTo('resumo');
  };

  const handleToggleLottery = (lotteryId: string) => {
    setSelectedLotteries((prev) =>
      prev.includes(lotteryId) ? prev.filter((id) => id !== lotteryId) : [...prev, lotteryId]
    );
  };

  const getHorariosFromLotteries = (lotteryIds: string[]): string[] => {
    const horarios: string[] = [];
    for (const banca of BANCAS) {
      for (const subLoteria of banca.subLoterias) {
        if (lotteryIds.includes(subLoteria.id) && subLoteria.horario) {
          if (!horarios.includes(subLoteria.horario)) horarios.push(subLoteria.horario);
        }
      }
    }
    return horarios;
  };

  const handleMaisApostas = () => {
    if (palpites.length === 0) return;
    addPendingItem({
      tipo: 'loterias' as TipoJogo,
      data: selectedDate,
      modalidade: selectedModalidade?.codigo || '',
      colocacao: selectedColocacao,
      palpites,
      valorUnitario,
      multiplicador: multiplicadorEfetivo,
    });
    // Reset para nova aposta
    setPalpites([]);
    setInputValue('');
    setSelectedModalidade(null);
    setSelectedColocacao('');
    goTo('modalidade');
  };

  const handleAvancarParaLoterias = () => {
    if (palpites.length === 0) return;
    addPendingItem({
      tipo: 'loterias' as TipoJogo,
      data: selectedDate,
      modalidade: selectedModalidade?.codigo || '',
      colocacao: selectedColocacao,
      palpites,
      valorUnitario,
      multiplicador: multiplicadorEfetivo,
    });
    goTo('loterias');
  };

  const handleEditPendingItem = (item: PendingBet) => {
    removePendingItem(item.id);
    const mod = modalidades.find((m) => m.codigo === item.modalidade);
    if (mod) setSelectedModalidade(mod);
    setSelectedColocacao(item.colocacao);
    setPalpites(item.palpites);
    setValorUnitario(item.valorUnitario);
    goTo('palpite');
  };

  const handleConfirmarLoterias = () => {
    if (pendingItems.length === 0 || selectedLotteries.length === 0) return;
    const horarios = getHorariosFromLotteries(selectedLotteries);
    finalizePendingItems(selectedLotteries, horarios);
    router.push(getUrlWithUtm('/apostas/finalizar'));
  };

  const totalPendentes = pendingItems.reduce(
    (acc, item) => acc + item.palpites.length * item.valorUnitario, 0
  );

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#111318] flex justify-center">
      <div className="w-full max-w-md bg-[#111318] min-h-[100dvh] shadow-xl flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#1A202C] px-4 shrink-0">
          <div className="flex h-12 items-center justify-between">
            <button
              onClick={goBack}
              className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <span className="text-base font-bold text-white">LOTERIAS</span>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
          </div>
        </header>

        {/* Balance Bar */}
        <div className="bg-[#E5A220] px-4 py-2 flex items-center justify-between shrink-0">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-black/10" aria-label="Atualizar saldo">
            <RefreshCw className="h-4 w-4 text-white" />
          </button>
          <span className="text-white font-medium text-sm">
            R$ {formatCurrencyCompact(saldo)} | {formatCurrencyCompact(saldoBonus)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pt-3 pb-2 bg-[#111318] shrink-0">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className={cn(
                    'h-1.5 w-full rounded-full transition-all duration-300',
                    i <= stepIndex ? 'bg-[#E5A220]' : 'bg-zinc-700/40'
                  )}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-500">{stepIndex + 1}/{STEPS.length}</span>
            <span className="text-[10px] text-zinc-400 font-medium">{STEP_LABELS[step]}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div key={step}>
            {/* ═══ STEP: DATA ═══ */}
            {step === 'data' && (
              <div className="p-4">
                <h1 className="text-2xl font-bold text-[#E5A220] mb-1" style={{ fontFamily: 'serif' }}>
                  LOTERIAS
                </h1>
                <p className="text-zinc-500 text-sm mb-6">SELECIONE O DIA DO SORTEIO</p>

                <div className="grid grid-cols-2 gap-3">
                  {days.map((day, index) => (
                    <button
                      key={day.dateStr}
                      onClick={() => handleSelectDate(day.dateStr)}
                      className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-[#2D3748] active:scale-[0.98] transition-all"
                    >
                      <div className="bg-[#111318] rounded-xl w-14 h-14 flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-white">{day.dayNum}</span>
                      </div>
                      <span className="text-white font-bold text-sm">
                        {index === 0 ? 'HOJE' : day.dayName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ STEP: MODALIDADE ═══ */}
            {step === 'modalidade' && (
              <div>
                {CATEGORIAS_DB.map((categoria) => {
                  const items = modalidades.filter((m) => m.categoria === categoria.id);
                  if (items.length === 0) return null;

                  return (
                    <div key={categoria.id}>
                      <div className="bg-zinc-800/50 px-4 py-2 text-sm font-bold text-zinc-300 uppercase tracking-wide">
                        {categoria.nome}
                      </div>
                      <div className="divide-y divide-zinc-700/40">
                        {items.map((mod) => (
                          <button
                            key={mod.id}
                            onClick={() => handleSelectModalidade(mod)}
                            className="w-full flex h-14 items-center justify-between px-4 transition-colors active:bg-zinc-700/30"
                          >
                            <span className="font-semibold text-white">{mod.nome}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-400">
                                {formatMultiplicador(mod.multiplicador)}
                              </span>
                              <ChevronRight className="h-5 w-5 text-zinc-500" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ═══ STEP: COLOCACAO ═══ */}
            {step === 'colocacao' && (
              <div>
                {/* Search */}
                <div className="px-4 py-3 border-b border-zinc-700/40">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={colocacaoSearch}
                      onChange={(e) => setColocacaoSearch(e.target.value)}
                      className="w-full h-14 pl-10 pr-4 bg-zinc-900/80 border border-zinc-700/40 rounded-xl text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">
                    {selectedModalidade?.nome} - {formatMultiplicador(multiplicadorBase)}
                  </p>
                </div>

                {/* Colocacoes List */}
                <div className="divide-y divide-zinc-700/40">
                  {filteredColocacoes.map((coloc) => {
                    const multEfetivo = calcularMultiplicadorEfetivo(multiplicadorBase, coloc.id);
                    return (
                      <button
                        key={coloc.id}
                        onClick={() => handleSelectColocacao(coloc.id)}
                        className="w-full flex h-14 items-center justify-between px-4 transition-colors active:bg-zinc-700/30"
                      >
                        <span className="font-semibold text-white">{coloc.nome}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-400">
                            {formatMultiplicador(multEfetivo)}
                          </span>
                          <ChevronRight className="h-5 w-5 text-zinc-500" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ STEP: PALPITE ═══ */}
            {step === 'palpite' && (
              <div className="p-4">
                {/* Info */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">LOTERIAS</h2>
                    <p className="text-sm text-zinc-500">{formattedDate}</p>
                  </div>
                  <span className="text-lg font-bold text-[#D97706]">
                    {modalidadeInfo?.nome || selectedModalidade?.nome}
                  </span>
                </div>

                <div className="border-b border-zinc-700/40 mb-3" />

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-white">
                    {colocacaoInfo?.nome || selectedColocacao}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {palpites.length} PALPITES
                  </span>
                </div>

                {/* Input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Palpite..."
                  className="w-full h-14 px-4 text-lg text-white bg-zinc-900/80 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-500"
                  autoFocus
                />

                {/* Palpites */}
                {palpites.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {palpites.map((p) => (
                      <span key={p} className="inline-flex items-center gap-2 bg-zinc-900 text-white px-3 py-2 rounded-lg text-sm font-medium">
                        {p}
                        <button onClick={() => handleRemovePalpite(p)} className="text-white/70 hover:text-white">
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={handleSurpresinha}
                    className="h-14 bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    Surpresinha
                  </button>
                  <button
                    onClick={() => goTo('valor')}
                    disabled={palpites.length === 0}
                    className="h-14 bg-[#E5A220] rounded-xl font-bold text-zinc-900 disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    Avancar
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP: VALOR ═══ */}
            {step === 'valor' && (
              <ValueSelector
                value={valorUnitario}
                onChange={setValorUnitario}
                onModeSelect={handleModeSelect}
                modalidade={modalidadeInfo?.nome || selectedModalidade?.nome || ''}
                data={formattedDate}
              />
            )}

            {/* ═══ STEP: RESUMO ═══ */}
            {step === 'resumo' && (
              <BetSummary
                modalidade={modalidadeInfo?.nome || selectedModalidade?.nome || ''}
                colocacao={colocacaoInfo?.nome || selectedColocacao}
                palpites={palpites}
                valorUnitario={valorUnitario}
                pendingItems={pendingItems}
                onRemovePendingItem={(id) => removePendingItem(id)}
                onEditPendingItem={handleEditPendingItem}
                onMaisApostas={handleMaisApostas}
                onAvancar={handleAvancarParaLoterias}
              />
            )}

            {/* ═══ STEP: LOTERIAS ═══ */}
            {step === 'loterias' && (
              <LotterySelector
                selectedLotteries={selectedLotteries}
                onToggleLottery={handleToggleLottery}
                onConfirm={handleConfirmarLoterias}
                onBack={goBack}
                total={totalPendentes * Math.max(selectedLotteries.length, 1)}
                dataJogo={selectedDate}
                pendingItemsCount={pendingItems.length}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
