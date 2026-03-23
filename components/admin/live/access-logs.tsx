'use client';

import { MapPin, Clock } from 'lucide-react';
import type { AccessLog } from '@/lib/admin/actions/live';

interface Props {
  logs: AccessLog[];
  loading?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function AccessLogs({ logs, loading }: Props) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Acessos Recentes</h3>
        {loading && <span className="text-xs text-zinc-500 animate-pulse">atualizando...</span>}
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">Nenhum acesso recente</p>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
              <div className="h-8 w-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{log.nome}</p>
                <p className="text-xs text-zinc-500">{log.city}, {log.region}</p>
              </div>
              <span className="text-xs text-zinc-500 flex-shrink-0">{timeAgo(log.last_login)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
