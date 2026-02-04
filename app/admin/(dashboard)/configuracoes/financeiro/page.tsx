'use client';

import { ConfigPageWrapper, useConfig } from '@/components/admin/config/config-page-wrapper';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/admin/shared';
import { DollarSign, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function FinanceiroContent() {
  const { config, updateField } = useConfig();

  return (
    <div className="space-y-6">
      {/* Gateway */}
      <div className="p-4 bg-zinc-900/50 rounded-lg">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Gateway de Pagamento Ativo
        </label>
        <select
          value={config.active_gateway}
          onChange={(e) => updateField('active_gateway', e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-md"
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
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Valor Mínimo (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={config.deposit_min}
              onChange={(e) => updateField('deposit_min', Number(e.target.value))}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Valor Máximo (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={config.deposit_max}
              onChange={(e) => updateField('deposit_max', Number(e.target.value))}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Saques */}
      <div className="border-t border-zinc-700 pt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Saques</h3>

        <div className="flex items-center justify-between p-3 md:p-4 bg-zinc-900/50 rounded-lg mb-4">
          <div>
            <p className="font-medium text-white text-sm md:text-base">
              Modo de Processamento
            </p>
            <p className="text-xs md:text-sm text-zinc-400">
              {config.withdrawal_mode === 'automatic'
                ? 'Saques são processados automaticamente via gateway'
                : 'Saques devem ser processados manualmente pelo admin'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Manual</span>
            <ToggleSwitch
              checked={config.withdrawal_mode === 'automatic'}
              onChange={(checked) =>
                updateField('withdrawal_mode', checked ? 'automatic' : 'manual')
              }
            />
            <span className="text-sm text-zinc-400">Auto</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Valor Mínimo (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={config.withdrawal_min}
              onChange={(e) => updateField('withdrawal_min', Number(e.target.value))}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Valor Máximo (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={config.withdrawal_max}
              onChange={(e) => updateField('withdrawal_max', Number(e.target.value))}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Taxa (%)
            </label>
            <Input
              type="number"
              step="0.1"
              value={config.withdrawal_fee_percent}
              onChange={(e) =>
                updateField('withdrawal_fee_percent', Number(e.target.value))
              }
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfigFinanceiroPage() {
  return (
    <ConfigPageWrapper
      title="Configurações Financeiras"
      description="Gateway, limites de depósito e saque"
      icon={<DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-400" />}
      iconColor="bg-green-500/20"
    >
      <FinanceiroContent />
    </ConfigPageWrapper>
  );
}
