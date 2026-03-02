'use client';

import { Trophy, Clock, Calendar } from 'lucide-react';

export default function AdminLoteriasPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Loterias</h1>
        <p className="text-sm md:text-base text-zinc-500">Gerenciamento de loterias disponíveis</p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-[#374151] rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 rounded-full mb-4">
          <Trophy className="h-8 w-8 text-cyan-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Em Desenvolvimento</h2>
        <p className="text-zinc-500 max-w-md mx-auto">
          Esta página permitirá gerenciar as loterias disponíveis na plataforma, incluindo horários de sorteio e configurações.
        </p>
      </div>

      {/* Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['PTM', 'PT', 'PTV', 'PTN', 'Federal', 'Loteria de SP'].map((loteria) => (
          <div key={loteria} className="bg-[#374151] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-white">{loteria}</span>
              <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Ativo</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Clock className="h-4 w-4" />
              <span>Horário: 11:00 / 14:00 / 18:00 / 21:00</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
