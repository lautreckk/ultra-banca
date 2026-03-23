'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  onComplete: () => void;
}

const COUNTDOWN_COLORS = [
  'text-red-500',
  'text-amber-400',
  'text-emerald-400',
];

export function Countdown({ onComplete }: CountdownProps) {
  const [step, setStep] = useState(3);

  useEffect(() => {
    if (step > 0) {
      const timer = setTimeout(() => setStep(step - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 0) {
      const timer = setTimeout(() => onComplete(), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  return (
    <div className="flex items-center justify-center min-h-[300px] relative overflow-hidden">
      {/* Anel expansivo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          key={`ring-${step}`}
          className="countdown-ring absolute w-32 h-32 rounded-full border-2 border-current opacity-30"
          style={{ color: step === 3 ? '#ef4444' : step === 2 ? '#f59e0b' : '#10b981' }}
        />
      </div>

      {step > 0 ? (
        <span
          key={step}
          className={`text-8xl font-black bingo-gaming-font countdown-slam ${COUNTDOWN_COLORS[3 - step]}`}
          style={{ textShadow: '0 0 40px currentColor' }}
        >
          {step}
        </span>
      ) : (
        <span
          key="comecou"
          className="text-4xl md:text-5xl font-black bingo-gaming-font countdown-slam text-emerald-400"
          style={{ textShadow: '0 0 40px rgba(16,185,129,0.6)' }}
        >
          COMECOU!
        </span>
      )}
    </div>
  );
}
