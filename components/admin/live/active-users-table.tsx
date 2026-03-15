'use client';

import { MessageCircle, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/admin/shared/data-table';
import type { ActiveUser } from '@/lib/admin/actions/live';

interface Props {
  users: ActiveUser[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

function formatTimeActive(startedAt: string): string {
  if (!startedAt) return '-';
  const diff = Date.now() - new Date(startedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}min`;
}

function formatPageName(page: string): string {
  if (page === '/' || page === '/home') return 'Home';
  if (page.startsWith('/cadastro')) return 'Cadastro';
  if (page.startsWith('/login')) return 'Login';
  if (page.startsWith('/loterias')) return 'Loterias';
  if (page.startsWith('/fazendinha')) return 'Fazendinha';
  if (page.startsWith('/quininha')) return 'Quininha';
  if (page.startsWith('/seninha')) return 'Seninha';
  if (page.startsWith('/resultados')) return 'Resultados';
  if (page.startsWith('/apostas')) return 'Apostas';
  if (page.startsWith('/saques')) return 'Saques';
  if (page.startsWith('/recarga')) return 'Recarga PIX';
  if (page.startsWith('/amigos')) return 'Indicação';
  if (page.startsWith('/cassino')) return 'Cassino';
  if (page.startsWith('/transferencia')) return 'Transferência';
  if (page.startsWith('/premiadas')) return 'Premiadas';
  if (page.startsWith('/relatorios')) return 'Relatórios';
  if (page.startsWith('/sonhos')) return 'Sonhos';
  if (page.startsWith('/tabela')) return 'Tabela Bichos';
  return page;
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  // Remove tudo que não é número
  const digits = phone.replace(/\D/g, '');
  // Garante formato internacional para WhatsApp
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      Online
    </span>
  );
}

function WhatsAppButton({ phone }: { phone: string }) {
  if (!phone) return <span className="text-zinc-600 text-xs">-</span>;
  const formatted = formatPhone(phone);
  return (
    <a
      href={`https://wa.me/${formatted}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
      onClick={(e) => e.stopPropagation()}
    >
      <MessageCircle className="h-3.5 w-3.5" />
      <span className="hidden md:inline">WhatsApp</span>
    </a>
  );
}

function NotifyButton({ userId, router }: { userId: string | null; router: ReturnType<typeof useRouter> }) {
  if (!userId) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/admin/notificacoes?user=${userId}`);
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors text-xs font-medium"
      title="Enviar notificação"
    >
      <Bell className="h-3.5 w-3.5" />
      <span className="hidden md:inline">Notificar</span>
    </button>
  );
}

export function ActiveUsersTable({ users, total, page, pageSize, onPageChange, loading = false }: Props) {
  const router = useRouter();

  const columns: Column<ActiveUser>[] = [
    {
      key: 'nome',
      header: 'Usuário',
      mobileHeader: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-emerald-400">
              {row.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{row.nome}</p>
            <p className="text-xs text-zinc-500">
              {row.telefone || formatPageName(row.current_page)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'last_action',
      header: 'Status',
      render: () => <StatusBadge />,
    },
    {
      key: 'started_at',
      header: 'Tempo Ativo',
      render: (_, row) => (
        <span className="text-sm text-zinc-300">{formatTimeActive(row.started_at)}</span>
      ),
    },
    {
      key: 'current_page',
      header: 'Página',
      hideOnMobile: true,
      render: (val) => (
        <span className="text-sm text-zinc-400">{formatPageName(String(val || '/'))}</span>
      ),
    },
    {
      key: 'session_bet_total',
      header: 'Apostado',
      render: (val) => {
        const v = Number(val) || 0;
        return (
          <span className={`text-sm ${v > 0 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}`}>
            {v > 0 ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
          </span>
        );
      },
    },
    {
      key: 'telefone',
      header: 'Ações',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <WhatsAppButton phone={row.telefone} />
          <NotifyButton userId={row.user_id} router={router} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          Usuários Ativos
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">{total}</span>
          </span>
        </h3>
      </div>
      <DataTable
        columns={columns}
        data={users}
        rowKey="id"
        isLoading={loading}
        emptyMessage="Nenhum usuário online no momento"
        pagination={total > pageSize ? { page, pageSize, total, onPageChange } : undefined}
      />
    </div>
  );
}
