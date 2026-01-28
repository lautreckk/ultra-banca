'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getUserById, updateUserBalance, type UserProfile } from '@/lib/admin/actions/users';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Wallet, Receipt, Calendar, Save, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isEditMode = searchParams.get('edit') === 'true';

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedSaldo, setEditedSaldo] = useState('');
  const [editedSaldoBonus, setEditedSaldoBonus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const data = await getUserById(id);
        setUser(data);
        if (data) {
          setEditedSaldo(data.saldo.toString());
          setEditedSaldoBonus(data.saldo_bonus.toString());
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleSave = async () => {
    if (!user) return;

    setError('');
    setIsSaving(true);

    try {
      const result = await updateUserBalance(
        user.id,
        parseFloat(editedSaldo) || 0,
        parseFloat(editedSaldoBonus) || 0
      );

      if (result.error) {
        setError(result.error);
      } else {
        // Refresh user data
        const data = await getUserById(id);
        setUser(data);
        router.push(`/admin/clientes/${id}`);
      }
    } catch {
      setError('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-700 rounded w-48 animate-pulse" />
        <div className="bg-[#374151] rounded-lg p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 bg-gray-600 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/clientes"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para clientes
        </Link>
        <div className="bg-[#374151] rounded-lg p-6 text-center">
          <p className="text-gray-400">Usuário não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/clientes"
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.nome}</h1>
            <p className="text-gray-400">
              CPF: {user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
            </p>
          </div>
        </div>
        {!isEditMode && (
          <Link href={`/admin/clientes/${id}?edit=true`}>
            <Button variant="teal">Editar</Button>
          </Link>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* User Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-[#374151] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-600 rounded-lg">
              <User className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Informações Básicas</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Nome</label>
              <p className="text-white">{user.nome}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">CPF</label>
              <p className="text-white">
                {user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Telefone</label>
              <p className="text-white">{user.telefone || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Código de Convite</label>
              <p className="text-white">{user.codigo_convite || '-'}</p>
            </div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="bg-[#374151] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-600 rounded-lg">
              <Wallet className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Saldo</h2>
          </div>
          <div className="space-y-3">
            {isEditMode ? (
              <>
                <div>
                  <label className="text-sm text-gray-400">Saldo Principal (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editedSaldo}
                    onChange={(e) => setEditedSaldo(e.target.value)}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Saldo Bônus (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editedSaldoBonus}
                    onChange={(e) => setEditedSaldoBonus(e.target.value)}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm text-gray-400">Saldo Principal</label>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(user.saldo)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Saldo Bônus</label>
                  <p className="text-xl font-semibold text-cyan-400">
                    {formatCurrency(user.saldo_bonus)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Info */}
        <div className="bg-[#374151] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-600 rounded-lg">
              <Receipt className="h-5 w-5 text-yellow-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Estatísticas</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Total de Apostas</label>
              <p className="text-xl font-semibold text-white">
                {user.total_apostas.toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Total de Ganhos</label>
              <p className="text-xl font-semibold text-green-400">
                {formatCurrency(user.total_ganhos)}
              </p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-[#374151] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-600 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Conta</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Data de Cadastro</label>
              <p className="text-white">
                {new Date(user.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Actions */}
      {isEditMode && (
        <div className="flex justify-end gap-3">
          <Link href={`/admin/clientes/${id}`}>
            <Button variant="secondary">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </Link>
          <Button variant="teal" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      )}
    </div>
  );
}
