'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { getUsers, getUserById, updateUserBalance, type UserProfile } from '@/lib/admin/actions/users';
import { Eye, Edit, X, ChevronLeft, ChevronRight, Search, Loader2, User, Wallet, Trophy, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, saldo: number, saldoBonus: number) => Promise<void>;
}

function EditUserModal({ user, isOpen, onClose, onSave }: EditModalProps) {
  const [saldo, setSaldo] = useState('');
  const [saldoBonus, setSaldoBonus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setSaldo(user.saldo.toFixed(2));
      setSaldoBonus(user.saldo_bonus.toFixed(2));
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(user.id, parseFloat(saldo) || 0, parseFloat(saldoBonus) || 0);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1f2937] rounded-xl shadow-2xl border border-zinc-800/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-semibold text-white">Editar Usuário</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">{user.nome}</p>
                <p className="text-sm text-zinc-400">{formatCPF(user.cpf)}</p>
              </div>
            </div>
            {user.telefone && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Phone className="h-4 w-4" />
                <span>{user.telefone}</span>
              </div>
            )}
          </div>

          {/* Saldo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Saldo Principal (R$)</label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="number"
                step="0.01"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
                className="pl-10 bg-gray-700 border-zinc-800 text-white"
              />
            </div>
          </div>

          {/* Saldo Bônus */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Saldo Bônus (R$)</label>
            <div className="relative">
              <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="number"
                step="0.01"
                value={saldoBonus}
                onChange={(e) => setSaldoBonus(e.target.value)}
                className="pl-10 bg-gray-700 border-zinc-800 text-white"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{user.total_apostas}</p>
              <p className="text-xs text-zinc-400">Apostas</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{formatCurrency(user.total_ganhos)}</p>
              <p className="text-xs text-zinc-400">Ganhos</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-zinc-800/50">
          <Button
            variant="outline"
            className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="teal"
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface UserCardProps {
  user: UserProfile;
  index: number;
  onView: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
}

function UserCard({ user, index, onView, onEdit }: UserCardProps) {
  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-sm font-bold text-white">
            {index}
          </div>
          <div>
            <p className="font-medium text-white">{user.nome}</p>
            <p className="text-sm text-zinc-400">{formatCPF(user.cpf)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(user)}
            className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(user)}
            className="p-2 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Saldo</p>
          <p className="text-white font-medium">{formatCurrency(user.saldo)}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Apostas</p>
          <p className="text-white font-medium">{user.total_apostas}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Ganhos</p>
          <p className="text-green-400 font-medium">{formatCurrency(user.total_ganhos)}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <p className="text-zinc-400 text-xs">Cód. Afiliado</p>
          <p className="text-white font-medium truncate">{user.codigo_convite || '-'}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminClientesPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUsers({ page, pageSize, search });
      setUsers(result.users);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleEdit = async (user: UserProfile) => {
    const fullUser = await getUserById(user.id);
    if (fullUser) {
      setEditingUser(fullUser);
      setIsEditModalOpen(true);
    }
  };

  const handleView = (user: UserProfile) => {
    window.location.href = `/admin/clientes/${user.id}`;
  };

  const handleSaveUser = async (userId: string, saldo: number, saldoBonus: number) => {
    const result = await updateUserBalance(userId, saldo, saldoBonus);
    if (result.success) {
      fetchUsers();
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Clientes</h1>
        <p className="text-sm md:text-base text-zinc-400">Gerenciamento de usuários da plataforma</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nome ou CPF..."
          className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 border border-zinc-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-transparent"
        />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="mt-2 text-zinc-400">Carregando...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          Nenhum cliente encontrado
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-3">
            {users.map((user, index) => (
              <UserCard
                key={user.id}
                user={user}
                index={((page - 1) * pageSize) + index + 1}
                onView={handleView}
                onEdit={handleEdit}
              />
            ))}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-zinc-900/50 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider w-12">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Saldo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nº Apostas</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Ganhos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">Cód. Afiliado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {((page - 1) * pageSize) + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-white">{user.nome}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {formatCPF(user.cpf)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {formatCurrency(user.saldo)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {user.total_apostas.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-green-400">{formatCurrency(user.total_ganhos)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {user.codigo_convite || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(user)}
                            className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 rounded-xl hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm text-zinc-400 text-center sm:text-left">
              Mostrando {((page - 1) * pageSize) + 1} a{' '}
              {Math.min(page * pageSize, total)} de {total} registros
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-sm transition-colors ${
                          page === pageNum
                            ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
      />
    </div>
  );
}
