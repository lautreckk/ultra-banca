'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LoginForm } from '@/components/auth';
import { usePlatformConfig } from '@/contexts/platform-config-context';

function LoginContent() {
  const searchParams = useSearchParams();
  const cadastroSucesso = searchParams.get('cadastro') === 'sucesso';

  return (
    <>
      {/* Success Message */}
      {cadastroSucesso && (
        <div className="mb-6 w-full max-w-sm rounded-lg bg-green-900/50 p-3 text-center text-sm text-green-300">
          Conta criada com sucesso! Faca login para continuar.
        </div>
      )}

      {/* Form */}
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </>
  );
}

export default function LoginPage() {
  const config = usePlatformConfig();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-8" style={{ backgroundColor: config.color_background }}>
      {/* Logo - Dinâmica do banco de dados */}
      <div className="mb-10 flex flex-col items-center">
        <Image
          src={config.logo_url || '/images/logo.png'}
          alt={config.site_name}
          width={250}
          height={100}
          className="mb-2 object-contain"
          priority
          unoptimized={config.logo_url?.includes('supabase.co')}
        />
      </div>

      <Suspense fallback={
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </main>
  );
}
