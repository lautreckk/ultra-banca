'use client';

import { usePlatformConfig } from '@/contexts/platform-config-context';
import { useEffect } from 'react';

export function ThemeInjector() {
  const config = usePlatformConfig();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', config.color_primary);
    root.style.setProperty('--color-primary-dark', config.color_primary_dark);
    root.style.setProperty('--color-background', config.color_background);
    root.style.setProperty('--color-surface', config.color_surface);
    root.style.setProperty('--color-accent-teal', config.color_accent_teal);
    root.style.setProperty('--color-accent-green', config.color_accent_green);
    root.style.setProperty('--color-text-primary', config.color_text_primary);
  }, [config]);

  return null;
}
