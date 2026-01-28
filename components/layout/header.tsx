'use client';

import { ChevronLeft, Home, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePlatformConfig } from '@/contexts/platform-config-context';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function Header({
  title,
  showBack = false,
  showHome = false,
  showMenu = true,
  onMenuClick,
  className,
}: HeaderProps) {
  const router = useRouter();
  const config = usePlatformConfig();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-12 items-center justify-between bg-[#1A202C] px-4 pt-safe',
        className
      )}
    >
      {/* Left: Back or Home */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-lg active:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
        )}
        {showHome && !showBack && (
          <button
            onClick={() => router.push('/')}
            className="flex h-10 w-10 items-center justify-center rounded-lg active:bg-white/10"
          >
            <Home className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Center: Title or Logo */}
      <div className="flex-1 text-center">
        {title ? (
          <h1 className="text-sm font-bold text-white">{title}</h1>
        ) : (
          <span className="text-sm font-bold text-white">{config.site_name.toUpperCase()}</span>
        )}
      </div>

      {/* Right: Menu */}
      <div className="w-10">
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg active:bg-white/10"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
        )}
      </div>
    </header>
  );
}
