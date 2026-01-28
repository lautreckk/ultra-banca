'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-110 active:brightness-95',
        secondary: 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 active:bg-zinc-800',
        outline: 'border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white',
        ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-800',
        teal: 'bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20',
        orange: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20',
        white: 'bg-white text-zinc-900 hover:bg-zinc-100',
        dark: 'bg-zinc-900 text-white border border-zinc-800 hover:border-zinc-700',
        danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
      },
      size: {
        default: 'h-12 px-6 min-h-[44px]',
        sm: 'h-10 px-4 min-h-[40px] text-sm',
        lg: 'h-14 px-8 min-h-[56px]',
        icon: 'h-10 w-10 min-h-[40px]',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
