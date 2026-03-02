import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError } from '@/lib/utils/safe-error';

// GET - Listar resultados com filtros
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

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

    // Filtros
    const data = searchParams.get('data');
    const horario = searchParams.get('horario');
    const banca = searchParams.get('banca');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Query base
    let query = supabase
      .from('resultados')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (data) {
      query = query.eq('data', data);
    }
    if (horario) {
      query = query.eq('horario', horario);
    }
    if (banca) {
      query = query.eq('banca', banca);
    }

    // Ordenação e paginação
    query = query
      .order('data', { ascending: false })
      .order('horario', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data: resultados, count, error } = await query;

    if (error) {
      console.error('Erro ao buscar resultados:', error);
      return NextResponse.json(
        { error: safeError(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      resultados: resultados || [],
      total: count || 0,
      page,
      pageSize,
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Inserir ou atualizar resultado
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

    const body = await request.json();
    const {
      id,
      data,
      horario,
      banca = 'DF',
      premio_1,
      premio_2,
      premio_3,
      premio_4,
      premio_5,
      premio_6,
      premio_7,
      premio_8,
      premio_9,
      premio_10,
      bicho_1,
      bicho_2,
      bicho_3,
      bicho_4,
      bicho_5,
      bicho_6,
      bicho_7,
      bicho_8,
      bicho_9,
      bicho_10,
      loteria = '',
    } = body;

    // Validação básica
    if (!data || !horario) {
      return NextResponse.json(
        { error: 'Data e horário são obrigatórios' },
        { status: 400 }
      );
    }

    const resultadoData = {
      data,
      horario,
      banca,
      premio_1,
      premio_2,
      premio_3,
      premio_4,
      premio_5,
      premio_6,
      premio_7,
      premio_8,
      premio_9,
      premio_10,
      bicho_1,
      bicho_2,
      bicho_3,
      bicho_4,
      bicho_5,
      bicho_6,
      bicho_7,
      bicho_8,
      bicho_9,
      bicho_10,
      loteria,
    };

    let result;

    if (id) {
      // Atualizar existente
      const { data: updated, error } = await supabase
        .from('resultados')
        .update(resultadoData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar resultado:', error);
        return NextResponse.json(
          { error: safeError(error) },
          { status: 500 }
        );
      }
      result = updated;
    } else {
      // Inserir novo ou upsert por data/horario/banca
      const { data: inserted, error } = await supabase
        .from('resultados')
        .upsert(resultadoData, {
          onConflict: 'data,horario,banca',
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir resultado:', error);
        return NextResponse.json(
          { error: safeError(error) },
          { status: 500 }
        );
      }
      result = inserted;
    }

    return NextResponse.json({
      success: true,
      resultado: result,
      message: id ? 'Resultado atualizado com sucesso' : 'Resultado inserido com sucesso',
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover resultado
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

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

    const { error } = await supabase
      .from('resultados')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar resultado:', error);
      return NextResponse.json(
        { error: safeError(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Resultado removido com sucesso',
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
