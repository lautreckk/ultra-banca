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
        className="fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-white transition-transform duration-300 ease-out"
        style={{
          transform: isAnimating ? 'translateX(0)' : 'translateX(100%)',
          WebkitTransform: isAnimating ? 'translateX(0)' : 'translateX(100%)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4">
          <span className="font-semibold text-gray-800">{title}</span>
          <button
            onClick={onClose}
            onTouchEnd={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-lg active:bg-gray-100"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{
            height: 'calc(100% - 56px)',
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
        'transition-colors duration-200 active:bg-gray-100',
        highlighted ? 'text-[var(--color-accent-orange)]' : 'text-gray-800'
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {icon && <span className="w-6">{icon}</span>}
      <span className="font-medium">{label}</span>
    </button>
  );
}
