'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Printer, Share2, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layout';
import { BANCAS, getBichoByDezena } from '@/lib/constants';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { createClient } from '@/lib/supabase/client';

interface ResultadoDB {
  id: string;
  data: string;
  horario: string;
  banca: string;
  loteria: string;
  premio_1: string;
  premio_2: string;
  premio_3: string;
  premio_4: string;
  premio_5: string;
  bicho_1: string;
  bicho_2: string;
  bicho_3: string;
  bicho_4: string;
  bicho_5: string;
}

interface ResultadoFormatado {
  posicao: number;
  numero: string;
  grupo: string;
  bicho: string;
}

// Mapeamento de IDs de subloterias para filtros do banco
function getLoteriaFilter(loteriaId: string): { banca: string; horario: string; loteria?: string } | null {
  // Mapeamento baseado na estrutura de BANCAS e dados do banco
  const mappings: Record<string, { banca: string; horario: string; loteria?: string }> = {
    // FEDERAL
    'fed_19': { banca: 'FEDERAL', horario: '19:00', loteria: 'FEDERAL' },
    'fed_19_maluca': { banca: 'FEDERAL', horario: '19:00', loteria: 'FEDERAL' },

    // RIO/FEDERAL
    'rj_pt_09': { banca: 'RIO/FEDERAL', horario: '09:20', loteria: 'PT' },
    'rj_pt_09_maluca': { banca: 'RIO/FEDERAL', horario: '09:20', loteria: 'PT' },
    'rj_ptm_11': { banca: 'RIO/FEDERAL', horario: '11:00', loteria: 'PTM' },
    'rj_ptm_11_maluca': { banca: 'RIO/FEDERAL', horario: '11:00', loteria: 'PTM' },
    'rj_pt_14': { banca: 'RIO/FEDERAL', horario: '14:20', loteria: 'PT' },
    'rj_pt_14_maluca': { banca: 'RIO/FEDERAL', horario: '14:20', loteria: 'PT' },
    'rj_ptv_16': { banca: 'RIO/FEDERAL', horario: '16:00', loteria: 'PTV' },
    'rj_ptv_16_maluca': { banca: 'RIO/FEDERAL', horario: '16:00', loteria: 'PTV' },
    'rj_ptn_18': { banca: 'RIO/FEDERAL', horario: '18:20', loteria: 'PTN' },
    'rj_coruja_21': { banca: 'RIO/FEDERAL', horario: '21:20', loteria: 'CORUJA' },
    'rj_coruja_21_maluca': { banca: 'RIO/FEDERAL', horario: '21:20', loteria: 'CORUJA' },

    // BAHIA (MALUCA tem resultados separados)
    'ba_10': { banca: 'BAHIA', horario: '10:00', loteria: 'GERAL' },
    'ba_maluca_10': { banca: 'BAHIA', horario: '10:00', loteria: 'MALUCA' },
    'ba_12': { banca: 'BAHIA', horario: '12:00', loteria: 'GERAL' },
    'ba_maluca_12': { banca: 'BAHIA', horario: '12:00', loteria: 'MALUCA' },
    'ba_15': { banca: 'BAHIA', horario: '15:00', loteria: 'GERAL' },
    'ba_maluca_15': { banca: 'BAHIA', horario: '15:00', loteria: 'MALUCA' },
    'ba_20': { banca: 'BAHIA', horario: '20:00', loteria: 'GERAL' },
    'ba_maluca_20': { banca: 'BAHIA', horario: '20:00', loteria: 'MALUCA' },
    'ba_21': { banca: 'BAHIA', horario: '21:00', loteria: 'GERAL' },
    'ba_maluca_21': { banca: 'BAHIA', horario: '21:00', loteria: 'MALUCA' },

    // NACIONAL
    'nac_02': { banca: 'NACIONAL', horario: '02:00', loteria: 'NACIONAL' },
    'nac_02_maluca': { banca: 'NACIONAL', horario: '02:00', loteria: 'NACIONAL' },
    'nac_08': { banca: 'NACIONAL', horario: '08:00', loteria: 'NACIONAL' },
    'nac_08_maluca': { banca: 'NACIONAL', horario: '08:00', loteria: 'NACIONAL' },
    'nac_10': { banca: 'NACIONAL', horario: '10:00', loteria: 'NACIONAL' },
    'nac_10_maluca': { banca: 'NACIONAL', horario: '10:00', loteria: 'NACIONAL' },
    'nac_12': { banca: 'NACIONAL', horario: '12:00', loteria: 'NACIONAL' },
    'nac_12_maluca': { banca: 'NACIONAL', horario: '12:00', loteria: 'NACIONAL' },
    'nac_15': { banca: 'NACIONAL', horario: '15:00', loteria: 'NACIONAL' },
    'nac_15_maluca': { banca: 'NACIONAL', horario: '15:00', loteria: 'NACIONAL' },
    'nac_17': { banca: 'NACIONAL', horario: '17:00', loteria: 'NACIONAL' },
    'nac_17_maluca': { banca: 'NACIONAL', horario: '17:00', loteria: 'NACIONAL' },
    'nac_21': { banca: 'NACIONAL', horario: '21:00', loteria: 'NACIONAL' },
    'nac_21_maluca': { banca: 'NACIONAL', horario: '21:00', loteria: 'NACIONAL' },
    'nac_23': { banca: 'NACIONAL', horario: '23:00', loteria: 'NACIONAL' },
    'nac_23_maluca': { banca: 'NACIONAL', horario: '23:00', loteria: 'NACIONAL' },

    // LOOK/GOIAS
    'go_07': { banca: 'LOOK/GOIAS', horario: '07:00', loteria: 'LOOK' },
    'go_07_maluca': { banca: 'LOOK/GOIAS', horario: '07:00', loteria: 'LOOK' },
    'go_09': { banca: 'LOOK/GOIAS', horario: '09:00', loteria: 'LOOK' },
    'go_09_maluca': { banca: 'LOOK/GOIAS', horario: '09:00', loteria: 'LOOK' },
    'go_11': { banca: 'LOOK/GOIAS', horario: '11:00', loteria: 'LOOK' },
    'go_11_maluca': { banca: 'LOOK/GOIAS', horario: '11:00', loteria: 'LOOK' },
    'go_14': { banca: 'LOOK/GOIAS', horario: '14:00', loteria: 'LOOK' },
    'go_14_maluca': { banca: 'LOOK/GOIAS', horario: '14:00', loteria: 'LOOK' },
    'go_16': { banca: 'LOOK/GOIAS', horario: '16:00', loteria: 'LOOK' },
    'go_16_maluca': { banca: 'LOOK/GOIAS', horario: '16:00', loteria: 'LOOK' },
    'go_18': { banca: 'LOOK/GOIAS', horario: '18:00', loteria: 'LOOK' },
    'go_18_maluca': { banca: 'LOOK/GOIAS', horario: '18:00', loteria: 'LOOK' },
    'go_21': { banca: 'LOOK/GOIAS', horario: '21:00', loteria: 'LOOK' },
    'go_21_maluca': { banca: 'LOOK/GOIAS', horario: '21:00', loteria: 'LOOK' },
    'go_23': { banca: 'LOOK/GOIAS', horario: '23:00', loteria: 'LOOK' },

    // BOASORTE/GOIAS
    'bs_09': { banca: 'BOASORTE', horario: '09:20', loteria: 'BOASORTE' },
    'bs_09_maluca': { banca: 'BOASORTE', horario: '09:20', loteria: 'BOASORTE' },
    'bs_11': { banca: 'BOASORTE', horario: '11:20', loteria: 'BOASORTE' },
    'bs_11_maluca': { banca: 'BOASORTE', horario: '11:20', loteria: 'BOASORTE' },
    'bs_14': { banca: 'BOASORTE', horario: '14:20', loteria: 'BOASORTE' },
    'bs_14_maluca': { banca: 'BOASORTE', horario: '14:20', loteria: 'BOASORTE' },
    'bs_16': { banca: 'BOASORTE', horario: '16:20', loteria: 'BOASORTE' },
    'bs_16_maluca': { banca: 'BOASORTE', horario: '16:20', loteria: 'BOASORTE' },
    'bs_18': { banca: 'BOASORTE', horario: '18:20', loteria: 'BOASORTE' },
    'bs_18_maluca': { banca: 'BOASORTE', horario: '18:20', loteria: 'BOASORTE' },
    'bs_21': { banca: 'BOASORTE', horario: '21:20', loteria: 'BOASORTE' },
    'bs_21_maluca': { banca: 'BOASORTE', horario: '21:20', loteria: 'BOASORTE' },

    // LOTECE
    'ce_11': { banca: 'LOTECE', horario: '11:00', loteria: 'LOTECE' },
    'ce_11_maluca': { banca: 'LOTECE', horario: '11:00', loteria: 'LOTECE' },
    'ce_14': { banca: 'LOTECE', horario: '14:00', loteria: 'LOTECE' },
    'ce_14_maluca': { banca: 'LOTECE', horario: '14:00', loteria: 'LOTECE' },
    'ce_15': { banca: 'LOTECE', horario: '15:45', loteria: 'LOTECE' },
    'ce_15_maluca': { banca: 'LOTECE', horario: '15:45', loteria: 'LOTECE' },
    'ce_19': { banca: 'LOTECE', horario: '19:00', loteria: 'LOTECE' },
    'ce_19_maluca': { banca: 'LOTECE', horario: '19:00', loteria: 'LOTECE' },

    // LOTEP/PE
    'pe_09': { banca: 'LOTEP', horario: '09:20' },
    'pe_09_maluca': { banca: 'LOTEP', horario: '09:20' },
    'pe_10': { banca: 'LOTEP', horario: '10:00' },
    'pe_10_maluca': { banca: 'LOTEP', horario: '10:00' },
    'pe_12': { banca: 'LOTEP', horario: '12:40' },
    'pe_12_maluca': { banca: 'LOTEP', horario: '12:40' },
    'pe_15': { banca: 'LOTEP', horario: '15:40' },
    'pe_15_maluca': { banca: 'LOTEP', horario: '15:40' },
    'pe_18': { banca: 'LOTEP', horario: '18:30' },
    'pe_18_maluca': { banca: 'LOTEP', horario: '18:30' },
    'pe_20': { banca: 'LOTEP', horario: '20:00' },
    'pe_20_maluca': { banca: 'LOTEP', horario: '20:00' },

    // SÃO PAULO
    'sp_08': { banca: 'SAO-PAULO', horario: '08:00' },
    'sp_08_maluca': { banca: 'SAO-PAULO', horario: '08:00' },
    'sp_10': { banca: 'SAO-PAULO', horario: '10:00' },
    'sp_10_maluca': { banca: 'SAO-PAULO', horario: '10:00' },
    'sp_12': { banca: 'SAO-PAULO', horario: '12:00' },
    'sp_12_maluca': { banca: 'SAO-PAULO', horario: '12:00' },
    'sp_13': { banca: 'SAO-PAULO', horario: '13:00' },
    'sp_13_maluca': { banca: 'SAO-PAULO', horario: '13:00' },
    'sp_band_15': { banca: 'SAO-PAULO', horario: '15:30', loteria: 'BANDEIRANTES' },
    'sp_band_15_maluca': { banca: 'SAO-PAULO', horario: '15:30', loteria: 'BANDEIRANTES' },
    'sp_17': { banca: 'SAO-PAULO', horario: '17:00' },
    'sp_17_maluca': { banca: 'SAO-PAULO', horario: '17:00' },
    'sp_18': { banca: 'SAO-PAULO', horario: '18:00' },
    'sp_18_maluca': { banca: 'SAO-PAULO', horario: '18:00' },
    'sp_19': { banca: 'SAO-PAULO', horario: '19:00' },
    'sp_19_maluca': { banca: 'SAO-PAULO', horario: '19:00' },

    // MINAS GERAIS
    'mg_12': { banca: 'MINAS-GERAIS', horario: '12:00', loteria: 'ALVORADA' },
    'mg_12_maluca': { banca: 'MINAS-GERAIS', horario: '12:00', loteria: 'ALVORADA' },
    'mg_15': { banca: 'MINAS-GERAIS', horario: '15:00', loteria: 'MINAS-DIA' },
    'mg_15_maluca': { banca: 'MINAS-GERAIS', horario: '15:00', loteria: 'MINAS-DIA' },

    // SORTE/RS
    'rs_11': { banca: 'RIO-GRANDE-SUL', horario: '11:00' },
    'rs_11_maluca': { banca: 'RIO-GRANDE-SUL', horario: '11:00' },
    'rs_14': { banca: 'RIO-GRANDE-SUL', horario: '14:00' },
    'rs_14_maluca': { banca: 'RIO-GRANDE-SUL', horario: '14:00' },
    'rs_16': { banca: 'RIO-GRANDE-SUL', horario: '16:00' },
    'rs_16_maluca': { banca: 'RIO-GRANDE-SUL', horario: '16:00' },
    'rs_18': { banca: 'RIO-GRANDE-SUL', horario: '18:00' },
    'rs_18_maluca': { banca: 'RIO-GRANDE-SUL', horario: '18:00' },
    'rs_21': { banca: 'RIO-GRANDE-SUL', horario: '21:00' },
    'rs_21_maluca': { banca: 'RIO-GRANDE-SUL', horario: '21:00' },

    // LBR/BRASILIA
    'df_00': { banca: 'BRASILIA', horario: '00:40', loteria: 'LBR' },
    'df_07': { banca: 'BRASILIA', horario: '07:30', loteria: 'LBR' },
    'df_08': { banca: 'BRASILIA', horario: '08:30', loteria: 'LBR' },
    'df_10': { banca: 'BRASILIA', horario: '10:00', loteria: 'LBR' },
    'df_12': { banca: 'BRASILIA', horario: '12:40', loteria: 'LBR' },
    'df_13': { banca: 'BRASILIA', horario: '13:00', loteria: 'LBR' },
    'df_15': { banca: 'BRASILIA', horario: '15:00', loteria: 'LBR' },
    'df_17': { banca: 'BRASILIA', horario: '17:00', loteria: 'LBR' },
    'df_18': { banca: 'BRASILIA', horario: '18:40', loteria: 'LBR' },
    'df_19': { banca: 'BRASILIA', horario: '19:00', loteria: 'LBR' },
    'df_20': { banca: 'BRASILIA', horario: '20:40', loteria: 'LBR' },
    'df_22': { banca: 'BRASILIA', horario: '22:00', loteria: 'LBR' },
    'df_23': { banca: 'BRASILIA', horario: '23:00', loteria: 'LBR' },

    // PARAÍBA
    'pb_09': { banca: 'PARAIBA', horario: '09:45' },
    'pb_10': { banca: 'PARAIBA', horario: '10:45' },
    'pb_12': { banca: 'PARAIBA', horario: '12:45' },
    'pb_15': { banca: 'PARAIBA', horario: '15:45' },
    'pb_18': { banca: 'PARAIBA', horario: '18:00' },
    'pb_19': { banca: 'PARAIBA', horario: '19:05' },
    'pb_20': { banca: 'PARAIBA', horario: '20:00' },
    'pb_lotep_10': { banca: 'PARAIBA', horario: '10:45', loteria: 'LOTEP' },
    'pb_lotep_12': { banca: 'PARAIBA', horario: '12:45', loteria: 'LOTEP' },
    'pb_lotep_15': { banca: 'PARAIBA', horario: '15:45', loteria: 'LOTEP' },
    'pb_lotep_18': { banca: 'PARAIBA', horario: '18:00', loteria: 'LOTEP' },

    // RIO GRANDE DO NORTE
    'rn_08': { banca: 'RIO-GRANDE-NORTE', horario: '08:30' },
    'rn_11': { banca: 'RIO-GRANDE-NORTE', horario: '11:45' },
    'rn_16': { banca: 'RIO-GRANDE-NORTE', horario: '16:45' },
    'rn_18': { banca: 'RIO-GRANDE-NORTE', horario: '18:30' },

    // SERGIPE
    'se_10': { banca: 'SERGIPE', horario: '10:00' },
    'se_13': { banca: 'SERGIPE', horario: '13:00' },
    'se_14': { banca: 'SERGIPE', horario: '14:00' },
    'se_16': { banca: 'SERGIPE', horario: '16:00' },
    'se_19': { banca: 'SERGIPE', horario: '19:00' },

    // PARANÁ
    'pr_14': { banca: 'PARANA', horario: '14:00' },
    'pr_18': { banca: 'PARANA', horario: '18:00' },
  };
  return mappings[loteriaId] || null;
}

function formatResultados(resultado: ResultadoDB): ResultadoFormatado[] {
  const premios = [
    { milhar: resultado.premio_1, bicho: resultado.bicho_1 },
    { milhar: resultado.premio_2, bicho: resultado.bicho_2 },
    { milhar: resultado.premio_3, bicho: resultado.bicho_3 },
    { milhar: resultado.premio_4, bicho: resultado.bicho_4 },
    { milhar: resultado.premio_5, bicho: resultado.bicho_5 },
  ];

  return premios.map((premio, index) => {
    const dezena = parseInt(premio.milhar.slice(-2));
    const bicho = premio.bicho || getBichoByDezena(dezena)?.nome || 'Desconhecido';
    const grupo = Math.ceil(dezena === 0 ? 25 : dezena / 4);
    return {
      posicao: index + 1,
      numero: premio.milhar.padStart(4, '0'),
      grupo: `G.${grupo.toString().padStart(2, '0')}`,
      bicho,
    };
  });
}

export default function ResultadoVerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const config = usePlatformConfig();
  const data = params.data as string;
  const loteriasParam = searchParams.get('loterias') || '';
  const selectedLoterias = loteriasParam.split(',').filter(Boolean);

  const [resultados, setResultados] = useState<Record<string, ResultadoFormatado[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date
  const dateObj = new Date(data + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR');

  // Buscar resultados do Supabase
  useEffect(() => {
    async function fetchResultados() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const resultadosMap: Record<string, ResultadoFormatado[]> = {};

      for (const loteriaId of selectedLoterias) {
        const filter = getLoteriaFilter(loteriaId);
        if (!filter) {
          console.warn(`Filtro nao encontrado para ${loteriaId}`);
          continue;
        }

        // Buscar resultado com horário exato
        let query = supabase
          .from('resultados')
          .select('*')
          .eq('data', data)
          .eq('banca', filter.banca)
          .eq('horario', filter.horario);

        // Se tiver loteria especifica, filtrar por ela
        if (filter.loteria) {
          query = query.eq('loteria', filter.loteria);
        }

        const { data: resultadoData, error: queryError } = await query.limit(1).single();

        if (queryError) {
          // Tentar buscar sem filtro de loteria especifica (GERAL)
          if (filter.loteria) {
            const { data: resultadoGeral } = await supabase
              .from('resultados')
              .select('*')
              .eq('data', data)
              .eq('banca', filter.banca)
              .eq('horario', filter.horario)
              .eq('loteria', 'GERAL')
              .limit(1)
              .single();

            if (resultadoGeral) {
              resultadosMap[loteriaId] = formatResultados(resultadoGeral as ResultadoDB);
              continue;
            }
          }
          console.warn(`Resultado nao encontrado para ${loteriaId}:`, queryError.message);
          continue;
        }

        if (resultadoData) {
          resultadosMap[loteriaId] = formatResultados(resultadoData as ResultadoDB);
        }
      }

      setResultados(resultadosMap);
      setLoading(false);

      if (Object.keys(resultadosMap).length === 0 && selectedLoterias.length > 0) {
        setError('Nenhum resultado encontrado para esta data. Tente outra data.');
      }
    }

    if (selectedLoterias.length > 0) {
      fetchResultados();
    } else {
      setLoading(false);
    }
  }, [data, selectedLoterias]);

  // Get lottery info
  const getLoteriaInfo = (loteriaId: string) => {
    for (const banca of BANCAS) {
      const sub = banca.subLoterias.find((s) => s.id === loteriaId);
      if (sub) {
        const hour = sub.horario.split(':')[0];
        return {
          nome: `LT ${sub.nome} ${hour}HS`,
          banca: banca.nome,
        };
      }
    }
    return { nome: loteriaId, banca: '' };
  };

  const handleShare = async () => {
    const text = `Resultados - ${formattedDate}\n\n` +
      selectedLoterias.map((id) => {
        const info = getLoteriaInfo(id);
        return info.nome;
      }).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resultados - ${config.site_name}`,
          text: text,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <PageLayout title="RESULTADO" showBack>
        <div className="bg-[#1A1F2B] min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#E5A220]" />
            <p className="text-zinc-400">Carregando resultados...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="RESULTADO" showBack>
      <div className="bg-[#1A1F2B] min-h-screen">
        {/* Header Info */}
        <div className="px-4 py-4 border-b border-zinc-700/40">
          <h1 className="text-xl font-bold text-center text-white mb-4">{config.site_name.toUpperCase()}</h1>

          <div className="flex justify-between text-sm mb-2">
            <div>
              <p className="text-zinc-500 text-xs uppercase">Vendedor</p>
              <p className="font-medium text-white">{formattedDate}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-500">979536</p>
              <p className="font-medium text-white">{currentTime}</p>
            </div>
          </div>

          <div className="border-t border-zinc-700/40 pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 text-xs uppercase">Resultados</span>
              <span className="font-medium text-white">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-8 text-center">
            <p className="text-zinc-400">{error}</p>
          </div>
        )}

        {/* Results per Loteria */}
        <div className="px-4 py-4 space-y-6">
          {selectedLoterias.map((loteriaId) => {
            const info = getLoteriaInfo(loteriaId);
            const results = resultados[loteriaId];

            if (!results || results.length === 0) {
              return (
                <div key={loteriaId} className="border-b border-zinc-700/40 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-white">{info.nome}</h2>
                  </div>
                  <p className="text-zinc-500 text-sm">Resultado nao disponivel para esta data.</p>
                </div>
              );
            }

            return (
              <div key={loteriaId} className="border-b border-zinc-700/40 pb-4">
                {/* Loteria Header */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-white">{info.nome}</h2>
                  <button
                    onClick={handlePrint}
                    className="p-2 text-zinc-500 hover:text-zinc-200"
                  >
                    <Printer className="h-5 w-5" />
                  </button>
                </div>

                {/* Results List */}
                <div className="space-y-1">
                  {results.map((result) => (
                    <div
                      key={result.posicao}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white w-6">{result.posicao}:</span>
                        <span className="text-zinc-200">
                          {result.numero} - {result.grupo}
                        </span>
                      </div>
                      <span className="text-zinc-200">{result.bicho}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Share Button */}
        <div className="px-4 pb-8">
          <button
            onClick={handleShare}
            className="w-full py-3 bg-zinc-800/30 hover:bg-zinc-700/50 rounded-lg font-medium text-zinc-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="h-5 w-5" />
            Compartilhar
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
