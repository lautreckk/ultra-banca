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
  PENDING: 'text-amber-600 bg-amber-50',
  PROCESSING: 'text-blue-600 bg-blue-50',
  PAID: 'text-green-600 bg-green-50',
  FAILED: 'text-red-600 bg-red-50',
  REJECTED: 'text-red-600 bg-red-50',
  CANCELLED: 'text-gray-600 bg-gray-50',
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
      <div className="bg-white min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : saques.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Inbox className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              Você ainda não realizou nenhum saque.
            </p>
          </div>
        ) : (
          <div>
            {saques.map((saque) => (
              <div key={saque.id} className="border-b border-gray-200 px-4 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">
                        {keyTypeLabels[saque.tipo_chave] || saque.tipo_chave}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[saque.status] || 'text-gray-600 bg-gray-50'}`}>
                        {statusLabels[saque.status] || saque.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      {maskPixKey(saque.chave_pix, saque.tipo_chave)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(saque.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      {formatCurrency(saque.valor)}
                    </p>
                    <p className="text-xs text-gray-500">
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
        <div className="p-4 sticky bottom-0 bg-white border-t border-gray-100">
          <Link href="/saques/novo">
            <button className="w-full rounded-lg bg-[#1A202C] py-3 font-bold text-white">
              Novo Saque
            </button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
