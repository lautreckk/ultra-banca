import { getGlobalStats, getPlatforms } from '@/lib/admin/actions/master';
import { Building2, Users, Wallet, Receipt, TrendingUp, Crown } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = 'purple',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'purple' | 'green' | 'blue' | 'yellow';
}) {
  const colors = {
    purple: 'from-purple-500/20 to-purple-900/20 border-purple-500/30 text-purple-400',
    green: 'from-green-500/20 to-green-900/20 border-green-500/30 text-green-400',
    blue: 'from-blue-500/20 to-blue-900/20 border-blue-500/30 text-blue-400',
    yellow: 'from-yellow-500/20 to-yellow-900/20 border-yellow-500/30 text-yellow-400',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-6`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <Icon className="h-8 w-8 opacity-50" />
      </div>
    </div>
  );
}

export default async function AdminMasterDashboardPage() {
  const [stats, platforms] = await Promise.all([
    getGlobalStats(),
    getPlatforms(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Master</h1>
          <p className="text-zinc-400">Visao global de todas as plataformas</p>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Plataformas Ativas"
          value={`${stats.activePlatforms} / ${stats.totalPlatforms}`}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Total de Usuarios"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total em Depositos"
          value={formatCurrency(stats.totalDeposits)}
          icon={Wallet}
          color="green"
        />
        <StatCard
          title="Total em Apostas"
          value={formatCurrency(stats.totalRevenue)}
          icon={Receipt}
          color="yellow"
        />
      </div>

      {/* Platforms Table */}
      <div className="bg-zinc-900/50 border border-purple-800/20 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-purple-800/20 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Plataformas</h2>
          <Link
            href="/admin-master/plataformas/nova"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Nova Plataforma
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Plataforma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Dominio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Usuarios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Depositos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Apostas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {platforms.map((platform) => (
                <tr key={platform.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: platform.color_primary }}
                      >
                        {platform.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{platform.name}</p>
                        <p className="text-sm text-zinc-500">{platform.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{platform.domain}</td>
                  <td className="px-6 py-4 text-zinc-300">
                    {platform.total_users?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-green-400">
                    {formatCurrency(platform.total_deposits || 0)}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {platform.total_bets?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        platform.ativo
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {platform.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
              {platforms.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    Nenhuma plataforma cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
