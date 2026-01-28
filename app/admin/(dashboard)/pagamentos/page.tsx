'use client';

import { useState, useEffect } from 'react';
import { getAllGateways, getPrimaryGateway, setPrimaryGateway, type GatewayConfig } from '@/lib/admin/actions/settings';
import { Button } from '@/components/ui/button';
import { ToggleSwitch } from '@/components/admin/shared';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  Settings,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const GATEWAY_DISPLAY_NAMES: Record<string, string> = {
  'bspay': 'BSPay',
  'washpay': 'WashPay',
};

const GATEWAY_URLS: Record<string, string> = {
  'bspay': '/admin/pagamentos/bspay',
  'washpay': '/admin/pagamentos/washpay',
};

const GATEWAY_DESCRIPTIONS: Record<string, string> = {
  'bspay': 'Gateway tradicional de PIX - gera QRCode direto',
  'washpay': 'Gateway E-commerce - usa Direct Checkout para gerar PIX',
};

export default function AdminPagamentosPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [primaryGateway, setPrimaryGatewayState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [gatewaysData, primary] = await Promise.all([
          getAllGateways(),
          getPrimaryGateway(),
        ]);
        setGateways(gatewaysData);
        setPrimaryGatewayState(primary);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erro ao carregar configurações');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSetPrimary = async (gatewayName: string) => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const result = await setPrimaryGateway(gatewayName);

      if (result.success) {
        setPrimaryGatewayState(gatewayName);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(result.error || 'Erro ao definir gateway principal');
      }
    } catch {
      setError('Erro ao definir gateway principal');
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

  const activeGateways = gateways.filter(g => g.ativo);
  const inactiveGateways = gateways.filter(g => !g.ativo);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Configuração de Pagamentos</h1>
        <p className="text-sm md:text-base text-gray-400">Gerencie os gateways de pagamento da plataforma</p>
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
          <span className="text-sm">Gateway principal atualizado com sucesso!</span>
        </div>
      )}

      {/* Primary Gateway Card */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 md:p-3 rounded-lg bg-cyan-500/20">
            <Star className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-white">Gateway Principal</h2>
            <p className="text-xs md:text-sm text-gray-400">
              Será usado para processar depósitos automaticamente
            </p>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-cyan-400" />
              <span className="font-medium text-white">
                {GATEWAY_DISPLAY_NAMES[primaryGateway] || primaryGateway}
              </span>
              {gateways.find(g => g.gateway_name === primaryGateway)?.ativo ? (
                <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                  Ativo
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                  Inativo
                </span>
              )}
            </div>
            <Link
              href={GATEWAY_URLS[primaryGateway] || '/admin/pagamentos'}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              Configurar
            </Link>
          </div>
        </div>
      </div>

      {/* Active Gateways */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-white mb-4">
          Gateways Ativos ({activeGateways.length})
        </h2>

        {activeGateways.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum gateway ativo. Configure um gateway abaixo.</p>
        ) : (
          <div className="space-y-3">
            {activeGateways.map((gateway) => (
              <GatewayCard
                key={gateway.id}
                gateway={gateway}
                isPrimary={gateway.gateway_name === primaryGateway}
                onSetPrimary={() => handleSetPrimary(gateway.gateway_name)}
                isSaving={isSaving}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inactive Gateways */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-white mb-4">
          Gateways Disponíveis ({inactiveGateways.length})
        </h2>

        <div className="space-y-3">
          {inactiveGateways.map((gateway) => (
            <GatewayCard
              key={gateway.id}
              gateway={gateway}
              isPrimary={false}
              onSetPrimary={() => handleSetPrimary(gateway.gateway_name)}
              isSaving={isSaving}
            />
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-white mb-3">Informações</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>Apenas gateways ativos podem ser definidos como principal.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>Configure as credenciais de cada gateway clicando em "Configurar".</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">•</span>
            <span>O gateway QRCODE Manual permite receber pagamentos manualmente sem integração com API.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

interface GatewayCardProps {
  gateway: GatewayConfig;
  isPrimary: boolean;
  onSetPrimary: () => void;
  isSaving: boolean;
}

function GatewayCard({ gateway, isPrimary, onSetPrimary, isSaving }: GatewayCardProps) {
  const displayName = GATEWAY_DISPLAY_NAMES[gateway.gateway_name] || gateway.gateway_name;
  const configUrl = GATEWAY_URLS[gateway.gateway_name] || '/admin/pagamentos';
  const description = GATEWAY_DESCRIPTIONS[gateway.gateway_name] || '';

  return (
    <div className={`bg-gray-800/50 rounded-lg p-3 md:p-4 ${isPrimary ? 'ring-2 ring-cyan-500' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${gateway.ativo ? 'bg-green-500/20' : 'bg-gray-600'}`}>
            <CreditCard className={`h-4 w-4 md:h-5 md:w-5 ${gateway.ativo ? 'text-green-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white text-sm md:text-base">{displayName}</span>
              {isPrimary && (
                <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Principal
                </span>
              )}
            </div>
            <p className={`text-xs ${gateway.ativo ? 'text-green-400' : 'text-gray-500'}`}>
              {gateway.ativo ? 'Configurado e ativo' : 'Não configurado'}
            </p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {gateway.ativo && !isPrimary && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetPrimary}
              disabled={isSaving}
              className="text-xs border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
            >
              <Star className="h-3 w-3 mr-1" />
              Definir Principal
            </Button>
          )}
          <Link href={configUrl}>
            <Button variant="secondary" size="sm" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Configurar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
