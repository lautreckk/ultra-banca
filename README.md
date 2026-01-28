# Banca Forte - PWA Clone

Clone mobile-first do app de apostas "Banca Forte" usando Next.js 14 + Tailwind CSS + Supabase.

## Como Executar

```bash
cd /Users/lautreck/Desktop/Ultra\ Banca/ultra-banca
npm run dev
```

Acesse: http://localhost:3000

## Estrutura do Projeto

```
ultra-banca/
├── app/
│   ├── (auth)/           # Login, Cadastro
│   ├── (app)/            # Dashboard, Loterias, Resultados, etc.
│   └── api/scraper/      # API de scraping
├── components/
│   ├── ui/               # Button, Input, Card, Badge, Drawer
│   ├── layout/           # Header, BalanceDisplay, MobileDrawer
│   ├── dashboard/        # GameCard, ActionButton, WinnerBanner
│   ├── loterias/         # DateSelector, ModalityList, BetInput
│   ├── auth/             # LoginForm, RegisterForm
│   └── shared/           # LoadingSpinner, EmptyState
├── lib/
│   ├── constants/        # bichos, modalidades, colocacoes, horarios
│   ├── supabase/         # client, server, middleware
│   ├── scraper/          # resultado-facil.ts
│   └── utils/            # cn, formatCurrency, formatDate, maskCPF
├── stores/
│   └── bet-store.ts      # Zustand store para carrinho
└── types/                # auth, bet, result
```

## Paleta de Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| Amarelo/Ouro | `#D4A84B` | Botoes primarios, destaques |
| Preto | `#000000` | Fundo login, cards escuros |
| Branco | `#FFFFFF` | Fundo dashboard, textos |
| Teal | `#5FBDBD` | Card Recarga PIX |
| Laranja | `#E67E22` | Textos de destaque |
| Azul | `#3498DB` | Multiplicadores, links |

## Paginas Implementadas

- `/login` - Tela de login
- `/cadastro` - Tela de cadastro
- `/` - Dashboard principal
- `/loterias` - Selecao de tipo de jogo
- `/loterias/[tipo]` - Selecao de data
- `/loterias/[tipo]/[data]` - Modalidades
- `/loterias/[tipo]/[data]/[modalidade]` - Colocacoes
- `/loterias/[tipo]/[data]/[modalidade]/[colocacao]` - Palpite + Horarios
- `/apostas` - Carrinho de apostas
- `/resultados` - Lista de resultados
- `/recarga-pix` - Recarga via PIX
- `/saques` - Solicitacao de saque
- `/premiadas` - Apostas ganhas
- `/relatorios` - Estatisticas
- `/fazendinha` - Selecao de bichos

## Proximos Passos

1. Configurar Supabase (`.env.local`)
2. Criar tabelas no banco (ver `data.blueprint`)
3. Adicionar imagens reais para icones PWA
4. Conectar autenticacao real

## Blueprints de Referencia

- `/Users/lautreck/Desktop/Ultra Banca/structure.blueprint`
- `/Users/lautreck/Desktop/Ultra Banca/ui.blueprint`
- `/Users/lautreck/Desktop/Ultra Banca/data.blueprint`
