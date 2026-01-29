'use client';

import { useState, useEffect } from 'react';
import { getModalidades, updateModalidade, type ModalidadeConfig } from '@/lib/admin/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/admin/shared';
import { Save, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Dices, Info, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryGroup {
  name: string;
  label: string;
  icon: string;
  color: string;
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

  // Group modalidades by category with colors
  const categories: CategoryGroup[] = [
    { name: 'centena', label: 'Centenas', icon: '💯', color: 'from-green-600 to-green-700', modalidades: [] },
    { name: 'milhar', label: 'Milhares', icon: '🎰', color: 'from-orange-600 to-orange-700', modalidades: [] },
    { name: 'unidade', label: 'Unidade', icon: '1️⃣', color: 'from-gray-600 to-gray-700', modalidades: [] },
    { name: 'dezena', label: 'Dezenas', icon: '🔢', color: 'from-purple-600 to-purple-700', modalidades: [] },
    { name: 'duque_dezena', label: 'Duque Dezena', icon: '✌️', color: 'from-violet-600 to-violet-700', modalidades: [] },
    { name: 'terno_dezena_seco', label: 'Terno Dezena Seco', icon: '🎯', color: 'from-indigo-600 to-indigo-700', modalidades: [] },
    { name: 'terno_dezena', label: 'Terno Dezena', icon: '🎲', color: 'from-blue-600 to-blue-700', modalidades: [] },
    { name: 'grupo', label: 'Grupo', icon: '👥', color: 'from-cyan-600 to-cyan-700', modalidades: [] },
    { name: 'duque_grupo', label: 'Duque Grupo', icon: '👬', color: 'from-teal-600 to-teal-700', modalidades: [] },
    { name: 'terno_grupo', label: 'Terno Grupo', icon: '👨‍👩‍👦', color: 'from-emerald-600 to-emerald-700', modalidades: [] },
    { name: 'quadra_grupo', label: 'Quadra Grupo', icon: '4️⃣', color: 'from-lime-600 to-lime-700', modalidades: [] },
    { name: 'quina_grupo', label: 'Quina Grupo', icon: '5️⃣', color: 'from-yellow-600 to-yellow-700', modalidades: [] },
    { name: 'sena_grupo', label: 'Sena Grupo', icon: '6️⃣', color: 'from-amber-600 to-amber-700', modalidades: [] },
    { name: 'passe', label: 'Passe', icon: '🎫', color: 'from-pink-600 to-pink-700', modalidades: [] },
    { name: 'palpitao', label: 'Palpitão', icon: '🔮', color: 'from-rose-600 to-rose-700', modalidades: [] },
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
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
            <Dices className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configurações de Modalidades</h1>
            <p className="text-gray-400">Gerencie multiplicadores, limites e posições de cada modalidade</p>
          </div>
        </div>
        <Button
          variant="teal"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className={cn(
            "transition-all",
            hasChanges && "animate-pulse shadow-lg shadow-cyan-500/30"
          )}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
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
      <div className="space-y-4">
        {categories.filter(c => c.modalidades.length > 0).map((category) => (
          <div key={category.name} className="bg-gray-800/50 backdrop-blur rounded-xl overflow-hidden border border-gray-700/50 shadow-xl">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className={cn(
                "w-full px-5 py-4 flex items-center justify-between transition-all",
                `bg-gradient-to-r ${category.color}`
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <span className="text-lg font-bold text-white">{category.label}</span>
                <span className="text-sm text-white/70 bg-white/20 px-2 py-0.5 rounded-full">
                  {category.modalidades.length} modalidades
                </span>
              </div>
              <div className="flex items-center gap-2">
                {expandedCategories.includes(category.name) ? (
                  <ChevronDown className="h-6 w-6 text-white/80" />
                ) : (
                  <ChevronRight className="h-6 w-6 text-white/80" />
                )}
              </div>
            </button>

            {/* Table */}
            {expandedCategories.includes(category.name) && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-900/50 border-b border-gray-700/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">
                        Sorteio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Prêmio
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          Máx. Aposta
                          <Info className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        1º ao 5º
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        1º ao 6º
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        1º ao 7º
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        1º ao 10º
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        5º e 6º
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {category.modalidades.map((modalidade, index) => {
                      const isActive = getValue(modalidade, 'ativo') as boolean;
                      return (
                        <tr
                          key={modalidade.id}
                          className={cn(
                            "transition-colors",
                            index % 2 === 0 ? "bg-gray-800/30" : "bg-gray-800/10",
                            !isActive && "opacity-50"
                          )}
                        >
                          {/* Nome */}
                          <td className="px-4 py-3">
                            <span className="font-medium text-white">{modalidade.nome}</span>
                          </td>

                          {/* Multiplicador (Prêmio) */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 text-sm">R$</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={getValue(modalidade, 'multiplicador') as number}
                                onChange={(e) => handleChange(modalidade.id, 'multiplicador', parseFloat(e.target.value) || 0)}
                                className="w-24 bg-gray-900/50 border-gray-600 text-white text-sm h-8 focus:border-cyan-500 focus:ring-cyan-500/20"
                              />
                            </div>
                          </td>

                          {/* Valor Máximo */}
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.01"
                              value={getValue(modalidade, 'valor_maximo') as number}
                              onChange={(e) => handleChange(modalidade.id, 'valor_maximo', parseFloat(e.target.value) || 0)}
                              className="w-20 bg-gray-900/50 border-gray-600 text-white text-sm h-8 focus:border-cyan-500 focus:ring-cyan-500/20"
                            />
                          </td>

                          {/* Posições - Toggles */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_1_5') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_1_5', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_1_6') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_1_6', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_1_7') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_1_7', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_1_10') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_1_10', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <ToggleSwitch
                                checked={getValue(modalidade, 'posicoes_5_6') as boolean}
                                onChange={(checked) => handleChange(modalidade.id, 'posicoes_5_6', checked)}
                                size="sm"
                              />
                            </div>
                          </td>

                          {/* Ativo/Desativado */}
                          <td className="px-4 py-3 text-center">
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
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Legenda</h3>
        <div className="flex flex-wrap gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <span><strong>Prêmio:</strong> Multiplicador aplicado ao valor da aposta</span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-cyan-400" />
            <span><strong>Máx. Aposta:</strong> Valor máximo permitido por aposta (0 = sem limite)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cyan-500 rounded-full" />
            <span><strong>Posições:</strong> Define em quais prêmios a modalidade pode ser apostada</span>
          </div>
        </div>
      </div>
    </div>
  );
}
