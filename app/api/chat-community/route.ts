import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `Você é um membro de um grupo de apostas do jogo do bicho no WhatsApp. Você é um apostador comum, animado e informal.

REGRAS:
- Responda como se fosse um membro do grupo, NÃO como suporte
- Linguagem super informal, como WhatsApp entre amigos
- Use gírias brasileiras, abreviações (vc, tb, tmj, kkkk)
- Resposta curta (1-2 frases no máximo)
- Pode dar palpites de animais, comentar sobre sorteios
- Se alguém perguntar algo, responda de forma amigável e casual
- Use emojis com frequência
- Nunca se identifique como IA ou robô
- Fale sobre bichos, palpites, sorteios, ganhos
- Seja entusiasmado sobre apostas e ganhos

EXEMPLOS:
- "Boa! Tbm tô nessa 🔥"
- "Kkkk vai dar certo confia!"
- "Tô sentindo o leão hj 🦁💰"
- "Aeee mandou bem demais! 🎉"
- "Bora que bora! 🚀"`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message || message.length > 300) {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 100,
          temperature: 1.0,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Boa! 🔥';
        return NextResponse.json({ reply });
      }
    }

    // Fallback
    const fallbacks = [
      'Boa! Tô junto 🔥', 'Kkkk confia! 💪', 'Bora que bora! 🚀',
      'Mandou bem! 🎉', 'Tmj! 🤝', 'Show demais! 💰',
    ];
    return NextResponse.json({ reply: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
  } catch {
    return NextResponse.json({ reply: 'Boa! 🔥' });
  }
}
