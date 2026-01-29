'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Gift,
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
} from 'lucide-react';
import { logoutAdmin } from '@/lib/auth/logout';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; icon?: React.ReactNode }[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Clientes',
    href: '/admin/clientes',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Financeiro',
    icon: <Wallet className="h-5 w-5" />,
    children: [
      { label: 'Depósitos', href: '/admin/financeiro/depositos', icon: <ArrowDownToLine className="h-4 w-4" /> },
      { label: 'Saques', href: '/admin/financeiro/saques', icon: <ArrowUpFromLine className="h-4 w-4" /> },
    ],
  },
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
  {
    label: 'Pagamentos',
    icon: <CreditCard className="h-5 w-5" />,
    children: [
      { label: 'Configuração', href: '/admin/pagamentos' },
      { label: 'BSPay', href: '/admin/pagamentos/bspay' },
      { label: 'WashPay', href: '/admin/pagamentos/washpay' },
    ],
  },
  {
    label: 'Promoções',
    href: '/admin/promocoes',
    icon: <Gift className="h-5 w-5" />,
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
  {
    label: 'Integracoes',
    icon: <Webhook className="h-5 w-5" />,
    children: [
      { label: 'Webhooks', href: '/admin/webhooks', icon: <ExternalLink className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Auditoria',
    href: '/admin/auditoria',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    label: 'Configurações',
    href: '/admin/configuracoes',
    icon: <Settings className="h-5 w-5" />,
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Financeiro', 'Apostas', 'Pagamentos', 'WhatsApp', 'Integracoes']);
  const [isPending, startTransition] = useTransition();

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
