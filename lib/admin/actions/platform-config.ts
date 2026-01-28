'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PlatformConfig, defaultConfig } from '@/contexts/platform-config-context';

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('platform_config')
    .select('id, site_name, site_description, logo_url, favicon_url, color_primary, color_primary_dark, color_background, color_surface, color_accent_teal, color_accent_green, color_text_primary, social_whatsapp, social_instagram, social_telegram, active_gateway, deposit_min, deposit_max, withdrawal_min, withdrawal_max, withdrawal_fee_percent, withdrawal_mode, bet_min, bet_max, max_payout_per_bet, max_payout_daily, facebook_pixel_id, google_analytics_id, custom_head_scripts')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error fetching platform config:', error);
    return defaultConfig;
  }

  return {
    id: data.id,
    site_name: data.site_name || defaultConfig.site_name,
    site_description: data.site_description || defaultConfig.site_description,
    logo_url: data.logo_url || defaultConfig.logo_url,
    favicon_url: data.favicon_url || defaultConfig.favicon_url,
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
    google_analytics_id: data.google_analytics_id,
    custom_head_scripts: data.custom_head_scripts,
  };
}

export async function updatePlatformConfig(
  updates: Partial<PlatformConfig>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Remove id from updates if present (we use it for filtering, not updating)
  const { id, ...updateData } = updates;

  const { error } = await supabase
    .from('platform_config')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .not('id', 'is', null); // Update the singleton row

  if (error) {
    console.error('Error updating platform config:', error);
    return { success: false, error: error.message };
  }

  // Revalidate pages that use the config
  revalidatePath('/');
  revalidatePath('/admin/configuracoes');

  return { success: true };
}
