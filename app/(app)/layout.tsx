'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePageTracking } from '@/lib/hooks/use-page-tracking';
import { LayoutWrapper } from '@/components/layouts/LayoutWrapper';

interface UserProfile {
  saldo: number;
  saldoBonus: number;
  saldoCassino: number;
  saldoBonusCassino: number;
  unidade: string;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<UserProfile>({
    saldo: 0,
    saldoBonus: 0,
    saldoCassino: 0,
    saldoBonusCassino: 0,
    unidade: '000000',
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();
  const userFetchedRef = useRef(false);

  // Track page views and visitor presence (receives userId to avoid redundant getUser calls)
  usePageTracking(userId);

  // Single getUser() call on mount - feeds everything else
  useEffect(() => {
    if (userFetchedRef.current) return;
    userFetchedRef.current = true;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Fetch profile
        const { data, error } = await supabase
          .from('profiles')
          .select('saldo, saldo_bonus, saldo_cassino, saldo_bonus_cassino, codigo_convite')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setProfile({
            saldo: Number(data.saldo) || 0,
            saldoBonus: Number(data.saldo_bonus) || 0,
            saldoCassino: Number(data.saldo_cassino) || 0,
            saldoBonusCassino: Number(data.saldo_bonus_cassino) || 0,
            unidade: data.codigo_convite || '000000',
          });
        }

        // Setup realtime (reuses user.id, no second getUser call)
        channel = supabase
          .channel('profile-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              const newData = payload.new as { saldo?: number; saldo_bonus?: number; saldo_cassino?: number; saldo_bonus_cassino?: number; codigo_convite?: string };
              setProfile((prev) => ({
                ...prev,
                saldo: Number(newData.saldo) || prev.saldo,
                saldoBonus: Number(newData.saldo_bonus) || prev.saldoBonus,
                saldoCassino: Number(newData.saldo_cassino) || prev.saldoCassino,
                saldoBonusCassino: Number(newData.saldo_bonus_cassino) || prev.saldoBonusCassino,
                unidade: newData.codigo_convite || prev.unidade,
              }));
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error initializing app layout:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const uid = userId;
      if (!uid) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('saldo, saldo_bonus, saldo_cassino, saldo_bonus_cassino, codigo_convite')
        .eq('id', uid)
        .single();

      if (!error && data) {
        setProfile({
          saldo: Number(data.saldo) || 0,
          saldoBonus: Number(data.saldo_bonus) || 0,
          saldoCassino: Number(data.saldo_cassino) || 0,
          saldoBonusCassino: Number(data.saldo_bonus_cassino) || 0,
          unidade: data.codigo_convite || '000000',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  return (
    <LayoutWrapper
      saldo={profile.saldo}
      saldoBonus={profile.saldoBonus}
      saldoCassino={profile.saldoCassino}
      saldoBonusCassino={profile.saldoBonusCassino}
      unidade={profile.unidade}
      onRefresh={handleRefresh}
      loading={loading}
    >
      {children}
    </LayoutWrapper>
  );
}
