'use client';

import dynamic from 'next/dynamic';
import { ConfigPageWrapper, useConfig } from '@/components/admin/config/config-page-wrapper';
import { ToggleSwitch } from '@/components/admin/shared';
import { Shield } from 'lucide-react';

const MFASetup = dynamic(
  () => import('@/components/admin/security/mfa-setup').then((mod) => ({ default: mod.MFASetup })),
  {
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-zinc-700/50 rounded-lg" />
        <div className="h-12 bg-zinc-700/50 rounded-lg" />
      </div>
    ),
    ssr: false,
  }
);

function SegurancaContent() {
  const { config, updateField } = useConfig();

  return (
    <div className="space-y-6">
      {/* Modo Produção */}
      <div className="bg-zinc-900/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Banca em Produção?</h3>
            <p className="text-xs text-zinc-400 mt-1">
              {config.production_mode
                ? 'Proteções de segurança ativadas. Alterações de saldo só são permitidas via funções oficiais (Edge Functions).'
                : 'Modo desenvolvimento. Permite alterações de saldo via cliente para testes.'}
            </p>
          </div>
          <ToggleSwitch
            checked={config.production_mode}
            onChange={(checked) => updateField('production_mode', checked)}
            size="lg"
          />
        </div>
        {!config.production_mode && (
          <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs">
            ⚠️ Atenção: Com o modo produção desligado, usuários podem manipular saldo. Ative antes de ir ao ar!
          </div>
        )}
      </div>

      {/* MFA Setup Component */}
      <MFASetup />

      {/* Informações de Segurança */}
      <div className="bg-zinc-900/50 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Dicas de Segurança</h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Use uma senha forte com pelo menos 12 caracteres</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Ative a autenticação de dois fatores (2FA)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Não compartilhe suas credenciais com terceiros</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Sempre faça logout ao usar computadores públicos</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function ConfigSegurancaPage() {
  return (
    <ConfigPageWrapper
      title="Segurança da Conta"
      description="Autenticação de dois fatores e proteção adicional"
      icon={<Shield className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />}
      iconColor="bg-amber-500/20"
    >
      <SegurancaContent />
    </ConfigPageWrapper>
  );
}
