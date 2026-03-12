'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, ChevronLeft, Users } from 'lucide-react';

// ============================================================================
// AGENTES / MEMBROS FAKE DA COMUNIDADE
// ============================================================================

const AGENTS = [
  { name: 'Seu Carlos', phone: '(21) 98745-3201', avatar: 'https://randomuser.me/api/portraits/men/72.jpg', color: '#E91E63' },
  { name: 'Dona Maria', phone: '(11) 99632-4518', avatar: 'https://randomuser.me/api/portraits/women/79.jpg', color: '#9C27B0' },
  { name: 'Roberto S.', phone: '(31) 97814-6230', avatar: 'https://randomuser.me/api/portraits/men/62.jpg', color: '#FF9800' },
  { name: 'Cláudia R.', phone: '(85) 99421-7853', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', color: '#4CAF50' },
  { name: 'Toninho', phone: '(71) 98536-1492', avatar: 'https://randomuser.me/api/portraits/men/55.jpg', color: '#2196F3' },
  { name: 'Vera Lúcia', phone: '(19) 99187-3640', avatar: 'https://randomuser.me/api/portraits/women/52.jpg', color: '#FF5722' },
  { name: 'Seu Jorge', phone: '(27) 98342-5917', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', color: '#00BCD4' },
  { name: 'Neide F.', phone: '(61) 99758-2034', avatar: 'https://randomuser.me/api/portraits/women/58.jpg', color: '#E040FB' },
  { name: 'Marcos V.', phone: '(41) 98123-4567', avatar: 'https://randomuser.me/api/portraits/men/41.jpg', color: '#FFEB3B' },
  { name: 'Rosângela', phone: '(51) 99647-8312', avatar: 'https://randomuser.me/api/portraits/women/45.jpg', color: '#8BC34A' },
  { name: 'Edson P.', phone: '(13) 98456-7201', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', color: '#03A9F4' },
  { name: 'Sandra M.', phone: '(81) 99234-5618', avatar: 'https://randomuser.me/api/portraits/women/62.jpg', color: '#F44336' },
  { name: 'Zé Antônio', phone: '(62) 98712-3490', avatar: 'https://randomuser.me/api/portraits/men/74.jpg', color: '#795548' },
  { name: 'Marlene', phone: '(47) 99563-1278', avatar: 'https://randomuser.me/api/portraits/women/71.jpg', color: '#607D8B' },
  { name: 'Valdir', phone: '(83) 98347-6521', avatar: 'https://randomuser.me/api/portraits/men/58.jpg', color: '#FF6F00' },
];

// Tabela oficial do Jogo do Bicho com dezenas corretas
const BICHO_TABLE = [
  { grupo: 1,  nome: 'Avestruz',   emoji: '🦆', dezenas: ['01','02','03','04'] },
  { grupo: 2,  nome: 'Águia',      emoji: '🦅', dezenas: ['05','06','07','08'] },
  { grupo: 3,  nome: 'Burro',      emoji: '🫏', dezenas: ['09','10','11','12'] },
  { grupo: 4,  nome: 'Borboleta',  emoji: '🦋', dezenas: ['13','14','15','16'] },
  { grupo: 5,  nome: 'Cachorro',   emoji: '🐕', dezenas: ['17','18','19','20'] },
  { grupo: 6,  nome: 'Cabra',      emoji: '🐐', dezenas: ['21','22','23','24'] },
  { grupo: 7,  nome: 'Carneiro',   emoji: '🐏', dezenas: ['25','26','27','28'] },
  { grupo: 8,  nome: 'Camelo',     emoji: '🐫', dezenas: ['29','30','31','32'] },
  { grupo: 9,  nome: 'Cobra',      emoji: '🐍', dezenas: ['33','34','35','36'] },
  { grupo: 10, nome: 'Coelho',     emoji: '🐇', dezenas: ['37','38','39','40'] },
  { grupo: 11, nome: 'Cavalo',     emoji: '🐴', dezenas: ['41','42','43','44'] },
  { grupo: 12, nome: 'Elefante',   emoji: '🐘', dezenas: ['45','46','47','48'] },
  { grupo: 13, nome: 'Galo',       emoji: '🐓', dezenas: ['49','50','51','52'] },
  { grupo: 14, nome: 'Gato',       emoji: '🐱', dezenas: ['53','54','55','56'] },
  { grupo: 15, nome: 'Jacaré',     emoji: '🐊', dezenas: ['57','58','59','60'] },
  { grupo: 16, nome: 'Leão',       emoji: '🦁', dezenas: ['61','62','63','64'] },
  { grupo: 17, nome: 'Macaco',     emoji: '🐒', dezenas: ['65','66','67','68'] },
  { grupo: 18, nome: 'Porco',      emoji: '🐷', dezenas: ['69','70','71','72'] },
  { grupo: 19, nome: 'Pavão',      emoji: '🦚', dezenas: ['73','74','75','76'] },
  { grupo: 20, nome: 'Peru',       emoji: '🦃', dezenas: ['77','78','79','80'] },
  { grupo: 21, nome: 'Touro',      emoji: '🐂', dezenas: ['81','82','83','84'] },
  { grupo: 22, nome: 'Tigre',      emoji: '🐅', dezenas: ['85','86','87','88'] },
  { grupo: 23, nome: 'Urso',       emoji: '🐻', dezenas: ['89','90','91','92'] },
  { grupo: 24, nome: 'Veado',      emoji: '🦌', dezenas: ['93','94','95','96'] },
  { grupo: 25, nome: 'Vaca',       emoji: '🐄', dezenas: ['97','98','99','00'] },
];

type BichoEntry = typeof BICHO_TABLE[number];

const SORTEIOS = ['PT 09h', 'PT 11h', 'PT 14h', 'PT 16h', 'PT 18h', 'PT 21h', 'Maluca 09h', 'Maluca 11h', 'Maluca 14h', 'Maluca 16h', 'Maluca 18h', 'Maluca 21h', 'Federal', 'Bahia 10h', 'Bahia 12h', 'Bahia 15h', 'Bahia 19h', 'Nacional'];

// Gera milhar aleatória baseada nas dezenas do bicho
function randomMilhar(bicho: BichoEntry): string {
  const dez = randomItem(bicho.dezenas);
  const prefix = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `${prefix}${dez}`;
}

// Gera centena aleatória baseada nas dezenas do bicho
function randomCentena(bicho: BichoEntry): string {
  const dez = randomItem(bicho.dezenas);
  const prefix = String(Math.floor(Math.random() * 10));
  return `${prefix}${dez}`;
}

// Gera uma sequência de milhares "ate" no formato do jogo
function randomMilharRange(bicho: BichoEntry): string {
  const base = randomMilhar(bicho);
  const baseNum = parseInt(base);
  const end = String(baseNum + 3).padStart(4, '0');
  return `${base}ate${end}`;
}

// Gera um LOOK (lista de emojis + dezenas de bichos variados)
function generateLook(): string {
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 linhas
  const lines: string[] = ['LOOK 👀'];
  const rows = Math.ceil(count * 3 / 3);
  for (let r = 0; r < rows; r++) {
    const items: string[] = [];
    for (let c = 0; c < 3; c++) {
      const b = randomItem(BICHO_TABLE);
      const dez = randomItem(b.dezenas);
      items.push(`${b.emoji}${dez}`);
    }
    lines.push(items.join(' '));
  }
  return lines.join('\n');
}

// Gera palpite técnico com números reais do bicho
function generatePalpiteTecnico(): string {
  const bicho = randomItem(BICHO_TABLE);
  const sorteio = randomItem(SORTEIOS);
  const templates = [
    // Formato "Nacional" com milhares
    () => {
      const b1 = randomItem(BICHO_TABLE);
      const b2 = randomItem(BICHO_TABLE);
      const lines = [
        `${sorteio}`,
        `${randomMilharRange(b1)} ${randomMilhar(b2)} ${randomMilhar(bicho)}`,
        `${randomMilharRange(bicho)} ${randomMilhar(b1)}`,
        `${randomMilharRange(b2)}`,
      ];
      return lines.join('\n');
    },
    // Formato "Hoje vamos atrás do BICHO"
    () => {
      const dezenas = bicho.dezenas.map(d => randomMilhar({ ...bicho, dezenas: [d] }));
      return `Hoje nós vamos atrás do ${bicho.nome.toUpperCase()} ${bicho.emoji}\n${dezenas.join(' - ')}`;
    },
    // Formato LOOK
    () => generateLook(),
    // Palpite simples com dezenas
    () => {
      const dez = bicho.dezenas.join(' - ');
      return `Meu palpite pro ${sorteio}:\n${bicho.emoji} ${bicho.nome} (${dez})\nConfia! 🔥`;
    },
    // Palpite com milhar e centena
    () => {
      const mil = randomMilhar(bicho);
      const cen = randomCentena(bicho);
      return `${sorteio}\n${bicho.emoji} ${bicho.nome}\nMilhar: ${mil}\nCentena: ${cen}\nBora! 💪`;
    },
    // Múltiplos bichos
    () => {
      const b2 = randomItem(BICHO_TABLE);
      const b3 = randomItem(BICHO_TABLE);
      return `Meus palpites de hoje:\n${bicho.emoji}${randomItem(bicho.dezenas)} ${b2.emoji}${randomItem(b2.dezenas)} ${b3.emoji}${randomItem(b3.dezenas)}\nQuem vai junto? 🎯`;
    },
    // Dezena com confiança
    () => {
      const dez = randomItem(bicho.dezenas);
      return `Tô com a ${dez} na cabeça o dia todo ${bicho.emoji}\n${bicho.nome} vai sair, pode anotar!`;
    },
  ];
  return randomItem(templates)();
}

// Mensagens de palpites simples (texto corrido sem números)
const PALPITE_SIMPLES = [
  (b: BichoEntry) => `Tô sentindo o ${b.nome} forte hoje ${b.emoji}`,
  (b: BichoEntry) => `Galera, bora no ${b.nome}! ${b.emoji} Pressentimento bom demais`,
  (b: BichoEntry) => `${b.nome} ${b.emoji} tá pedindo pra sair, confia!`,
  (b: BichoEntry) => `Sonhei com ${b.nome} ${b.emoji} ontem à noite, vou meter ficha!`,
  (b: BichoEntry) => `Minha vizinha sonhou com ${b.nome} ${b.emoji}, vou apostar!`,
  (b: BichoEntry) => `Faz 3 dias que o ${b.nome} ${b.emoji} não sai, hj é o dia`,
  (b: BichoEntry) => `Pessoal, ${b.nome} ${b.emoji} na cabeça desde ontem, vou arriscar`,
  (b: BichoEntry) => `Vi ${b.nome} ${b.emoji} na rua hj kkkk é sinal`,
  (b: BichoEntry) => `Quem tá comigo no ${b.nome}? ${b.emoji} Tô confiante demais`,
  (b: BichoEntry) => `${b.nome} ${b.emoji} no grupo do 1º ao 5º, quem vai?`,
  (b: BichoEntry) => { const dez = randomItem(b.dezenas); return `Dezena ${dez} do ${b.nome} ${b.emoji}, vou na centena e milhar tb`; },
  (b: BichoEntry) => { const dez = b.dezenas.join(', '); return `${b.nome} ${b.emoji} (${dez}) não tem como errar hoje!`; },
];

const WIN_MESSAGES = [
  (b: BichoEntry, v: string) => `GANHEI R$${v} no ${b.nome}!! ${b.emoji} 🎉🎉`,
  (b: BichoEntry, v: string) => `Olha isso galera!! R$${v} no ${b.nome} ${b.emoji} 💰💰`,
  (b: BichoEntry, v: string) => { const dez = randomItem(b.dezenas); return `SAIU! ${b.nome} ${b.emoji} dezena ${dez} veio certinho! +R$${v} na conta 🤑`; },
  (b: BichoEntry, v: string) => `Peguei R$${v} agora no ${b.nome} ${b.emoji}!! Quem foi junto? 🏆`,
  (b: BichoEntry, v: string) => { const mil = randomMilhar(b); return `Acertei a milhar ${mil} do ${b.nome} ${b.emoji}!! R$${v} caiu aqui 🔥🔥`; },
  (b: BichoEntry, v: string) => `Meu Deus, ${b.nome} ${b.emoji} saiu!! R$${v} na minha conta agora 😭🙏`,
  (b: BichoEntry, v: string) => { const cen = randomCentena(b); return `Centena ${cen} do ${b.nome} ${b.emoji}!! R$${v} pra conta 💸`; },
  (b: BichoEntry, v: string) => `Acabei de sacar R$${v} do ${b.nome} ${b.emoji}!! PIX já caiu ✅`,
  (b: BichoEntry, v: string) => `To tremendo aqui gente, R$${v} no ${b.nome} ${b.emoji} 😍`,
  (b: BichoEntry, v: string) => `Graças a Deus, ${b.nome} ${b.emoji} saiu, R$${v} pra conta!! 🙏🙏`,
  (b: BichoEntry, v: string) => `Eu avisei que o ${b.nome} ${b.emoji} ia sair! R$${v} na mão 🤩`,
  (b: BichoEntry, v: string) => { const mil = randomMilhar(b); return `Milhar ${mil} saiu no ${b.nome} ${b.emoji}! R$${v} limpo 🤑🤑`; },
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

  if (rand < 0.25) {
    // Palpite técnico com números reais
    content = generatePalpiteTecnico();
  } else if (rand < 0.40) {
    // Palpite simples (texto)
    const bicho = randomItem(BICHO_TABLE);
    content = randomItemNoRepeat(PALPITE_SIMPLES, 'palpite_simples')(bicho);
  } else if (rand < 0.60) {
    // Vitória
    const bicho = randomItem(BICHO_TABLE);
    content = randomItemNoRepeat(WIN_MESSAGES, 'win')(bicho, randomValue());
  } else if (rand < 0.80) {
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

  // Lock body scroll when chat is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [open, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userAgent = { name: 'Você', phone: '', avatar: '', color: '#00A884' };
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
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md flex flex-col rounded-t-2xl shadow-2xl overflow-hidden" style={{ height: '100dvh', maxHeight: '100dvh' }}>

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
                    {msg.agent.phone ? `${msg.agent.name} ~${msg.agent.phone}` : msg.agent.name}
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
