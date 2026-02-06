'use client';

import { useState, useEffect } from 'react';
import { Copy, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

interface PixPaymentProps {
  pagamentoId: string;
  pixCopyPaste: string;
  pixQrCode?: string;
  valor: number;
  orderNumber: string;
  onPaymentConfirmed?: () => void;
  onPaymentCancelled?: () => void;
}

export default function PixPayment({
  pagamentoId,
  pixCopyPaste,
  pixQrCode,
  valor,
  orderNumber,
  onPaymentConfirmed,
  onPaymentCancelled,
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'CANCELLED'>('PENDING');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [checking, setChecking] = useState(false);

  // Generate QR Code from pix copy/paste if not provided (dynamic import)
  useEffect(() => {
    if (pixQrCode) {
      setQrCodeDataUrl(pixQrCode);
    } else if (pixCopyPaste) {
      import('qrcode').then((QRCode) => {
        QRCode.toDataURL(pixCopyPaste, {
          width: 250,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        }).then(setQrCodeDataUrl).catch(console.error);
      });
    }
  }, [pixQrCode, pixCopyPaste]);

  // Poll for payment status
  useEffect(() => {
    if (status !== 'PENDING') return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status/${pagamentoId}`);
        const data = await response.json();

        if (data.status === 'PAID') {
          setStatus('PAID');
          onPaymentConfirmed?.();
        } else if (data.status === 'CANCELLED') {
          setStatus('CANCELLED');
          onPaymentCancelled?.();
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [pagamentoId, status, onPaymentConfirmed, onPaymentCancelled]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = pixCopyPaste;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/payments/status/${pagamentoId}`);
      const data = await response.json();

      if (data.status === 'PAID') {
        setStatus('PAID');
        onPaymentConfirmed?.();
      } else if (data.status === 'CANCELLED') {
        setStatus('CANCELLED');
        onPaymentCancelled?.();
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
    setChecking(false);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (status === 'PAID') {
    return (
      <div className="bg-[#1A1F2B] rounded-lg p-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Pagamento Confirmado!</h2>
        <p className="text-zinc-400 mb-4">Seu pagamento de {formatCurrency(valor)} foi processado com sucesso.</p>
        <p className="text-sm text-zinc-500">Pedido: {orderNumber}</p>
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <div className="bg-[#1A1F2B] rounded-lg p-6 text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Pagamento Cancelado</h2>
        <p className="text-zinc-400">O pagamento foi cancelado ou expirou.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Pagar com PIX</h2>
        <p className="text-2xl font-bold text-green-400">{formatCurrency(valor)}</p>
        <p className="text-sm text-zinc-500">Pedido: {orderNumber}</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        {qrCodeDataUrl ? (
          <img
            src={qrCodeDataUrl}
            alt="QR Code PIX"
            className="w-64 h-64 border border-zinc-700/40 rounded-lg"
          />
        ) : (
          <div className="w-64 h-64 bg-zinc-800/50 rounded-lg flex items-center justify-center">
            <Clock className="h-8 w-8 text-zinc-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Copy/Paste */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          Ou copie o código PIX:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={pixCopyPaste}
            className="flex-1 px-3 py-2 bg-zinc-800/50 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 truncate"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-zinc-700 text-white hover:bg-zinc-600'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
          <div>
            <p className="font-medium text-yellow-400">Aguardando pagamento...</p>
            <p className="text-sm text-yellow-500/80">
              Escaneie o QR Code ou copie o código para pagar no app do seu banco.
            </p>
          </div>
        </div>
      </div>

      {/* Manual check button */}
      <button
        onClick={handleManualCheck}
        disabled={checking}
        className="w-full py-3 bg-zinc-800/50 text-zinc-300 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-zinc-700/50 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
        {checking ? 'Verificando...' : 'Já paguei, verificar pagamento'}
      </button>

      {/* Instructions */}
      <div className="mt-6 pt-4 border-t border-zinc-700/40">
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Como pagar:</h3>
        <ol className="text-sm text-zinc-500 space-y-1 list-decimal list-inside">
          <li>Abra o app do seu banco</li>
          <li>Escolha pagar com PIX</li>
          <li>Escaneie o QR Code ou cole o código copiado</li>
          <li>Confirme o pagamento</li>
        </ol>
      </div>
    </div>
  );
}
