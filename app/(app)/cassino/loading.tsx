import { Loader2 } from 'lucide-react';

export default function CassinoLoading() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="h-8 w-32 bg-zinc-700/50 rounded animate-pulse" />
      <div className="h-12 bg-zinc-700/50 rounded-lg animate-pulse" />
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-20 bg-zinc-700/50 rounded-full animate-pulse shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl animate-pulse">
            <div className="aspect-[4/3] bg-zinc-700/50" />
            <div className="p-2 space-y-1">
              <div className="h-4 w-3/4 bg-zinc-700/50 rounded" />
              <div className="h-3 w-1/2 bg-zinc-700/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
