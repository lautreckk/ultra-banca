'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Lock, User, Shield, Loader2, ArrowLeft } from 'lucide-react';

type LoginStep = 'credentials' | 'mfa';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Step state
  const [step, setStep] = useState<LoginStep>('credentials');

  // Credentials state
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  // MFA state
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);

  // UI state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se já está logado com AAL2
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === 'aal2' || aalData?.nextLevel === 'aal1') {
        // Já está logado com nível adequado
        router.push('/admin/dashboard');
      }
    }
  };

  const handleLoginChange = (value: string) => {
    // Se contém @ ou letras, é email - não formata
    if (value.includes('@') || /[a-zA-Z]/.test(value)) {
      setLogin(value);
      return;
    }
    // Senão, formata como CPF
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    const formatted = numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setLogin(formatted);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Se for um CPF (apenas números), converte para o formato de email
      const cleanInput = login.replace(/\D/g, '');
      const email = cleanInput.length === 11
        ? `${cleanInput}@ultrabanca.app`
        : login;

      // Fazer login com email/senha
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('CPF ou senha incorretos');
        setIsLoading(false);
        return;
      }

      // Verificar se é admin
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (!adminRole) {
        await supabase.auth.signOut();
        setError('Acesso não autorizado');
        setIsLoading(false);
        return;
      }

      // Verificar se tem MFA ativado
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        console.error('Erro ao verificar AAL:', aalError);
        // Continuar sem MFA se houver erro
        router.push('/admin/dashboard');
        return;
      }

      // Se o próximo nível é aal2, significa que MFA está ativado mas não verificado ainda
      if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
        // Buscar fatores MFA
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

        if (factorsError || !factorsData?.totp || factorsData.totp.length === 0) {
          // Sem fatores, continuar normal
          router.push('/admin/dashboard');
          return;
        }

        // Pegar o primeiro fator TOTP verificado
        const verifiedFactor = factorsData.totp.find(f => f.status === 'verified');

        if (!verifiedFactor) {
          // Nenhum fator verificado, continuar normal
          router.push('/admin/dashboard');
          return;
        }

        // MFA ativado - mostrar tela de código
        setFactorId(verifiedFactor.id);
        setStep('mfa');
        setIsLoading(false);
        return;
      }

      // Sem MFA ou já em aal2, redirecionar
      router.push('/admin/dashboard');
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || mfaCode.length !== 6) return;

    setError('');
    setIsLoading(true);

    try {
      // Criar challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        setError('Erro ao iniciar verificação. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // Verificar código
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyError) {
        setError('Código incorreto. Verifique e tente novamente.');
        setMfaCode('');
        setIsLoading(false);
        return;
      }

      // Verificar se agora está em aal2
      const { data: newAalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (newAalData?.currentLevel === 'aal2') {
        router.push('/admin/dashboard');
      } else {
        setError('Erro na verificação. Tente fazer login novamente.');
        setStep('credentials');
        setMfaCode('');
        setFactorId(null);
      }
    } catch (err) {
      console.error('Erro ao verificar MFA:', err);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToCredentials = async () => {
    // Fazer logout para limpar sessão parcial
    await supabase.auth.signOut();
    setStep('credentials');
    setMfaCode('');
    setFactorId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-900/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border transition-all duration-300 ${
            step === 'mfa'
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-indigo-500/10 border-indigo-500/20'
          }`}>
            {step === 'mfa' ? (
              <Shield className="h-10 w-10 text-amber-400" />
            ) : (
              <Lock className="h-10 w-10 text-indigo-400" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {step === 'mfa' ? 'Verificação 2FA' : 'Admin Access'}
          </h1>
          <p className="text-zinc-500 mt-3">
            {step === 'mfa'
              ? 'Digite o código do seu app autenticador'
              : 'Acesse com suas credenciais de administrador'}
          </p>
        </div>

        {/* Credentials Form */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">CPF ou Email</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input
                  type="text"
                  value={login}
                  onChange={(e) => handleLoginChange(e.target.value)}
                  placeholder="000.000.000-00 ou email@exemplo.com"
                  className="w-full h-12 pl-12 pr-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-zinc-600 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-12 pr-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-zinc-600 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !login || !password}
              className="w-full h-12 mt-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-400 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        )}

        {/* MFA Form */}
        {step === 'mfa' && (
          <form onSubmit={handleMFASubmit} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                {error}
              </div>
            )}

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Shield className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-sm text-amber-200/80">
                  Sua conta tem autenticação de dois fatores ativada.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-400">
                Código de verificação
              </label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full h-16 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-zinc-600 transition-all duration-200"
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-zinc-600 text-center">
                Abra seu app autenticador e digite o código de 6 dígitos
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={goBackToCredentials}
                disabled={isLoading}
                className="flex-1 h-12 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-300 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                type="submit"
                disabled={isLoading || mfaCode.length !== 6}
                className="flex-1 h-12 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 text-amber-400 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-zinc-600 text-sm mt-8">
          {step === 'mfa'
            ? 'Não consegue acessar? Entre em contato com o suporte.'
            : 'Acesso restrito a administradores autorizados'}
        </p>
      </div>
    </div>
  );
}
