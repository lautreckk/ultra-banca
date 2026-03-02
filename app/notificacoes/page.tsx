'use client';

import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { PageLayout } from '@/components/layout';

export default function NotificacoesPage() {
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [loading, setLoading] = useState(false);

  const handleActivateNotifications = async () => {
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported');
      return;
    }

    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission as 'granted' | 'denied');

      if (permission === 'granted') {
        // Show a test notification
        new Notification('Cúpula Barão', {
          body: 'Notificacoes ativadas com sucesso!',
          icon: '/icon-192.png',
        });
      }
    } catch {
      setPermissionStatus('denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="NOTIFICACOES">
      <div className="p-4 space-y-6">
        <div className="bg-[#1A1F2B] rounded-xl p-4 shadow-sm space-y-4 border border-zinc-700/40">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#E5A220] rounded-full flex items-center justify-center">
              <Bell className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-white text-center">
            Ative as Notificacoes
          </h2>

          <p className="text-zinc-400 text-center text-sm">
            Receba alertas importantes sobre:
          </p>

          <ul className="space-y-2 text-zinc-200">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Premios e resultados das apostas</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Palpites exclusivos e dicas</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Saques aprovados e depositos</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Promocoes e bonus especiais</span>
            </li>
          </ul>
        </div>

        {permissionStatus === 'granted' ? (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
            <p className="text-green-400 text-center font-medium">
              Notificacoes ativadas com sucesso!
            </p>
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 space-y-2">
            <p className="text-red-400 text-center font-medium">
              Permissao negada
            </p>
            <p className="text-red-400/80 text-center text-sm">
              Para ativar, acesse as configuracoes do navegador e permita notificacoes para este site.
            </p>
          </div>
        ) : permissionStatus === 'unsupported' ? (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-400 text-center font-medium">
              Seu navegador nao suporta notificacoes.
            </p>
          </div>
        ) : (
          <button
            onClick={handleActivateNotifications}
            disabled={loading}
            className="w-full h-14 min-h-[56px] flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700/40 hover:bg-[#2D3748] disabled:bg-zinc-700 text-white font-bold px-6 rounded-xl transition-all active:scale-[0.98]"
          >
            <Bell className="h-5 w-5" />
            {loading ? 'Ativando...' : 'Ativar Notificacoes'}
          </button>
        )}

        <p className="text-zinc-500 text-xs text-center">
          Voce pode desativar as notificacoes a qualquer momento nas configuracoes do seu navegador.
        </p>
      </div>
    </PageLayout>
  );
}
