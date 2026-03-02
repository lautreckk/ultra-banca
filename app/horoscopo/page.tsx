'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Share2, ChevronLeft, Menu } from 'lucide-react';
import { SIGNOS, getPrevisaoDoDia, gerarNumerosDoHoroscopo, type Signo } from '@/lib/constants/horoscopo';
import { usePlatformConfig } from '@/contexts/platform-config-context';

// Zodiac sign icons/emojis for display
const SIGNO_IMAGES: Record<string, string> = {
  aries: '♈',
  touro: '♉',
  gemeos: '♊',
  cancer: '♋',
  leao: '♌',
  virgem: '♍',
  libra: '♎',
  escorpiao: '♏',
  sagitario: '♐',
  capricornio: '♑',
  aquario: '♒',
  peixes: '♓',
};

export default function HoroscopoPage() {
  const router = useRouter();
  const config = usePlatformConfig();
  const [selectedSigno, setSelectedSigno] = useState<Signo | null>(null);
  const [previsao, setPrevisao] = useState<string>('');
  const [numeros, setNumeros] = useState<{ grupo: number; dezena: number; centena: number; milhar: number } | null>(null);

  const today = new Date().toLocaleDateString('pt-BR');

  const handleSelectSigno = (signo: Signo) => {
    setSelectedSigno(signo);
    setPrevisao(getPrevisaoDoDia(signo.id));
    setNumeros(gerarNumerosDoHoroscopo(signo.grupo));
  };

  const handleBack = () => {
    if (selectedSigno) {
      setSelectedSigno(null);
      setPrevisao('');
      setNumeros(null);
    } else {
      router.back();
    }
  };

  const handleShare = () => {
    if (navigator.share && selectedSigno && numeros) {
      navigator.share({
        title: `Horóscopo de ${selectedSigno.nome}`,
        text: `${previsao}\n\nNúmeros da sorte:\nGrupo: ${numeros.grupo}\nDezena: ${numeros.dezena}\nCentena: ${numeros.centena}\nMilhar: ${numeros.milhar}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#111318] flex justify-center">
      <div className="w-full max-w-md bg-[#1A202C] min-h-screen shadow-xl flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
          <div className="flex h-12 items-center justify-between">
            <button
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center active:scale-[0.98] transition-all"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <span className="text-base font-bold text-white">{config.site_name.toUpperCase()}</span>
            <button className="flex h-10 w-10 items-center justify-center active:scale-[0.98] transition-all">
              <Menu className="h-5 w-5 text-white" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="bg-[#111318] flex-1 p-4">
        {!selectedSigno ? (
          <>
            {/* Sign Selection */}
            <h1 className="text-xl font-medium text-white mb-6">
              Qual é o seu signo?
            </h1>

            {/* Signs Grid */}
            <div className="grid grid-cols-3 gap-3">
              {SIGNOS.map((signo) => (
                <button
                  key={signo.id}
                  onClick={() => handleSelectSigno(signo)}
                  className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-4 flex flex-col items-center justify-center hover:border-zinc-600 active:scale-[0.98] active:bg-zinc-700/30 transition-all"
                >
                  <span className="text-4xl mb-2 text-orange-500">{SIGNO_IMAGES[signo.id]}</span>
                  <span className="text-sm font-medium text-white">{signo.nome}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Horoscope Result */}
            <div className="bg-[#1A1F2B] rounded-xl border border-zinc-700/40 overflow-hidden">
              {/* Banca Logo */}
              <div className="text-center pt-4 pb-2">
                <span className="text-sm font-bold text-zinc-300">{config.site_name.toUpperCase()}</span>
                <div className="flex justify-center mt-2">
                  {config.logo_url ? (
                    <Image
                      src={config.logo_url}
                      alt={config.site_name}
                      width={96}
                      height={64}
                      className="object-contain"
                      unoptimized={config.logo_url.includes('supabase.co')}
                    />
                  ) : (
                    <div className="w-24 h-16 bg-[#1A202C] rounded-xl flex items-center justify-center">
                      <span className="text-[#E5A220] font-bold text-sm text-center">{config.site_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sign and Date badges */}
              <div className="flex justify-between items-center px-4 py-3">
                <span className="bg-[#1A202C] text-white px-3 py-1 rounded-full text-sm font-medium">
                  {selectedSigno.nome.toUpperCase()}
                </span>
                <span className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded-full text-sm">
                  {today}
                </span>
              </div>

              {/* Content */}
              <div className="px-4 pb-4">
                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-3">
                  Horóscopo do dia
                </h2>

                {/* Prediction */}
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  {previsao}
                </p>

                {/* Animal */}
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">{selectedSigno.bichoEmoji}</div>
                  <span className="font-medium text-white">{selectedSigno.bicho}</span>
                </div>

                {/* Numbers Grid */}
                {numeros && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/40">
                      <div className="text-xs text-zinc-500 font-medium">GRUPO</div>
                      <div className="text-lg font-bold text-white">
                        {numeros.grupo.toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/40">
                      <div className="text-xs text-zinc-500 font-medium">DEZ.</div>
                      <div className="text-lg font-bold text-white">
                        {numeros.dezena.toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/40">
                      <div className="text-xs text-zinc-500 font-medium">CENT.</div>
                      <div className="text-lg font-bold text-white">
                        {numeros.centena.toString().padStart(3, '0')}
                      </div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/40">
                      <div className="text-xs text-zinc-500 font-medium">MILHAR</div>
                      <div className="text-lg font-bold text-white">
                        {numeros.milhar.toString().padStart(4, '0')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="w-full h-14 min-h-[56px] bg-[#3B82F6] rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <Share2 className="h-5 w-5" />
                  Compartilhar
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
