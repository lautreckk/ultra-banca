'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server Action para logout forçado do Admin
 * - Destrói a sessão no Supabase
 * - Limpa todos os cookies de sessão
 * - Invalida o cache
 * - Redireciona para a página de login
 */
export async function logoutAdmin() {
  const supabase = await createClient();

  // 1. Fazer signOut no Supabase
  await supabase.auth.signOut();

  // 2. Limpar cookies de sessão manualmente (força destruição)
  const cookieStore = await cookies();

  // Pegar todos os cookies e deletar os relacionados ao Supabase
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (
      cookie.name.includes('supabase') ||
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth')
    ) {
      cookieStore.delete(cookie.name);
    }
  }

  // 3. Invalida o cache de todas as rotas admin
  revalidatePath('/admin', 'layout');
  revalidatePath('/', 'layout');

  // 4. Redireciona para login
  redirect('/admin/login');
}

/**
 * Server Action para logout do usuário comum (Banca)
 */
export async function logoutUser() {
  const supabase = await createClient();

  // 1. Fazer signOut no Supabase
  await supabase.auth.signOut();

  // 2. Limpar cookies de sessão manualmente
  const cookieStore = await cookies();

  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (
      cookie.name.includes('supabase') ||
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth')
    ) {
      cookieStore.delete(cookie.name);
    }
  }

  // 3. Invalida o cache
  revalidatePath('/', 'layout');

  // 4. Redireciona para login
  redirect('/login');
}
