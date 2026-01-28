'use client';

import { useState } from 'react';
import { GatewayConfigForm } from '@/components/admin/gateway';
import { Copy, CheckCircle, ExternalLink } from 'lucide-react';

export default function BSPayConfigPage() {
  const [copied, setCopied] = useState(false);

  // URL do webhook - usando a URL pública do Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const webhookUrl = `${supabaseUrl}/functions/v1/bspay-webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Webhook Info Card */}
      <div className="max-w-2xl bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-700/50 rounded-lg p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <ExternalLink className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-1">
              URL do Webhook (configure no painel BSPay)
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Copie esta URL e configure no painel do BSPay para receber notificações de pagamento.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-800 rounded text-sm text-cyan-300 font-mono overflow-x-auto">
                {webhookUrl}
              </code>
              <button
                onClick={handleCopyWebhook}
                className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                title="Copiar URL"
              >
                {copied ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <GatewayConfigForm
        gatewayName="bspay"
        displayName="BSPay"
        description="Configurações do gateway de pagamento BSPay"
        fields={[
          { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Digite o Client ID' },
          { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Digite o Client Secret' },
        ]}
        infoItems={[
          'O gateway BSPay permite receber pagamentos via PIX de forma instantânea.',
          'Configure as credenciais obtidas no painel do BSPay.',
          'Lembre-se de configurar o Webhook URL acima no painel do BSPay.',
        ]}
      />
    </div>
  );
}
