# Requirements: 44X Casino

**Defined:** 2026-03-25
**Core Value:** Usuarios acessam e navegam jogos de cassino instantaneamente sem barreira de login

## v1 Requirements

### Middleware & Roteamento

- [ ] **MW-01**: Usuario nao autenticado acessa home do 44x.site sem redirecionamento para /login
- [ ] **MW-02**: Middleware identifica plataforma 44x.site e aplica regras especificas de acesso
- [ ] **MW-03**: Rotas de loteria/bicho retornam 404 ou redirect para home no dominio 44x.site

### Home Casino

- [ ] **HOME-01**: Home do 44x.site exibe grid de jogos de cassino como conteudo principal
- [ ] **HOME-02**: Barra de busca de jogos funcional na home
- [ ] **HOME-03**: Home usa layout Elite (dark navy + gold) igual Banca Cristal
- [ ] **HOME-04**: Home e responsiva mobile-first com grid 3 colunas em mobile

### Autenticacao Modal

- [ ] **AUTH-01**: Modal de login/cadastro abre ao clicar em "Entrar" ou "Cadastre-se" no header
- [ ] **AUTH-02**: Modal de login/cadastro abre ao tentar jogar um jogo sem estar logado
- [ ] **AUTH-03**: Modal tem abas Entrar/Cadastrar com transicao suave
- [ ] **AUTH-04**: Apos login/cadastro bem-sucedido, modal fecha e estado atualiza sem redirect
- [ ] **AUTH-05**: Cadastro usa CPF como identificador (padrao Ultra Banca)

### Header & Navegacao

- [ ] **NAV-01**: Header exibe logo da plataforma + botoes "Entrar" e "Cadastre-se" para usuario nao logado
- [ ] **NAV-02**: Header exibe saldo + icone perfil para usuario logado (igual EliteHeader atual)
- [ ] **NAV-03**: Bottom nav adaptado para casino-only (Home, Cassino, Carteira, Perfil) sem "Apostar" loteria
- [ ] **NAV-04**: Bottom nav so aparece para usuarios logados

### Admin & Plataforma

- [ ] **ADM-01**: Conta admin criada e funcional para plataforma 44X Casino
- [ ] **ADM-02**: Painel /admin existente funciona corretamente com platform_id da 44X
- [ ] **ADM-03**: Casino management funcional em /admin/cassino para 44X

## v2 Requirements

### Engajamento

- **ENG-01**: Ticker de vitorias recentes animado na home
- **ENG-02**: Ranking "Mais Jogados da Semana" com posicoes numeradas
- **ENG-03**: Secao "Mais Pagou Hoje" com social proof
- **ENG-04**: Carousel de promocoes configuravel pelo admin

### Sidebar & Categorias

- **CAT-01**: Sidebar com categorias de jogos (Slots, Crash, PG, Roleta, etc)
- **CAT-02**: Paginas de categoria /casino/slots, /casino/crash, etc
- **CAT-03**: Grid de provedores ativos

### Popups & Banners Admin

- **POP-01**: Tabela platform_popups com tipos (banner_home, popup_entrada, ticker)
- **POP-02**: Tela /admin/popups para gerenciar popups por plataforma
- **POP-03**: Componente PlatformPopupManager com logica de exibicao

## Out of Scope

| Feature | Reason |
|---------|--------|
| Jogo do bicho no 44x.site | Dominio dedicado a casino-only |
| Loterias no 44x.site | Dominio dedicado a casino-only |
| Esportes/apostas esportivas | Nao oferecido no 44x.site |
| Alteracoes em outras bancas | Escopo isolado a 44x.site |
| Chat ao vivo | Complexidade alta, WhatsApp ja existe |
| App mobile nativo | Web-first, PWA ja existente |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MW-01 | Phase 1 | Pending |
| MW-02 | Phase 1 | Pending |
| MW-03 | Phase 1 | Pending |
| HOME-01 | Phase 2 | Pending |
| HOME-02 | Phase 2 | Pending |
| HOME-03 | Phase 2 | Pending |
| HOME-04 | Phase 2 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| AUTH-05 | Phase 2 | Pending |
| NAV-01 | Phase 2 | Pending |
| NAV-02 | Phase 2 | Pending |
| NAV-03 | Phase 2 | Pending |
| NAV-04 | Phase 2 | Pending |
| ADM-01 | Phase 3 | Pending |
| ADM-02 | Phase 3 | Pending |
| ADM-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after initial definition*
