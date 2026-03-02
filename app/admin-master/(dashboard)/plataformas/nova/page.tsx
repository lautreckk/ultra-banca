'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPlatform, getClientsForSelect, type ClientOption } from '@/lib/admin/actions/master';
import { Building2, ArrowLeft, Loader2, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function NovaPlataformaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('client_id');

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [form, setForm] = useState({
    client_id: preselectedClientId || '',
    name: '',
    domain: '',
    slug: '',
    site_description: '',
    logo_url: '',
    color_primary: '#FFD700',
    active_gateway: 'bspay',
  });

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoadingClients(true);
    const data = await getClientsForSelect();
    setClients(data);
    setLoadingClients(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setForm((prev) => ({ ...prev, slug }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.client_id || !form.name || !form.domain || !form.slug) {
      setError('Preencha todos os campos obrigatorios');
      return;
    }

    startTransition(async () => {
      const result = await createPlatform(form);
      if (result.success) {
        router.push('/admin-master/plataformas');
      } else {
        setError(result.error || 'Erro ao criar plataforma');
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin-master/plataformas"
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Nova Plataforma</h1>
            <p className="text-zinc-400">Cadastre uma nova banca no sistema</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-900/50 border border-purple-800/20 rounded-xl p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-400" />
              Cliente
            </h3>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Cliente *
              </label>
              {loadingClients ? (
                <div className="flex items-center gap-2 text-zinc-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando clientes...</span>
                </div>
              ) : (
                <select
                  name="client_id"
                  value={form.client_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.slug})
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Cliente ao qual esta plataforma pertence
              </p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Informacoes Basicas</h3>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Nome da Banca *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex: Banca Pantanal"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Dominio *
              </label>
              <input
                type="text"
                name="domain"
                value={form.domain}
                onChange={handleChange}
                placeholder="Ex: bancapantanal.com"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Dominio principal para acesso ao site (sem https://)
              </p>
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
                placeholder="Ex: pantanal"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Identificador unico (gerado automaticamente do nome)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Descricao
              </label>
              <textarea
                name="site_description"
                value={form.site_description}
                onChange={handleChange}
                rows={3}
                placeholder="Descricao do site para SEO"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
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

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Cor Primaria
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="color_primary"
                  value={form.color_primary}
                  onChange={handleChange}
                  className="w-12 h-12 rounded-lg border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.color_primary}
                  onChange={(e) => setForm((prev) => ({ ...prev, color_primary: e.target.value }))}
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Gateway */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Pagamentos</h3>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Gateway Ativo
              </label>
              <select
                name="active_gateway"
                value={form.active_gateway}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="bspay">BSPay</option>
                <option value="washpay">WashPay</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin-master/plataformas"
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
            Criar Plataforma
          </button>
        </div>
      </form>
    </div>
  );
}
