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
            className="flex min-h-[80px] flex-col items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm p-4 transition-all duration-200 hover:shadow-md hover:border-zinc-300 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 font-bold text-lg text-white">
              {dayNumber}
            </div>
            <span className="mt-2 text-sm font-semibold uppercase text-zinc-700">
              {dayName}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
