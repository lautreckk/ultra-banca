'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft, Menu, RefreshCw, Info, Clock,
  Home, Share2, Printer, Loader2, X, Check, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import type { ModalidadeDB } from '@/lib/actions/modalidades';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────
type Step = 'data' | 'modalidade' | 'numeros' | 'valor' | 'dias' | 'confirmar';

const STEPS: Step[] = ['data', 'modalidade', 'numeros', 'valor', 'dias', 'confirmar'];
const STEP_LABELS: Record<Step, string> = {
  data: 'Data',
  modalidade: 'Modalidade',
  numeros: 'Numeros',
  valor: 'Valor',
  dias: 'Dias',
  confirmar: 'Confirmar',
};

interface LotinhaWizardClientProps {
  modalidades: ModalidadeDB[];
}

// ── Helpers ────────────────────────────────────────────
function getNextDays(count: number): { date: Date; dateStr: string; dayNum: number; dayName: string }[] {
  const days = [];
  const dayNames = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push({
      date,
      dateStr: date.toLocaleDateString('en-CA'),
      dayNum: date.getDate(),
      dayName: dayNames[date.getDay()],
    });
  }
  return days;
}

function getSorteioDays(): { dateStr: string; dateLabel: string; dayName: string }[] {
  const days = [];
  const dayNames = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateLabel = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    days.push({
      dateStr: date.toLocaleDateString('en-CA'),
      dateLabel,
      dayName: i === 0 ? 'Hoje' : dayNames[date.getDay()],
    });
  }
  return days;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Main Wizard ────────────────────────────────────────
export function LotinhaWizardClient({ modalidades }: LotinhaWizardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const config = usePlatformConfig();
  const { saldo, saldoBonus } = useUserBalance();

  // ── Wizard State ──
  const [step, setStep] = useState<Step>('data');

  // Step 1: Data
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Step 2: Modalidade
  const [selectedModalidade, setSelectedModalidade] = useState<ModalidadeDB | null>(null);

  // Step 3: Numeros
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [palpites, setPalpites] = useState<number[][]>([]);
  const REQUIRED_NUMBERS = 16;
  const NUMBER_POOL = 25;

  // Step 4: Valor
  const [valor, setValor] = useState('');
  const [valorMode, setValorMode] = useState<'todos' | 'cada' | null>(null);

  // Step 5: Dias
  const [selectedDias, setSelectedDias] = useState<string[]>([]);

  // Step 6: Confirmar
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puleNumber, setPuleNumber] = useState('');
  const [novoSaldo, setNovoSaldo] = useState<number | null>(null);
  const [confirmationTime, setConfirmationTime] = useState('');

  // ── Derived Values ──
  const stepIndex = STEPS.indexOf(step);
  const days = useMemo(() => getNextDays(6), []);
  const sorteioDays = useMemo(() => getSorteioDays(), []);

  const palpitesNumbers = useMemo(() => {
    const set = new Set<number>();
    palpites.forEach((p) => p.forEach((n) => set.add(n)));
    return set;
  }, [palpites]);

  const valorNum = parseFloat(valor.replace(',', '.')) || 0;
  const valorPorPalpite = valorMode === 'cada' ? valorNum : palpites.length > 0 ? valorNum / palpites.length : 0;
  const valorTotalBase = valorMode === 'cada' ? valorNum * palpites.length : valorNum;
  const valorTotal = valorTotalBase * (selectedDias.length || 1);

  // ── Navigation ──
  const goTo = useCallback((target: Step) => {
    setStep(target);
  }, []);

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
    goTo('numeros');
  };

  const handleNumberClick = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else if (selectedNumbers.length < REQUIRED_NUMBERS) {
      const newSelected = [...selectedNumbers, num];
      setSelectedNumbers(newSelected);
      if (newSelected.length === REQUIRED_NUMBERS) {
        setPalpites([...palpites, newSelected.sort((a, b) => a - b)]);
        setSelectedNumbers([]);
      }
    }
  };

  const handleSurpresinha = () => {
    const available = Array.from({ length: NUMBER_POOL }, (_, i) => i + 1);
    const shuffled = available.sort(() => Math.random() - 0.5);
    const randomNumbers = shuffled.slice(0, REQUIRED_NUMBERS).sort((a, b) => a - b);
    setPalpites([...palpites, randomNumbers]);
    setSelectedNumbers([]);
  };

  const handleValorMode = (mode: 'todos' | 'cada') => {
    if (!valor || valorNum <= 0) return;
    setValorMode(mode);
    goTo('dias');
  };

  const handleToggleDay = (dateStr: string) => {
    setSelectedDias((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleFinalizar = async () => {
    if (!selectedModalidade) return;
    setIsLoading(true);
    setError(null);

    try {
      const palpitesStr = palpites.map((p) => p.map((n) => n.toString().padStart(2, '0')).join('-'));

      const { data, error: rpcError } = await supabase.rpc('place_bet', {
        p_tipo: 'lotinha',
        p_modalidade: selectedModalidade.codigo,
        p_colocacao: 'geral',
        p_palpites: palpitesStr,
        p_horarios: selectedDias,
        p_loterias: [],
        p_data_jogo: selectedDate,
        p_valor_unitario: valorPorPalpite,
        p_multiplicador: selectedModalidade.multiplicador,
      });

      if (rpcError) throw new Error(rpcError.message);
      if (data && !data.success) throw new Error(data.error || 'Erro ao registrar aposta');

      setPuleNumber(data.pule);
      setNovoSaldo(data.saldo_restante);

      const now = new Date();
      setConfirmationTime(
        `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
      setIsConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar aposta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Aposta Lotinha - ${config.site_name}`,
        text: `PULE #${puleNumber}\n${selectedModalidade?.nome}\n${palpites.length} palpites\nTotal: R$ ${formatCurrency(valorTotal)}`,
      });
    }
  };

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
            <span className="text-base font-bold text-white">LOTINHA</span>
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
            R$ {novoSaldo !== null ? formatCurrency(novoSaldo) : `${formatCurrencyCompact(saldo)} | ${formatCurrencyCompact(saldoBonus)}`}
          </span>
        </div>

        {/* Progress Bar */}
        {step !== 'confirmar' && (
          <div className="px-4 pt-3 pb-2 bg-[#111318] shrink-0">
            <div className="flex items-center gap-1">
              {STEPS.slice(0, -1).map((s, i) => (
                <div key={s} className="flex-1">
                  <div
                    className={cn(
                      'h-1.5 w-full rounded-full transition-all duration-300',
                      i <= STEPS.indexOf(step) ? 'bg-pink-500' : 'bg-zinc-700/40'
                    )}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-zinc-500">{stepIndex + 1}/{STEPS.length - 1}</span>
              <span className="text-[10px] text-zinc-400 font-medium">{STEP_LABELS[step]}</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div key={step}>
            {/* ═══ STEP: DATA ═══ */}
            {step === 'data' && (
              <div className="p-4">
                <h1 className="text-2xl font-bold text-pink-500 mb-1" style={{ fontFamily: 'serif' }}>
                  LOTINHA
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
              <div className="p-4">
                <h2 className="text-xl font-bold text-white mb-1">LOTINHA</h2>
                <p className="text-zinc-500 text-sm mb-6">Selecione a modalidade</p>

                <div className="grid grid-cols-2 gap-3">
                  {modalidades.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => handleSelectModalidade(mod)}
                      className={cn(
                        'bg-[#1A1F2B] border rounded-xl p-4 text-center hover:bg-[#2D3748] active:scale-[0.98] transition-all',
                        selectedModalidade?.id === mod.id
                          ? 'border-pink-500 ring-1 ring-pink-500'
                          : 'border-zinc-700/40'
                      )}
                    >
                      <span className="text-white font-bold text-sm">{mod.nome}</span>
                      <div className="text-pink-500 text-xs mt-1">{mod.multiplicador}x</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ STEP: NUMEROS ═══ */}
            {step === 'numeros' && (
              <div className="flex flex-col">
                <div className="p-4 border-b border-zinc-700/40 bg-[#1A1F2B]">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-bold text-white">LOTINHA</h2>
                    <div className="text-right">
                      <div className="text-pink-500 font-bold text-sm">{selectedModalidade?.nome}</div>
                      <div className="text-pink-500 text-xs">
                        {REQUIRED_NUMBERS - selectedNumbers.length} RESTANTES
                      </div>
                    </div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-white font-medium text-sm">{palpites.length} PALPITES</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-5 gap-2 justify-center">
                    {Array.from({ length: NUMBER_POOL }, (_, i) => i + 1).map((num) => {
                      const isSelected = selectedNumbers.includes(num);
                      const isInPalpite = palpitesNumbers.has(num);
                      return (
                        <button
                          key={num}
                          onClick={() => handleNumberClick(num)}
                          className={cn(
                            'h-12 rounded-xl flex items-center justify-center text-sm font-medium transition-all active:scale-[0.95]',
                            isSelected
                              ? 'bg-[#111318] text-white ring-2 ring-pink-500'
                              : isInPalpite
                              ? 'bg-green-500 text-white'
                              : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50'
                          )}
                        >
                          {num.toString().padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 flex gap-3 mt-auto">
                  <button
                    onClick={handleSurpresinha}
                    className="flex-1 h-14 bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-zinc-300 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <Sparkles className="h-4 w-4" />
                    Surpresinha
                  </button>
                  <button
                    onClick={() => goTo('valor')}
                    disabled={palpites.length === 0}
                    className="flex-1 h-14 bg-pink-500 rounded-xl font-bold text-white disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    Avancar
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP: VALOR ═══ */}
            {step === 'valor' && (
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-white">LOTINHA</h2>
                  <div className="text-right">
                    <div className="text-pink-500 font-bold text-sm">{selectedModalidade?.nome}</div>
                    <div className="text-white text-sm">{palpites.length} PALPITES</div>
                  </div>
                </div>

                <button className="flex items-center gap-2 text-blue-500 text-sm mb-4 active:scale-[0.98] transition-all">
                  <Info className="h-4 w-4" />
                  <span>VER REGRAS DE ARREDONDAMENTO</span>
                </button>

                <div className="flex items-center border border-zinc-700/40 rounded-xl mb-4 bg-zinc-900/80">
                  <span className="pl-4 text-zinc-500">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => setValor(e.target.value.replace(/[^0-9,]/g, ''))}
                    placeholder="0,00..."
                    className="flex-1 h-14 px-2 rounded-xl bg-transparent text-white text-base focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => setValor('')}
                    className="px-4 text-zinc-500 hover:text-zinc-300 active:scale-[0.98] transition-all"
                  >
                    Limpar
                  </button>
                </div>

                <div className="mb-6">
                  <span className="text-sm text-zinc-300 mb-2 block">Valores rapidos:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 20, 50].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          const current = parseFloat(valor.replace(',', '.')) || 0;
                          setValor((current + v).toFixed(2).replace('.', ','));
                        }}
                        className="h-11 border border-zinc-700/40 rounded-xl text-zinc-300 font-medium hover:bg-zinc-700/30 active:scale-[0.98] transition-all"
                      >
                        +{v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleValorMode('todos')}
                    disabled={!valor || valorNum <= 0}
                    className="h-14 bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => handleValorMode('cada')}
                    disabled={!valor || valorNum <= 0}
                    className="h-14 bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    Cada
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP: DIAS ═══ */}
            {step === 'dias' && (
              <div className="flex flex-col">
                <div className="p-4 bg-[#1A1F2B] border-b border-zinc-700/40">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white text-sm">{selectedModalidade?.nome}</span>
                    <span className="text-zinc-500 text-xs">{formatCurrency(valorPorPalpite)} / CADA</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {palpites.map((p, i) => (
                      <span key={i} className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-1.5 py-0.5 text-[10px] text-zinc-300">
                        {p.map((n) => n.toString().padStart(2, '0')).join('-')}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-zinc-700/40 pt-2">
                    <span className="text-zinc-400 text-sm">Total</span>
                    <span className="font-bold text-white">R$ {formatCurrency(valorTotal)}</span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-white font-bold mb-3">SELECIONAR DIAS</h3>
                  <div className="space-y-2">
                    {sorteioDays.map((day) => (
                      <button
                        key={day.dateStr}
                        onClick={() => handleToggleDay(day.dateStr)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1A1F2B] border border-zinc-700/40 active:scale-[0.98] transition-all"
                      >
                        <div className={cn(
                          'w-5 h-5 border-2 rounded flex items-center justify-center shrink-0',
                          selectedDias.includes(day.dateStr) ? 'bg-pink-500 border-pink-500' : 'border-zinc-600'
                        )}>
                          {selectedDias.includes(day.dateStr) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-white text-sm">{day.dateLabel} - {day.dayName}</div>
                          <div className="flex items-center gap-1 text-zinc-500 text-xs">
                            <Clock className="h-3 w-3" />
                            <span>20:00</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 mt-auto">
                  <button
                    onClick={() => goTo('confirmar')}
                    disabled={selectedDias.length === 0}
                    className="w-full h-14 bg-pink-500 rounded-xl font-bold text-white disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-400 active:scale-[0.98] transition-all"
                  >
                    APOSTAR - R$ {formatCurrency(valorTotal)}
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP: CONFIRMAR ═══ */}
            {step === 'confirmar' && (
              <div className="p-4">
                {error && (
                  <div className="bg-red-600 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-lg mb-4">
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-2">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <div className="bg-[#1A1F2B] rounded-xl border border-zinc-700/40 p-4 mb-4">
                  <div className="text-xs text-zinc-500 mb-2">PULE #{puleNumber || '...'}</div>

                  <div className="text-center mb-4">
                    <span className="text-lg font-bold text-white">{config.site_name.toUpperCase()}</span>
                    <div className="flex justify-center mt-2">
                      {config.logo_url ? (
                        <Image
                          src={config.logo_url}
                          alt={config.site_name}
                          width={100}
                          height={70}
                          className="object-contain"
                          unoptimized={config.logo_url.includes('supabase.co')}
                        />
                      ) : (
                        <div className="w-20 h-16 bg-[#111318] rounded-xl flex items-center justify-center">
                          <span className="text-pink-500 font-bold text-xs text-center">{config.site_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="text-center flex-1">
                      <div className="text-xs text-zinc-500">VENDEDOR</div>
                      <div className="text-sm font-bold text-white">979536</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-xs text-zinc-500">STATUS</div>
                      <div className={cn('text-sm font-bold', isConfirmed ? 'text-green-500' : 'text-yellow-500')}>
                        {isConfirmed ? 'REGISTRADA' : 'PENDENTE'}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-700/40 my-3" />

                  <div className="mb-4">
                    {selectedDias.map((dia, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-zinc-300 mb-1">
                        <span className="text-zinc-500">-</span>
                        <span className={isConfirmed ? 'text-green-600' : ''}>
                          SORTEIO LOTOFACIL - {sorteioDays.find((d) => d.dateStr === dia)?.dateLabel || dia}
                        </span>
                        {isConfirmed && <span className="text-green-600 text-xs ml-auto">REGISTRADA</span>}
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex-1 border-t border-zinc-700/40" />
                      <span className="px-2 text-xs text-zinc-500">MODALIDADES</span>
                      <div className="flex-1 border-t border-zinc-700/40" />
                    </div>

                    <div className="font-bold text-white mb-2">{selectedModalidade?.nome}</div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {palpites.map((p, i) => (
                        <span key={i} className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl px-2 py-1 text-xs text-zinc-300">
                          {p.map((n) => n.toString().padStart(2, '0')).join('-')}
                        </span>
                      ))}
                    </div>

                    <div className="text-sm text-zinc-400">R$ {formatCurrency(valorPorPalpite)} / CADA</div>
                  </div>

                  <div className="border-t border-dashed border-zinc-700/40 pt-3">
                    <div className="text-center font-bold text-lg text-white">
                      TOTAL: R$ {formatCurrency(valorTotal)}
                    </div>
                  </div>

                  {isConfirmed && (
                    <div className="mt-4 text-center">
                      <div className="text-green-600 text-sm mb-1">Aposta registrada com sucesso!</div>
                      <div className="text-zinc-500 text-xs">{confirmationTime}</div>
                      {novoSaldo !== null && (
                        <div className="text-green-600 text-sm mt-2">
                          Novo saldo: R$ {formatCurrency(novoSaldo)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-zinc-700/40 my-4" />

                {!isConfirmed ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={goBack}
                      disabled={isLoading}
                      className="h-14 bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      Voltar
                    </button>
                    <button
                      onClick={handleFinalizar}
                      disabled={isLoading}
                      className="h-14 bg-pink-500 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Finalizar e salvar'
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleShare}
                        className="h-14 bg-pink-500 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <Share2 className="h-5 w-5" />
                        Compartilhar
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="h-14 bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <Printer className="h-5 w-5" />
                        Imprimir
                      </button>
                    </div>
                    <button
                      onClick={() => router.push('/')}
                      className="w-full mt-3 h-14 bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-zinc-300 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                      <Home className="h-5 w-5" />
                      Voltar ao Inicio
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
