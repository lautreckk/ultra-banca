'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValueSelectorProps {
  value: number;
  onChange: (value: number) => void;
  onModeSelect: (mode: 'todos' | 'cada') => void;
  modalidade: string;
  data: string;
  className?: string;
}

const QUICK_VALUES = [5, 10, 20, 50];

export function ValueSelector({
  value,
  onChange,
  onModeSelect,
  modalidade,
  data,
  className,
}: ValueSelectorProps) {
  const handleQuickAdd = (amount: number) => {
    const newValue = value + amount;
    onChange(newValue);
  };

  const handleClear = () => {
    onChange(0.1);
  };

  // Format value for display
  const displayValue = value.toFixed(2).replace('.', ',');

  return (
    <div className={cn('bg-white min-h-screen', className)}>
      {/* Info Header */}
      <div className="px-4 pt-4">
        {/* LOTERIAS | CENTENA row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">LOTERIAS</h1>
            <p className="text-sm text-gray-500">{data}</p>
          </div>
          <span className="text-lg font-bold text-[#D97706]">{modalidade}</span>
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200 my-3" />
      </div>

      {/* Rounding rules link */}
      <div className="px-4 pb-4">
        <button className="flex items-center gap-2 text-[#3B82F6] text-sm">
          <Info className="h-4 w-4" />
          <span>VER REGRAS DE ARREDONDAMENTO</span>
        </button>
      </div>

      {/* Value Input */}
      <div className="px-4">
        <div className="flex items-center justify-between h-14 px-4 border border-gray-200 rounded-lg bg-white">
          <span className="text-gray-500 font-medium">R$</span>
          <span className="text-xl font-bold text-gray-900">{displayValue}</span>
          <button
            onClick={handleClear}
            className="text-gray-400 text-sm hover:text-gray-600"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Quick Values */}
      <div className="px-4 pt-4">
        <p className="text-sm text-gray-600 mb-2">Valores rápidos:</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_VALUES.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickAdd(amount)}
              className="h-12 border border-gray-300 rounded-lg font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              +{amount}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onModeSelect('todos')}
            className="h-12 bg-zinc-900 rounded-lg font-semibold text-white"
          >
            Todos
          </button>
          <button
            onClick={() => onModeSelect('cada')}
            className="h-12 bg-zinc-900 rounded-lg font-semibold text-white"
          >
            Cada
          </button>
        </div>
      </div>
    </div>
  );
}
