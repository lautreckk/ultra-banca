'use client';

import { useState, useEffect, useTransition } from 'react';
import { Settings, Save, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { getEvolutionConfig, saveEvolutionConfig, testEvolutionConnection } from '@/lib/admin/actions/evolution';

export default function WhatsAppConfigPage() {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getEvolutionConfig();
        if (config) {
          setBaseUrl(config.base_url);
          setApiKey(config.global_apikey);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, []);

  const handleSave = () => {
    if (!baseUrl || !apiKey) {
      setSaveResult({ success: false, message: 'Preencha todos os campos' });
      return;
    }

    startTransition(async () => {
      setSaveResult(null);
      const result = await saveEvolutionConfig(baseUrl, apiKey);

      if (result.success) {
        setSaveResult({ success: true, message: 'Configuração salva com sucesso!' });
      } else {
        setSaveResult({ success: false, message: result.error || 'Erro ao salvar' });
      }
    });
  };

  const handleTest = () => {
    startTransition(async () => {
      setTestResult(null);
      const result = await testEvolutionConnection();

      if (result.success) {
        setTestResult({ success: true, message: 'Conexão estabelecida com sucesso!' });
      } else {
        setTestResult({ success: false, message: result.error || 'Erro ao conectar' });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configuração da Evolution API</h1>
        <p className="text-zinc-400">Configure a conexão com sua instância da Evolution API</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
          <ExternalLink className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-medium text-blue-400">Evolution API</h3>
          <p className="text-sm text-zinc-400 mt-1">
            A Evolution API é uma API REST para WhatsApp. Você precisa ter uma instância rodando
            para usar esta integração.
          </p>
          <a
            href="https://doc.evolution-api.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2"
          >
            Documentação oficial
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            URL Base da API
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://evolution.seudominio.com"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
          />
          <p className="text-xs text-zinc-500 mt-1">
            URL onde sua Evolution API está hospedada (sem barra no final)
          </p>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Global API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Sua API Key global"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
          />
          <p className="text-xs text-zinc-500 mt-1">
            A Global API Key configurada na sua Evolution API
          </p>
        </div>

        {/* Results */}
        {saveResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            saveResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {saveResult.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {saveResult.message}
          </div>
        )}

        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            testResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {testResult.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {testResult.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={handleTest}
            disabled={isPending || !baseUrl || !apiKey}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            Testar Conexão
          </button>

          <button
            onClick={handleSave}
            disabled={isPending || !baseUrl || !apiKey}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
}
