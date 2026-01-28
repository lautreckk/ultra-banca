function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-zinc-700/30 animate-pulse">
      <div className="flex-1">
        <div className="h-4 bg-zinc-700 rounded w-28 mb-1" />
        <div className="h-3 bg-zinc-700/50 rounded w-32" />
      </div>
      <div className="w-20">
        <div className="h-4 bg-zinc-700 rounded w-16 mb-1" />
        <div className="h-3 bg-emerald-700/50 rounded w-20" />
      </div>
      <div className="flex items-center gap-2 w-40">
        <div className="flex-1">
          <div className="h-4 bg-zinc-700/50 rounded w-full mb-1" />
          <div className="h-3 bg-zinc-700/30 rounded w-12" />
        </div>
        <div className="w-8 h-8 bg-zinc-700 rounded" />
      </div>
      <div className="w-20 h-6 bg-zinc-700 rounded-full" />
      <div className="hidden md:block w-28 h-4 bg-zinc-700/50 rounded" />
      <div className="flex gap-2 w-24">
        <div className="w-10 h-8 bg-zinc-700 rounded" />
        <div className="w-10 h-8 bg-zinc-700 rounded" />
      </div>
    </div>
  );
}

export default function SaquesLoading() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <div className="h-7 bg-zinc-700 rounded w-20 mb-2 animate-pulse" />
        <div className="h-4 bg-zinc-700/50 rounded w-64 animate-pulse" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-zinc-700 rounded animate-pulse" />
          <div className="w-12 h-4 bg-zinc-700/50 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 md:h-8 bg-zinc-700 rounded-lg w-full sm:w-24 animate-pulse" />
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="h-12 bg-zinc-800/50 border border-zinc-700/50 rounded-lg animate-pulse" />

      {/* Table */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700/50">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-zinc-700 rounded w-20 animate-pulse" />
            <div className="w-14 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-24 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="hidden md:block w-16 h-4 bg-zinc-700 rounded animate-pulse" />
            <div className="w-16 h-4 bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>

      {/* Pagination */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 flex justify-between items-center">
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
