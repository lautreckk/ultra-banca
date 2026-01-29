'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Trophy, Calendar, Clock, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format-currency';

interface ApostaPremiada {
  id: string;
  tipo: string;
  modalidade: string;
  palpites: string[];
  horarios: string[];
  data_jogo: string;
  valor_total: number;
  premio_valor: number;
  created_at: string;
  pule?: string;
}

export default function PremiadasPage() {
  const [apostas, setApostas] = useState<ApostaPremiada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPremios, setTotalPremios] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchPremiadas = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('apostas')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'premiada')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setApostas(data);
          setTotalPremios(data.reduce((acc, a) => acc + (a.premio_valor || 0), 0));
        }
      } catch (error) {
        console.error('Erro ao buscar premiadas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPremiadas();
  }, [supabase]);

  return (
    <PageLayout title="PREMIADAS" showBack>
      <div className="space-y-4 p-4">
        {/* Menu de consulta */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <Link
            href="/premiadas/consultar"
            className="flex items-center justify-between px-4 py-4 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#D4A84B]" />
              <span className="font-medium text-gray-800">CONSULTAR POR DATA</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        </div>

        {/* Total de prêmios */}
        {totalPremios > 0 && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm text-emerald-300">Total em Prêmios</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalPremios)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de premiadas */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#D4A84B]" />
            Minhas Premiadas
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#D4A84B]" />
            </div>
          ) : apostas.length === 0 ? (
            <div className="bg-zinc-900/50 rounded-xl p-8 text-center">
              <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma aposta premiada ainda</p>
              <p className="text-sm text-gray-500 mt-1">Continue apostando para ganhar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apostas.map((aposta) => (
                <div
                  key={aposta.id}
                  className="bg-zinc-900/80 border border-emerald-500/20 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-400 uppercase">{aposta.tipo}</p>
                      <p className="text-white font-medium capitalize">{aposta.modalidade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Prêmio</p>
                      <p className="text-lg font-bold text-emerald-400">
                        {formatCurrency(aposta.premio_valor)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {aposta.palpites.map((palpite, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-[#D4A84B]/20 text-[#D4A84B] rounded-lg text-sm font-mono"
                      >
                        {palpite}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(aposta.data_jogo).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {aposta.horarios.join(', ')}
                      </span>
                    </div>
                    {aposta.pule && (
                      <span className="text-gray-600">Pule: {aposta.pule}</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Aposta: {formatCurrency(aposta.valor_total)}
                    </span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      PREMIADA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
