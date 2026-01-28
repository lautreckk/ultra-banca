'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md font-bold transition-all',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-surface)] text-white',
        primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
        secondary: 'bg-gray-100 text-gray-800',
        outline: 'border border-[var(--color-border)] text-gray-600',
        white: 'bg-white text-[var(--color-surface)]',
      },
      size: {
        default: 'px-3 py-1 text-sm',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-4 py-2 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
