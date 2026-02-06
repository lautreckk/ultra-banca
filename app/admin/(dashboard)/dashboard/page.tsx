import { Suspense } from 'react';
import {
  getDashboardStats,
  getRecentBets,
  getRecentDeposits,
  getPendingWithdrawals,
} from '@/lib/admin/actions/dashboard';
import { requireAdmin } from '@/lib/admin/actions/auth';
import { StatCard, StatusBadge } from '@/components/admin/shared';
import { formatCurrency } from '@/lib/utils/format-currency';
import Link from 'next/link';

function LoadingCard() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2" />
      <div className="h-8 bg-zinc-800 rounded w-1/2" />
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
      <div className="h-6 bg-zinc-800 rounded w-1/4 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-zinc-800 rounded" />
        ))}
      </div>
    </div>
  );
}

async function DashboardStats() {
  const stats = await getDashboardStats();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        title="Total de Ganhos (Apostadores)"
        value={formatCurrency(stats.totalGanhos)}
        icon="TrendingUp"
        variant="success"
      />
      <StatCard
        title="Total de Apostas"
        value={stats.totalApostas.toLocaleString('pt-BR')}
        subtitle={`${stats.apostasHoje} hoje`}
        icon="Receipt"
        variant="info"
      />
      <StatCard
        title="Total de Depósitos"
        value={formatCurrency(stats.totalDepositos)}
        icon="ArrowDownToLine"
        variant="default"
      />
      <StatCard
        title="Total de Saques"
        value={formatCurrency(stats.totalSaques)}
        subtitle={`${formatCurrency(stats.saquesHoje)} hoje`}
        icon="ArrowUpFromLine"
        variant="warning"
      />
      <StatCard
        title="Depósitos Diário"
        value={formatCurrency(stats.depositosDiario)}
        icon="Calendar"
        variant="default"
      />
      <StatCard
        title="Depósitos Semanal"
        value={formatCurrency(stats.depositosSemanal)}
        icon="CalendarDays"
        variant="default"
      />
      <StatCard
        title="Depósitos Mensal"
        value={formatCurrency(stats.depositosMensal)}
        icon="CalendarRange"
        variant="default"
      />
      <StatCard
        title="Usuários Ativos (7d)"
        value={stats.usuariosAtivos.toLocaleString('pt-BR')}
        icon="Users"
        variant="info"
      />
    </div>
  );
}

async function RecentBetsTable() {
  const bets = await getRecentBets(7);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800/50 flex justify-between items-center">
        <h3 className="font-semibold text-white text-sm md:text-base">Últimas Apostas Finalizadas</h3>
        <Link href="/admin/apostas" className="text-xs md:text-sm text-indigo-400 hover:underline">
          Ver todas
        </Link>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {bets.length === 0 ? (
          <div className="px-4 py-6 text-center text-zinc-500 text-sm">
            Nenhuma aposta finalizada ainda
          </div>
        ) : (
          <div className="divide-y divide-zinc-700/40">
            {bets.map((bet) => (
              <div key={bet.id} className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-white">{bet.user_name}</p>
                    <p className="text-xs text-zinc-500 capitalize">{bet.modalidade}</p>
                  </div>
                  <StatusBadge status={bet.status} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Valor: <span className="text-zinc-300">{formatCurrency(bet.valor_total)}</span></span>
                  <span className="text-zinc-500">Prêmio: <span className="text-green-400">{bet.premio_valor ? formatCurrency(bet.premio_valor) : '-'}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-800/30">
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Usuário</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Modalidade</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Valor</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Prêmio</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/40">
            {bets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  Nenhuma aposta finalizada ainda
                </td>
              </tr>
            ) : (
              bets.map((bet) => (
                <tr key={bet.id} className="hover:bg-zinc-800/50">
                  <td className="px-4 py-2 text-sm text-zinc-300">{bet.user_name}</td>
                  <td className="px-4 py-2 text-sm text-zinc-300 capitalize">{bet.modalidade}</td>
                  <td className="px-4 py-2 text-sm text-zinc-300">{formatCurrency(bet.valor_total)}</td>
                  <td className="px-4 py-2 text-sm text-zinc-300">
                    {bet.premio_valor ? formatCurrency(bet.premio_valor) : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={bet.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function RecentDepositsTable() {
  const deposits = await getRecentDeposits(7);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800/50 flex justify-between items-center">
        <h3 className="font-semibold text-white text-sm md:text-base">Últimos Depósitos</h3>
        <Link href="/admin/financeiro/depositos" className="text-xs md:text-sm text-indigo-400 hover:underline">
          Ver todos
        </Link>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {deposits.length === 0 ? (
          <div className="px-4 py-6 text-center text-zinc-500 text-sm">
            Nenhum depósito registrado ainda
          </div>
        ) : (
          <div className="divide-y divide-zinc-700/40">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-white">{deposit.user_name}</p>
                    <p className="text-xs text-zinc-500">{new Date(deposit.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <StatusBadge status={deposit.status} />
                </div>
                <div className="text-sm font-semibold text-green-400">
                  {formatCurrency(deposit.valor)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-800/30">
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Usuário</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Valor</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/40">
            {deposits.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Nenhum depósito registrado ainda
                </td>
              </tr>
            ) : (
              deposits.map((deposit) => (
                <tr key={deposit.id} className="hover:bg-zinc-800/50">
                  <td className="px-4 py-2 text-sm text-zinc-300">{deposit.user_name}</td>
                  <td className="px-4 py-2 text-sm text-zinc-300">{formatCurrency(deposit.valor)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={deposit.status} />
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-500">
                    {new Date(deposit.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function PendingWithdrawalsTable() {
  const withdrawals = await getPendingWithdrawals(7);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800/50 flex justify-between items-center">
        <h3 className="font-semibold text-white text-sm md:text-base">Saques Pendentes</h3>
        <Link href="/admin/financeiro/saques" className="text-xs md:text-sm text-indigo-400 hover:underline">
          Ver todos
        </Link>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {withdrawals.length === 0 ? (
          <div className="px-4 py-6 text-center text-zinc-500 text-sm">
            Nenhum saque pendente
          </div>
        ) : (
          <div className="divide-y divide-zinc-700/40">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-white">{withdrawal.user_name}</p>
                    <p className="text-xs text-zinc-500">{new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-sm font-semibold text-yellow-400">
                    {formatCurrency(withdrawal.valor_liquido)}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 truncate">
                  PIX: <span className="text-zinc-300">{withdrawal.chave_pix}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-800/30">
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Usuário</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Valor</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Chave PIX</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/40">
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Nenhum saque pendente
                </td>
              </tr>
            ) : (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-zinc-800/50">
                  <td className="px-4 py-2 text-sm text-zinc-300">{withdrawal.user_name}</td>
                  <td className="px-4 py-2 text-sm text-zinc-300">{formatCurrency(withdrawal.valor_liquido)}</td>
                  <td className="px-4 py-2 text-sm text-zinc-500 truncate max-w-[150px]" title={withdrawal.chave_pix}>
                    {withdrawal.chave_pix}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-500">
                    {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm md:text-base text-zinc-500">Visão geral da plataforma</p>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <LoadingCard key={i} />)}
        </div>
      }>
        <DashboardStats />
      </Suspense>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Suspense fallback={<LoadingTable />}>
          <RecentBetsTable />
        </Suspense>
        <Suspense fallback={<LoadingTable />}>
          <RecentDepositsTable />
        </Suspense>
      </div>

      {/* Pending Withdrawals */}
      <Suspense fallback={<LoadingTable />}>
        <PendingWithdrawalsTable />
      </Suspense>
    </div>
  );
}
