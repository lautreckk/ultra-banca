'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Drawer({ open, onClose, children, title = 'Escolha uma opcao' }: DrawerProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  // Detecta se é desktop
  React.useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  React.useEffect(() => {
    if (open) {
      // Mostrar primeiro, depois animar
      setIsVisible(true);
      // Usar requestAnimationFrame para garantir que o DOM atualize antes da animação
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      document.body.style.overflow = 'hidden';
    } else {
      // Animar primeiro, depois esconder
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Mesmo tempo da animação
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!isVisible) return null;

  // Estilos diferentes para mobile (slide) e desktop (modal centralizado)
  const panelStyle: React.CSSProperties = isDesktop
    ? {
        // Desktop: modal centralizado com fade/scale
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: isAnimating
          ? 'translate(-50%, -50%) scale(1)'
          : 'translate(-50%, -50%) scale(0.95)',
        opacity: isAnimating ? 1 : 0,
        paddingTop: 'env(safe-area-inset-top)',
      }
    : {
        // Mobile: slide da direita
        transform: isAnimating ? 'translateX(0)' : 'translateX(100%)',
        WebkitTransform: isAnimating ? 'translateX(0)' : 'translateX(100%)',
        paddingTop: 'env(safe-area-inset-top)',
      };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black transition-opacity duration-300 ease-out"
        style={{
          opacity: isAnimating ? 0.5 : 0,
          WebkitTapHighlightColor: 'transparent',
        }}
        onClick={onClose}
        onTouchEnd={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          'fixed z-50 bg-[#1A1F2B] transition-all duration-300 ease-out',
          // Mobile: slide from right
          !isDesktop && 'top-0 right-0 bottom-0 w-[280px]',
          // Desktop: centered modal
          isDesktop && 'w-[400px] max-w-[90vw] rounded-xl shadow-2xl max-h-[80vh]'
        )}
        style={panelStyle}
      >
        {/* Header */}
        <div className={cn(
          'flex h-14 items-center justify-between border-b border-zinc-700/40 px-4',
          isDesktop && 'rounded-t-xl'
        )}>
          <span className="font-semibold text-white">{title}</span>
          <button
            onClick={onClose}
            onTouchEnd={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl active:bg-zinc-700/30 active:scale-[0.98] transition-all"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <X className="h-6 w-6 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div
          className={cn(
            'overflow-y-auto overscroll-contain',
            isDesktop && 'rounded-b-xl'
          )}
          style={{
            height: isDesktop ? 'auto' : 'calc(100% - 56px)',
            maxHeight: isDesktop ? 'calc(80vh - 56px)' : undefined,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

interface DrawerItemProps {
  icon?: React.ReactNode;
  label: string;
  highlighted?: boolean;
  onClick?: () => void;
}

export function DrawerItem({ icon, label, highlighted = false, onClick }: DrawerItemProps) {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleClick}
      className={cn(
        'flex h-12 w-full items-center gap-3 px-4 min-h-[48px]',
        'transition-all duration-200 active:bg-zinc-700/30 active:scale-[0.98]',
        highlighted ? 'text-[var(--color-accent-orange)]' : 'text-white'
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {icon && <span className="w-6">{icon}</span>}
      <span className="font-medium">{label}</span>
    </button>
  );
}
