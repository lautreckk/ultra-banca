'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable, type Column, StatCard } from '@/components/admin/shared';
import { createClient } from '@/lib/supabase/client';
import { Calendar, RefreshCw, Plus, Edit2, Trash2, Search, Download } from 'lucide-react';

interface Resultado {
  id: string;
  data: string;
  horario: string;
  banca: string;
  premio_1: string | null;
  premio_2: string | null;
  premio_3: string | null;
  premio_4: string | null;
  premio_5: string | null;
  bicho_1: string | null;
  bicho_2: string | null;
  bicho_3: string | null;
  bicho_4: string | null;
  bicho_5: string | null;
  loteria: string | null;
  created_at: string;
}

interface FormData {
  id?: string;
  data: string;
  horario: string;
  banca: string;
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
  loteria: string;
}

const HORARIOS = [
  '10:20', '11:20', '12:20', '13:20', '14:20',
  '15:20', '16:20', '17:20', '18:20', '19:20', '21:20'
];

const initialFormData: FormData = {
  data: new Date().toISOString().split('T')[0],
  horario: '10:20',
  banca: 'DF',
  premio_1: '',
  premio_2: '',
  premio_3: '',
  premio_4: '',
  premio_5: '',
  bicho_1: '',
  bicho_2: '',
  bicho_3: '',
  bicho_4: '',
  bicho_5: '',
  loteria: '',
};

export default function AdminResultadosPage() {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dataFilter, setDataFilter] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const pageSize = 20;

  const supabase = createClient();

  const fetchResultados = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/resultados?data=${dataFilter}&page=${page}&pageSize=${pageSize}`
      );
      const data = await response.json();

      if (data.resultados) {
        setResultados(data.resultados);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dataFilter, page]);

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados]);

  const handleScrape = async () => {
    setIsScrapingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scrape-resultados`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ data: dataFilter }),
        }
      );

      if (response.ok) {
        await fetchResultados();
      }
    } catch (error) {
      console.error('Erro ao fazer scraping:', error);
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setFormData(initialFormData);
        await fetchResultados();
      }
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (resultado: Resultado) => {
    setFormData({
      id: resultado.id,
      data: resultado.data,
      horario: resultado.horario,
      banca: resultado.banca || 'DF',
      premio_1: resultado.premio_1 || '',
      premio_2: resultado.premio_2 || '',
      premio_3: resultado.premio_3 || '',
      premio_4: resultado.premio_4 || '',
      premio_5: resultado.premio_5 || '',
      bicho_1: resultado.bicho_1 || '',
      bicho_2: resultado.bicho_2 || '',
      bicho_3: resultado.bicho_3 || '',
      bicho_4: resultado.bicho_4 || '',
      bicho_5: resultado.bicho_5 || '',
      loteria: resultado.loteria || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este resultado?')) return;

    try {
      const response = await fetch(`/api/admin/resultados?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchResultados();
      }
    } catch (error) {
      console.error('Erro ao excluir resultado:', error);
    }
  };

  const columns: Column<Resultado>[] = [
    {
      key: 'data',
      header: 'Data',
      mobileHeader: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-white">
            {new Date(value as string).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-xs text-gray-400">{row.horario}</p>
        </div>
      ),
    },
    {
      key: 'premio_1',
      header: '1o',
      render: (value) => (
        <span className="font-mono text-emerald-400">{String(value || '-')}</span>
      ),
    },
    {
      key: 'premio_2',
      header: '2o',
      render: (value) => (
        <span className="font-mono text-cyan-400">{String(value || '-')}</span>
      ),
    },
    {
      key: 'premio_3',
      header: '3o',
      render: (value) => (
        <span className="font-mono text-amber-400">{String(value || '-')}</span>
      ),
    },
    {
      key: 'premio_4',
      header: '4o',
      hideOnMobile: true,
      render: (value) => (
        <span className="font-mono text-gray-400">{String(value || '-')}</span>
      ),
    },
    {
      key: 'premio_5',
      header: '5o',
      hideOnMobile: true,
      render: (value) => (
        <span className="font-mono text-gray-400">{String(value || '-')}</span>
      ),
    },
    {
      key: 'banca',
      header: 'Banca',
      hideOnMobile: true,
      render: (value) => <span className="text-gray-300">{String(value || 'DF')}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="h-4 w-4 text-cyan-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Resultados</h1>
          <p className="text-gray-400">Gerenciar resultados dos sorteios</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="date"
              value={dataFilter}
              onChange={(e) => {
                setDataFilter(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <button
            onClick={handleScrape}
            disabled={isScrapingLoading}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
          >
            <Download className={`h-4 w-4 ${isScrapingLoading ? 'animate-spin' : ''}`} />
            Buscar Resultados
          </button>

          <button
            onClick={() => {
              setFormData({ ...initialFormData, data: dataFilter });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Hoje"
          value={resultados.filter(r => r.data === dataFilter).length}
          icon="Calendar"
          variant="info"
        />
        <StatCard
          title="Horários"
          value={HORARIOS.length}
          icon="Clock"
          variant="default"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={resultados}
        isLoading={isLoading}
        emptyMessage="Nenhum resultado encontrado"
        rowKey="id"
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
        }}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              {formData.id ? 'Editar Resultado' : 'Novo Resultado'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Data</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Horário</label>
                  <select
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {HORARIOS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Banca</label>
                  <input
                    type="text"
                    value={formData.banca}
                    onChange={(e) => setFormData({ ...formData, banca: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="DF"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Prêmios (Milhares)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i}>
                      <label className="block text-xs text-zinc-500 mb-1">{i}º</label>
                      <input
                        type="text"
                        value={formData[`premio_${i}` as keyof FormData] || ''}
                        onChange={(e) => setFormData({ ...formData, [`premio_${i}`]: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        placeholder="0000"
                        maxLength={4}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Bichos</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i}>
                      <label className="block text-xs text-zinc-500 mb-1">{i}º</label>
                      <input
                        type="text"
                        value={formData[`bicho_${i}` as keyof FormData] || ''}
                        onChange={(e) => setFormData({ ...formData, [`bicho_${i}`]: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                        placeholder="Bicho"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData(initialFormData);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
