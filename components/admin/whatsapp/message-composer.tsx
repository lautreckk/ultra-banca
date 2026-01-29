'use client';

import { useState } from 'react';
import { MessageSquare, Image, Mic, Video, FileText, X, Plus, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EvolutionTriggerMessage } from '@/lib/admin/actions/evolution';

type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document';

interface MessageComposerProps {
  messages: EvolutionTriggerMessage[];
  onAdd: (type: MessageType, content: string, caption?: string, delay?: number) => void;
  onUpdate: (id: string, data: Partial<EvolutionTriggerMessage>) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
}

const messageTypeConfig: Record<MessageType, { label: string; icon: React.ElementType; placeholder: string }> = {
  text: { label: 'Texto', icon: MessageSquare, placeholder: 'Digite a mensagem...' },
  image: { label: 'Imagem', icon: Image, placeholder: 'URL da imagem...' },
  audio: { label: 'Áudio', icon: Mic, placeholder: 'URL do áudio...' },
  video: { label: 'Vídeo', icon: Video, placeholder: 'URL do vídeo...' },
  document: { label: 'Documento', icon: FileText, placeholder: 'URL do documento...' },
};

const templateVariables = [
  { variable: '{{nome}}', description: 'Nome do usuário' },
  { variable: '{{telefone}}', description: 'Telefone' },
  { variable: '{{valor}}', description: 'Valor da transação' },
  { variable: '{{data}}', description: 'Data/hora atual' },
  { variable: '{{saldo}}', description: 'Saldo atual' },
  { variable: '{{premio}}', description: 'Valor do prêmio' },
  { variable: '{{modalidade}}', description: 'Modalidade do jogo' },
];

interface MessageItemProps {
  message: EvolutionTriggerMessage;
  index: number;
  total: number;
  onUpdate: (id: string, data: Partial<EvolutionTriggerMessage>) => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function MessageItem({ message, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(message.content || '');
  const [caption, setCaption] = useState(message.caption || '');
  const [delay, setDelay] = useState(message.delay_seconds);

  const config = messageTypeConfig[message.message_type];
  const Icon = config.icon;

  const handleSave = () => {
    onUpdate(message.id, {
      content,
      caption: message.message_type !== 'text' ? caption : undefined,
      delay_seconds: delay
    });
    setIsEditing(false);
  };

  const insertVariable = (variable: string) => {
    setContent(prev => prev + variable);
  };

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Drag Handle & Order */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 hover:bg-zinc-700 rounded disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          </button>
          <span className="text-xs text-zinc-500 font-mono">{index + 1}</span>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1 hover:bg-zinc-700 rounded disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              message.message_type === 'text' ? 'bg-blue-500/20' :
              message.message_type === 'image' ? 'bg-green-500/20' :
              message.message_type === 'audio' ? 'bg-purple-500/20' :
              message.message_type === 'video' ? 'bg-red-500/20' : 'bg-yellow-500/20'
            )}>
              <Icon className={cn(
                'h-4 w-4',
                message.message_type === 'text' ? 'text-blue-400' :
                message.message_type === 'image' ? 'text-green-400' :
                message.message_type === 'audio' ? 'text-purple-400' :
                message.message_type === 'video' ? 'text-red-400' : 'text-yellow-400'
              )} />
            </div>
            <span className="text-sm font-medium text-zinc-300">{config.label}</span>
            {delay > 0 && (
              <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded-full">
                Delay: {delay}s
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={config.placeholder}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 text-sm resize-none"
              />

              {message.message_type !== 'text' && (
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Legenda (opcional)"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
              )}

              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-400">Delay (segundos):</label>
                <input
                  type="number"
                  value={delay}
                  onChange={(e) => setDelay(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={60}
                  className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-white text-sm"
                />
              </div>

              {/* Template Variables */}
              <div className="flex flex-wrap gap-1.5">
                {templateVariables.map(({ variable, description }) => (
                  <button
                    key={variable}
                    onClick={() => insertVariable(variable)}
                    title={description}
                    className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-cyan-400 rounded transition-colors"
                  >
                    {variable}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setContent(message.content || '');
                    setCaption(message.caption || '');
                    setDelay(message.delay_seconds);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="cursor-pointer hover:bg-zinc-700/50 rounded-lg p-2 -m-2 transition-colors"
            >
              <p className="text-sm text-zinc-300 break-words">
                {content || <span className="text-zinc-500 italic">Clique para editar...</span>}
              </p>
              {caption && (
                <p className="text-xs text-zinc-500 mt-1">Legenda: {caption}</p>
              )}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(message.id)}
          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <X className="h-4 w-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

export function MessageComposer({ messages, onAdd, onUpdate, onDelete, onReorder }: MessageComposerProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAddMessage = (type: MessageType) => {
    onAdd(type, '', undefined, 0);
    setShowAddMenu(false);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...messages.map(m => m.id)];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onReorder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === messages.length - 1) return;
    const newOrder = [...messages.map(m => m.id)];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onReorder(newOrder);
  };

  return (
    <div className="space-y-4">
      {/* Messages List */}
      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              index={index}
              total={messages.length}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma mensagem configurada</p>
          <p className="text-sm">Adicione mensagens para este gatilho</p>
        </div>
      )}

      {/* Add Message Button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Adicionar mensagem
        </button>

        {showAddMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
            <div className="absolute left-0 right-0 bottom-full mb-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden">
              {(Object.entries(messageTypeConfig) as [MessageType, typeof messageTypeConfig[MessageType]][]).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => handleAddMessage(type)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
