'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Copy, Check, Link2, RefreshCw } from 'lucide-react';

interface WhatsAppLinkGeneratorProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  description?: string;
}

export function WhatsAppLinkGenerator({
  label,
  value,
  onChange,
  description,
}: WhatsAppLinkGeneratorProps) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  // Flag para controlar se o usuário está editando
  const [isUserEditing, setIsUserEditing] = useState(false);

  // Extrair número e mensagem do link existente (só quando value muda externamente)
  useEffect(() => {
    // Não sobrescrever se o usuário está editando
    if (isUserEditing) return;

    if (value) {
      try {
        const url = new URL(value);
        // Extrair número do path (ex: /5511999999999)
        const phoneFromUrl = url.pathname.replace('/', '');
        if (phoneFromUrl) {
          setPhone(phoneFromUrl);
        }
        // Extrair mensagem do query param
        const textParam = url.searchParams.get('text');
        if (textParam) {
          setMessage(decodeURIComponent(textParam));
        } else {
          setMessage('');
        }
        setGeneratedLink(value);
      } catch {
        // Se não for URL válida, tenta extrair só o número
        const numbersOnly = value.replace(/\D/g, '');
        if (numbersOnly) {
          setPhone(numbersOnly);
        }
      }
    } else {
      setPhone('');
      setMessage('');
      setGeneratedLink('');
    }
  }, [value, isUserEditing]);

  // Gerar link quando phone ou message mudam (apenas quando usuário edita)
  const generateAndNotify = (newPhone: string, newMessage: string) => {
    if (newPhone) {
      const cleanPhone = newPhone.replace(/\D/g, '');
      let link = `https://wa.me/${cleanPhone}`;
      if (newMessage) {
        link += `?text=${encodeURIComponent(newMessage)}`;
      }
      setGeneratedLink(link);
      onChange(link);
    } else {
      setGeneratedLink('');
      onChange(null);
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    // Limita a 13 dígitos (código país + DDD + número)
    return numbers.slice(0, 13);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUserEditing(true);
    const newPhone = formatPhone(e.target.value);
    setPhone(newPhone);
    generateAndNotify(newPhone, message);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsUserEditing(true);
    const newMessage = e.target.value;
    setMessage(newMessage);
    generateAndNotify(phone, newMessage);
  };

  const handleCopy = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setIsUserEditing(true);
    setPhone('');
    setMessage('');
    setGeneratedLink('');
    onChange(null);
  };

  const displayPhone = (phone: string) => {
    if (!phone) return '';
    // Formatar como +55 (11) 99999-9999
    if (phone.length <= 2) return `+${phone}`;
    if (phone.length <= 4) return `+${phone.slice(0, 2)} (${phone.slice(2)}`;
    if (phone.length <= 9) return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4)}`;
    return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>

      <div className="p-4 bg-zinc-800/50 rounded-lg space-y-4">
        {/* Número */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Número com código do país (ex: 5511999999999)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              value={displayPhone(phone)}
              onChange={handlePhoneChange}
              placeholder="+55 (11) 99999-9999"
              className="pl-10 bg-zinc-800/50 border-zinc-700/40 text-white"
            />
          </div>
        </div>

        {/* Mensagem */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Mensagem inicial (opcional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <textarea
              value={message}
              onChange={handleMessageChange}
              placeholder="Olá, preciso de ajuda!"
              className="w-full pl-10 pr-3 py-2 bg-zinc-800/50 border border-zinc-700/40 text-white rounded-md text-sm resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Link Gerado */}
        {generatedLink && (
          <div className="space-y-2">
            <label className="block text-xs text-zinc-500">Link gerado:</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Link2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-400 truncate">{generatedLink}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="border-zinc-700/40 text-zinc-300 hover:bg-zinc-700/30 flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="border-zinc-700/40 text-zinc-300 hover:bg-zinc-700/30 flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-zinc-500">{description}</p>
      )}
    </div>
  );
}
