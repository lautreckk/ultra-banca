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
  valor_total: number;
  created_at: string;
  horarios: string[];
}

export default function PulesDataListPage({ params }: { params: Promise<{ data: string }> }) {
  const { data: dataParam } = use(params);
  const [loading, setLoading] = useState(true);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [resumo, setResumo] = useState({ registradas: 0, canceladas: 0 });

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
        .select('id, pule, tipo, modalidade, status, valor_total, created_at, horarios')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setApostas(data);
        const registradas = data.filter(a => a.status !== 'cancelada').length;
        const canceladas = data.filter(a => a.status === 'cancelada').length;
        setResumo({ registradas, canceladas });
      }

      setLoading(false);
    };

    fetchApostas();
  }, [dataParam]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'premiada':
        return 'bg-green-500/10 text-green-400';
      case 'cancelada':
        return 'bg-red-500/10 text-red-400';
      case 'pendente':
        return 'bg-yellow-500/10 text-yellow-400';
      default:
        return 'bg-zinc-800/30 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'premiada':
        return 'PREMIADA';
      case 'cancelada':
        return 'CANCELADA';
      case 'pendente':
        return 'PENDENTE';
      case 'perdida':
        return 'PERDIDA';
      default:
        return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <PageLayout title="PULES" showBack>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="PULES" showBack>
      <div className="space-y-4 p-4">
        {/* Date Header */}
        <div className="rounded-lg bg-zinc-800 px-4 py-3 text-center">
          <span className="text-lg font-bold text-white">{dateDisplay}</span>
        </div>

        {/* Resumo */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg bg-green-500/10 px-4 py-3 text-center">
            <span className="text-2xl font-bold text-green-400">{resumo.registradas}</span>
            <p className="text-sm text-green-400">Registradas</p>
          </div>
          <div className="flex-1 rounded-lg bg-red-500/10 px-4 py-3 text-center">
            <span className="text-2xl font-bold text-red-400">{resumo.canceladas}</span>
            <p className="text-sm text-red-400">Canceladas</p>
          </div>
        </div>

        {/* Lista de Pules */}
        {apostas.length === 0 ? (
          <div className="rounded-lg bg-[#1A1F2B] px-4 py-8 text-center">
            <p className="text-zinc-500">Nenhuma pule encontrada nesta data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apostas.map((aposta) => (
              <Link
                key={aposta.id}
                href={`/relatorios/pules/${aposta.pule || aposta.id}`}
                className="block overflow-hidden rounded-lg bg-[#1A1F2B] shadow-sm active:bg-zinc-700/50"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        PULE #{aposta.pule || aposta.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(aposta.status)}`}>
                        {getStatusLabel(aposta.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {aposta.tipo.toUpperCase()} - {aposta.modalidade.toUpperCase()}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {new Date(aposta.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {aposta.horarios?.join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {formatCurrency(aposta.valor_total)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-zinc-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
