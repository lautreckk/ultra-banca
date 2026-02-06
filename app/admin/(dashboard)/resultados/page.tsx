'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar, RefreshCw, ExternalLink, Filter, ChevronLeft, ChevronRight,
  Search, Download, AlertCircle
} from 'lucide-react';

interface Resultado {
  id: string;
  data: string;
  horario: string;
  banca: string;
  loteria: string | null;
  premio_1: string | null;
  premio_2: string | null;
  premio_3: string | null;
  premio_4: string | null;
  premio_5: string | null;
  premio_6: string | null;
  premio_7: string | null;
  created_at: string;
}

// Todas as bancas disponíveis
const BANCAS = [
  { value: '', label: 'Todas as Bancas' },
  { value: 'RIO/FEDERAL', label: 'RIO/FEDERAL', urlParam: 'RJ' },
  { value: 'BAHIA', label: 'BAHIA', urlParam: 'BA' },
  { value: 'LOOK/GOIAS', label: 'LOOK/GOIÁS', urlParam: 'GO' },
  { value: 'LOTECE', label: 'LOTECE (CE)', urlParam: 'CE' },
  { value: 'LOTEP', label: 'LOTEP (PE)', urlParam: 'PE' },
  { value: 'PARAIBA', label: 'PARAÍBA', urlParam: 'PB' },
  { value: 'SAO-PAULO', label: 'SÃO PAULO', urlParam: 'SP' },
  { value: 'MINAS-GERAIS', label: 'MINAS GERAIS', urlParam: 'MG' },
  { value: 'BRASILIA', label: 'LBR/BRASÍLIA', urlParam: 'DF' },
  { value: 'RIO-GRANDE-NORTE', label: 'RIO GRANDE DO NORTE', urlParam: 'RN' },
  { value: 'RIO-GRANDE-SUL', label: 'RIO GRANDE DO SUL', urlParam: 'RS' },
  { value: 'SERGIPE', label: 'SERGIPE', urlParam: 'SE' },
  { value: 'PARANA', label: 'PARANÁ', urlParam: 'PR' },
  { value: 'NACIONAL', label: 'NACIONAL', urlParam: 'NAC' },
  { value: 'FEDERAL', label: 'FEDERAL', urlParam: 'FED' },
];

export default function AdminResultadosPage() {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filtros
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Últimos 7 dias por padrão
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [bancaFilter, setBancaFilter] = useState('');
  const [horarioFilter, setHorarioFilter] = useState('');
  const [searchPremio, setSearchPremio] = useState('');

  // Paginação
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const supabase = createClient();

  const fetchResultados = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('resultados')
        .select('*', { count: 'exact' })
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .order('data', { ascending: false })
        .order('horario', { ascending: false });

      if (bancaFilter) {
        query = query.eq('banca', bancaFilter);
      }

      if (horarioFilter) {
        query = query.eq('horario', horarioFilter);
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Filtro local por prêmio (se especificado)
      let filteredData = data || [];
      if (searchPremio) {
        filteredData = filteredData.filter(r =>
          r.premio_1?.includes(searchPremio) ||
          r.premio_2?.includes(searchPremio) ||
          r.premio_3?.includes(searchPremio) ||
          r.premio_4?.includes(searchPremio) ||
          r.premio_5?.includes(searchPremio) ||
          r.premio_6?.includes(searchPremio) ||
          r.premio_7?.includes(searchPremio)
        );
      }

      setResultados(filteredData);
      setTotal(count || 0);
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dataInicio, dataFim, bancaFilter, horarioFilter, searchPremio, page, supabase]);

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados]);

  // Reset página quando muda filtros
  useEffect(() => {
    setPage(1);
  }, [dataInicio, dataFim, bancaFilter, horarioFilter, searchPremio]);

  const totalPages = Math.ceil(total / pageSize);

  // Horários únicos para o filtro
  const horariosUnicos = Array.from(new Set(resultados.map(r => r.horario))).sort();

  // Exportar CSV
  const exportCSV = () => {
    const headers = ['Data', 'Horário', 'Banca', 'Loteria', '1º', '2º', '3º', '4º', '5º', '6º', '7º'];
    const rows = resultados.map(r => [
      r.data,
      r.horario,
      r.banca,
      r.loteria || '',
      r.premio_1 || '',
      r.premio_2 || '',
      r.premio_3 || '',
      r.premio_4 || '',
      r.premio_5 || '',
      r.premio_6 || '',
      r.premio_7 || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_${dataInicio}_${dataFim}.csv`;
    a.click();
  };

  // Abre site para verificar
  const openSiteForResult = (resultado: Resultado) => {
    const banca = BANCAS.find(b => b.value === resultado.banca);
    if (banca?.urlParam) {
      window.open(
        `https://www.resultadofacil.com.br/resultado-do-jogo-do-bicho/${banca.urlParam}/do-dia/${resultado.data}`,
        '_blank'
      );
    }
  };

  // Formata data para exibição
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Todos os Resultados</h1>
          <p className="text-zinc-500">
            {total.toLocaleString()} resultados encontrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchResultados}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-400">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Data Início */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Data Início</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Data Fim</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Banca */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Banca/Estado</label>
            <select
              value={bancaFilter}
              onChange={(e) => setBancaFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {BANCAS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Horário */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Horário</label>
            <input
              type="time"
              value={horarioFilter}
              onChange={(e) => setHorarioFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              placeholder="HH:MM"
            />
          </div>

          {/* Buscar Prêmio */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Buscar Prêmio</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={searchPremio}
                onChange={(e) => setSearchPremio(e.target.value)}
                placeholder="Ex: 1234"
                maxLength={4}
                className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        </div>

        {/* Atalhos de data */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => {
              const hoje = new Date().toISOString().split('T')[0];
              setDataInicio(hoje);
              setDataFim(hoje);
            }}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => {
              const ontem = new Date();
              ontem.setDate(ontem.getDate() - 1);
              const ontemStr = ontem.toISOString().split('T')[0];
              setDataInicio(ontemStr);
              setDataFim(ontemStr);
            }}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
          >
            Ontem
          </button>
          <button
            onClick={() => {
              const fim = new Date();
              const inicio = new Date();
              inicio.setDate(inicio.getDate() - 7);
              setDataInicio(inicio.toISOString().split('T')[0]);
              setDataFim(fim.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => {
              const fim = new Date();
              const inicio = new Date();
              inicio.setDate(inicio.getDate() - 30);
              setDataInicio(inicio.toISOString().split('T')[0]);
              setDataFim(fim.toISOString().split('T')[0]);
            }}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
          >
            Últimos 30 dias
          </button>
          <button
            onClick={() => {
              setBancaFilter('');
              setHorarioFilter('');
              setSearchPremio('');
            }}
            className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-900 rounded-lg text-red-300 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
            <p>Nenhum resultado encontrado</p>
            <p className="text-sm">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-800/80 border-b border-zinc-700">
                  <th className="px-3 py-3 text-left text-zinc-400 font-medium whitespace-nowrap">Data</th>
                  <th className="px-3 py-3 text-left text-zinc-400 font-medium whitespace-nowrap">Horário</th>
                  <th className="px-3 py-3 text-left text-zinc-400 font-medium whitespace-nowrap">Banca</th>
                  <th className="px-3 py-3 text-left text-zinc-400 font-medium whitespace-nowrap">Loteria</th>
                  <th className="px-3 py-3 text-center text-emerald-400 font-bold whitespace-nowrap">1º</th>
                  <th className="px-3 py-3 text-center text-cyan-400 font-medium whitespace-nowrap">2º</th>
                  <th className="px-3 py-3 text-center text-amber-400 font-medium whitespace-nowrap">3º</th>
                  <th className="px-3 py-3 text-center text-purple-400 font-medium whitespace-nowrap">4º</th>
                  <th className="px-3 py-3 text-center text-pink-400 font-medium whitespace-nowrap">5º</th>
                  <th className="px-3 py-3 text-center text-zinc-500 font-medium whitespace-nowrap">6º</th>
                  <th className="px-3 py-3 text-center text-zinc-500 font-medium whitespace-nowrap">7º</th>
                  <th className="px-3 py-3 text-center text-zinc-400 font-medium whitespace-nowrap">Verificar</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                      idx % 2 === 0 ? 'bg-zinc-900/30' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-white font-medium whitespace-nowrap">
                      {formatDate(r.data)}
                    </td>
                    <td className="px-3 py-2 font-mono text-cyan-400 whitespace-nowrap">
                      {r.horario}
                    </td>
                    <td className="px-3 py-2 text-zinc-300 whitespace-nowrap">
                      {r.banca}
                    </td>
                    <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">
                      {r.loteria || '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-emerald-400 font-bold text-base">
                      {r.premio_1 || '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-cyan-400">
                      {r.premio_2 || '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-amber-400">
                      {r.premio_3 || '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-purple-400">
                      {r.premio_4 || '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-pink-400">
                      {r.premio_5 || '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-zinc-500">
                      {r.premio_6 || '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-zinc-500">
                      {r.premio_7 || '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => openSiteForResult(r)}
                        className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Verificar no site"
                      >
                        <ExternalLink className="h-4 w-4 text-cyan-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <div className="text-sm text-zinc-400">
              Página {page} de {totalPages} ({total.toLocaleString()} resultados)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
              >
                Primeira
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1.5 bg-cyan-600 rounded-lg text-white text-sm font-medium">
                {page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
              >
                Última
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
