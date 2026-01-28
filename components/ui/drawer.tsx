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
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50',
          'animate-in fade-in duration-200'
        )}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-white pt-safe',
          'animate-in slide-in-from-right duration-300'
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4">
          <span className="font-semibold text-gray-800">{title}</span>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg active:bg-gray-100"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 56px)' }}>
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
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-12 w-full items-center gap-3 px-4 min-h-[44px]',
        'transition-colors duration-200 active:bg-gray-100',
        highlighted ? 'text-[var(--color-accent-orange)]' : 'text-gray-800'
      )}
    >
      {icon && <span className="w-6">{icon}</span>}
      <span className="font-medium">{label}</span>
    </button>
  );
}
