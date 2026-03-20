import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
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
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { action, sessionId, message } = await req.json();
    const adminClient = createAdminClient();

    if (action === 'takeover') {
      // Admin assumes conversation
      const now = new Date().toISOString();
      const { error } = await adminClient
        .from('support_chat_sessions')
        .update({
          taken_over_by: user.id,
          taken_over_at: now,
          last_admin_reply_at: now,
          updated_at: now,
        })
        .eq('id', sessionId);

      if (error) {
        return NextResponse.json({ error: 'Erro ao assumir conversa' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'release') {
      // Admin releases conversation back to AI
      const { error } = await adminClient
        .from('support_chat_sessions')
        .update({
          taken_over_by: null,
          taken_over_at: null,
          last_admin_reply_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) {
        return NextResponse.json({ error: 'Erro ao liberar conversa' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'send' && message) {
      // Get session to find user_id and platform_id
      const { data: session } = await adminClient
        .from('support_chat_sessions')
        .select('user_id, platform_id')
        .eq('id', sessionId)
        .single();

      if (!session) {
        return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
      }

      // Save admin message
      const { error: msgError } = await adminClient
        .from('support_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: session.user_id,
          platform_id: session.platform_id,
          role: 'admin',
          content: message.trim(),
        });

      if (msgError) {
        return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
      }

      // Update last_admin_reply_at to reset the 30min timer
      await adminClient
        .from('support_chat_sessions')
        .update({
          last_admin_reply_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('[CHAT ADMIN] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
