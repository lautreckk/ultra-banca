'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { ConfirmedPayment } from '@/hooks/use-payment-watcher';

interface PaymentToastProps {
  payment: ConfirmedPayment;
  onClose: () => void;
}

export function PaymentToast({ payment, onClose }: PaymentToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animacao de entrada
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss apos 5 segundos
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        isVisible && !isLeaving
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px]">
        <div className="flex-shrink-0">
          <CheckCircle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Deposito Confirmado!</p>
          <p className="text-green-100 text-sm">
            {formatCurrency(payment.valor)} adicionado ao saldo
          </p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-green-500 rounded transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
