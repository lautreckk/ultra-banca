import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import webpush from 'web-push';

export const runtime = 'nodejs';

const VAPID_EMAIL = 'mailto:suporte@bancapegabicho.com';
let vapidConfigured = false;

function ensureVapid(): { ok: boolean; error?: string } {
  if (vapidConfigured) return { ok: true };
  const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').replace(/=+$/, '');
  const priv = (process.env.VAPID_PRIVATE_KEY || '').replace(/=+$/, '');
  if (!pub || !priv) return { ok: false, error: `VAPID keys missing: pub=${pub ? 'set' : 'empty'} priv=${priv ? 'set' : 'empty'}` };
  try {
    webpush.setVapidDetails(VAPID_EMAIL, pub, priv);
    vapidConfigured = true;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `VAPID init failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth check with user's session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verify admin role
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRole || !['admin', 'super_admin'].includes(adminRole.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { title, body, url, platformId, notificationId } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 });
    }

    const vapid = ensureVapid();
    if (!vapid.ok) {
      console.error('[PUSH] VAPID error:', vapid.error);
      return NextResponse.json({ error: vapid.error || 'VAPID keys não configuradas' }, { status: 500 });
    }

    // Use admin client (service role) to bypass RLS for fetching all subscriptions
    const adminSupabase = createAdminClient();

    // Get all subscriptions for the platform
    let query = adminSupabase.from('push_subscriptions').select('*');
    if (platformId) {
      query = query.eq('platform_id', platformId);
    }
    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error('[PUSH] Fetch subscriptions error:', subError);
      return NextResponse.json({ error: `Erro ao buscar inscrições: ${subError.message}` }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0 });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      tag: notificationId || 'marketing',
    });

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    // Send to all subscribers
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
          sent++;
        } catch (err: unknown) {
          const pushErr = err as { statusCode?: number };
          failed++;
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await adminSupabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    // Update notification record
    if (notificationId) {
      await adminSupabase
        .from('push_notifications')
        .update({ sent_count: sent, sent_at: new Date().toISOString() })
        .eq('id', notificationId);
    }

    return NextResponse.json({
      sent,
      failed,
      total: subscriptions.length,
      expired: expiredEndpoints.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[PUSH] Send error:', msg, error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
