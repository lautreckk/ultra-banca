'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { Search } from 'lucide-react';

export default function PuleCodigoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) {
      router.push(`/relatorios/pules/${codigo.trim()}`);
    }
  };

  return (
    <PageLayout title="CONSULTAR PULE" showBack>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-200">
              Codigo da Pule
            </label>
            <div className="relative">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Digite o codigo da pule"
                className="w-full rounded-xl border border-zinc-700/40 bg-[#1A1F2B] px-4 py-3 h-14 min-h-[56px] pr-12 text-white placeholder-zinc-500 focus:border-[#E5A220] focus:outline-none focus:ring-2 focus:ring-[#E5A220]/20"
              />
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={!codigo.trim()}
            className="w-full rounded-xl h-14 min-h-[56px] bg-[#E5A220] font-bold text-zinc-900 active:scale-[0.98] transition-all hover:bg-[#D49A18] disabled:cursor-not-allowed disabled:opacity-50"
          >
            AVANCAR
          </button>
        </form>
      </div>
    </PageLayout>
  );
}
