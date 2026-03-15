'use client';

import { useState, useEffect } from 'react';
import { Bell, Send, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  title: string;
  body: string;
  url: string;
  sent_count: number;
  created_at: string;
  sent_at: string | null;
}

function getPlatformIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )platform_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function NotificacoesPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/home');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const supabase = createClient();

  const platformId = getPlatformIdFromCookie();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Count subscribers
    let countQuery = supabase.from('push_subscriptions').select('*', { count: 'exact', head: true });
    if (platformId) countQuery = countQuery.eq('platform_id', platformId);
    const { count } = await countQuery;
    setSubscriberCount(count || 0);

    // Load past notifications
    let notifQuery = supabase
      .from('push_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (platformId) notifQuery = notifQuery.eq('platform_id', platformId);
    const { data } = await notifQuery;
    if (data) setNotifications(data);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Preencha título e mensagem');
      return;
    }

    setSending(true);
    setError('');
    setResult(null);

    try {
      // Save notification record
      const { data: notif, error: saveError } = await supabase
        .from('push_notifications')
        .insert({
          platform_id: platformId,
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || '/',
        })
        .select()
        .single();

      if (saveError) throw new Error(saveError.message);

      // Send via API
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || '/',
          platformId,
          notificationId: notif?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar');

      setResult(data);
      setTitle('');
      setBody('');
      setUrl('/home');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar notificações');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Push Notifications
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Envie notificações de marketing para seus usuários</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{subscriberCount}</p>
              <p className="text-xs text-zinc-400">Inscritos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
              <Send className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{notifications.length}</p>
              <p className="text-xs text-zinc-400">Enviadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Form */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Nova Notificação</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Promoção especial!"
            maxLength={100}
            className="w-full h-11 rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Mensagem</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ex: Deposite agora e ganhe bônus de 100%!"
            maxLength={300}
            rows={3}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Tela ao clicar
          </label>
          <select
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full h-11 rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 appearance-none"
          >
            <option value="/home">Inicio</option>
            <option value="/recarga-pix">Depositar (PIX)</option>
            <option value="/loterias">Loterias</option>
            <option value="/resultados">Resultados</option>
            <option value="/cassino">Cassino</option>
            <option value="/fazendinha">Fazendinha</option>
            <option value="/lotinha">Lotinha</option>
            <option value="/seninha">Seninha</option>
            <option value="/quininha">Quininha</option>
            <option value="/amigos">Indique e Ganhe</option>
            <option value="/calculadora">Calculadora</option>
            <option value="/horoscopo">Horoscopo</option>
            <option value="/sonhos">Sonhos</option>
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400">
              Enviado para {result.sent} de {result.total} dispositivos
              {result.failed > 0 && ` (${result.failed} falharam)`}
            </p>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full h-12 rounded-lg bg-emerald-500 font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Enviando...' : `Enviar para ${subscriberCount} inscritos`}
        </button>
      </div>

      {/* History */}
      {notifications.length > 0 && (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Histórico</h2>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/15 mt-0.5">
                  {notif.sent_at ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{notif.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{notif.body}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-zinc-500">
                      {new Date(notif.created_at).toLocaleDateString('pt-BR')}{' '}
                      {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {notif.sent_at && (
                      <span className="text-[11px] text-emerald-400">
                        {notif.sent_count} enviados
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
