'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface BingoButtonProps {
  disabled: boolean;
  allMarked: boolean;
  onCall: () => Promise<{ success: boolean; error?: string }>;
}

export function BingoButton({ disabled, allMarked, onCall }: BingoButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await onCall();
      if (!result.success) {
        setError(result.error || 'Bingo invalido! Confira sua cartela.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <button
        disabled
        className="h-16 w-full rounded-2xl bg-red-500/80 text-white text-lg font-black uppercase tracking-widest border-b-4 border-red-800"
      >
        Bingo invalido!
      </button>
    );
  }

  if (loading) {
    return (
      <button
        disabled
        className="h-16 w-full rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-black text-lg font-black uppercase tracking-widest cursor-wait flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.4)]"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        Verificando...
      </button>
    );
  }

  if (disabled || !allMarked) {
    return (
      <button
        disabled
        className="h-16 w-full rounded-2xl bg-white/5 text-white/20 text-xl font-black bingo-gaming-font uppercase tracking-widest border border-white/5 cursor-not-allowed"
      >
        BINGO!
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="h-16 w-full rounded-2xl bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 shadow-[0_4px_15px_rgba(234,179,8,0.4)] border-b-4 border-yellow-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center bingo-pulse"
    >
      <span className="text-xl font-black text-black bingo-gaming-font uppercase tracking-[0.3em]">BINGO!</span>
    </button>
  );
}
