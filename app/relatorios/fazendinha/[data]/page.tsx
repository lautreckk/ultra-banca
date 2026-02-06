'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Loader2, ChevronRight } from 'lucide-react';

interface Aposta {
  id: string;
  pule: string;
  tipo: string;
  modalidade: string;
  status: string;
  valor_unitario: number;
  valor_total: number;
  created_at: string;
  horarios: string[];
}

export default function FazendinhaDataPage({ params }: { params: Promise<{ data: string }> }) {
  const { data: dataParam } = use(params);
  const [loading, setLoading] = useState(true);
  const [apostas, setApostas] = useState<Aposta[]>([]);

  const dateDisplay = new Date(dataParam + 'T12:00:00').toLocaleDateString('pt-BR');

  useEffect(() => {
    const fetchApostas = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const startOfDay = `${dataParam}T00:00:00`;
      const endOfDay = `${dataParam}T23:59:59`;

      const { data, error } = await supabase
        .from('apostas')
        .select('id, pule, tipo, modalidade, status, valor_unitario, valor_total, created_at, horarios')
        .eq('user_id', user.id)
        .eq('tipo', 'fazendinha')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setApostas(data);
      }

      setLoading(false);
    };

    fetchApostas();
  }, [dataParam]);

  const getModalidadeBadgeColor = (modalidade: string) => {
    const colors: Record<string, string> = {
      centena: 'bg-purple-900/30 text-purple-300',
      dezena: 'bg-blue-900/30 text-blue-300',
      grupo: 'bg-green-900/30 text-green-300',
      milhar: 'bg-red-900/30 text-red-300',
      duque_dezena: 'bg-orange-900/30 text-orange-300',
      duque_grupo: 'bg-yellow-900/30 text-yellow-300',
      terno_dezena: 'bg-pink-900/30 text-pink-300',
      terno_grupo: 'bg-indigo-900/30 text-indigo-300',
    };
    return colors[modalidade.toLowerCase()] || 'bg-zinc-800/50 text-white';
  };

  if (loading) {
    return (
      <PageLayout title="FAZENDINHA" showBack>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="FAZENDINHA" showBack>
      <div className="space-y-4 p-4">
        {/* Date Header */}
        <div className="rounded-xl bg-zinc-800 border border-zinc-700/40 px-4 py-3 text-center">
          <span className="text-lg font-bold text-white">{dateDisplay}</span>
        </div>

        {/* Resumo */}
        <div className="rounded-xl bg-green-900/20 border border-green-500/20 px-4 py-3 text-center">
          <span className="text-2xl font-bold text-green-400">{apostas.length}</span>
          <p className="text-sm text-green-500">Apostas de Fazendinha</p>
        </div>

        {/* Lista de Pules */}
        {apostas.length === 0 ? (
          <div className="rounded-xl bg-[#1A1F2B] border border-zinc-700/40 px-4 py-8 text-center">
            <p className="text-zinc-500">Nenhuma aposta de fazendinha nesta data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apostas.map((aposta) => (
              <Link
                key={aposta.id}
                href={`/relatorios/pules/${aposta.pule || aposta.id}`}
                className="block overflow-hidden rounded-xl bg-[#1A1F2B] border border-zinc-700/40 shadow-sm active:bg-zinc-700/30 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        PULE #{aposta.pule || aposta.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getModalidadeBadgeColor(aposta.modalidade)}`}>
                        {aposta.modalidade.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {new Date(aposta.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {aposta.horarios?.join(', ') || 'N/A'}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-sm">
                      <span className="text-zinc-500">
                        Vale: {formatCurrency(aposta.valor_unitario)}
                      </span>
                      <span className="font-semibold text-white">
                        Total: {formatCurrency(aposta.valor_total)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
