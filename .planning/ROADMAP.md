# Roadmap: 44X Casino

**Created:** 2026-03-25
**Phases:** 3
**Granularity:** Coarse

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Middleware & Roteamento | Permitir acesso publico a home do 44x.site sem login | MW-01, MW-02, MW-03 | 3 |
| 2 | Home Casino + Auth Modal | Home com jogos e autenticacao via modal | HOME-01..04, AUTH-01..05, NAV-01..04 | 5 |
| 3 | Admin & Finalizacao | Admin funcional e polish final | ADM-01..03 | 3 |

---

## Phase 1: Middleware & Roteamento

**Goal:** Permitir que usuarios nao autenticados acessem a home do 44x.site sem serem redirecionados para /login. Bloquear rotas de loteria.

**Requirements:** MW-01, MW-02, MW-03

**Success Criteria:**
1. Acessar 44x.site sem login exibe a home (nao redireciona para /login)
2. Acessar 44x.site/loterias/* redireciona para home
3. Outras bancas continuam redirecionando para /login normalmente

**Key files:**
- `lib/supabase/middleware.ts` — logica de roteamento condicional
- `middleware.ts` — rate limiting e delegacao

---

## Phase 2: Home Casino + Auth Modal

**Goal:** Criar a home casino-only para 44x.site com grid de jogos PlayFivers, header adaptado com botoes Entrar/Cadastrar, bottom nav casino, e modal de autenticacao.

**Requirements:** HOME-01, HOME-02, HOME-03, HOME-04, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, NAV-01, NAV-02, NAV-03, NAV-04

**Success Criteria:**
1. Home do 44x.site exibe grid de jogos de cassino com busca funcional
2. Clicar "Entrar" ou "Cadastre-se" no header abre modal (nao redireciona)
3. Clicar em jogo sem login abre modal de auth, apos login jogo inicia
4. Header mostra saldo quando logado, botoes auth quando nao logado
5. Bottom nav mostra apenas opcoes de casino (sem Apostar loteria)

**Key files:**
- `components/layouts/elite/` — layout base (reutilizar)
- `components/casino/casino-lobby.tsx` — grid de jogos (reutilizar)
- Novo: `components/auth/auth-modal.tsx` — modal de login/cadastro
- Novo: `app/(app)/home/casino-home.tsx` — home casino-only

---

## Phase 3: Admin & Finalizacao

**Goal:** Criar conta admin para 44X Casino e garantir que o painel admin funciona corretamente com a plataforma.

**Requirements:** ADM-01, ADM-02, ADM-03

**Success Criteria:**
1. Admin consegue fazer login no painel /admin da 44X Casino
2. Pagina /admin/cassino lista jogos e configuracoes PlayFivers
3. Configuracoes da plataforma editaveis em /admin/configuracoes

**Key files:**
- Supabase: criar usuario admin + admin_roles entry
- `app/admin/` — painel existente (verificar compatibilidade)

---

## Dependencies

```
Phase 1 (Middleware) → Phase 2 (Home + Auth) → Phase 3 (Admin)
```

Phase 1 deve ser concluida primeiro pois Phase 2 depende do acesso publico a home.
Phase 3 pode ser parcialmente paralelizada com Phase 2 (criacao do admin no Supabase).

---
*Roadmap created: 2026-03-25*
