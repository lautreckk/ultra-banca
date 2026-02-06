'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { Check, ChevronDown, AlertCircle, Loader2, CheckCircle, Smartphone, Mail, Key, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { createClient } from '@/lib/supabase/client';
import { trackWithdrawalRequest } from '@/lib/actions/auth';
import { useAdPopup } from '@/hooks/use-ad-popup';
import { AdPopup } from '@/components/shared/ad-popup';

const keyTypes = [
  { value: 'cpf', label: 'CPF', icon: CreditCard, placeholder: '000.000.000-00' },
  { value: 'telefone', label: 'Telefone', icon: Smartphone, placeholder: '+55 11 99999-9999' },
  { value: 'email', label: 'E-mail', icon: Mail, placeholder: 'seu@email.com' },
  { value: 'aleatoria', label: 'Chave aleatória', icon: Key, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
];

const quickAmounts = [20, 50, 100, 200, 500, 1000];

export default function NovoSaquePage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'confirm' | 'success' | 'error'>('form');
  const [selectedKeyType, setSelectedKeyType] = useState<typeof keyTypes[0] | null>(null);
  const [chavePix, setChavePix] = useState('');
  const [amount, setAmount] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saldo, setSaldo] = useState(0);
  const [result, setResult] = useState<{
    valor: number;
    valorLiquido: number;
    taxa: number;
    chavePix: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { currentAd, isVisible, showAd, closeAd } = useAdPopup('saque');

  const [config, setConfig] = useState({
    minWithdrawal: 20,
    maxWithdrawal: 5000,
    feePercent: 0,
  });

  // Fetch user balance and platform config
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('saldo')
          .eq('id', user.id)
          .single();
        if (data) {
          setSaldo(Number(data.saldo) || 0);
        }
      }

      // Fetch platform config
      const { data: platformData } = await supabase
        .from('platform_config')
        .select('withdrawal_min, withdrawal_max, withdrawal_fee_percent')
        .limit(1)
        .single();

      if (platformData) {
        setConfig({
          minWithdrawal: Number(platformData.withdrawal_min) || 20,
          maxWithdrawal: Number(platformData.withdrawal_max) || 5000,
          feePercent: Number(platformData.withdrawal_fee_percent) || 0,
        });
      }
    };
    fetchData();
  }, [supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyTypeSelect = (keyType: typeof keyTypes[0]) => {
    setSelectedKeyType(keyType);
    setIsDropdownOpen(false);
    setChavePix('');
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setAmount(numericValue);
    setError('');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const calculateFee = () => {
    const valor = parseInt(amount) || 0;
    const taxa = Number((valor * config.feePercent / 100).toFixed(2));
    const liquido = Number((valor - taxa).toFixed(2));
    return { valor, taxa, liquido };
  };

  const handleAdvance = () => {
    const valorNum = parseInt(amount);

    if (!selectedKeyType) {
      setError('Selecione o tipo de chave PIX');
      return;
    }

    if (!chavePix.trim()) {
      setError('Informe a chave PIX');
      return;
    }

    if (!valorNum || valorNum < config.minWithdrawal) {
      setError(`Valor mínimo: ${formatCurrency(config.minWithdrawal)}`);
      return;
    }

    if (valorNum > config.maxWithdrawal) {
      setError(`Valor máximo: ${formatCurrency(config.maxWithdrawal)}`);
      return;
    }

    if (valorNum > saldo) {
      setError('Saldo insuficiente');
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-withdrawal', {
        body: {
          valor: parseInt(amount),
          chavePix: chavePix.trim(),
          tipoChave: selectedKeyType?.value,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar saque');
      }

      // Rastrear solicitação de saque para auditoria
      await trackWithdrawalRequest(
        data.saque.id,
        data.saque.valor,
        data.saque.chavePix
      );

      setResult({
        valor: data.saque.valor,
        valorLiquido: data.saque.valorLiquido,
        taxa: data.saque.taxa,
        chavePix: data.saque.chavePix,
      });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar saque');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Show ad popup when withdrawal is successful
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        showAd();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, showAd]);

  // Success screen
  if (step === 'success' && result) {
    return (
      <PageLayout title="Saque Solicitado" showBack>
        <div className="bg-[#111318] min-h-screen p-4">
          <div className="text-center py-12">
            <CheckCircle className="h-20 w-20 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Saque Pendente</h2>
            <p className="text-zinc-400 mb-6">
              Seu saque foi registrado e está aguardando aprovação. Você será notificado assim que for processado.
            </p>

            <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <span className="text-zinc-500">Valor solicitado</span>
                <span className="font-medium">{formatCurrency(result.valor)}</span>
              </div>
              {result.taxa > 0 && (
                <div className="flex justify-between py-2 border-b border-zinc-700/40">
                  <span className="text-zinc-500">Taxa ({config.feePercent}%)</span>
                  <span className="font-medium text-red-500">-{formatCurrency(result.taxa)}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-zinc-300 font-medium">Valor a receber</span>
                <span className="font-bold text-green-600">{formatCurrency(result.valorLiquido)}</span>
              </div>
            </div>

            <p className="text-sm text-zinc-500 mb-6">
              Chave PIX: {result.chavePix}
            </p>

            <div className="space-y-3 max-w-xs mx-auto">
              <button
                onClick={() => router.push('/saques')}
                className="w-full h-14 min-h-[56px] rounded-xl bg-[#E5A220] font-bold text-zinc-900 active:scale-[0.98] transition-all"
                aria-label="Ver meus saques"
              >
                Ver Meus Saques
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full h-14 min-h-[56px] rounded-xl bg-zinc-900 border border-zinc-700/40 font-bold text-zinc-300 active:scale-[0.98] transition-all"
                aria-label="Voltar ao início"
              >
                Voltar ao Início
              </button>
            </div>
          </div>

          {/* Ad Popup */}
          {isVisible && currentAd && (
            <AdPopup ad={currentAd} onClose={closeAd} />
          )}
        </div>
      </PageLayout>
    );
  }

  // Confirmation screen
  if (step === 'confirm') {
    const { valor, taxa, liquido } = calculateFee();

    return (
      <PageLayout title="Confirmar Saque" showBack>
        <div className="bg-[#111318] min-h-screen p-4">
          <div className="py-6">
            <h2 className="text-xl font-bold text-white mb-6 text-center">
              Confirme os dados do saque
            </h2>

            <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-4 mb-6">
              <div className="flex justify-between py-3 border-b border-zinc-700/40">
                <span className="text-zinc-500">Tipo de chave</span>
                <span className="font-medium">{selectedKeyType?.label}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-zinc-700/40">
                <span className="text-zinc-500">Chave PIX</span>
                <span className="font-medium text-sm break-all max-w-[180px] text-right">{chavePix}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-zinc-700/40">
                <span className="text-zinc-500">Valor solicitado</span>
                <span className="font-medium">{formatCurrency(valor)}</span>
              </div>
              {config.feePercent > 0 && (
                <div className="flex justify-between py-3 border-b border-zinc-700/40">
                  <span className="text-zinc-500">Taxa ({config.feePercent}%)</span>
                  <span className="font-medium text-red-500">-{formatCurrency(taxa)}</span>
                </div>
              )}
              <div className="flex justify-between py-3">
                <span className="text-zinc-300 font-bold">Valor a receber</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(liquido)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-xl flex items-center gap-2 text-red-400 mb-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full h-14 min-h-[56px] rounded-xl bg-[#E5A220] font-bold text-zinc-900 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
                aria-label="Confirmar saque"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Saque'
                )}
              </button>
              <button
                onClick={() => setStep('form')}
                disabled={loading}
                className="w-full h-14 min-h-[56px] rounded-xl bg-zinc-900 border border-zinc-700/40 font-bold text-zinc-300 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error screen
  if (step === 'error') {
    return (
      <PageLayout title="Erro no Saque" showBack>
        <div className="bg-[#111318] min-h-screen p-4">
          <div className="text-center py-12">
            <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Erro ao Processar</h2>
            <p className="text-zinc-400 mb-6">{error || 'Ocorreu um erro ao processar seu saque.'}</p>

            <div className="space-y-3 max-w-xs mx-auto">
              <button
                onClick={() => { setStep('form'); setError(''); }}
                className="w-full h-14 min-h-[56px] rounded-xl bg-[#E5A220] font-bold text-zinc-900 active:scale-[0.98] transition-all"
                aria-label="Tentar novamente"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => router.push('/saques')}
                className="w-full h-14 min-h-[56px] rounded-xl bg-zinc-900 border border-zinc-700/40 font-bold text-zinc-300 active:scale-[0.98] transition-all"
                aria-label="Ver meus saques"
              >
                Ver Meus Saques
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Form screen
  const { taxa, liquido } = calculateFee();

  return (
    <PageLayout title="Novo Saque" showBack>
      <div className="bg-[#111318] min-h-screen p-4 space-y-4">
        {/* PIX Option */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-700/40 bg-[#1A1F2B] px-4 py-3">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#32BCAD"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#32BCAD" strokeWidth="2"/>
            </svg>
            <span className="font-medium">PIX</span>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded bg-green-500">
            <Check className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Withdrawal Rules */}
        <div className="rounded-xl bg-amber-900/20 border border-amber-700/30 p-4 space-y-2">
          <h3 className="font-bold text-white">Regras de saque</h3>
          <p className="text-sm text-zinc-400">
            Os saques podem ser feitos para qualquer chave PIX, desde que sejam feitos para sua{' '}
            <span className="text-blue-600 font-medium">titularidade.</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-white"><span className="font-medium">Horário:</span> 24h</p>
            <p className="text-white"><span className="font-medium">Taxa:</span> {config.feePercent}%</p>
            <p className="text-white"><span className="font-medium">Mínimo:</span> {formatCurrency(config.minWithdrawal)}</p>
            <p className="text-white"><span className="font-medium">Máximo:</span> {formatCurrency(config.maxWithdrawal)}</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-3 flex justify-between items-center">
          <span className="text-zinc-400">Saldo disponível:</span>
          <span className="font-bold text-lg">{formatCurrency(saldo)}</span>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-xl flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* PIX Key Type Dropdown */}
        <div className="rounded-xl border border-zinc-700/40 bg-[#1A1F2B] p-4">
          <h3 className="font-bold text-white mb-3">Dados do PIX</h3>

          {/* Custom Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between rounded-xl border border-zinc-700/40 px-4 h-14 min-h-[48px] text-left bg-zinc-900/80 hover:border-zinc-600 transition-colors"
            >
              {selectedKeyType ? (
                <div className="flex items-center gap-3">
                  <selectedKeyType.icon className="h-5 w-5 text-zinc-500" />
                  <span className="text-white">{selectedKeyType.label}</span>
                </div>
              ) : (
                <span className="text-zinc-500">Selecione o tipo de chave</span>
              )}
              <ChevronDown className={`h-5 w-5 text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-[#111318] border border-zinc-700/40 rounded-xl shadow-lg overflow-hidden">
                {keyTypes.map((keyType) => (
                  <button
                    key={keyType.value}
                    type="button"
                    onClick={() => handleKeyTypeSelect(keyType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-700/30 transition-colors ${
                      selectedKeyType?.value === keyType.value ? 'bg-amber-900/20 border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    <keyType.icon className={`h-5 w-5 ${selectedKeyType?.value === keyType.value ? 'text-amber-600' : 'text-zinc-500'}`} />
                    <span className={selectedKeyType?.value === keyType.value ? 'text-amber-400 font-medium' : 'text-zinc-300'}>
                      {keyType.label}
                    </span>
                    {selectedKeyType?.value === keyType.value && (
                      <Check className="h-4 w-4 text-amber-600 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PIX Key Input */}
          {selectedKeyType && (
            <div className="mt-3">
              <input
                type="text"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                placeholder={selectedKeyType.placeholder}
                aria-label="Chave PIX"
                className="w-full h-14 min-h-[48px] rounded-xl border border-zinc-700/40 bg-zinc-900/80 px-4 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base"
              />
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="rounded-xl border border-zinc-700/40 bg-[#1A1F2B] p-4">
          <h3 className="font-bold text-white mb-3">Valor do saque</h3>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
            <input
              type="tel"
              inputMode="numeric"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0,00"
              aria-label="Valor do saque"
              className="w-full h-14 min-h-[48px] rounded-xl border border-zinc-700/40 bg-zinc-900/80 pl-12 pr-4 text-lg font-semibold text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base"
            />
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickAmount(value)}
                disabled={value > saldo}
                className={`h-11 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${
                  amount === value.toString()
                    ? 'bg-[#E5A220] text-zinc-900 font-bold'
                    : value > saldo
                    ? 'bg-zinc-900 border border-zinc-700/40 text-zinc-500 cursor-not-allowed'
                    : 'bg-zinc-900 border border-zinc-700/40 text-zinc-300 hover:bg-zinc-700/30'
                }`}
              >
                {formatCurrency(value)}
              </button>
            ))}
          </div>

          {/* Fee Preview */}
          {parseInt(amount) > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-700/40">
              {config.feePercent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Taxa ({config.feePercent}%)</span>
                  <span className="text-red-500">-{formatCurrency(taxa)}</span>
                </div>
              )}
              <div className="flex justify-between mt-1">
                <span className="font-medium text-zinc-300">Você receberá</span>
                <span className="font-bold text-green-600">{formatCurrency(liquido)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleAdvance}
          className="w-full h-14 min-h-[56px] rounded-xl bg-[#E5A220] font-bold text-zinc-900 active:scale-[0.98] transition-all"
          aria-label="Avançar"
        >
          Avançar
        </button>
      </div>
    </PageLayout>
  );
}
