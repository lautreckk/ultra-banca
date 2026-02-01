'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getPlatformById,
  updatePlatform,
  getPlatformAdminsByPlatform,
  searchUsersForAdmin,
  linkAdminToPlatform,
  unlinkAdminFromPlatform,
  resetAdminPassword,
  type PlatformAdmin,
  type UserSearchResult,
} from '@/lib/admin/actions/master';
import {
  Building2,
  ArrowLeft,
  Loader2,
  Palette,
  Share2,
  CreditCard,
  Target,
  BarChart3,
  Users,
  Settings,
  Megaphone,
  Search,
  Plus,
  Trash2,
  X,
  UserCircle,
  AlertCircle,
  Key,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';

// Types for platform data
interface PlatformData {
  id: string;
  client_id: string | null;
  domain: string;
  slug: string;
  name: string;
  site_description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  color_primary: string | null;
  color_primary_dark: string | null;
  color_background: string | null;
  color_surface: string | null;
  color_accent_teal: string | null;
  color_accent_green: string | null;
  color_text_primary: string | null;
  social_whatsapp: string | null;
  social_instagram: string | null;
  social_telegram: string | null;
  active_gateway: string | null;
  gateway_credentials: Record<string, unknown> | null;
  deposit_min: number | null;
  deposit_max: number | null;
  withdrawal_min: number | null;
  withdrawal_max: number | null;
  withdrawal_fee_percent: number | null;
  withdrawal_mode: string | null;
  bet_min: number | null;
  bet_max: number | null;
  max_payout_per_bet: number | null;
  max_payout_daily: number | null;
  facebook_pixel_id: string | null;
  facebook_access_token: string | null;
  google_analytics_id: string | null;
  custom_head_scripts: string | null;
  promotor_link: string | null;
  comissao_promotor_automatica: boolean | null;
  production_mode: boolean | null;
  ativo: boolean;
  created_at: string;
}

type TabId = 'basico' | 'visual' | 'social' | 'gateway' | 'apostas' | 'marketing' | 'promotores' | 'admins' | 'avancado';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'basico', label: 'Basico', icon: <Building2 className="h-4 w-4" /> },
  { id: 'visual', label: 'Visual', icon: <Palette className="h-4 w-4" /> },
  { id: 'social', label: 'Social', icon: <Share2 className="h-4 w-4" /> },
  { id: 'gateway', label: 'Gateway', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'apostas', label: 'Apostas', icon: <Target className="h-4 w-4" /> },
  { id: 'marketing', label: 'Marketing', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'promotores', label: 'Promotores', icon: <Megaphone className="h-4 w-4" /> },
  { id: 'admins', label: 'Admins', icon: <Users className="h-4 w-4" /> },
  { id: 'avancado', label: 'Avancado', icon: <Settings className="h-4 w-4" /> },
];

export default function EditarPlataformaPage() {
  const router = useRouter();
  const params = useParams();
  const platformId = params.id as string;

  const [platform, setPlatform] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('basico');

  // Admin management state
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState<string | null>(null);

  // Password reset modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordResetAdmin, setPasswordResetAdmin] = useState<PlatformAdmin | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    // Basic
    name: '',
    slug: '',
    domain: '',
    site_description: '',
    ativo: true,
    // Visual
    logo_url: '',
    favicon_url: '',
    color_primary: '#FFD700',
    color_primary_dark: '#B8860B',
    color_background: '#121212',
    color_surface: '#121212',
    color_accent_teal: '#2E8B57',
    color_accent_green: '#1A5125',
    color_text_primary: '#FFFFFF',
    // Social
    social_whatsapp: '',
    social_instagram: '',
    social_telegram: '',
    // Gateway
    active_gateway: 'bspay',
    gateway_credentials: '{}',
    deposit_min: 10,
    deposit_max: 10000,
    withdrawal_min: 20,
    withdrawal_max: 5000,
    withdrawal_fee_percent: 0,
    withdrawal_mode: 'manual',
    // Betting
    bet_min: 1,
    bet_max: 1000,
    max_payout_per_bet: 50000,
    max_payout_daily: 100000,
    // Marketing
    facebook_pixel_id: '',
    facebook_access_token: '',
    google_analytics_id: '',
    custom_head_scripts: '',
    // Promoters
    promotor_link: '',
    comissao_promotor_automatica: true,
    // Advanced
    production_mode: false,
  });

  useEffect(() => {
    loadData();
  }, [platformId]);

  useEffect(() => {
    if (activeTab === 'admins' && admins.length === 0 && !loadingAdmins) {
      loadAdmins();
    }
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    const data = await getPlatformById(platformId);

    if (data) {
      setPlatform(data as PlatformData);
      setForm({
        name: data.name || '',
        slug: data.slug || '',
        domain: data.domain || '',
        site_description: (data as PlatformData).site_description || '',
        ativo: data.ativo,
        logo_url: (data as PlatformData).logo_url || '',
        favicon_url: (data as PlatformData).favicon_url || '',
        color_primary: (data as PlatformData).color_primary || '#FFD700',
        color_primary_dark: (data as PlatformData).color_primary_dark || '#B8860B',
        color_background: (data as PlatformData).color_background || '#121212',
        color_surface: (data as PlatformData).color_surface || '#121212',
        color_accent_teal: (data as PlatformData).color_accent_teal || '#2E8B57',
        color_accent_green: (data as PlatformData).color_accent_green || '#1A5125',
        color_text_primary: (data as PlatformData).color_text_primary || '#FFFFFF',
        social_whatsapp: (data as PlatformData).social_whatsapp || '',
        social_instagram: (data as PlatformData).social_instagram || '',
        social_telegram: (data as PlatformData).social_telegram || '',
        active_gateway: (data as PlatformData).active_gateway || 'bspay',
        gateway_credentials: JSON.stringify((data as PlatformData).gateway_credentials || {}, null, 2),
        deposit_min: (data as PlatformData).deposit_min || 10,
        deposit_max: (data as PlatformData).deposit_max || 10000,
        withdrawal_min: (data as PlatformData).withdrawal_min || 20,
        withdrawal_max: (data as PlatformData).withdrawal_max || 5000,
        withdrawal_fee_percent: (data as PlatformData).withdrawal_fee_percent || 0,
        withdrawal_mode: (data as PlatformData).withdrawal_mode || 'manual',
        bet_min: (data as PlatformData).bet_min || 1,
        bet_max: (data as PlatformData).bet_max || 1000,
        max_payout_per_bet: (data as PlatformData).max_payout_per_bet || 50000,
        max_payout_daily: (data as PlatformData).max_payout_daily || 100000,
        facebook_pixel_id: (data as PlatformData).facebook_pixel_id || '',
        facebook_access_token: (data as PlatformData).facebook_access_token || '',
        google_analytics_id: (data as PlatformData).google_analytics_id || '',
        custom_head_scripts: (data as PlatformData).custom_head_scripts || '',
        promotor_link: (data as PlatformData).promotor_link || '',
        comissao_promotor_automatica: (data as PlatformData).comissao_promotor_automatica ?? true,
        production_mode: (data as PlatformData).production_mode ?? false,
      });
    }

    setLoading(false);
  }

  async function loadAdmins() {
    setLoadingAdmins(true);
    const data = await getPlatformAdminsByPlatform(platformId);
    setAdmins(data);
    setLoadingAdmins(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: newValue }));
    setSuccess(false);
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.name || !form.domain || !form.slug) {
      setError('Preencha todos os campos obrigatorios');
      return;
    }

    // Validate JSON for gateway credentials
    let gatewayCredentials = {};
    try {
      gatewayCredentials = JSON.parse(form.gateway_credentials);
    } catch {
      setError('Credenciais do gateway devem ser um JSON valido');
      return;
    }

    startTransition(async () => {
      const result = await updatePlatform(platformId, {
        name: form.name,
        slug: form.slug,
        domain: form.domain,
        site_description: form.site_description || null,
        ativo: form.ativo,
        logo_url: form.logo_url || null,
        favicon_url: form.favicon_url || null,
        color_primary: form.color_primary,
        color_primary_dark: form.color_primary_dark,
        color_background: form.color_background,
        color_surface: form.color_surface,
        color_accent_teal: form.color_accent_teal,
        color_accent_green: form.color_accent_green,
        color_text_primary: form.color_text_primary,
        social_whatsapp: form.social_whatsapp || null,
        social_instagram: form.social_instagram || null,
        social_telegram: form.social_telegram || null,
        active_gateway: form.active_gateway,
        gateway_credentials: gatewayCredentials,
        deposit_min: form.deposit_min,
        deposit_max: form.deposit_max,
        withdrawal_min: form.withdrawal_min,
        withdrawal_max: form.withdrawal_max,
        withdrawal_fee_percent: form.withdrawal_fee_percent,
        withdrawal_mode: form.withdrawal_mode,
        bet_min: form.bet_min,
        bet_max: form.bet_max,
        max_payout_per_bet: form.max_payout_per_bet,
        max_payout_daily: form.max_payout_daily,
        facebook_pixel_id: form.facebook_pixel_id || null,
        facebook_access_token: form.facebook_access_token || null,
        google_analytics_id: form.google_analytics_id || null,
        custom_head_scripts: form.custom_head_scripts || null,
        promotor_link: form.promotor_link || null,
        comissao_promotor_automatica: form.comissao_promotor_automatica,
        production_mode: form.production_mode,
      } as unknown as Parameters<typeof updatePlatform>[1]);

      if (result.success) {
        setSuccess(true);
        await loadData();
      } else {
        setError(result.error || 'Erro ao atualizar plataforma');
      }
    });
  }

  // Admin search
  async function handleAdminSearch(query: string) {
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

  // Link admin
  async function handleLinkAdmin() {
    if (!selectedUser) {
      return;
    }

    setAdminActionLoading('linking');
    const result = await linkAdminToPlatform(selectedUser.id, platformId);
    if (result.success) {
      await loadAdmins();
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
    } else {
      alert(result.error);
    }
    setAdminActionLoading(null);
  }

  // Unlink admin
  async function handleUnlinkAdmin(linkId: string) {
    if (!confirm('Tem certeza que deseja remover este admin?')) {
      return;
    }

    setAdminActionLoading(linkId);
    const result = await unlinkAdminFromPlatform(linkId);
    if (result.success) {
      await loadAdmins();
    } else {
      alert(result.error);
    }
    setAdminActionLoading(null);
  }

  // Generate random password
  function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Open password reset modal
  function openPasswordResetModal(admin: PlatformAdmin) {
    setPasswordResetAdmin(admin);
    setNewPassword(generatePassword());
    setPasswordCopied(false);
    setShowPasswordModal(true);
  }

  // Reset password
  async function handleResetPassword() {
    if (!passwordResetAdmin || !newPassword) return;

    setPasswordResetLoading(true);
    const result = await resetAdminPassword(passwordResetAdmin.user_id, newPassword);
    if (result.success) {
      alert('Senha alterada com sucesso! Copie a nova senha antes de fechar.');
    } else {
      alert(result.error || 'Erro ao redefinir senha');
    }
    setPasswordResetLoading(false);
  }

  // Copy password to clipboard
  async function copyPassword() {
    await navigator.clipboard.writeText(newPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Plataforma nao encontrada</p>
        <Link
          href="/admin-master/plataformas"
          className="text-purple-400 hover:text-purple-300 mt-4 inline-block"
        >
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin-master/plataformas"
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: form.color_primary }}
          >
            {form.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Plataforma</h1>
            <p className="text-zinc-400">{platform.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-zinc-900/50 border border-purple-800/20 rounded-xl p-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
          Plataforma atualizada com sucesso!
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <div className="bg-zinc-900/50 border border-purple-800/20 rounded-xl p-6">
          {/* Tab: Basic */}
          {activeTab === 'basico' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-400" />
                Informacoes Basicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="mt-1 text-xs text-zinc-500">Identificador unico da plataforma</p>
                </div>

                <div className="md:col-span-2">
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
                  <p className="mt-1 text-xs text-zinc-500">Dominio principal (sem https://)</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Descricao do Site
                  </label>
                  <textarea
                    name="site_description"
                    value={form.site_description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Descricao para SEO"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {platform.client_id && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Cliente Vinculado
                    </label>
                    <input
                      type="text"
                      value={platform.client_id}
                      disabled
                      className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ativo"
                      checked={form.ativo}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-zinc-900"
                    />
                    <span className="text-white">Plataforma Ativa</span>
                  </label>
                  <p className="mt-1 text-xs text-zinc-500 ml-8">Desativar bloqueia o acesso dos usuarios</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Visual */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-400" />
                Visual & Branding
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    URL do Favicon
                  </label>
                  <input
                    type="text"
                    name="favicon_url"
                    value={form.favicon_url}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-6">
                <h4 className="text-sm font-medium text-zinc-300 mb-4">Cores do Tema</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorInput
                    label="Cor Primaria"
                    name="color_primary"
                    value={form.color_primary}
                    onChange={handleChange}
                  />
                  <ColorInput
                    label="Primaria Dark"
                    name="color_primary_dark"
                    value={form.color_primary_dark}
                    onChange={handleChange}
                  />
                  <ColorInput
                    label="Fundo"
                    name="color_background"
                    value={form.color_background}
                    onChange={handleChange}
                  />
                  <ColorInput
                    label="Surface"
                    name="color_surface"
                    value={form.color_surface}
                    onChange={handleChange}
                  />
                  <ColorInput
                    label="Accent Teal"
                    name="color_accent_teal"
                    value={form.color_accent_teal}
                    onChange={handleChange}
                  />
                  <ColorInput
                    label="Accent Green"
                    name="color_accent_green"
                    value={form.color_accent_green}
                    onChange={handleChange}
                  />
                  <ColorInput
                    label="Texto"
                    name="color_text_primary"
                    value={form.color_text_primary}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="border-t border-zinc-800 pt-6">
                <h4 className="text-sm font-medium text-zinc-300 mb-4">Preview</h4>
                <div
                  className="p-6 rounded-xl border"
                  style={{
                    backgroundColor: form.color_background,
                    borderColor: form.color_primary,
                  }}
                >
                  <div
                    className="p-4 rounded-lg mb-4"
                    style={{ backgroundColor: form.color_surface }}
                  >
                    <p style={{ color: form.color_text_primary }}>
                      Texto exemplo na cor primaria de texto
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: form.color_primary }}
                    >
                      Botao Primario
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: form.color_accent_teal }}
                    >
                      Accent Teal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Social */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Share2 className="h-5 w-5 text-purple-400" />
                Redes Sociais
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    name="social_whatsapp"
                    value={form.social_whatsapp}
                    onChange={handleChange}
                    placeholder="https://wa.me/5511999999999"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    name="social_instagram"
                    value={form.social_instagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/suabanca"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Telegram
                  </label>
                  <input
                    type="text"
                    name="social_telegram"
                    value={form.social_telegram}
                    onChange={handleChange}
                    placeholder="https://t.me/suabanca"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Gateway */}
          {activeTab === 'gateway' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-400" />
                Gateway de Pagamento
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Modo de Saque
                  </label>
                  <select
                    name="withdrawal_mode"
                    value={form.withdrawal_mode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatico">Automatico</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Credenciais do Gateway (JSON)
                  </label>
                  <textarea
                    name="gateway_credentials"
                    value={form.gateway_credentials}
                    onChange={handleChange}
                    rows={6}
                    placeholder='{"client_id": "", "client_secret": "", "webhook_url": ""}'
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono text-sm resize-none"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Formato: {`{ "client_id": "...", "client_secret": "...", "webhook_url": "..." }`}
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-6">
                <h4 className="text-sm font-medium text-zinc-300 mb-4">Limites de Deposito</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Minimo (R$)
                    </label>
                    <input
                      type="number"
                      name="deposit_min"
                      value={form.deposit_min}
                      onChange={handleNumberChange}
                      step="0.01"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Maximo (R$)
                    </label>
                    <input
                      type="number"
                      name="deposit_max"
                      value={form.deposit_max}
                      onChange={handleNumberChange}
                      step="0.01"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-6">
                <h4 className="text-sm font-medium text-zinc-300 mb-4">Limites de Saque</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Minimo (R$)
                    </label>
                    <input
                      type="number"
                      name="withdrawal_min"
                      value={form.withdrawal_min}
                      onChange={handleNumberChange}
                      step="0.01"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Maximo (R$)
                    </label>
                    <input
                      type="number"
                      name="withdrawal_max"
                      value={form.withdrawal_max}
                      onChange={handleNumberChange}
                      step="0.01"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Taxa (%)
                    </label>
                    <input
                      type="number"
                      name="withdrawal_fee_percent"
                      value={form.withdrawal_fee_percent}
                      onChange={handleNumberChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Apostas */}
          {activeTab === 'apostas' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-400" />
                Limites de Apostas
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Aposta Minima (R$)
                  </label>
                  <input
                    type="number"
                    name="bet_min"
                    value={form.bet_min}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Aposta Maxima (R$)
                  </label>
                  <input
                    type="number"
                    name="bet_max"
                    value={form.bet_max}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Premio Max/Aposta (R$)
                  </label>
                  <input
                    type="number"
                    name="max_payout_per_bet"
                    value={form.max_payout_per_bet}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Premio Max/Dia (R$)
                  </label>
                  <input
                    type="number"
                    name="max_payout_daily"
                    value={form.max_payout_daily}
                    onChange={handleNumberChange}
                    step="0.01"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Marketing */}
          {activeTab === 'marketing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Marketing & Analytics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    name="facebook_pixel_id"
                    value={form.facebook_pixel_id}
                    onChange={handleChange}
                    placeholder="123456789012345"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Facebook Access Token
                  </label>
                  <input
                    type="text"
                    name="facebook_access_token"
                    value={form.facebook_access_token}
                    onChange={handleChange}
                    placeholder="EAAxxxxxxx..."
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    name="google_analytics_id"
                    value={form.google_analytics_id}
                    onChange={handleChange}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Scripts Customizados (Head)
                  </label>
                  <textarea
                    name="custom_head_scripts"
                    value={form.custom_head_scripts}
                    onChange={handleChange}
                    rows={6}
                    placeholder="<script>...</script>"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono text-sm resize-none"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Scripts adicionais inseridos no head do HTML
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Promotores */}
          {activeTab === 'promotores' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-purple-400" />
                Promotores
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Link do Promotor (WhatsApp Externo)
                  </label>
                  <input
                    type="text"
                    name="promotor_link"
                    value={form.promotor_link}
                    onChange={handleChange}
                    placeholder="https://wa.me/5511999999999"
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Se preenchido, o botao &quot;Promotor&quot; na home abre este link
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="comissao_promotor_automatica"
                      checked={form.comissao_promotor_automatica}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-zinc-900"
                    />
                    <span className="text-white">Comissao Automatica</span>
                  </label>
                  <p className="mt-1 text-xs text-zinc-500 ml-8">
                    Credita comissao automaticamente ao confirmar deposito
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Admins */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Administradores da Banca
              </h3>

              {/* Search / Add Admin */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Buscar usuario para adicionar como admin
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleAdminSearch(e.target.value)}
                      placeholder="Digite nome ou CPF..."
                      className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-purple-400" />
                    )}
                  </div>
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={handleLinkAdmin}
                      disabled={adminActionLoading === 'linking'}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {adminActionLoading === 'linking' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Adicionar
                    </button>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && !selectedUser && (
                  <div className="mt-2 bg-zinc-900 border border-zinc-700 rounded-lg divide-y divide-zinc-800 max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-zinc-800 transition-colors"
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
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Admin List */}
              <div className="space-y-3">
                {loadingAdmins ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-center py-8 bg-zinc-800/30 rounded-lg border border-dashed border-zinc-700">
                    <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400 mb-2">Nenhum admin vinculado</p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      O dono da banca precisa criar uma conta em /cadastro da banca, depois voce vincula ele aqui como admin.
                    </p>
                  </div>
                ) : (
                  admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                          <UserCircle className="h-8 w-8 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-lg">{admin.user_name}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-zinc-500 w-16">CPF:</span>
                              <span className="text-zinc-300 font-mono">{admin.user_cpf || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-zinc-500" />
                              <span className="text-zinc-300">{admin.user_email || 'N/A'}</span>
                            </div>
                            <p className="text-xs text-zinc-600 mt-2">
                              Vinculado em {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => openPasswordResetModal(admin)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-sm transition-colors"
                            title="Redefinir Senha"
                          >
                            <Key className="h-4 w-4" />
                            Senha
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnlinkAdmin(admin.id)}
                            disabled={adminActionLoading === admin.id}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/30 rounded-lg text-zinc-400 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
                          >
                            {adminActionLoading === admin.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: Avancado */}
          {activeTab === 'avancado' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-400" />
                Configuracoes Avancadas
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="production_mode"
                      checked={form.production_mode}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-600 focus:ring-amber-500 focus:ring-offset-zinc-900"
                    />
                    <span className="text-white font-medium">Modo Producao</span>
                  </label>
                  <p className="mt-2 text-sm text-amber-200/70 ml-8">
                    Quando ativado, protege o saldo dos usuarios e bloqueia alteracoes via cliente.
                    Ative apenas quando a banca estiver pronta para operar.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions - only show for non-admin tabs */}
        {activeTab !== 'admins' && (
          <div className="flex items-center justify-end gap-3 mt-6">
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
              Salvar Alteracoes
            </button>
          </div>
        )}
      </form>

      {/* Password Reset Modal */}
      {showPasswordModal && passwordResetAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-purple-800/30 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                Redefinir Senha
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-sm text-zinc-400">Redefinindo senha para:</p>
                <p className="text-white font-medium">{passwordResetAdmin.user_name}</p>
                <p className="text-sm text-zinc-500">{passwordResetAdmin.user_email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Nova Senha
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={copyPassword}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      passwordCopied
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white'
                    }`}
                    title="Copiar"
                  >
                    {passwordCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generatePassword())}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    title="Gerar Nova"
                  >
                    <Key className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-amber-200 text-sm">
                  Copie a senha antes de aplicar! Ela nao sera exibida novamente.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={passwordResetLoading || !newPassword}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {passwordResetLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Aplicar Nova Senha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Color input component
function ColorInput({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          name={name}
          value={value}
          onChange={onChange}
          className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) =>
            onChange({
              target: { name, value: e.target.value },
            } as React.ChangeEvent<HTMLInputElement>)
          }
          className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-xs font-mono focus:outline-none focus:border-purple-500"
        />
      </div>
    </div>
  );
}
