'use client';

import { useState, useEffect, useTransition } from 'react';
import { Send, MessageSquare, Image, Mic, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageLogTable } from '@/components/admin/whatsapp';
import {
  getInstances,
  sendTextMessage,
  sendMediaMessage,
  sendAudioMessage,
  type EvolutionInstance
} from '@/lib/admin/actions/evolution';

type MessageType = 'text' | 'image' | 'audio';

export default function WhatsAppSendPage() {
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function fetchInstances() {
      try {
        const data = await getInstances();
        setInstances(data);

        // Auto-select first connected instance
        const connected = data.find(i => i.status === 'open');
        if (connected) {
          setSelectedInstance(connected.instance_name);
        }
      } catch (error) {
        console.error('Error fetching instances:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInstances();
  }, []);

  const handleSend = () => {
    if (!selectedInstance || !phone || !content) {
      setResult({ success: false, message: 'Preencha todos os campos obrigatórios' });
      return;
    }

    startTransition(async () => {
      setResult(null);

      let sendResult: { success: boolean; error?: string };

      switch (messageType) {
        case 'text':
          sendResult = await sendTextMessage(selectedInstance, phone, content);
          break;
        case 'image':
          sendResult = await sendMediaMessage(selectedInstance, phone, 'image', content, caption);
          break;
        case 'audio':
          sendResult = await sendAudioMessage(selectedInstance, phone, content);
          break;
        default:
          sendResult = { success: false, error: 'Tipo de mensagem inválido' };
      }

      if (sendResult.success) {
        setResult({ success: true, message: 'Mensagem enviada com sucesso!' });
        setContent('');
        setCaption('');
      } else {
        setResult({ success: false, message: sendResult.error || 'Erro ao enviar mensagem' });
      }
    });
  };

  const connectedInstances = instances.filter(i => i.status === 'open');

  const messageTypeOptions = [
    { type: 'text' as const, label: 'Texto', icon: MessageSquare },
    { type: 'image' as const, label: 'Imagem', icon: Image },
    { type: 'audio' as const, label: 'Áudio', icon: Mic }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Enviar Mensagem</h1>
        <p className="text-zinc-400">Envie mensagens de teste pelo WhatsApp</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Send Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Nova Mensagem</h2>

          {/* Instance Select */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Instância
            </label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : connectedInstances.length === 0 ? (
              <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                Nenhuma instância conectada. Conecte uma instância primeiro.
              </div>
            ) : (
              <select
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Selecione uma instância</option>
                {connectedInstances.map(instance => (
                  <option key={instance.id} value={instance.instance_name}>
                    {instance.instance_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Message Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Tipo de Mensagem
            </label>
            <div className="flex gap-2">
              {messageTypeOptions.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setMessageType(type)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    messageType === type
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Número de Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11999998888"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Apenas números, com DDD (o código do país 55 será adicionado automaticamente)
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {messageType === 'text' ? 'Mensagem' : 'URL da Mídia'}
            </label>
            {messageType === 'text' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={4}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            ) : (
              <input
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={messageType === 'image' ? 'https://exemplo.com/imagem.jpg' : 'https://exemplo.com/audio.mp3'}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            )}
          </div>

          {/* Caption for images */}
          {messageType === 'image' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Legenda (opcional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Legenda da imagem..."
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg',
              result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            )}>
              {result.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              {result.message}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isPending || !selectedInstance || !phone || !content}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            Enviar Mensagem
          </button>
        </div>

        {/* Message Logs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Histórico de Envios</h2>
          <MessageLogTable limit={15} />
        </div>
      </div>
    </div>
  );
}
