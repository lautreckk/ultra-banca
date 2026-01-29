'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, X, Share2, ChevronLeft, Menu } from 'lucide-react';
import { searchSonhos, getSonhoByPalavra, gerarNumerosDoSonho, type Sonho } from '@/lib/constants/sonhos';
import { usePlatformConfig } from '@/contexts/platform-config-context';

export default function SonhosPage() {
  const router = useRouter();
  const config = usePlatformConfig();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Sonho[]>([]);
  const [selectedSonho, setSelectedSonho] = useState<Sonho | null>(null);
  const [numeros, setNumeros] = useState<{ grupo: number; dezena: number; centena: number; milhar: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      const results = searchSonhos(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSelectSonho = (sonho: Sonho) => {
    setQuery(sonho.palavra);
    setSelectedSonho(sonho);
    setShowSuggestions(false);
    setNumeros(gerarNumerosDoSonho(sonho.grupo));
  };

  const handleClear = () => {
    setQuery('');
    setSelectedSonho(null);
    setNumeros(null);
    setSuggestions([]);
  };

  const handleShare = () => {
    if (navigator.share && selectedSonho && numeros) {
      navigator.share({
        title: `Sonho: ${selectedSonho.palavra}`,
        text: `${selectedSonho.descricao}\n\nNúmeros da sorte:\nGrupo: ${numeros.grupo}\nDezena: ${numeros.dezena}\nCentena: ${numeros.centena}\nMilhar: ${numeros.milhar}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#1A202C]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1A202C] px-4">
        <div className="flex h-12 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">{config.site_name.toUpperCase()}</span>
          <button className="flex h-10 w-10 items-center justify-center">
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="bg-white min-h-screen p-4">
        {/* Title */}
        <h1 className="text-xl font-medium text-gray-900 mb-4 italic">
          Hoje sonhei com...
        </h1>

        {/* Search Input */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o que sonhou..."
              className="w-full h-12 pl-10 pr-10 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-400"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10">
              {suggestions.map((sonho) => (
                <button
                  key={sonho.id}
                  onClick={() => handleSelectSonho(sonho)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0"
                >
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{sonho.palavra}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Result Card */}
        {selectedSonho && numeros && (
          <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
            {/* Selected Word Header */}
            <div className="bg-[#1A202C] px-4 py-3">
              <span className="text-white font-bold text-lg">{selectedSonho.palavra}</span>
            </div>

            {/* Card Content */}
            <div className="p-4">
              {/* Banca Logo */}
              <div className="text-center mb-4">
                <span className="text-sm font-bold text-gray-700">{config.site_name.toUpperCase()}</span>
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
                    <div className="w-24 h-16 bg-[#1A202C] rounded-lg flex items-center justify-center">
                      <span className="text-[#E5A220] font-bold text-sm text-center">{config.site_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm italic mb-6 leading-relaxed">
                {selectedSonho.descricao}
              </p>

              {/* Animal */}
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{selectedSonho.bichoEmoji}</div>
                <span className="font-bold text-gray-900">{selectedSonho.bicho}</span>
              </div>

              {/* Numbers Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-medium">GRUPO</div>
                  <div className="text-lg font-bold text-gray-900">{numeros.grupo}</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-medium">DEZ.</div>
                  <div className="text-lg font-bold text-gray-900">{numeros.dezena.toString().padStart(2, '0')}</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-medium">CENT.</div>
                  <div className="text-lg font-bold text-gray-900">{numeros.centena.toString().padStart(3, '0')}</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-medium">MILHAR</div>
                  <div className="text-lg font-bold text-gray-900">{numeros.milhar.toString().padStart(4, '0')}</div>
                </div>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="w-full h-12 bg-[#3B82F6] rounded-lg font-semibold text-white flex items-center justify-center gap-2"
              >
                <Share2 className="h-5 w-5" />
                Compartilhar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
