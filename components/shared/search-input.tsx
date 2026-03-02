'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Pesquisar...',
  className,
}: SearchInputProps) {
  return (
    <div className={cn('px-4 py-2 bg-[#111318] border-b border-zinc-700/40', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-14 min-h-[48px] w-full rounded-xl bg-zinc-900/80 pl-10 pr-4 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
