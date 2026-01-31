'use server';

import { createClient } from '@/lib/supabase/server';
import { logAudit, trackUserLogin, trackUserSignup } from '@/lib/security/tracker';
import { AuditActions } from '@/lib/security/audit-actions';
import { dispatchLeadWebhook, dispatchWithdrawalWebhook } from '@/lib/webhooks/dispatcher';

/**
 * Rastreia o login de um usuário (chamado após sucesso no cliente)
 */
export async function trackLogin(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false };
    }

    // Atualizar perfil com IP e localização
    await trackUserLogin(user.id);

    // Registrar no log de auditoria
    await logAudit({
      actorId: user.id,
      action: AuditActions.LOGIN,
      entity: `user:${user.id}`,
      details: {
        email: user.email,
        timestamp: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking login:', error);
    return { success: false };
  }
}

/**
 * Rastreia o cadastro de um usuário (chamado após sucesso no cliente)
 */
export async function trackSignup(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false };
    }

    // Atualizar perfil com IP de cadastro
    await trackUserSignup(user.id);

    // Registrar no log de auditoria
    await logAudit({
      actorId: user.id,
      action: AuditActions.SIGNUP,
      entity: `user:${user.id}`,
      details: {
        email: user.email,
        timestamp: new Date().toISOString(),
      },
    });

    // Disparar webhook de lead (nao-bloqueante)
    dispatchLeadWebhook(user.id).catch((err) => {
      console.error('Error dispatching lead webhook:', err);
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking signup:', error);
    return { success: false };
  }
}

/**
 * Rastreia solicitação de saque pelo usuário
 */
export async function trackWithdrawalRequest(
  withdrawalId: string,
  valor: number,
  chavePix: string
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false };
    }

    await logAudit({
      actorId: user.id,
      action: AuditActions.WITHDRAWAL_REQUESTED,
      entity: `withdrawal:${withdrawalId}`,
      details: {
        valor,
        chave_pix: chavePix.slice(0, 4) + '****', // Mascara a chave
        timestamp: new Date().toISOString(),
      },
    });

    // Disparar webhook de saque (CRM/Integrações externas)
    dispatchWithdrawalWebhook(withdrawalId).catch((err) => {
      console.error('Error dispatching withdrawal webhook:', err);
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking withdrawal request:', error);
    return { success: false };
  }
}

/**
 * Rastreia criação de depósito
 */
export async function trackDepositCreated(
  depositId: string,
  valor: number
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false };
    }

    await logAudit({
      actorId: user.id,
      action: AuditActions.DEPOSIT_CREATED,
      entity: `deposit:${depositId}`,
      details: {
        valor,
        timestamp: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking deposit created:', error);
    return { success: false };
  }
}
