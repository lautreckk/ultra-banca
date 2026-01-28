'use client';

import { useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ModalVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  isLoading?: boolean;
}

const variantConfig: Record<ModalVariant, { icon: typeof AlertTriangle; color: string }> = {
  danger: { icon: AlertTriangle, color: 'text-red-500' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500' },
  success: { icon: CheckCircle, color: 'text-green-500' },
  info: { icon: Info, color: 'text-blue-500' },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isLoading = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const { icon: Icon, color } = variantConfig[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-[#1f2937] rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div className={cn('p-3 rounded-full bg-gray-800 mb-4', color)}>
            <Icon className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              fullWidth
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === 'danger' ? 'orange' : 'teal'}
              fullWidth
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processando...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
