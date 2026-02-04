export type LayoutId = 1 | 2 | 3;
export type LayoutKey = 'default' | 'modern' | 'elite';

export const LAYOUT_MAP: Record<LayoutId, LayoutKey> = {
  1: 'default',
  2: 'modern',
  3: 'elite',
};

export interface LayoutInfo {
  id: LayoutId;
  key: LayoutKey;
  name: string;
  description: string;
  preview: string;
}

export const LAYOUTS_INFO: Record<LayoutId, LayoutInfo> = {
  1: {
    id: 1,
    key: 'default',
    name: 'Padrao',
    description: 'Mobile-first otimizado',
    preview: '/previews/layout-default.png',
  },
  2: {
    id: 2,
    key: 'modern',
    name: 'Moderno',
    description: 'Estilo cassino com sidebar',
    preview: '/previews/layout-modern.png',
  },
  3: {
    id: 3,
    key: 'elite',
    name: 'Elite',
    description: 'Premium minimalista',
    preview: '/previews/layout-elite.png',
  },
};

export interface LayoutProps {
  children: React.ReactNode;
  saldo: number;
  saldoBonus: number;
  unidade: string;
  onRefresh: () => void;
  loading: boolean;
}
