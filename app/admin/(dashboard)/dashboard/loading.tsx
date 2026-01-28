function SkeletonCard() {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 animate-pulse border border-zinc-700/50">
      <div className="h-4 bg-zinc-700 rounded w-2/3 mb-3" />
      <div className="h-8 bg-zinc-700 rounded w-1/2 mb-2" />
      <div className="h-3 bg-zinc-700/50 rounded w-1/3" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-zinc-800/50 rounded-lg overflow-hidden border border-zinc-700/50">
      <div className="px-4 py-3 border-b border-zinc-700/50 flex justify-between items-center">
        <div className="h-5 bg-zinc-700 rounded w-40 animate-pulse" />
        <div className="h-4 bg-zinc-700 rounded w-16 animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-zinc-700/50 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <div className="h-7 bg-zinc-700 rounded w-32 mb-2 animate-pulse" />
        <div className="h-4 bg-zinc-700/50 rounded w-48 animate-pulse" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SkeletonTable />
        <SkeletonTable />
      </div>

      {/* Pending Withdrawals */}
      <SkeletonTable />
    </div>
  );
}
