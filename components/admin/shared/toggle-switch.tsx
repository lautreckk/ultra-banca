'use client';

import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
}: ToggleSwitchProps) {
  const sizeStyles = {
    sm: { track: 'w-8 h-4', thumb: 'h-3 w-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'h-5 w-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'h-6 w-6', translate: 'translate-x-7' },
  };

  const styles = sizeStyles[size];

  return (
    <label
      className={cn(
        'flex items-center gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900',
          styles.track,
          checked ? 'bg-cyan-600' : 'bg-zinc-600'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow transform transition-transform',
            styles.thumb,
            checked ? styles.translate : 'translate-x-0.5'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-white">{label}</span>
          )}
          {description && (
            <span className="text-xs text-zinc-400">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
