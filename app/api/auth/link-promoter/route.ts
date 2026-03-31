import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Vincula um usuário recém-cadastrado ao promotor correspondente.
 * Chamado no primeiro login após o cadastro.
 *
 * Fluxo: Busca codigo_convite do user_metadata do auth →
 *        Busca promotor por codigo_afiliado → Cria promotor_referidos
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const codigoConvite = user.user_metadata?.codigo_convite;
    if (!codigoConvite || typeof codigoConvite !== 'string' || !codigoConvite.trim()) {
      return NextResponse.json({ linked: false, reason: 'no_code' });
    }

    const code = codigoConvite.trim();
    const platformId = user.user_metadata?.platform_id;
    const adminClient = createAdminClient();

    // Verificar se já está vinculado (idempotente)
    const { data: existingRef } = await adminClient
      .from('promotor_referidos')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingRef) {
      return NextResponse.json({ linked: true, reason: 'already_linked' });
    }

    // 1. Buscar promotor formal (promotores.codigo_afiliado)
    let promotorQuery = adminClient
      .from('promotores')
      .select('id, user_id')
      .eq('codigo_afiliado', code)
      .eq('ativo', true);

    if (platformId) {
      promotorQuery = promotorQuery.eq('platform_id', platformId);
    }

    const { data: promotor } = await promotorQuery.maybeSingle();

    if (promotor) {
      // Criar vínculo promotor_referidos
      const { error: refError } = await adminClient.from('promotor_referidos').insert({
        promotor_id: promotor.id,
        user_id: user.id,
      });

      if (refError) {
        console.error('[LinkPromoter] Error creating referido:', refError.message);
        return NextResponse.json({ linked: false, error: refError.message }, { status: 500 });
      }

      // Atualizar indicado_por (se promotor tem perfil)
      if (promotor.user_id) {
        const { data: promotorProfile } = await adminClient
          .from('profiles')
          .select('id')
          .eq('id', promotor.user_id)
          .maybeSingle();

        if (promotorProfile) {
          await adminClient
            .from('profiles')
            .update({ indicado_por: promotor.user_id })
            .eq('id', user.id);
        }
      }

      console.log(`[LinkPromoter] User ${user.id} linked to promotor ${promotor.id} (code: ${code})`);
      return NextResponse.json({ linked: true, promotor_id: promotor.id });
    }

    // 2. Fallback: indicação entre amigos (profiles.codigo_convite)
    let profileQuery = adminClient
      .from('profiles')
      .select('id')
      .eq('codigo_convite', code);

    if (platformId) {
      profileQuery = profileQuery.eq('platform_id', platformId);
    }

    const { data: referrer } = await profileQuery.maybeSingle();

    if (referrer) {
      await adminClient
        .from('profiles')
        .update({ indicado_por: referrer.id })
        .eq('id', user.id);

      console.log(`[LinkPromoter] User ${user.id} referred by friend ${referrer.id} (code: ${code})`);
      return NextResponse.json({ linked: true, referrer_id: referrer.id });
    }

    return NextResponse.json({ linked: false, reason: 'code_not_found' });
  } catch (error) {
    console.error('[LinkPromoter] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
