'use client';

import { useState, useEffect } from 'react';
import { getModalidades, updateModalidade, type ModalidadeConfig } from '@/lib/admin/actions/settings';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/admin/shared';
import { Save, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Dices, Info } from 'lucide-react';
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
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
    { name: 'centena', label: 'Centenas', modalidades: [] },
    { name: 'milhar', label: 'Milhares', modalidades: [] },
    { name: 'unidade', label: 'Unidade', modalidades: [] },
    { name: 'dezena', label: 'Dezenas', modalidades: [] },
    { name: 'duque_dezena', label: 'Duque Dezena', modalidades: [] },
    { name: 'terno_dezena_seco', label: 'Terno Dezena Seco', modalidades: [] },
    { name: 'terno_dezena', label: 'Terno Dezena', modalidades: [] },
    { name: 'grupo', label: 'Grupo', modalidades: [] },
    { name: 'duque_grupo', label: 'Duque Grupo', modalidades: [] },
    { name: 'terno_grupo', label: 'Terno Grupo', modalidades: [] },
    { name: 'quadra_grupo', label: 'Quadra Grupo', modalidades: [] },
    { name: 'quina_grupo', label: 'Quina Grupo', modalidades: [] },
    { name: 'sena_grupo', label: 'Sena Grupo', modalidades: [] },
    { name: 'passe', label: 'Passe', modalidades: [] },
    { name: 'palpitao', label: 'Palpitão', modalidades: [] },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-zinc-800 border border-zinc-700">
            <Dices className="h-6 w-6 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configurações de Modalidades</h1>
            <p className="text-zinc-500">Gerencie multiplicadores, limites e posições de cada modalidade</p>
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
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar Alterações
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {categories.filter(c => c.modalidades.length > 0).map((category) => (
          <div key={category.name} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">{category.label}</span>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                  {category.modalidades.length}
                </span>
              </div>
              {expandedCategories.includes(category.name) ? (
                <ChevronDown className="h-5 w-5 text-zinc-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-zinc-500" />
              )}
            </button>

            {/* Table */}
            {expandedCategories.includes(category.name) && (
              <div className="border-t border-zinc-800 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider w-48">
                        Modalidade
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Multiplicador
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Máx. Aposta
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        1º-5º
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        1º-6º
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        1º-7º
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        1º-10º
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        5º-6º
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Ativo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {category.modalidades.map((modalidade) => {
                      const isActive = getValue(modalidade, 'ativo') as boolean;
                      const isEdited = !!editedModalidades[modalidade.id];
                      return (
                        <tr
                          key={modalidade.id}
                          className={cn(
                            "transition-colors hover:bg-zinc-800/30",
                            !isActive && "opacity-50",
                            isEdited && "bg-cyan-500/5"
                          )}
                        >
                          {/* Nome */}
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-white">{modalidade.nome}</span>
                          </td>

                          {/* Multiplicador */}
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              step="1"
                              value={getValue(modalidade, 'multiplicador') as number}
                              onChange={(e) => handleChange(modalidade.id, 'multiplicador', parseFloat(e.target.value) || 0)}
                              className="w-24 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                            />
                          </td>

                          {/* Valor Máximo */}
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              step="1"
                              value={getValue(modalidade, 'valor_maximo') as number}
                              onChange={(e) => handleChange(modalidade.id, 'valor_maximo', parseFloat(e.target.value) || 0)}
                              className="w-24 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                            />
                          </td>

                          {/* Posições - Toggles */}
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_1_5') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_1_5', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_1_6') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_1_6', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_1_7') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_1_7', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_1_10') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_1_10', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_5_6') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_5_6', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          {/* Ativo/Desativado */}
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={isActive}
                                onChange={(checked) => handleChange(modalidade.id, 'ativo', checked)}
                                size="sm"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-400">Legenda</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-zinc-500">
          <div>
            <span className="text-zinc-400">Multiplicador:</span> Valor que multiplica a aposta para calcular o prêmio
          </div>
          <div>
            <span className="text-zinc-400">Máx. Aposta:</span> Valor máximo permitido por aposta (0 = sem limite)
          </div>
          <div>
            <span className="text-zinc-400">Posições:</span> Define em quais prêmios a modalidade pode ser apostada
          </div>
        </div>
      </div>
    </div>
  );
}
