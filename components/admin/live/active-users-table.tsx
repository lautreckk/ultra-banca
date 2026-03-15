'use client';

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
  if (page.startsWith('/loterias')) return 'Loterias';
  if (page.startsWith('/fazendinha')) return 'Fazendinha';
  if (page.startsWith('/quininha')) return 'Quininha';
  if (page.startsWith('/resultados')) return 'Resultados';
  if (page.startsWith('/apostas')) return 'Apostas';
  if (page.startsWith('/saques')) return 'Saques';
  if (page.startsWith('/recarga')) return 'Recarga PIX';
  if (page.startsWith('/amigos')) return 'Indicação';
  return page;
}

function StatusBadge({ action, betTotal }: { action: string; betTotal: number }) {
  const isBetting = betTotal > 0 || action === 'bet_placed';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      isBetting
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isBetting ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
      {isBetting ? 'Apostando' : 'Navegando'}
    </span>
  );
}

const columns: Column<ActiveUser>[] = [
  {
    key: 'nome',
    header: 'Usuário',
    mobileHeader: true,
    render: (_, row) => (
      <div>
        <p className="text-sm font-medium text-white">{row.nome}</p>
        <p className="text-xs text-zinc-500">{formatPageName(row.current_page)}</p>
      </div>
    ),
  },
  {
    key: 'started_at',
    header: 'Tempo Ativo',
    render: (_, row) => (
      <span className="text-sm text-zinc-300">{formatTimeActive(row.started_at)}</span>
    ),
  },
  {
    key: 'last_action',
    header: 'Status',
    render: (_, row) => (
      <StatusBadge action={row.last_action} betTotal={row.session_bet_total} />
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
    key: 'last_deposit_value',
    header: 'Último Depósito',
    hideOnMobile: true,
    render: (val) => {
      const v = Number(val) || 0;
      return (
        <span className={`text-sm ${v > 0 ? 'text-cyan-400' : 'text-zinc-500'}`}>
          {v > 0 ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
        </span>
      );
    },
  },
  {
    key: 'current_page',
    header: 'Página',
    hideOnMobile: true,
    render: (val) => (
      <span className="text-sm text-zinc-400">{formatPageName(String(val || '/'))}</span>
    ),
  },
];

export function ActiveUsersTable({ users, total, page, pageSize, onPageChange, loading = false }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          Usuários Ativos
          <span className="text-xs font-normal text-zinc-500">({total})</span>
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
