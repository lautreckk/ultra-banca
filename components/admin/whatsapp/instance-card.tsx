'use client';

import { useState, useTransition } from 'react';
import { Phone, MoreVertical, RefreshCw, LogOut, Trash2, QrCode, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectionStatus } from './connection-status';
import { QRCodeModal } from './qr-code-modal';
import type { EvolutionInstance } from '@/lib/admin/actions/evolution';
import {
  restartInstance,
  logoutInstance,
  deleteInstance,
  getConnectionState
} from '@/lib/admin/actions/evolution';

interface InstanceCardProps {
  instance: EvolutionInstance;
  onRefresh: () => void;
}

export function InstanceCard({ instance, onRefresh }: InstanceCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setShowMenu(false);
    setActionLoading(action);

    startTransition(async () => {
      try {
        switch (action) {
          case 'refresh':
            await getConnectionState(instance.instance_name);
            break;
          case 'restart':
            await restartInstance(instance.instance_name);
            break;
          case 'logout':
            await logoutInstance(instance.instance_name);
            break;
          case 'delete':
            if (confirm(`Tem certeza que deseja deletar a instância "${instance.instance_name}"?`)) {
              await deleteInstance(instance.instance_name);
            }
            break;
        }
        onRefresh();
      } finally {
        setActionLoading(null);
      }
    });
  };

  const isConnected = instance.status === 'open';

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-xl',
              isConnected ? 'bg-green-500/20' : 'bg-zinc-800'
            )}>
              <Phone className={cn('h-5 w-5', isConnected ? 'text-green-400' : 'text-zinc-400')} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{instance.instance_name}</h3>
              {instance.phone_number && (
                <p className="text-sm text-zinc-400">{instance.phone_number}</p>
              )}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={isPending}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
              ) : (
                <MoreVertical className="h-5 w-5 text-zinc-400" />
              )}
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20">
                  <button
                    onClick={() => handleAction('refresh')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 first:rounded-t-lg"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Atualizar Status
                  </button>
                  <button
                    onClick={() => handleAction('restart')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                  >
                    <Settings className="h-4 w-4" />
                    Reiniciar
                  </button>
                  <button
                    onClick={() => handleAction('logout')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-400 hover:bg-zinc-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Deslogar
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-zinc-700 last:rounded-b-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <ConnectionStatus status={instance.status} size="sm" />

          {!isConnected && (
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-medium"
            >
              <QrCode className="h-4 w-4" />
              Conectar
            </button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Criado em {new Date(instance.created_at).toLocaleDateString('pt-BR')}</span>
          <span>Atualizado {new Date(instance.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <QRCodeModal
        instanceName={instance.instance_name}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onConnected={() => {
          setShowQRModal(false);
          onRefresh();
        }}
      />
    </>
  );
}
