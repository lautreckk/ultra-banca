'use client';

import { ArrowDownToLine, Receipt, MessageCircle } from 'lucide-react';
import type { RecentActivity } from '@/lib/admin/actions/live';

interface Props {
  activities: RecentActivity[];
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function LiveActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
        <p className="text-zinc-500 text-sm">Nenhuma atividade recente</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-white">Atividades Recentes</h3>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
        {activities.map((act) => {
          const isDeposit = act.event_type === 'deposit_made';
          const formatted = formatPhone(act.telefone);

          return (
            <div key={act.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors">
              {/* Icon */}
              <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
                isDeposit
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}>
                {isDeposit ? <ArrowDownToLine className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  <span className="font-medium">{act.nome}</span>
                  <span className="text-zinc-500"> — </span>
                  <span className={isDeposit ? 'text-emerald-400' : 'text-amber-400'}>
                    {isDeposit ? 'Depósito' : 'Aposta'}
                  </span>
                </p>
                <p className="text-xs text-zinc-500">{timeAgo(act.created_at)} atrás</p>
              </div>

              {/* Value */}
              <span className={`text-sm font-semibold flex-shrink-0 ${
                isDeposit ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                R$ {act.event_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>

              {/* WhatsApp */}
              {formatted && (
                <a
                  href={`https://wa.me/${formatted}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  title={`WhatsApp ${act.nome}`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
