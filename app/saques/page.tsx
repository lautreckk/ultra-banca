'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout';
import { formatCurrency } from '@/lib/utils/format-currency';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Inbox } from 'lucide-react';

interface Saque {
  id: string;
  tipo_chave: string;
  chave_pix: string;
  status: string;
  valor: number;
  valor_liquido: number;
  taxa: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10',
  PROCESSING: 'text-blue-400 bg-blue-500/10',
  PAID: 'text-green-400 bg-green-500/10',
  FAILED: 'text-red-400 bg-red-500/10',
  REJECTED: 'text-red-400 bg-red-500/10',
  CANCELLED: 'text-zinc-400 bg-zinc-800/30',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Aguardando',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  REJECTED: 'Recusado',
  CANCELLED: 'Cancelado',
};

const keyTypeLabels: Record<string, string> = {
  cpf: 'CPF',
  telefone: 'Telefone',
  email: 'E-mail',
  aleatoria: 'Chave aleatória',
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', ' -');
}

function maskPixKey(key: string, type: string): string {
  if (type === 'cpf') {
    return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.**$4');
  }
  if (type === 'email') {
    const [name, domain] = key.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  if (type === 'telefone') {
    return key.replace(/(\d{2})(\d{5})(\d{4})/, '($1) *****-$3');
  }
  return `${key.slice(0, 8)}...`;
}

export default function SaquesPage() {
  const [saques, setSaques] = useState<Saque[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchSaques = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('saques')
          .select('id, tipo_chave, chave_pix, status, valor, valor_liquido, taxa, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setSaques(data);
        }
      }
      setLoading(false);
    };

    fetchSaques();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('saques-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saques' },
        () => {
          fetchSaques();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <PageLayout title="SAQUES">
      <div className="bg-[#111318] min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-zinc-500 animate-spin" />
          </div>
        ) : saques.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Inbox className="h-16 w-16 text-zinc-600 mb-4" />
            <p className="text-zinc-500 text-center">
              Você ainda não realizou nenhum saque.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {saques.map((saque) => (
              <div key={saque.id} className="bg-[#1A1F2B] border border-zinc-700/40 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {keyTypeLabels[saque.tipo_chave] || saque.tipo_chave}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[saque.status] || 'text-zinc-400 bg-zinc-800/30'}`}>
                        {statusLabels[saque.status] || saque.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-1">
                      {maskPixKey(saque.chave_pix, saque.tipo_chave)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(saque.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      {formatCurrency(saque.valor)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Líquido: {formatCurrency(saque.valor_liquido)}
                    </p>
                    {saque.taxa > 0 && (
                      <p className="text-xs text-red-500">
                        Taxa: -{formatCurrency(saque.taxa)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Withdraw Button */}
        <div className="p-4 sticky bottom-0 bg-[#111318] border-t border-zinc-700/40">
          <Link href="/saques/novo">
            <button className="w-full h-14 min-h-[56px] rounded-xl bg-[#E5A220] font-bold text-zinc-900 active:scale-[0.98] transition-all" aria-label="Novo saque">
              Novo Saque
            </button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
