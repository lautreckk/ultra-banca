'use client';

import dynamic from 'next/dynamic';
import { ConfigPageWrapper, useConfig } from '@/components/admin/config/config-page-wrapper';
import { Input } from '@/components/ui/input';
import { Megaphone } from 'lucide-react';

const WhatsAppLinkGenerator = dynamic(
  () => import('@/components/admin/whatsapp-link-generator').then((mod) => ({ default: mod.WhatsAppLinkGenerator })),
  {
    loading: () => <div className="h-32 bg-zinc-700/50 rounded-lg animate-pulse" />,
  }
);

function MarketingContent() {
  const { config, updateField } = useConfig();

  return (
    <div className="space-y-6">
      {/* Tracking */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Tracking & Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Facebook Pixel ID
            </label>
            <Input
              type="text"
              value={config.facebook_pixel_id || ''}
              onChange={(e) => updateField('facebook_pixel_id', e.target.value || null)}
              className="bg-zinc-900 border-zinc-700 text-white"
              placeholder="123456789012345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Google Analytics ID
            </label>
            <Input
              type="text"
              value={config.google_analytics_id || ''}
              onChange={(e) => updateField('google_analytics_id', e.target.value || null)}
              className="bg-zinc-900 border-zinc-700 text-white"
              placeholder="G-XXXXXXXXXX"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Facebook Access Token (CAPI)
          </label>
          <Input
            type="password"
            value={config.facebook_access_token || ''}
            onChange={(e) => updateField('facebook_access_token', e.target.value || null)}
            className="bg-zinc-900 border-zinc-700 text-white"
            placeholder="EAAxxxxxxx..."
          />
          <p className="text-xs text-zinc-500 mt-1">
            Token para Conversions API - obtenha no Meta Business Manager
          </p>
        </div>
      </div>

      {/* Redes Sociais */}
      <div className="border-t border-zinc-700 pt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Redes Sociais</h3>
        <div className="space-y-4">
          <WhatsAppLinkGenerator
            label="Link do Promotor (WhatsApp)"
            value={config.promotor_link}
            onChange={(value) => updateField('promotor_link', value)}
            description="Se preenchido, ao clicar em 'Promotor' na tela inicial, abre este link em nova aba"
          />

          <WhatsAppLinkGenerator
            label="WhatsApp de Suporte"
            value={config.social_whatsapp}
            onChange={(value) => updateField('social_whatsapp', value)}
            description="Link de contato exibido no rodapé e outras áreas do site"
          />

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Instagram (link completo)
            </label>
            <Input
              type="text"
              value={config.social_instagram || ''}
              onChange={(e) => updateField('social_instagram', e.target.value || null)}
              className="bg-zinc-900 border-zinc-700 text-white"
              placeholder="https://instagram.com/suabanca"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Telegram (link completo)
            </label>
            <Input
              type="text"
              value={config.social_telegram || ''}
              onChange={(e) => updateField('social_telegram', e.target.value || null)}
              className="bg-zinc-900 border-zinc-700 text-white"
              placeholder="https://t.me/suabanca"
            />
          </div>
        </div>
      </div>

      {/* Custom Scripts */}
      <div className="border-t border-zinc-700 pt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Scripts Personalizados</h3>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Scripts para o &lt;head&gt;
          </label>
          <textarea
            value={config.custom_head_scripts || ''}
            onChange={(e) => updateField('custom_head_scripts', e.target.value || null)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-md font-mono text-sm"
            rows={4}
            placeholder="<!-- Seu código aqui -->"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Código JavaScript ou HTML para ser inserido no &lt;head&gt; de todas as páginas
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfigMarketingPage() {
  return (
    <ConfigPageWrapper
      title="Marketing & Redes Sociais"
      description="Tracking e links de contato"
      icon={<Megaphone className="h-5 w-5 md:h-6 md:w-6 text-orange-400" />}
      iconColor="bg-orange-500/20"
    >
      <MarketingContent />
    </ConfigPageWrapper>
  );
}
