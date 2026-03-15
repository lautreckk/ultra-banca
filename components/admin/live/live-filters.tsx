'use client';

import { Calendar } from 'lucide-react';

interface Props {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onFilter: () => void;
  onClear: () => void;
  hasFilter: boolean;
}

export function LiveFilters({ dateFrom, dateTo, onDateFromChange, onDateToChange, onFilter, onClear, hasFilter }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const quickSelect = (from: string, to: string) => {
    onDateFromChange(from);
    onDateToChange(to);
    // Auto-filter on quick select
    setTimeout(onFilter, 0);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <div className="flex items-center gap-1.5 text-zinc-400">
        <Calendar className="h-4 w-4" />
        <span className="text-xs font-medium hidden md:inline">Período:</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        />
        <span className="text-zinc-500 text-xs">até</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        />
      </div>

      <button
        onClick={onFilter}
        className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium hover:bg-indigo-500/30 transition-colors"
      >
        Filtrar
      </button>

      {hasFilter && (
        <button
          onClick={onClear}
          className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-medium hover:bg-zinc-700 transition-colors"
        >
          Limpar
        </button>
      )}

      <div className="flex items-center gap-1 ml-auto md:ml-0">
        <button
          onClick={() => quickSelect(today, today)}
          className="px-2.5 py-1 bg-zinc-800/50 text-zinc-400 rounded-md text-xs hover:bg-zinc-800 hover:text-white transition-colors"
        >
          Hoje
        </button>
        <button
          onClick={() => quickSelect(sevenDaysAgo, today)}
          className="px-2.5 py-1 bg-zinc-800/50 text-zinc-400 rounded-md text-xs hover:bg-zinc-800 hover:text-white transition-colors"
        >
          7 dias
        </button>
        <button
          onClick={() => quickSelect(thirtyDaysAgo, today)}
          className="px-2.5 py-1 bg-zinc-800/50 text-zinc-400 rounded-md text-xs hover:bg-zinc-800 hover:text-white transition-colors"
        >
          30 dias
        </button>
      </div>
    </div>
  );
}
