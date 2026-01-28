'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { LoginForm } from '@/components/auth';

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
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-8">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center">
        <Image
          src="/images/logo-banca-forte.jpeg"
          alt="Banca Forte"
          width={200}
          height={200}
          className="mb-2"
          priority
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
