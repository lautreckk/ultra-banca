'use server';

import { createClient } from '@/lib/supabase/server';
import { getPlatformId } from '@/lib/utils/platform';

export interface PlatformBanner {
  id: string;
  titulo: string;
  imagem_url: string;
  link_url: string | null;
  ordem: number;
}

export async function getBanners(): Promise<PlatformBanner[]> {
  try {
    const platformId = await getPlatformId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('platform_banners')
      .select('id, titulo, imagem_url, link_url, ordem')
      .eq('platform_id', platformId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('[BANNERS] Error:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[BANNERS] Error:', error);
    return [];
  }
}
