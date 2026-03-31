'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
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

import { executeTrigger } from '@/lib/admin/actions/evolution';

// ... existing imports

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

    // Vincular promotor (promotor_referidos) se veio por código de convite
    const codigoConvite = user.user_metadata?.codigo_convite;
    if (codigoConvite) {
      await vincularPromotor(user.id, codigoConvite.trim(), user.user_metadata?.platform_id).catch((err) => {
        console.error('[Signup] Error linking promoter:', err);
      });
    }

    // Disparar webhook de lead (nao-bloqueante)
    dispatchLeadWebhook(user.id).catch((err) => {
      console.error('Error dispatching lead webhook:', err);
    });

    // Disparar gatilho de WhatsApp (nao-bloqueante)
    // Busca profile para ter telefone e nome
    const { data: profile } = await supabase.from('profiles').select('nome, telefone').eq('id', user.id).single();

    if (profile?.telefone) {
      executeTrigger('cadastro', {
        nome: profile.nome || 'Novo Usuário',
        telefone: profile.telefone,
      }).catch(err => console.error('Error executing signup trigger:', err));
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking signup:', error);
    return { success: false };
  }
}

/**
 * Vincula um novo usuário ao promotor correspondente ao código de convite.
 * Busca o código tanto em promotores.codigo_afiliado quanto em profiles.codigo_convite.
 * Cria o registro em promotor_referidos e atualiza profiles.indicado_por.
 */
async function vincularPromotor(userId: string, codigoConvite: string, platformId?: string): Promise<void> {
  // Usar adminClient para bypassar RLS (promotor_referidos e profiles.indicado_por)
  const supabase = createAdminClient();

  // Aguardar profile ser criado pelo trigger (pode ter delay de até 3s)
  let profileExists = false;
  for (let i = 0; i < 6; i++) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (profile) { profileExists = true; break; }
    await new Promise(r => setTimeout(r, 500));
  }

  // Se trigger não criou o profile, criar manualmente (fallback)
  if (!profileExists) {
    console.warn(`[vincularPromotor] Profile not found for ${userId}, creating manually`);
    // Buscar user metadata do auth
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    const meta = user?.user_metadata || {};

    // Gerar código de convite único
    let codigo = '';
    for (let i = 0; i < 10; i++) {
      codigo = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
      const { data: dup } = await supabase.from('profiles').select('id').eq('codigo_convite', codigo).maybeSingle();
      if (!dup) break;
    }

    await supabase.from('profiles').insert({
      id: userId,
      cpf: meta.cpf || '',
      nome: meta.nome || 'Sem nome',
      telefone: meta.telefone || null,
      platform_id: platformId || meta.platform_id || 'ff61b7a2-1098-4bc4-99c5-5afb600fbc57',
      codigo_convite: codigo,
      saldo: 0,
      saldo_bonus: 0,
      saldo_cassino: 0,
      saldo_bonus_cassino: 0,
    });
    profileExists = true;
  }

  // Verificar se já está vinculado (idempotente)
  const { data: existingRef } = await supabase
    .from('promotor_referidos')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingRef) return; // Já vinculado

  // 1. Buscar promotor pelo codigo_afiliado (tabela promotores)
  let promotorQuery = supabase
    .from('promotores')
    .select('id, user_id, ativo')
    .eq('codigo_afiliado', codigoConvite)
    .eq('ativo', true);

  if (platformId) {
    promotorQuery = promotorQuery.eq('platform_id', platformId);
  }

  const { data: promotor } = await promotorQuery.maybeSingle();

  if (promotor) {
    // Criar vínculo promotor_referidos
    await supabase.from('promotor_referidos').insert({
      promotor_id: promotor.id,
      user_id: userId,
    });

    // Atualizar indicado_por se o user_id do promotor existe em profiles (FK constraint)
    if (promotor.user_id) {
      const { data: promotorProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', promotor.user_id)
        .maybeSingle();

      if (promotorProfile) {
        await supabase
          .from('profiles')
          .update({ indicado_por: promotor.user_id })
          .eq('id', userId);
      }
    }

    console.log(`[Signup] User ${userId} linked to promotor ${promotor.id} (code: ${codigoConvite})`);
    return;
  }

  // 2. Fallback: buscar por codigo_convite em profiles (indicação entre usuários)
  let profileQuery = supabase
    .from('profiles')
    .select('id')
    .eq('codigo_convite', codigoConvite);

  if (platformId) {
    profileQuery = profileQuery.eq('platform_id', platformId);
  }

  const { data: referrer } = await profileQuery.maybeSingle();

  if (referrer) {
    // Atualizar indicado_por no profile (indicação entre amigos, não promotor formal)
    await supabase
      .from('profiles')
      .update({ indicado_por: referrer.id })
      .eq('id', userId);

    console.log(`[Signup] User ${userId} referred by user ${referrer.id} (code: ${codigoConvite})`);
  }
}

/**
 * Atualiza IP e localização do usuário (chamado pelo hook de tracking uma vez por sessão)
 */
export async function updateUserLocation(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await trackUserLogin(user.id);
    return { success: true };
  } catch {
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
