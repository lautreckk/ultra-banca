'use client';

import { useState, useTransition } from 'react';
import { Zap, Power, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageComposer } from './message-composer';
import type { EvolutionTrigger, EvolutionInstance, EvolutionTriggerMessage } from '@/lib/admin/actions/evolution';
import {
  updateTrigger,
  addTriggerMessage,
  updateTriggerMessage,
  deleteTriggerMessage,
  reorderTriggerMessages,
  executeTrigger
} from '@/lib/admin/actions/evolution';

interface TriggerFormProps {
  trigger: EvolutionTrigger;
  instances: EvolutionInstance[];
  onUpdate: () => void;
}

const triggerTypeConfig: Record<string, { label: string; description: string; color: string }> = {
  cadastro: {
    label: 'Cadastro',
    description: 'Enviada quando um novo usuário se cadastra',
    color: 'bg-blue-500/20 text-blue-400'
  },
  deposito: {
    label: 'Depósito',
    description: 'Enviada quando um depósito é confirmado',
    color: 'bg-green-500/20 text-green-400'
  },
  saque: {
    label: 'Saque',
    description: 'Enviada quando um saque é processado',
    color: 'bg-yellow-500/20 text-yellow-400'
  },
  premio: {
    label: 'Prêmio',
    description: 'Enviada quando o usuário ganha um prêmio',
    color: 'bg-purple-500/20 text-purple-400'
  }
};

export function TriggerForm({ trigger, instances, onUpdate }: TriggerFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [localTrigger, setLocalTrigger] = useState(trigger);

  const config = triggerTypeConfig[trigger.trigger_type] || {
    label: trigger.trigger_type,
    description: '',
    color: 'bg-zinc-500/20 text-zinc-400'
  };

  const handleToggleEnabled = () => {
    startTransition(async () => {
      const result = await updateTrigger(trigger.id, { enabled: !localTrigger.enabled });
      if (result.success) {
        setLocalTrigger(prev => ({ ...prev, enabled: !prev.enabled }));
        onUpdate();
      }
    });
  };

  const handleInstanceChange = (instanceId: string) => {
    startTransition(async () => {
      const result = await updateTrigger(trigger.id, { instance_id: instanceId || null });
      if (result.success) {
        setLocalTrigger(prev => ({ ...prev, instance_id: instanceId || null }));
        onUpdate();
      }
    });
  };

  const handleAddMessage = (type: EvolutionTriggerMessage['message_type'], content: string, caption?: string, delay?: number) => {
    startTransition(async () => {
      const result = await addTriggerMessage(trigger.id, type, content, caption, delay);
      if (result.success && result.data) {
        setLocalTrigger(prev => ({
          ...prev,
          messages: [...(prev.messages || []), result.data as EvolutionTriggerMessage]
        }));
        onUpdate();
      }
    });
  };

  const handleUpdateMessage = (id: string, data: Partial<EvolutionTriggerMessage>) => {
    startTransition(async () => {
      // Converter null para undefined para compatibilidade com a API
      const cleanedData: Parameters<typeof updateTriggerMessage>[1] = {};
      if (data.message_type) cleanedData.message_type = data.message_type;
      if (data.content !== undefined) cleanedData.content = data.content ?? undefined;
      if (data.caption !== undefined) cleanedData.caption = data.caption ?? undefined;
      if (data.delay_seconds !== undefined) cleanedData.delay_seconds = data.delay_seconds;
      if (data.order_index !== undefined) cleanedData.order_index = data.order_index;

      const result = await updateTriggerMessage(id, cleanedData);
      if (result.success) {
        setLocalTrigger(prev => ({
          ...prev,
          messages: prev.messages?.map(m => m.id === id ? { ...m, ...data } : m)
        }));
        onUpdate();
      }
    });
  };

  const handleDeleteMessage = (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta mensagem?')) return;

    startTransition(async () => {
      const result = await deleteTriggerMessage(id);
      if (result.success) {
        setLocalTrigger(prev => ({
          ...prev,
          messages: prev.messages?.filter(m => m.id !== id)
        }));
        onUpdate();
      }
    });
  };

  const handleReorderMessages = (ids: string[]) => {
    startTransition(async () => {
      const result = await reorderTriggerMessages(trigger.id, ids);
      if (result.success) {
        const reordered = ids.map((id, index) => {
          const msg = localTrigger.messages?.find(m => m.id === id);
          return msg ? { ...msg, order_index: index } : null;
        }).filter(Boolean) as EvolutionTriggerMessage[];

        setLocalTrigger(prev => ({
          ...prev,
          messages: reordered
        }));
        onUpdate();
      }
    });
  };

  const handleTestTrigger = () => {
    if (!testPhone) {
      setTestResult({ success: false, message: 'Informe o número de telefone' });
      return;
    }

    startTransition(async () => {
      setTestResult(null);
      const result = await executeTrigger(trigger.trigger_type, {
        nome: 'Usuário Teste',
        telefone: testPhone,
        valor: 100,
        saldo: 500,
        premio: 200,
        modalidade: 'Milhar'
      });

      if (result.success) {
        setTestResult({
          success: true,
          message: `${result.sentCount} mensagem(ns) enviada(s) com sucesso!`
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Erro ao enviar mensagens'
        });
      }
    });
  };

  const connectedInstances = instances.filter(i => i.status === 'open');

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl', config.color)}>
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{config.label}</h3>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                localTrigger.enabled ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
              )}>
                {localTrigger.enabled ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-sm text-zinc-400">{config.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            {localTrigger.messages?.length || 0} mensagem(ns)
          </span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-zinc-800 p-4 space-y-6">
          {/* Settings */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Power className={cn('h-5 w-5', localTrigger.enabled ? 'text-green-400' : 'text-zinc-400')} />
                <span className="text-white">Ativar gatilho</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleEnabled();
                }}
                disabled={isPending}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative',
                  localTrigger.enabled ? 'bg-green-500' : 'bg-zinc-600'
                )}
              >
                <div className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  localTrigger.enabled ? 'translate-x-7' : 'translate-x-1'
                )} />
              </button>
            </div>

            {/* Instance Select */}
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <label className="block text-sm text-zinc-400 mb-2">Instância de envio</label>
              <select
                value={localTrigger.instance_id || ''}
                onChange={(e) => handleInstanceChange(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Selecione uma instância</option>
                {connectedInstances.map(instance => (
                  <option key={instance.id} value={instance.id}>
                    {instance.instance_name}
                  </option>
                ))}
              </select>
              {connectedInstances.length === 0 && (
                <p className="text-xs text-yellow-400 mt-2">
                  Nenhuma instância conectada. Conecte uma instância primeiro.
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div>
            <h4 className="text-white font-medium mb-3">Mensagens</h4>
            <MessageComposer
              messages={localTrigger.messages || []}
              onAdd={handleAddMessage}
              onUpdate={handleUpdateMessage}
              onDelete={handleDeleteMessage}
              onReorder={handleReorderMessages}
            />
          </div>

          {/* Test Section */}
          <div className="p-4 bg-zinc-800/50 rounded-lg">
            <h4 className="text-white font-medium mb-3">Testar gatilho</h4>
            <div className="flex gap-3">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Número de telefone (ex: 11999998888)"
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleTestTrigger}
                disabled={isPending || !testPhone || !localTrigger.instance_id}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Testar
              </button>
            </div>

            {testResult && (
              <div className={cn(
                'mt-3 p-3 rounded-lg',
                testResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              )}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
