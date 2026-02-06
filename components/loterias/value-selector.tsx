'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [inputValue, setInputValue] = useState(value.toFixed(2).replace('.', ','));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza quando o valor externo muda (pelos botões rápidos)
  useEffect(() => {
    setInputValue(value.toFixed(2).replace('.', ','));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;

    // Remove tudo que não seja número ou vírgula
    rawValue = rawValue.replace(/[^\d,]/g, '');

    // Garante apenas uma vírgula
    const parts = rawValue.split(',');
    if (parts.length > 2) {
      rawValue = parts[0] + ',' + parts.slice(1).join('');
    }

    // Limita a 2 casas decimais
    if (parts.length === 2 && parts[1].length > 2) {
      rawValue = parts[0] + ',' + parts[1].slice(0, 2);
    }

    setInputValue(rawValue);

    // Converte para número e atualiza
    const numValue = parseFloat(rawValue.replace(',', '.')) || 0;
    if (numValue >= 0) {
      onChange(numValue);
    }
  };

  const handleQuickAdd = (amount: number) => {
    const newValue = value + amount;
    onChange(newValue);
  };

  const handleClear = () => {
    onChange(0.1);
    setInputValue('0,10');
  };

  return (
    <div className={cn('bg-[#1A1F2B] min-h-screen', className)}>
      {/* Info Header */}
      <div className="px-4 pt-4">
        {/* LOTERIAS | CENTENA row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">LOTERIAS</h1>
            <p className="text-sm text-zinc-500">{data}</p>
          </div>
          <span className="text-lg font-bold text-[#D97706]">{modalidade}</span>
        </div>

        {/* Divider */}
        <div className="border-b border-zinc-700/40 my-3" />
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
        <div className="flex items-center justify-between h-14 px-4 border border-zinc-700/40 rounded-xl bg-zinc-900/80">
          <span className="text-zinc-500 font-medium">R$</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleInputChange}
            className="flex-1 text-xl font-bold text-white text-center bg-transparent outline-none"
            placeholder="0,00"
          />
          <button
            onClick={handleClear}
            className="text-zinc-500 text-sm hover:text-zinc-400"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Quick Values */}
      <div className="px-4 pt-4">
        <p className="text-sm text-zinc-400 mb-2">Valores rápidos:</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_VALUES.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickAdd(amount)}
              className="h-14 min-h-[48px] border border-zinc-700/40 rounded-xl font-semibold text-white hover:bg-zinc-700/30 active:bg-zinc-700/30 active:scale-[0.98] transition-all"
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
            className="h-14 min-h-[56px] bg-zinc-900 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
          >
            Todos
          </button>
          <button
            onClick={() => onModeSelect('cada')}
            className="h-14 min-h-[56px] bg-zinc-900 rounded-xl font-semibold text-white active:scale-[0.98] transition-all"
          >
            Cada
          </button>
        </div>
      </div>
    </div>
  );
}
