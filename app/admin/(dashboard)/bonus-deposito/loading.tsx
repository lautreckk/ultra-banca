export default function BonusDepositoLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Carregando bônus...</p>
      </div>
    </div>
  );
}
