'use client';

import { useState } from 'react';
import { X, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BetInputProps {
  maxDigits: number;
  palpites: string[];
  onAddPalpite: (palpite: string) => void;
  onRemovePalpite: (palpite: string) => void;
  onSurpresinha: () => void;
  onAvancar: () => void;
  className?: string;
}

export function BetInput({
  maxDigits,
  palpites,
  onAddPalpite,
  onRemovePalpite,
  onSurpresinha,
  onAvancar,
  className,
}: BetInputProps) {
  const [value, setValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input.length <= maxDigits) {
      setValue(input);
    }
  };

  const handleAdd = () => {
    if (value.length === maxDigits && !palpites.includes(value)) {
      onAddPalpite(value);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className={cn('px-4 bg-[#1A1F2B]', className)}>
      {/* Input */}
      <div className="flex gap-2">
        <Input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={`Digite ${maxDigits} numeros`}
          className="flex-1 text-center text-lg font-semibold"
        />
        <Button
          onClick={handleAdd}
          disabled={value.length !== maxDigits}
          className="px-6"
        >
          +
        </Button>
      </div>

      {/* Palpites */}
      {palpites.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {palpites.map((palpite) => (
            <Badge
              key={palpite}
              variant="default"
              className="flex items-center gap-1 pl-3 pr-1 py-1"
            >
              <span>{palpite}</span>
              <button
                onClick={() => onRemovePalpite(palpite)}
                className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Button
          variant="dark"
          onClick={onSurpresinha}
          fullWidth
        >
          <Shuffle className="h-4 w-4" />
          Surpresinha
        </Button>
        <Button
          onClick={onAvancar}
          disabled={palpites.length === 0}
          fullWidth
        >
          Avancar
        </Button>
      </div>
    </div>
  );
}
