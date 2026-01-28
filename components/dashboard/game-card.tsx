'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface GameCardProps {
  title: string;
  href: string;
  bgImage?: string;
  bgColor?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function GameCard({
  title,
  href,
  bgImage,
  bgColor = 'bg-[var(--color-surface)]',
  icon,
  className,
}: GameCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'relative aspect-[4/3] overflow-hidden rounded-xl transition-all duration-200 active:scale-[0.98]',
        bgColor,
        className
      )}
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {icon && <div className="mb-2">{icon}</div>}
        <span className="text-lg font-bold text-white text-center drop-shadow-lg">
          {title}
        </span>
      </div>
    </Link>
  );
}
