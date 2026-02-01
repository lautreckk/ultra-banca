'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  getPlatforms,
  deletePlatform,
  updatePlatform,
  type Platform,
} from '@/lib/admin/actions/master';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function PlataformasPage() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPlatforms();
  }, []);

  async function loadPlatforms() {
    setLoading(true);
    const data = await getPlatforms();
    setPlatforms(data);
    setLoading(false);
  }

  async function handleToggleActive(platform: Platform) {
    setActionLoading(platform.id);
    const result = await updatePlatform(platform.id, { ativo: !platform.ativo });
    if (result.success) {
      await loadPlatforms();
    } else {
      alert(result.error);
    }
    setActionLoading(null);
  }

  async function handleDelete(platform: Platform) {
    if (!confirm(`Tem certeza que deseja excluir a plataforma "${platform.name}"?`)) {
      return;
    }

    setActionLoading(platform.id);
    const result = await deletePlatform(platform.id);
    if (result.success) {
      await loadPlatforms();
    } else {
      alert(result.error);
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Plataformas</h1>
            <p className="text-zinc-400">Gerencie todas as bancas do sistema</p>
          </div>
        </div>
        <Link
          href="/admin-master/plataformas/nova"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Nova Plataforma
        </Link>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/50 border border-purple-800/20 rounded-xl overflow-hidden">
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
                  Gateway
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Usuarios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Faturamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Acoes
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
                  <td className="px-6 py-4">
                    <a
                      href={`https://${platform.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      {platform.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 uppercase text-sm">
                    {platform.active_gateway}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {platform.total_users?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-green-400">
                    {formatCurrency(platform.total_deposits || 0)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(platform)}
                      disabled={actionLoading === platform.id}
                      className="flex items-center gap-2"
                    >
                      {actionLoading === platform.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                      ) : platform.ativo ? (
                        <ToggleRight className="h-6 w-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-zinc-500" />
                      )}
                      <span
                        className={`text-sm ${
                          platform.ativo ? 'text-green-400' : 'text-zinc-500'
                        }`}
                      >
                        {platform.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin-master/plataformas/${platform.id}`}
                        className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(platform)}
                        disabled={actionLoading === platform.id}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {platforms.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
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
