'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft, Menu, RefreshCw, Home, Share2, Loader2, X, Check, FileText,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { useUserBalance } from '@/lib/hooks/use-user-balance';
import { formatCurrencyCompact } from '@/lib/utils/format-currency';
import { cn } from '@/lib/utils';
import {
  FAZENDINHA_LOTERIAS,
  FAZENDINHA_MODALIDADES,
  getValoresByModalidade,
  formatPremio,
  getFazendinhaLoteriaById,
} from '@/lib/constants';
import type { FazendinhaModalidade, FazendinhaLoteria } from '@/lib/constants/fazendinha';

// ── Types ──────────────────────────────────────────────
type Step = 'data' | 'config' | 'numeros' | 'confirmar';

const STEPS: Step[] = ['data', 'config', 'numeros', 'confirmar'];
const STEP_LABELS: Record<Step, string> = {
  data: 'Data',
  config: 'Configurar',
  numeros: 'Numeros',
  confirmar: 'Confirmar',
};

// ── Helpers ────────────────────────────────────────────
function getNextDays(count: number) {
  const days = [];
  const weekdays = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push({
      dateStr: date.toLocaleDateString('en-CA'),
      dayNum: date.getDate().toString().padStart(2, '0'),
      dayName: weekdays[date.getDay()],
    });
  }
  return days;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Main Wizard ────────────────────────────────────────
export function FazendinhaWizardClient() {
  const router = useRouter();
  const supabase = createClient();
  const config = usePlatformConfig();
  const { saldo, saldoBonus } = useUserBalance();

  // ── Wizard State ──
  const [step, setStep] = useState<Step>('data');

  // Step 1: Data
  const [selectedDate, setSelectedDate] = useState('');

  // Step 2: Config (modalidade + valor + loteria)
  const [selectedModalidade, setSelectedModalidade] = useState('dezena');
  const [selectedValor, setSelectedValor] = useState(1);
  const [selectedLoteria, setSelectedLoteria] = useState('');

  // Step 3: Numeros
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);

  // Step 4: Confirmar
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puleNumber, setPuleNumber] = useState<string | null>(null);
  const [novoSaldo, setNovoSaldo] = useState<number | null>(null);
  const [confirmationTime, setConfirmationTime] = useState<string | null>(null);

  // ── Derived Values ──
  const stepIndex = STEPS.indexOf(step);
  const days = useMemo(() => getNextDays(7), []);
  const modalidade = FAZENDINHA_MODALIDADES.find((m) => m.id === selectedModalidade);
  const valores = getValoresByModalidade(selectedModalidade);
  const loteria = selectedLoteria ? getFazendinhaLoteriaById(selectedLoteria) : null;

  const total = selectedNumbers.length * selectedValor;
  const possivelPremio = selectedValor * (modalidade?.multiplicador || 1);

  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')
    : '';

  // Generate numbers for grid
  const numbers = useMemo(() => {
    const nums: string[] = [];
    const max = modalidade?.maxNumero || 99;
    const digits = modalidade?.digitos || 2;
    const start = selectedModalidade === 'grupo' ? 1 : 0;
    for (let i = start; i <= max; i++) {
      nums.push(i.toString().padStart(digits, '0'));
    }
    return nums;
  }, [modalidade, selectedModalidade]);

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
    goTo('config');
  };

  const handleSelectLoteria = (loteriaId: string) => {
    setSelectedLoteria(loteriaId);
    goTo('numeros');
  };

  const toggleNumber = (num: string) => {
    setSelectedNumbers((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const handleFinalizar = async () => {
    if (selectedNumbers.length === 0 || !modalidade) return;
    setIsLoading(true);
    setError(null);

    try {
      // Validacao de horario
      if (loteria && selectedDate) {
        const hoje = new Date();
        const dataJogo = new Date(selectedDate + 'T00:00:00');
        const isHoje =
          hoje.getFullYear() === dataJogo.getFullYear() &&
          hoje.getMonth() === dataJogo.getMonth() &&
          hoje.getDate() === dataJogo.getDate();

        if (isHoje && loteria.horario) {
          const [h, m] = loteria.horario.split(':').map(Number);
          const horarioLoteria = new Date();
          horarioLoteria.setHours(h, m, 0, 0);
          const limiteMs = horarioLoteria.getTime() - 5 * 60 * 1000;
          if (Date.now() >= limiteMs) {
            throw new Error(`Loteria ${loteria.nome} ja encerrou as apostas.`);
          }
        }
      }

      const { data, error: rpcError } = await supabase.rpc('place_bet', {
        p_tipo: 'fazendinha',
        p_modalidade: selectedModalidade,
        p_colocacao: '1_premio',
        p_palpites: selectedNumbers,
        p_horarios: [],
        p_loterias: [selectedLoteria],
        p_data_jogo: selectedDate,
        p_valor_unitario: selectedValor,
        p_multiplicador: modalidade?.multiplicador || 1,
      });

      if (rpcError) throw new Error(rpcError.message);
      if (data && !data.success) throw new Error(data.error || 'Erro ao registrar aposta');

      setPuleNumber(data.pule);
      setNovoSaldo(data.saldo_restante);

      const now = new Date();
      setConfirmationTime(
        now.toLocaleDateString('pt-BR') + ' ' +
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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
        title: 'Minha Aposta - Fazendinha',
        text: `Pule #${puleNumber} - FAZENDINHA (${modalidade?.nome}) - R$ ${formatCurrency(total)}`,
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
            <span className="text-base font-bold text-white">FAZENDINHA</span>
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
        <div className="px-4 pt-3 pb-2 bg-[#111318] shrink-0">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div
                  className={cn(
                    'h-1.5 w-full rounded-full transition-all duration-300',
                    i <= stepIndex ? 'bg-green-500' : 'bg-zinc-700/40'
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
                <h1 className="text-2xl font-bold text-green-500 mb-1" style={{ fontFamily: 'serif' }}>
                  FAZENDINHA
                </h1>
                <p className="text-zinc-500 text-sm mb-6">SELECIONE O DIA</p>

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

            {/* ═══ STEP: CONFIG (modalidade + valor + loteria) ═══ */}
            {step === 'config' && (
              <div className="p-4">
                {/* Modalidade Tabs */}
                <div className="flex justify-center gap-2 mb-4">
                  {FAZENDINHA_MODALIDADES.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setSelectedModalidade(mod.id);
                        const newValores = getValoresByModalidade(mod.id);
                        if (!newValores.includes(selectedValor)) setSelectedValor(newValores[0]);
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
                  {valores.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedValor(v)}
                      className={cn(
                        'px-4 py-2 rounded-xl font-medium text-sm active:scale-[0.98] transition-all',
                        selectedValor === v
                          ? 'bg-[#1A1F2B] border-2 border-zinc-700/40 text-white shadow-sm'
                          : 'bg-[#1A1F2B]/70 border border-zinc-700/40 text-zinc-400 hover:bg-[#1A1F2B]'
                      )}
                    >
                      R$ {v.toFixed(2).replace('.', ',')}
                    </button>
                  ))}
                </div>

                {/* Loterias Cards */}
                <h3 className="text-white font-bold mb-3">SELECIONAR LOTERIA</h3>
                <div className="space-y-3">
                  {FAZENDINHA_LOTERIAS.map((lot) => (
                    <button
                      key={lot.id}
                      onClick={() => handleSelectLoteria(lot.id)}
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
                          {lot.nome} - {lot.horario}
                        </span>
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ STEP: NUMEROS ═══ */}
            {step === 'numeros' && (
              <div className="flex flex-col pb-32">
                {/* Info Header */}
                <div className="px-4 pt-4 pb-3 border-b border-zinc-700/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">FAZENDINHA</h2>
                      <p className="text-sm text-zinc-500">{selectedNumbers.length} PALPITES</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-red-500">{modalidade?.nome}</span>
                      <p className="text-sm text-zinc-400">
                        R$ {selectedValor.toFixed(2).replace('.', ',')} pra R${' '}
                        {formatPremio(selectedValor, modalidade?.multiplicador || 1)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Numbers Grid */}
                <div className="p-4">
                  <div
                    className={cn(
                      'grid gap-1.5',
                      selectedModalidade === 'grupo' ? 'grid-cols-5' : 'grid-cols-6'
                    )}
                  >
                    {numbers.map((num) => {
                      const isSelected = selectedNumbers.includes(num);
                      return (
                        <button
                          key={num}
                          onClick={() => toggleNumber(num)}
                          className={cn(
                            'py-2 rounded-xl text-sm font-medium active:scale-[0.98] transition-all',
                            isSelected
                              ? 'bg-[#4CAF50] text-white'
                              : 'bg-[#1A1F2B] border border-zinc-700/40 text-white'
                          )}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fixed Bottom */}
                <div className="fixed bottom-0 left-0 right-0 bg-[#1A1F2B] border-t border-zinc-700/40 max-w-md mx-auto">
                  <div className="px-4 py-3 border-b border-dashed border-zinc-700/40">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-zinc-400">Total:</span>
                      <span className="text-xl font-bold text-white">R$ {formatCurrency(total)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <button
                      onClick={() => goTo('confirmar')}
                      disabled={selectedNumbers.length === 0}
                      className="w-full h-14 rounded-xl bg-[#E5A220] text-zinc-900 font-bold text-lg disabled:opacity-50 active:scale-[0.98] transition-all"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP: CONFIRMAR ═══ */}
            {step === 'confirmar' && (
              <div className="p-4">
                {/* Error */}
                {error && (
                  <div className="bg-red-600 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-lg mb-4">
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-2">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Receipt Card */}
                <div className="bg-[#1A1F2B] rounded-xl border-2 border-dashed border-zinc-700/40 p-4">
                  <div className="text-sm font-medium text-zinc-300 mb-2">
                    PULE #{puleNumber || '...'}
                  </div>

                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-white mb-2">{config.site_name.toUpperCase()}</h2>
                    <div className="flex justify-center">
                      {config.logo_url ? (
                        <Image
                          src={config.logo_url}
                          alt={config.site_name}
                          width={96}
                          height={64}
                          className="object-contain"
                          unoptimized={config.logo_url.includes('supabase.co')}
                        />
                      ) : (
                        <div className="w-24 h-16 bg-zinc-800 rounded-xl flex items-center justify-center">
                          <span className="text-[#E5A220] font-bold text-sm text-center">{config.site_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center my-3">
                    <div className="flex-1 border-t border-zinc-700/40" />
                    <span className="px-3 text-sm font-medium text-zinc-300">VALE: {formattedDate}</span>
                    <div className="flex-1 border-t border-zinc-700/40" />
                  </div>

                  <div className="flex justify-between mb-4">
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 uppercase">Vendedor</div>
                      <div className="text-lg font-bold text-white">979536</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 uppercase">Status</div>
                      <div className={cn('text-lg font-bold', isConfirmed ? 'text-green-400' : 'text-yellow-400')}>
                        {isConfirmed ? 'Registrada' : 'Pendente'}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-700/40 my-3" />

                  <div className="text-center font-bold text-white mb-2">
                    FAZENDINHA<br />({modalidade?.nome})
                  </div>

                  <ul className="mb-3 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                      R$ {selectedValor.toFixed(2).replace('.', ',')} pra R${' '}
                      {formatPremio(selectedValor, modalidade?.multiplicador || 1)}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                      {loteria?.nome}
                    </li>
                  </ul>

                  <div className="flex items-center my-3">
                    <div className="flex-1 border-t border-zinc-700/40" />
                    <span className="px-3 text-xs font-medium text-zinc-300">PALPITES<br />(1o PREMIO)</span>
                    <div className="flex-1 border-t border-zinc-700/40" />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3 justify-center">
                    {selectedNumbers.map((num) => (
                      <span key={num} className="inline-flex items-center px-3 py-1 border border-zinc-700/40 rounded text-sm font-medium text-white">
                        {num}
                      </span>
                    ))}
                  </div>

                  <div className="border-t-2 border-dashed border-zinc-700/40 my-4" />

                  <div className="text-center py-2">
                    <span className="text-xl font-bold text-white">
                      TOTAL: R$ {formatCurrency(total)}
                    </span>
                  </div>

                  <div className="border-t-2 border-dashed border-zinc-700/40 my-4" />

                  <p className="text-sm text-zinc-400 text-center">
                    Pules de fazendinha nao podem ser canceladas.
                  </p>

                  {isConfirmed && (
                    <div className="text-center mt-4">
                      <p className="text-sm font-bold text-white">{confirmationTime}</p>
                      {novoSaldo !== null && (
                        <p className="text-sm text-green-400 mt-1">
                          Novo saldo: R$ {formatCurrency(novoSaldo)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-dashed border-zinc-700/40 my-6" />

                {/* Action Buttons */}
                {!isConfirmed ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={goBack}
                      disabled={isLoading}
                      className="h-14 bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <Home className="h-5 w-5" />
                      Voltar
                    </button>
                    <button
                      onClick={handleFinalizar}
                      disabled={isLoading}
                      className="h-14 bg-[#E5A220] text-zinc-900 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
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
                  <button
                    onClick={handleShare}
                    className="w-full h-14 bg-zinc-900 border border-zinc-700/40 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <FileText className="h-5 w-5" />
                    Compartilhar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
