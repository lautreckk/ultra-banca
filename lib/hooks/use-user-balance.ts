'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserBalance {
  saldo: number;
  saldoBonus: number;
  loading: boolean;
}

export function useUserBalance() {
  const [balance, setBalance] = useState<UserBalance>({
    saldo: 0,
    saldoBonus: 0,
    loading: true,
  });

  const supabase = createClient();

  const fetchBalance = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('saldo, saldo_bonus')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setBalance({
            saldo: Number(data.saldo) || 0,
            saldoBonus: Number(data.saldo_bonus) || 0,
            loading: false,
          });
        } else {
          setBalance(prev => ({ ...prev, loading: false }));
        }
      } else {
        setBalance(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(prev => ({ ...prev, loading: false }));
    }
  }, [supabase]);

  const refresh = useCallback(() => {
    setBalance(prev => ({ ...prev, loading: true }));
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    fetchBalance();

    // Subscribe to realtime updates
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('balance-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            const newData = payload.new as { saldo?: number; saldo_bonus?: number };
            setBalance(prev => ({
              ...prev,
              saldo: Number(newData.saldo) ?? prev.saldo,
              saldoBonus: Number(newData.saldo_bonus) ?? prev.saldoBonus,
            }));
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchBalance, supabase]);

  return { ...balance, refresh };
}
