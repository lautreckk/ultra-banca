'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getPlatformConfig, updatePlatformConfig } from '@/lib/admin/actions/platform-config';
import { PlatformConfig } from '@/contexts/platform-config-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/admin/shared';
import {
  Palette,
  DollarSign,
  Target,
  Megaphone,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// DYNAMIC IMPORTS - Lazy load componentes pesados
// Reduz o bundle inicial e melhora TBT (Total Blocking Time)
// ============================================================================

// MFASetup: Contém lógica de QR Code (~50KB) - só carrega quando aba Segurança é aberta
const MFASetup = dynamic(
  () => import('@/components/admin/security/mfa-setup').then((mod) => ({ default: mod.MFASetup })),
  {
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-zinc-700/50 rounded-lg" />
        <div className="h-12 bg-zinc-700/50 rounded-lg" />
      </div>
    ),
    ssr: false, // MFA usa APIs do browser (clipboard, etc)
  }
);

// ImageUpload: Componente de upload de imagem - só carrega na aba Geral
const ImageUpload = dynamic(
  () => import('@/components/admin/image-upload').then((mod) => ({ default: mod.ImageUpload })),
  {
    loading: () => (
      <div className="h-40 bg-zinc-700/50 rounded-lg animate-pulse" />
    ),
  }
);

type TabId = 'geral' | 'financeiro' | 'apostas' | 'marketing' | 'seguranca';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: 'geral', label: 'Geral', icon: <Palette className="h-4 w-4" /> },
  { id: 'financeiro', label: 'Financeiro', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'apostas', label: 'Apostas', icon: <Target className="h-4 w-4" /> },
  { id: 'marketing', label: 'Marketing', icon: <Megaphone className="h-4 w-4" /> },
  { id: 'seguranca', label: 'Segurança', icon: <Shield className="h-4 w-4" /> },
];

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-gray-600"
          style={{ backgroundColor: value }}
        />
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 p-0 border-0 bg-transparent cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 bg-gray-700 border-gray-600 text-white text-sm"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export default function AdminConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('geral');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<PlatformConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const data = await getPlatformConfig();
        setConfig(data);
      } catch (err) {
        console.error('Error fetching config:', err);
        setError('Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setError('');

    try {
      const result = await updatePlatformConfig(config);

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(result.error || 'Erro ao salvar configuração');
      }
    } catch {
      setError('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = <K extends keyof PlatformConfig>(
    key: K,
    value: PlatformConfig[K]
  ) => {
    if (config) {
      setConfig({ ...config, [key]: value });
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Configurações da Plataforma</h1>
          <p className="text-sm md:text-base text-gray-400">
            Personalize 100% da sua banca white-label
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-1 bg-[#1f2937] rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        {/* Tab: Geral */}
        {activeTab === 'geral' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 md:p-3 rounded-lg bg-cyan-500/20">
                <Palette className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white">
                  Identidade Visual
                </h2>
                <p className="text-xs md:text-sm text-gray-400">
                  Nome, logo e cores da plataforma
                </p>
              </div>
            </div>

            {/* Identidade */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome do Site
                </label>
                <Input
                  type="text"
                  value={config.site_name}
                  onChange={(e) => updateField('site_name', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Banca Forte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={config.site_description}
                  onChange={(e) => updateField('site_description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
                  rows={2}
                  placeholder="Sua banca de apostas online"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUpload
                  label="Logo"
                  value={config.logo_url}
                  onChange={(url) => updateField('logo_url', url)}
                  recommendedSize="400x100px (PNG transparente)"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  folder="branding"
                />

                <ImageUpload
                  label="Favicon"
                  value={config.favicon_url}
                  onChange={(url) => updateField('favicon_url', url)}
                  recommendedSize="32x32px ou 64x64px (PNG/ICO)"
                  accept="image/png,image/x-icon,image/svg+xml"
                  folder="branding"
                />
              </div>
            </div>

            {/* Cores */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-sm font-semibold text-white mb-4">Paleta de Cores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Cor Primária"
                  value={config.color_primary}
                  onChange={(v) => updateField('color_primary', v)}
                />
                <ColorPicker
                  label="Cor Primária (Dark)"
                  value={config.color_primary_dark}
                  onChange={(v) => updateField('color_primary_dark', v)}
                />
                <ColorPicker
                  label="Fundo"
                  value={config.color_background}
                  onChange={(v) => updateField('color_background', v)}
                />
                <ColorPicker
                  label="Surface"
                  value={config.color_surface}
                  onChange={(v) => updateField('color_surface', v)}
                />
                <ColorPicker
                  label="Accent Teal"
                  value={config.color_accent_teal}
                  onChange={(v) => updateField('color_accent_teal', v)}
                />
                <ColorPicker
                  label="Accent Green"
                  value={config.color_accent_green}
                  onChange={(v) => updateField('color_accent_green', v)}
                />
                <ColorPicker
                  label="Texto Primário"
                  value={config.color_text_primary}
                  onChange={(v) => updateField('color_text_primary', v)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Financeiro */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 md:p-3 rounded-lg bg-green-500/20">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white">
                  Configurações Financeiras
                </h2>
                <p className="text-xs md:text-sm text-gray-400">
                  Gateway, limites de depósito e saque
                </p>
              </div>
            </div>

            {/* Gateway */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gateway de Pagamento Ativo
              </label>
              <select
                value={config.active_gateway}
                onChange={(e) => updateField('active_gateway', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
              >
                <option value="bspay">BSPay</option>
                <option value="washpay">WashPay</option>
              </select>
              <Link
                href="/admin/pagamentos"
                className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 mt-2"
              >
                Configurar credenciais do gateway <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Depósitos */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Depósitos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Valor Mínimo (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.deposit_min}
                    onChange={(e) => updateField('deposit_min', Number(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Valor Máximo (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.deposit_max}
                    onChange={(e) => updateField('deposit_max', Number(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Saques */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-sm font-semibold text-white mb-3">Saques</h3>

              <div className="flex items-center justify-between p-3 md:p-4 bg-gray-800/50 rounded-lg mb-4">
                <div>
                  <p className="font-medium text-white text-sm md:text-base">
                    Modo de Processamento
                  </p>
                  <p className="text-xs md:text-sm text-gray-400">
                    {config.withdrawal_mode === 'automatic'
                      ? 'Saques são processados automaticamente via gateway'
                      : 'Saques devem ser processados manualmente pelo admin'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Manual</span>
                  <ToggleSwitch
                    checked={config.withdrawal_mode === 'automatic'}
                    onChange={(checked) =>
                      updateField('withdrawal_mode', checked ? 'automatic' : 'manual')
                    }
                  />
                  <span className="text-sm text-gray-400">Auto</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Valor Mínimo (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.withdrawal_min}
                    onChange={(e) => updateField('withdrawal_min', Number(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Valor Máximo (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.withdrawal_max}
                    onChange={(e) => updateField('withdrawal_max', Number(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Taxa (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.withdrawal_fee_percent}
                    onChange={(e) =>
                      updateField('withdrawal_fee_percent', Number(e.target.value))
                    }
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Apostas */}
        {activeTab === 'apostas' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 md:p-3 rounded-lg bg-purple-500/20">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white">
                  Limites de Apostas
                </h2>
                <p className="text-xs md:text-sm text-gray-400">
                  Valores mínimos, máximos e limites de risco
                </p>
              </div>
            </div>

            {/* Valores de Aposta */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Valores por Aposta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Aposta Mínima (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.bet_min}
                    onChange={(e) => updateField('bet_min', Number(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Aposta Máxima (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.bet_max}
                    onChange={(e) => updateField('bet_max', Number(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Limites de Risco */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-sm font-semibold text-white mb-3">Limites de Risco</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Prêmio Máximo por Aposta (R$)
                  </label>
                  <Input
                    type="number"
                    step="100"
                    value={config.max_payout_per_bet}
                    onChange={(e) => updateField('max_payout_per_bet', Number(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Limite máximo que um apostador pode ganhar em uma única aposta
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Prêmio Máximo Diário (R$)
                  </label>
                  <Input
                    type="number"
                    step="100"
                    value={config.max_payout_daily}
                    onChange={(e) => updateField('max_payout_daily', Number(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Limite máximo de pagamentos por dia
                  </p>
                </div>
              </div>
            </div>

            {/* Link para Modalidades */}
            <div className="border-t border-gray-600 pt-6">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-2">
                  Configurar Modalidades
                </h3>
                <p className="text-xs md:text-sm text-gray-400 mb-3">
                  Configure os multiplicadores e posições de cada modalidade de aposta
                </p>
                <Link
                  href="/admin/modalidades"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Configurar Modalidades
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Marketing */}
        {activeTab === 'marketing' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 md:p-3 rounded-lg bg-orange-500/20">
                <Megaphone className="h-5 w-5 md:h-6 md:w-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white">
                  Marketing & Redes Sociais
                </h2>
                <p className="text-xs md:text-sm text-gray-400">
                  Tracking e links de contato
                </p>
              </div>
            </div>

            {/* Tracking */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Tracking & Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Facebook Pixel ID
                  </label>
                  <Input
                    type="text"
                    value={config.facebook_pixel_id || ''}
                    onChange={(e) => updateField('facebook_pixel_id', e.target.value || null)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="123456789012345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Google Analytics ID
                  </label>
                  <Input
                    type="text"
                    value={config.google_analytics_id || ''}
                    onChange={(e) => updateField('google_analytics_id', e.target.value || null)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Facebook Access Token (CAPI)
                </label>
                <Input
                  type="password"
                  value={config.facebook_access_token || ''}
                  onChange={(e) => updateField('facebook_access_token', e.target.value || null)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="EAAxxxxxxx..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Token para Conversions API - obtenha no Meta Business Manager
                </p>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-sm font-semibold text-white mb-3">Redes Sociais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Link do Promotor (WhatsApp)
                  </label>
                  <Input
                    type="text"
                    value={config.promotor_link || ''}
                    onChange={(e) => updateField('promotor_link', e.target.value || null)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="https://wa.me/5511999999999"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se preenchido, ao clicar em &quot;Promotor&quot; na tela inicial, abre este link em nova aba
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    WhatsApp (link completo)
                  </label>
                  <Input
                    type="text"
                    value={config.social_whatsapp || ''}
                    onChange={(e) => updateField('social_whatsapp', e.target.value || null)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="https://wa.me/5511999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Instagram (link completo)
                  </label>
                  <Input
                    type="text"
                    value={config.social_instagram || ''}
                    onChange={(e) => updateField('social_instagram', e.target.value || null)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="https://instagram.com/suabanca"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Telegram (link completo)
                  </label>
                  <Input
                    type="text"
                    value={config.social_telegram || ''}
                    onChange={(e) => updateField('social_telegram', e.target.value || null)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="https://t.me/suabanca"
                  />
                </div>
              </div>
            </div>

            {/* Custom Scripts */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-sm font-semibold text-white mb-3">Scripts Personalizados</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Scripts para o &lt;head&gt;
                </label>
                <textarea
                  value={config.custom_head_scripts || ''}
                  onChange={(e) => updateField('custom_head_scripts', e.target.value || null)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md font-mono text-sm"
                  rows={4}
                  placeholder="<!-- Seu código aqui -->"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código JavaScript ou HTML para ser inserido no &lt;head&gt; de todas as páginas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Segurança */}
        {activeTab === 'seguranca' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 md:p-3 rounded-lg bg-amber-500/20">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-white">
                  Segurança da Conta
                </h2>
                <p className="text-xs md:text-sm text-gray-400">
                  Autenticação de dois fatores e proteção adicional
                </p>
              </div>
            </div>

            {/* Modo Produção */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Banca em Produção?</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {config.production_mode
                      ? 'Proteções de segurança ativadas. Alterações de saldo só são permitidas via funções oficiais (Edge Functions).'
                      : 'Modo desenvolvimento. Permite alterações de saldo via cliente para testes.'}
                  </p>
                </div>
                <ToggleSwitch
                  checked={config.production_mode}
                  onChange={(checked) => updateField('production_mode', checked)}
                  size="lg"
                />
              </div>
              {!config.production_mode && (
                <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs">
                  ⚠️ Atenção: Com o modo produção desligado, usuários podem manipular saldo. Ative antes de ir ao ar!
                </div>
              )}
            </div>

            {/* MFA Setup Component */}
            <MFASetup />

            {/* Informações de Segurança */}
            <div className="bg-gray-800/50 rounded-lg p-4 mt-6">
              <h3 className="text-sm font-semibold text-white mb-3">Dicas de Segurança</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Use uma senha forte com pelo menos 12 caracteres</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Ative a autenticação de dois fatores (2FA)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Não compartilhe suas credenciais com terceiros</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Sempre faça logout ao usar computadores públicos</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
