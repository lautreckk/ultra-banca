'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Moon, Calculator, Clock, Dog } from 'lucide-react';

export default function LoteriasPage() {
  return (
    <div>
      {/* Repetir Pule Button */}
      <div className="p-4">
        <button className="w-full rounded-lg border-2 border-[#E5A220] bg-[#1A202C] py-3 font-bold text-white">
          REPETIR PULE
        </button>
      </div>

      {/* Game Cards Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {/* LOTERIAS */}
        <Link href="/loterias/loterias" className="block">
          <div className="aspect-square overflow-hidden rounded-lg border-2 border-[#E5A220]">
            <div className="relative h-full w-full">
              <Image
                src="/images/LOTERIAS.webp"
                alt="Loterias"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </Link>

        {/* QUININHA */}
        <Link href="/quininha" className="block">
          <div className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-[#E5A220] bg-white">
            <div className="flex items-center gap-1">
              <svg className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4" />
                <circle cx="6" cy="14" r="3" />
                <circle cx="18" cy="14" r="3" />
                <circle cx="9" cy="20" r="2.5" />
                <circle cx="15" cy="20" r="2.5" />
              </svg>
              <div>
                <p className="text-xl font-bold text-blue-800">QUININHA</p>
                <p className="text-xs text-blue-600">QUINA</p>
              </div>
            </div>
          </div>
        </Link>

        {/* SENINHA */}
        <Link href="/seninha" className="block">
          <div className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-white">
            <div className="flex items-center gap-1">
              <svg className="h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4" />
                <circle cx="6" cy="14" r="3" />
                <circle cx="18" cy="14" r="3" />
                <circle cx="9" cy="20" r="2.5" />
                <circle cx="15" cy="20" r="2.5" />
              </svg>
              <div>
                <p className="text-xl font-bold text-green-800">SENINHA</p>
                <p className="text-xs text-green-600">MEGA-SENA</p>
              </div>
            </div>
          </div>
        </Link>

        {/* LOTINHA */}
        <Link href="/lotinha" className="block">
          <div className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-white">
            <div className="flex items-center gap-1">
              <svg className="h-10 w-10 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4" />
                <circle cx="6" cy="14" r="3" />
                <circle cx="18" cy="14" r="3" />
                <circle cx="9" cy="20" r="2.5" />
                <circle cx="15" cy="20" r="2.5" />
              </svg>
              <div>
                <p className="text-xl font-bold text-pink-800">LOTINHA</p>
                <p className="text-xs text-pink-600">LOTOFACIL</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Action Buttons List */}
      <div className="space-y-2 p-4">
        {/* SONHOS */}
        <Link href="/sonhos" className="flex w-full items-center gap-4 rounded-lg bg-[#2D3748] px-4 py-3">
          <Moon className="h-6 w-6 text-white" />
          <span className="font-semibold text-white">SONHOS</span>
        </Link>

        {/* HOROSCOPO */}
        <Link href="/horoscopo" className="flex w-full items-center gap-4 rounded-lg bg-[#4FD1C5] px-4 py-3">
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="4" />
            <circle cx="15" cy="15" r="4" />
          </svg>
          <span className="font-semibold text-white">HOROSCOPO</span>
        </Link>

        {/* CALCULADORA */}
        <Link href="/calculadora" className="flex w-full items-center gap-4 rounded-lg bg-[#718096] px-4 py-3">
          <Calculator className="h-6 w-6 text-white" />
          <span className="font-semibold text-white">CALCULADORA</span>
        </Link>

        {/* ATRASADOS */}
        <Link href="/atrasados" className="flex w-full items-center gap-4 rounded-lg bg-[#4FD1C5] px-4 py-3">
          <Clock className="h-6 w-6 text-white" />
          <span className="font-semibold text-white">ATRASADOS</span>
        </Link>

        {/* TABELA DE BICHOS */}
        <Link href="/tabela-bichos" className="flex w-full items-center gap-4 rounded-lg bg-[#2D3748] px-4 py-3">
          <Dog className="h-6 w-6 text-white" />
          <span className="font-semibold text-white">TABELA DE BICHOS</span>
        </Link>
      </div>
    </div>
  );
}
