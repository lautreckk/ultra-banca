'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Trophy,
  FileText,
  Droplets,
  Gamepad2,
  DollarSign,
  Copy,
  Check,
  Users,
  Phone,
  Headphones,
  BarChart3,
} from 'lucide-react';
import { usePlatformConfig } from '@/contexts/platform-config-context';
import { createClient } from '@/lib/supabase/client';
import { useAdPopup } from '@/hooks/use-ad-popup';
import { AdPopup } from '@/components/shared/ad-popup';

interface UltimoGanhador {
  unidade: string;
  valor: number;
  data_hora: string;
}

function getPlatformIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/platform_id=([^;]+)/);
  return match ? match[1] : null;
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

      const platformId = getPlatformIdFromCookie();

      if (platformId) {
        const { data } = await supabase
          .rpc('fn_get_ultimo_ganhador', { p_platform_id: platformId })
          .single();

        const ganhador = data as { unidade: string; valor: number; data_hora: string; is_fake: boolean } | null;

        if (ganhador) {
          setUltimoGanhador({
            unidade: ganhador.unidade,
            valor: Number(ganhador.valor),
            data_hora: ganhador.data_hora,
          });
        }
      } else {
        const { data } = await supabase
          .from('ultimo_ganhador')
          .select('unidade, valor, data_hora')
          .order('data_hora', { ascending: false })
          .limit(1)
          .single();

        const ganhador = data as { unidade: string; valor: number; data_hora: string } | null;

        if (ganhador) {
          setUltimoGanhador({
            unidade: ganhador.unidade,
            valor: Number(ganhador.valor),
            data_hora: ganhador.data_hora,
          });
        }
      }
    };

    fetchData();

    const realtimePlatformId = getPlatformIdFromCookie();
    const channel = supabase
      .channel('ultimo-ganhador-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ultimo_ganhador',
          filter: realtimePlatformId ? `platform_id=eq.${realtimePlatformId}` : undefined,
        },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as { unidade: string; valor: number; data_hora: string };
            setUltimoGanhador({
              unidade: newData.unidade,
              valor: Number(newData.valor),
              data_hora: newData.data_hora,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    <div className="space-y-5 px-4 py-4">
      {/* Invite Link */}
      <div className="flex items-center gap-2 rounded-xl border border-zinc-700/40 px-3 py-2.5" style={{ backgroundColor: '#1A1F2B' }}>
        <span className="text-sm text-zinc-400 shrink-0">Convidar:</span>
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-zinc-900/80 px-3 py-1.5 min-w-0">
          <span className="flex-1 truncate text-sm text-zinc-300">{inviteUrl}</span>
          <button
            onClick={handleCopyLink}
            className="shrink-0 p-1 rounded active:bg-white/10"
            aria-label="Copiar link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Último Ganhador */}
      {ultimoGanhador && (
        <div
          className="overflow-hidden rounded-xl border border-emerald-500/30"
          style={{ backgroundColor: '#1A1F2B' }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
              <Trophy className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Último Ganhador
              </p>
              <p className="font-bold text-white">
                Unidade: {ultimoGanhador.unidade}
              </p>
              <p className="text-xs text-zinc-500">
                {new Date(ultimoGanhador.data_hora).toLocaleDateString('pt-BR')}{' '}
                {new Date(ultimoGanhador.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-emerald-400">
                R$ {ultimoGanhador.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-zinc-500">Pago via PIX</p>
            </div>
          </div>
        </div>
      )}

      {/* Jogos Disponíveis */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-emerald-500" />
          <h2 className="text-lg font-bold text-white">Jogos Disponíveis</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/loterias"
            className="relative overflow-hidden rounded-xl shadow-lg active:scale-[0.97] transition-transform"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/LOTERIAS.webp"
                alt="Jogo do Bicho"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-0 right-0 text-center text-sm font-bold text-white drop-shadow-lg">
                JOGO DO BICHO
              </span>
            </div>
          </Link>

          <Link
            href="/fazendinha"
            className="relative overflow-hidden rounded-xl shadow-lg active:scale-[0.97] transition-transform"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/FAZENDINHA2.webp"
                alt="Fazendinha"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-0 right-0 text-center text-sm font-bold text-white drop-shadow-lg">
                FAZENDINHA
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Cassino Online - Full width */}
      <Link href="/cassino" className="block">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-7 shadow-lg active:scale-[0.98] transition-transform">
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />
          <div className="relative flex items-center justify-center gap-3">
            <Gamepad2 className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">Cassino Online</span>
          </div>
        </div>
      </Link>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-4 gap-2">
        {config.promotor_link ? (
          <a
            href={config.promotor_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-700/40 py-3.5 active:scale-[0.95] transition-transform"
            style={{ backgroundColor: '#1A1F2B' }}
          >
            <Phone className="h-5 w-5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-zinc-300">Promotor</span>
          </a>
        ) : (
          <div
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-700/40 py-3.5 opacity-50"
            style={{ backgroundColor: '#1A1F2B' }}
          >
            <Phone className="h-5 w-5 text-zinc-500" />
            <span className="text-[11px] font-semibold text-zinc-500">Promotor</span>
          </div>
        )}

        {config.social_whatsapp ? (
          <a
            href={config.social_whatsapp.startsWith('http') ? config.social_whatsapp : `https://wa.me/${config.social_whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-700/40 py-3.5 active:scale-[0.95] transition-transform"
            style={{ backgroundColor: '#1A1F2B' }}
          >
            <Headphones className="h-5 w-5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-zinc-300">Suporte</span>
          </a>
        ) : (
          <div
            className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-700/40 py-3.5 opacity-50"
            style={{ backgroundColor: '#1A1F2B' }}
          >
            <Headphones className="h-5 w-5 text-zinc-500" />
            <span className="text-[11px] font-semibold text-zinc-500">Suporte</span>
          </div>
        )}

        <Link
          href="/resultados"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-700/40 py-3.5 active:scale-[0.95] transition-transform"
          style={{ backgroundColor: '#1A1F2B' }}
        >
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-zinc-300">Cotações</span>
        </Link>

        <Link
          href="/amigos"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-700/40 py-3.5 active:scale-[0.95] transition-transform"
          style={{ backgroundColor: '#1A1F2B' }}
        >
          <Users className="h-5 w-5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-zinc-300">Indique</span>
        </Link>
      </div>

      {/* Recarga PIX - Prominent */}
      <Link href="/recarga-pix" className="block">
        <div className="flex items-center justify-center gap-3 rounded-xl bg-emerald-500 py-5 shadow-lg active:scale-[0.98] transition-transform">
          <Droplets className="h-7 w-7 text-white" />
          <span className="text-xl font-bold text-white">Recarga PIX</span>
        </div>
      </Link>

      {/* Bottom Grid - Saques, Premiadas, Relatórios */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/saques" className="block">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-700/40 py-5 active:scale-[0.97] transition-transform"
            style={{ backgroundColor: '#1A1F2B' }}
          >
            <DollarSign className="h-6 w-6 text-emerald-400" />
            <span className="text-xs font-semibold text-white">Saques</span>
          </div>
        </Link>

        <Link href="/premiadas" className="block">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-700/40 py-5 active:scale-[0.97] transition-transform"
            style={{ backgroundColor: '#1A1F2B' }}
          >
            <Trophy className="h-6 w-6 text-amber-400" />
            <span className="text-xs font-semibold text-white">Premiadas</span>
          </div>
        </Link>

        <Link href="/relatorios" className="block">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-700/40 py-5 active:scale-[0.97] transition-transform"
            style={{ backgroundColor: '#1A1F2B' }}
          >
            <FileText className="h-6 w-6 text-blue-400" />
            <span className="text-xs font-semibold text-white">Relatórios</span>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="py-4 text-center">
        <p className="text-xs text-zinc-600">&copy; 2026</p>
      </div>

      {/* Ad Popup */}
      {isVisible && currentAd && (
        <AdPopup ad={currentAd} onClose={closeAd} />
      )}
    </div>
  );
}
