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
      centena: 'bg-purple-100 text-purple-800',
      dezena: 'bg-blue-100 text-blue-800',
      grupo: 'bg-green-100 text-green-800',
      milhar: 'bg-red-100 text-red-800',
      duque_dezena: 'bg-orange-100 text-orange-800',
      duque_grupo: 'bg-yellow-100 text-yellow-800',
      terno_dezena: 'bg-pink-100 text-pink-800',
      terno_grupo: 'bg-indigo-100 text-indigo-800',
    };
    return colors[modalidade.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <PageLayout title="FAZENDINHA" showBack>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="FAZENDINHA" showBack>
      <div className="space-y-4 p-4">
        {/* Date Header */}
        <div className="rounded-lg bg-zinc-800 px-4 py-3 text-center">
          <span className="text-lg font-bold text-white">{dateDisplay}</span>
        </div>

        {/* Resumo */}
        <div className="rounded-lg bg-green-100 px-4 py-3 text-center">
          <span className="text-2xl font-bold text-green-800">{apostas.length}</span>
          <p className="text-sm text-green-700">Apostas de Fazendinha</p>
        </div>

        {/* Lista de Pules */}
        {apostas.length === 0 ? (
          <div className="rounded-lg bg-white px-4 py-8 text-center">
            <p className="text-gray-500">Nenhuma aposta de fazendinha nesta data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apostas.map((aposta) => (
              <Link
                key={aposta.id}
                href={`/relatorios/pules/${aposta.pule || aposta.id}`}
                className="block overflow-hidden rounded-lg bg-white shadow-sm active:bg-gray-50"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">
                        PULE #{aposta.pule || aposta.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getModalidadeBadgeColor(aposta.modalidade)}`}>
                        {aposta.modalidade.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(aposta.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {aposta.horarios?.join(', ') || 'N/A'}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-sm">
                      <span className="text-gray-500">
                        Vale: {formatCurrency(aposta.valor_unitario)}
                      </span>
                      <span className="font-semibold text-gray-800">
                        Total: {formatCurrency(aposta.valor_total)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
