function SkeletonCard() {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 animate-pulse border border-zinc-700/50">
      <div className="h-4 bg-zinc-700 rounded w-2/3 mb-3" />
      <div className="h-8 bg-zinc-700 rounded w-1/2 mb-2" />
      <div className="h-3 bg-zinc-700/50 rounded w-1/3" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
      <div className="h-5 bg-zinc-700 rounded w-40 mb-4 animate-pulse" />
      <div className="h-64 bg-zinc-700/30 rounded animate-pulse" />
    </div>
  );
}

function SkeletonLineChart() {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-zinc-700 rounded w-48 animate-pulse" />
        <div className="flex gap-4">
          <div className="h-4 bg-zinc-700 rounded w-20 animate-pulse" />
          <div className="h-4 bg-zinc-700 rounded w-20 animate-pulse" />
        </div>
      </div>
      <div className="h-80 bg-zinc-700/30 rounded animate-pulse" />
    </div>
  );
}

export default function GraficosLoading() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-7 bg-zinc-700 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-zinc-700/50 rounded w-64 animate-pulse" />
        </div>
        <div className="h-10 bg-zinc-700 rounded w-48 animate-pulse" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Profit by Period */}
      <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
        <div className="h-5 bg-zinc-700 rounded w-40 mb-4 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/30">
              <div className="h-4 bg-zinc-700 rounded w-16 mb-2 animate-pulse" />
              <div className="h-8 bg-zinc-700 rounded w-20 mb-1 animate-pulse" />
              <div className="h-3 bg-zinc-700/50 rounded w-24 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Visitor Line Chart */}
      <SkeletonLineChart />
    </div>
  );
}
