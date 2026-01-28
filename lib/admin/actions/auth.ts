'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logAudit, trackUserLogin } from '@/lib/security/tracker';
import { AuditActions } from '@/lib/security/audit-actions';

export async function checkAdminAuth() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null };
  }

  // Check if user is admin
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role, permissions')
    .eq('user_id', user.id)
    .single();

  if (!adminRole) {
    return { isAdmin: false, user };
  }

  return {
    isAdmin: true,
    user,
    role: adminRole.role,
    permissions: adminRole.permissions,
  };
}

export async function requireAdmin() {
  const { isAdmin, user } = await checkAdminAuth();

  if (!user) {
    redirect('/admin/login');
  }

  if (!isAdmin) {
    redirect('/');
  }

  return { user };
}

export async function adminLogin(cpfOrEmail: string, password: string) {
  const supabase = await createClient();

  // Se for um CPF (apenas números), converte para o formato de email
  const cleanInput = cpfOrEmail.replace(/\D/g, '');
  const email = cleanInput.length === 11
    ? `${cleanInput}@ultrabanca.app`
    : cpfOrEmail;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'CPF ou senha incorretos' };
  }

  // Check if user is admin
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();

  if (!adminRole) {
    // Sign out if not admin
    await supabase.auth.signOut();
    return { error: 'Acesso não autorizado' };
  }

  // Rastrear login do admin
  await trackUserLogin(data.user.id);

  // Registrar no log de auditoria
  await logAudit({
    actorId: data.user.id,
    action: AuditActions.LOGIN_ADMIN,
    entity: `admin:${data.user.id}`,
    details: {
      email: data.user.email,
      role: adminRole.role,
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true };
}

export async function adminLogout() {
  const supabase = await createClient();

  // Obter usuário antes do logout para registrar
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await logAudit({
      actorId: user.id,
      action: AuditActions.LOGOUT,
      entity: `admin:${user.id}`,
      details: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  await supabase.auth.signOut();
  redirect('/admin/login');
}
