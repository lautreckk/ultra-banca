'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, ChevronLeft, Users } from 'lucide-react';

// ============================================================================
// AGENTES / MEMBROS FAKE DA COMUNIDADE
// ============================================================================

const AGENTS = [
  { name: 'Seu Carlos', avatar: 'https://randomuser.me/api/portraits/men/72.jpg', color: '#E91E63' },
  { name: 'Dona Maria', avatar: 'https://randomuser.me/api/portraits/women/79.jpg', color: '#9C27B0' },
  { name: 'Roberto S.', avatar: 'https://randomuser.me/api/portraits/men/62.jpg', color: '#FF9800' },
  { name: 'Cláudia R.', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', color: '#4CAF50' },
  { name: 'Toninho', avatar: 'https://randomuser.me/api/portraits/men/55.jpg', color: '#2196F3' },
  { name: 'Vera Lúcia', avatar: 'https://randomuser.me/api/portraits/women/52.jpg', color: '#FF5722' },
  { name: 'Seu Jorge', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', color: '#00BCD4' },
  { name: 'Neide F.', avatar: 'https://randomuser.me/api/portraits/women/58.jpg', color: '#E040FB' },
  { name: 'Marcos V.', avatar: 'https://randomuser.me/api/portraits/men/41.jpg', color: '#FFEB3B' },
  { name: 'Rosângela', avatar: 'https://randomuser.me/api/portraits/women/45.jpg', color: '#8BC34A' },
  { name: 'Edson P.', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', color: '#03A9F4' },
  { name: 'Sandra M.', avatar: 'https://randomuser.me/api/portraits/women/62.jpg', color: '#F44336' },
  { name: 'Zé Antônio', avatar: 'https://randomuser.me/api/portraits/men/74.jpg', color: '#795548' },
  { name: 'Marlene', avatar: 'https://randomuser.me/api/portraits/women/71.jpg', color: '#607D8B' },
  { name: 'Valdir', avatar: 'https://randomuser.me/api/portraits/men/58.jpg', color: '#FF6F00' },
];

const BICHOS = [
  'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro', 'Cabra', 'Carneiro',
  'Camelo', 'Cobra', 'Coelho', 'Cavalo', 'Elefante', 'Galo', 'Gato',
  'Jacaré', 'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru', 'Touro',
  'Tigre', 'Urso', 'Veado', 'Vaca',
];

const EMOJIS: Record<string, string> = {
  'Avestruz': '🦆', 'Águia': '🦅', 'Burro': '🫏', 'Borboleta': '🦋', 'Cachorro': '🐕',
  'Cabra': '🐐', 'Carneiro': '🐏', 'Camelo': '🐫', 'Cobra': '🐍', 'Coelho': '🐇',
  'Cavalo': '🐴', 'Elefante': '🐘', 'Galo': '🐓', 'Gato': '🐱', 'Jacaré': '🐊',
  'Leão': '🦁', 'Macaco': '🐒', 'Porco': '🐷', 'Pavão': '🦚', 'Peru': '🦃',
  'Touro': '🐂', 'Tigre': '🐅', 'Urso': '🐻', 'Veado': '🦌', 'Vaca': '🐄',
};

// Mensagens pré-definidas dos agentes - variadas e naturais
const PALPITE_MESSAGES = [
  (b: string) => `Tô sentindo o ${b} forte hoje ${EMOJIS[b] || ''}`,
  (b: string) => `Galera, bora no ${b}! ${EMOJIS[b] || ''} Pressentimento bom demais`,
  (b: string) => `Alguém mais vai no ${b}? ${EMOJIS[b] || ''} Acho que vem!`,
  (b: string) => `${b} ${EMOJIS[b] || ''} tá pedindo pra sair, confia!`,
  (b: string) => `Meu palpite do dia: ${b} ${EMOJIS[b] || ''} 🔥`,
  (b: string) => `Sonhei com ${b} ${EMOJIS[b] || ''} ontem à noite, vou meter ficha!`,
  (b: string) => `${b} ${EMOJIS[b] || ''} no grupo do 1º ao 5º, quem vai?`,
  (b: string) => `Minha vizinha sonhou com ${b} ${EMOJIS[b] || ''}, vou apostar!`,
  (b: string) => `Faz 3 dias que o ${b} ${EMOJIS[b] || ''} não sai, hj é o dia`,
  (b: string) => `Olha, ${b} ${EMOJIS[b] || ''} na centena, quem cola?`,
  (b: string) => `Pessoal, ${b} ${EMOJIS[b] || ''} na cabeça desde ontem, vou arriscar`,
  (b: string) => `Semana passada perdi por pouco no ${b} ${EMOJIS[b] || ''}, hj vai!`,
  (b: string) => `Recebi um pressentimento forte sobre ${b} ${EMOJIS[b] || ''}`,
  (b: string) => `Quem tá comigo no ${b}? ${EMOJIS[b] || ''} Tô confiante demais`,
  (b: string) => `Vi o ${b} ${EMOJIS[b] || ''} na rua hj kkkk é sinal`,
  (b: string) => `Meu palpite certeiro: ${b} ${EMOJIS[b] || ''} na dezena 💪`,
  (b: string) => `Apostei ${b} ${EMOJIS[b] || ''} no PT das 14h e das 16h`,
  (b: string) => `Coloquei ${b} ${EMOJIS[b] || ''} em todas as modalidades kkk`,
];

const WIN_MESSAGES = [
  (b: string, v: string) => `GANHEI R$${v} no ${b}!! ${EMOJIS[b] || ''} 🎉🎉`,
  (b: string, v: string) => `Olha isso galera!! R$${v} no ${b} ${EMOJIS[b] || ''} 💰💰`,
  (b: string, v: string) => `SAIU! ${b} ${EMOJIS[b] || ''} veio certinho! +R$${v} na conta 🤑`,
  (b: string, v: string) => `Peguei R$${v} agora no ${b} ${EMOJIS[b] || ''}!! Quem foi junto? 🏆`,
  (b: string, v: string) => `Acertei ${b} ${EMOJIS[b] || ''}!! R$${v} caiu aqui 🔥🔥`,
  (b: string, v: string) => `Meu Deus, ${b} ${EMOJIS[b] || ''} saiu!! R$${v} na minha conta agora 😭🙏`,
  (b: string, v: string) => `Não acredito, R$${v} no ${b} ${EMOJIS[b] || ''}!! Esse grupo é abençoado`,
  (b: string, v: string) => `Quem duvidou? ${b} ${EMOJIS[b] || ''} deu certinho! +R$${v} 💸`,
  (b: string, v: string) => `Acabei de sacar R$${v} do ${b} ${EMOJIS[b] || ''}!! PIX já caiu ✅`,
  (b: string, v: string) => `To tremendo aqui gente, R$${v} no ${b} ${EMOJIS[b] || ''} 😍`,
  (b: string, v: string) => `Graças a Deus, ${b} ${EMOJIS[b] || ''} saiu, R$${v} pra conta!! 🙏🙏`,
  (b: string, v: string) => `Eu avisei que o ${b} ${EMOJIS[b] || ''} ia sair! R$${v} na mão 🤩`,
];

const REACTION_MESSAGES = [
  'Boa!! 🔥🔥',
  'Vou junto! 💪',
  'Parabéns!! 🎉',
  'Esse aí sabe! 👏',
  'Tô dentro também!',
  'Showw demais!! 🤩',
  'Sensacional! Quero assim tbm 😍',
  'Qual modalidade vc jogou?',
  'Quanto apostou?',
  'Vou apostar tbm! 🚀',
  'Mandou bem demais!! 💰',
  'Esse grupo é abençoado 🙏',
  'Confia no processo! 📈',
  'Já saquei tb, caiu na hora ✅',
  'Aeee! Me passa esse palpite sempre 😂',
  'Caramba!! Que sorte, parabéns!',
  'Queria ter ido junto 😩',
  'Semana que vem eu vou tbm!',
  'Vc joga em qual modalidade normalmente?',
  'Me inspira demais esse grupo!',
  'Tô aprendendo com vocês 📝',
  'Mês passado ganhei seguindo palpite daqui',
  'Amém! Que todos nós ganhemos 🙏',
  'Bora galera, é nóis!! 💪',
  'Show! Tô acompanhando aqui',
  'Muito bom, parabéns a todos que acertaram!',
];

const GENERAL_MESSAGES = [
  'Bom dia grupo! Bora lucrar hoje? 💰',
  'Quem tá on? Compartilha o palpite aí!',
  'Qual loteria tá saindo agora?',
  'Já fez a recarga hoje? 😄',
  'Grupo tá pegando fogo! 🔥',
  'Alguém sabe que horas sai o próximo resultado?',
  'Tô de olho no PT das 14h 👀',
  'Quem mais tá na Maluca? 🎰',
  'Galera, não esqueçam de conferir os resultados!',
  'Boa sorte pra todos nós! 🍀',
  'Eae pessoal, já jogaram hoje?',
  'Quem acertou ontem? Vi que saiu uns bons',
  'Acabei de fazer minha recarga, bora jogar!',
  'Alguém tem palpite pra PT das 16h?',
  'To gostando desse grupo, sempre tem palpite bom',
  'Fala galera! Cheguei agora, o que tá rolando?',
  'Alguém jogou na Bahia hoje?',
  'Resultado da Federal já saiu?',
  'Hoje tô com fé, vai sair coisa boa!',
  'Quem mais joga na centena aqui?',
  'O grupo de ontem acertou em cheio hein!',
  'Pessoal novo no grupo, bem vindos! 🤝',
  'Bora compartilhar os palpites, juntos somos mais fortes!',
  'Tô acompanhando os resultados aqui pelo app mesmo',
  'Quem já ganhou essa semana? Conta aí!',
];

interface CommunityMessage {
  id: string;
  agent: typeof AGENTS[number];
  content: string;
  time: string;
  isUser?: boolean;
}

interface CommunityChatProps {
  open: boolean;
  onClose: () => void;
}

function getTimeNow(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Anti-repetição: rastreia últimos índices usados por categoria
const usedIndices: Record<string, number[]> = {};

function randomItemNoRepeat<T>(arr: T[], category: string): T {
  if (!usedIndices[category]) usedIndices[category] = [];
  const used = usedIndices[category];
  // Manter histórico de metade dos itens para evitar repetição
  const maxHistory = Math.max(Math.floor(arr.length / 2), 3);

  let idx: number;
  let attempts = 0;
  do {
    idx = Math.floor(Math.random() * arr.length);
    attempts++;
  } while (used.includes(idx) && attempts < 10);

  used.push(idx);
  if (used.length > maxHistory) used.shift();

  return arr[idx];
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomValue(): string {
  const values = [50, 80, 100, 150, 200, 250, 300, 450, 500, 750, 950, 1200, 1500, 2000, 3000];
  return randomItem(values).toLocaleString('pt-BR');
}

function generateAgentMessage(): CommunityMessage {
  const agent = randomItemNoRepeat(AGENTS, 'agents');
  const rand = Math.random();
  let content: string;

  if (rand < 0.35) {
    // Palpite
    const bicho = randomItem(BICHOS);
    content = randomItemNoRepeat(PALPITE_MESSAGES, 'palpite')(bicho);
  } else if (rand < 0.55) {
    // Vitória
    const bicho = randomItem(BICHOS);
    content = randomItemNoRepeat(WIN_MESSAGES, 'win')(bicho, randomValue());
  } else if (rand < 0.75) {
    // Reação
    content = randomItemNoRepeat(REACTION_MESSAGES, 'reaction');
  } else {
    // Geral
    content = randomItemNoRepeat(GENERAL_MESSAGES, 'general');
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    agent,
    content,
    time: getTimeNow(),
  };
}

// Gerar histórico inicial
function generateInitialMessages(count: number): CommunityMessage[] {
  const msgs: CommunityMessage[] = [];
  for (let i = 0; i < count; i++) {
    msgs.push(generateAgentMessage());
  }
  return msgs;
}

export function CommunityChat({ open, onClose }: CommunityChatProps) {
  const [messages, setMessages] = useState<CommunityMessage[]>(() => generateInitialMessages(15));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [memberCount] = useState(() => Math.floor(Math.random() * 200) + 350);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 80) + 120);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Auto-generate messages from agents
  useEffect(() => {
    if (!open) return;

    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 15000; // 8-23 seconds
      intervalRef.current = setTimeout(() => {
        setMessages(prev => {
          const newMsg = generateAgentMessage();
          // Keep last 50 messages
          const updated = [...prev.slice(-49), newMsg];
          return updated;
        });
        scrollToBottom();
        scheduleNext();
      }, delay);
    };

    // Start first message after 3-6 seconds
    const initialDelay = 3000 + Math.random() * 3000;
    intervalRef.current = setTimeout(() => {
      setMessages(prev => [...prev.slice(-49), generateAgentMessage()]);
      scrollToBottom();
      scheduleNext();
    }, initialDelay);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [open, scrollToBottom]);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userAgent = { name: 'Você', avatar: '', color: '#00A884' };
    const userMsg: CommunityMessage = {
      id: Math.random().toString(36).substring(2, 9),
      agent: userAgent,
      content: text,
      time: getTimeNow(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      // Wait 3-8 seconds for "agent" to respond
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));

      const res = await fetch('/api/chat-community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (data.reply) {
        const responder = randomItem(AGENTS);
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          agent: responder,
          content: data.reply,
          time: getTimeNow(),
        }]);
        scrollToBottom();
      }
    } catch {
      // Silently fail, community keeps going
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
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md h-[90vh] flex flex-col rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#075E54]">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600">
            <Users className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-white leading-tight">Grupo de Palpites</h3>
            <p className="text-[12px] text-emerald-200 leading-tight truncate">
              {memberCount} membros, {onlineCount} online
            </p>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Messages */}
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
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-1`}
            >
              {!msg.isUser && (
                <img
                  src={msg.agent.avatar}
                  alt=""
                  className="h-7 w-7 rounded-full shrink-0 mr-1.5 mt-1 object-cover"
                />
              )}
              <div
                className={`relative max-w-[78%] px-3 py-1.5 text-[14px] leading-[19px] shadow ${
                  msg.isUser
                    ? 'bg-[#005C4B] text-white rounded-lg rounded-tr-sm'
                    : 'bg-[#1F2C34] text-zinc-100 rounded-lg rounded-tl-sm'
                }`}
              >
                {!msg.isUser && (
                  <p className="text-[12px] font-semibold mb-0.5" style={{ color: msg.agent.color }}>
                    {msg.agent.name}
                  </p>
                )}
                <span className="whitespace-pre-wrap">{msg.content}</span>
                <span className="float-right ml-2 mt-1 text-[10px] text-zinc-500 leading-none">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-2 py-2 bg-[#1F2C34]">
          <div className="flex-1 flex items-center bg-[#2A3942] rounded-full px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mensagem"
              maxLength={300}
              disabled={isSending}
              className="flex-1 bg-transparent text-white text-[15px] placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00A884] text-white disabled:opacity-40 active:scale-95 transition-all"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
