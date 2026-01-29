'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Settings, Smartphone, Zap, Send, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { StatCard } from '@/components/admin/shared';
import { MessageLogTable } from '@/components/admin/whatsapp';
import { getEvolutionStats, getEvolutionConfig } from '@/lib/admin/actions/evolution';

export default function WhatsAppDashboardPage() {
  const [stats, setStats] = useState({
    totalInstances: 0,
    connectedInstances: 0,
    totalMessagesSent: 0,
    messagesSentToday: 0,
    failedMessages: 0
  });
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, configData] = await Promise.all([
          getEvolutionStats(),
          getEvolutionConfig()
        ]);
        setStats(statsData);
        setIsConfigured(!!configData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const quickActions = [
    {
      label: 'Configurar API',
      href: '/admin/whatsapp/configuracao',
      icon: Settings,
      color: 'bg-blue-500/20 text-blue-400'
    },
    {
      label: 'Gerenciar Instâncias',
      href: '/admin/whatsapp/instancias',
      icon: Smartphone,
      color: 'bg-green-500/20 text-green-400'
    },
    {
      label: 'Configurar Gatilhos',
      href: '/admin/whatsapp/gatilhos',
      icon: Zap,
      color: 'bg-purple-500/20 text-purple-400'
    },
    {
      label: 'Enviar Mensagem',
      href: '/admin/whatsapp/enviar',
      icon: Send,
      color: 'bg-cyan-500/20 text-cyan-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
        <p className="text-zinc-400">Gerenciar mensagens automatizadas via Evolution API</p>
      </div>

      {/* Config Warning */}
      {isConfigured === false && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg shrink-0">
            <Settings className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-yellow-400">Configuração necessária</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Configure a URL da Evolution API e sua API Key para começar a usar o envio de mensagens.
            </p>
          </div>
          <Link
            href="/admin/whatsapp/configuracao"
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors text-sm font-medium"
          >
            Configurar
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Instâncias"
          value={stats.totalInstances}
          subtitle={`${stats.connectedInstances} conectada(s)`}
          icon={<Smartphone className="h-5 w-5" />}
          variant={stats.connectedInstances > 0 ? 'success' : 'default'}
          loading={isLoading}
        />
        <StatCard
          title="Mensagens Hoje"
          value={stats.messagesSentToday}
          icon={<MessageSquare className="h-5 w-5" />}
          variant="primary"
          loading={isLoading}
        />
        <StatCard
          title="Total Enviadas"
          value={stats.totalMessagesSent}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
          loading={isLoading}
        />
        <StatCard
          title="Falhas"
          value={stats.failedMessages}
          icon={<XCircle className="h-5 w-5" />}
          variant={stats.failedMessages > 0 ? 'danger' : 'default'}
          loading={isLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
            >
              <div className={`p-3 rounded-xl ${action.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-white flex-1">{action.label}</span>
              <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>

      {/* Recent Messages */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Últimas Mensagens</h2>
          <Link
            href="/admin/whatsapp/enviar"
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            Ver todos
          </Link>
        </div>
        <MessageLogTable limit={10} />
      </div>
    </div>
  );
}
