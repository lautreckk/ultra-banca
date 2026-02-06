'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format-currency';
import { Share2, Loader2 } from 'lucide-react';
import { HORARIOS } from '@/lib/constants/horarios';
import { usePlatformConfig } from '@/contexts/platform-config-context';

interface MovimentoItem {
  horario: string;
  total: number;
  quantidade: number;
}

interface UserProfile {
  codigo_convite: string;
  nome: string;
}

export default function MovimentoPage() {
  const config = usePlatformConfig();
  const [loading, setLoading] = useState(true);
  const [movimento, setMovimento] = useState<MovimentoItem[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const today = new Date();
  const dateDisplay = today.toLocaleDateString('pt-BR');
  const timeDisplay = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    const fetchMovimento = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('codigo_convite, nome')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Get today's date
      const todayStr = today.toISOString().split('T')[0];
      const startOfDay = `${todayStr}T00:00:00`;
      const endOfDay = `${todayStr}T23:59:59`;

      // Fetch apostas for today
      const { data: apostas } = await supabase
        .from('apostas')
        .select('horarios, valor_total, status')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .neq('status', 'cancelada');

      // Calculate movement by horario
      const movimentoMap = new Map<string, { total: number; quantidade: number }>();

      // Initialize all horarios
      HORARIOS.forEach(h => {
        movimentoMap.set(h.id, { total: 0, quantidade: 0 });
      });

      // Sum apostas by horario
      apostas?.forEach(aposta => {
        const valor = Number(aposta.valor_total) || 0;
        const horarios = aposta.horarios || [];

        // Each aposta can have multiple horarios, divide value equally
        const valorPorHorario = valor / horarios.length;

        horarios.forEach((horario: string) => {
          const current = movimentoMap.get(horario) || { total: 0, quantidade: 0 };
          movimentoMap.set(horario, {
            total: current.total + valorPorHorario,
            quantidade: current.quantidade + 1,
          });
        });
      });

      // Convert to array
      const movimentoArr: MovimentoItem[] = HORARIOS.map(h => ({
        horario: h.id,
        total: movimentoMap.get(h.id)?.total || 0,
        quantidade: movimentoMap.get(h.id)?.quantidade || 0,
      }));

      setMovimento(movimentoArr);
      setTotalGeral(movimentoArr.reduce((acc, m) => acc + m.total, 0));
      setLoading(false);
    };

    fetchMovimento();
  }, []);

  const handleShare = async () => {
    const text = `
MOVIMENTO LOTERIAS
${dateDisplay} ${timeDisplay}

${profile ? `VENDEDOR: ${profile.nome || profile.codigo_convite}` : ''}
UNIDADE: ${profile?.codigo_convite || 'N/A'}

${movimento.map(m => {
  const horarioInfo = HORARIOS.find(h => h.id === m.horario);
  return `${horarioInfo?.nomeCompleto || m.horario}: ${formatCurrency(m.total)}`;
}).join('\n')}

TOTAL GERAL: ${formatCurrency(totalGeral)}
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
      <PageLayout title="MOVIMENTO LOTERIAS" showBack>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="MOVIMENTO LOTERIAS" showBack>
      <div className="space-y-4 p-4">
        {/* Header Info */}
        <div className="overflow-hidden rounded-xl bg-zinc-800 border border-zinc-700/40 shadow-sm">
          <div className="px-4 py-3 text-center">
            <p className="text-sm text-zinc-400">{config.site_name.toUpperCase()}</p>
            {profile && (
              <p className="text-lg font-bold text-white">
                VENDEDOR: {profile.nome || profile.codigo_convite}
              </p>
            )}
            <p className="text-sm text-zinc-400">
              {dateDisplay} - {timeDisplay}
            </p>
          </div>
        </div>

        {/* Date Header */}
        <div className="rounded-xl bg-[#E5A220] px-4 py-3 text-center">
          <span className="font-bold text-zinc-900">MOVIMENTO LOTERIAS - {dateDisplay}</span>
        </div>

        {/* Movimento por Horário */}
        <div className="overflow-hidden rounded-xl bg-[#1A1F2B] border border-zinc-700/40 shadow-sm">
          <div className="divide-y divide-zinc-700/40">
            {movimento.map((item) => {
              const horarioInfo = HORARIOS.find(h => h.id === item.horario);
              return (
                <div key={item.horario} className="flex items-center justify-between px-4 py-3 min-h-[56px]">
                  <div>
                    <span className="font-medium text-white">
                      {horarioInfo?.nomeCompleto || item.horario}
                    </span>
                    <p className="text-xs text-zinc-500">
                      {item.quantidade} {item.quantidade === 1 ? 'aposta' : 'apostas'}
                    </p>
                  </div>
                  <span className={`font-bold ${item.total > 0 ? 'text-green-600' : 'text-zinc-500'}`}>
                    {formatCurrency(item.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Geral */}
        <div className="overflow-hidden rounded-xl bg-green-500 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="font-bold text-white">TOTAL GERAL</span>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(totalGeral)}
            </span>
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
