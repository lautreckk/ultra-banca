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
        secondary: 'bg-zinc-800/50 text-zinc-300',
        outline: 'border border-zinc-700/40 text-zinc-400',
        white: 'bg-white text-zinc-900',
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
