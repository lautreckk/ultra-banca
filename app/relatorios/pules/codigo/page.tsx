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
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Codigo da Pule
            </label>
            <div className="relative">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Digite o codigo da pule"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-gray-800 placeholder-gray-400 focus:border-[#E5A220] focus:outline-none focus:ring-2 focus:ring-[#E5A220]/20"
              />
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={!codigo.trim()}
            className="w-full rounded-lg bg-[#E5A220] py-4 font-bold text-zinc-900 transition-colors hover:bg-[#D49A18] disabled:cursor-not-allowed disabled:opacity-50"
          >
            AVANCAR
          </button>
        </form>
      </div>
    </PageLayout>
  );
}
