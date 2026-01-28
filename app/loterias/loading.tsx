/**
 * Loading Skeleton - Página de Loterias
 *
 * Estrutura:
 * - Botão "Repetir Pule"
 * - Grid 2x2 de jogos (Loterias, Quininha, Seninha, Lotinha)
 * - Lista de ações (Sonhos, Horóscopo, Calculadora, Atrasados, Tabela de Bichos)
 *
 * Tema: Light/Clean (bg-zinc-50)
 */

function SkeletonRepeatButton() {
  return (
    <div className="w-full rounded-xl border-2 border-amber-500/40 bg-zinc-200 py-3 animate-pulse">
      <div className="h-5 w-32 mx-auto bg-zinc-300 rounded" />
    </div>
  );
}

function SkeletonGameCardImage() {
  return (
    <div className="aspect-square overflow-hidden rounded-xl border-2 border-amber-500/40 bg-zinc-200 animate-pulse">
      <div className="h-full w-full bg-gradient-to-br from-zinc-200 to-zinc-300" />
    </div>
  );
}

function SkeletonGameCardWithText() {
  return (
    <div className="aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm animate-pulse flex flex-col items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 bg-zinc-200 rounded-full" />
        <div className="flex flex-col gap-1">
          <div className="h-5 w-20 bg-zinc-200 rounded" />
          <div className="h-3 w-12 bg-zinc-100 rounded" />
        </div>
      </div>
    </div>
  );
}

function SkeletonActionButton({ color }: { color: string }) {
  return (
    <div className={`flex w-full items-center gap-4 rounded-xl ${color} px-4 py-3 animate-pulse`}>
      <div className="h-6 w-6 bg-white/20 rounded" />
      <div className="h-5 w-28 bg-white/20 rounded" />
    </div>
  );
}

export default function LoteriasLoading() {
  return (
    <div className="bg-zinc-50 min-h-[calc(100vh-8rem)]">
      {/* Repetir Pule Button */}
      <div className="p-4">
        <SkeletonRepeatButton />
      </div>

      {/* Game Cards Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {/* LOTERIAS - Imagem */}
        <SkeletonGameCardImage />

        {/* QUININHA */}
        <SkeletonGameCardWithText />

        {/* SENINHA */}
        <SkeletonGameCardWithText />

        {/* LOTINHA */}
        <SkeletonGameCardWithText />
      </div>

      {/* Action Buttons List */}
      <div className="space-y-2 p-4">
        {/* SONHOS */}
        <SkeletonActionButton color="bg-zinc-700" />

        {/* HOROSCOPO */}
        <SkeletonActionButton color="bg-teal-600/60" />

        {/* CALCULADORA */}
        <SkeletonActionButton color="bg-zinc-600" />

        {/* ATRASADOS */}
        <SkeletonActionButton color="bg-teal-600/60" />

        {/* TABELA DE BICHOS */}
        <SkeletonActionButton color="bg-zinc-700" />
      </div>
    </div>
  );
}
