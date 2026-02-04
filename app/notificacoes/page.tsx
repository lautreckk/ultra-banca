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
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#E5A220] rounded-full flex items-center justify-center">
              <Bell className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-800 text-center">
            Ative as Notificacoes
          </h2>

          <p className="text-gray-600 text-center text-sm">
            Receba alertas importantes sobre:
          </p>

          <ul className="space-y-2 text-gray-700">
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-center font-medium">
              Notificacoes ativadas com sucesso!
            </p>
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <p className="text-red-800 text-center font-medium">
              Permissao negada
            </p>
            <p className="text-red-600 text-center text-sm">
              Para ativar, acesse as configuracoes do navegador e permita notificacoes para este site.
            </p>
          </div>
        ) : permissionStatus === 'unsupported' ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-center font-medium">
              Seu navegador nao suporta notificacoes.
            </p>
          </div>
        ) : (
          <button
            onClick={handleActivateNotifications}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1A202C] hover:bg-[#2D3748] disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {loading ? 'Ativando...' : 'Ativar Notificacoes'}
          </button>
        )}

        <p className="text-gray-500 text-xs text-center">
          Voce pode desativar as notificacoes a qualquer momento nas configuracoes do seu navegador.
        </p>
      </div>
    </PageLayout>
  );
}
