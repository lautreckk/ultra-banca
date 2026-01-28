'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, BalanceDisplay, MobileDrawer } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  saldo: number;
  saldoBonus: number;
  unidade: string;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    saldo: 0,
    saldoBonus: 0,
    unidade: '000000',
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('saldo, saldo_bonus, codigo_convite')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setProfile({
            saldo: Number(data.saldo) || 0,
            saldoBonus: Number(data.saldo_bonus) || 0,
            unidade: data.codigo_convite || '000000',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();

    // Subscribe to realtime updates on profile
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
            const newData = payload.new as { saldo?: number; saldo_bonus?: number; codigo_convite?: string };
            setProfile((prev) => ({
              ...prev,
              saldo: Number(newData.saldo) || prev.saldo,
              saldoBonus: Number(newData.saldo_bonus) || prev.saldoBonus,
              unidade: newData.codigo_convite || prev.unidade,
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
  }, [fetchProfile, supabase]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="min-h-screen bg-gray-300 flex justify-center">
      <div className="w-full max-w-md bg-gray-100 min-h-screen shadow-xl">
        <Header
          showHome
          showMenu
          onMenuClick={() => setDrawerOpen(true)}
        />
        <BalanceDisplay
          saldo={profile.saldo}
          saldoBonus={profile.saldoBonus}
          unidade={profile.unidade}
          onRefresh={handleRefresh}
        />
        <main className="pb-safe">{children}</main>
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
