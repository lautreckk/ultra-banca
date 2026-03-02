'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getClientById,
  updateClient,
  getClientPlatforms,
  type Client,
  type ClientPlatform,
} from '@/lib/admin/actions/clients';
import {
  Briefcase,
  ArrowLeft,
  Loader2,
  Building2,
  Users,
  ExternalLink,
  Plus,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import Link from 'next/link';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [platforms, setPlatforms] = useState<ClientPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    logo_url: '',
  });

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    setLoading(true);
    const [clientData, platformsData] = await Promise.all([
      getClientById(clientId),
      getClientPlatforms(clientId),
    ]);

    if (clientData) {
      setClient(clientData);
      setForm({
        name: clientData.name,
        slug: clientData.slug,
        email: clientData.email || '',
        phone: clientData.phone || '',
        logo_url: clientData.logo_url || '',
      });
    }

    setPlatforms(platformsData);
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  }

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    setForm((prev) => ({ ...prev, phone: formatted }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.name || !form.slug) {
      setError('Preencha todos os campos obrigatorios');
      return;
    }

    startTransition(async () => {
      const result = await updateClient(clientId, form);
      if (result.success) {
        setSuccess(true);
        await loadData();
      } else {
        setError(result.error || 'Erro ao atualizar cliente');
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Cliente nao encontrado</p>
        <Link
          href="/admin-master/clientes"
          className="text-purple-400 hover:text-purple-300 mt-4 inline-block"
        >
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin-master/clientes"
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Cliente</h1>
            <p className="text-zinc-400">{client.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form - Left side */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-zinc-900/50 border border-purple-800/20 rounded-xl p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                  Cliente atualizado com sucesso!
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Informacoes Basicas</h3>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ex: Banca Elite"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="Ex: banca-elite"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Contato</h3>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="contato@cliente.com"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Visual */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Visual</h3>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    URL do Logo
                  </label>
                  <input
                    type="text"
                    name="logo_url"
                    value={form.logo_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/admin-master/clientes"
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar Alteracoes
              </button>
            </div>
          </form>
        </div>

        {/* Stats - Right side */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="bg-zinc-900/50 border border-purple-800/20 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Estatisticas</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs uppercase">Plataformas</span>
                </div>
                <p className="text-2xl font-bold text-white">{client.total_platforms || 0}</p>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs uppercase">Usuarios</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {client.total_users?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Platforms List */}
          <div className="bg-zinc-900/50 border border-purple-800/20 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Plataformas</h3>
              <Link
                href={`/admin-master/plataformas/nova?client_id=${clientId}`}
                className="p-2 hover:bg-zinc-700 rounded-lg text-purple-400 hover:text-purple-300 transition-colors"
                title="Nova plataforma"
              >
                <Plus className="h-4 w-4" />
              </Link>
            </div>

            {platforms.length === 0 ? (
              <p className="text-zinc-500 text-sm">Nenhuma plataforma vinculada</p>
            ) : (
              <div className="space-y-3">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                      style={{ backgroundColor: platform.color_primary }}
                    >
                      {platform.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{platform.name}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{platform.total_users || 0} usuarios</span>
                        <span>|</span>
                        <span>{formatCurrency(platform.total_deposits || 0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {platform.ativo ? (
                        <ToggleRight className="h-5 w-5 text-green-400" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-zinc-500" />
                      )}
                      <Link
                        href={`/admin-master/plataformas/${platform.id}`}
                        className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
