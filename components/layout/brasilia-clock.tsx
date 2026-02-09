'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function BrasiliaClock() {
  const [hora, setHora] = useState('');

  useEffect(() => {
    const update = () => {
      setHora(
        new Date().toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!hora) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 bg-zinc-900/80 py-1">
      <Clock className="h-3 w-3 text-zinc-500" />
      <span className="text-xs font-medium text-zinc-400">
        {hora} Brasilia
      </span>
    </div>
  );
}
