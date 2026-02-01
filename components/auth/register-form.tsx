'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Phone, UserPlus } from 'lucide-react';
import { maskCPF } from '@/lib/utils/mask-cpf';
import { cpfToEmail, isValidCpf } from '@/lib/utils/cpf-to-email';
import { createClient } from '@/lib/supabase/client';
import { trackSignup } from '@/lib/actions/auth';
import { trackCompleteRegistration } from '@/lib/tracking/facebook';

// Helper para obter platform_id do cookie (definido pelo middleware)
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
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    codigoConvite: initialCodigoConvite,
  });
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

    // Validacoes
    if (!formData.nome.trim()) {
      setError('Nome e obrigatorio');
      setLoading(false);
      return;
    }

    if (!isValidCpf(formData.cpf)) {
      setError('CPF invalido');
      setLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      setError('Senha deve ter no minimo 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas nao coincidem');
      setLoading(false);
      return;
    }

    try {
      const email = cpfToEmail(formData.cpf);
      const cpfNumbers = formData.cpf.replace(/\D/g, '');

      // Obter platform_id do cookie (definido pelo middleware)
      const platformId = getPlatformIdFromCookie();

      // Criar usuario no Supabase Auth com metadata
      // O trigger no banco criara o perfil automaticamente
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.senha,
        options: {
          data: {
            cpf: cpfNumbers,
            nome: formData.nome.trim(),
            telefone: formData.telefone.replace(/\D/g, '') || null,
            codigo_convite: formData.codigoConvite.trim() || null,
            platform_id: platformId, // Multi-tenant: associar usuário à plataforma
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setError('CPF ja cadastrado');
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

      // Rastrear cadastro para auditoria (não bloqueia o fluxo)
      trackSignup().catch(() => {});

      // Dispara evento de cadastro completo no Facebook Pixel
      trackCompleteRegistration();

      // Força reload completo para o middleware verificar a sessão
      window.location.replace('/login?cadastro=sucesso');
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
      setLoading(false);
    }
  };

  // Input class matching login form style
  const inputClass = "w-full rounded-lg bg-white py-3 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5A220]";

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      {/* Nome Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Nome completo"
          value={formData.nome}
          onChange={(e) => handleChange('nome', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* CPF Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          inputMode="numeric"
          placeholder="CPF"
          value={formData.cpf}
          onChange={handleCpfChange}
          maxLength={14}
          className={inputClass}
        />
      </div>

      {/* Phone Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Phone className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="tel"
          inputMode="tel"
          placeholder="Telefone"
          value={formData.telefone}
          onChange={handlePhoneChange}
          maxLength={16}
          className={inputClass}
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
          value={formData.senha}
          onChange={(e) => handleChange('senha', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Confirm Password Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="password"
          placeholder="Confirmar senha"
          value={formData.confirmarSenha}
          onChange={(e) => handleChange('confirmarSenha', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Invite Code Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <UserPlus className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Codigo de convite (opcional)"
          value={formData.codigoConvite}
          onChange={(e) => handleChange('codigoConvite', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}

      {/* Submit Button - Gold like login */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#E5A220] py-3 font-bold text-white transition-colors hover:bg-[#d4941c] active:bg-[#c4860f] disabled:opacity-50"
      >
        {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 py-2">
        <div className="h-px flex-1 bg-gray-600" />
        <span className="text-sm text-gray-400">Ja tem conta?</span>
        <div className="h-px flex-1 bg-gray-600" />
      </div>

      {/* Back to Login Button - Outline like login */}
      <button
        type="button"
        onClick={() => router.push('/login')}
        className="w-full rounded-lg border-2 border-gray-400 bg-transparent py-3 font-bold text-gray-300 transition-colors hover:border-white hover:text-white active:bg-gray-800"
      >
        JA TENHO CONTA
      </button>
    </form>
  );
}
