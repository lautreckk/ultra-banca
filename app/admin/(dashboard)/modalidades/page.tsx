'use client';

import { useState, useEffect } from 'react';
import { getModalidades, updateModalidade, type ModalidadeConfig } from '@/lib/admin/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/admin/shared';
import { Save, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryGroup {
  name: string;
  label: string;
  modalidades: ModalidadeConfig[];
}

export default function AdminModalidadesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['grupo', 'dezena', 'centena', 'milhar', 'passe']);
  const [editedModalidades, setEditedModalidades] = useState<Record<string, Partial<ModalidadeConfig>>>({});

  useEffect(() => {
    const fetchModalidades = async () => {
      setIsLoading(true);
      try {
        const data = await getModalidades();
        setModalidades(data);
      } catch (error) {
        console.error('Error fetching modalidades:', error);
        setError('Erro ao carregar modalidades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModalidades();
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleChange = (id: string, field: keyof ModalidadeConfig, value: unknown) => {
    setEditedModalidades((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const getValue = (modalidade: ModalidadeConfig, field: keyof ModalidadeConfig) => {
    return editedModalidades[modalidade.id]?.[field] ?? modalidade[field];
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      // Save all edited modalidades
      const promises = Object.entries(editedModalidades).map(([id, changes]) =>
        updateModalidade(id, changes)
      );

      const results = await Promise.all(promises);
      const hasError = results.some((r) => !r.success);

      if (hasError) {
        setError('Algumas alterações não foram salvas');
      } else {
        setSaveSuccess(true);
        setEditedModalidades({});
        setTimeout(() => setSaveSuccess(false), 3000);

        // Refresh data
        const data = await getModalidades();
        setModalidades(data);
      }
    } catch {
      setError('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  // Group modalidades by category
  const categories: CategoryGroup[] = [
    { name: 'grupo', label: 'Grupo', modalidades: [] },
    { name: 'dezena', label: 'Dezena', modalidades: [] },
    { name: 'centena', label: 'Centena', modalidades: [] },
    { name: 'milhar', label: 'Milhar', modalidades: [] },
    { name: 'passe', label: 'Passe', modalidades: [] },
  ];

  modalidades.forEach((m) => {
    const category = categories.find((c) => c.name === m.categoria);
    if (category) {
      category.modalidades.push(m);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const hasChanges = Object.keys(editedModalidades).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Modalidades de Apostas</h1>
          <p className="text-gray-400">Configure multiplicadores e regras das modalidades</p>
        </div>
        <Button variant="teal" onClick={handleSave} disabled={isSaving || !hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
          <CheckCircle className="h-5 w-5" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.name} className="bg-[#374151] rounded-lg overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-800 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedCategories.includes(category.name) ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-lg font-semibold text-white">{category.label}</span>
                <span className="text-sm text-gray-400">({category.modalidades.length} modalidades)</span>
              </div>
            </button>

            {/* Modalidades List */}
            {expandedCategories.includes(category.name) && (
              <div className="divide-y divide-gray-600">
                {category.modalidades.map((modalidade) => (
                  <div key={modalidade.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="font-medium text-white">{modalidade.nome}</h3>
                        <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                          {modalidade.codigo}
                        </span>
                      </div>
                      <ToggleSwitch
                        checked={getValue(modalidade, 'ativo') as boolean}
                        onChange={(checked) => handleChange(modalidade.id, 'ativo', checked)}
                        size="sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Multiplicador */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Multiplicador</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={getValue(modalidade, 'multiplicador') as number}
                          onChange={(e) => handleChange(modalidade.id, 'multiplicador', parseFloat(e.target.value) || 0)}
                          className="bg-gray-700 border-gray-600 text-white text-sm h-9"
                        />
                      </div>

                      {/* Valor Mínimo */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Valor Mín.</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={getValue(modalidade, 'valor_minimo') as number}
                          onChange={(e) => handleChange(modalidade.id, 'valor_minimo', parseFloat(e.target.value) || 0)}
                          className="bg-gray-700 border-gray-600 text-white text-sm h-9"
                        />
                      </div>

                      {/* Valor Máximo */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Valor Máx.</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={getValue(modalidade, 'valor_maximo') as number}
                          onChange={(e) => handleChange(modalidade.id, 'valor_maximo', parseFloat(e.target.value) || 0)}
                          className="bg-gray-700 border-gray-600 text-white text-sm h-9"
                        />
                      </div>
                    </div>

                    {/* Posições */}
                    <div className="mt-4">
                      <label className="block text-xs text-gray-400 mb-2">Posições Permitidas</label>
                      <div className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={getValue(modalidade, 'posicoes_1_5') as boolean}
                            onChange={(e) => handleChange(modalidade.id, 'posicoes_1_5', e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                          />
                          1º ao 5º
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={getValue(modalidade, 'posicoes_1_6') as boolean}
                            onChange={(e) => handleChange(modalidade.id, 'posicoes_1_6', e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                          />
                          1º ao 6º
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={getValue(modalidade, 'posicoes_1_7') as boolean}
                            onChange={(e) => handleChange(modalidade.id, 'posicoes_1_7', e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                          />
                          1º ao 7º
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={getValue(modalidade, 'posicoes_1_10') as boolean}
                            onChange={(e) => handleChange(modalidade.id, 'posicoes_1_10', e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                          />
                          1º ao 10º
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={getValue(modalidade, 'posicoes_5_6') as boolean}
                            onChange={(e) => handleChange(modalidade.id, 'posicoes_5_6', e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
                          />
                          5º e 6º
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
