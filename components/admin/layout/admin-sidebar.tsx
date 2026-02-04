'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserX,
  Wallet,
  Settings,
  CreditCard,
  Dices,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ticket,
  Trophy,
  CircleDot,
  Shield,
  Loader2,
  Megaphone,
  Calendar,
  CheckCircle,
  MessageSquare,
  Smartphone,
  Zap,
  Send,
  Webhook,
  ExternalLink,
  BarChart3,
  Percent,
  UserPlus,
  Building2,
  Check,
} from 'lucide-react';
import { logoutAdmin } from '@/lib/auth/logout';
import { getUserAdminPlatforms, switchPlatform, getPlatformId } from '@/lib/utils/platform';
import type { Platform } from '@/lib/utils/platform-constants';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; icon?: React.ReactNode }[];
}

const navItems: NavItem[] = [
  // ========== VISÃO GERAL ==========
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },

  // ========== GESTÃO DE USUÁRIOS ==========
  {
    label: 'Clientes',
    href: '/admin/clientes',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Leads Inativos',
    href: '/admin/leads-inativos',
    icon: <UserX className="h-5 w-5" />,
  },
  {
    label: 'Promotores',
    href: '/admin/promotores',
    icon: <UserPlus className="h-5 w-5" />,
  },

  // ========== CORE DO NEGÓCIO ==========
  {
    label: 'Apostas',
    icon: <Receipt className="h-5 w-5" />,
    children: [
      { label: 'Histórico', href: '/admin/apostas', icon: <Ticket className="h-4 w-4" /> },
      { label: 'Loterias', href: '/admin/apostas/loterias', icon: <Trophy className="h-4 w-4" /> },
      { label: 'Sorteios', href: '/admin/apostas/sorteios', icon: <CircleDot className="h-4 w-4" /> },
      { label: 'Modalidades', href: '/admin/modalidades', icon: <Dices className="h-4 w-4" /> },
      { label: 'Resultados', href: '/admin/resultados', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Verificação', href: '/admin/verificacao', icon: <CheckCircle className="h-4 w-4" /> },
    ],
  },

  // ========== FINANCEIRO ==========
  {
    label: 'Financeiro',
    icon: <Wallet className="h-5 w-5" />,
    children: [
      { label: 'Depósitos', href: '/admin/financeiro/depositos', icon: <ArrowDownToLine className="h-4 w-4" /> },
      { label: 'Saques', href: '/admin/financeiro/saques', icon: <ArrowUpFromLine className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Pagamentos',
    icon: <CreditCard className="h-5 w-5" />,
    children: [
      { label: 'Configuração', href: '/admin/pagamentos', icon: <Settings className="h-4 w-4" /> },
      { label: 'BSPay', href: '/admin/pagamentos/bspay', icon: <CreditCard className="h-4 w-4" /> },
      { label: 'WashPay', href: '/admin/pagamentos/washpay', icon: <CreditCard className="h-4 w-4" /> },
    ],
  },

  // ========== MARKETING ==========
  {
    label: 'Bônus Depósito',
    href: '/admin/bonus-deposito',
    icon: <Percent className="h-5 w-5" />,
  },
  {
    label: 'Propaganda',
    href: '/admin/propaganda',
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    label: 'WhatsApp',
    icon: <MessageSquare className="h-5 w-5" />,
    children: [
      { label: 'Dashboard', href: '/admin/whatsapp', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Configuração', href: '/admin/whatsapp/configuracao', icon: <Settings className="h-4 w-4" /> },
      { label: 'Instâncias', href: '/admin/whatsapp/instancias', icon: <Smartphone className="h-4 w-4" /> },
      { label: 'Gatilhos', href: '/admin/whatsapp/gatilhos', icon: <Zap className="h-4 w-4" /> },
      { label: 'Enviar', href: '/admin/whatsapp/enviar', icon: <Send className="h-4 w-4" /> },
    ],
  },

  // ========== TÉCNICO / SISTEMA ==========
  {
    label: 'Integrações',
    icon: <Webhook className="h-5 w-5" />,
    children: [
      { label: 'Webhooks', href: '/admin/webhooks', icon: <ExternalLink className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Configurações',
    icon: <Settings className="h-5 w-5" />,
    children: [
      { label: 'Geral', href: '/admin/configuracoes/geral', icon: <Building2 className="h-4 w-4" /> },
      { label: 'Financeiro', href: '/admin/configuracoes/financeiro', icon: <Wallet className="h-4 w-4" /> },
      { label: 'Apostas', href: '/admin/configuracoes/apostas', icon: <Dices className="h-4 w-4" /> },
      { label: 'Marketing', href: '/admin/configuracoes/marketing', icon: <Megaphone className="h-4 w-4" /> },
      { label: 'Segurança', href: '/admin/configuracoes/seguranca', icon: <Shield className="h-4 w-4" /> },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Platform switcher state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [currentPlatformId, setCurrentPlatformId] = useState<string | null>(null);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const hasMultiplePlatforms = platforms.length > 1;
  const currentPlatform = platforms.find(p => p.id === currentPlatformId);

  useEffect(() => {
    loadPlatforms();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPlatformDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadPlatforms() {
    const [platformsData, platformId] = await Promise.all([
      getUserAdminPlatforms(),
      getPlatformId(),
    ]);
    setPlatforms(platformsData as Platform[]);
    setCurrentPlatformId(platformId);
  }

  async function handleSelectPlatform(platformId: string) {
    if (platformId === currentPlatformId) {
      setPlatformDropdownOpen(false);
      return;
    }

    setSwitchingId(platformId);
    startTransition(async () => {
      const result = await switchPlatform(platformId);
      if (result.success) {
        // Reload completo para atualizar o contexto de plataforma (ConfigProvider)
        window.location.reload();
      } else {
        alert(result.error);
        setSwitchingId(null);
      }
    });
  }

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdmin();
    });
  };

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  // Para itens filhos, usa comparação exata
  const isChildActive = (href: string) => pathname === href;
  // Para itens de nível superior sem filhos, permite match parcial
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isParentActive = (children?: { href: string }[]) =>
    children?.some((child) => pathname === child.href);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-zinc-900 border-r border-zinc-800/50 transition-all duration-300 flex flex-col shrink-0',
          isOpen ? 'w-64' : 'w-0 lg:w-16',
          'lg:static lg:h-full'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'h-16 flex items-center border-b border-zinc-800/50',
          isOpen ? 'px-4 justify-between' : 'justify-center'
        )}>
          {isOpen ? (
            <>
              <span className="text-xl font-bold text-white">Admin</span>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hidden lg:block"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Platform Switcher */}
        {hasMultiplePlatforms && isOpen && (
          <div ref={dropdownRef} className="px-3 py-3 border-b border-zinc-800/50">
            <button
              onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-indigo-500/50 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: currentPlatform?.color_primary || '#6366f1' }}
              >
                {currentPlatform?.logo_url ? (
                  <img
                    src={currentPlatform.logo_url}
                    alt={currentPlatform.name}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  currentPlatform?.name?.charAt(0) || 'B'
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-white text-sm truncate">{currentPlatform?.name || 'Selecionar'}</p>
                <p className="text-xs text-zinc-500 truncate">{currentPlatform?.domain}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform shrink-0 ${platformDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {platformDropdownOpen && (
              <div className="mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                <div className="p-2 border-b border-zinc-800">
                  <p className="text-xs font-medium text-zinc-500 uppercase px-2">Selecionar Banca</p>
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {platforms.map((platform) => {
                    const isSelected = platform.id === currentPlatformId;
                    const isSwitching = switchingId === platform.id;

                    return (
                      <button
                        key={platform.id}
                        onClick={() => handleSelectPlatform(platform.id)}
                        disabled={isPending}
                        className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/50 transition-colors ${isSelected ? 'bg-indigo-500/10' : ''
                          } disabled:opacity-50`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ backgroundColor: platform.color_primary }}
                        >
                          {platform.logo_url ? (
                            <img
                              src={platform.logo_url}
                              alt={platform.name}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            platform.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-white text-sm truncate">{platform.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{platform.domain}</p>
                        </div>
                        {isSwitching ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
                        ) : isSelected ? (
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className={cn('flex-1 py-4 overflow-y-auto', !isOpen && 'hidden lg:block')}>
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                      isActive(item.href)
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                      !isOpen && 'lg:justify-center lg:px-2'
                    )}
                    title={!isOpen ? item.label : undefined}
                  >
                    {item.icon}
                    {isOpen && <span className="font-medium">{item.label}</span>}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                        isParentActive(item.children)
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                        !isOpen && 'lg:justify-center lg:px-2'
                      )}
                      title={!isOpen ? item.label : undefined}
                    >
                      {item.icon}
                      {isOpen && (
                        <>
                          <span className="font-medium flex-1 text-left">{item.label}</span>
                          {expandedItems.includes(item.label) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </button>
                    {isOpen && expandedItems.includes(item.label) && item.children && (
                      <ul className="mt-1 ml-4 space-y-0.5">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm',
                                isChildActive(child.href)
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                              )}
                            >
                              {child.icon}
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className={cn('p-4 border-t border-zinc-800/50', !isOpen && 'hidden lg:block')}>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 disabled:opacity-50',
              !isOpen && 'lg:justify-center lg:px-2'
            )}
            title={!isOpen ? 'Sair' : undefined}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            {isOpen && <span className="font-medium">{isPending ? 'Saindo...' : 'Sair'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
