'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { RegisterForm } from '@/components/auth';
import { usePlatformConfig } from '@/contexts/platform-config-context';

function CadastroContent() {
  const searchParams = useSearchParams();
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
    <main
      className="relative flex min-h-screen flex-col items-center px-5 py-10"
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

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center pt-6">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          {config.logo_url ? (
            <Image
              src={config.logo_url}
              alt={config.site_name}
              width={180}
              height={72}
              className="object-contain drop-shadow-2xl"
              priority
              unoptimized={config.logo_url.includes('supabase.co')}
            />
          ) : (
            <div className="flex h-[72px] w-[180px] items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-xl font-bold text-white drop-shadow-lg">{config.site_name}</span>
            </div>
          )}
        </div>

        <Suspense fallback={
          <div className="w-full max-w-sm">
            <div className="animate-pulse space-y-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-14 bg-white/10 rounded-xl" />
              ))}
            </div>
          </div>
        }>
          <CadastroContent />
        </Suspense>
      </div>
    </main>
  );
}
