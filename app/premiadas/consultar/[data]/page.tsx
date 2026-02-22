'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Trophy, Calendar, Clock, Loader2 } from 'lucide-react';
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
  profiles?: {
    nome: string;
    cpf: string;
  };
}

interface Resultado {
  id: string;
  data: string;
  horario: string;
  premio_1: string | null;
  premio_2: string | null;
  premio_3: string | null;
  premio_4: string | null;
  premio_5: string | null;
  premio_6: string | null;
  premio_7: string | null;
  premio_8: string | null;
  premio_9: string | null;
  premio_10: string | null;
  bicho_1: string | null;
  bicho_2: string | null;
  bicho_3: string | null;
  bicho_4: string | null;
  bicho_5: string | null;
  bicho_6: string | null;
  bicho_7: string | null;
  bicho_8: string | null;
  bicho_9: string | null;
  bicho_10: string | null;
}

export default function PremiadasPorDataPage() {
  const params = useParams();
  const data = params.data as string;
  const [apostas, setApostas] = useState<ApostaPremiada[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar apostas premiadas da data
        const { data: apostasData, error: apostasError } = await supabase
          .from('apostas')
          .select(`
            *,
            profiles:user_id (nome, cpf)
          `)
          .eq('data_jogo', data)
          .eq('status', 'premiada')
          .order('created_at', { ascending: false });

        if (!apostasError && apostasData) {
          setApostas(apostasData);
        }

        // Buscar resultados da data
        const { data: resultadosData, error: resultadosError } = await supabase
          .from('resultados')
          .select('*')
          .eq('data', data)
          .order('horario', { ascending: true });

        if (!resultadosError && resultadosData) {
          setResultados(resultadosData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (data) {
      fetchData();
    }
  }, [supabase, data]);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const totalPremios = apostas.reduce((acc, a) => acc + (a.premio_valor || 0), 0);

  return (
    <PageLayout title={`PREMIADAS - ${formatDate(data)}`} showBack>
      <div className="bg-[#111318] min-h-screen space-y-4 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4A84B]" />
          </div>
        ) : (
          <>
            {/* Resultados do dia */}
            {resultados.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#D4A84B]" />
                  Resultados do Dia
                </h2>
                <div className="space-y-2">
                  {resultados.map((resultado) => (
                    <div
                      key={resultado.id}
                      className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#D4A84B] font-medium">{resultado.horario}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
                          const premio = resultado[`premio_${i}` as keyof Resultado] as string | null;
                          return (
                            <div key={i} className="text-center">
                              <span className="text-xs text-zinc-300">{i}º</span>
                              <p className="font-mono text-white text-sm">{premio || '-'}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estatísticas */}
            {apostas.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-300">Apostas Premiadas</p>
                    <p className="text-2xl font-bold text-white">{apostas.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">Total em Prêmios</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalPremios)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de premiadas */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#D4A84B]" />
                Apostas Premiadas
              </h2>

              {apostas.length === 0 ? (
                <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-8 text-center">
                  <Trophy className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
                  <p className="text-zinc-500">Nenhuma aposta premiada nesta data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apostas.map((aposta) => (
                    <div
                      key={aposta.id}
                      className="bg-[#1A1F2B] border border-emerald-500/20 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          {aposta.profiles && (
                            <p className="text-sm text-zinc-300">{aposta.profiles.nome}</p>
                          )}
                          <p className="text-white font-medium capitalize">
                            {aposta.tipo} - {aposta.modalidade}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-300">Prêmio</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {formatCurrency(aposta.premio_valor)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {aposta.palpites.map((palpite, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-[#D4A84B]/20 text-[#D4A84B] rounded-xl text-sm font-mono"
                          >
                            {palpite}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-300">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {aposta.horarios.join(', ')}
                        </span>
                        {aposta.pule && (
                          <span className="text-zinc-500">Pule: {aposta.pule}</span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-zinc-700/40 flex items-center justify-between text-sm">
                        <span className="text-zinc-300">
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
          </>
        )}
      </div>
    </PageLayout>
  );
}
