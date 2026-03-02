function SkeletonCard() {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-zinc-700 rounded-lg" />
        <div className="flex-1">
          <div className="h-5 bg-zinc-700 rounded w-24 mb-2" />
          <div className="h-3 bg-zinc-700/50 rounded w-32" />
        </div>
        <div className="w-16 h-6 bg-zinc-700 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="h-10 bg-zinc-700/50 rounded" />
        <div className="h-10 bg-zinc-700/50 rounded" />
      </div>
      <div className="mt-4 pt-4 border-t border-zinc-700/50 flex justify-end">
        <div className="w-24 h-9 bg-zinc-700 rounded" />
      </div>
    </div>
  );
}

export default function PagamentosLoading() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <div className="h-7 bg-zinc-700 rounded w-36 mb-2 animate-pulse" />
        <div className="h-4 bg-zinc-700/50 rounded w-64 animate-pulse" />
      </div>

      {/* Active Gateway Card */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-zinc-700 rounded w-32" />
          <div className="w-20 h-6 bg-cyan-700/50 rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-zinc-700 rounded-lg" />
          <div>
            <div className="h-6 bg-zinc-700 rounded w-24 mb-2" />
            <div className="h-4 bg-zinc-700/50 rounded w-48" />
          </div>
        </div>
      </div>

      {/* Gateway Cards */}
      <div>
        <div className="h-5 bg-zinc-700 rounded w-48 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
