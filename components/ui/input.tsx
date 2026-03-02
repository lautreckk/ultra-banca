'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  dark?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, dark = false, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-14 w-full rounded-xl border px-4 py-3 text-base min-h-[48px] transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-12',
            dark
              ? 'bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-500'
              : 'bg-zinc-800/50 border-zinc-700/40 text-white placeholder:text-zinc-500',
            error && 'ring-2 ring-red-500/20 border-red-500/50',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
