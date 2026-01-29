import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminRole) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // Parsear body
    const body = await request.json().catch(() => ({}));
    const { data, horario } = body;

    // Chamar função RPC
    const { data: result, error } = await supabase.rpc('verificar_apostas', {
      p_data: data || null,
      p_horario: horario || null,
    });

    if (error) {
      console.error('Erro ao verificar apostas:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Verificação concluída. ${result?.total_premiadas || 0} apostas premiadas.`
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET para verificar estatísticas
export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminRole) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // Buscar estatísticas de verificação
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: pendentes },
      { count: premiadas },
      { count: perderam },
      { data: ultimasVerificacoes }
    ] = await Promise.all([
      supabase
        .from('apostas')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pendente', 'confirmada']),
      supabase
        .from('apostas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'premiada'),
      supabase
        .from('apostas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'perdeu'),
      supabase
        .from('verificacao_apostas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    return NextResponse.json({
      stats: {
        pendentes: pendentes || 0,
        premiadas: premiadas || 0,
        perderam: perderam || 0,
      },
      ultimasVerificacoes: ultimasVerificacoes || [],
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
