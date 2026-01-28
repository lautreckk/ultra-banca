'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';

type MFAStatus = 'loading' | 'disabled' | 'enabled' | 'enrolling' | 'verifying';

interface TOTPFactor {
  id: string;
  friendly_name?: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
}

export function MFASetup() {
  const [status, setStatus] = useState<MFAStatus>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [factors, setFactors] = useState<TOTPFactor[]>([]);

  const supabase = createClient();

  // Verificar status do MFA ao carregar
  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        console.error('Erro ao verificar MFA:', error);
        setError('Erro ao verificar status do 2FA');
        setStatus('disabled');
        return;
      }

      const totpFactors = data?.totp || [];
      const verifiedFactors = totpFactors.filter(f => f.status === 'verified');

      setFactors(verifiedFactors as TOTPFactor[]);
      setStatus(verifiedFactors.length > 0 ? 'enabled' : 'disabled');
    } catch (err) {
      console.error('Erro ao verificar MFA:', err);
      setError('Erro ao verificar status do 2FA');
      setStatus('disabled');
    }
  };

  const startEnrollment = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Ultra Banca Admin',
      });

      if (error) {
        setError(error.message || 'Erro ao iniciar configuração do 2FA');
        setIsLoading(false);
        return;
      }

      if (!data?.totp?.uri || !data?.totp?.secret) {
        setError('Resposta inválida do servidor');
        setIsLoading(false);
        return;
      }

      // Gerar QR Code (dynamic import)
      const QRCode = await import('qrcode');
      const qrUrl = await QRCode.toDataURL(data.totp.uri, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      setQrCodeUrl(qrUrl);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStatus('enrolling');
    } catch (err) {
      console.error('Erro ao iniciar enrollment:', err);
      setError('Erro ao gerar QR Code. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndActivate = async () => {
    if (!factorId || verifyCode.length !== 6) {
      setError('Digite o código de 6 dígitos do seu aplicativo');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('verifying');

    try {
      // Criar challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        setError(challengeError.message || 'Erro ao criar desafio');
        setStatus('enrolling');
        setIsLoading(false);
        return;
      }

      // Verificar código
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) {
        setError('Código incorreto. Verifique e tente novamente.');
        setStatus('enrolling');
        setIsLoading(false);
        return;
      }

      // Sucesso!
      setSuccess('2FA ativado com sucesso! Sua conta está mais segura.');
      setStatus('enabled');
      setQrCodeUrl(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode('');

      // Recarregar fatores
      await checkMFAStatus();
    } catch (err) {
      console.error('Erro ao verificar:', err);
      setError('Erro ao verificar código. Tente novamente.');
      setStatus('enrolling');
    } finally {
      setIsLoading(false);
    }
  };

  const disableMFA = async (factorIdToRemove: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorIdToRemove,
      });

      if (error) {
        setError(error.message || 'Erro ao desativar 2FA');
        setIsLoading(false);
        return;
      }

      setSuccess('2FA desativado com sucesso.');
      await checkMFAStatus();
    } catch (err) {
      console.error('Erro ao desativar MFA:', err);
      setError('Erro ao desativar 2FA. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEnrollment = () => {
    setStatus('disabled');
    setQrCodeUrl(null);
    setSecret(null);
    setFactorId(null);
    setVerifyCode('');
    setError(null);
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="bg-[#374151] rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <span className="text-gray-300">Verificando status do 2FA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#374151] rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${status === 'enabled' ? 'bg-green-500/20' : 'bg-gray-600'}`}>
          {status === 'enabled' ? (
            <ShieldCheck className="h-6 w-6 text-green-400" />
          ) : (
            <Shield className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Autenticação de Dois Fatores (2FA)</h2>
          <p className="text-sm text-gray-400">
            {status === 'enabled'
              ? 'Sua conta está protegida com 2FA'
              : 'Adicione uma camada extra de segurança'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* MFA Disabled - Show Activation Button */}
      {status === 'disabled' && (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-white mb-2">Como funciona?</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">1.</span>
                <span>Instale um app autenticador (Google Authenticator, Authy, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">2.</span>
                <span>Escaneie o QR Code gerado pelo sistema</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">3.</span>
                <span>Digite o código de 6 dígitos para confirmar</span>
              </li>
            </ul>
          </div>

          <Button
            variant="teal"
            onClick={startEnrollment}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Ativar 2FA
              </>
            )}
          </Button>
        </div>
      )}

      {/* Enrolling - Show QR Code */}
      {(status === 'enrolling' || status === 'verifying') && qrCodeUrl && (
        <div className="space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <img src={qrCodeUrl} alt="QR Code para 2FA" className="w-48 h-48" />
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm">Escaneie com seu app autenticador</span>
            </div>
          </div>

          {/* Manual Secret */}
          {secret && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Ou digite o código manualmente:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm text-cyan-400 font-mono break-all">
                  {secret}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copySecret}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Verification Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Digite o código de 6 dígitos do app:
            </label>
            <div className="flex gap-3">
              <Input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="bg-gray-700 border-gray-600 text-white text-center text-2xl tracking-[0.5em] font-mono"
                disabled={status === 'verifying'}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={cancelEnrollment}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="teal"
              onClick={verifyAndActivate}
              disabled={isLoading || verifyCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Ativar 2FA
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* MFA Enabled - Show Status & Disable Option */}
      {status === 'enabled' && factors.length > 0 && (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">2FA Ativo</p>
                <p className="text-sm text-gray-400">
                  {factors.length} dispositivo(s) configurado(s)
                </p>
              </div>
            </div>
          </div>

          {/* Lista de fatores */}
          <div className="space-y-2">
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-white">{factor.friendly_name || 'App Autenticador'}</p>
                    <p className="text-xs text-gray-500">TOTP</p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => disableMFA(factor.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Aviso */}
          <p className="text-xs text-gray-500">
            Remover o 2FA reduz a segurança da sua conta. Recomendamos manter ativo.
          </p>
        </div>
      )}
    </div>
  );
}
