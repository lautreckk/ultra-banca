'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface PlatformConfig {
  id: string;

  // Identidade Visual
  site_name: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;

  // Cores
  color_primary: string;
  color_primary_dark: string;
  color_background: string;
  color_surface: string;
  color_accent_teal: string;
  color_accent_green: string;
  color_text_primary: string;

  // Social
  social_whatsapp: string | null;
  social_instagram: string | null;
  social_telegram: string | null;
  promotor_link: string | null;

  // Financeiro
  active_gateway: string;
  deposit_min: number;
  deposit_max: number;
  withdrawal_min: number;
  withdrawal_max: number;
  withdrawal_fee_percent: number;
  withdrawal_mode: string;

  // Limites de Risco
  bet_min: number;
  bet_max: number;
  max_payout_per_bet: number;
  max_payout_daily: number;

  // Tracking/Marketing
  facebook_pixel_id: string | null;
  facebook_access_token: string | null;
  google_analytics_id: string | null;
  custom_head_scripts: string | null;

  // Segurança
  production_mode: boolean;
}

export const defaultConfig: PlatformConfig = {
  id: '',
  site_name: 'Carregando...',
  site_description: 'Sua banca de apostas online',
  logo_url: '',
  favicon_url: '/favicon.ico',
  color_primary: '#D4A84B',
  color_primary_dark: '#B8923F',
  color_background: '#000000',
  color_surface: '#1A1A1A',
  color_accent_teal: '#5FBDBD',
  color_accent_green: '#1A5125',
  color_text_primary: '#FFFFFF',
  social_whatsapp: null,
  social_instagram: null,
  social_telegram: null,
  promotor_link: null,
  active_gateway: 'bspay',
  deposit_min: 10,
  deposit_max: 10000,
  withdrawal_min: 20,
  withdrawal_max: 5000,
  withdrawal_fee_percent: 0,
  withdrawal_mode: 'manual',
  bet_min: 1,
  bet_max: 1000,
  max_payout_per_bet: 50000,
  max_payout_daily: 100000,
  facebook_pixel_id: null,
  facebook_access_token: null,
  google_analytics_id: null,
  custom_head_scripts: null,
  production_mode: false,
};

const ConfigContext = createContext<PlatformConfig>(defaultConfig);

export function usePlatformConfig() {
  const ctx = useContext(ConfigContext);
  return ctx;
}

export function ConfigProvider({
  config,
  children,
}: {
  config: PlatformConfig;
  children: ReactNode;
}) {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}
