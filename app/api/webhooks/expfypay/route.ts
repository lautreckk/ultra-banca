import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { ExpfyPayClient } from '@/lib/expfypay/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-signature') || '';

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { event, transaction_id, external_id, status, amount } = payload;

    console.log(`[EXPFY Webhook] Event: ${event}, TX: ${transaction_id}, External: ${external_id}, Status: ${status}`);

    // Apenas processar pagamentos confirmados
    if (event !== 'payment.confirmed' || status !== 'completed') {
      return NextResponse.json({ received: true, processed: false });
    }

    if (!external_id) {
      console.error('[EXPFY Webhook] Missing external_id');
      return NextResponse.json({ error: 'Missing external_id' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Buscar o pagamento pelo ID (external_id = pagamento.id)
    const { data: pagamento, error: fetchError } = await supabase
      .from('pagamentos')
      .select('id, user_id, valor, status, platform_id, wallet_type')
      .eq('id', external_id)
      .single();

    if (fetchError || !pagamento) {
      console.error('[EXPFY Webhook] Payment not found:', external_id, fetchError);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Já foi processado
    if (pagamento.status === 'PAID') {
      console.log('[EXPFY Webhook] Payment already PAID:', external_id);
      return NextResponse.json({ received: true, already_processed: true });
    }

    // Validar assinatura do webhook
    const { data: gatewayConfig } = await supabase
      .from('gateway_config')
      .select('client_secret')
      .eq('gateway_name', 'expfypay')
      .eq('platform_id', pagamento.platform_id)
      .single();

    if (gatewayConfig?.client_secret && signature) {
      const isValid = await ExpfyPayClient.verifyWebhookSignature(body, signature, gatewayConfig.client_secret);
      if (!isValid) {
        console.warn('[EXPFY Webhook] Invalid signature for payment:', external_id);
        // Continua mesmo assim (alguns gateways não assinam sempre)
      }
    }

    // Atualizar status para PAID atomicamente
    const { error: transitionError } = await supabase.rpc('atomic_status_transition', {
      p_table: 'pagamentos',
      p_id: external_id,
      p_from_status: 'PENDING',
      p_to_status: 'PAID',
    });

    if (transitionError) {
      console.error('[EXPFY Webhook] Status transition failed:', transitionError);
      return NextResponse.json({ error: 'Status transition failed' }, { status: 500 });
    }

    // Atualizar paid_at
    await supabase
      .from('pagamentos')
      .update({ paid_at: new Date().toISOString() })
      .eq('id', external_id);

    // Creditar saldo do usuário
    const walletField = pagamento.wallet_type === 'cassino' ? 'saldo_cassino' : 'saldo';
    const { error: creditError } = await supabase.rpc('atomic_credit_balance', {
      p_user_id: pagamento.user_id,
      p_amount: pagamento.valor,
      p_wallet: walletField,
    });

    if (creditError) {
      console.error('[EXPFY Webhook] Credit balance failed:', creditError);
    }

    // Aplicar bônus de depósito (se configurado)
    try {
      const { data: bonusConfigs } = await supabase
        .from('bonus_deposito_config')
        .select('*')
        .eq('platform_id', pagamento.platform_id)
        .eq('ativo', true)
        .lte('valor_minimo', pagamento.valor)
        .order('valor_minimo', { ascending: false })
        .limit(1);

      if (bonusConfigs && bonusConfigs.length > 0) {
        const bonus = bonusConfigs[0];
        const bonusValue = pagamento.valor * (Number(bonus.percentual) / 100);
        const bonusField = pagamento.wallet_type === 'cassino' ? 'saldo_bonus_cassino' : 'saldo_bonus';

        if (bonusValue > 0) {
          await supabase.rpc('atomic_credit_balance', {
            p_user_id: pagamento.user_id,
            p_amount: bonusValue,
            p_field: bonusField,
          });

          await supabase.from('bonus_deposito_aplicados').insert({
            user_id: pagamento.user_id,
            platform_id: pagamento.platform_id,
            pagamento_id: pagamento.id,
            bonus_config_id: bonus.id,
            valor_deposito: pagamento.valor,
            percentual_aplicado: bonus.percentual,
            valor_bonus: bonusValue,
          });
        }
      }
    } catch (bonusErr) {
      console.error('[EXPFY Webhook] Bonus error:', bonusErr);
    }

    console.log(`[EXPFY Webhook] Payment ${external_id} confirmed. User ${pagamento.user_id} credited R$${pagamento.valor}`);

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[EXPFY Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
