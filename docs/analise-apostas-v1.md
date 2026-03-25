# Análise Completa do Sistema de Apostas V1 — Migração para V2

> Documento de referência para migração. Cobre **todo o fluxo** de apostas do início ao fim para cada tipo de jogo.
> Gerado em: 2026-03-16

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Loterias Disponíveis por Jogo](#2-loterias-disponíveis-por-jogo)
3. [Fluxo Completo de Aposta (Passo a Passo)](#3-fluxo-completo-de-aposta)
4. [Modalidades e Multiplicadores](#4-modalidades-e-multiplicadores)
5. [Regras de Horário e Corte](#5-regras-de-horário-e-corte)
6. [Verificação de Prêmio](#6-verificação-de-prêmio)
7. [Estrutura de Dados](#7-estrutura-de-dados)
8. [Pagamento e Saldo](#8-pagamento-e-saldo)
9. [Configuração por Banca (Multi-Tenant)](#9-configuração-por-banca-multi-tenant)
10. [Fazendinha — Detalhamento Específico](#10-fazendinha)
11. [Jogos Acumulados — Quininha, Seninha, Lotinha](#11-jogos-acumulados)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ULTRA BANCA SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐     ┌──────────────────┐                      │
│  │  Scraper (Modal)  │────▶│  Next.js Frontend │                     │
│  │  - ResultadoFacil │     │  - Bet Placement   │                    │
│  │  - PortalBrasil   │     │  - Admin Panel     │                    │
│  │  - 14+ States     │     │  - Dashboards      │                    │
│  └──────────────────┘     └──────────────────┘                      │
│           │ Every 30 min           │ REST API / RPC                  │
│           ▼                        ▼                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              SUPABASE (PostgreSQL + Auth + RLS)                │  │
│  │  resultados │ apostas │ profiles │ platform_modalidades       │  │
│  │  transactions │ verificacao_apostas │ modalidades_config      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Stack**: Next.js 16 + React 19 + Supabase + Modal.com (Python scraper)
**Multi-tenant**: Toda tabela usa `platform_id`. Cada banca tem odds, gateway e config independentes.

---

## 2. Loterias Disponíveis por Jogo

### 2.1 Taxonomia de Tipos de Jogo

| Tipo | Fonte | Nº Bancas | Nº Subloterias | Draws/Dia |
|------|-------|-----------|----------------|-----------|
| **Loterias** | Bancas estaduais (jogo do bicho) | 20 | 151+ | ~80+ |
| **Fazendinha** | LOOK/GOIAS 23:19 + NACIONAL 22:59 | 2 | 2 | 2 |
| **Quininha** | Caixa Federal - Quina | 1 | 1 | 1 (20:00) |
| **Seninha** | Caixa Federal - Mega-Sena | 1 | 1 | 1 (20:00) |
| **Lotinha** | Caixa Federal - Lotofácil | 1 | 1 | 1 (20:00) |

### 2.2 Bancas e Subloterias — Loterias

**20 bancas principais**, cada uma com subloterias Normal + MALUCA:

| Banca | ID | Subloterias | Horários |
|-------|----|-----------:|----------|
| **FEDERAL** | `federal` | 1 | 19:00 (Qua/Sáb) |
| **RIO/FEDERAL** | `rio_federal` | 12 | 09:20, 11:00, 14:20, 16:00, 19:00, 21:20 |
| **BAHIA** | `bahia` | 10 | 10:00, 12:00, 15:00, 20:00, 21:00 |
| **NACIONAL** | `nacional` | 16 | 02:00, 08:00, 10:00, 12:00, 15:00, 17:00, 21:00, 23:00 |
| **LOOK/GOIAS** | `look_goias` | 14 | 07:00, 09:00, 11:00, 14:00, 16:00, 18:00, 21:00 |
| **BOASORTE/GOIAS** | `boasorte_goias` | 12 | 09:20, 11:20, 14:20, 16:20, 18:20, 21:20 |
| **LOTEP/PE** | `lotep_pe` | 12 | 09:20, 10:00, 12:40, 15:40, 18:30, 20:00 |
| **LOTECE** | `lotece` | 8 | 11:00, 14:00, 15:45, 19:00 |
| **PARAÍBA** | `paraiba` | 11 | 09:00-20:00 (GERAL + LOTEP) |
| **SÃO PAULO** | `sao_paulo` | 9 | 08:00-20:00 |
| **MINAS GERAIS** | `minas_gerais` | 5 | 12:00-21:00 |
| **BRASÍLIA** | `brasilia` | 13 | 00:40-23:00 |
| **RIO GRANDE DO NORTE** | `rn` | 4 | Horários variados |
| **RIO GRANDE DO SUL** | `rs` | 5 | Horários variados |
| **SERGIPE** | `se` | 5 | Horários variados |
| **PARANÁ** | `parana` | 2 | Horários variados |
| **BOA SORTE** | `boa_sorte` | 6 | Horários variados |
| + mais estados... | | | |

**Convenção de ID da subloteria**: `{banca_abbr}_{horario}[_maluca]`
- Ex: `rj_pt_09` (Rio PT 09:20), `ba_maluca_10` (Bahia Maluca 10:00), `nac_02` (Nacional 02:00)

### 2.3 MALUCA — Dois Padrões Diferentes

| Padrão | Bancas | Comportamento |
|--------|--------|---------------|
| **Resultado separado** | BAHIA | MALUCA tem sorteio próprio, números completamente diferentes |
| **Inversão de resultado** | Todas as outras | Inverte o milhar do resultado normal (ex: 1234 → 4321) |
| **Inversão LOTECE** | LOTECE | Inverte P1-P7 (todas posições) |
| **Inversão padrão** | Demais | Inverte P1-P5 apenas, P6-P7 = null |

### 2.4 Mapeamento `LOTERIA_TO_BANCA` (Scraper)

Dicionário em `modal_scraper_v3.py` (linhas 1443-1651) que mapeia cada `subloteria_id` para a tupla `(banca, horario, loteria)` usada na verificação:

```python
LOTERIA_TO_BANCA = {
    "rj_pt_09":      ("RIO/FEDERAL", "09:20", "PT"),
    "ba_10":         ("BAHIA", "10:00", "GERAL"),
    "ba_maluca_10":  ("BAHIA", "10:00", "MALUCA"),
    "go_07":         ("LOOK/GOIAS", "07:00", "LOOK"),
    "nac_02":        ("NACIONAL", "02:00", "NACIONAL"),
    # ~150 entradas total...
}
```

**Chave de lookup para resultados**: `f"{horario}_{banca}_{loteria}"` → previne colisão entre GERAL e MALUCA no mesmo horário.

### 2.5 Fazendinha — Loterias Específicas

Apenas 2 subloterias late-night:
- `lt_look_23hs` → LOOK/GOIAS 23:19
- `lt_nacional_23hs` → NACIONAL 22:59

### 2.6 Jogos Acumulados — Loterias da Caixa

| Jogo | Loteria Caixa | Chave de lookup | Horário |
|------|--------------|----------------|---------|
| Quininha | QUINA | `20:00_CAIXA_QUINA` | 20:00 |
| Seninha | MEGA-SENA | `20:00_CAIXA_MEGA_SENA` | 20:00 |
| Lotinha | LOTOFÁCIL | `20:00_CAIXA_LOTO_FACIL` | 20:00 |

---

## 3. Fluxo Completo de Aposta

### 3.1 LOTERIAS (Fluxo Mais Complexo)

**Rota**: `/loterias` → `/loterias/[tipo]` → `/loterias/[tipo]/[data]` → `/loterias/[tipo]/[data]/[modalidade]` → `/loterias/[tipo]/[data]/[modalidade]/[colocacao]` → `/apostas/finalizar`

```
HOME (/home)
  │
  ├─ Card "LOTERIAS" ou botão "REPETIR PULE"
  │
  ▼
SELEÇÃO DE TIPO (/loterias)
  │ Exibe: cards dos tipos de jogo (Loterias, Quininha, Seninha, Lotinha)
  │ + botão REPETIR PULE (modal com últimas 20 apostas)
  │
  ▼
SELEÇÃO DE DATA (/loterias/[tipo])
  │ Exibe: DateSelector (6-7 dias à frente)
  │ Usuário seleciona: data do jogo (YYYY-MM-DD)
  │
  ▼
SELEÇÃO DE MODALIDADE (/loterias/[tipo]/[data])
  │ Exibe: ModalityList agrupada por 15 categorias
  │ Cada modalidade mostra: nome + multiplicador (ex: "CENTENA 800x")
  │ Categorias: Centenas, Milhares, Unidade, Dezenas, Duque Dezena,
  │   Terno Dezena Seco, Terno Dezena, Grupo, Duque Grupo, Terno Grupo,
  │   Quadra Grupo, Quina Grupo, Sena Grupo, Passe, Palpitão
  │
  ▼
SELEÇÃO DE COLOCAÇÃO (/loterias/[tipo]/[data]/[modalidade])
  │ Exibe: PlacementList (botões de colocação)
  │ Opções: 1° Prêmio, 1°-3°, 1°-5°, 1°-7°, Geral, etc.
  │ Depende da modalidade (nem todas permitem todas colocações)
  │
  ▼
WIZARD 4 ETAPAS (/loterias/[tipo]/[data]/[modalidade]/[colocacao])
  │ ColocacaoClient.tsx — componente com 4 stages:
  │
  │ STAGE 1: PALPITE
  │ ├─ BetInput: teclado numérico (inputMode="numeric", type="tel")
  │ ├─ maxDigits varia: 1 (unidade), 2 (dezena/grupo), 3 (centena), 4 (milhar)
  │ ├─ Botão "Surpresinha" (número aleatório)
  │ ├─ Palpites aparecem como badges removíveis
  │ └─ Botão "Avançar" (ativo quando há ≥1 palpite)
  │
  │ STAGE 2: VALOR
  │ ├─ Campo numérico manual
  │ ├─ Botões rápidos: R$0,50, R$1, R$2, R$5, R$10, R$20
  │ ├─ Toggle "Todos vs Cada":
  │ │   - TODOS: valor dividido entre todas as loterias
  │ │   - CADA: valor aplicado a cada loteria individualmente
  │ ├─ Valor mínimo: configurável por platform (padrão R$0,10)
  │ └─ Botão "Avançar"
  │
  │ STAGE 3: RESUMO
  │ ├─ Card de resumo com: modalidade, colocação, palpites, valor
  │ ├─ Botão "+ Mais Apostas" (volta ao início, mantém carrinho)
  │ └─ Botão "Escolher Loterias" (avança para stage 4)
  │
  │ STAGE 4: LOTERIAS
  │ ├─ LotterySelector: grid de subloterias agrupadas por banca/região
  │ ├─ Cada subloteria mostra: nome + horário
  │ ├─ Multi-select (checkbox)
  │ ├─ Filtragem: subloterias com horário já passado são ocultadas
  │ └─ Botão "Finalizar" → redireciona para /apostas/finalizar
  │
  ▼
CHECKOUT (/apostas/finalizar)
  │ BetSummary: lista de todas as apostas no carrinho
  │ Para cada item: modalidade, colocação, palpites, loterias, valor
  │ ├─ Ícone lixeira para remover item
  │ ├─ Ícone menos para remover loteria individual
  │ ├─ Cálculo: valorUnitario × palpites.length × loterias.length
  │ ├─ Validação de saldo: saldo + saldoBonus >= totalGeral
  │ ├─ Se insuficiente: mensagem com déficit + sugestões
  │ └─ Botão "FINALIZAR APOSTA"
  │
  ▼
RPC place_bet() — 1 chamada por item do carrinho
  │ Retorna: { success, pule, saldo_restante }
  │
  ▼
TELA DE SUCESSO
  ├─ PULE #{número}
  ├─ Data/hora da confirmação
  ├─ Resumo das apostas
  ├─ Novo saldo
  ├─ Botões: Voltar | Compartilhar | Imprimir
  └─ Toast de sucesso (5s)
```

### 3.2 FAZENDINHA (Fluxo Mais Simples)

**Rota**: `/fazendinha` → `/fazendinha/[data]` → `/fazendinha/[data]/numeros` → `/fazendinha/confirmar`

```
HOME (/home)
  │ Card "FAZENDINHA"
  ▼
SELEÇÃO DE DATA (/fazendinha)
  │ DateSelector (6-7 dias)
  ▼
TELA UNIFICADA (/fazendinha/[data])
  │ Tudo em uma tela:
  │ ├─ Tabs de modalidade: Dezena | Grupo | Centena
  │ ├─ Dropdown de loteria: LT LOOK 23HS ou LT NACIONAL 23HS
  │ ├─ Botões de valor pré-definidos: R$1, R$3, R$5, R$7, R$10, R$15, R$20
  │ └─ Botão "Escolher Números"
  ▼
GRID DE NÚMEROS (/fazendinha/[data]/numeros)
  │ Grid numérico para seleção direta
  │ ├─ Range depende da modalidade:
  │ │   - Grupo: 01-25
  │ │   - Dezena: 00-99
  │ │   - Centena: 000-999 (campo numérico)
  │ └─ Botão "Confirmar"
  ▼
CONFIRMAÇÃO (/fazendinha/confirmar)
  │ Receipt-style card
  │ RPC place_bet():
  │   p_tipo: 'fazendinha'
  │   p_colocacao: '1_premio' (fixo)
  │   p_horarios: [] (vazio)
  │   p_loterias: [loteriaId] (1 única)
  ▼
TELA DE SUCESSO
```

**Diferenças-chave vs Loterias:**
1. Apenas 2 subloterias disponíveis (late-night)
2. Apenas 3 modalidades (dezena, grupo, centena)
3. Colocação fixa: sempre `1_premio`
4. Valor pré-definido (botões, não campo livre)
5. Sem stage de seleção de loterias (já escolhe na tela unificada)

### 3.3 QUININHA / SENINHA / LOTINHA (Fluxo Compartilhado)

Estes 3 jogos usam o **mesmo funil** com diferenças mínimas:

**Rota**: `/{jogo}` → `/{jogo}/[data]` → `/{jogo}/[data]/[modalidade]` → `/{jogo}/[data]/[modalidade]/valor` → `/{jogo}/[data]/[modalidade]/dias` → `/{jogo}/[data]/[modalidade]/finalizar`

```
HOME (/home)
  │ Card no hub de Loterias
  ▼
SELEÇÃO DE DATA (/{jogo})
  │ DateSelector
  ▼
SELEÇÃO DE MODALIDADE (/{jogo}/[data])
  │ Lista de modalidades específicas do jogo
  │ Ex Quininha: 13D (5000x), 14D (3900x), ..., 45D (7x)
  ▼
SELEÇÃO DE NÚMEROS (/{jogo}/[data]/[modalidade])
  │ Grid numérico — selecionar N números de M total:
  │
  │ ┌─────────────────────────────────────────────────┐
  │ │ Jogo      │ Selecionar │ De │ Total Grid        │
  │ │───────────│────────────│────│───────────────────│
  │ │ Quininha  │ 13 números │ 80 │ Grid 1-80         │
  │ │ Seninha   │ 6 números  │ 60 │ Grid 1-60         │
  │ │ Lotinha   │ 15 números │ 25 │ Grid 1-25         │
  │ └─────────────────────────────────────────────────┘
  │
  │ Auto-add: quando atinge N seleções, adiciona palpite automaticamente
  │ Display: "X RESTANTES" mostra quantos faltam selecionar
  │ Botão "Surpresinha" disponível
  ▼
SELEÇÃO DE VALOR (/{jogo}/[data]/[modalidade]/valor)
  │ ValueSelector: campo + botões rápidos
  ▼
SELEÇÃO DE DIAS (/{jogo}/[data]/[modalidade]/dias)
  │ Multi-select de datas futuras de sorteio
  │ Permite apostar a mesma combinação em vários dias
  │ Ex: "Apostar nos próximos 6 sorteios da Quina"
  ▼
FINALIZAR (/{jogo}/[data]/[modalidade]/finalizar)
  │ Resumo + RPC place_bet():
  │   p_tipo: 'quininha' | 'seninha' | 'lotinha'
  │   p_colocacao: 'geral' (fixo)
  │   p_horarios: [dias selecionados]
  │   p_loterias: [] (vazio — Caixa Federal é implícita)
  ▼
TELA DE SUCESSO
```

**Diferenças-chave vs Loterias:**
1. Grid de números (não teclado numérico)
2. Seleção de múltiplos dias (não loterias)
3. Colocação fixa: `geral`
4. Sem seleção de loterias (Caixa Federal implícita)
5. Verificação contra resultado Caixa (não bancas estaduais)

### 3.4 Payload Final — RPC `place_bet()`

Todos os jogos convergem para a mesma RPC:

```typescript
const { data, error } = await supabase.rpc('place_bet', {
  p_tipo: 'loterias',           // TipoJogo
  p_modalidade: 'centena',      // Código da modalidade
  p_colocacao: '1_ao_5_premio', // Posições de prêmio
  p_palpites: ['234', '567'],   // Array de palpites
  p_horarios: ['14:20'],        // Array de horários
  p_loterias: ['rj_pt_14'],     // Array de subloteria IDs
  p_data_jogo: '2026-03-16',    // Data do jogo
  p_valor_unitario: 10.00,      // Valor por palpite
  p_multiplicador: 800,         // Multiplicador de odds
});

// Resposta:
{ success: true, pule: 'PULE-20260316-12345', saldo_restante: 490.00 }
```

**Variações por tipo de jogo:**

| Campo | Loterias | Fazendinha | Quininha/Seninha/Lotinha |
|-------|----------|------------|------------------------|
| `p_colocacao` | Variável (user escolhe) | `'1_premio'` fixo | `'geral'` fixo |
| `p_horarios` | Horários das subloterias | `[]` vazio | Dias selecionados |
| `p_loterias` | IDs das subloterias | `[loteriaId]` (1 só) | `[]` vazio |
| `p_palpites` | Dígitos (1-4) | Números (1-3 dígitos) | Conjunto de dezenas |

---

## 4. Modalidades e Multiplicadores

### 4.1 LOTERIAS — 73 Modalidades em 15 Categorias

#### Centenas (15 variantes)
| Código | Nome | Multiplicador | Dígitos | Lógica |
|--------|------|:------------:|:-------:|--------|
| `centena` | Centena | 800x | 3 | Últimos 3 dígitos do prêmio |
| `centena_esquerda` | Centena Esquerda | 800x | 3 | Primeiros 3 dígitos |
| `centena_inv` | Centena Invertida | 800x | 3 | Qualquer permutação dos 3 dígitos |
| `centena_3x` | Centena 3x | 800x | 3 | Match em direita, esquerda OU meio |
| `centena_inv_4d` | Centena Inv 4D | 600x | 3 | Invertida com redução multi-draw |
| `centena_inv_5d` | Centena Inv 5D | 480x | 3 | ... |
| `centena_inv_6d` | Centena Inv 6D | 400x | 3 | ... |
| `centena_inv_7d` | Centena Inv 7D | 340x | 3 | ... |
| `centena_inv_8d` | Centena Inv 8D | 300x | 3 | ... |
| `centena_inv_esq` | Centena Inv Esquerda | 800x | 3 | Permutação dos primeiros 3 |
| `centena_inv_esq_4d` até `_8d` | ... | 600x-300x | 3 | Variantes ESQ com redução |

#### Milhares (9 variantes)
| Código | Multiplicador | Lógica |
|--------|:------------:|--------|
| `milhar` | 8000x | Exato 4 dígitos |
| `milhar_ct` | 8000x/800x | Milhar exato OU centena consolação |
| `milhar_inv` | 8000x | Qualquer permutação de 4 dígitos |
| `milhar_inv_5d` | 4800x | Invertida com redução |
| `milhar_inv_6d` | 4000x | ... |
| `milhar_inv_7d` | 3400x | ... |
| `milhar_inv_8d` | 3000x | ... |
| `milhar_inv_9d` | 2660x | ... |
| `milhar_inv_10d` | 2400x | ... |

#### Outras Categorias
| Categoria | Variantes | Multiplicador Padrão | Dígitos/Tipo |
|-----------|:---------:|:-------------------:|-------------|
| **Unidade** | 1 | 8x | 1 dígito (último) |
| **Dezena** | 3 (normal, esq, meio) | 80x | 2 dígitos |
| **Duque Dezena** | 4 | 300x (180x 10d) | 2 dezenas devem ambas aparecer |
| **Terno Dezena Seco** | 3 | 10000x (5000x esq/meio) | 3 dezenas, só P1-P3 |
| **Terno Dezena** | 3 | 5000x | 3 dezenas, qualquer prêmio |
| **Grupo** | 3 (normal, esq, meio) | 20x | Bicho/Animal (1-25) |
| **Duque Grupo** | 3 | 200x (180x esq/meio) | 2 grupos ambos aparecem |
| **Terno Grupo** | 3 | 1500x | 3 grupos |
| **Quadra Grupo** | 3 | 1000x | 4 grupos |
| **Quina Grupo** | 3 | 1000x | 5 de 8 grupos |
| **Sena Grupo** | 3 | 1000x | 6 de 10 grupos |
| **Passe** | 2 (vai, vai_vem) | 90x / 45x | 2 grupos em sequência |
| **Palpitão** | 1 | 1x | Especial |

### 4.2 QUININHA — 13 Modalidades

| Código | Multiplicador | Dezenas a selecionar (de 80) |
|--------|:------------:|:---------------------------:|
| `quininha_13d` | 5000x | 13 |
| `quininha_14d` | 3900x | 14 |
| `quininha_15d` | 2700x | 15 |
| `quininha_16d` | 2200x | 16 |
| `quininha_17d` | 1600x | 17 |
| `quininha_18d` | 1100x | 18 |
| `quininha_19d` | 800x | 19 |
| `quininha_20d` | 700x | 20 |
| `quininha_25d` | 180x | 25 |
| `quininha_30d` | 65x | 30 |
| `quininha_35d` | 29x | 35 |
| `quininha_40d` | 10x | 40 |
| `quininha_45d` | 7x | 45 |

### 4.3 SENINHA — 11 Modalidades

| Código | Multiplicador | Dezenas a selecionar (de 60) |
|--------|:------------:|:---------------------------:|
| `seninha_14d` | 5000x | 14 |
| `seninha_15d` | 3500x | 15 |
| `seninha_16d` | 2000x | 16 |
| `seninha_17d` | 1500x | 17 |
| `seninha_18d` | 850x | 18 |
| `seninha_19d` | 650x | 19 |
| `seninha_20d` | 500x | 20 |
| `seninha_25d` | 110x | 25 |
| `seninha_30d` | 28x | 30 |
| `seninha_35d` | 8x | 35 |
| `seninha_40d` | 5x | 40 |

### 4.4 LOTINHA — 7 Modalidades

| Código | Multiplicador | Dezenas a selecionar (de 25) |
|--------|:------------:|:---------------------------:|
| `lotinha_16d` | 5000x | 16 |
| `lotinha_17d` | 200x | 17 |
| `lotinha_18d` | 100x | 18 |
| `lotinha_19d` | 50x | 19 |
| `lotinha_20d` | 25x | 20 |
| `lotinha_21d` | 15x | 21 |
| `lotinha_22d` | 8x | 22 |

### 4.5 FAZENDINHA — 3 Modalidades

| Código | Multiplicador | Tipo |
|--------|:------------:|------|
| `dezena` | 82x | 2 dígitos (00-99) |
| `grupo` | 21x | Animal (1-25) |
| `centena` | 820x | 3 dígitos (000-999) |

### 4.6 `platform_modalidades` — Odds por Banca

```sql
CREATE TABLE platform_modalidades (
  id UUID PRIMARY KEY,
  platform_id UUID NOT NULL REFERENCES platforms(id),
  codigo TEXT NOT NULL,           -- ex: 'centena', 'milhar'
  multiplicador NUMERIC(10,2),    -- ex: 800.00
  valor_minimo NUMERIC(10,2),     -- ex: 0.10
  valor_maximo NUMERIC(10,2),     -- ex: 1000.00
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER,
  UNIQUE(platform_id, codigo)
);
```

**Hierarquia de fallback para multiplicador:**
1. `apostas.multiplicador` (gravado no momento da aposta) → se > 0, usa esse
2. `platform_modalidades` (config da banca) → busca por platform_id + codigo
3. `fn_get_multiplicador` (RPC com fallback) → busca platform + global
4. `modalidades_config` (default global) → última opção

---

## 5. Regras de Horário e Corte

### 5.1 Cutoff de Horário

**Client-side** (em `FinalizarApostaPage`):
```typescript
// Se a aposta é para HOJE:
if (isToday && item.horarios) {
  for (const horario of item.horarios) {
    const [hora, minuto] = horario.split(':').map(Number);
    const drawTime = new Date(now);
    drawTime.setHours(hora, minuto, 0, 0);
    if (now > drawTime) {
      throw new Error(`O horário ${horario} já passou para a data de hoje.`);
    }
  }
}
```

**Regra**: Se `now >= drawTime` → bloqueia. Não há margem de 5 minutos no client (apenas check exato).

### 5.2 Filtragem de Loterias

No `LotterySelector` (stage 4 do wizard de Loterias):
- Subloterias com horário já passado para a data selecionada **não aparecem** na lista
- Se o usuário seleciona "HOJE" e são 15h, subloterias das 14:20 **não são exibidas**

### 5.3 Datas Passadas

```typescript
if (item.data < todayLocal) {
  throw new Error(`A data ${item.data} já passou.`);
}
```

Datas passadas são completamente bloqueadas.

### 5.4 Repetir Pule

A função `buildRepeatBetUrl()` **sempre usa a data de HOJE**, nunca a data original da aposta:
```typescript
const today = new Date();
const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
```

---

## 6. Verificação de Prêmio

### 6.1 Pipeline Completo — `verificar_premios_v2()`

**Localização**: `modal_scraper_v3.py`, linhas 2346-2823

```
FASE 1: Carregar Resultados
  │ SELECT * FROM resultados WHERE data = {data_verificar}
  │ Indexar por chave: f"{horario}_{banca}_{loteria}"
  │ Tratamento especial: BAHIA FEDERAL (Qua/Sáb) → cria alias GERAL
  │
FASE 2: Carregar Odds Dinâmicos
  │ Busca platform_modalidades + modalidades_config
  │ Cria função get_multiplicador_platform() com fallback 3 níveis
  │
FASE 3: Buscar Apostas Pendentes
  │ SELECT * FROM apostas WHERE data_jogo = {data} AND status = 'pendente'
  │ LIMIT 50000 (processamento in-memory)
  │
FASE 4: Processar Cada Aposta
  │ Para cada aposta:
  │ ├─ Extrair: loterias[], palpites[], modalidade, colocacao
  │ ├─ Parser colocacao → posicoes_validas[]
  │ │   "geral" → ["premio_1"..."premio_7"]
  │ │   "1_premio" → ["premio_1"]
  │ │   "1_ao_5_premio" → ["premio_1"..."premio_5"]
  │ │
  │ ├─ SE Lotinha/Quininha/Seninha:
  │ │   → Lógica especial de acertos (ver seção 6.3)
  │ │
  │ └─ SENÃO (Loterias normais):
  │     Para cada loteria_id:
  │     ├─ LOTERIA_TO_BANCA[loteria_id] → (banca, horario, loteria)
  │     ├─ lookup_key = f"{horario}_{banca}_{loteria}"
  │     ├─ resultado = resultados_map[lookup_key]
  │     ├─ SE MALUCA (não-Bahia): inverter resultado
  │     └─ verificar_modalidade(modalidade, palpites, resultado, posicoes)
  │
  │ RESULTADO:
  │ ├─ GANHOU → atualizar aposta + creditar saldo + log transaction + WhatsApp
  │ ├─ PERDEU → batch ids_perdeu
  │ └─ PENDENTE → verificar se 12h+ passaram → auto-reembolso
  │
FASE 5: Batch Update
  │ RPC fn_mark_bets_lost(ids_perdeu_batch)
  │ Fallback: update individual se RPC falha
  │
FASE 6: Retornar Resumo
  │ { verificadas, ganhou, perdeu, reembolsado, pendente }
```

### 6.2 Lógica de Verificação por Modalidade — `verificar_modalidade()`

**Funções auxiliares de extração**:

| Função | Input (4 dígitos ex: "1234") | Output |
|--------|------------------------------|--------|
| `extrair_dezena()` | "1234" | "34" (últimos 2) |
| `extrair_dezena_esq()` | "1234" | "12" (primeiros 2) |
| `extrair_dezena_meio()` | "1234" | "23" (posições 1-2) |
| `extrair_centena()` | "1234" | "234" (últimos 3) |
| `extrair_centena_esq()` | "1234" | "123" (primeiros 3) |
| `extrair_unidade()` | "1234" | "4" (último) |
| `dezena_to_grupo()` | "34" | 9 (fórmula: ((34-1)//4)+1) |

**Conversão Dezena → Grupo (Bicho)**:
```
Grupo 1  (01-04) = Avestruz    Grupo 14 (53-56) = Gato
Grupo 2  (05-08) = Águia       Grupo 15 (57-60) = Macaco
...
Grupo 12 (45-48) = Ema         Grupo 25 (00, 97-99) = Vaca
Grupo 13 (49-52) = Galo
```

**Verificação por tipo**:

| Modalidade | Lógica de Match | Exemplo |
|-----------|-----------------|---------|
| `milhar` | `palpite.zfill(4) == premio.zfill(4)` | "1234" == "1234" ✓ |
| `milhar_ct` | milhar exato OU centena (últimos 3) | "1234" → full match ou "X234" ✓ |
| `milhar_inv` | Qualquer permutação de 4 dígitos | "1234" match "4321" ✓ |
| `centena` | `premio.endswith(palpite[-3:])` | "234" match "X234" ✓ |
| `centena_esq` | `premio.startswith(palpite[:3])` | "123" match "123X" ✓ |
| `centena_3x` | Match em direita, esquerda OU meio | "234" match qualquer posição ✓ |
| `dezena` | Últimos 2 dígitos de qualquer prêmio | "34" match "XX34" ✓ |
| `grupo` | Grupo do palpite == grupo de algum prêmio | Grupo 9 match dezena 33-36 ✓ |
| `duque_dez` | 2 dezenas ambas aparecem nos prêmios | "12","34" ambos encontrados ✓ |
| `duque_gp` | 2 grupos ambos aparecem | Grupo 5 e 15 ambos ✓ |
| `terno_dez` | 3 dezenas todas nos prêmios | "12","34","56" todos ✓ |
| `terno_dez_seco` | 3 dezenas nos P1-P3 apenas | Mais restritivo ✓ |
| `terno_gp` | 3 grupos todos nos prêmios | 3 bichos certos ✓ |
| `passe_vai` | P1.grupo == g1 AND P2.grupo == g2 (ordem) | Sequência exata ✓ |
| `passe_vai_vem` | P1+P2 em qualquer ordem | Qualquer combinação ✓ |

### 6.3 Verificação Especial — Lotinha/Quininha/Seninha

```python
# Determinar jogo e quantidade de acertos
if modalidade.startswith("lotinha_"):
    caixa_loteria = "LOTO_FACIL"
elif modalidade.startswith("quininha_"):
    caixa_loteria = "QUINA"
else:  # seninha
    caixa_loteria = "MEGA_SENA"

# Buscar resultado da Caixa
caixa_key = f"20:00_CAIXA_{caixa_loteria}"
resultado_caixa = resultados_map.get(caixa_key)

# Extrair dezenas do palpite (formato: "03-06-13-18-24-28-30")
dezenas_palpite = set(palpite_str.split("-"))

# Extrair dezenas do resultado (CSV em premio_1: "02,05,06,08,...")
dezenas_resultado = set(resultado_caixa["premio_1"].split(","))

# Contar acertos
acertos = len(dezenas_palpite & dezenas_resultado)

# O número no sufixo da modalidade indica total de dezenas selecionadas
# Ex: quininha_13d = 13 dezenas selecionadas de 80
# Precisa que 5 das 13 dezenas coincidam com as 5 sorteadas
```

**Regra**: Só verifica contra `premio_1` (não P2-P7). Deduplicado por horário.

### 6.4 Processamento de Ganho

```python
# 1. Calcular prêmio
multiplicador = get_multiplicador_platform(platform_id, modalidade, ...)
valor_premio = valor_aposta * multiplicador

# 2. Atualizar aposta
UPDATE apostas SET status='premiada', premio_valor={valor_premio} WHERE id={id}

# 3. Creditar saldo
UPDATE profiles SET saldo = saldo + {valor_premio} WHERE id={user_id}

# 4. Registrar transação
INSERT INTO transactions (tipo='prize', amount={valor_premio}, ...)

# 5. Notificação WhatsApp
POST /api/internal/triggers (triggerType='premio')
```

### 6.5 Auto-Reembolso

Se resultado não chegou em 12+ horas após horário do sorteio:
```python
if horario_expirou(data_verificar, horario, horas_limite=12):
    # Reembolso automático
    UPDATE apostas SET status='reembolsado'
    UPDATE profiles SET saldo = saldo + valor_total
    INSERT INTO transactions (tipo='refund', ...)
```

---

## 7. Estrutura de Dados

### 7.1 Tabela `apostas`

| Coluna | Tipo | Nullable | Descrição |
|--------|------|:--------:|-----------|
| `id` | UUID | NO | PK |
| `user_id` | UUID | NO | FK → profiles.id |
| `platform_id` | UUID | NO | FK → platforms.id |
| `tipo` | TEXT | NO | 'loterias', 'fazendinha', 'quininha', 'seninha', 'lotinha' |
| `modalidade` | TEXT | NO | Código da modalidade (ex: 'centena', 'milhar') |
| `colocacao` | TEXT | NO | Posições de prêmio (ex: '1_ao_5_premio', 'geral') |
| `palpites` | TEXT[] | NO | Array de palpites |
| `horarios` | TEXT[] | NO | Array de horários (HH:MM) |
| `loterias` | TEXT[] | YES | Array de IDs de subloterias |
| `data_jogo` | TEXT | NO | Data do jogo (YYYY-MM-DD) |
| `valor_unitario` | DECIMAL | NO | Valor por palpite |
| `valor_total` | DECIMAL | NO | Total = unitario × combinações (server-side) |
| `multiplicador` | DECIMAL | NO | Odds no momento da aposta |
| `status` | TEXT | YES | 'pendente', 'confirmada', 'premiada', 'perdeu', 'reembolsado' |
| `premio_valor` | DECIMAL | YES | Valor ganho (se premiada) |
| `pule` | TEXT | YES | ID do bilhete (ex: PULE-20260316-12345) |
| `created_at` | TIMESTAMP | YES | |

**Indexes**:
- `idx_apostas_data_jogo_status` (data_jogo, status)
- `idx_apostas_data_status_platform` (data_jogo, status, platform_id)

### 7.2 Tabela `resultados`

| Coluna | Tipo | Nullable | Descrição |
|--------|------|:--------:|-----------|
| `id` | UUID | NO | PK |
| `data` | TEXT | NO | Data do sorteio (YYYY-MM-DD) |
| `horario` | TEXT | NO | Horário (HH:MM) |
| `banca` | TEXT | YES | Casa lotérica (BAHIA, RIO/FEDERAL, etc.) |
| `loteria` | TEXT | YES | Tipo (GERAL, MALUCA, PT, CORUJA, etc.) |
| `premio_1` - `premio_10` | TEXT | YES | Milhar do prêmio (4 dígitos) |
| `bicho_1` - `bicho_10` | TEXT | YES | Nome do animal |
| `created_at` | TIMESTAMP | YES | |

**Unique constraint**: `(data, horario, banca, loteria)` — upsert key.

### 7.3 Tabela `platform_modalidades`

| Coluna | Tipo | Nullable | Descrição |
|--------|------|:--------:|-----------|
| `id` | UUID | NO | PK |
| `platform_id` | UUID | NO | FK → platforms.id |
| `codigo` | TEXT | NO | Código da modalidade |
| `multiplicador` | NUMERIC(10,2) | NO | Odds customizadas |
| `valor_minimo` | NUMERIC(10,2) | YES | Mín aposta (default 1.00) |
| `valor_maximo` | NUMERIC(10,2) | YES | Máx aposta (default 1000.00) |
| `ativo` | BOOLEAN | YES | Habilitado? |
| `ordem` | INTEGER | YES | Ordem de exibição |
| `created_at` | TIMESTAMP | YES | |
| `updated_at` | TIMESTAMP | YES | |

**Unique**: `(platform_id, codigo)`

### 7.4 Tabela `modalidades_config` (Global)

| Coluna | Tipo | Nullable | Descrição |
|--------|------|:--------:|-----------|
| `id` | UUID | NO | PK |
| `codigo` | TEXT | NO | Código único (ex: 'centena') |
| `nome` | TEXT | NO | Nome de exibição |
| `categoria` | TEXT | NO | Categoria para agrupamento UI |
| `multiplicador` | DECIMAL | NO | Multiplicador default |
| `valor_minimo` | DECIMAL | YES | |
| `valor_maximo` | DECIMAL | YES | |
| `ativo` | BOOLEAN | YES | |
| `ordem` | INTEGER | YES | |
| `posicoes_1_5` | BOOLEAN | YES | Aceita posições 1°-5° |
| `posicoes_1_6` | BOOLEAN | YES | Aceita posições 1°-6° |
| `posicoes_1_7` | BOOLEAN | YES | Aceita posições 1°-7° |
| `posicoes_5_6` | BOOLEAN | YES | Aceita posições 5°-6° |
| `posicoes_1_10` | BOOLEAN | YES | Aceita posições 1°-10° |

### 7.5 Tabela `profiles` (Campos financeiros)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK = auth.uid() |
| `platform_id` | UUID | FK → platforms.id |
| `cpf` | TEXT | Identificador primário do usuário |
| `nome` | TEXT | Nome completo |
| `telefone` | TEXT | WhatsApp |
| `saldo` | DECIMAL | Saldo principal (BRL) |
| `saldo_bonus` | DECIMAL | Saldo de bônus |
| `saldo_cassino` | DECIMAL | Saldo cassino (PlayFivers) |
| `codigo_convite` | TEXT | Código de indicação |
| `indicado_por` | UUID | FK → profiles.id (quem indicou) |

### 7.6 Tabela `transactions`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → profiles.id |
| `platform_id` | UUID | FK → platforms.id |
| `amount` | DECIMAL | Valor (sempre positivo) |
| `tipo` | TEXT | 'depósito', 'saque', 'premio', 'refund', 'casino_in', 'casino_out' |
| `status` | TEXT | 'pending', 'completed', 'failed', 'cancelled' |
| `provider` | TEXT | 'bspay', 'washpay', 'supabase', 'playfiver' |
| `external_id` | TEXT | ID externo (idempotência) |
| `metadata` | JSON | Dados extras |

### 7.7 Exemplo de Aposta Salva no Banco

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "usr-uuid-here",
  "platform_id": "plt-uuid-here",
  "tipo": "loterias",
  "modalidade": "centena",
  "colocacao": "1_ao_5_premio",
  "palpites": ["234", "567"],
  "horarios": ["14:20", "16:00"],
  "loterias": ["rj_pt_14", "rj_ptv_16"],
  "data_jogo": "2026-03-16",
  "valor_unitario": 10.00,
  "valor_total": 40.00,
  "multiplicador": 800,
  "status": "pendente",
  "premio_valor": null,
  "pule": "PULE-20260316-42857",
  "created_at": "2026-03-16T14:05:30.000Z"
}
```

**Cálculo do `valor_total`** (server-side):
```
valor_total = valor_unitario × palpites.length × horarios.length
            = 10.00 × 2 × 2 = 40.00
```

---

## 8. Pagamento e Saldo

### 8.1 Débito de Saldo

O saldo é **debitado ANTES da confirmação**, dentro do RPC `place_bet()`:

```sql
-- Dentro do RPC place_bet():
-- 1. Calcular total no servidor (nunca confiar no cliente)
v_server_total := p_valor_unitario * array_length(p_palpites, 1) * array_length(p_horarios, 1);

-- 2. Verificar saldo
SELECT (saldo + COALESCE(saldo_bonus, 0)) INTO v_disponivel FROM profiles WHERE id = v_user_id;
IF v_disponivel < v_server_total THEN
  RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
END IF;

-- 3. Debitar atomicamente
UPDATE profiles SET saldo = saldo - v_server_total WHERE id = v_user_id;

-- 4. Inserir aposta
INSERT INTO apostas (...) VALUES (...);
```

**Atomicidade**: Débito + insert acontecem na mesma transação SQL (RPC = SECURITY DEFINER).

### 8.2 Validação de Saldo

**Client-side** (dupla checagem UX):
```typescript
const saldoDisponivel = saldo + saldoBonus;
const saldoInsuficiente = valorTotalGeral > saldoDisponivel;
```

**Server-side** (dentro do RPC): recalcula e verifica antes de debitar.

### 8.3 Reembolso por Resultado Ausente

```python
# Se resultado não chegou em 12+ horas:
if horario_expirou(data_verificar, horario, horas_limite=12):
    valor_reembolso = float(aposta["valor_total"])

    # Marcar aposta como reembolsada
    supabase.table("apostas").update({"status": "reembolsado"}).eq("id", id).execute()

    # Devolver saldo
    novo_saldo = saldo_atual + valor_reembolso
    supabase.table("profiles").update({"saldo": novo_saldo}).eq("id", user_id).execute()

    # Registrar transação
    supabase.table("transactions").insert({
        "tipo": "refund",
        "amount": valor_reembolso,
        "metadata": {"reason": f"Results unavailable after 12h: {loterias}"}
    }).execute()
```

### 8.4 Crédito de Prêmio

Quando aposta ganha:
```python
valor_premio = valor_aposta * multiplicador
# Ex: R$10 × 800 = R$8.000

# 1. Atualizar aposta
UPDATE apostas SET status='premiada', premio_valor=8000.00

# 2. Creditar saldo
UPDATE profiles SET saldo = saldo + 8000.00

# 3. Registrar transação
INSERT INTO transactions (tipo='prize', amount=8000.00, external_id='payout_{aposta_id}')
```

### 8.5 Balance Realtime

O hook `useUserBalance()` assina mudanças realtime via Supabase:
```typescript
supabase.channel('balance-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'profiles',
    filter: `id=eq.${user.id}`,
  }, (payload) => {
    // Atualiza saldo, saldoBonus, saldoCassino em tempo real
  })
  .subscribe();
```

---

## 9. Configuração por Banca (Multi-Tenant)

### 9.1 O que é Configurado por Banca vs Global

| Config | Por Banca (platform) | Global |
|--------|:-------------------:|:------:|
| Multiplicadores (odds) | ✅ `platform_modalidades` | ✅ `modalidades_config` (fallback) |
| Valor mín/máx aposta | ✅ | ✅ |
| Modalidades ativas | ✅ (ativo=true/false) | ✅ |
| Gateway de pagamento | ✅ `gateway_config` | ❌ |
| Bônus de depósito | ✅ `bonus_deposito_config` | ❌ |
| WhatsApp (Evolution) | ✅ `evolution_instances` | ❌ |
| Layout/Tema | ✅ (default/modern/elite) | ❌ |
| Bancas/Subloterias disponíveis | ❌ (global, código) | ✅ `lib/constants/bancas.ts` |
| Modalidades (definição) | ❌ | ✅ `lib/constants/modalidades.ts` |
| Animais/Bichos | ❌ | ✅ (hardcoded) |

### 9.2 Como `platform_modalidades` Funciona

1. Admin acessa `/admin/modalidades`
2. Vê lista de todas as modalidades globais
3. Pode overridar: multiplicador, valor_min, valor_max, ativo
4. Se não overridar, herda do `modalidades_config` global
5. Aposta gravada com o multiplicador vigente no momento do `place_bet()`

### 9.3 Cada Banca Pode Ter Multiplicadores Diferentes

Sim. Exemplo:
- Banca "Trono Rio": centena = 900x (mais agressivo)
- Banca "Trono Bahia": centena = 750x (mais conservador)
- Global default: centena = 800x

O scraper usa a hierarquia de fallback para buscar o multiplicador correto na hora de verificar.

---

## 10. Fazendinha

### 10.1 Diferenças do Fluxo vs Loterias

| Aspecto | Loterias | Fazendinha |
|---------|----------|------------|
| Loterias disponíveis | 151+ subloterias | Apenas 2 (LT LOOK 23HS, LT NACIONAL 23HS) |
| Modalidades | 73 | 3 (dezena, grupo, centena) |
| Colocação | Usuário escolhe | Fixo: `1_premio` |
| Seleção de loterias | Stage 4 do wizard (multi-select) | Dropdown na tela principal (1 só) |
| Input de valor | Campo livre + botões | Botões pré-definidos (R$1-R$20) |
| Input de palpite | Teclado numérico | Grid numérico |
| Número de telas | 6+ (tipo→data→modalidade→colocação→wizard→checkout) | 4 (data→config→números→confirmar) |
| Horário | Variado (02h-23h) | Late-night apenas (22:59, 23:19) |

### 10.2 Subloterias da Fazendinha

```typescript
// lib/constants/fazendinha.ts
const FAZENDINHA_SUBLOTERIAS = [
  { id: 'lt_look_23hs', nome: 'LT LOOK 23HS', horario: '23:19' },
  { id: 'lt_nacional_23hs', nome: 'LT NACIONAL 23HS', horario: '22:59' },
];
```

### 10.3 Modalidades Válidas

| Modalidade | Multiplicador | Range | Grid |
|-----------|:------------:|-------|------|
| Dezena | 82x | 00-99 | Números 00-99 |
| Grupo | 21x | 1-25 | Animais/Bichos 1-25 |
| Centena | 820x | 000-999 | Campo numérico |

### 10.4 Grid de Números

- **Grupo**: Grid 5×5 (25 bichos), cada célula mostra número + nome do animal
- **Dezena**: Grid 10×10 (00-99), seleção direta
- **Centena**: Campo numérico livre (3 dígitos)

### 10.5 Payload da Fazendinha

```typescript
await supabase.rpc('place_bet', {
  p_tipo: 'fazendinha',
  p_modalidade: 'dezena',        // ou 'grupo', 'centena'
  p_colocacao: '1_premio',       // SEMPRE fixo
  p_palpites: ['42'],            // Números selecionados
  p_horarios: [],                // VAZIO
  p_loterias: ['lt_look_23hs'], // UMA loteria apenas
  p_data_jogo: '2026-03-16',
  p_valor_unitario: 5.00,
  p_multiplicador: 82,
});
```

---

## 11. Jogos Acumulados — Quininha, Seninha, Lotinha

### 11.1 Comparação dos 3 Jogos

| Aspecto | Quininha | Seninha | Lotinha |
|---------|---------|---------|---------|
| Loteria Caixa | Quina | Mega-Sena | Lotofácil |
| Total de números | 80 | 60 | 25 |
| Modalidades | 13 (13D-45D) | 11 (14D-40D) | 7 (16D-22D) |
| Multiplicador máx | 5000x (13D) | 5000x (14D) | 5000x (16D) |
| Multiplicador mín | 7x (45D) | 5x (40D) | 8x (22D) |
| Sorteio | Seg-Sáb 20:00 | Seg-Sáb 20:00 | Seg/Qua/Sex 20:00 |
| Resultado em `premio_1` | CSV de 5 dezenas | CSV de 6 dezenas | CSV de 15 dezenas |

### 11.2 Seleção de Dias (Multi-Draw)

Na tela `/[jogo]/[data]/[modalidade]/dias`:
- Exibe calendário de próximos sorteios
- Usuário pode selecionar múltiplos dias futuros
- Mesma combinação de números é apostada em todos os dias selecionados
- Os dias selecionados vão no campo `p_horarios` do RPC

### 11.3 O que Significa "14 RESTANTES"

No grid de seleção de números, o display "X RESTANTES" indica quantos números faltam para completar o palpite:
- Se modalidade é `quininha_13d` → selecionar 13 números de 80
- Ao selecionar o 1°, mostra "12 RESTANTES"
- Quando atinge 13, auto-adiciona o palpite e reseta o contador

### 11.4 Verificação Contra Caixa

```python
# Diferente das loterias normais, usa resultado da Caixa:
caixa_key = f"20:00_CAIXA_{caixa_loteria}"  # ex: "20:00_CAIXA_QUINA"
resultado = resultados_map.get(caixa_key)

# premio_1 contém CSV de dezenas sorteadas: "02,05,06,08,15"
dezenas_resultado = set(resultado["premio_1"].split(","))

# Palpite do usuário: "03-06-13-18-24-28-30"
dezenas_palpite = set(palpite.split("-"))

# Contar interseção
acertos = len(dezenas_palpite & dezenas_resultado)

# Para ganhar: os 5 números sorteados devem estar dentro dos N selecionados
# Ex quininha_13d: 13 dezenas selecionadas, 5 sorteadas, 5 devem coincidir
```

### 11.5 Payload dos Jogos Acumulados

```typescript
// Quininha
await supabase.rpc('place_bet', {
  p_tipo: 'quininha',
  p_modalidade: 'quininha_13d',
  p_colocacao: 'geral',           // SEMPRE fixo
  p_palpites: ['03-06-13-18-24-28-30-35-42-51-60-72-79'],
  p_horarios: ['2026-03-16', '2026-03-17', '2026-03-18'], // DIAS, não horários
  p_loterias: [],                  // VAZIO (Caixa implícita)
  p_data_jogo: '2026-03-16',
  p_valor_unitario: 2.00,
  p_multiplicador: 5000,
});
```

### 11.6 Diferenças-Chave vs Loterias

1. **Grid de números** em vez de teclado numérico (1-80, 1-60, ou 1-25)
2. **Seleção de dias** em vez de seleção de loterias
3. **Colocação fixa**: sempre `geral`
4. **Loterias vazio**: Caixa Federal é implícita
5. **Verificação diferente**: conta acertos em dezenas (não match de milhar/centena)
6. **Resultado em formato CSV**: `premio_1` = "02,05,06,08,15" (não milhar 4-dígitos)
7. **Sem MALUCA**: jogos da Caixa não têm variante invertida

---

## Apêndice A: Zustand Bet Store — Estrutura Completa

### State

```typescript
interface BetStore {
  items: BetItem[];               // Apostas confirmadas prontas para submissão
  pendingItems: PendingBet[];     // Apostas aguardando seleção de loterias
  editingBet: PendingBet | null;  // Aposta sendo editada
  currentSelection: BetSelection; // Estado do formulário atual
}
```

### BetItem (Carrinho final)
```typescript
interface BetItem {
  id: string;                     // crypto.randomUUID()
  tipo: TipoJogo;
  modalidade: string;
  colocacao: string;
  palpites: string[];
  horarios: string[];             // HH:MM para loterias, datas para acumulados
  loterias: string[];             // IDs de subloterias
  data: string;                   // YYYY-MM-DD
  valorUnitario: number;
  multiplicador: number;
}
```

### PendingBet (Pré-loteria)
```typescript
interface PendingBet {
  id: string;
  tipo: TipoJogo;
  data: string;
  modalidade: string;
  colocacao: string;
  palpites: string[];
  valorUnitario: number;
  multiplicador: number;
}
```

### Cálculo do Total
```typescript
getTotal: () => items.reduce((sum, item) => {
  const quantidade = item.palpites.length * item.horarios.length;
  return sum + item.valorUnitario * quantidade;
}, 0);
```

### Persistência
- Salva em localStorage: `items` + `pendingItems`
- NÃO persiste: `currentSelection`, `editingBet`

---

## Apêndice B: Componentes UI Principais

| Componente | Arquivo | Função |
|-----------|---------|--------|
| `BetInput` | `components/loterias/bet-input.tsx` | Teclado numérico + Surpresinha |
| `ModalityList` | `components/loterias/modality-list.tsx` | Lista agrupada de modalidades |
| `PlacementList` | `components/loterias/placement-list.tsx` | Seleção de colocações |
| `ValueSelector` | `components/loterias/value-selector.tsx` | Campo valor + botões rápidos + toggle Todos/Cada |
| `LotterySelector` | `components/loterias/lottery-selector.tsx` | Grid multi-select de subloterias |
| `BetSummary` | `components/loterias/bet-summary.tsx` | Resumo receipt-style |
| `DateSelector` | `components/loterias/date-selector.tsx` | Seletor de 6-7 dias |

---

## Apêndice C: Mapa de Arquivos Relevantes

```
app/
├── (app)/home/page.tsx                                    # Home com cards dos jogos
├── loterias/
│   ├── page.tsx                                           # Hub: tipo selector + Repetir Pule
│   └── [tipo]/[data]/[modalidade]/[colocacao]/
│       └── ColocacaoClient.tsx                            # Wizard 4 stages
├── fazendinha/
│   ├── page.tsx                                           # Date selector
│   ├── [data]/page.tsx                                    # Config unificada
│   ├── [data]/numeros/page.tsx                            # Grid números
│   └── confirmar/page.tsx                                 # Checkout
├── quininha/ | seninha/ | lotinha/                         # Mesmo padrão:
│   ├── page.tsx                                           # Date selector
│   └── [data]/[modalidade]/
│       ├── page.tsx                                       # Grid números
│       ├── valor/page.tsx                                 # Valor
│       ├── dias/page.tsx                                  # Multi-draw
│       └── finalizar/page.tsx                             # Checkout
├── apostas/finalizar/page.tsx                             # Checkout universal (Loterias)

stores/bet-store.ts                                        # Zustand cart (~8k linhas)
lib/constants/modalidades.ts                               # 104 modalidades (~13k linhas)
lib/constants/bancas.ts                                    # 20 bancas, 151 subloterias (~12k linhas)
lib/constants/fazendinha.ts                                # Config Fazendinha
lib/actions/apostas.ts                                     # getRecentBets, buildRepeatBetUrl
lib/admin/actions/bets.ts                                  # getBets, getBetById (admin)
lib/hooks/use-user-balance.ts                              # Hook de saldo realtime
modal_scraper_v3.py                                        # Scraper + Verificação (~3k linhas)
types/database.ts                                          # Tipos gerados (~63k linhas)
types/bet.ts                                               # TipoJogo, BetItem, etc.
```
