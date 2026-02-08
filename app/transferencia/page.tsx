'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout';
import { ArrowRightLeft, Wallet, Gamepad2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';
import { createClient } from '@/lib/supabase/client';
import { transferBalance } from '@/lib/actions/transfer';

export default function TransferenciaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saldo, setSaldo] = useState(0);
  const [saldoCassino, setSaldoCassino] = useState(0);
  const [direction, setDirection] = useState<'trad_to_cassino' | 'cassino_to_trad'>('trad_to_cassino');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('saldo, saldo_cassino')
          .eq('id', user.id)
          .single();
        if (data) {
          setSaldo(Number(data.saldo) || 0);
          setSaldoCassino(Number(data.saldo_cassino) || 0);
        }
      }
    };
    fetchBalances();
  }, [supabase]);

  const fromWallet = direction === 'trad_to_cassino' ? 'tradicional' : 'cassino';
  const toWallet = direction === 'trad_to_cassino' ? 'cassino' : 'tradicional';
  const fromBalance = direction === 'trad_to_cassino' ? saldo : saldoCassino;
  const toBalance = direction === 'trad_to_cassino' ? saldoCassino : saldo;

  const handleAmountChange = (value: string) => {
    let sanitized = value.replace(/[^\d,\.]/g, '');
    sanitized = sanitized.replace(',', '.');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
    }
    if (sanitized.includes('.')) {
      const [intPart, decPart] = sanitized.split('.');
      sanitized = intPart + '.' + (decPart?.slice(0, 2) || '');
    }
    setAmount(sanitized);
    setError('');
  };

  const handleTransfer = async () => {
    const valorNum = parseFloat(amount);

    if (!valorNum || valorNum <= 0) {
      setError('Informe um valor valido');
      return;
    }

    if (valorNum > fromBalance) {
      setError('Saldo insuficiente');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await transferBalance(valorNum, fromWallet, toWallet);

      if (!result.success) {
        throw new Error(result.error || 'Erro na transferencia');
      }

      // Update local balances
      if (direction === 'trad_to_cassino') {
        setSaldo(prev => prev - valorNum);
        setSaldoCassino(prev => prev + valorNum);
      } else {
        setSaldoCassino(prev => prev - valorNum);
        setSaldo(prev => prev + valorNum);
      }

      setSuccess(true);
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao transferir');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageLayout title="Transferencia" showBack>
        <div className="bg-[#111318] min-h-screen p-4">
          <div className="text-center py-12">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Transferido!</h2>
            <p className="text-zinc-400 mb-6">Saldo transferido com sucesso.</p>

            <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-4 mb-6 max-w-sm mx-auto">
              <div className="flex justify-between py-2 border-b border-zinc-700/40">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-amber-400" />
                  <span className="text-zinc-400">Loterias</span>
                </div>
                <span className="font-bold">{formatCurrency(saldo)}</span>
              </div>
              <div className="flex justify-between py-2">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-purple-400" />
                  <span className="text-zinc-400">Cassino</span>
                </div>
                <span className="font-bold">{formatCurrency(saldoCassino)}</span>
              </div>
            </div>

            <div className="space-y-3 max-w-xs mx-auto">
              <button
                onClick={() => setSuccess(false)}
                className="w-full h-14 min-h-[56px] rounded-xl bg-[#E5A220] font-bold text-zinc-900 active:scale-[0.98] transition-all"
              >
                Nova Transferencia
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full h-14 min-h-[56px] rounded-xl bg-zinc-900 border border-zinc-700/40 font-bold text-zinc-200 active:scale-[0.98] transition-all"
              >
                Voltar ao Inicio
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Transferencia" showBack>
      <div className="bg-[#111318] min-h-screen p-4 space-y-4">
        {/* Direction Selector */}
        <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-4">
          <h3 className="text-sm font-medium text-zinc-200 mb-3">Direcao</h3>

          <div className="flex items-center gap-3">
            {/* From */}
            <div className={`flex-1 rounded-xl p-3 text-center ${
              direction === 'trad_to_cassino' ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-purple-500/20 border border-purple-500/40'
            }`}>
              {direction === 'trad_to_cassino' ? (
                <><Wallet className="h-5 w-5 text-amber-400 mx-auto mb-1" /><span className="text-sm text-amber-400 font-medium">Loterias</span></>
              ) : (
                <><Gamepad2 className="h-5 w-5 text-purple-400 mx-auto mb-1" /><span className="text-sm text-purple-400 font-medium">Cassino</span></>
              )}
              <p className="text-xs text-zinc-500 mt-1">{formatCurrency(fromBalance)}</p>
            </div>

            {/* Arrow / Switch */}
            <button
              onClick={() => setDirection(d => d === 'trad_to_cassino' ? 'cassino_to_trad' : 'trad_to_cassino')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700/40 active:scale-95 transition-all"
              aria-label="Inverter direcao"
            >
              <ArrowRightLeft className="h-4 w-4 text-zinc-400" />
            </button>

            {/* To */}
            <div className={`flex-1 rounded-xl p-3 text-center ${
              direction === 'trad_to_cassino' ? 'bg-purple-500/20 border border-purple-500/40' : 'bg-amber-500/20 border border-amber-500/40'
            }`}>
              {direction === 'trad_to_cassino' ? (
                <><Gamepad2 className="h-5 w-5 text-purple-400 mx-auto mb-1" /><span className="text-sm text-purple-400 font-medium">Cassino</span></>
              ) : (
                <><Wallet className="h-5 w-5 text-amber-400 mx-auto mb-1" /><span className="text-sm text-amber-400 font-medium">Loterias</span></>
              )}
              <p className="text-xs text-zinc-500 mt-1">{formatCurrency(toBalance)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Amount Input */}
        <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-4">
          <label className="block text-sm font-medium text-zinc-200 mb-2">
            Valor da transferencia
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0,00"
              aria-label="Valor"
              className="w-full h-14 min-h-[48px] rounded-xl border border-zinc-700/40 bg-zinc-900/80 pl-12 pr-4 text-lg font-semibold text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base"
            />
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[10, 50, 100, 500].filter(v => v <= fromBalance).map((value) => (
              <button
                key={value}
                onClick={() => { setAmount(value.toString()); setError(''); }}
                className={`h-10 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${
                  amount === value.toString()
                    ? 'bg-[#E5A220] text-zinc-900 font-bold'
                    : 'bg-zinc-900 border border-zinc-700/40 text-zinc-300'
                }`}
              >
                {formatCurrency(value)}
              </button>
            ))}
          </div>

          {/* Transfer all button */}
          {fromBalance > 0 && (
            <button
              onClick={() => { setAmount(fromBalance.toString()); setError(''); }}
              className="w-full mt-2 h-10 rounded-xl bg-zinc-800 border border-zinc-700/40 text-sm text-zinc-400 font-medium active:scale-[0.98] transition-all"
            >
              Transferir tudo ({formatCurrency(fromBalance)})
            </button>
          )}
        </div>

        {/* Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full h-14 min-h-[56px] rounded-xl bg-[#E5A220] font-bold text-zinc-900 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Transferindo...
            </>
          ) : (
            <>
              <ArrowRightLeft className="h-5 w-5" />
              Transferir
            </>
          )}
        </button>

        {/* Info */}
        <div className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-4">
          <h3 className="font-medium text-white mb-2">Sobre as carteiras</h3>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>&#8226; <strong>Loterias:</strong> saldo para apostas no jogo do bicho</li>
            <li>&#8226; <strong>Cassino:</strong> saldo para jogos de cassino</li>
            <li>&#8226; Transferencias sao instantaneas e sem taxa</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
