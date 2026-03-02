'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Zap, Plus, Loader2, Info } from 'lucide-react';
import { TriggerForm } from '@/components/admin/whatsapp';
import {
  getTriggers,
  getInstances,
  createTrigger,
  type EvolutionTrigger,
  type EvolutionInstance
} from '@/lib/admin/actions/evolution';

const triggerTypes = [
  { type: 'cadastro', label: 'Cadastro', description: 'Quando um novo usuário se cadastra' },
  { type: 'deposito', label: 'Depósito', description: 'Quando um depósito é confirmado' },
  { type: 'saque', label: 'Saque', description: 'Quando um saque é processado' },
  { type: 'premio', label: 'Prêmio', description: 'Quando o usuário ganha um prêmio' }
];

export default function WhatsAppTriggersPage() {
  const [triggers, setTriggers] = useState<EvolutionTrigger[]>([]);
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(async () => {
    try {
      const [triggersData, instancesData] = await Promise.all([
        getTriggers(),
        getInstances()
      ]);
      setTriggers(triggersData);
      setInstances(instancesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateMissingTriggers = () => {
    startTransition(async () => {
      const existingTypes = triggers.map(t => t.trigger_type);
      const missingTypes = triggerTypes.filter(tt => !existingTypes.includes(tt.type));

      for (const tt of missingTypes) {
        await createTrigger(tt.type, null);
      }

      fetchData();
    });
  };

  // Ordenar triggers na ordem definida
  const orderedTriggers = triggerTypes
    .map(tt => triggers.find(t => t.trigger_type === tt.type))
    .filter(Boolean) as EvolutionTrigger[];

  const missingTriggers = triggerTypes.filter(
    tt => !triggers.some(t => t.trigger_type === tt.type)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gatilhos de Disparo</h1>
          <p className="text-zinc-400">Configure mensagens automáticas para eventos do sistema</p>
        </div>

        {missingTriggers.length > 0 && (
          <button
            onClick={handleCreateMissingTriggers}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Criar Gatilhos Faltantes
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
          <Info className="h-5 w-5 text-blue-400" />
        </div>
        <div className="text-sm">
          <h3 className="font-medium text-blue-400">Como funcionam os gatilhos</h3>
          <p className="text-zinc-400 mt-1">
            Gatilhos são disparados automaticamente quando eventos específicos acontecem no sistema.
            Você pode configurar múltiplas mensagens para cada gatilho, que serão enviadas em sequência
            com delays configuráveis.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-cyan-400">{'{{nome}}'}</span>
            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-cyan-400">{'{{telefone}}'}</span>
            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-cyan-400">{'{{valor}}'}</span>
            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-cyan-400">{'{{data}}'}</span>
            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-cyan-400">{'{{saldo}}'}</span>
            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-cyan-400">{'{{premio}}'}</span>
            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-cyan-400">{'{{modalidade}}'}</span>
          </div>
        </div>
      </div>

      {/* Warning if no connected instances */}
      {instances.filter(i => i.status === 'open').length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg shrink-0">
            <Zap className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-medium text-yellow-400">Nenhuma instância conectada</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Você precisa ter pelo menos uma instância WhatsApp conectada para que os gatilhos funcionem.
            </p>
          </div>
        </div>
      )}

      {/* Triggers List */}
      {orderedTriggers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="p-4 bg-zinc-800 rounded-full mb-4">
            <Zap className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Nenhum gatilho configurado</h3>
          <p className="text-zinc-400 mb-4">Clique no botão acima para criar os gatilhos padrão</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orderedTriggers.map((trigger) => (
            <TriggerForm
              key={trigger.id}
              trigger={trigger}
              instances={instances}
              onUpdate={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
