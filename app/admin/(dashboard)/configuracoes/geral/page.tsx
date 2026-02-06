'use client';

import dynamic from 'next/dynamic';
import { ConfigPageWrapper, useConfig } from '@/components/admin/config/config-page-wrapper';
import { Input } from '@/components/ui/input';
import { Palette } from 'lucide-react';

const ImageUpload = dynamic(
  () => import('@/components/admin/image-upload').then((mod) => ({ default: mod.ImageUpload })),
  {
    loading: () => <div className="h-40 bg-zinc-700/50 rounded-lg animate-pulse" />,
  }
);

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
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-zinc-700"
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
          className="w-24 bg-zinc-900 border-zinc-700 text-white text-sm"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function GeralContent() {
  const { config, updateField } = useConfig();

  return (
    <div className="space-y-6">
      {/* Identidade */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Nome do Site
          </label>
          <Input
            type="text"
            value={config.site_name}
            onChange={(e) => updateField('site_name', e.target.value)}
            className="bg-zinc-900 border-zinc-700 text-white"
            placeholder="Banca Forte"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Descrição
          </label>
          <textarea
            value={config.site_description}
            onChange={(e) => updateField('site_description', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-md"
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

        <div>
          <ImageUpload
            label="Fundo da Tela de Login"
            value={config.login_bg_url || ''}
            onChange={(url) => updateField('login_bg_url', url)}
            recommendedSize="1080x1920px (formato celular, WebP ou JPEG)"
            accept="image/webp,image/jpeg"
            folder="branding"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Tamanho recomendado: 1080x1920px (9:16, otimizado para celular). Use formato WebP ou JPEG para
            manter o carregamento rápido. Máximo 2MB. A imagem será exibida como fundo nas telas de login e cadastro.
          </p>
        </div>
      </div>

      {/* Cores */}
      <div className="border-t border-zinc-700 pt-6">
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
  );
}

export default function ConfigGeralPage() {
  return (
    <ConfigPageWrapper
      title="Identidade Visual"
      description="Nome, logo e cores da plataforma"
      icon={<Palette className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />}
      iconColor="bg-cyan-500/20"
    >
      <GeralContent />
    </ConfigPageWrapper>
  );
}
