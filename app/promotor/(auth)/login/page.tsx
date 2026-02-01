'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, UserPlus, Loader2 } from 'lucide-react';

export default function PromotorLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se já está logado como promotor
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Verificar se é promotor
      const { data: promotorRole } = await supabase
        .from('promotor_roles')
        .select('promotor_id')
        .eq('user_id', session.user.id)
        .single();

      if (promotorRole) {
        router.push('/promotor');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Fazer login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError) {
        setError('Email ou senha incorretos');
        setIsLoading(false);
        return;
      }

      // Verificar se é promotor
      const { data: promotorRole } = await supabase
        .from('promotor_roles')
        .select('promotor_id')
        .eq('user_id', data.user.id)
        .single();

      if (!promotorRole) {
        await supabase.auth.signOut();
        setError('Acesso não autorizado. Esta área é exclusiva para promotores.');
        setIsLoading(false);
        return;
      }

      // Verificar se promotor está ativo
      const { data: promotor } = await supabase
        .from('promotores')
        .select('ativo')
        .eq('id', promotorRole.promotor_id)
        .single();

      if (!promotor?.ativo) {
        await supabase.auth.signOut();
        setError('Sua conta de promotor está inativa. Entre em contato com o suporte.');
        setIsLoading(false);
        return;
      }

      // Sucesso - redirecionar para dashboard do promotor
      router.push('/promotor');
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-900/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <UserPlus className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Portal do Promotor
          </h1>
          <p className="text-zinc-500 mt-3">
            Acesse com suas credenciais de promotor
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-12 pl-12 pr-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-zinc-600 transition-all duration-200"
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
                className="w-full h-12 pl-12 pr-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-zinc-600 transition-all duration-200"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full h-12 mt-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 text-emerald-400 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        <p className="text-center text-zinc-600 text-sm mt-8">
          Acesso restrito a promotores autorizados
        </p>
      </div>
    </div>
  );
}
