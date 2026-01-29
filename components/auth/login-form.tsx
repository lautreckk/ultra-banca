'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Lock } from 'lucide-react';
import { maskCPF } from '@/lib/utils/mask-cpf';
import { cpfToEmail, isValidCpf } from '@/lib/utils/cpf-to-email';
import { createClient } from '@/lib/supabase/client';
import { trackLogin } from '@/lib/actions/auth';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigoConvite = searchParams.get('p');
  const supabase = createClient();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
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
      setError('CPF invalido');
      setLoading(false);
      return;
    }

    try {
      const email = cpfToEmail(cpf);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) {
        setError('CPF ou senha incorretos');
        return;
      }

      // Rastrear login para auditoria (não bloqueia o redirecionamento)
      trackLogin().catch(() => {
        // Ignora erros de tracking - não deve impedir o login
      });

      router.push('/');
      router.refresh();
    } catch {
      setError('Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      {/* WhatsApp Button */}
      <button
        type="button"
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#f5f5f5] py-3 text-sm font-medium text-gray-700 active:bg-gray-200"
        onClick={() => window.open('https://wa.me/5500000000000', '_blank')}
      >
        CHAMAR PROMOTOR AGORA
        <svg className="h-5 w-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>

      {/* CPF Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={handleCpfChange}
          maxLength={14}
          className="w-full rounded-lg bg-white py-3 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5A220]"
        />
      </div>

      {/* Password Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full rounded-lg bg-white py-3 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5A220]"
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}

      {/* Forgot Password */}
      <div className="text-right">
        <button
          type="button"
          className="text-sm text-gray-300 active:text-white"
          onClick={() => router.push('/recuperar-senha')}
        >
          Esqueceu sua senha?
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#E5A220] py-3 font-bold text-white transition-colors hover:bg-[#d4941c] active:bg-[#c4860f] disabled:opacity-50"
      >
        {loading ? 'ENTRANDO...' : 'ENTRAR'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-gray-600" />
        <span className="text-sm text-gray-400">Primeiro acesso?</span>
        <div className="h-px flex-1 bg-gray-600" />
      </div>

      {/* Register Button */}
      <button
        type="button"
        onClick={() => router.push(codigoConvite ? `/cadastro?p=${codigoConvite}` : '/cadastro')}
        className="w-full rounded-lg border-2 border-gray-400 bg-transparent py-3 font-bold text-gray-300 transition-colors hover:border-white hover:text-white active:bg-gray-800"
      >
        CADASTRE-SE
      </button>
    </form>
  );
}
