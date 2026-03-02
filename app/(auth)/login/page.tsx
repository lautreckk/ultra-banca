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
      {cadastroSucesso && (
        <div className="mb-4 w-full max-w-sm rounded-xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm p-4 text-center text-base font-semibold text-emerald-300">
          Conta criada com sucesso! Faça login para continuar.
        </div>
      )}
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </>
  );
}

export default function LoginPage() {
  const config = usePlatformConfig();

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10"
      style={{ backgroundColor: config.color_background }}
    >
      {/* Background Image */}
      {config.login_bg_url && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${config.login_bg_url})` }}
        />
      )}

      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-black/65" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          {config.logo_url ? (
            <Image
              src={config.logo_url}
              alt={config.site_name}
              width={220}
              height={90}
              className="object-contain drop-shadow-2xl"
              priority
              unoptimized={config.logo_url.includes('supabase.co')}
            />
          ) : (
            <div className="flex h-[90px] w-[220px] items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white drop-shadow-lg">{config.site_name}</span>
            </div>
          )}
        </div>

        <Suspense fallback={
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        }>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
