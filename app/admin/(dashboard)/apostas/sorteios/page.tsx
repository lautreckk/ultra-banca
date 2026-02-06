'use client';

import { CircleDot, Calendar, Clock, Play } from 'lucide-react';

export default function AdminSorteiosPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Sorteios</h1>
        <p className="text-sm md:text-base text-zinc-500">Gerenciamento de sorteios e resultados</p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-[#374151] rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 rounded-full mb-4">
          <CircleDot className="h-8 w-8 text-cyan-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Em Desenvolvimento</h2>
        <p className="text-zinc-500 max-w-md mx-auto">
          Esta página permitirá gerenciar os sorteios, cadastrar resultados manualmente e visualizar o histórico de resultados.
        </p>
      </div>

      {/* Preview - Today's Draws */}
      <div className="bg-[#374151] rounded-lg p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-400" />
          Sorteios de Hoje
        </h2>

        <div className="space-y-3">
          {[
            { time: '11:00', status: 'completed', result: '1234' },
            { time: '14:00', status: 'completed', result: '5678' },
            { time: '18:00', status: 'pending', result: null },
            { time: '21:00', status: 'pending', result: null },
          ].map((sorteio) => (
            <div
              key={sorteio.time}
              className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-zinc-500" />
                <span className="text-white font-medium">{sorteio.time}</span>
              </div>
              {sorteio.status === 'completed' ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-mono">{sorteio.result}</span>
                  <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Realizado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">Pendente</span>
                  <button className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
