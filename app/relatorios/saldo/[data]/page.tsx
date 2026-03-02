'use client';

import { useState, useEffect, use } from 'react';
import { PageLayout } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Share2, Loader2 } from 'lucide-react';

interface SaldoData {
  vendas: {
    total: number;
    quantidade: number;
  };
  creditos: number;
  debitos: number;
  premios: number;
  saques: number;
  saldoInicial: number;
  saldoFinal: number;
}

export default function SaldoDetalhadoPage({ params }: { params: Promise<{ data: string }> }) {
  const { data: dataParam } = use(params);
  const [loading, setLoading] = useState(true);
  const [saldoData, setSaldoData] = useState<SaldoData | null>(null);

  const dateDisplay = new Date(dataParam + 'T12:00:00').toLocaleDateString('pt-BR');

  useEffect(() => {
    const fetchSaldoData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get start and end of day
      const startOfDay = `${dataParam}T00:00:00`;
      const endOfDay = `${dataParam}T23:59:59`;

      // Fetch apostas (vendas)
      const { data: apostas } = await supabase
        .from('apostas')
        .select('valor_total, status, premio_valor')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Fetch transactions (depositos/creditos)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, tipo, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Fetch saques
      const { data: saques } = await supabase
        .from('saques')
        .select('valor, status')
        .eq('user_id', user.id)
        .in('status', ['COMPLETED', 'PAID'])
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      // Calculate values
      const vendasTotal = apostas?.reduce((acc, a) => acc + Number(a.valor_total || 0), 0) || 0;
      const vendasCount = apostas?.length || 0;
      const premiosTotal = apostas?.reduce((acc, a) => {
        if (a.status === 'premiada') {
          return acc + Number(a.premio_valor || 0);
        }
        return acc;
      }, 0) || 0;

      const creditos = transactions?.reduce((acc, t) => {
        if (t.tipo === 'deposito') {
          return acc + Number(t.amount || 0);
        }
        return acc;
      }, 0) || 0;

      const saquesTotal = saques?.reduce((acc, s) => acc + Number(s.valor || 0), 0) || 0;

      setSaldoData({
        vendas: {
          total: vendasTotal,
          quantidade: vendasCount,
        },
        creditos,
        debitos: vendasTotal,
        premios: premiosTotal,
        saques: saquesTotal,
        saldoInicial: 0,
        saldoFinal: creditos - vendasTotal + premiosTotal - saquesTotal,
      });

      setLoading(false);
    };

    fetchSaldoData();
  }, [dataParam]);

  const handleShare = async () => {
    if (!saldoData) return;

    const text = `
SALDO - ${dateDisplay}

VENDAS
Total: ${formatCurrency(saldoData.vendas.total)}
Quantidade: ${saldoData.vendas.quantidade} apostas

CREDITO/DEBITO
Creditos (depositos): ${formatCurrency(saldoData.creditos)}
Debitos (apostas): ${formatCurrency(saldoData.debitos)}

DETALHES
Premios ganhos: ${formatCurrency(saldoData.premios)}
Saques realizados: ${formatCurrency(saldoData.saques)}

MOVIMENTACAO DIA
Resultado: ${formatCurrency(saldoData.saldoFinal)}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copiado para a area de transferencia!');
    }
  };

  if (loading) {
    return (
      <PageLayout title="SALDO" showBack>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="SALDO" showBack>
      <div className="space-y-4 p-4">
        {/* Date Header */}
        <div className="rounded-xl bg-zinc-800 border border-zinc-700/40 px-4 py-3 text-center">
          <span className="text-lg font-bold text-white">{dateDisplay}</span>
        </div>

        {/* VENDAS Section */}
        <div className="overflow-hidden rounded-xl bg-[#1A1F2B] border border-zinc-700/40 shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">VENDAS</span>
          </div>
          <div className="divide-y divide-zinc-700/30 px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Total</span>
              <span className="font-semibold text-white">
                {formatCurrency(saldoData?.vendas.total || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Quantidade</span>
              <span className="font-semibold text-white">
                {saldoData?.vendas.quantidade || 0} apostas
              </span>
            </div>
          </div>
        </div>

        {/* CREDITO/DEBITO Section */}
        <div className="overflow-hidden rounded-xl bg-[#1A1F2B] border border-zinc-700/40 shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">CREDITO / DEBITO</span>
          </div>
          <div className="divide-y divide-zinc-700/30 px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Creditos (depositos)</span>
              <span className="font-semibold text-green-600">
                +{formatCurrency(saldoData?.creditos || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Debitos (apostas)</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(saldoData?.debitos || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* DETALHES Section */}
        <div className="overflow-hidden rounded-xl bg-[#1A1F2B] border border-zinc-700/40 shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">DETALHES</span>
          </div>
          <div className="divide-y divide-zinc-700/30 px-4">
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Premios ganhos</span>
              <span className="font-semibold text-green-600">
                +{formatCurrency(saldoData?.premios || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-zinc-400">Saques realizados</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(saldoData?.saques || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* MOVIMENTACAO DIA Section */}
        <div className="overflow-hidden rounded-xl bg-[#1A1F2B] border border-zinc-700/40 shadow-sm">
          <div className="bg-[#E5A220] px-4 py-2">
            <span className="font-bold text-zinc-900">MOVIMENTACAO DIA</span>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Resultado</span>
              <span className={`text-xl font-bold ${(saldoData?.saldoFinal || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldoData?.saldoFinal || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-2 rounded-xl h-14 min-h-[56px] bg-zinc-900 border border-zinc-700/40 text-white font-semibold active:bg-zinc-700 active:scale-[0.98] transition-all"
        >
          <Share2 className="h-5 w-5" />
          <span>Compartilhar</span>
        </button>
      </div>
    </PageLayout>
  );
}
