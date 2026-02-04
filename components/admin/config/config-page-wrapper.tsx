'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getPlatformConfig, updatePlatformConfig } from '@/lib/admin/actions/platform-config';
import { PlatformConfig } from '@/contexts/platform-config-context';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ConfigContextType {
  config: PlatformConfig;
  isLoading: boolean;
  updateField: <K extends keyof PlatformConfig>(key: K, value: PlatformConfig[K]) => void;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigPageWrapper');
  return ctx;
}

interface ConfigPageWrapperProps {
  title: string;
  description: string;
  icon: ReactNode;
  iconColor: string;
  children: ReactNode;
}

export function ConfigPageWrapper({
  title,
  description,
  icon,
  iconColor,
  children,
}: ConfigPageWrapperProps) {
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
    <ConfigContext.Provider value={{ config, isLoading, updateField }}>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 md:p-3 rounded-lg ${iconColor}`}>
              {icon}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
              <p className="text-sm md:text-base text-gray-400">{description}</p>
            </div>
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

        {/* Content */}
        <div className="bg-[#374151] rounded-lg p-4 md:p-6">
          {children}
        </div>
      </div>
    </ConfigContext.Provider>
  );
}
