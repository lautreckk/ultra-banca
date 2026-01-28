'use client';

import { useState, useEffect } from 'react';
import { getGatewayConfig, updateGatewayConfig } from '@/lib/admin/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/admin/shared';
import { Save, Eye, EyeOff, CreditCard, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface GatewayConfigFormProps {
  gatewayName: string;
  displayName: string;
  description: string;
  fields?: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'textarea';
    placeholder?: string;
    helpText?: string;
    configKey?: boolean; // If true, store in config JSON instead of top-level
  }[];
  infoItems?: string[];
}

export function GatewayConfigForm({
  gatewayName,
  displayName,
  description,
  fields = [
    { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Digite o Client ID' },
    { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Digite o Client Secret' },
    { key: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://seu-dominio.com/api/webhooks/' + gatewayName },
  ],
  infoItems = [
    `O gateway ${displayName} permite receber pagamentos via PIX de forma instantânea.`,
    `Configure as credenciais obtidas no painel do ${displayName}.`,
    'O Webhook URL deve ser configurado no painel do gateway para receber notificações.',
  ],
}: GatewayConfigFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const [ativo, setAtivo] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [configData, setConfigData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const data = await getGatewayConfig(gatewayName);
        if (data) {
          setAtivo(data.ativo);

          // Set form data from top-level fields
          const newFormData: Record<string, string> = {};
          fields.forEach(field => {
            if (!field.configKey) {
              const dataRecord = data as unknown as Record<string, unknown>;
              newFormData[field.key] = (dataRecord[field.key] as string) || '';
            } else {
              newFormData[field.key] = (data.config?.[field.key] as string) || '';
            }
          });
          setFormData(newFormData);
          setConfigData(data.config || {});
        }
      } catch (err) {
        console.error('Error fetching gateway config:', err);
        setError('Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [gatewayName, fields]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      // Separate top-level and config fields
      const updatePayload: {
        ativo: boolean;
        client_id?: string;
        client_secret?: string;
        webhook_url?: string;
        config?: Record<string, unknown>;
      } = { ativo };

      const newConfig = { ...configData };

      fields.forEach(field => {
        if (field.configKey) {
          newConfig[field.key] = formData[field.key];
        } else if (field.key === 'client_id') {
          updatePayload.client_id = formData[field.key];
        } else if (field.key === 'client_secret') {
          updatePayload.client_secret = formData[field.key];
        } else if (field.key === 'webhook_url') {
          updatePayload.webhook_url = formData[field.key];
        }
      });

      updatePayload.config = newConfig;

      const result = await updateGatewayConfig(gatewayName, updatePayload);

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

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
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
        <h1 className="text-xl md:text-2xl font-bold text-white">{displayName}</h1>
        <p className="text-sm md:text-base text-gray-400">{description}</p>
      </div>

      {/* Status Card */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`p-2 md:p-3 rounded-lg ${ativo ? 'bg-green-500/20' : 'bg-gray-600'}`}>
              <CreditCard className={`h-5 w-5 md:h-6 md:w-6 ${ativo ? 'text-green-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">Status do Gateway</h2>
              <p className={`text-sm ${ativo ? 'text-green-400' : 'text-gray-400'}`}>
                {ativo ? 'Ativado' : 'Desativado'}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={ativo}
            onChange={setAtivo}
            size="lg"
          />
        </div>
      </div>

      {/* Config Form */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
        <h2 className="text-base md:text-lg font-semibold text-white">Credenciais</h2>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Success */}
        {saveSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">Configurações salvas com sucesso!</span>
          </div>
        )}

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              ) : field.type === 'password' ? (
                <div className="relative">
                  <Input
                    type={showSecrets[field.key] ? 'text' : 'password'}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="bg-gray-700 border-gray-600 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowSecret(field.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              ) : (
                <Input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              )}
              {field.helpText && (
                <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-white mb-3">Informações</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          {infoItems.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
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
