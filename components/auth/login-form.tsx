'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { maskCPF } from '@/lib/utils/mask-cpf';
import { cpfToEmail, cpfToEmailLegacy, isValidCpf } from '@/lib/utils/cpf-to-email';
import { createClient } from '@/lib/supabase/client';
import { trackLogin } from '@/lib/actions/auth';
import { usePlatformConfig } from '@/contexts/platform-config-context';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigoConvite = searchParams.get('p');
  const supabase = createClient();
  const config = usePlatformConfig();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPF(e.target.value);
    setCpf(masked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isValidCpf(cpf)) {
      setError('CPF inválido');
      setLoading(false);
      return;
    }

    try {
      const email = cpfToEmail(cpf, config.slug);
      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      // Fallback para usuarios ainda nao migrados (formato legado)
      if (authError) {
        const legacyEmail = cpfToEmailLegacy(cpf);
        ({ data, error: authError } = await supabase.auth.signInWithPassword({
          email: legacyEmail,
          password: senha,
        }));
      }

      if (authError) {
        setError('CPF ou senha incorretos');
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError('Erro ao criar sessão. Tente novamente.');
        setLoading(false);
        return;
      }

      trackLogin().catch(() => {});
      window.location.replace('/home');
    } catch {
      setError('Erro ao entrar. Tente novamente.');
      setLoading(false);
    }
  };

  const inputBase =
    'w-full h-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 pl-13 pr-4 text-base font-medium text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/40 transition-all';

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      {/* Glassmorphism Card */}
      <div className="rounded-2xl bg-black/30 backdrop-blur-lg border border-white/10 p-5 space-y-5">
        {/* CPF Input */}
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
              value={cpf}
              onChange={handleCpfChange}
              maxLength={14}
              className={inputBase}
              aria-label="CPF"
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password Input */}
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
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={`${inputBase} !pr-13`}
              aria-label="Senha"
              autoComplete="current-password"
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

        {/* Forgot Password */}
        {config.promotor_link && (
          <div className="text-right">
            <button
              type="button"
              className="text-sm font-medium text-white/60 underline underline-offset-2 active:text-white"
              onClick={() => window.open(config.promotor_link!, '_blank')}
            >
              Esqueceu sua senha?
            </button>
          </div>
        )}

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
          {loading ? 'ENTRANDO...' : 'ENTRAR'}
        </button>
      </div>

      {/* WhatsApp Button */}
      {config.promotor_link && (
        <button
          type="button"
          className="flex w-full h-14 items-center justify-center gap-3 rounded-xl bg-[#25D366]/20 backdrop-blur-md border border-[#25D366]/30 text-base font-bold text-[#25D366] active:bg-[#25D366]/30 transition-all"
          onClick={() => window.open(config.promotor_link!, '_blank')}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          CHAMAR PROMOTOR
        </button>
      )}

      {/* Divider */}
      <div className="flex items-center gap-4 py-1">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-sm font-medium text-white/50">Primeiro acesso?</span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      {/* Register Button */}
      <button
        type="button"
        onClick={() => router.push(codigoConvite ? `/cadastro?p=${codigoConvite}` : '/cadastro')}
        className="w-full h-14 rounded-xl border-2 border-white/30 bg-white/5 backdrop-blur-sm text-base font-bold text-white transition-all hover:border-white/50 hover:bg-white/10 active:scale-[0.98]"
      >
        CADASTRE-SE
      </button>
    </form>
  );
}
