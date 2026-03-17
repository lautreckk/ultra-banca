import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { ExpfyPayClient } from '@/lib/expfypay/client';

export const runtime = 'nodejs';

/**
 * POST /api/payments/expfypay
 * Cria um pagamento PIX via EXPFY Pay
 * Body: { valor, tipo, wallet_type }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { valor, tipo = 'deposito', wallet_type = 'tradicional' } = await req.json();

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    // Buscar platform_id do cookie
    const platformId = req.cookies.get('platform_id')?.value;
    if (!platformId) {
      return NextResponse.json({ error: 'Platform não identificada' }, { status: 400 });
    }

    // Buscar config do gateway EXPFY para esta plataforma
    const adminSupabase = createAdminClient();
    const { data: gatewayConfig, error: configError } = await adminSupabase
      .from('gateway_config')
      .select('client_id, client_secret, webhook_url, config')
      .eq('gateway_name', 'expfypay')
      .eq('platform_id', platformId)
      .eq('ativo', true)
      .single();

    if (configError || !gatewayConfig) {
      console.error('[EXPFY] Gateway config not found:', configError);
      return NextResponse.json({ error: 'Gateway EXPFY não configurado' }, { status: 500 });
    }

    // Buscar dados do perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, cpf, telefone')
      .eq('id', user.id)
      .single();

    // Criar registro do pagamento no banco
    const { data: pagamento, error: insertError } = await adminSupabase
      .from('pagamentos')
      .insert({
        user_id: user.id,
        platform_id: platformId,
        tipo,
        valor,
        status: 'PENDING',
        wallet_type,
        metodo_pagamento: 'pix_expfypay',
      })
      .select('id')
      .single();

    if (insertError || !pagamento) {
      console.error('[EXPFY] Insert payment error:', insertError);
      return NextResponse.json({ error: 'Erro ao criar pagamento' }, { status: 500 });
    }

    // Chamar EXPFY Pay API
    const client = new ExpfyPayClient(gatewayConfig.client_id, gatewayConfig.client_secret);

    const expfyResponse = await client.createPayment({
      amount: valor,
      description: `Depósito PIX - ${profile?.nome || 'Cliente'}`,
      customer: {
        name: profile?.nome || 'Cliente',
        document: profile?.cpf?.replace(/\D/g, '') || '00000000000',
        email: user.email || 'cliente@email.com',
      },
      external_id: pagamento.id,
      callback_url: gatewayConfig.webhook_url || `https://www.ojogodobicho.vip/api/webhooks/expfypay`,
    });

    if (!expfyResponse.success || !expfyResponse.data) {
      console.error('[EXPFY] API error:', expfyResponse);
      // Cancelar pagamento
      await adminSupabase.from('pagamentos').update({ status: 'CANCELLED' }).eq('id', pagamento.id);
      return NextResponse.json({ error: 'Erro ao gerar PIX' }, { status: 500 });
    }

    // Atualizar pagamento com dados do PIX
    await adminSupabase
      .from('pagamentos')
      .update({
        pix_qr_code: expfyResponse.data.qr_code_image || '',
        pix_copy_paste: expfyResponse.data.qr_code || '',
        pix_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      })
      .eq('id', pagamento.id);

    // Retornar no formato esperado pelo frontend
    return NextResponse.json({
      pagamento: {
        id: pagamento.id,
        valor,
        status: 'PENDING',
        pixQrCode: expfyResponse.data.qr_code_image || '',
        pixCopyPaste: expfyResponse.data.qr_code || '',
        orderNumber: expfyResponse.data.transaction_id || pagamento.id,
      },
    });
  } catch (error) {
    console.error('[EXPFY] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
