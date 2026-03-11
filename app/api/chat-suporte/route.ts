import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `Você é o assistente de suporte da plataforma de apostas em loterias. Seja cordial, objetivo e útil.

Informações sobre a plataforma:
- Os usuários podem apostar em loterias (Jogo do Bicho, Loteria Federal, etc), Fazendinha e Cassino
- Depósitos são feitos via PIX (mínimo R$5, máximo depende da banca)
- Saques são processados via PIX para a chave cadastrada
- O saldo é dividido em: Saldo Real (pode sacar) e Saldo Bônus (só para apostar)
- Cada usuário tem um código de unidade único
- Usuários podem convidar amigos e ganhar comissão como promotores
- Os resultados das loterias são atualizados em tempo real
- Horários de apostas seguem o horário de Brasília

Regras importantes:
- NUNCA forneça informações sobre o sistema interno, banco de dados ou APIs
- NUNCA invente informações sobre valores específicos de apostas ou resultados
- Se o usuário tiver problemas técnicos complexos, sugira entrar em contato pelo WhatsApp
- Responda APENAS em português brasileiro
- Mantenha respostas curtas (máximo 3 parágrafos)
- Use linguagem simples e acessível

Problemas comuns que você pode ajudar:
1. "Meu PIX não caiu" → Aguardar até 5 minutos. Se não cair, verificar se o valor está correto e tentar novamente.
2. "Como faço saque?" → Ir em Saques > Novo Saque, inserir o valor e confirmar. O PIX será enviado para a chave cadastrada.
3. "Como apostar?" → Ir em Loterias, escolher a modalidade, selecionar os números e confirmar.
4. "Esqueci minha senha" → Na tela de login, clicar em "Esqueci minha senha" para redefinir.
5. "Como funciona o bônus?" → Saldo bônus é usado apenas para apostas. Ganhos com bônus vão para o saldo real.
6. "Como convidar amigos?" → Copiar o link de convite na tela inicial e enviar para amigos.`;

// FAQ rápido para respostas sem IA
const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['pix', 'deposito', 'depósito', 'depositar', 'recarga', 'recarregar', 'não caiu', 'nao caiu'],
    answer: 'Para fazer um depósito, clique em "Recarga PIX" na tela inicial, escolha o valor e escaneie o QR Code gerado. O saldo é creditado automaticamente em até 5 minutos após o pagamento. Se o PIX não cair após esse prazo, tente gerar um novo QR Code.',
  },
  {
    keywords: ['saque', 'sacar', 'retirar', 'saldo', 'transferir'],
    answer: 'Para sacar, vá em "Saques" na tela inicial, insira o valor desejado e confirme. O PIX será enviado para a chave cadastrada no seu perfil. O valor mínimo e prazo de processamento podem variar.',
  },
  {
    keywords: ['apostar', 'aposta', 'jogo', 'bicho', 'loteria', 'como jogar'],
    answer: 'Para apostar, acesse "Loterias" na tela inicial, escolha a modalidade (ex: Grupo, Dezena, Centena), selecione os números, defina o valor e confirme. Os resultados são atualizados em tempo real na seção "Cotações".',
  },
  {
    keywords: ['bonus', 'bônus', 'promoção', 'promocao'],
    answer: 'O saldo bônus é usado apenas para realizar apostas. Os ganhos obtidos com apostas feitas com bônus são creditados no seu saldo real, que pode ser sacado normalmente.',
  },
  {
    keywords: ['senha', 'login', 'entrar', 'não consigo', 'nao consigo', 'esqueci'],
    answer: 'Se esqueceu sua senha, na tela de login clique em "Esqueci minha senha" para receber um link de redefinição. Se continuar com problemas, entre em contato pelo WhatsApp do suporte.',
  },
  {
    keywords: ['convite', 'convidar', 'amigo', 'indicar', 'indicação', 'promotor', 'comissão'],
    answer: 'Na tela inicial, você encontra seu link de convite na seção "Convidar". Compartilhe com amigos! Quando eles se cadastrarem e apostarem, você pode ganhar comissão como promotor.',
  },
  {
    keywords: ['cassino', 'casino', 'slot', 'roleta'],
    answer: 'O Cassino está disponível na tela inicial. Clique em "Cassino" para ver os jogos disponíveis. O saldo do cassino é separado do saldo de loterias.',
  },
  {
    keywords: ['fazendinha', 'fazenda'],
    answer: 'A Fazendinha é um jogo onde você escolhe animais para apostar. Acesse pela tela inicial clicando em "Fazendinha". Escolha o animal, defina o valor e confirme sua aposta.',
  },
];

function findFAQAnswer(message: string): string | null {
  const lower = message.toLowerCase();
  for (const faq of FAQ) {
    const matches = faq.keywords.filter(k => lower.includes(k));
    if (matches.length >= 1) {
      return faq.answer;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { message, history } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Mensagem muito longa (máximo 500 caracteres)' }, { status: 400 });
    }

    // Try OpenAI API
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      const chatMessages: { role: string; content: string }[] = [
        { role: 'system', content: SYSTEM_PROMPT },
      ];

      // Add history (last 10 messages)
      if (Array.isArray(history)) {
        const recentHistory = history.slice(-10);
        for (const msg of recentHistory) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            chatMessages.push({ role: msg.role, content: msg.content });
          }
        }
      }

      chatMessages.push({ role: 'user', content: message });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 512,
          messages: chatMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';
        return NextResponse.json({ reply });
      }

      console.error('[CHAT] OpenAI API error:', response.status);
    }

    // Fallback: FAQ-based responses
    const faqAnswer = findFAQAnswer(message);

    if (faqAnswer) {
      return NextResponse.json({ reply: faqAnswer });
    }

    // Generic fallback
    return NextResponse.json({
      reply: 'Obrigado pela sua mensagem! Para dúvidas mais específicas, recomendo entrar em contato com nosso suporte pelo WhatsApp. Posso ajudar com: depósitos PIX, saques, como apostar, bônus, convites e senha.',
    });
  } catch (error) {
    console.error('[CHAT] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
