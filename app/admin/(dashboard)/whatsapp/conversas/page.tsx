'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, User, Bot, ArrowLeft, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ChatSession {
  session_id: string;
  user_id: string;
  user_name: string;
  user_cpf: string;
  platform_id: string;
  last_message: string;
  last_role: string;
  last_at: string;
  message_count: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
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

export default function ConversasPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch sessions
  const fetchSessions = async () => {
    const platformId = getPlatformIdFromCookie();
    if (!platformId) return;

    const { data } = await supabase
      .from('support_chat_messages')
      .select(`
        session_id,
        user_id,
        platform_id,
        role,
        content,
        created_at
      `)
      .eq('platform_id', platformId)
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    // Group by session
    const sessionMap = new Map<string, {
      session_id: string;
      user_id: string;
      platform_id: string;
      last_message: string;
      last_role: string;
      last_at: string;
      message_count: number;
    }>();

    for (const msg of data) {
      const existing = sessionMap.get(msg.session_id);
      if (!existing) {
        sessionMap.set(msg.session_id, {
          session_id: msg.session_id,
          user_id: msg.user_id,
          platform_id: msg.platform_id,
          last_message: msg.content,
          last_role: msg.role,
          last_at: msg.created_at,
          message_count: 1,
        });
      } else {
        existing.message_count++;
      }
    }

    // Fetch user names
    const userIds = [...new Set([...sessionMap.values()].map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nome, cpf')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const sessionList: ChatSession[] = [...sessionMap.values()].map(s => ({
      ...s,
      user_name: profileMap.get(s.user_id)?.nome || 'Usuário',
      user_cpf: profileMap.get(s.user_id)?.cpf || '',
    }));

    setSessions(sessionList);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Real-time new messages
  useEffect(() => {
    const platformId = getPlatformIdFromCookie();
    if (!platformId) return;

    const channel = supabase
      .channel('support-chat-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chat_messages',
          filter: `platform_id=eq.${platformId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage & { user_id: string; platform_id: string };

          // Update session list
          setSessions(prev => {
            const existing = prev.find(s => s.session_id === newMsg.session_id);
            if (existing) {
              return prev.map(s =>
                s.session_id === newMsg.session_id
                  ? { ...s, last_message: newMsg.content, last_role: newMsg.role, last_at: newMsg.created_at, message_count: s.message_count + 1 }
                  : s
              ).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
            }
            // New session - refetch to get user name
            fetchSessions();
            return prev;
          });

          // If viewing this session, add message
          if (newMsg.session_id === selectedSession) {
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages for selected session
  const openSession = async (sessionId: string) => {
    setSelectedSession(sessionId);
    const { data } = await supabase
      .from('support_chat_messages')
      .select('id, session_id, role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const filteredSessions = sessions.filter(s =>
    !search || s.user_name.toLowerCase().includes(search.toLowerCase()) || s.user_cpf.includes(search)
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950">
      {/* Session List */}
      <div className={`${selectedSession ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-zinc-800`}>
        {/* Header */}
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

        {/* Session list */}
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
                key={session.session_id}
                onClick={() => openSession(session.session_id)}
                className={`w-full flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors text-left ${
                  selectedSession === session.session_id ? 'bg-zinc-900' : ''
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white truncate">{session.user_name}</span>
                    <span className="text-[11px] text-zinc-500 shrink-0 ml-2">{timeAgo(session.last_at)}</span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {session.last_role === 'assistant' ? '🤖 ' : ''}
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
              <button
                onClick={() => setSelectedSession(null)}
                className="md:hidden p-1 rounded hover:bg-zinc-800"
              >
                <ArrowLeft className="h-5 w-5 text-zinc-400" />
              </button>
              <div className="h-9 w-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <User className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {sessions.find(s => s.session_id === selectedSession)?.user_name || 'Usuário'}
                </p>
                <p className="text-[11px] text-zinc-500">
                  CPF: {sessions.find(s => s.session_id === selectedSession)?.user_cpf || '---'}
                </p>
              </div>
              <div className="ml-auto px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] text-emerald-400 font-medium">Suporte IA</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: '#0B141A' }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/30 border border-indigo-500/20 text-white'
                      : 'bg-zinc-800 border border-zinc-700/50 text-zinc-200'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {msg.role === 'assistant' ? (
                        <Bot className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <User className="h-3 w-3 text-indigo-400" />
                      )}
                      <span className={`text-[10px] font-semibold ${msg.role === 'assistant' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                        {msg.role === 'assistant' ? 'Aline (IA)' : 'Usuário'}
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

            {/* Footer info */}
            <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50">
              <p className="text-[11px] text-zinc-600 text-center">
                Visualização em tempo real - somente leitura
              </p>
            </div>
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
