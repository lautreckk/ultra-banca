# 44X Casino — Home Casino-Only para 44x.site

## What This Is

Transformar o dominio 44x.site em uma plataforma de cassino online pura, sem tela de login bloqueante. A home exibe jogos PlayFivers imediatamente, com autenticacao via modal flutuante. O design segue o layout Elite (layout_id 3) inspirado na Banca Cristal, com estetica premium dark navy + gold.

## Core Value

Usuarios acessam e navegam jogos de cassino instantaneamente sem barreira de login — conversao maximizada com cadastro por modal contextual ao clicar em jogar.

## Requirements

### Validated

- ✓ Plataforma 44X Casino criada no Supabase (platform_id: 478aa7d1-d804-42b2-aa7f-5ef976d5dfe6)
- ✓ PlayFivers configurado para a plataforma
- ✓ Dominio 44x.site configurado na Vercel
- ✓ Layout Elite (layout_id 3) ja existe e funciona na Banca Cristal

### Active

- [ ] Home casino-only para 44x.site (sem tela de login como pagina inicial)
- [ ] Modal de autenticacao (login/cadastro) em vez de redirecionamento para /login
- [ ] Header com logo + botoes Entrar/Cadastrar (usuario nao logado)
- [ ] Header com saldo + perfil (usuario logado) — igual Elite atual
- [ ] Grid de jogos de cassino como conteudo principal da home
- [ ] Busca de jogos na home
- [ ] Bottom nav adaptado para casino-only (sem Apostar loteria)
- [ ] Middleware permite acesso a home sem autenticacao para 44x.site
- [ ] Ao clicar em jogar sem estar logado, abre modal de auth
- [ ] Admin funcional via mesmo painel /admin existente
- [ ] Conta admin criada para a plataforma 44X Casino

### Out of Scope

- Sidebar complexa com categorias — v2, complexidade alta para v1
- Ticker de vitorias em tempo real — v2, requer dados acumulados
- Ranking "mais jogados da semana" — v2, requer metricas acumuladas
- Sistema de popups/banners admin — v2, feature separada
- Promo carousel — v2, depende de conteudo do admin
- Provedores grid — v2
- Alteracoes em outras bancas — escopo exclusivo 44x.site
- Jogo do bicho, loterias, esportes — nao disponivel neste dominio

## Context

- Ultra Banca e um sistema multi-tenant com platform_id isolando cada plataforma
- O layout Elite (Banca Cristal) e a referencia visual: dark navy #0C0E14, gold #FFD700, mobile-first
- PlayFivers ja esta integrado — CasinoLobby + GameCard funcionam em qualquer layout
- O middleware atual redireciona para /login quando nao autenticado
- A plataforma 44x.site deve ser a UNICA afetada pelas mudancas de roteamento
- CPF e usado como identificador principal, convertido para email

## Constraints

- **Stack**: Next.js 16, React 19, Tailwind v4, Supabase — ja existente
- **Layout**: Elite (layout_id 3) — reutilizar componentes existentes da Cristal
- **Multi-tenant**: Todas mudancas filtradas por platform_id, sem hardcode
- **Backward compat**: Nenhuma banca existente pode ser afetada
- **Mobile-first**: Max-width md, otimizado para mobile

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Layout Elite (3) para 44x | Usuario gostou da Cristal, design premium | — Pending |
| Casino-only sem loteria | Foco em conversao cassino, dominio dedicado | — Pending |
| Modal auth em vez de pagina | Reduz fricao, usuario nao sai da home | — Pending |
| Middleware condicional por platform | Isola mudanca apenas para 44x.site | — Pending |

---
*Last updated: 2026-03-25 after initialization*
