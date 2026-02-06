'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Phone, Eye, EyeOff, ChevronDown, ChevronUp, Gift } from 'lucide-react';
import { maskCPF } from '@/lib/utils/mask-cpf';
import { cpfToEmail, isValidCpf } from '@/lib/utils/cpf-to-email';
import { createClient } from '@/lib/supabase/client';
import { trackSignup } from '@/lib/actions/auth';
import { trackCompleteRegistration } from '@/lib/tracking/facebook';
import { usePlatformConfig } from '@/contexts/platform-config-context';

function getPlatformIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )platform_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface RegisterFormProps {
  initialCodigoConvite?: string;
}

export function RegisterForm({ initialCodigoConvite = '' }: RegisterFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const config = usePlatformConfig();
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    codigoConvite: initialCodigoConvite,
  });
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [showConvite, setShowConvite] = useState(!!initialCodigoConvite);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPF(e.target.value);
    handleChange('cpf', masked);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      }
      if (value.length > 10) {
        value = `${value.slice(0, 10)}-${value.slice(10)}`;
      }
      handleChange('telefone', value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      setLoading(false);
      return;
    }

    if (!isValidCpf(formData.cpf)) {
      setError('CPF inválido');
      setLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const email = cpfToEmail(formData.cpf, config.slug);
      const cpfNumbers = formData.cpf.replace(/\D/g, '');
      const platformId = getPlatformIdFromCookie();

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.senha,
        options: {
          data: {
            cpf: cpfNumbers,
            nome: formData.nome.trim(),
            telefone: formData.telefone.replace(/\D/g, '') || null,
            codigo_convite: formData.codigoConvite.trim() || null,
            platform_id: platformId,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setError('CPF já cadastrado');
        } else {
          setError('Erro ao criar conta. Tente novamente.');
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Erro ao criar conta. Tente novamente.');
        setLoading(false);
        return;
      }

      trackSignup().catch(() => {});
      trackCompleteRegistration();
      window.location.replace('/login?cadastro=sucesso');
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
      setLoading(false);
    }
  };

  const inputBase =
    'w-full h-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 pl-13 pr-4 text-base font-medium text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/40 transition-all';

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Glassmorphism Card */}
      <div className="rounded-2xl bg-black/30 backdrop-blur-lg border border-white/10 p-5 space-y-4">
        {/* Nome */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-white/80 tracking-wide">
            Nome completo
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <User className="h-5 w-5 text-white/50" />
            </div>
            <input
              type="text"
              placeholder="Seu nome"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              className={inputBase}
              aria-label="Nome completo"
              autoComplete="name"
            />
          </div>
        </div>

        {/* CPF */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-white/80 tracking-wide">
            CPF
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <User className="h-5 w-5 text-white/50" />
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={handleCpfChange}
              maxLength={14}
              className={inputBase}
              aria-label="CPF"
            />
          </div>
        </div>

        {/* Telefone */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-white/80 tracking-wide">
            Telefone
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Phone className="h-5 w-5 text-white/50" />
            </div>
            <input
              type="tel"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChange={handlePhoneChange}
              maxLength={16}
              className={inputBase}
              aria-label="Telefone"
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-white/80 tracking-wide">
            Senha
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="h-5 w-5 text-white/50" />
            </div>
            <input
              type={showSenha ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={formData.senha}
              onChange={(e) => handleChange('senha', e.target.value)}
              className={`${inputBase} !pr-13`}
              aria-label="Senha"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 active:opacity-70"
              aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showSenha ? (
                <EyeOff className="h-5 w-5 text-white/50" />
              ) : (
                <Eye className="h-5 w-5 text-white/50" />
              )}
            </button>
          </div>
        </div>

        {/* Confirmar Senha */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-white/80 tracking-wide">
            Confirmar senha
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="h-5 w-5 text-white/50" />
            </div>
            <input
              type={showConfirmar ? 'text' : 'password'}
              placeholder="Repita a senha"
              value={formData.confirmarSenha}
              onChange={(e) => handleChange('confirmarSenha', e.target.value)}
              className={`${inputBase} !pr-13`}
              aria-label="Confirmar senha"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmar(!showConfirmar)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 active:opacity-70"
              aria-label={showConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showConfirmar ? (
                <EyeOff className="h-5 w-5 text-white/50" />
              ) : (
                <Eye className="h-5 w-5 text-white/50" />
              )}
            </button>
          </div>
        </div>

        {/* Código de Convite - Collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setShowConvite(!showConvite)}
            className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-white/60 active:bg-white/10 transition-all"
          >
            <span className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Código de convite (opcional)
            </span>
            {showConvite ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showConvite && (
            <div className="mt-2 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Gift className="h-5 w-5 text-white/50" />
              </div>
              <input
                type="text"
                placeholder="Digite o código"
                value={formData.codigoConvite}
                onChange={(e) => handleChange('codigoConvite', e.target.value)}
                className={inputBase}
                aria-label="Código de convite"
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-red-300">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[60px] rounded-xl bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 active:scale-[0.98] active:bg-emerald-700 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 py-1">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-sm font-medium text-white/50">Já tem conta?</span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      {/* Back to Login */}
      <button
        type="button"
        onClick={() => router.push('/login')}
        className="w-full h-14 rounded-xl border-2 border-white/30 bg-white/5 backdrop-blur-sm text-base font-bold text-white transition-all hover:border-white/50 hover:bg-white/10 active:scale-[0.98]"
      >
        JÁ TENHO CONTA
      </button>
    </form>
  );
}
