function SkeletonTabs() {
  return (
    <div className="flex gap-2 border-b border-zinc-700/50 pb-4 overflow-x-auto">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-10 bg-zinc-700 rounded-lg w-28 flex-shrink-0 animate-pulse" />
      ))}
    </div>
  );
}

function SkeletonFormField() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 bg-zinc-700 rounded w-24" />
      <div className="h-10 bg-zinc-700/50 rounded-lg" />
    </div>
  );
}

export default function ConfiguracoesLoading() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <div className="h-7 bg-zinc-700 rounded w-40 mb-2 animate-pulse" />
        <div className="h-4 bg-zinc-700/50 rounded w-72 animate-pulse" />
      </div>

      {/* Tabs */}
      <SkeletonTabs />

      {/* Content */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-6">
        <div className="h-6 bg-zinc-700 rounded w-48 mb-6 animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonFormField />
          <SkeletonFormField />
          <SkeletonFormField />
          <SkeletonFormField />
          <SkeletonFormField />
          <SkeletonFormField />
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-700/50 flex justify-end">
          <div className="w-32 h-10 bg-zinc-700 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
