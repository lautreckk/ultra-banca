'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  CreditCard,
  Mail,
  LogOut,
  Wallet,
  Gift,
  Gamepad2,
  Loader2,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Shield,
  Copy,
  Check,
  Headphones,
  Users,
  Bell,
  Eye,
  EyeOff,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format-currency';
import { usePlatformConfig } from '@/contexts/platform-config-context';

interface ProfileData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  saldo: number;
  saldo_bonus: number;
  saldo_cassino: number;
  saldo_bonus_cassino: number;
  codigo_convite: string;
  created_at: string;
}

interface RecentTransaction {
  id: string;
  tipo: string;
  valor: number;
  status: string;
  created_at: string;
}

function maskCpf(cpf: string): string {
  if (!cpf || cpf.length < 11) return cpf || '---';
  return `${cpf.slice(0, 3)}.***.***.${cpf.slice(-2)}`;
}

function formatPhone(phone: string): string {
  if (!phone) return 'Não informado';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  return phone;
}

function getInitials(nome: string): string {
  if (!nome) return 'U';
  const parts = nome.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0]?.toUpperCase() || 'U';
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
    case 'paid':
      return 'text-emerald-400';
    case 'pending':
      return 'text-amber-400';
    case 'rejected':
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-zinc-400';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
    case 'paid':
      return 'Aprovado';
    case 'pending':
      return 'Pendente';
    case 'rejected':
      return 'Rejeitado';
    case 'failed':
      return 'Falhou';
    default:
      return status;
  }
}

function getTipoLabel(tipo: string): string {
  switch (tipo) {
    case 'deposit':
      return 'Depósito';
    case 'withdrawal':
      return 'Saque';
    case 'bet':
      return 'Aposta';
    case 'prize':
      return 'Prêmio';
    case 'bonus':
      return 'Bônus';
    case 'casino_debit':
      return 'Cassino';
    case 'casino_credit':
      return 'Ganho Cassino';
    default:
      return tipo;
  }
}

function getTipoIcon(tipo: string) {
  switch (tipo) {
    case 'deposit':
      return <ArrowDownCircle className="h-4 w-4 text-emerald-400" />;
    case 'withdrawal':
      return <ArrowUpCircle className="h-4 w-4 text-red-400" />;
    case 'prize':
      return <Gift className="h-4 w-4 text-amber-400" />;
    default:
      return <DollarSign className="h-4 w-4 text-zinc-400" />;
  }
}

export default function PerfilPage() {
  const router = useRouter();
  const config = usePlatformConfig();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      const [profileResult, transactionsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('nome, cpf, telefone, saldo, saldo_bonus, saldo_cassino, saldo_bonus_cassino, codigo_convite, created_at')
          .eq('id', user.id)
          .single(),
        supabase
          .from('transactions')
          .select('id, tipo, valor, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const data = profileResult.data;
      setProfile({
        nome: data?.nome || '',
        cpf: data?.cpf || '',
        telefone: data?.telefone || '',
        email: user.email || '',
        saldo: Number(data?.saldo) || 0,
        saldo_bonus: Number(data?.saldo_bonus) || 0,
        saldo_cassino: Number(data?.saldo_cassino) || 0,
        saldo_bonus_cassino: Number(data?.saldo_bonus_cassino) || 0,
        codigo_convite: data?.codigo_convite || '',
        created_at: data?.created_at || '',
      });

      if (transactionsResult.data) {
        setTransactions(transactionsResult.data as RecentTransaction[]);
      }

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

  const handleCopyCode = () => {
    if (!profile?.codigo_convite) return;
    const url = `${window.location.origin}?p=${profile.codigo_convite}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalSaldo = profile
    ? profile.saldo + profile.saldo_bonus + profile.saldo_cassino + profile.saldo_bonus_cassino
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0C0E14' }}>
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#0C0E14' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 pt-safe"
        style={{ background: 'linear-gradient(180deg, #141828 0%, #0C0E14 100%)' }}
      >
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-white/10"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white tracking-wide">MEU PERFIL</span>
          <div className="w-11" />
        </div>
      </header>

      <div className="px-4 space-y-4 pt-2">
        {/* Profile Card */}
        <div
          className="relative rounded-2xl border p-5 overflow-hidden"
          style={{
            backgroundColor: '#141828',
            borderColor: 'rgba(255, 215, 0, 0.1)',
          }}
        >
          {/* Decorative gradient */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, transparent 60%)',
            }}
          />

          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center shrink-0 border-2"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)',
                borderColor: 'rgba(255, 215, 0, 0.3)',
              }}
            >
              <span className="text-xl font-black" style={{ color: '#FFD700' }}>
                {getInitials(profile?.nome || '')}
              </span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-white truncate">
                {profile?.nome || 'Usuário'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3 w-3 text-zinc-500" />
                <p className="text-xs text-zinc-500">
                  {profile?.created_at
                    ? `Membro desde ${new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                    : '---'}
                </p>
              </div>
              {profile?.codigo_convite && (
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider active:scale-95 transition-transform"
                  style={{
                    backgroundColor: 'rgba(255, 215, 0, 0.08)',
                    color: '#FFD700',
                    border: '1px solid rgba(255, 215, 0, 0.15)',
                  }}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'LINK COPIADO!' : `CÓDIGO: ${profile.codigo_convite}`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Balance Overview */}
        <div
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: '#141828',
            borderColor: 'rgba(255, 215, 0, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Saldo Total</span>
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 active:scale-95 transition-transform"
            >
              {showBalances ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {showBalances ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          <p className="text-2xl font-black mb-4" style={{ color: '#FFD700' }}>
            {showBalances ? formatCurrency(totalSaldo) : 'R$ ••••••'}
          </p>

          {/* Balance Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-400/70 font-semibold uppercase">Loterias</span>
              </div>
              <p className="text-sm font-bold text-emerald-400">
                {showBalances ? formatCurrency(profile?.saldo ?? 0) : '••••'}
              </p>
            </div>

            <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.12)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Gift className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] text-amber-400/70 font-semibold uppercase">Bônus</span>
              </div>
              <p className="text-sm font-bold text-amber-400">
                {showBalances ? formatCurrency(profile?.saldo_bonus ?? 0) : '••••'}
              </p>
            </div>

            <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(96, 165, 250, 0.06)', border: '1px solid rgba(96, 165, 250, 0.12)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Gamepad2 className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[10px] text-blue-400/70 font-semibold uppercase">Cassino</span>
              </div>
              <p className="text-sm font-bold text-blue-400">
                {showBalances ? formatCurrency(profile?.saldo_cassino ?? 0) : '••••'}
              </p>
            </div>

            <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.12)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Gift className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[10px] text-purple-400/70 font-semibold uppercase">Bônus Cassino</span>
              </div>
              <p className="text-sm font-bold text-purple-400">
                {showBalances ? formatCurrency(profile?.saldo_bonus_cassino ?? 0) : '••••'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link
              href="/recarga-pix"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-black active:scale-[0.97] transition-transform"
              style={{ background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)' }}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Depositar
            </Link>
            <Link
              href="/saques"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform"
              style={{
                color: '#FFD700',
                border: '1px solid rgba(255, 215, 0, 0.25)',
                backgroundColor: 'rgba(255, 215, 0, 0.06)',
              }}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Sacar
            </Link>
          </div>
        </div>

        {/* Personal Data */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: '#141828',
            borderColor: 'rgba(255, 215, 0, 0.1)',
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Dados Pessoais</h2>
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                <CreditCard className="h-4 w-4" style={{ color: '#FFD700' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">CPF</p>
                <p className="text-sm text-white font-medium truncate">{maskCpf(profile?.cpf || '')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                <Phone className="h-4 w-4" style={{ color: '#FFD700' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Telefone</p>
                <p className="text-sm text-white font-medium truncate">{formatPhone(profile?.telefone || '')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)' }}>
                <Mail className="h-4 w-4" style={{ color: '#FFD700' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Email</p>
                <p className="text-sm text-white font-medium truncate">{profile?.email || '---'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: '#141828',
              borderColor: 'rgba(255, 215, 0, 0.1)',
            }}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Últimas Transações</h2>
              <Clock className="h-3.5 w-3.5 text-zinc-600" />
            </div>

            <div className="divide-y" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                    {getTipoIcon(tx.tipo)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium">{getTipoLabel(tx.tipo)}</p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(tx.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.tipo === 'withdrawal' || tx.tipo === 'bet' || tx.tipo === 'casino_debit' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {tx.tipo === 'withdrawal' || tx.tipo === 'bet' || tx.tipo === 'casino_debit' ? '-' : '+'}
                      {formatCurrency(tx.valor)}
                    </p>
                    <p className={`text-[10px] font-semibold ${getStatusColor(tx.status)}`}>
                      {getStatusLabel(tx.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: '#141828',
            borderColor: 'rgba(255, 215, 0, 0.1)',
          }}
        >
          <Link
            href="/amigos"
            className="flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.03] transition-colors"
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white font-medium">Convidar Amigos</p>
              <p className="text-[10px] text-zinc-500">Ganhe comissão por indicações</p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </Link>

          <div className="h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />

          <Link
            href="/apostas"
            className="flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.03] transition-colors"
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
              <CreditCard className="h-4 w-4 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white font-medium">Minhas Apostas</p>
              <p className="text-[10px] text-zinc-500">Histórico e apostas ativas</p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </Link>

          {config.social_whatsapp && (
            <>
              <div className="h-px" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
              <a
                href={`https://wa.me/${config.social_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.03] transition-colors"
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(96, 165, 250, 0.1)' }}>
                  <Headphones className="h-4 w-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium">Suporte</p>
                  <p className="text-[10px] text-zinc-500">Fale conosco via WhatsApp</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600" />
              </a>
            </>
          )}
        </div>

        {/* Security Info */}
        <div
          className="flex items-center gap-3 rounded-2xl border px-4 py-3"
          style={{
            backgroundColor: '#141828',
            borderColor: 'rgba(255, 215, 0, 0.1)',
          }}
        >
          <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Seus dados estão protegidos com criptografia de ponta a ponta. Transações PIX processadas com segurança.
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 active:scale-[0.98] transition-transform disabled:opacity-50"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
          }}
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

        {/* App version */}
        <p className="text-center text-[10px] text-zinc-700 pb-4">
          {config.site_name} &bull; v1.0
        </p>
      </div>
    </div>
  );
}
