/**
 * Loading Skeleton - Dashboard do Usuário
 *
 * Estrutura:
 * - Link de convite
 * - Banner último ganhador
 * - Grid 2x2 (Loterias, Fazendinha)
 * - Grid 2x2 (Promotor, Amigos)
 * - Botão Recarga PIX (full width)
 * - Grid 2x2 (Resultados, Saques, Premiadas, Relatórios)
 */

function SkeletonInviteLink() {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm animate-pulse">
      <div className="h-4 w-16 bg-gray-200 rounded" />
      <div className="flex-1 flex items-center gap-2 rounded bg-gray-100 px-2 py-1">
        <div className="flex-1 h-4 bg-gray-200 rounded" />
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function SkeletonWinnerBanner() {
  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-r from-amber-400/60 to-amber-500/60 shadow-lg animate-pulse">
      <div className="flex items-stretch">
        {/* Lado esquerdo - Troféu */}
        <div className="flex flex-col items-center justify-center bg-black/10 px-4 py-3">
          <div className="h-8 w-8 bg-white/30 rounded-full" />
          <div className="mt-1 h-3 w-12 bg-white/30 rounded" />
          <div className="h-3 w-16 bg-white/30 rounded mt-1" />
        </div>
        {/* Divisor */}
        <div className="w-px bg-white/30" />
        {/* Lado direito - Info */}
        <div className="flex flex-1 items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 bg-white/30 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-24 bg-white/30 rounded" />
            <div className="h-3 w-20 bg-white/30 rounded" />
            <div className="h-5 w-16 bg-white/30 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGameCard() {
  return (
    <div className="aspect-square overflow-hidden rounded-xl bg-gray-200 shadow-lg animate-pulse" />
  );
}

function SkeletonActionCard({ color = 'bg-gray-300' }: { color?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-xl ${color} py-6 shadow-lg animate-pulse`}>
      <div className="h-8 w-8 bg-white/30 rounded-full" />
      <div className="h-4 w-20 bg-white/30 rounded" />
    </div>
  );
}

function SkeletonFullWidthButton() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl bg-teal-400/60 py-6 shadow-lg animate-pulse">
      <div className="h-8 w-8 bg-white/30 rounded-full" />
      <div className="h-6 w-28 bg-white/30 rounded" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-4 px-4 py-4">
      {/* Invite Link */}
      <SkeletonInviteLink />

      {/* Último Ganhador Banner */}
      <SkeletonWinnerBanner />

      {/* Game Cards - LOTERIAS & FAZENDINHA */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonGameCard />
        <SkeletonGameCard />
      </div>

      {/* PROMOTOR & Amigos */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonGameCard />
        <div className="aspect-square overflow-hidden rounded-xl bg-gray-700/60 shadow-lg animate-pulse flex flex-col items-center justify-center">
          <div className="h-12 w-12 bg-white/20 rounded-full mb-2" />
          <div className="h-4 w-24 bg-white/20 rounded" />
        </div>
      </div>

      {/* Recarga PIX - Full Width */}
      <SkeletonFullWidthButton />

      {/* Bottom Grid - Resultados, Saques, Premiadas, Relatorios */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonActionCard color="bg-gray-800/60" />
        <SkeletonActionCard color="bg-teal-400/60" />
        <SkeletonActionCard color="bg-gray-800/60" />
        <SkeletonActionCard color="bg-gray-800/60" />
      </div>

      {/* Footer */}
      <div className="py-4 flex justify-center">
        <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
      </div>
    </div>
  );
}
