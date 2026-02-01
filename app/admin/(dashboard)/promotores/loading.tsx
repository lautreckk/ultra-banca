function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 bg-zinc-700 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-700 rounded w-32" />
        <div className="h-3 bg-zinc-700/50 rounded w-28" />
      </div>
      <div className="hidden md:flex items-center gap-8">
        <div className="h-4 bg-zinc-700 rounded w-16" />
        <div className="h-4 bg-zinc-700 rounded w-16" />
        <div className="h-4 bg-zinc-700 rounded w-16" />
        <div className="h-4 bg-zinc-700 rounded w-20" />
      </div>
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-zinc-700 rounded" />
        <div className="w-8 h-8 bg-zinc-700 rounded" />
      </div>
    </div>
  );
}

export default function PromotoresLoading() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 bg-zinc-700 rounded w-32 mb-2 animate-pulse" />
          <div className="h-4 bg-zinc-700/50 rounded w-64 animate-pulse" />
        </div>
        <div className="h-10 bg-zinc-700 rounded w-36 animate-pulse" />
      </div>

      {/* Config Card */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-700 rounded-full" />
            <div>
              <div className="h-4 bg-zinc-700 rounded w-40 mb-2" />
              <div className="h-3 bg-zinc-700/50 rounded w-64" />
            </div>
          </div>
          <div className="w-12 h-6 bg-zinc-700 rounded-full" />
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 h-12 bg-zinc-800/50 border border-zinc-700/50 rounded-xl animate-pulse" />
        <div className="w-32 h-12 bg-zinc-800/50 border border-zinc-700/50 rounded-xl animate-pulse" />
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-zinc-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-zinc-700 rounded w-32 mb-1" />
                <div className="h-3 bg-zinc-700/50 rounded w-20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-14 bg-zinc-700/50 rounded-xl" />
              <div className="h-14 bg-zinc-700/50 rounded-xl" />
              <div className="h-14 bg-zinc-700/50 rounded-xl" />
              <div className="h-14 bg-zinc-700/50 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700/50">
          <div className="flex items-center gap-4">
            <div className="w-24 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-20 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-20 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-20 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-24 h-4 bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>

      {/* Pagination */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex justify-between items-center">
        <div className="h-4 bg-zinc-700 rounded w-48 animate-pulse" />
        <div className="flex gap-2">
          <div className="w-20 h-8 bg-zinc-700 rounded animate-pulse" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-8 h-8 bg-zinc-700 rounded animate-pulse" />
            ))}
          </div>
          <div className="w-20 h-8 bg-zinc-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
