'use client';

import { useState, useEffect } from 'react';
import { Users, Wifi } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RealTimeVisitorCardProps {
  initialCount: number;
}

export function RealTimeVisitorCard({ initialCount }: RealTimeVisitorCardProps) {
  const [count, setCount] = useState(initialCount);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to realtime changes on visitor_presence
    const channel = supabase
      .channel('visitor-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visitor_presence',
        },
        async () => {
          // Recount active visitors when any change happens
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const { count: newCount } = await supabase
            .from('visitor_presence')
            .select('*', { count: 'exact', head: true })
            .gte('last_seen_at', fiveMinutesAgo.toISOString());

          setCount(newCount || 0);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Polling fallback every 30 seconds
    const pollInterval = setInterval(async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const { count: newCount } = await supabase
        .from('visitor_presence')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', fiveMinutesAgo.toISOString());

      setCount(newCount || 0);
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50 relative overflow-hidden">
      {/* Pulsing background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 animate-pulse" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-sm font-medium text-gray-400">Ao Vivo</span>
          </div>

          {/* Connection indicator */}
          <div className="flex items-center gap-1.5">
            <Wifi
              className={`h-4 w-4 ${
                isConnected ? 'text-green-400' : 'text-red-400'
              }`}
            />
            <span
              className={`text-xs ${
                isConnected ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">{count}</span>
          <span className="text-lg text-gray-400">
            {count === 1 ? 'visitante' : 'visitantes'}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Ativos nos últimos 5 minutos
        </p>

        {/* Pulsing dot */}
        <div className="absolute top-4 right-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
        </div>
      </div>
    </div>
  );
}
