'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type ActionVariant = 'teal' | 'dark' | 'primary';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  variant?: ActionVariant;
  className?: string;
}

const variantClasses: Record<ActionVariant, string> = {
  teal: 'bg-[var(--color-accent-teal)] text-white',
  dark: 'bg-[var(--color-surface)] text-white',
  primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
};

export function ActionButton({
  icon,
  label,
  href,
  variant = 'dark',
  className,
}: ActionButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-xl p-4',
        'transition-all duration-200 active:scale-[0.98]',
        variantClasses[variant],
        className
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center">{icon}</div>
      <span className="text-sm font-semibold text-center">{label}</span>
    </Link>
  );
}
