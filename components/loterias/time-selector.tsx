'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HORARIOS } from '@/lib/constants';

interface TimeSelectorProps {
  selectedHorarios: string[];
  onToggle: (horarioId: string) => void;
  className?: string;
}

export function TimeSelector({
  selectedHorarios,
  onToggle,
  className,
}: TimeSelectorProps) {
  return (
    <div className={cn('px-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-zinc-400" />
        <span className="font-semibold text-white">Selecione os horarios</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {HORARIOS.map((horario) => {
          const isSelected = selectedHorarios.includes(horario.id);

          return (
            <button
              key={horario.id}
              onClick={() => onToggle(horario.id)}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg py-3 px-2 transition-all duration-200 active:scale-[0.98]',
                isSelected
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'bg-zinc-800/50 text-white'
              )}
            >
              <span className="font-bold text-sm">{horario.nome}</span>
              <span className="text-xs opacity-80">{horario.horaInicio}</span>
            </button>
          );
        })}
      </div>

      {/* Select All */}
      <button
        onClick={() => {
          const allSelected = HORARIOS.every((h) =>
            selectedHorarios.includes(h.id)
          );
          if (allSelected) {
            HORARIOS.forEach((h) => {
              if (selectedHorarios.includes(h.id)) {
                onToggle(h.id);
              }
            });
          } else {
            HORARIOS.forEach((h) => {
              if (!selectedHorarios.includes(h.id)) {
                onToggle(h.id);
              }
            });
          }
        }}
        className="mt-4 w-full rounded-lg border border-[var(--color-border)] py-3 text-sm font-semibold text-zinc-400 active:bg-zinc-700/30"
      >
        {HORARIOS.every((h) => selectedHorarios.includes(h.id))
          ? 'Desmarcar Todos'
          : 'Selecionar Todos'}
      </button>
    </div>
  );
}
