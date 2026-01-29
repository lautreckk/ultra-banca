'use client';

import { useState, useEffect } from 'react';
import { getGatewayConfig, updateGatewayConfig } from '@/lib/admin/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/admin/shared';
import { Save, Eye, EyeOff, CreditCard, CheckCircle, AlertCircle, Loader2, ArrowLeft, ExternalLink, Copy } from 'lucide-react';
import Link from 'next/link';

export default function WashPayConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [config, setConfig] = useState({
    ativo: false,
    api_key: '',
    base_url: 'https://washpay.com.br',
  });

  // URL do webhook
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const webhookUrl = `${supabaseUrl}/functions/v1/washpay-webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const data = await getGatewayConfig('washpay');
        if (data) {
          setConfig({
            ativo: data.ativo,
            api_key: data.client_id || '', // WashPay usa apenas API Key (pk_...)
            base_url: (data.config?.base_url as string) || 'https://washpay.com.br',
          });
        }
      } catch (err) {
        console.error('Error fetching gateway config:', err);
        setError('Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const result = await updateGatewayConfig('washpay', {
        ativo: config.ativo,
        client_id: config.api_key, // WashPay usa apenas API Key (pk_...)
        client_secret: null, // WashPay não usa secret key
        config: {
          base_url: config.base_url,
          sandbox: false,
        },
      });

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(result.error || 'Erro ao salvar configurações');
      }
    } catch {
      setError('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl">
      {/* Back Button */}
      <Link
        href="/admin/pagamentos"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Pagamentos
      </Link>

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">WashPay</h1>
        <p className="text-sm md:text-base text-gray-400">Gateway E-commerce com Direct Checkout</p>
      </div>

      {/* Webhook Info Card */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-700/50 rounded-lg p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <ExternalLink className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white mb-1">
              URL do Webhook (configure no painel WashPay)
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Copie esta URL e configure no painel da WashPay para receber notificações de pagamento.
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

      {/* Status Card */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`p-2 md:p-3 rounded-lg ${config.ativo ? 'bg-green-500/20' : 'bg-gray-600'}`}>
              <CreditCard className={`h-5 w-5 md:h-6 md:w-6 ${config.ativo ? 'text-green-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">Status do Gateway</h2>
              <p className={`text-sm ${config.ativo ? 'text-green-400' : 'text-gray-400'}`}>
                {config.ativo ? 'Ativado' : 'Desativado'}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={config.ativo}
            onChange={(checked) => setConfig({ ...config, ativo: checked })}
            size="lg"
          />
        </div>
      </div>

      {/* Config Form */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
        <h2 className="text-base md:text-lg font-semibold text-white">Credenciais</h2>

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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">API Key (pk_...)</label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={config.api_key}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="bg-gray-700 border-gray-600 text-white pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              API Key obtida no painel da WashPay (mantenha segura, não compartilhe!)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Base URL da API</label>
            <Input
              type="url"
              value={config.base_url}
              onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
              placeholder="https://washpay.com.br"
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use a URL padrão ou configure o Host Configurado do seu painel WashPay
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-white mb-3">Como funciona</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">1.</span>
            <span>WashPay usa o modelo de <strong className="text-white">Direct Checkout</strong> - cria produto, link e PIX automaticamente.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">2.</span>
            <span>Quando o usuário solicita depósito, chamamos <code className="bg-gray-800 px-1 rounded">/api/user/direct-checkout</code>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">3.</span>
            <span>A WashPay retorna o PIX Copia e Cola + QR Code direto na resposta.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">4.</span>
            <span>O webhook recebe a confirmação com <code className="bg-gray-800 px-1 rounded">orderId</code> quando o pagamento for confirmado.</span>
          </li>
        </ul>
      </div>

      {/* Documentation Link */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-white">Documentação</h2>
            <p className="text-sm text-gray-400">Acesse a documentação oficial da WashPay</p>
          </div>
          <a
            href="https://washpay.com.br/dashboard/api"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
          >
            Abrir Painel WashPay
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="teal" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
