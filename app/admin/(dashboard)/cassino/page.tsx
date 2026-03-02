'use client';

import { useState, useEffect } from 'react';
import {
  getPlayfiverConfig,
  savePlayfiverConfig,
  testPlayfiverConnection,
  refreshGamesCacheAdmin,
  getServerIP,
  type PlayfiverConfig,
} from '@/lib/admin/actions/casino';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/admin/shared';
import { Loader2, CheckCircle, XCircle, RefreshCw, Wifi, Globe } from 'lucide-react';

const CALLBACK_URL = 'https://mumlcoyjevyvsipicjjk.supabase.co/functions/v1/playfiver-callback';

export default function AdminCassinoConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [refreshResult, setRefreshResult] = useState<{ success: boolean; message: string } | null>(null);
  const [serverIP, setServerIP] = useState<string | null>(null);
  const [loadingIP, setLoadingIP] = useState(false);

  const [formData, setFormData] = useState({
    agent_token: '',
    secret_key: '',
    callback_url: CALLBACK_URL,
    ativo: false,
    default_rtp: 96,
    limit_enable: false,
    limit_amount: 0,
    limit_hours: 24,
    bonus_enable: false,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    const result = await getPlayfiverConfig();
    if (result.success && result.config) {
      setFormData({
        agent_token: result.config.agent_token,
        secret_key: result.config.secret_key,
        callback_url: result.config.callback_url,
        ativo: result.config.ativo,
        default_rtp: result.config.default_rtp,
        limit_enable: result.config.limit_enable,
        limit_amount: result.config.limit_amount,
        limit_hours: result.config.limit_hours,
        bonus_enable: result.config.bonus_enable,
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await savePlayfiverConfig(formData);
    if (result.success) {
      alert('Configuração salva com sucesso!');
    } else {
      alert(result.error || 'Erro ao salvar');
    }
    setSaving(false);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const result = await testPlayfiverConnection();
    setTestResult({
      success: result.success,
      message: result.success ? 'Conexão OK!' : (result.error || 'Falha'),
    });
    setTesting(false);
  }

  async function handleRefreshGames() {
    setRefreshing(true);
    setRefreshResult(null);
    const result = await refreshGamesCacheAdmin();
    setRefreshResult({
      success: result.success,
      message: result.success ? `${result.count} jogos atualizados` : (result.error || 'Falha'),
    });
    setRefreshing(false);
  }

  async function handleGetServerIP() {
    setLoadingIP(true);
    const result = await getServerIP();
    if (result.success && result.ip) {
      setServerIP(result.ip);
    } else {
      setServerIP('Erro ao obter IP');
    }
    setLoadingIP(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Cassino - Configuração</h1>
        <p className="text-zinc-400">Gerenciar integração PlayFivers</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Status Toggle */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <ToggleSwitch
            checked={formData.ativo}
            onChange={(checked) => setFormData({ ...formData, ativo: checked })}
            label="Cassino Ativo"
            description="Habilitar jogos de cassino para os usuários"
          />
        </div>

        {/* Credentials */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 space-y-4">
          <h2 className="text-lg font-semibold text-white">Credenciais</h2>

          <div>
            <label className="text-sm font-medium text-zinc-300">Agent Token</label>
            <Input
              value={formData.agent_token}
              onChange={(e) => setFormData({ ...formData, agent_token: e.target.value })}
              className="mt-1 bg-zinc-800 border-zinc-700/40 text-white font-mono text-sm"
              placeholder="UUID do agente"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300">Secret Key</label>
            <Input
              value={formData.secret_key}
              onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
              className="mt-1 bg-zinc-800 border-zinc-700/40 text-white font-mono text-sm"
              placeholder="Chave secreta"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300">Callback URL</label>
            <Input
              value={formData.callback_url}
              onChange={(e) => setFormData({ ...formData, callback_url: e.target.value })}
              className="mt-1 bg-zinc-800 border-zinc-700/40 text-zinc-500 font-mono text-sm"
              readOnly
            />
            <p className="text-xs text-zinc-500 mt-1">URL configurada automaticamente</p>
          </div>
        </div>

        {/* RTP */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 space-y-4">
          <h2 className="text-lg font-semibold text-white">RTP (Return to Player)</h2>

          <div>
            <label className="text-sm font-medium text-zinc-300">
              RTP Padrão: {formData.default_rtp}%
            </label>
            <input
              type="range"
              min={80}
              max={100}
              value={formData.default_rtp}
              onChange={(e) => setFormData({ ...formData, default_rtp: parseInt(e.target.value) })}
              className="mt-2 w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 space-y-4">
          <h2 className="text-lg font-semibold text-white">Limites</h2>

          <ToggleSwitch
            checked={formData.limit_enable}
            onChange={(checked) => setFormData({ ...formData, limit_enable: checked })}
            label="Limite de Perda"
            description="Limitar valor máximo de perda por período"
          />

          {formData.limit_enable && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-300">Valor Máximo (R$)</label>
                <Input
                  type="number"
                  value={formData.limit_amount}
                  onChange={(e) => setFormData({ ...formData, limit_amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300">Período (horas)</label>
                <Input
                  type="number"
                  value={formData.limit_hours}
                  onChange={(e) => setFormData({ ...formData, limit_hours: parseInt(e.target.value) || 24 })}
                  className="mt-1 bg-zinc-800 border-zinc-700/40 text-white"
                  min={1}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bonus */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <ToggleSwitch
            checked={formData.bonus_enable}
            onChange={(checked) => setFormData({ ...formData, bonus_enable: checked })}
            label="Bônus de Cassino"
            description="Habilitar bônus e promoções do provedor"
          />
        </div>

        {/* Save Button */}
        <Button type="submit" variant="teal" fullWidth disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </form>

      {/* Actions */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 space-y-4">
        <h2 className="text-lg font-semibold text-white">Ações</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
            Testar Conexão
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleRefreshGames}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar Jogos
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGetServerIP}
            disabled={loadingIP}
            className="flex items-center gap-2"
          >
            {loadingIP ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            IP do Servidor
          </Button>
        </div>

        {serverIP && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span className="text-zinc-300">IP de saída:</span>
            <code className="bg-zinc-900 px-2 py-1 rounded text-cyan-400 font-mono">{serverIP}</code>
            <span className="text-zinc-500 text-xs">- Adicione na IP Whitelist do PlayFivers</span>
          </div>
        )}

        {testResult && (
          <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
            {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {testResult.message}
          </div>
        )}

        {refreshResult && (
          <div className={`flex items-center gap-2 text-sm ${refreshResult.success ? 'text-green-400' : 'text-red-400'}`}>
            {refreshResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {refreshResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
