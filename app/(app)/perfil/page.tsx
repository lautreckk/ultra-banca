'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Phone, CreditCard, Mail, LogOut, Wallet, Gift, Gamepad2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  saldo: number;
  saldo_bonus: number;
  saldo_cassino: number;
  saldo_bonus_cassino: number;
  created_at: string;
}

function maskCpf(cpf: string): string {
  if (!cpf || cpf.length < 11) return cpf || '---';
  return `${cpf.slice(0, 3)}.***.***.${cpf.slice(-2)}`;
}

function formatPhone(phone: string): string {
  if (!phone) return '---';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  return phone;
}

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('nome, cpf, telefone, saldo, saldo_bonus, saldo_cassino, saldo_bonus_cassino, created_at')
        .eq('id', user.id)
        .single();

      setProfile({
        nome: data?.nome || '',
        cpf: data?.cpf || '',
        telefone: data?.telefone || '',
        email: user.email || '',
        saldo: Number(data?.saldo) || 0,
        saldo_bonus: Number(data?.saldo_bonus) || 0,
        saldo_cassino: Number(data?.saldo_cassino) || 0,
        saldo_bonus_cassino: Number(data?.saldo_bonus_cassino) || 0,
        created_at: data?.created_at || '',
      });

      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-800/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black px-4">
        <div className="flex h-12 items-center justify-between">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center">
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">MEU PERFIL</span>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Avatar + Nome */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="h-20 w-20 rounded-full border-2 border-amber-500/40 bg-amber-500/10 flex items-center justify-center">
            <User className="h-10 w-10 text-amber-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">{profile?.nome || 'Usuário'}</h1>
            {profile?.created_at && (
              <p className="text-xs text-zinc-500 mt-1">
                Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Saldos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-700/40 p-4" style={{ backgroundColor: '#1A1F2B' }}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-zinc-400">Saldo</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">
              R$ {profile?.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-700/40 p-4" style={{ backgroundColor: '#1A1F2B' }}>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-zinc-400">Bonus</span>
            </div>
            <p className="text-lg font-bold text-amber-400">
              R$ {profile?.saldo_bonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-700/40 p-4" style={{ backgroundColor: '#1A1F2B' }}>
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-zinc-400">Cassino</span>
            </div>
            <p className="text-lg font-bold text-blue-400">
              R$ {profile?.saldo_cassino.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-700/40 p-4" style={{ backgroundColor: '#1A1F2B' }}>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-zinc-400">Bonus Cassino</span>
            </div>
            <p className="text-lg font-bold text-purple-400">
              R$ {profile?.saldo_bonus_cassino.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="rounded-xl border border-zinc-700/40 overflow-hidden" style={{ backgroundColor: '#1A1F2B' }}>
          <div className="px-4 py-3 border-b border-zinc-700/40">
            <h2 className="text-sm font-bold text-white">Dados Pessoais</h2>
          </div>

          <div className="divide-y divide-zinc-700/40">
            <div className="flex items-center gap-3 px-4 py-3">
              <CreditCard className="h-4 w-4 text-zinc-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">CPF</p>
                <p className="text-sm text-white truncate">{maskCpf(profile?.cpf || '')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <Phone className="h-4 w-4 text-zinc-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Telefone</p>
                <p className="text-sm text-white truncate">{formatPhone(profile?.telefone || '')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <Mail className="h-4 w-4 text-zinc-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm text-white truncate">{profile?.email || '---'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-4 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loggingOut ? (
            <Loader2 className="h-5 w-5 animate-spin text-red-400" />
          ) : (
            <LogOut className="h-5 w-5 text-red-400" />
          )}
          <span className="text-sm font-bold text-red-400">
            {loggingOut ? 'Saindo...' : 'Sair da conta'}
          </span>
        </button>
      </div>
    </div>
  );
}
