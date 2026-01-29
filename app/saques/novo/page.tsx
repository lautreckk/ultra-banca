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

const quickAmounts = [10, 20, 50, 100, 200, 500];

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

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
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
    };
    fetchBalance();
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
    const taxa = Number((valor * 0.01).toFixed(2));
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

    if (!valorNum || valorNum < 1) {
      setError('Valor mínimo: R$ 1,00');
      return;
    }

    if (valorNum > 5000) {
      setError('Valor máximo: R$ 5.000,00');
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
        <div className="bg-white min-h-screen p-4">
          <div className="text-center py-12">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Saque Solicitado!</h2>
            <p className="text-gray-600 mb-6">
              Seu saque está sendo processado e será enviado em breve.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Valor solicitado</span>
                <span className="font-medium">{formatCurrency(result.valor)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Taxa (1%)</span>
                <span className="font-medium text-red-500">-{formatCurrency(result.taxa)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700 font-medium">Valor a receber</span>
                <span className="font-bold text-green-600">{formatCurrency(result.valorLiquido)}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Chave PIX: {result.chavePix}
            </p>

            <div className="space-y-3 max-w-xs mx-auto">
              <button
                onClick={() => router.push('/saques')}
                className="w-full rounded-lg bg-[#1A202C] py-3 font-bold text-white"
              >
                Ver Meus Saques
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-lg border-2 border-gray-300 py-3 font-bold text-gray-700"
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
        <div className="bg-white min-h-screen p-4">
          <div className="py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Confirme os dados do saque
            </h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-500">Tipo de chave</span>
                <span className="font-medium">{selectedKeyType?.label}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-500">Chave PIX</span>
                <span className="font-medium text-sm break-all max-w-[180px] text-right">{chavePix}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-500">Valor solicitado</span>
                <span className="font-medium">{formatCurrency(valor)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-500">Taxa (1%)</span>
                <span className="font-medium text-red-500">-{formatCurrency(taxa)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-700 font-bold">Valor a receber</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(liquido)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 mb-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full rounded-lg bg-[#E5A220] py-3 font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
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
                className="w-full rounded-lg border-2 border-gray-300 py-3 font-bold text-gray-700 disabled:opacity-50"
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
        <div className="bg-white min-h-screen p-4">
          <div className="text-center py-12">
            <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Processar</h2>
            <p className="text-gray-600 mb-6">{error || 'Ocorreu um erro ao processar seu saque.'}</p>

            <div className="space-y-3 max-w-xs mx-auto">
              <button
                onClick={() => { setStep('form'); setError(''); }}
                className="w-full rounded-lg bg-[#1A202C] py-3 font-bold text-white"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => router.push('/saques')}
                className="w-full rounded-lg border-2 border-gray-300 py-3 font-bold text-gray-700"
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
      <div className="bg-white min-h-screen p-4 space-y-4">
        {/* PIX Option */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
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
        <div className="rounded-lg bg-amber-50 p-4 space-y-2">
          <h3 className="font-bold text-gray-800">Regras de saque</h3>
          <p className="text-sm text-gray-600">
            Os saques podem ser feitos para qualquer chave PIX, desde que sejam feitos para sua{' '}
            <span className="text-blue-600 font-medium">titularidade.</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-gray-800"><span className="font-medium">Horário:</span> 24h</p>
            <p className="text-gray-800"><span className="font-medium">Taxa:</span> 1%</p>
            <p className="text-gray-800"><span className="font-medium">Mínimo:</span> R$ 1,00</p>
            <p className="text-gray-800"><span className="font-medium">Máximo:</span> R$ 5.000,00</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-gray-100 rounded-lg p-3 flex justify-between items-center">
          <span className="text-gray-600">Saldo disponível:</span>
          <span className="font-bold text-lg">{formatCurrency(saldo)}</span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* PIX Key Type Dropdown */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="font-bold text-gray-800 mb-3">Dados do PIX</h3>

          {/* Custom Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-300 px-4 py-3 text-left bg-white hover:border-gray-400 transition-colors"
            >
              {selectedKeyType ? (
                <div className="flex items-center gap-3">
                  <selectedKeyType.icon className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-800">{selectedKeyType.label}</span>
                </div>
              ) : (
                <span className="text-gray-500">Selecione o tipo de chave</span>
              )}
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {keyTypes.map((keyType) => (
                  <button
                    key={keyType.value}
                    type="button"
                    onClick={() => handleKeyTypeSelect(keyType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      selectedKeyType?.value === keyType.value ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    <keyType.icon className={`h-5 w-5 ${selectedKeyType?.value === keyType.value ? 'text-amber-600' : 'text-gray-500'}`} />
                    <span className={selectedKeyType?.value === keyType.value ? 'text-amber-800 font-medium' : 'text-gray-700'}>
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="font-bold text-gray-800 mb-3">Valor do saque</h3>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
            <input
              type="tel"
              inputMode="numeric"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-lg font-semibold focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                className={`py-2 rounded-lg font-medium text-sm transition-all ${
                  amount === value.toString()
                    ? 'bg-amber-500 text-white'
                    : value > saldo
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatCurrency(value)}
              </button>
            ))}
          </div>

          {/* Fee Preview */}
          {parseInt(amount) > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxa (1%)</span>
                <span className="text-red-500">-{formatCurrency(taxa)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-medium text-gray-700">Você receberá</span>
                <span className="font-bold text-green-600">{formatCurrency(liquido)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleAdvance}
          className="w-full rounded-lg bg-[#1A202C] py-3 font-bold text-white"
        >
          Avançar
        </button>
      </div>
    </PageLayout>
  );
}
