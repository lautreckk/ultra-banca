'use client';

import dynamic from 'next/dynamic';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import type { LayoutProps } from '@/lib/layouts/types';

const layouts = {
  1: dynamic(() => import('./default').then((m) => m.DefaultLayout), { ssr: true }),
  2: dynamic(() => import('./modern').then((m) => m.ModernLayout), { ssr: true }),
  3: dynamic(() => import('./elite').then((m) => m.EliteLayout), { ssr: true }),
};

export function LayoutWrapper(props: LayoutProps) {
  const { layout_id } = usePlatformConfig();
  const Layout = layouts[layout_id] || layouts[1];
  return <Layout {...props} />;
}
