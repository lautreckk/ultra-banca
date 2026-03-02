'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePaymentWatcher, PendingPayment, ConfirmedPayment } from '@/hooks/use-payment-watcher';
import { PaymentToast } from './payment-toast';

interface PaymentWatcherContextValue {
  pendingPayments: PendingPayment[];
  confirmedPayment: ConfirmedPayment | null;
  isChecking: boolean;
  addPayment: (payment: Omit<PendingPayment, 'createdAt'>) => void;
  removePayment: (id: string) => void;
  clearConfirmed: () => void;
  checkAllPayments: () => Promise<void>;
}

const PaymentWatcherContext = createContext<PaymentWatcherContextValue | null>(null);

export function usePaymentContext() {
  const context = useContext(PaymentWatcherContext);
  if (!context) {
    throw new Error('usePaymentContext must be used within PaymentWatcherProvider');
  }
  return context;
}

interface PaymentWatcherProviderProps {
  children: ReactNode;
}

export function PaymentWatcherProvider({ children }: PaymentWatcherProviderProps) {
  const {
    pendingPayments,
    confirmedPayment,
    isChecking,
    addPayment,
    removePayment,
    clearConfirmed,
    checkAllPayments,
  } = usePaymentWatcher();

  return (
    <PaymentWatcherContext.Provider
      value={{
        pendingPayments,
        confirmedPayment,
        isChecking,
        addPayment,
        removePayment,
        clearConfirmed,
        checkAllPayments,
      }}
    >
      {children}

      {/* Toast de pagamento confirmado */}
      {confirmedPayment && (
        <PaymentToast
          payment={confirmedPayment}
          onClose={clearConfirmed}
        />
      )}
    </PaymentWatcherContext.Provider>
  );
}
