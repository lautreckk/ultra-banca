'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getDayName, getNextDays } from '@/lib/utils/format-date';

interface DateSelectorProps {
  baseHref: string;
  daysCount?: number;
  className?: string;
}

export function DateSelector({
  baseHref,
  daysCount = 6,
  className,
}: DateSelectorProps) {
  const dates = getNextDays(daysCount);

  return (
    <div className={cn('grid grid-cols-2 gap-4 px-4', className)}>
      {dates.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayNumber = date.getDate();
        const dayName = getDayName(date);

        return (
          <Link
            key={dateStr}
            href={`${baseHref}/${dateStr}`}
            className="flex min-h-[96px] flex-col items-center justify-center rounded-xl bg-[#1A1F2B] border border-zinc-700/40 shadow-sm p-4 transition-all duration-200 hover:shadow-md hover:border-[#E5A220]/50 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 font-bold text-xl text-white">
              {dayNumber}
            </div>
            <span className="mt-2 text-base font-semibold uppercase text-zinc-300">
              {dayName}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
