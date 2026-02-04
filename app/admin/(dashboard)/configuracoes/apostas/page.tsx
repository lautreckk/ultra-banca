'use client';

import { ConfigPageWrapper, useConfig } from '@/components/admin/config/config-page-wrapper';
import { Input } from '@/components/ui/input';
import { Target, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function ApostasContent() {
  const { config, updateField } = useConfig();

  return (
    <div className="space-y-6">
      {/* Valores de Aposta */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Valores por Aposta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Aposta Mínima (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={config.bet_min}
              onChange={(e) => updateField('bet_min', Number(e.target.value))}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Aposta Máxima (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={config.bet_max}
              onChange={(e) => updateField('bet_max', Number(e.target.value))}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Limites de Risco */}
      <div className="border-t border-zinc-700 pt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Limites de Risco</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Prêmio Máximo por Aposta (R$)
            </label>
            <Input
              type="number"
              step="100"
              value={config.max_payout_per_bet}
              onChange={(e) => updateField('max_payout_per_bet', Number(e.target.value))}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Limite máximo que um apostador pode ganhar em uma única aposta
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Prêmio Máximo Diário (R$)
            </label>
            <Input
              type="number"
              step="100"
              value={config.max_payout_daily}
              onChange={(e) => updateField('max_payout_daily', Number(e.target.value))}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Limite máximo de pagamentos por dia
            </p>
          </div>
        </div>
      </div>

      {/* Link para Modalidades */}
      <div className="border-t border-zinc-700 pt-6">
        <div className="p-4 bg-zinc-900/50 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">
            Configurar Modalidades
          </h3>
          <p className="text-xs md:text-sm text-zinc-400 mb-3">
            Configure os multiplicadores e posições de cada modalidade de aposta
          </p>
          <Link
            href="/admin/modalidades"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Configurar Modalidades
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfigApostasPage() {
  return (
    <ConfigPageWrapper
      title="Limites de Apostas"
      description="Valores mínimos, máximos e limites de risco"
      icon={<Target className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />}
      iconColor="bg-purple-500/20"
    >
      <ApostasContent />
    </ConfigPageWrapper>
  );
}
