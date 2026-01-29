'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, AlertCircle, Clock, CheckCircle, RefreshCw, Gamepad2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { formatCurrency } from '@/lib/utils/format-currency';
import { createClient } from '@/lib/supabase/client';
import { useAdPopup } from '@/hooks/use-ad-popup';
import { AdPopup } from '@/components/shared/ad-popup';
import { trackPurchase, trackInitiateCheckout, generateEventId } from '@/lib/tracking/facebook';

const quickAmounts = [10, 20, 50, 100, 200, 500];

interface PaymentData {
  id: string;
  valor: number;
  status: string;
  pixQrCode?: string;
  pixCopyPaste: string;
  orderNumber: string;
}

export default function RecargaPixPage() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'CANCELLED'>('PENDING');
  const [checking, setChecking] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { currentAd, isVisible, showAd, closeAd } = useAdPopup('deposito');

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setAmount(numericValue);
    setError('');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const handleGeneratePix = async () => {
    const valorNum = parseInt(amount);

    if (!valorNum || valorNum <= 0) {
      setError('Informe um valor válido');
      return;
    }

    if (valorNum < 5) {
      setError('Valor mínimo: R$ 5,00');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Você precisa estar logado');
      }

      // Call Supabase Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          valor: valorNum,
          tipo: 'deposito',
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao criar pagamento');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar pagamento');
      }

      setPaymentData({
        id: data.pagamento.id,
        valor: data.pagamento.valor,
        status: data.pagamento.status,
        pixQrCode: data.pagamento.pixQrCode,
        pixCopyPaste: data.pagamento.pixCopyPaste,
        orderNumber: data.pagamento.orderNumber,
      });
      setStatus('PENDING');

      // Dispara evento InitiateCheckout no Facebook Pixel
      const eventId = generateEventId('checkout', data.pagamento.id);
      trackInitiateCheckout(valorNum, eventId);
      console.log('[Tracking] InitiateCheckout disparado:', { valor: valorNum, eventId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code when payment data is available (dynamic import)
  useEffect(() => {
    if (paymentData?.pixCopyPaste) {
      if (paymentData.pixQrCode && paymentData.pixQrCode.startsWith('data:')) {
        setQrCodeDataUrl(paymentData.pixQrCode);
      } else if (paymentData.pixCopyPaste) {
        import('qrcode').then((QRCode) => {
          QRCode.toDataURL(paymentData.pixCopyPaste, {
            width: 250,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          }).then(setQrCodeDataUrl).catch(console.error);
        });
      }
    }
  }, [paymentData]);

  // Função para verificar status na API da BSPAY
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentData) return false;

    try {
      const { data, error } = await supabase.functions.invoke('check-pix-status', {
        body: { pagamentoId: paymentData.id },
      });

      if (error) {
        console.error('Error checking status:', error);
        return false;
      }

      console.log('[Check Status] Response:', data);

      if (data.status === 'PAID') {
        setStatus('PAID');
        return true;
      } else if (data.status === 'CANCELLED') {
        setStatus('CANCELLED');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }, [paymentData, supabase]);

  // Poll for payment status (a cada 10 segundos para escalar bem com 1000+ usuários)
  useEffect(() => {
    if (!paymentData || status !== 'PENDING') return;

    // Verifica imediatamente após gerar o PIX (depois de 3 segundos)
    const initialCheck = setTimeout(() => {
      checkPaymentStatus();
    }, 3000);

    // Depois verifica a cada 10 segundos
    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 10000);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [paymentData, status, checkPaymentStatus]);

  // Track purchase and show ad popup when payment is confirmed
  useEffect(() => {
    if (status === 'PAID' && paymentData) {
      // Dispara evento Purchase no Facebook Pixel
      const eventId = generateEventId('dep', paymentData.id);
      trackPurchase(paymentData.valor, eventId);

      const timer = setTimeout(() => {
        showAd();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, showAd, paymentData]);

  const handleCopyPix = async () => {
    if (!paymentData?.pixCopyPaste) return;

    try {
      await navigator.clipboard.writeText(paymentData.pixCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = paymentData.pixCopyPaste;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleManualCheck = async () => {
    if (!paymentData) return;
    setChecking(true);
    await checkPaymentStatus();
    setChecking(false);
  };

  const handleNewPix = () => {
    setPaymentData(null);
    setAmount('');
    setQrCodeDataUrl('');
    setStatus('PENDING');
  };

  // Payment confirmed screen
  if (status === 'PAID') {
    return (
      <PageLayout title="RECARGA PIX">
        <div className="bg-white min-h-screen p-4">
          <div className="text-center py-12">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h2>
            <p className="text-gray-600 mb-4">
              Seu depósito de {formatCurrency(paymentData?.valor || 0)} foi processado com sucesso.
            </p>
            <p className="text-sm text-gray-500 mb-8">Pedido: {paymentData?.orderNumber}</p>
            <div className="space-y-3 max-w-xs mx-auto">
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-lg bg-[#E5A220] py-3 font-bold text-white flex items-center justify-center gap-2"
              >
                <Gamepad2 className="h-5 w-5" />
                Voltar ao Jogo
              </button>
              <button
                onClick={handleNewPix}
                className="w-full rounded-lg border-2 border-[#1A202C] py-3 font-bold text-[#1A202C]"
              >
                Nova Recarga
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

  // Loading state: show overlay while generating PIX or waiting for QR code
  const isGeneratingPix = loading || (paymentData && !qrCodeDataUrl);

  return (
    <PageLayout title="RECARGA PIX">
      <div className="bg-white min-h-screen relative">
        {/* Loading Overlay */}
        {isGeneratingPix && (
          <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center min-h-[calc(100vh-7.5rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-[#E5A220] rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-semibold text-gray-800">Gerando PIX...</p>
              <p className="text-sm text-gray-500">Aguarde um momento</p>
            </div>
          </div>
        )}
        {!paymentData ? (
          <div className="p-4 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor da recarga
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  R$
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-lg font-semibold"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Valor mínimo: R$ 5,00</p>
            </div>

            {/* Quick Amounts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valores rápidos
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleQuickAmount(value)}
                    className={`py-3 rounded-lg font-semibold transition-all active:scale-[0.98] ${
                      amount === value.toString()
                        ? 'bg-[#E5A220] text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {formatCurrency(value)}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGeneratePix}
              disabled={loading || !amount || parseInt(amount) <= 0}
              className="w-full rounded-lg bg-[#1A202C] py-3 font-bold text-white disabled:opacity-50"
            >
              {loading ? 'Gerando PIX...' : 'Gerar PIX'}
            </button>

            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Informações:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• O depósito é instantâneo via PIX</li>
                <li>• Valor mínimo: R$ 5,00</li>
                <li>• Sem taxa de depósito</li>
                <li>• Saldo disponível imediatamente após confirmação</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center py-6 bg-white rounded-xl border border-gray-200">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code PIX"
                  className="w-56 h-56 mb-4"
                />
              ) : (
                <div className="w-56 h-56 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-12 w-12 text-gray-400 animate-pulse" />
                </div>
              )}
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(paymentData.valor)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Pedido: {paymentData.orderNumber}</p>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyPix}
              className={`w-full rounded-lg py-3 font-bold text-white flex items-center justify-center gap-2 ${
                copied ? 'bg-green-500' : 'bg-[#1A202C]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  Copiar código PIX
                </>
              )}
            </button>

            {/* Status indicator */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
                <div>
                  <p className="font-medium text-yellow-800">Aguardando pagamento...</p>
                  <p className="text-sm text-yellow-600">
                    Escaneie o QR Code ou copie o código para pagar.
                  </p>
                </div>
              </div>
            </div>

            {/* Manual check button */}
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Verificando...' : 'Já paguei, verificar pagamento'}
            </button>

            {/* New Pix Button */}
            <button
              onClick={handleNewPix}
              className="w-full rounded-lg border-2 border-gray-300 py-3 font-bold text-gray-700"
            >
              Cancelar / Nova Recarga
            </button>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Como pagar:</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com PIX</li>
                <li>Escaneie o QR Code ou cole o código copiado</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
