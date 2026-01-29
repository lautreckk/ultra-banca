'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Plus, RefreshCw, Loader2, Smartphone } from 'lucide-react';
import { InstanceCard } from '@/components/admin/whatsapp';
import { getInstances, createInstance, type EvolutionInstance } from '@/lib/admin/actions/evolution';

export default function WhatsAppInstancesPage() {
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      const data = await getInstances();
      setInstances(data);
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const handleCreateInstance = () => {
    if (!newInstanceName.trim()) {
      setCreateError('Digite um nome para a instância');
      return;
    }

    // Validar nome (sem espaços ou caracteres especiais)
    if (!/^[a-zA-Z0-9_-]+$/.test(newInstanceName)) {
      setCreateError('Nome deve conter apenas letras, números, - e _');
      return;
    }

    startTransition(async () => {
      setCreateError(null);
      const result = await createInstance(newInstanceName, {
        qrcode: true,
        groupsIgnore: true,
        rejectCall: false,
        alwaysOnline: false,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false
      });

      if (result.success) {
        setShowCreateModal(false);
        setNewInstanceName('');
        fetchInstances();
      } else {
        setCreateError(result.error || 'Erro ao criar instância');
      }
    });
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchInstances();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Instâncias WhatsApp</h1>
          <p className="text-zinc-400">Gerencie suas conexões com o WhatsApp</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Instância
          </button>
        </div>
      </div>

      {/* Instances Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="p-4 bg-zinc-800 rounded-full mb-4">
            <Smartphone className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Nenhuma instância</h3>
          <p className="text-zinc-400 mb-4">Crie sua primeira instância para começar a enviar mensagens</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Criar Instância
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onRefresh={fetchInstances}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreateModal(false)} />

          <div className="relative bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-zinc-800">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Nova Instância</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Nome da Instância
                  </label>
                  <input
                    type="text"
                    value={newInstanceName}
                    onChange={(e) => {
                      setNewInstanceName(e.target.value);
                      setCreateError(null);
                    }}
                    placeholder="minha-instancia"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Use apenas letras, números, - e _
                  </p>
                </div>

                {createError && (
                  <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                    {createError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewInstanceName('');
                      setCreateError(null);
                    }}
                    className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateInstance}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Criar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
