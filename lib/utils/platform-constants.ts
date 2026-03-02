/**
 * DEFAULT_PLATFORM_ID
 *
 * ID da plataforma padrão (Banca Pantanal).
 * Este é o mesmo ID do platform_config original.
 * Usado como fallback quando não há platform_id no cookie.
 */
export const DEFAULT_PLATFORM_ID = 'ff61b7a2-1098-4bc4-99c5-5afb600fbc57';

export const ALL_PLATFORMS_ID = 'all';

export interface Platform {
  id: string;
  domain: string;
  slug: string;
  name: string;
  site_description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  color_primary: string;
  color_primary_dark: string;
  color_background: string;
  color_surface: string;
  color_accent_teal: string;
  color_accent_green: string;
  color_text_primary: string;
  social_whatsapp: string | null;
  social_instagram: string | null;
  social_telegram: string | null;
  active_gateway: string;
  gateway_credentials: Record<string, unknown>;
  deposit_min: number;
  deposit_max: number;
  withdrawal_min: number;
  withdrawal_max: number;
  withdrawal_fee_percent: number;
  withdrawal_mode: string;
  bet_min: number;
  bet_max: number;
  max_payout_per_bet: number;
  max_payout_daily: number;
  facebook_pixel_id: string | null;
  facebook_access_token: string | null;
  google_analytics_id: string | null;
  custom_head_scripts: string | null;
  promotor_link: string | null;
  comissao_promotor_automatica: boolean;
  production_mode: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}
