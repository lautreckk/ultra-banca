'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Link2, Users, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Amigo {
  id: string;
  nome: string;
  created_at: string;
}

interface Comissao {
  id: string;
  valor_comissao: number;
  created_at: string;
  indicado: {
    nome: string;
  };
}

export default function AmigosPage() {
  const router = useRouter();
  const [codigoConvite, setCodigoConvite] = useState('');
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [totalComissoes, setTotalComissoes] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Buscar codigo_convite do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('codigo_convite')
        .eq('id', user.id)
        .single();

      if (profile?.codigo_convite) {
        setCodigoConvite(profile.codigo_convite);
      }

      // Buscar amigos indicados
      const { data: amigosData } = await supabase
        .from('profiles')
        .select('id, nome, created_at')
        .eq('indicado_por', user.id)
        .order('created_at', { ascending: false });

      if (amigosData) {
        setAmigos(amigosData);
      }

      // Buscar comissões
      const { data: comissoesData } = await supabase
        .from('comissoes_indicacao')
        .select(`
          id,
          valor_comissao,
          created_at,
          indicado:indicado_id(nome)
        `)
        .eq('indicador_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (comissoesData) {
        setComissoes(comissoesData as unknown as Comissao[]);
        const total = comissoesData.reduce((acc, c) => acc + Number(c.valor_comissao), 0);
        setTotalComissoes(total);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = codigoConvite ? `${siteUrl}?p=${codigoConvite}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black px-4">
        <div className="flex h-12 items-center justify-between">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center">
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <span className="text-sm font-bold text-white">AMIGOS</span>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Título e Descrição */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-800">Rede de Amigos (%)</h1>
          <p className="text-gray-600">Aqui você indica e ganha também!</p>
          <p className="text-gray-600">Indique um amigo e ganhe 1% do valor apostado por ele pra sempre!</p>
        </div>

        {/* Link de Convite */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Convidar:</span>
            <button
              onClick={handleCopyLink}
              className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <span className="flex-1 truncate text-left text-sm text-gray-600">{inviteUrl}</span>
              <Link2 className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          {copied && (
            <p className="mt-1 text-xs text-green-600">Link copiado!</p>
          )}
        </div>

        {/* Status de Amigos */}
        <div className="border-t border-gray-200 pt-4">
          {amigos.length === 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="font-semibold text-gray-800">Você ainda não indicou amigos!</span>
              </div>
              <p className="text-gray-600">
                Quanto mais amigos você indicar, maiores serão os seus ganhos!
              </p>
              <p className="text-gray-600">
                Lembre-se, para cada amigo indicado, você ganha 1% sobre as pules deles.
              </p>
              <p className="font-semibold text-gray-800">
                Que tal começar agora? Compartilhe seu link de indicação e veja seus ganhos crescerem!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#1A202C] p-4 text-center">
                  <Users className="mx-auto h-8 w-8 text-white" />
                  <p className="mt-2 text-2xl font-bold text-white">{amigos.length}</p>
                  <p className="text-sm text-gray-400">Amigos</p>
                </div>
                <div className="rounded-lg bg-[#D4A84B] p-4 text-center">
                  <DollarSign className="mx-auto h-8 w-8 text-white" />
                  <p className="mt-2 text-2xl font-bold text-white">
                    R$ {totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-white/80">Total ganho</p>
                </div>
              </div>

              {/* Lista de Amigos */}
              <div>
                <h3 className="mb-2 font-semibold text-gray-800">Seus amigos indicados:</h3>
                <div className="space-y-2">
                  {amigos.map((amigo) => (
                    <div key={amigo.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                      <div>
                        <p className="font-medium text-gray-800">{amigo.nome}</p>
                        <p className="text-xs text-gray-500">
                          Desde {new Date(amigo.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Últimas Comissões */}
              {comissoes.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-800">Últimas comissões:</h3>
                  <div className="space-y-2">
                    {comissoes.map((comissao) => (
                      <div key={comissao.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                        <div>
                          <p className="font-medium text-gray-800">{comissao.indicado?.nome}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(comissao.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="font-bold text-green-600">
                          +R$ {Number(comissao.valor_comissao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Link inferior */}
        <div className="border-t border-gray-200 pt-4">
          <p className="mb-2 text-sm text-gray-500">Clique para copiar:</p>
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <span className="flex-1 truncate text-left text-sm text-gray-600">{inviteUrl}</span>
            <Link2 className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
