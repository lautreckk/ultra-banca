'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, ChevronLeft } from 'lucide-react';
import Image from 'next/image';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  status?: 'sending' | 'sent' | 'read';
}

interface SupportChatProps {
  open: boolean;
  onClose: () => void;
}

function getTimeNow(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Simula delay humano de digitação (6-12 segundos)
function getTypingDelay(text: string): number {
  const base = 6000;
  const perChar = Math.min(text.length * 15, 4000);
  const random = Math.random() * 2000;
  return base + perChar + random;
}

export function SupportChat({ open, onClose }: SupportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: 'Oi! Sou a Aline, sua promotora 😊 Como posso te ajudar hoje?',
      time: getTimeNow(),
      status: 'read',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const addAssistantMessages = useCallback(async (fullReply: string) => {
    // Split reply by ||| separator for multiple messages
    const parts = fullReply.split('|||').map(p => p.trim()).filter(Boolean);

    for (let i = 0; i < parts.length; i++) {
      // Show typing indicator
      setIsTyping(true);
      scrollToBottom();

      // Wait with human-like delay
      const delay = i === 0 ? getTypingDelay(parts[i]) : getTypingDelay(parts[i]) * 0.6;
      await new Promise(resolve => setTimeout(resolve, delay));

      setIsTyping(false);

      // Add message
      const msg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: parts[i],
        time: getTimeNow(),
        status: 'read',
      };

      setMessages(prev => [...prev, msg]);

      // Small pause between multiple messages
      if (i < parts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
  }, [scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      time: getTimeNow(),
      status: 'sent',
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    // Mark as read after a short delay
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === userMsg.id ? { ...m, status: 'read' as const } : m)
      );
    }, 1500);

    try {
      // Show "online" then typing with a small gap
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await fetch('/api/chat-suporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Desculpa, tive um probleminha aqui 😅 Tenta de novo?';

      await addAssistantMessages(reply);
    } catch {
      await addAssistantMessages('Eita, deu um erro na conexão 😔 Tenta de novo em uns minutinhos?');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Chat Window */}
      <div className="relative w-full max-w-md h-[90vh] flex flex-col rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Header - WhatsApp style */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#075E54]">
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>

          <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
            <Image
              src="/images/aline-avatar.jpg"
              alt="Aline"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-white leading-tight">Promotora Aline</h3>
            <p className="text-[12px] text-emerald-200 leading-tight">
              {isTyping ? 'digitando...' : 'online'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Messages area - WhatsApp wallpaper */}
        <div
          className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
          style={{
            backgroundColor: '#0B141A',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5l5 10-10 5 5 10-10-5-5 10-5-10-10 5 5-10-10-5 5-10 10 5-5-10 10 5z' fill='%23ffffff' fill-opacity='0.02'/%3E%3C/svg%3E")`,
          }}
        >
          {/* Date badge */}
          <div className="flex justify-center mb-2">
            <span className="bg-[#1D2B36] text-[11px] text-zinc-400 px-3 py-1 rounded-lg shadow">
              Hoje
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-1`}
            >
              <div
                className={`relative max-w-[82%] px-3 py-1.5 text-[14.5px] leading-[19px] shadow ${
                  msg.role === 'user'
                    ? 'bg-[#005C4B] text-white rounded-lg rounded-tr-sm'
                    : 'bg-[#1F2C34] text-zinc-100 rounded-lg rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <p className="text-[12.5px] font-semibold text-emerald-400 mb-0.5">Aline</p>
                )}
                <span className="whitespace-pre-wrap">{msg.content}</span>
                <span className="float-right ml-2 mt-1 text-[11px] text-zinc-400 leading-none flex items-center gap-1">
                  {msg.time}
                  {msg.role === 'user' && (
                    <svg className={`w-4 h-3 ${msg.status === 'read' ? 'text-sky-400' : 'text-zinc-400'}`} viewBox="0 0 16 11" fill="none">
                      <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.175a.463.463 0 0 0-.713.006.467.467 0 0 0 .006.672l2.357 2.553a.481.481 0 0 0 .362.162c.14 0 .274-.058.367-.162l6.54-8.062a.468.468 0 0 0-.033-.706z" fill="currentColor"/>
                      <path d="M14.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.175a.463.463 0 0 0-.713.006.467.467 0 0 0 .006.672l2.357 2.553a.481.481 0 0 0 .362.162c.14 0 .274-.058.367-.162l6.54-8.062a.468.468 0 0 0-.033-.706z" fill="currentColor" opacity="0.7"/>
                    </svg>
                  )}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start mb-1">
              <div className="bg-[#1F2C34] rounded-lg rounded-tl-sm px-3 py-2 shadow">
                <p className="text-[12.5px] font-semibold text-emerald-400 mb-1">Aline</p>
                <div className="flex gap-1 items-center h-4">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.6s' }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '0.6s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area - WhatsApp style */}
        <div className="flex items-center gap-2 px-2 py-2 bg-[#1F2C34]">
          <div className="flex-1 flex items-center bg-[#2A3942] rounded-full px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mensagem"
              maxLength={500}
              disabled={isSending}
              className="flex-1 bg-transparent text-white text-[15px] placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-white disabled:opacity-40 active:scale-95 transition-all"
            aria-label="Enviar"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
