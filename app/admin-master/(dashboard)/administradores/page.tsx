'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  getPlatformAdmins,
  getPlatforms,
  searchUsersForAdmin,
  linkAdminToPlatform,
  unlinkAdminFromPlatform,
  type PlatformAdmin,
  type Platform,
  type UserSearchResult,
} from '@/lib/admin/actions/master';
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  Search,
  X,
  Building2,
  UserCircle,
} from 'lucide-react';

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [adminsData, platformsData] = await Promise.all([
      getPlatformAdmins(),
      getPlatforms(),
    ]);
    setAdmins(adminsData);
    setPlatforms(platformsData);
    setLoading(false);
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const results = await searchUsersForAdmin(query);
    setSearchResults(results);
    setSearching(false);
  }

  async function handleLink() {
    if (!selectedUser || !selectedPlatform) {
      alert('Selecione um usuario e uma plataforma');
      return;
    }

    startTransition(async () => {
      const result = await linkAdminToPlatform(selectedUser.id, selectedPlatform);
      if (result.success) {
        await loadData();
        setShowModal(false);
        setSelectedUser(null);
        setSelectedPlatform('');
        setSearchQuery('');
        setSearchResults([]);
      } else {
        alert(result.error);
      }
    });
  }

  async function handleUnlink(linkId: string) {
    if (!confirm('Tem certeza que deseja remover este vinculo?')) {
      return;
    }

    setActionLoading(linkId);
    const result = await unlinkAdminFromPlatform(linkId);
    if (result.success) {
      await loadData();
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
          <Users className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Administradores</h1>
            <p className="text-zinc-400">Vincule usuarios como admins das plataformas</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Vincular Admin
        </button>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/50 border border-purple-800/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Plataforma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Vinculado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-zinc-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{admin.user_name}</p>
                        <p className="text-sm text-zinc-500">{admin.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-400" />
                      <span className="text-zinc-300">{admin.platform_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleUnlink(admin.id)}
                      disabled={actionLoading === admin.id}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === admin.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum vinculo de admin encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-purple-800/30 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Vincular Admin</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* User Search */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Buscar Usuario
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Digite nome ou CPF..."
                    className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-purple-400" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && !selectedUser && (
                  <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-lg divide-y divide-zinc-700 max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors"
                      >
                        <p className="text-white">{user.nome}</p>
                        <p className="text-xs text-zinc-500">
                          CPF: {user.cpf} - Plataforma: {user.platform_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected User */}
                {selectedUser && (
                  <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{selectedUser.nome}</p>
                      <p className="text-xs text-zinc-400">CPF: {selectedUser.cpf}</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Platform Select */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Plataforma
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Selecione uma plataforma</option>
                  {platforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name} ({platform.domain})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLink}
                disabled={!selectedUser || !selectedPlatform || isPending}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
