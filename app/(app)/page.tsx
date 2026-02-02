'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Link2, Trophy, FileText, Droplets } from 'lucide-react';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { createClient } from '@/lib/supabase/client';
import { useAdPopup } from '@/hooks/use-ad-popup';
import { AdPopup } from '@/components/shared/ad-popup';

interface UltimoGanhador {
  unidade: string;
  valor: number;
  data_hora: string;
}

// Gera um ganhador fake baseado na data atual
// A unidade é consistente durante o dia (baseada em seed do dia)
function gerarGanhadorDoDia(): UltimoGanhador {
  const hoje = new Date();

  // Seed baseado na data (ano + mês + dia) para consistência diária
  const seed = hoje.getFullYear() * 10000 + (hoje.getMonth() + 1) * 100 + hoje.getDate();

  // Gera unidade de 1 a 200 baseada no seed
  const unidade = (seed % 200) + 1;

  // Horário aleatório mas consistente (baseado no seed)
  const hora = (seed % 12) + 8; // Entre 8h e 19h
  const minuto = seed % 60;

  // Data de hoje com horário gerado
  const dataHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), hora, minuto);

  return {
    unidade: String(unidade),
    valor: 1000,
    data_hora: dataHora.toISOString(),
  };
}

export default function DashboardPage() {
  const [copied, setCopied] = useState(false);
  const [codigoConvite, setCodigoConvite] = useState('');
  const [ultimoGanhador, setUltimoGanhador] = useState<UltimoGanhador | null>(null);
  const config = usePlatformConfig();
  const { currentAd, isVisible, showAd, closeAd } = useAdPopup('login');

  useEffect(() => {
    const supabase = createClient();

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('codigo_convite')
          .eq('id', user.id)
          .single();
        if (data?.codigo_convite) {
          setCodigoConvite(data.codigo_convite);
        }
      }

      // Buscar último ganhador real do banco
      const { data: ganhador } = await supabase
        .from('ultimo_ganhador')
        .select('unidade, valor, data_hora')
        .limit(1)
        .single();

      if (ganhador) {
        // Tem ganhador real, usa ele
        setUltimoGanhador(ganhador);
      } else {
        // Não tem ganhador ainda, usa fake do dia
        setUltimoGanhador(gerarGanhadorDoDia());
      }
    };

    fetchData();

    // Subscribe para atualizações em tempo real
    const channel = supabase
      .channel('ultimo-ganhador-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ultimo_ganhador',
        },
        (payload) => {
          if (payload.new) {
            setUltimoGanhador(payload.new as UltimoGanhador);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Show ad popup after login (with delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      showAd();
    }, 1000);
    return () => clearTimeout(timer);
  }, [showAd]);

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = codigoConvite ? `${siteOrigin}?p=${codigoConvite}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Invite Link */}
      <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
        <span className="text-sm text-gray-500">Convidar:</span>
        <div className="flex flex-1 items-center gap-2 rounded bg-gray-100 px-2 py-1">
          <span className="flex-1 truncate text-sm text-gray-600">{inviteUrl}</span>
          <button
            onClick={handleCopyLink}
            className="text-gray-400 hover:text-gray-600"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Último Ganhador */}
      {ultimoGanhador && (
        <div className="overflow-hidden rounded-xl bg-gradient-to-r from-[#D4A84B] to-[#B8923F] shadow-lg">
          <div className="flex items-stretch">
            {/* Lado esquerdo - Troféu */}
            <div className="flex flex-col items-center justify-center bg-black/10 px-4 py-3">
              <Trophy className="h-8 w-8 text-white" />
              <span className="mt-1 text-xs font-bold text-white">ÚLTIMO</span>
              <span className="text-xs font-bold text-white">GANHADOR</span>
            </div>
            {/* Divisor */}
            <div className="w-px bg-white/30" />
            {/* Lado direito - Info */}
            <div className="flex flex-1 items-center gap-3 px-4 py-3">
              <div className="text-3xl">💵</div>
              <div className="flex flex-col">
                <span className="font-bold text-white">
                  Unidade: {ultimoGanhador.unidade}
                </span>
                <span className="text-sm text-white/80">
                  {new Date(ultimoGanhador.data_hora).toLocaleDateString('pt-BR')} {new Date(ultimoGanhador.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-lg font-bold text-[#1A5125]">
                  R$ {ultimoGanhador.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Cards - LOTERIAS & FAZENDINHA */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/loterias" className="block overflow-hidden rounded-xl shadow-lg active:scale-[0.98]">
          <div className="relative aspect-square">
            <Image
              src="/images/LOTERIAS.webp"
              alt="Loterias"
              fill
              className="object-cover"
              priority
            />
          </div>
        </Link>

        <Link href="/fazendinha" className="block overflow-hidden rounded-xl shadow-lg active:scale-[0.98]">
          <div className="relative aspect-square">
            <Image
              src="/images/FAZENDINHA2.webp"
              alt="Fazendinha"
              fill
              className="object-cover"
              priority
            />
          </div>
        </Link>
      </div>

      {/* PROMOTOR & Amigos */}
      <div className="grid grid-cols-2 gap-3">
        {config.promotor_link ? (
          <a
            href={config.promotor_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl shadow-lg active:scale-[0.98]"
          >
            <div className="relative aspect-square bg-[#E5A220]">
              <Image
                src="/images/PROMOTOR.webp"
                alt="Promotor"
                fill
                className="object-cover"
              />
            </div>
          </a>
        ) : (
          <div className="block overflow-hidden rounded-xl shadow-lg cursor-default opacity-90">
            <div className="relative aspect-square bg-[#E5A220]">
              <Image
                src="/images/PROMOTOR.webp"
                alt="Promotor"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        <Link href="/amigos" className="block overflow-hidden rounded-xl bg-[#2D3748] shadow-lg active:scale-[0.98]">
          <div className="flex aspect-square flex-col items-center justify-center p-4">
            <svg className="mb-2 h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
            <span className="font-bold text-white">Amigos (R$/%)</span>
          </div>
        </Link>
      </div>

      {/* Recarga PIX - Full Width */}
      <Link href="/recarga-pix" className="block">
        <div className="flex items-center justify-center gap-3 rounded-xl bg-[#4FD1C5] py-6 shadow-lg active:scale-[0.98]">
          <Droplets className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">Recarga PIX</span>
        </div>
      </Link>

      {/* Bottom Grid - Resultados, Saques, Premiadas, Relatorios */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/resultados" className="block">
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[#1A202C] py-6 shadow-lg active:scale-[0.98]">
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span className="font-semibold text-white">Resultados</span>
          </div>
        </Link>

        <Link href="/saques" className="block">
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[#4FD1C5] py-6 shadow-lg active:scale-[0.98]">
            <Droplets className="h-8 w-8 text-white" />
            <span className="font-semibold text-white">Saques</span>
          </div>
        </Link>

        <Link href="/premiadas" className="block">
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[#1A202C] py-6 shadow-lg active:scale-[0.98]">
            <Trophy className="h-8 w-8 text-white" />
            <span className="font-semibold text-white">Premiadas</span>
          </div>
        </Link>

        <Link href="/relatorios" className="block">
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[#1A202C] py-6 shadow-lg active:scale-[0.98]">
            <FileText className="h-8 w-8 text-white" />
            <span className="font-semibold text-white">Relatorios</span>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="py-4 text-center">
        <p className="text-sm text-gray-400">© 2026</p>
      </div>

      {/* Ad Popup */}
      {isVisible && currentAd && (
        <AdPopup ad={currentAd} onClose={closeAd} />
      )}
    </div>
  );
}
