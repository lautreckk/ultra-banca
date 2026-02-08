'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Moon, Calculator, Clock, Dog, Loader2, X, Repeat } from 'lucide-react';
import { getRecentBets, buildRepeatBetUrl, type BetSummary } from '@/lib/actions/apostas';

export default function LoteriasPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [recentBets, setRecentBets] = useState<BetSummary[]>([]);
  const [selectedBetLoading, setSelectedBetLoading] = useState<string | null>(null);

  const handleRepetirPule = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getRecentBets(20);

      if (!result.success || !result.bets || result.bets.length === 0) {
        setError(result.error || 'Nenhuma aposta encontrada para repetir');
        return;
      }

      setRecentBets(result.bets);
      setShowModal(true);
    } catch (err) {
      setError('Erro ao buscar apostas');
      console.error('Error fetching bets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBet = async (bet: BetSummary) => {
    setSelectedBetLoading(bet.id);
    try {
      const url = await buildRepeatBetUrl(bet);
      router.push(url);
    } catch (err) {
      setError('Erro ao processar aposta');
      console.error('Error building bet URL:', err);
      setSelectedBetLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'loterias': 'LOTERIAS',
      'quininha': 'QUININHA',
      'seninha': 'SENINHA',
      'lotinha': 'LOTINHA',
    };
    return labels[tipo] || tipo.toUpperCase();
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'loterias': 'bg-amber-500',
      'quininha': 'bg-blue-500',
      'seninha': 'bg-green-500',
      'lotinha': 'bg-pink-500',
    };
    return colors[tipo] || 'bg-zinc-500';
  };

  return (
    <div>
      {/* Error Toast */}
      {error && (
        <div className="fixed top-16 left-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="absolute top-2 right-2 text-white/80">
            &times;
          </button>
        </div>
      )}

      {/* Repetir Pule Button */}
      <div className="p-4">
        <button
          onClick={handleRepetirPule}
          disabled={isLoading}
          className="w-full rounded-xl border-2 border-[#E5A220] bg-[#1A1F2B] min-h-[56px] py-3 font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando...
            </>
          ) : (
            'REPETIR PULE'
          )}
        </button>
      </div>

      {/* Game Cards Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {/* LOTERIAS */}
        <Link href="/loterias/loterias" className="block">
          <div className="aspect-square overflow-hidden rounded-xl border-2 border-[#E5A220]">
            <div className="relative h-full w-full">
              <Image
                src="/images/loterias-banner.webp"
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
          <div className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-[#E5A220] bg-[#1A1F2B]">
            <div className="flex items-center gap-1">
              <svg className="h-10 w-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4" />
                <circle cx="6" cy="14" r="3" />
                <circle cx="18" cy="14" r="3" />
                <circle cx="9" cy="20" r="2.5" />
                <circle cx="15" cy="20" r="2.5" />
              </svg>
              <div>
                <p className="text-xl font-bold text-blue-400">QUININHA</p>
                <p className="text-xs text-blue-600">QUINA</p>
              </div>
            </div>
          </div>
        </Link>

        {/* SENINHA */}
        <Link href="/seninha" className="block">
          <div className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-zinc-700/40 bg-[#1A1F2B]">
            <div className="flex items-center gap-1">
              <svg className="h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4" />
                <circle cx="6" cy="14" r="3" />
                <circle cx="18" cy="14" r="3" />
                <circle cx="9" cy="20" r="2.5" />
                <circle cx="15" cy="20" r="2.5" />
              </svg>
              <div>
                <p className="text-xl font-bold text-green-400">SENINHA</p>
                <p className="text-xs text-green-600">MEGA-SENA</p>
              </div>
            </div>
          </div>
        </Link>

        {/* LOTINHA */}
        <Link href="/lotinha" className="block">
          <div className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-zinc-700/40 bg-[#1A1F2B]">
            <div className="flex items-center gap-1">
              <svg className="h-10 w-10 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="8" r="4" />
                <circle cx="6" cy="14" r="3" />
                <circle cx="18" cy="14" r="3" />
                <circle cx="9" cy="20" r="2.5" />
                <circle cx="15" cy="20" r="2.5" />
              </svg>
              <div>
                <p className="text-xl font-bold text-pink-400">LOTINHA</p>
                <p className="text-xs text-pink-600">LOTOFACIL</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Action Buttons List */}
      <div className="space-y-2 p-4">
        {/* SONHOS */}
        <Link href="/sonhos" className="flex w-full items-center gap-4 rounded-xl bg-[#1A1F2B] border border-zinc-700/40 px-4 min-h-[56px] active:scale-[0.98] transition-all">
          <Moon className="h-6 w-6 text-purple-400" />
          <span className="font-semibold text-white">SONHOS</span>
        </Link>

        {/* HOROSCOPO */}
        <Link href="/horoscopo" className="flex w-full items-center gap-4 rounded-xl bg-[#1A1F2B] border border-zinc-700/40 px-4 min-h-[56px] active:scale-[0.98] transition-all">
          <svg className="h-6 w-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="4" />
            <circle cx="15" cy="15" r="4" />
          </svg>
          <span className="font-semibold text-white">HOROSCOPO</span>
        </Link>

        {/* CALCULADORA */}
        <Link href="/calculadora" className="flex w-full items-center gap-4 rounded-xl bg-[#1A1F2B] border border-zinc-700/40 px-4 min-h-[56px] active:scale-[0.98] transition-all">
          <Calculator className="h-6 w-6 text-blue-400" />
          <span className="font-semibold text-white">CALCULADORA</span>
        </Link>

        {/* ATRASADOS */}
        <Link href="/atrasados" className="flex w-full items-center gap-4 rounded-xl bg-[#1A1F2B] border border-zinc-700/40 px-4 min-h-[56px] active:scale-[0.98] transition-all">
          <Clock className="h-6 w-6 text-emerald-400" />
          <span className="font-semibold text-white">ATRASADOS</span>
        </Link>

        {/* TABELA DE BICHOS */}
        <Link href="/tabela-bichos" className="flex w-full items-center gap-4 rounded-xl bg-[#1A1F2B] border border-zinc-700/40 px-4 min-h-[56px] active:scale-[0.98] transition-all">
          <Dog className="h-6 w-6 text-amber-400" />
          <span className="font-semibold text-white">TABELA DE BICHOS</span>
        </Link>
      </div>

      {/* Modal de Seleção de Pule */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#1A1F2B] w-full max-w-lg max-h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700/40 bg-[#1A202C]">
              <h2 className="text-lg font-bold text-white">Selecione um Pule</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Lista de Pules */}
            <div className="flex-1 overflow-y-auto">
              {recentBets.map((bet) => (
                <button
                  key={bet.id}
                  onClick={() => handleSelectBet(bet)}
                  disabled={selectedBetLoading === bet.id}
                  className="w-full flex items-center gap-3 p-4 border-b border-zinc-700/40 hover:bg-zinc-700/50 active:bg-zinc-700/50 transition-colors disabled:opacity-50"
                >
                  {/* Tipo Badge */}
                  <div className={`${getTipoColor(bet.tipo)} px-2 py-1 rounded text-xs font-bold text-white min-w-[70px] text-center`}>
                    {getTipoLabel(bet.tipo)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">#{bet.pule}</span>
                      <span className="text-xs text-zinc-500">{formatDate(bet.created_at)}</span>
                    </div>
                    <div className="text-sm text-zinc-400 mt-0.5">
                      {bet.modalidade.toUpperCase()} - {bet.palpites.length} palpite{bet.palpites.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">
                      {bet.palpites.slice(0, 3).join(', ')}{bet.palpites.length > 3 ? '...' : ''}
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="text-right">
                    <div className="font-bold text-green-600">R$ {formatCurrency(bet.valor_total)}</div>
                    {selectedBetLoading === bet.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-500 ml-auto mt-1" />
                    ) : (
                      <Repeat className="h-4 w-4 text-zinc-500 ml-auto mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-700/40 bg-zinc-800/30">
              <p className="text-xs text-zinc-500 text-center">
                Mostrando os últimos {recentBets.length} pules
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
