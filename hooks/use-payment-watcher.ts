'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// Configuracoes
const CHECK_INTERVAL = 30000; // 30 segundos
const EXPIRATION_TIME = 1800000; // 30 minutos
const STORAGE_KEY = 'pending_pix_payments';

export interface PendingPayment {
  id: string;           // ID do pagamento na tabela pagamentos
  createdAt: number;    // Timestamp de criacao (Date.now())
  valor: number;        // Valor do deposito
  orderNumber: string;  // Numero do pedido
}

export interface ConfirmedPayment {
  id: string;
  valor: number;
  orderNumber: string;
}

export function usePaymentWatcher() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [confirmedPayment, setConfirmedPayment] = useState<ConfirmedPayment | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const supabaseRef = useRef(createClient());

  // Carrega pagamentos pendentes do localStorage
  const loadPendingPayments = useCallback(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const payments: PendingPayment[] = JSON.parse(stored);
        // Filtra expirados
        const now = Date.now();
        const valid = payments.filter(p => now - p.createdAt < EXPIRATION_TIME);
        if (valid.length !== payments.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
        }
        return valid;
      }
    } catch (error) {
      console.error('Error loading pending payments:', error);
    }
    return [];
  }, []);

  // Salva pagamentos pendentes no localStorage
  const savePendingPayments = useCallback((payments: PendingPayment[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
    } catch (error) {
      console.error('Error saving pending payments:', error);
    }
  }, []);

  // Adiciona novo pagamento pendente
  const addPayment = useCallback((payment: Omit<PendingPayment, 'createdAt'>) => {
    const newPayment: PendingPayment = {
      ...payment,
      createdAt: Date.now(),
    };
    setPendingPayments(prev => {
      // Evita duplicatas
      const filtered = prev.filter(p => p.id !== payment.id);
      const updated = [...filtered, newPayment];
      savePendingPayments(updated);
      return updated;
    });
  }, [savePendingPayments]);

  // Remove pagamento
  const removePayment = useCallback((id: string) => {
    setPendingPayments(prev => {
      const updated = prev.filter(p => p.id !== id);
      savePendingPayments(updated);
      return updated;
    });
  }, [savePendingPayments]);

  // Limpa pagamento confirmado (apos mostrar toast)
  const clearConfirmed = useCallback(() => {
    setConfirmedPayment(null);
  }, []);

  // Verifica status de um pagamento
  const checkPaymentStatus = useCallback(async (payment: PendingPayment): Promise<'PENDING' | 'PAID' | 'CANCELLED' | 'ERROR'> => {
    try {
      const supabase = supabaseRef.current;
      const { data, error } = await supabase.functions.invoke('check-pix-status', {
        body: { pagamentoId: payment.id },
      });

      if (error) {
        console.error('Error checking payment status:', error);
        return 'ERROR';
      }

      return data?.status || 'PENDING';
    } catch (error) {
      console.error('Error checking payment status:', error);
      return 'ERROR';
    }
  }, []);

  // Verifica todos os pagamentos pendentes
  const checkAllPayments = useCallback(async () => {
    const payments = loadPendingPayments();
    if (payments.length === 0) return;

    setIsChecking(true);
    const now = Date.now();

    for (const payment of payments) {
      // Verifica se expirou
      if (now - payment.createdAt >= EXPIRATION_TIME) {
        removePayment(payment.id);
        continue;
      }

      const status = await checkPaymentStatus(payment);

      if (status === 'PAID') {
        // Pagamento confirmado!
        setConfirmedPayment({
          id: payment.id,
          valor: payment.valor,
          orderNumber: payment.orderNumber,
        });
        removePayment(payment.id);
      } else if (status === 'CANCELLED') {
        // Pagamento cancelado
        removePayment(payment.id);
      }
      // Se PENDING ou ERROR, mantem na lista para proxima verificacao
    }

    setIsChecking(false);
  }, [loadPendingPayments, checkPaymentStatus, removePayment]);

  // Carrega pagamentos ao montar
  useEffect(() => {
    const payments = loadPendingPayments();
    setPendingPayments(payments);
  }, [loadPendingPayments]);

  // Polling a cada 30 segundos
  useEffect(() => {
    // Verifica imediatamente ao montar (se houver pagamentos pendentes)
    if (pendingPayments.length > 0) {
      const initialCheck = setTimeout(() => {
        checkAllPayments();
      }, 3000); // Aguarda 3s para evitar multiplas verificacoes ao navegar

      return () => clearTimeout(initialCheck);
    }
  }, []); // Executa apenas uma vez ao montar

  useEffect(() => {
    if (pendingPayments.length === 0) return;

    const interval = setInterval(() => {
      checkAllPayments();
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [pendingPayments.length, checkAllPayments]);

  return {
    pendingPayments,
    confirmedPayment,
    isChecking,
    addPayment,
    removePayment,
    clearConfirmed,
    checkAllPayments,
  };
}
