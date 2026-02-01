'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { RegisterForm } from '@/components/auth';
import { usePlatformConfig } from '@/contexts/platform-config-context';

function CadastroContent() {
  const searchParams = useSearchParams();
  // Suporta tanto ?p= (código de usuário) quanto ?ref= (código de promotor)
  const codigoConvite = searchParams.get('p') || searchParams.get('ref') || '';

  return (
    <div className="w-full max-w-sm">
      <RegisterForm initialCodigoConvite={codigoConvite} />
    </div>
  );
}

export default function CadastroPage() {
  const config = usePlatformConfig();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-8" style={{ backgroundColor: config.color_background }}>
      {/* Logo - Dinâmica do banco de dados */}
      <div className="mb-8 flex flex-col items-center">
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
