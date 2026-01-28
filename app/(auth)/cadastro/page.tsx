'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { RegisterForm } from '@/components/auth';

function CadastroContent() {
  const searchParams = useSearchParams();
  const codigoConvite = searchParams.get('p') || '';

  return (
    <div className="w-full max-w-sm">
      <RegisterForm initialCodigoConvite={codigoConvite} />
    </div>
  );
}

export default function CadastroPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-8">
      {/* Logo - Identical to Login */}
      <div className="mb-8 flex flex-col items-center">
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
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-zinc-800 rounded-lg" />
            ))}
          </div>
        </div>
      }>
        <CadastroContent />
      </Suspense>
    </main>
  );
}
