'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClientRecord } from '@/lib/admin/actions/clients';
import { Briefcase, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NovoClientePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    logo_url: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    setForm((prev) => ({ ...prev, phone: formatted }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.slug) {
      setError('Preencha todos os campos obrigatorios');
      return;
    }

    startTransition(async () => {
      const result = await createClientRecord(form);
      if (result.success) {
        router.push('/admin-master/clientes');
      } else {
        setError(result.error || 'Erro ao criar cliente');
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-white">Novo Cliente</h1>
            <p className="text-zinc-400">Cadastre um novo cliente no sistema</p>
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
              <p className="mt-1 text-xs text-zinc-500">
                Identificador unico (gerado automaticamente do nome)
              </p>
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
            Criar Cliente
          </button>
        </div>
      </form>
    </div>
  );
}
