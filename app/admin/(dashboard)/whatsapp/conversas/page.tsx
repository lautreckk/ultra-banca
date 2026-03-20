'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, User, Bot, ArrowLeft, Search, RefreshCw, Send, Shield, ShieldOff, Clock } from 'lucide-react';
import Link from 'next/link';

interface ChatSession {
  id: string;
  user_id: string;
  user_name: string;
  user_cpf: string;
  platform_id: string;
  taken_over_by: string | null;
  last_admin_reply_at: string | null;
  last_message: string;
  last_role: string;
  last_at: string;
  message_count: number;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'admin';
  content: string;
  created_at: string;
}

function getPlatformIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/platform_id=([^;]+)/);
  return match ? match[1] : null;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function isTakeoverActive(session: { taken_over_by: string | null; last_admin_reply_at: string | null }): boolean {
  if (!session.taken_over_by || !session.last_admin_reply_at) return false;
  const elapsed = Date.now() - new Date(session.last_admin_reply_at).getTime();
  return elapsed < 30 * 60 * 1000;
}

export default function ConversasPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adminInput, setAdminInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchSessions = async () => {
    const platformId = getPlatformIdFromCookie();
    if (!platformId) return;

    // Fetch sessions from the sessions table
    const { data: sessionsData } = await supabase
      .from('support_chat_sessions')
      .select('id, user_id, platform_id, taken_over_by, last_admin_reply_at, updated_at')
      .eq('platform_id', platformId)
      .order('updated_at', { ascending: false });

    if (!sessionsData || sessionsData.length === 0) { setLoading(false); return; }

    // Fetch last message for each session
    const sessionIds = sessionsData.map(s => s.id);
    const { data: allMessages } = await supabase
      .from('support_chat_messages')
      .select('session_id, role, content, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false });

    // Group: last message + count per session
    const sessionMsgMap = new Map<string, { last_message: string; last_role: string; last_at: string; count: number }>();
    for (const msg of allMessages || []) {
      const existing = sessionMsgMap.get(msg.session_id);
      if (!existing) {
        sessionMsgMap.set(msg.session_id, { last_message: msg.content, last_role: msg.role, last_at: msg.created_at, count: 1 });
      } else {
        existing.count++;
      }
    }

    // Fetch user profiles
    const userIds = [...new Set(sessionsData.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nome, cpf')
      .in('id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const result: ChatSession[] = sessionsData.map(s => {
      const msgInfo = sessionMsgMap.get(s.id);
      return {
        ...s,
        user_name: profileMap.get(s.user_id)?.nome || 'Usuário',
        user_cpf: profileMap.get(s.user_id)?.cpf || '',
        last_message: msgInfo?.last_message || '',
        last_role: msgInfo?.last_role || '',
        last_at: msgInfo?.last_at || s.updated_at,
        message_count: msgInfo?.count || 0,
      };
    }).filter(s => s.message_count > 0);

    setSessions(result);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  // Realtime for new messages
  useEffect(() => {
    const platformId = getPlatformIdFromCookie();
    if (!platformId) return;

    const channel = supabase
      .channel('admin-support-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_chat_messages', filter: `platform_id=eq.${platformId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage & { user_id: string; platform_id: string };

          // Update session list
          setSessions(prev => {
            const existing = prev.find(s => s.id === newMsg.session_id);
            if (existing) {
              return prev.map(s =>
                s.id === newMsg.session_id
                  ? { ...s, last_message: newMsg.content, last_role: newMsg.role, last_at: newMsg.created_at, message_count: s.message_count + 1 }
                  : s
              ).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
            }
            fetchSessions();
            return prev;
          });

          // If viewing this session, add message
          if (selectedSession && newMsg.session_id === selectedSession.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, { id: newMsg.id, session_id: newMsg.session_id, role: newMsg.role, content: newMsg.content, created_at: newMsg.created_at }];
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openSession = async (session: ChatSession) => {
    setSelectedSession(session);
    const { data } = await supabase
      .from('support_chat_messages')
      .select('id, session_id, role, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleTakeover = async () => {
    if (!selectedSession) return;
    const res = await fetch('/api/chat-suporte/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'takeover', sessionId: selectedSession.id }),
    });
    if (res.ok) {
      const now = new Date().toISOString();
      setSelectedSession(prev => prev ? { ...prev, taken_over_by: 'admin', last_admin_reply_at: now } : null);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, taken_over_by: 'admin', last_admin_reply_at: now } : s));
    }
  };

  const handleRelease = async () => {
    if (!selectedSession) return;
    const res = await fetch('/api/chat-suporte/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'release', sessionId: selectedSession.id }),
    });
    if (res.ok) {
      setSelectedSession(prev => prev ? { ...prev, taken_over_by: null, last_admin_reply_at: null } : null);
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, taken_over_by: null, last_admin_reply_at: null } : s));
    }
  };

  const sendAdminMessage = async () => {
    const text = adminInput.trim();
    if (!text || !selectedSession || sending) return;

    setSending(true);
    setAdminInput('');

    const res = await fetch('/api/chat-suporte/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send', sessionId: selectedSession.id, message: text }),
    });

    if (!res.ok) {
      setAdminInput(text);
    }
    setSending(false);
  };

  const filteredSessions = sessions.filter(s =>
    !search || s.user_name.toLowerCase().includes(search.toLowerCase()) || s.user_cpf.includes(search)
  );

  const isActive = selectedSession ? isTakeoverActive(selectedSession) : false;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950">
      {/* Session List */}
      <div className={`${selectedSession ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-zinc-800`}>
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link href="/admin/whatsapp" className="p-1 rounded hover:bg-zinc-800">
                <ArrowLeft className="h-5 w-5 text-zinc-400" />
              </Link>
              <h1 className="text-lg font-bold text-white">Conversas IA</h1>
            </div>
            <button onClick={fetchSessions} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">Carregando...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-sm gap-2">
              <MessageSquare className="h-8 w-8 text-zinc-700" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => openSession(session)}
                className={`w-full flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors text-left ${
                  selectedSession?.id === session.id ? 'bg-zinc-900' : ''
                }`}
              >
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-indigo-400" />
                  </div>
                  {isTakeoverActive(session) && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-500 border-2 border-zinc-950 flex items-center justify-center">
                      <Shield className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white truncate">{session.user_name}</span>
                    <span className="text-[11px] text-zinc-500 shrink-0 ml-2">{timeAgo(session.last_at)}</span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {session.last_role === 'admin' ? '👤 ' : session.last_role === 'assistant' ? '🤖 ' : ''}
                    {session.last_message.substring(0, 80)}
                  </p>
                  <span className="text-[10px] text-zinc-600 mt-0.5 block">{session.message_count} msgs</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className={`${selectedSession ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedSession ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <button onClick={() => setSelectedSession(null)} className="md:hidden p-1 rounded hover:bg-zinc-800">
                <ArrowLeft className="h-5 w-5 text-zinc-400" />
              </button>
              <div className="h-9 w-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <User className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{selectedSession.user_name}</p>
                <p className="text-[11px] text-zinc-500">CPF: {selectedSession.user_cpf || '---'}</p>
              </div>

              {/* Takeover / Release button */}
              {isActive ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                    <Shield className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[11px] text-amber-400 font-medium">Você assumiu</span>
                  </div>
                  <button
                    onClick={handleRelease}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-xs font-medium transition-colors"
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    Devolver p/ IA
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleTakeover}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Assumir conversa
                </button>
              )}
            </div>

            {/* Takeover info bar */}
            {isActive && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border-b border-amber-500/10">
                <Clock className="h-3.5 w-3.5 text-amber-400/60" />
                <span className="text-[11px] text-amber-400/60">
                  IA volta automaticamente após 30min sem resposta do admin
                </span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: '#0B141A' }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/30 border border-indigo-500/20 text-white'
                      : msg.role === 'admin'
                        ? 'bg-amber-600/20 border border-amber-500/20 text-white'
                        : 'bg-zinc-800 border border-zinc-700/50 text-zinc-200'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {msg.role === 'admin' ? (
                        <Shield className="h-3 w-3 text-amber-400" />
                      ) : msg.role === 'assistant' ? (
                        <Bot className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <User className="h-3 w-3 text-indigo-400" />
                      )}
                      <span className={`text-[10px] font-semibold ${
                        msg.role === 'admin' ? 'text-amber-400' : msg.role === 'assistant' ? 'text-emerald-400' : 'text-indigo-400'
                      }`}>
                        {msg.role === 'admin' ? 'Admin' : msg.role === 'assistant' ? 'Aline (IA)' : 'Usuário'}
                      </span>
                      <span className="text-[10px] text-zinc-600 ml-auto">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin input - always visible when takeover is active */}
            {isActive ? (
              <div className="flex items-center gap-2 px-3 py-3 border-t border-zinc-800 bg-zinc-900/80">
                <input
                  ref={inputRef}
                  type="text"
                  value={adminInput}
                  onChange={(e) => setAdminInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminMessage(); } }}
                  placeholder="Responder como admin..."
                  maxLength={1000}
                  disabled={sending}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
                />
                <button
                  onClick={sendAdminMessage}
                  disabled={!adminInput.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white disabled:opacity-40 hover:bg-amber-400 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-900/50">
                <p className="text-[11px] text-zinc-600 text-center">
                  Clique em &quot;Assumir conversa&quot; para responder no lugar da IA
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-3">
            <MessageSquare className="h-16 w-16 text-zinc-800" />
            <p className="text-sm">Selecione uma conversa para visualizar</p>
          </div>
        )}
      </div>
    </div>
  );
}
