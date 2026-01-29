'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, RefreshCw, Loader2, Smartphone, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { connectInstance, getConnectionState } from '@/lib/admin/actions/evolution';

interface QRCodeModalProps {
  instanceName: string;
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function QRCodeModal({ instanceName, isOpen, onClose, onConnected }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchQRCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await connectInstance(instanceName);

      if (result.success && result.qrcode) {
        setQrCode(result.qrcode);
      } else {
        setError(result.error || 'Não foi possível obter o QR Code');
      }
    } catch {
      setError('Erro ao conectar com a Evolution API');
    } finally {
      setIsLoading(false);
    }
  }, [instanceName]);

  const checkConnection = useCallback(async () => {
    const result = await getConnectionState(instanceName);

    if (result.success && result.state === 'open') {
      setIsConnected(true);
      onConnected?.();
    }
  }, [instanceName, onConnected]);

  useEffect(() => {
    if (isOpen && !isConnected) {
      fetchQRCode();

      // Verificar conexão a cada 3 segundos
      const interval = setInterval(checkConnection, 3000);

      return () => clearInterval(interval);
    }
  }, [isOpen, isConnected, fetchQRCode, checkConnection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Smartphone className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Conectar WhatsApp</h3>
              <p className="text-sm text-zinc-400">{instanceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isConnected ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Conectado!</h4>
              <p className="text-zinc-400">WhatsApp conectado com sucesso.</p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mb-4" />
              <p className="text-zinc-400">Gerando QR Code...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <X className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchQRCode}
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl">
                <img
                  src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code para conexão"
                  className="w-full aspect-square"
                />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-zinc-400">
                  Abra o WhatsApp no seu celular e escaneie o QR Code
                </p>
                <p className="text-xs text-zinc-500">
                  O QR Code expira em 45 segundos
                </p>
              </div>

              <button
                onClick={fetchQRCode}
                className="w-full px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar QR Code
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
