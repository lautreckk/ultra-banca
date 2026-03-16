'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ToggleSwitch } from '@/components/admin/shared';
import { Save, Loader2, CheckCircle, AlertCircle, Trophy, Search, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformLoteria {
  id: string;
  loteria_code: string;
  loteria_name: string;
  ativo: boolean;
}

export default function AdminLoteriasPage() {
  const [loterias, setLoterias] = useState<PlatformLoteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const [platformName, setPlatformName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const platformId = document.cookie.split('; ').find(row => row.startsWith('platform_id='))?.split('=')[1];

        if (!platformId) {
          setError('Plataforma não identificada');
          setIsLoading(false);
          return;
        }

        const { data: platform } = await supabase
          .from('platforms')
          .select('name')
          .eq('id', platformId)
          .single();

        if (platform) setPlatformName(platform.name);

        const { data, error: fetchError } = await supabase
          .from('platform_loterias')
          .select('id, loteria_code, loteria_name, ativo')
          .eq('platform_id', platformId)
          .order('loteria_name');

        if (fetchError) throw fetchError;
        setLoterias(data || []);
      } catch (err) {
        console.error('Error fetching loterias:', err);
        setError('Erro ao carregar loterias');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggle = (id: string, ativo: boolean) => {
    setChanges(prev => ({ ...prev, [id]: ativo }));
  };

  const isChanged = (loteria: PlatformLoteria) => {
    return changes[loteria.id] !== undefined;
  };

  const getAtivo = (loteria: PlatformLoteria) => {
    return changes[loteria.id] ?? loteria.ativo;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const supabase = createClient();

      const promises = Object.entries(changes).map(([id, ativo]) =>
        supabase.from('platform_loterias').update({ ativo }).eq('id', id)
      );

      await Promise.all(promises);

      setLoterias(prev =>
        prev.map(l => changes[l.id] !== undefined ? { ...l, ativo: changes[l.id] } : l)
      );
      setChanges({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAll = (ativo: boolean) => {
    const newChanges: Record<string, boolean> = {};
    loterias.forEach(l => { newChanges[l.id] = ativo; });
    setChanges(newChanges);
  };

  const filtered = loterias.filter(l =>
    l.loteria_name.toLowerCase().includes(search.toLowerCase()) ||
    l.loteria_code.toLowerCase().includes(search.toLowerCase())
  );

  const hasChanges = Object.keys(changes).length > 0;
  const activeCount = loterias.filter(l => getAtivo(l)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-zinc-800 border border-zinc-700">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Loterias</h1>
            <div className="flex items-center gap-2 text-zinc-500">
              <span>{activeCount} de {loterias.length} ativas</span>
              {platformName && (
                <>
                  <span className="text-zinc-600">•</span>
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{platformName}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
            hasChanges
              ? "bg-cyan-500 text-white hover:bg-cyan-600"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          )}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      {/* Status */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" /><span>Loterias atualizadas com sucesso!</span>
        </div>
      )}

      {/* Search + Bulk */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar loteria..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
        <button onClick={() => toggleAll(true)} className="px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
          Ativar Todas
        </button>
        <button onClick={() => toggleAll(false)} className="px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
          Desativar Todas
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(loteria => {
          const ativo = getAtivo(loteria);
          const changed = isChanged(loteria);
          return (
            <div
              key={loteria.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-all",
                ativo ? "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700" : "bg-zinc-900/20 border-zinc-800/50 opacity-60",
                changed && "ring-1 ring-cyan-500/30 bg-cyan-500/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold",
                  ativo ? "bg-amber-500/15 text-amber-400" : "bg-zinc-800 text-zinc-500"
                )}>
                  {loteria.loteria_code.slice(0, 3)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{loteria.loteria_name}</p>
                  <p className="text-xs text-zinc-500">{loteria.loteria_code}</p>
                </div>
              </div>
              <ToggleSwitch checked={ativo} onChange={checked => handleToggle(loteria.id, checked)} />
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-500">Nenhuma loteria encontrada</div>
      )}
    </div>
  );
}
