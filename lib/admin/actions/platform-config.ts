'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { PlatformConfig, defaultConfig } from '@/contexts/platform-config-context';
import { getPlatformId } from '@/lib/utils/platform';

/**
 * getPlatformConfig - MULTI-TENANT
 *
 * Busca configuracoes da plataforma atual baseado no platform_id do cookie.
 * Se nao encontrar, tenta buscar da tabela legada platform_config.
 */
export async function getPlatformConfig(): Promise<PlatformConfig> {
  // NOTE: NÃO usar requireAdmin() aqui!
  // Esta função é chamada pelo root layout (app/layout.tsx) para TODAS as páginas,
  // incluindo /login e /cadastro. Ela só lê configurações públicas (nome, logo, cores).
  noStore();

  const supabase = await createClient();

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

  // Primeiro, tentar buscar da tabela platforms (multi-tenant)
  const { data: platform, error: platformError } = await supabase
    .from('platforms')
    .select('*')
    .eq('id', platformId)
    .single();

  if (platform && !platformError) {
    // Usar dados da tabela platforms (multi-tenant)
    return {
      id: platform.id,
      slug: platform.slug || '',
      site_name: platform.name || defaultConfig.site_name,
      site_description: platform.site_description || defaultConfig.site_description,
      logo_url: platform.logo_url || defaultConfig.logo_url,
      favicon_url: platform.favicon_url || defaultConfig.favicon_url,
      login_bg_url: platform.login_bg_url || defaultConfig.login_bg_url,
      color_primary: platform.color_primary || defaultConfig.color_primary,
      color_primary_dark: platform.color_primary_dark || defaultConfig.color_primary_dark,
      color_background: platform.color_background || defaultConfig.color_background,
      color_surface: platform.color_surface || defaultConfig.color_surface,
      color_accent_teal: platform.color_accent_teal || defaultConfig.color_accent_teal,
      color_accent_green: platform.color_accent_green || defaultConfig.color_accent_green,
      color_text_primary: platform.color_text_primary || defaultConfig.color_text_primary,
      social_whatsapp: platform.social_whatsapp,
      social_instagram: platform.social_instagram,
      social_telegram: platform.social_telegram,
      promotor_link: platform.promotor_link,
      active_gateway: platform.active_gateway || defaultConfig.active_gateway,
      deposit_min: Number(platform.deposit_min) || defaultConfig.deposit_min,
      deposit_max: Number(platform.deposit_max) || defaultConfig.deposit_max,
      withdrawal_min: Number(platform.withdrawal_min) || defaultConfig.withdrawal_min,
      withdrawal_max: Number(platform.withdrawal_max) || defaultConfig.withdrawal_max,
      withdrawal_fee_percent: Number(platform.withdrawal_fee_percent) || defaultConfig.withdrawal_fee_percent,
      withdrawal_mode: platform.withdrawal_mode || defaultConfig.withdrawal_mode,
      bet_min: Number(platform.bet_min) || defaultConfig.bet_min,
      bet_max: Number(platform.bet_max) || defaultConfig.bet_max,
      max_payout_per_bet: Number(platform.max_payout_per_bet) || defaultConfig.max_payout_per_bet,
      max_payout_daily: Number(platform.max_payout_daily) || defaultConfig.max_payout_daily,
      facebook_pixel_id: platform.facebook_pixel_id,
      facebook_access_token: platform.facebook_access_token,
      google_analytics_id: platform.google_analytics_id,
      custom_head_scripts: platform.custom_head_scripts,
      utmify_pixel_id: platform.utmify_pixel_id || null,
      production_mode: platform.production_mode ?? defaultConfig.production_mode,
      layout_id: (platform.layout_id as 1 | 2 | 3) || 1,
    };
  }

  // Fallback: buscar da tabela legada platform_config (para compatibilidade)
  const { data, error } = await supabase
    .from('platform_config')
    .select('id, site_name, site_description, logo_url, favicon_url, color_primary, color_primary_dark, color_background, color_surface, color_accent_teal, color_accent_green, color_text_primary, social_whatsapp, social_instagram, social_telegram, promotor_link, active_gateway, deposit_min, deposit_max, withdrawal_min, withdrawal_max, withdrawal_fee_percent, withdrawal_mode, bet_min, bet_max, max_payout_per_bet, max_payout_daily, facebook_pixel_id, facebook_access_token, google_analytics_id, custom_head_scripts, production_mode')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error fetching platform config:', error);
    return defaultConfig;
  }

  return {
    id: data.id,
    slug: '',
    site_name: data.site_name || defaultConfig.site_name,
    site_description: data.site_description || defaultConfig.site_description,
    logo_url: data.logo_url || defaultConfig.logo_url,
    favicon_url: data.favicon_url || defaultConfig.favicon_url,
    login_bg_url: defaultConfig.login_bg_url,
    color_primary: data.color_primary || defaultConfig.color_primary,
    color_primary_dark: data.color_primary_dark || defaultConfig.color_primary_dark,
    color_background: data.color_background || defaultConfig.color_background,
    color_surface: data.color_surface || defaultConfig.color_surface,
    color_accent_teal: data.color_accent_teal || defaultConfig.color_accent_teal,
    color_accent_green: data.color_accent_green || defaultConfig.color_accent_green,
    color_text_primary: data.color_text_primary || defaultConfig.color_text_primary,
    social_whatsapp: data.social_whatsapp,
    social_instagram: data.social_instagram,
    social_telegram: data.social_telegram,
    promotor_link: data.promotor_link,
    active_gateway: data.active_gateway || defaultConfig.active_gateway,
    deposit_min: Number(data.deposit_min) || defaultConfig.deposit_min,
    deposit_max: Number(data.deposit_max) || defaultConfig.deposit_max,
    withdrawal_min: Number(data.withdrawal_min) || defaultConfig.withdrawal_min,
    withdrawal_max: Number(data.withdrawal_max) || defaultConfig.withdrawal_max,
    withdrawal_fee_percent: Number(data.withdrawal_fee_percent) || defaultConfig.withdrawal_fee_percent,
    withdrawal_mode: data.withdrawal_mode || defaultConfig.withdrawal_mode,
    bet_min: Number(data.bet_min) || defaultConfig.bet_min,
    bet_max: Number(data.bet_max) || defaultConfig.bet_max,
    max_payout_per_bet: Number(data.max_payout_per_bet) || defaultConfig.max_payout_per_bet,
    max_payout_daily: Number(data.max_payout_daily) || defaultConfig.max_payout_daily,
    facebook_pixel_id: data.facebook_pixel_id,
    facebook_access_token: data.facebook_access_token,
    google_analytics_id: data.google_analytics_id,
    custom_head_scripts: data.custom_head_scripts,
    utmify_pixel_id: null,
    production_mode: data.production_mode ?? defaultConfig.production_mode,
    layout_id: defaultConfig.layout_id,
  };
}

/**
 * updatePlatformConfig - MULTI-TENANT
 *
 * Atualiza configuracoes da plataforma atual na tabela platforms.
 * Usa service role para bypass de RLS após verificar que o usuário é admin.
 */
export async function updatePlatformConfig(
  updates: Partial<PlatformConfig>
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  // MULTI-TENANT: Obter platform_id da plataforma atual
  const platformId = await getPlatformId();

  // 1. Verificar se o usuário está autenticado e é admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  // 2. Verificar se é admin (qualquer role em admin_roles)
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminRole) {
    return { success: false, error: 'Acesso não autorizado' };
  }

  // Remove id from updates if present (we use it for filtering, not updating)
  const { id, site_name, ...updateData } = updates;

  // Mapear site_name para name (campo na tabela platforms)
  const platformUpdates: Record<string, unknown> = { ...updateData };
  if (site_name !== undefined) {
    platformUpdates.name = site_name;
  }

  // 3. Usar admin client (service role) para fazer o update
  // Isso é necessário porque a RLS da tabela platforms só permite super_admin
  // Mas a verificação de autorização já foi feita acima
  const adminClient = createAdminClient();

  const { error: platformError } = await adminClient
    .from('platforms')
    .update({
      ...platformUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', platformId);

  if (platformError) {
    console.error('Error updating platform:', platformError);
    return { success: false, error: platformError.message };
  }

  // Revalidate ALL pages that use the config
  revalidatePath('/', 'layout');
  revalidatePath('/admin/configuracoes');
  revalidatePath('/login');
  revalidatePath('/cadastro');
  revalidatePath('/apostas/finalizar');
  revalidatePath('/lotinha', 'layout');
  revalidatePath('/quininha', 'layout');
  revalidatePath('/seninha', 'layout');
  revalidatePath('/loterias', 'layout');

  return { success: true };
}
