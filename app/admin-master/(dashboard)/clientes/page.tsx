'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  getClients,
  deleteClient,
  updateClient,
  type Client,
} from '@/lib/admin/actions/clients';
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Building2,
  Users,
} from 'lucide-react';
import Link from 'next/link';

export default function ClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  }

  async function handleToggleActive(client: Client) {
    setActionLoading(client.id);
    const result = await updateClient(client.id, { ativo: !client.ativo });
    if (result.success) {
      await loadClients();
    } else {
      alert(result.error);
    }
    setActionLoading(null);
  }

  async function handleDelete(client: Client) {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
      return;
    }

    setActionLoading(client.id);
    const result = await deleteClient(client.id);
    if (result.success) {
      await loadClients();
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
          <Briefcase className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Clientes</h1>
            <p className="text-zinc-400">Gerencie os clientes do Scarface SaaS</p>
          </div>
        </div>
        <Link
          href="/admin-master/clientes/novo"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Link>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/50 border border-purple-800/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Plataformas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Usuarios
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
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          client.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        <p className="text-sm text-zinc-500">{client.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-zinc-300">{client.email || '-'}</p>
                      <p className="text-sm text-zinc-500">{client.phone || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Building2 className="h-4 w-4 text-purple-400" />
                      <span>{client.total_platforms || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span>{client.total_users?.toLocaleString() || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(client)}
                      disabled={actionLoading === client.id}
                      className="flex items-center gap-2"
                    >
                      {actionLoading === client.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                      ) : client.ativo ? (
                        <ToggleRight className="h-6 w-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-zinc-500" />
                      )}
                      <span
                        className={`text-sm ${
                          client.ativo ? 'text-green-400' : 'text-zinc-500'
                        }`}
                      >
                        {client.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin-master/clientes/${client.id}`}
                        className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(client)}
                        disabled={actionLoading === client.id}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum cliente cadastrado
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
