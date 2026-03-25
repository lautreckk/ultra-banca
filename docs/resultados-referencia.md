# Resultados de Referência - Correção do Scraping

Data dos resultados: **07/02/2026**
Fonte: Banca Forte (vendedor 979536)

---

## LOTERIA RIO/FEDERAL

### Horários e Draws disponíveis

| Draw | Horário | Tem MALUCA? |
|------|---------|-------------|
| LT PT RIO 09HS | 09:00 | SIM |
| LT PT RIO 11HS | 11:00 | SIM |
| LT PT RIO 14HS | 14:00 | SIM |
| LT PT RIO 16HS | 16:00 | SIM |
| LT FEDERAL | ~18:00 | SIM (20HS) |
| LT PT RIO 21HS | 21:00 | SIM |

### PADRÃO MALUCA CONFIRMADO (RIO/FEDERAL)

A MALUCA **NÃO é um sorteio separado** para RIO. É **derivada** do resultado PT usando esta regra:

- **Prêmios 1-5:** Número de 4 dígitos **invertido** (ex: 3864 → 4683)
- **Prêmios 6-9:** Ordem **reversa** dos prêmios PT (PT9→M6, PT8→M7, PT7→M8, PT6→M9)
- **Prêmio 10:** Parece ser independente/diferente

> **IMPORTANTE:** Não é "inversão de dezena" (últimos 2 dígitos). É **inversão do milhar completo** (todos os 4 dígitos).

#### Prova (PT RIO 09HS → MALUCA RIO 09HS):
| Pos | PT | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 3864 | 4683 | 4683 | ✅ |
| 2 | 0345 | 5430 | 5430 | ✅ |
| 3 | 1863 | 3681 | 3681 | ✅ |
| 4 | 4958 | 8594 | 8594 | ✅ |
| 5 | 5107 | 7015 | 7015 | ✅ |
| 6 | PT9=4538 | - | 4538 | ✅ |
| 7 | PT8=6465 | - | 6465 | ✅ |
| 8 | PT7=8389 | - | 8389 | ✅ |
| 9 | PT6=3014 | - | 3014 | ✅ |

#### Prova (PT RIO 14HS → MALUCA RIO 14HS):
| Pos | PT | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 2464 | 4642 | 4642 | ✅ |
| 2 | 6437 | 7346 | 7346 | ✅ |
| 3 | 5262 | 2625 | 2625 | ✅ |
| 4 | 7882 | 2887 | 2887 | ✅ |
| 5 | 4334 | 4334 | 4334 | ✅ (palíndromo) |

#### Prova (FEDERAL → MALUCA/FED 20HS):
| Pos | FEDERAL | Invertido | MALUCA | Match? |
|-----|---------|-----------|--------|--------|
| 1 | 1627 | 7261 | 7261 | ✅ |
| 2 | 3789 | 9873 | 9873 | ✅ |
| 3 | 5297 | 7925 | 7925 | ✅ |
| 4 | 6903 | 3096 | 3096 | ✅ |
| 5 | 5116 | 6115 | 6115 | ✅ |

---

### Resultados Completos (10 prêmios cada)

> Nota: Nosso DB armazena premio_1..7. Prêmios 8-10 são documentados para referência.

#### LT PT RIO 09HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 3864 | G.16 | Leão |
| 2 | 0345 | G.12 | Elefante |
| 3 | 1863 | G.16 | Leão |
| 4 | 4958 | G.15 | Jacaré |
| 5 | 5107 | G.02 | Águia |
| 6 | 3014 | G.04 | Borboleta |
| 7 | 8389 | G.23 | Urso |
| 8 | 6465 | G.17 | Macaco |
| 9 | 4538 | G.10 | Coelho |
| 10 | 8543 | G.11 | Cavalo |

#### LT MALUCA/RIO 09HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4683 | G.21 | Touro |
| 2 | 5430 | G.08 | Camelo |
| 3 | 3681 | G.21 | Touro |
| 4 | 8594 | G.24 | Veado |
| 5 | 7015 | G.04 | Borboleta |
| 6 | 4538 | G.10 | Coelho |
| 7 | 6465 | G.17 | Macaco |
| 8 | 8389 | G.23 | Urso |
| 9 | 3014 | G.04 | Borboleta |
| 10 | 1809 | G.03 | Burro |

#### LT PT RIO 11HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 5307 | G.02 | Águia |
| 2 | 8606 | G.02 | Águia |
| 3 | 1420 | G.05 | Cachorro |
| 4 | 5370 | G.18 | Porco |
| 5 | 3488 | G.22 | Tigre |
| 6 | 5815 | G.04 | Borboleta |
| 7 | 3643 | G.11 | Cavalo |
| 8 | 0027 | G.07 | Carneiro |
| 9 | 7600 | G.25 | Vaca |
| 10 | 1276 | G.19 | Pavão |

#### LT MALUCA/RIO 11HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7035 | G.09 | Cobra |
| 2 | 6068 | G.17 | Macaco |
| 3 | 0241 | G.11 | Cavalo |
| 4 | 0735 | G.09 | Cobra |
| 5 | 8843 | G.11 | Cavalo |
| 6 | ⚠️ INCOMPLETO | G.25 | Vaca |
| 7 | 0027 | G.07 | Carneiro |
| 8 | 3643 | G.11 | Cavalo |
| 9 | 5815 | G.04 | Borboleta |
| 10 | 0007 | G.02 | Águia |

> ⚠️ Prêmio 6 da MALUCA 11HS veio incompleto na fonte. Deveria ser PT9=7600 (invertido não se aplica para 6-9, é cópia reversa).

#### LT PT RIO 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2464 | G.16 | Leão |
| 2 | 6437 | G.10 | Coelho |
| 3 | 5262 | G.16 | Leão |
| 4 | 7882 | G.21 | Touro |
| 5 | 4334 | G.09 | Cobra |
| 6 | 2657 | G.15 | Jacaré |
| 7 | 4428 | G.07 | Carneiro |
| 8 | 6368 | G.17 | Macaco |
| 9 | 4722 | G.06 | Cabra |
| 10 | 4554 | G.14 | Gato |

#### LT MALUCA/RIO 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4642 | G.11 | Cavalo |
| 2 | 7346 | G.12 | Elefante |
| 3 | 2625 | G.07 | Carneiro |
| 4 | 2887 | G.22 | Tigre |
| 5 | 4334 | G.09 | Cobra |
| 6 | 4722 | G.06 | Cabra |
| 7 | 6368 | G.17 | Macaco |
| 8 | 4428 | G.07 | Carneiro |
| 9 | 2657 | G.15 | Jacaré |
| 10 | 0009 | G.03 | Burro |

#### LT PT RIO 16HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1454 | G.14 | Gato |
| 2 | 2704 | G.01 | Avestruz |
| 3 | 7816 | G.04 | Borboleta |
| 4 | 5922 | G.06 | Cabra |
| 5 | 6764 | G.16 | Leão |
| 6 | 1275 | G.19 | Pavão |
| 7 | 4789 | G.23 | Urso |
| 8 | 5012 | G.03 | Burro |
| 9 | 4462 | G.16 | Leão |
| 10 | 0198 | G.25 | Vaca |

#### LT MALUCA/RIO 16HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4541 | G.11 | Cavalo |
| 2 | 4072 | G.18 | Porco |
| 3 | 6187 | G.22 | Tigre |
| 4 | 2295 | G.24 | Veado |
| 5 | 4676 | G.19 | Pavão |
| 6 | ⚠️ INCOMPLETO | G.16 | Leão |
| 7 | 5012 | G.03 | Burro |
| 8 | 4789 | G.23 | Urso |
| 9 | 1275 | G.19 | Pavão |
| 10 | 7309 | G.03 | Burro |

> ⚠️ Prêmio 6 da MALUCA 16HS veio incompleto. Deveria ser PT9=4462.

#### LT FEDERAL
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1627 | G.07 | Carneiro |
| 2 | 3789 | G.23 | Urso |
| 3 | 5297 | G.25 | Vaca |
| 4 | 6903 | G.01 | Avestruz |
| 5 | 5116 | G.04 | Borboleta |
| 6 | 1356 | G.14 | Gato |
| 7 | 6729 | G.08 | Camelo |
| 8 | 2890 | G.23 | Urso |
| 9 | 7973 | G.19 | Pavão |
| 10 | 1680 | G.20 | Peru |

#### LT MALUCA/FED 20HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7261 | G.16 | Leão |
| 2 | 9873 | G.19 | Pavão |
| 3 | 7925 | G.07 | Carneiro |
| 4 | 3096 | G.24 | Veado |
| 5 | 6115 | G.04 | Borboleta |
| 6 | 7973 | G.19 | Pavão |
| 7 | 2890 | G.23 | Urso |
| 8 | 6729 | G.08 | Camelo |
| 9 | 1356 | G.14 | Gato |
| 10 | 3218 | G.05 | Cachorro |

#### LT PT RIO 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0132 | G.08 | Camelo |
| 2 | 0080 | G.20 | Peru |
| 3 | 9333 | G.09 | Cobra |
| 4 | 7827 | G.07 | Carneiro |
| 5 | 0559 | G.15 | Jacaré |
| 6 | 0097 | G.25 | Vaca |
| 7 | 1038 | G.10 | Coelho |
| 8 | 3832 | G.08 | Camelo |
| 9 | 2037 | G.10 | Coelho |
| 10 | 4935 | G.09 | Cobra |

#### LT MALUCA/RIO 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2310 | G.03 | Burro |
| 2 | 0800 | G.25 | Vaca |
| 3 | 3339 | G.10 | Coelho |
| 4 | 7287 | G.22 | Tigre |
| 5 | 9550 | G.13 | Galo |
| 6 | 2037 | G.10 | Coelho |
| 7 | 3832 | G.08 | Camelo |
| 8 | 1038 | G.10 | Coelho |
| 9 | 0097 | G.25 | Vaca |
| 10 | 0290 | G.23 | Urso |

##### Verificação MALUCA 21HS:
| Pos | PT | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 0132 | 2310 | 2310 | ✅ |
| 2 | 0080 | 0800 | 0800 | ✅ |
| 3 | 9333 | 3339 | 3339 | ✅ |
| 4 | 7827 | 7287 | 7287 | ✅ |
| 5 | 0559 | 9550 | 9550 | ✅ |
| 6 | PT9=2037 | - | 2037 | ✅ |
| 7 | PT8=3832 | - | 3832 | ✅ |
| 8 | PT7=1038 | - | 1038 | ✅ |
| 9 | PT6=0097 | - | 0097 | ✅ |

---

## Descobertas Críticas para o Scraping

### 1. MALUCA - Três padrões distintos identificados

| Padrão | Loterias | Prêmios 1-5 | Prêmios 6-9 | Prêmio 10 |
|--------|----------|-------------|-------------|-----------|
| **A: Inversão + Reverso** | RIO, NACIONAL, LOOK, LOTEP, SP, SORTE/RS, MG, BOASORTE | Milhar invertido | Cópia reversa (P9→M6...) | Independente |
| **B: Inversão Total** | LOTECE | Milhar invertido | **Milhar invertido também** | Independente |
| **C: Separado** | BAHIA | Independente | Independente | Independente |

Fórmula de derivação:
- **Padrão A:** `M[1-5] = str(P[1-5])[::-1]`, `M[6] = P[9]`, `M[7] = P[8]`, `M[8] = P[7]`, `M[9] = P[6]`
- **Padrão B:** `M[1-9] = str(P[1-9])[::-1]` (todos invertidos)
- **Padrão C:** Scrape separado (loteria='MALUCA')

> Padrão verificado em **49 pares** PT/MALUCA (6 RIO + 8 NACIONAL + 8 LOOK + 6 LOTEP + 4 LOTECE + 8 SP + 1 SORTE + 2 MG + 6 BOASORTE). 100% de match nos prêmios 1-9.

### 2. Correção no MEMORY.md
O MEMORY dizia "dezena inversion" mas o correto é **milhar inversion** (inversão dos 4 dígitos completos).

### 3. Implicações para o Scraper
- **NÃO precisa** scrape MALUCA separadamente (confirmado para RIO, NACIONAL, LOOK, LOTEP e LOTECE)
- **Pode gerar** MALUCA a partir do resultado normal no momento da verificação
- Se o scraper JÁ encontra MALUCA separado, pode usar como validação
- **BAHIA é a EXCEÇÃO:** MALUCA é sorteio 100% independente (confirmado). Precisa scrape separado (loteria='MALUCA')
- **BAHIA/FEDERAL 20HS:** Híbrido - P1-4 de FEDERAL P9-P6, P5 invertido, P6-9 independentes

### 4. Dados incompletos detectados na fonte
**RIO:**
- MALUCA/RIO 11HS prêmio 6: milhar ausente (só veio "G.25 Vaca")
- MALUCA/RIO 16HS prêmio 6: milhar ausente (só veio "G.16 Leão")

**NACIONAL:**
- MALUCA/NAC 08HS prêmio 6: "91 G.22" (incompleto, deveria ser 9188)
- MALUCA/NAC 12HS prêmio 5/6: texto colado
- MALUCA/NAC 23HS prêmio 5: "53.03 Burro" (corrupto, deveria ser 5311)

**LOOK/GOIAS:**
- MALUCA LOOK 09HS prêmio 6: animal truncado ("G.16\no" → Leão)
- MALUCA LOOK 14HS prêmio 7: faltou "G." no grupo
- MALUCA LOOK 18HS prêmio 7: nome do animal ausente

> Problema recorrente: prêmio 6 da MALUCA frequentemente vem incompleto/corrupto. Provável bug de formatação na fonte. Números geralmente corretos, apenas formatação quebrada.

---

## Mapeamento subloteria_id → Resultado (RIO/FEDERAL)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| rj_09 | RIO/FEDERAL | 09:00 | PT | Scrape direto |
| rj_09_maluca | RIO/FEDERAL | 09:00 | PT | Derivar de rj_09 |
| rj_11 | RIO/FEDERAL | 11:00 | PT | Scrape direto |
| rj_11_maluca | RIO/FEDERAL | 11:00 | PT | Derivar de rj_11 |
| rj_14 | RIO/FEDERAL | 14:00 | PTV | Scrape direto |
| rj_14_maluca | RIO/FEDERAL | 14:00 | PTV | Derivar de rj_14 |
| rj_16 | RIO/FEDERAL | 16:00 | PT | Scrape direto |
| rj_16_maluca | RIO/FEDERAL | 16:00 | PT | Derivar de rj_16 |
| fed_18 (?) | FEDERAL | 18:00 | FEDERAL | Scrape direto |
| fed_maluca_20 | FEDERAL | 20:00 | FEDERAL | Derivar de fed_18 |
| rj_21 | RIO/FEDERAL | 21:00 | PTN | Scrape direto |
| rj_21_maluca | RIO/FEDERAL | 21:00 | PTN | Derivar de rj_21 |

> ⚠️ Os subloteria_id acima são provisórios. Precisam ser confirmados com o mapeamento atual em `LOTERIA_TO_BANCA`.

---

## LOTERIA NACIONAL

Data dos resultados: **07/02/2026**

### Horários e Draws disponíveis

| Draw | Horário | Tem MALUCA? |
|------|---------|-------------|
| LT NACIONAL 02HS | 02:00 | SIM |
| LT NACIONAL 08HS | 08:00 | SIM |
| LT NACIONAL 10HS | 10:00 | SIM |
| LT NACIONAL 12HS | 12:00 | SIM |
| LT NACIONAL 15HS | 15:00 | SIM |
| LT NACIONAL 17HS | 17:00 | SIM |
| LT NACIONAL 21HS | 21:00 | SIM |
| LT NACIONAL 23HS | 23:00 | SIM |

> **8 horários!** Mais que o mapeamento atual. Confirmar quais estão no scraper.

### PADRÃO MALUCA CONFIRMADO (NACIONAL)

Mesmo padrão do RIO/FEDERAL - MALUCA é **derivada** do resultado NACIONAL:

- **Prêmios 1-5:** Milhar **invertido** (4 dígitos ao contrário)
- **Prêmios 6-9:** Ordem **reversa** (NAC9→M6, NAC8→M7, NAC7→M8, NAC6→M9)
- **Prêmio 10:** Independente

#### Prova (NACIONAL 02HS):
| Pos | NAC | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 4846 | 6484 | 6484 | ✅ |
| 2 | 1284 | 4821 | 4821 | ✅ |
| 3 | 1520 | 0251 | 0251 | ✅ |
| 4 | 2113 | 3112 | 3112 | ✅ |
| 5 | 3407 | 7043 | 7043 | ✅ |
| 6 | NAC9=6403 | - | 6403 | ✅ |
| 7 | NAC8=4821 | - | 4821 | ✅ |
| 8 | NAC7=8251 | - | 8251 | ✅ |
| 9 | NAC6=4112 | - | 4112 | ✅ |

#### Prova (NACIONAL 10HS):
| Pos | NAC | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 5846 | 6485 | 6485 | ✅ |
| 2 | 9379 | 9739 | 9739 | ✅ |
| 3 | 9341 | 1439 | 1439 | ✅ |
| 4 | 3842 | 2483 | 2483 | ✅ |
| 5 | 1763 | 3671 | 3671 | ✅ |
| 6 | NAC9=6912 | - | 6912 | ✅ |
| 7 | NAC8=4744 | - | 4744 | ✅ |
| 8 | NAC7=8338 | - | 8338 | ✅ |
| 9 | NAC6=5993 | - | 5993 | ✅ |

#### Prova (NACIONAL 21HS):
| Pos | NAC | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 7392 | 2937 | 2937 | ✅ |
| 2 | 6858 | 8586 | 8586 | ✅ |
| 3 | 0122 | 2210 | 2210 | ✅ |
| 4 | 0693 | 3960 | 3960 | ✅ |
| 5 | 4329 | 9234 | 9234 | ✅ |
| 6 | NAC9=2823 | - | 2823 | ✅ |
| 7 | NAC8=9529 | - | 9529 | ✅ |
| 8 | NAC7=3816 | - | 3816 | ✅ |
| 9 | NAC6=7600 | - | 7600 | ✅ |

#### Prova (NACIONAL 23HS):
| Pos | NAC | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 7207 | 7027 | 7027 | ✅ |
| 2 | 1772 | 2771 | 2771 | ✅ |
| 3 | 1457 | 7541 | 7541 | ✅ |
| 4 | 5421 | 1245 | 1245 | ✅ |
| 5 | 1135 | 5311 | ⚠️ "53.03" (corrupto, deveria ser 5311) | ✅* |
| 6 | NAC9=7271 | - | 7271 | ✅ |
| 7 | NAC8=0752 | - | 0752 | ✅ |
| 8 | NAC7=2744 | - | 2744 | ✅ |
| 9 | NAC6=7115 | - | 7115 | ✅ |

> *Prêmio 5 da MALUCA 23HS veio corrupto ("53.03"), mas 1135 invertido = 5311, grupo G.03 = Burro confirma.

---

### Resultados Completos (10 prêmios cada)

#### LT NACIONAL 02HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4846 | G.12 | Elefante |
| 2 | 1284 | G.21 | Touro |
| 3 | 1520 | G.05 | Cachorro |
| 4 | 2113 | G.04 | Borboleta |
| 5 | 3407 | G.02 | Águia |
| 6 | 4112 | G.03 | Burro |
| 7 | 8251 | G.13 | Galo |
| 8 | 4821 | G.06 | Cabra |
| 9 | 6403 | G.01 | Avestruz |
| 10 | 6757 | G.15 | Jacaré |

#### LT MALUCA/NACIONAL 02HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 6484 | G.21 | Touro |
| 2 | 4821 | G.06 | Cabra |
| 3 | 0251 | G.13 | Galo |
| 4 | 3112 | G.03 | Burro |
| 5 | 7043 | G.11 | Cavalo |
| 6 | 6403 | G.01 | Avestruz |
| 7 | 4821 | G.06 | Cabra |
| 8 | 8251 | G.13 | Galo |
| 9 | 4112 | G.03 | Burro |
| 10 | 5298 | G.25 | Vaca |

#### LT NACIONAL 08HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2339 | G.10 | Coelho |
| 2 | 9581 | G.21 | Touro |
| 3 | 8808 | G.02 | Águia |
| 4 | 8798 | G.25 | Vaca |
| 5 | 6279 | G.20 | Peru |
| 6 | 2988 | G.22 | Tigre |
| 7 | 3587 | G.22 | Tigre |
| 8 | 3809 | G.03 | Burro |
| 9 | 9188 | G.22 | Tigre |
| 10 | 5377 | G.20 | Peru |

#### LT MALUCA/NACIONAL 08HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 9332 | G.08 | Camelo |
| 2 | 1859 | G.15 | Jacaré |
| 3 | 8088 | G.22 | Tigre |
| 4 | 8978 | G.20 | Peru |
| 5 | 9726 | G.07 | Carneiro |
| 6 | ⚠️ INCOMPLETO (~9188) | G.22 | Tigre |
| 7 | 3809 | G.03 | Burro |
| 8 | 3587 | G.22 | Tigre |
| 9 | 2988 | G.22 | Tigre |
| 10 | 7555 | G.14 | Gato |

> ⚠️ Prêmio 6 veio como "91 G.22" - incompleto. Pelo padrão, deveria ser NAC9=9188.

#### LT NACIONAL 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 5846 | G.12 | Elefante |
| 2 | 9379 | G.20 | Peru |
| 3 | 9341 | G.11 | Cavalo |
| 4 | 3842 | G.11 | Cavalo |
| 5 | 1763 | G.16 | Leão |
| 6 | 5993 | G.24 | Veado |
| 7 | 8338 | G.10 | Coelho |
| 8 | 4744 | G.11 | Cavalo |
| 9 | 6912 | G.03 | Burro |
| 10 | 6158 | G.15 | Jacaré |

#### LT MALUCA/NACIONAL 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 6485 | G.22 | Tigre |
| 2 | 9739 | G.10 | Coelho |
| 3 | 1439 | G.10 | Coelho |
| 4 | 2483 | G.21 | Touro |
| 5 | 3671 | G.18 | Porco |
| 6 | 6912 | G.03 | Burro |
| 7 | 4744 | G.11 | Cavalo |
| 8 | 8338 | G.10 | Coelho |
| 9 | 5993 | G.24 | Veado |
| 10 | 9804 | G.01 | Avestruz |

#### LT NACIONAL 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 9656 | G.14 | Gato |
| 2 | 3957 | G.15 | Jacaré |
| 3 | 2064 | G.16 | Leão |
| 4 | 5931 | G.08 | Camelo |
| 5 | 4585 | G.22 | Tigre |
| 6 | 9325 | G.07 | Carneiro |
| 7 | 6909 | G.03 | Burro |
| 8 | 5563 | G.16 | Leão |
| 9 | 6741 | G.11 | Cavalo |
| 10 | 4731 | G.08 | Camelo |

#### LT MALUCA/NACIONAL 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 6569 | G.18 | Porco |
| 2 | 7593 | G.24 | Veado |
| 3 | 4602 | G.01 | Avestruz |
| 4 | 1395 | G.24 | Veado |
| 5 | 5854 | G.14 | Gato |
| 6 | ⚠️ INCOMPLETO (~6741) | G.11 | Cavalo |
| 7 | 5563 | G.16 | Leão |
| 8 | 6909 | G.03 | Burro |
| 9 | 9325 | G.07 | Carneiro |
| 10 | 4551 | G.13 | Galo |

> ⚠️ Prêmio 5/6 vieram colados na fonte: "5854 - G.14 Gato6741 - G.11 Cavalo". Prêmio 6 = 6741 (NAC9).

#### LT NACIONAL 15HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0869 | G.18 | Porco |
| 2 | 8885 | G.22 | Tigre |
| 3 | 2744 | G.11 | Cavalo |
| 4 | 2882 | G.21 | Touro |
| 5 | 1686 | G.22 | Tigre |
| 6 | 0822 | G.06 | Cabra |
| 7 | 8878 | G.20 | Peru |
| 8 | 6848 | G.12 | Elefante |
| 9 | 9542 | G.11 | Cavalo |
| 10 | 3156 | G.14 | Gato |

#### LT MALUCA/NACIONAL 15HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 9680 | G.20 | Peru |
| 2 | 5888 | G.22 | Tigre |
| 3 | 4472 | G.18 | Porco |
| 4 | 2882 | G.21 | Touro |
| 5 | 6861 | G.16 | Leão |
| 6 | 9542 | G.11 | Cavalo |
| 7 | 6848 | G.12 | Elefante |
| 8 | 8878 | G.20 | Peru |
| 9 | 0822 | G.06 | Cabra |
| 10 | 5873 | G.19 | Pavão |

#### LT NACIONAL 17HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 3571 | G.18 | Porco |
| 2 | 3838 | G.10 | Coelho |
| 3 | 8919 | G.05 | Cachorro |
| 4 | 1413 | G.04 | Borboleta |
| 5 | 1403 | G.01 | Avestruz |
| 6 | 3381 | G.21 | Touro |
| 7 | 5894 | G.24 | Veado |
| 8 | 7311 | G.03 | Burro |
| 9 | 1893 | G.24 | Veado |
| 10 | 7623 | G.06 | Cabra |

#### LT MALUCA/NACIONAL 17HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1753 | G.14 | Gato |
| 2 | 8383 | G.21 | Touro |
| 3 | 9198 | G.25 | Vaca |
| 4 | 3141 | G.11 | Cavalo |
| 5 | 3041 | G.11 | Cavalo |
| 6 | 1893 | G.24 | Veado |
| 7 | 7311 | G.03 | Burro |
| 8 | 5894 | G.24 | Veado |
| 9 | 3381 | G.21 | Touro |
| 10 | 3995 | G.24 | Veado |

#### LT NACIONAL 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7392 | G.23 | Urso |
| 2 | 6858 | G.15 | Jacaré |
| 3 | 0122 | G.06 | Cabra |
| 4 | 0693 | G.24 | Veado |
| 5 | 4329 | G.08 | Camelo |
| 6 | 7600 | G.25 | Vaca |
| 7 | 3816 | G.04 | Borboleta |
| 8 | 9529 | G.08 | Camelo |
| 9 | 2823 | G.06 | Cabra |
| 10 | 3162 | G.16 | Leão |

#### LT MALUCA/NACIONAL 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2937 | G.10 | Coelho |
| 2 | 8586 | G.22 | Tigre |
| 3 | 2210 | G.03 | Burro |
| 4 | 3960 | G.15 | Jacaré |
| 5 | 9234 | G.09 | Cobra |
| 6 | 2823 | G.06 | Cabra |
| 7 | 9529 | G.08 | Camelo |
| 8 | 3816 | G.04 | Borboleta |
| 9 | 7600 | G.25 | Vaca |
| 10 | 0695 | G.24 | Veado |

#### LT NACIONAL 23HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7207 | G.02 | Águia |
| 2 | 1772 | G.18 | Porco |
| 3 | 1457 | G.15 | Jacaré |
| 4 | 5421 | G.06 | Cabra |
| 5 | 1135 | G.09 | Cobra |
| 6 | 7115 | G.04 | Borboleta |
| 7 | 2744 | G.11 | Cavalo |
| 8 | 0752 | G.13 | Galo |
| 9 | 7271 | G.18 | Porco |
| 10 | 4874 | G.19 | Pavão |

#### LT MALUCA/NACIONAL 23HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7027 | G.07 | Carneiro |
| 2 | 2771 | G.18 | Porco |
| 3 | 7541 | G.11 | Cavalo |
| 4 | 1245 | G.12 | Elefante |
| 5 | ⚠️ CORRUPTO (~5311) | G.03 | Burro |
| 6 | 7271 | G.18 | Porco |
| 7 | 0752 | G.13 | Galo |
| 8 | 2744 | G.11 | Cavalo |
| 9 | 7115 | G.04 | Borboleta |
| 10 | 1777 | G.20 | Peru |

> ⚠️ Prêmio 5 veio como "53.03 Burro" - corrupto. Pelo padrão: 1135 invertido = 5311, G.03 = Burro ✅.

---

### Dados incompletos/corrompidos (NACIONAL)
| Draw | Prêmio | Recebido | Valor correto (pelo padrão) |
|------|--------|----------|----------------------------|
| MALUCA/NAC 08HS | 6 | "91 G.22" | 9188 (NAC9) |
| MALUCA/NAC 12HS | 6 | colado com prêmio 5 | 6741 (NAC9) |
| MALUCA/NAC 23HS | 5 | "53.03 Burro" | 5311 (1135 invertido) |

### Mapeamento subloteria_id → Resultado (NACIONAL)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| nac_02 | NACIONAL | 02:00 | NACIONAL | Scrape direto |
| nac_02_maluca | NACIONAL | 02:00 | NACIONAL | Derivar de nac_02 |
| nac_08 | NACIONAL | 08:00 | NACIONAL | Scrape direto |
| nac_08_maluca | NACIONAL | 08:00 | NACIONAL | Derivar de nac_08 |
| nac_10 | NACIONAL | 10:00 | NACIONAL | Scrape direto |
| nac_10_maluca | NACIONAL | 10:00 | NACIONAL | Derivar de nac_10 |
| nac_12 | NACIONAL | 12:00 | NACIONAL | Scrape direto |
| nac_12_maluca | NACIONAL | 12:00 | NACIONAL | Derivar de nac_12 |
| nac_15 | NACIONAL | 15:00 | NACIONAL | Scrape direto |
| nac_15_maluca | NACIONAL | 15:00 | NACIONAL | Derivar de nac_15 |
| nac_17 | NACIONAL | 17:00 | NACIONAL | Scrape direto |
| nac_17_maluca | NACIONAL | 17:00 | NACIONAL | Derivar de nac_17 |
| nac_21 | NACIONAL | 21:00 | NACIONAL | Scrape direto |
| nac_21_maluca | NACIONAL | 21:00 | NACIONAL | Derivar de nac_21 |
| nac_23 | NACIONAL | 23:00 | NACIONAL | Scrape direto |
| nac_23_maluca | NACIONAL | 23:00 | NACIONAL | Derivar de nac_23 |

> ⚠️ Os subloteria_id são provisórios. NACIONAL tem **8 horários** (02, 08, 10, 12, 15, 17, 21, 23).

---

## LOTERIA LOOK/GOIAS

Data dos resultados: **07/02/2026**

### Horários e Draws disponíveis

| Draw | Horário | Tem MALUCA? |
|------|---------|-------------|
| LT LOOK 07HS | 07:00 | SIM |
| LT LOOK 09HS | 09:00 | SIM |
| LT LOOK 11HS | 11:00 | SIM |
| LT LOOK 14HS | 14:00 | SIM |
| LT LOOK 16HS | 16:00 | SIM |
| LT LOOK 18HS | 18:00 | SIM |
| LT LOOK 21HS | 21:00 | SIM |
| LT LOOK 23HS | 23:00 | SIM |

> **8 horários!** (07, 09, 11, 14, 16, 18, 21, 23)

### PADRÃO MALUCA CONFIRMADO (LOOK/GOIAS)

Mesmo padrão do RIO e NACIONAL - verificado em todos os 8 pares:

#### Prova (LOOK 07HS):
| Pos | LOOK | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 7414 | 4147 | 4147 | ✅ |
| 2 | 6468 | 8646 | 8646 | ✅ |
| 3 | 8342 | 2438 | 2438 | ✅ |
| 4 | 9679 | 9769 | 9769 | ✅ |
| 5 | 8967 | 7698 | 7698 | ✅ |
| 6 | L9=4829 | - | 4829 | ✅ |
| 7 | L8=1647 | - | 1647 | ✅ |
| 8 | L7=4436 | - | 4436 | ✅ |
| 9 | L6=7689 | - | 7689 | ✅ |

#### Prova (LOOK 16HS):
| Pos | LOOK | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 6143 | 3416 | 3416 | ✅ |
| 2 | 5471 | 1745 | 1745 | ✅ |
| 3 | 2069 | 9602 | 9602 | ✅ |
| 4 | 9562 | 2659 | 2659 | ✅ |
| 5 | 5676 | 6765 | 6765 | ✅ |
| 6 | L9=3192 | - | 3192 | ✅ |
| 7 | L8=4766 | - | 4766 | ✅ |
| 8 | L7=1405 | - | 1405 | ✅ |
| 9 | L6=6529 | - | 6529 | ✅ |

#### Prova (LOOK 23HS):
| Pos | LOOK | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 5554 | 4555 | 4555 | ✅ |
| 2 | 1731 | 1371 | 1371 | ✅ |
| 3 | 3656 | 6563 | 6563 | ✅ |
| 4 | 5719 | 9175 | 9175 | ✅ |
| 5 | 0508 | 8050 | 8050 | ✅ |
| 6 | L9=4169 | - | 4169 | ✅ |
| 7 | L8=5351 | - | 5351 | ✅ |
| 8 | L7=5767 | - | 5767 | ✅ |
| 9 | L6=5135 | - | 5135 | ✅ |

> Todos os 8 pares verificados (07, 09, 11, 14, 16, 18, 21, 23). 100% match.

---

### Resultados Completos (10 prêmios cada)

#### LT LOOK 07HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7414 | G.04 | Borboleta |
| 2 | 6468 | G.17 | Macaco |
| 3 | 8342 | G.11 | Cavalo |
| 4 | 9679 | G.20 | Peru |
| 5 | 8967 | G.17 | Macaco |
| 6 | 7689 | G.23 | Urso |
| 7 | 4436 | G.09 | Cobra |
| 8 | 1647 | G.12 | Elefante |
| 9 | 4829 | G.08 | Camelo |
| 10 | 9471 | G.18 | Porco |

#### LT MALUCA LOOK 07HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4147 | G.12 | Elefante |
| 2 | 8646 | G.12 | Elefante |
| 3 | 2438 | G.10 | Coelho |
| 4 | 9769 | G.18 | Porco |
| 5 | 7698 | G.25 | Vaca |
| 6 | 4829 | G.08 | Camelo |
| 7 | 1647 | G.12 | Elefante |
| 8 | 4436 | G.09 | Cobra |
| 9 | 7689 | G.23 | Urso |
| 10 | 1299 | G.25 | Vaca |

#### LT LOOK 09HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1717 | G.05 | Cachorro |
| 2 | 6821 | G.06 | Cabra |
| 3 | 3506 | G.02 | Águia |
| 4 | 1951 | G.13 | Galo |
| 5 | 3170 | G.18 | Porco |
| 6 | 1631 | G.08 | Camelo |
| 7 | 7859 | G.15 | Jacaré |
| 8 | 1205 | G.02 | Águia |
| 9 | 7161 | G.16 | Leão |
| 10 | 5021 | G.06 | Cabra |

#### LT MALUCA LOOK 09HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7171 | G.18 | Porco |
| 2 | 1286 | G.22 | Tigre |
| 3 | 6053 | G.14 | Gato |
| 4 | 1591 | G.23 | Urso |
| 5 | 0713 | G.04 | Borboleta |
| 6 | 7161 | G.16 | Leão |
| 7 | 1205 | G.02 | Águia |
| 8 | 7859 | G.15 | Jacaré |
| 9 | 1631 | G.08 | Camelo |
| 10 | 4670 | G.18 | Porco |

> ⚠️ Prêmio 6 veio com animal truncado: "G.16\no" (deveria ser Leão).

#### LT LOOK 11HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4584 | G.21 | Touro |
| 2 | 9078 | G.20 | Peru |
| 3 | 5635 | G.09 | Cobra |
| 4 | 3830 | G.08 | Camelo |
| 5 | 2085 | G.22 | Tigre |
| 6 | 4953 | G.14 | Gato |
| 7 | 5068 | G.17 | Macaco |
| 8 | 8733 | G.09 | Cobra |
| 9 | 4850 | G.13 | Galo |
| 10 | 8816 | G.04 | Borboleta |

#### LT MALUCA LOOK 11HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4854 | G.14 | Gato |
| 2 | 8709 | G.03 | Burro |
| 3 | 5365 | G.17 | Macaco |
| 4 | 0383 | G.21 | Touro |
| 5 | 5802 | G.01 | Avestruz |
| 6 | 4850 | G.13 | Galo |
| 7 | 8733 | G.09 | Cobra |
| 8 | 5068 | G.17 | Macaco |
| 9 | 4953 | G.14 | Gato |
| 10 | 8717 | G.05 | Cachorro |

#### LT LOOK 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2302 | G.01 | Avestruz |
| 2 | 8487 | G.22 | Tigre |
| 3 | 5959 | G.15 | Jacaré |
| 4 | 1900 | G.25 | Vaca |
| 5 | 3547 | G.12 | Elefante |
| 6 | 2851 | G.13 | Galo |
| 7 | 3499 | G.25 | Vaca |
| 8 | 0850 | G.13 | Galo |
| 9 | 2790 | G.23 | Urso |
| 10 | 2185 | G.22 | Tigre |

#### LT MALUCA LOOK 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2032 | G.08 | Camelo |
| 2 | 7848 | G.12 | Elefante |
| 3 | 9595 | G.24 | Veado |
| 4 | 0091 | G.23 | Urso |
| 5 | 7453 | G.14 | Gato |
| 6 | 2790 | G.23 | Urso |
| 7 | 0850 | G.13 | Galo |
| 8 | 3499 | G.25 | Vaca |
| 9 | 2851 | G.13 | Galo |
| 10 | 7009 | G.03 | Burro |

> ⚠️ Prêmio 7 veio como "0850 -13 Galo" - faltou "G." no grupo.

#### LT LOOK 16HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 6143 | G.11 | Cavalo |
| 2 | 5471 | G.18 | Porco |
| 3 | 2069 | G.18 | Porco |
| 4 | 9562 | G.16 | Leão |
| 5 | 5676 | G.19 | Pavão |
| 6 | 6529 | G.08 | Camelo |
| 7 | 1405 | G.02 | Águia |
| 8 | 4766 | G.17 | Macaco |
| 9 | 3192 | G.23 | Urso |
| 10 | 4813 | G.04 | Borboleta |

#### LT MALUCA LOOK 16HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 3416 | G.04 | Borboleta |
| 2 | 1745 | G.12 | Elefante |
| 3 | 9602 | G.01 | Avestruz |
| 4 | 2659 | G.15 | Jacaré |
| 5 | 6765 | G.17 | Macaco |
| 6 | 3192 | G.23 | Urso |
| 7 | 4766 | G.17 | Macaco |
| 8 | 1405 | G.02 | Águia |
| 9 | 6529 | G.08 | Camelo |
| 10 | 0079 | G.20 | Peru |

#### LT LOOK 18HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 8025 | G.07 | Carneiro |
| 2 | 5456 | G.14 | Gato |
| 3 | 1805 | G.02 | Águia |
| 4 | 1492 | G.23 | Urso |
| 5 | 0730 | G.08 | Camelo |
| 6 | 8511 | G.03 | Burro |
| 7 | 0484 | G.21 | Touro |
| 8 | 2509 | G.03 | Burro |
| 9 | 5652 | G.13 | Galo |
| 10 | 4664 | G.16 | Leão |

#### LT MALUCA LOOK 18HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 5208 | G.02 | Águia |
| 2 | 6545 | G.12 | Elefante |
| 3 | 5081 | G.21 | Touro |
| 4 | 2941 | G.11 | Cavalo |
| 5 | 0370 | G.18 | Porco |
| 6 | 5652 | G.13 | Galo |
| 7 | 2509 | G.03 | Burro |
| 8 | 0484 | G.21 | Touro |
| 9 | 8511 | G.03 | Burro |
| 10 | 7301 | G.01 | Avestruz |

> ⚠️ Prêmio 7 veio sem nome do animal: "2509 - G.03" (Burro).

#### LT LOOK 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4144 | G.11 | Cavalo |
| 2 | 0114 | G.04 | Borboleta |
| 3 | 6190 | G.23 | Urso |
| 4 | 9113 | G.04 | Borboleta |
| 5 | 2686 | G.22 | Tigre |
| 6 | 4069 | G.18 | Porco |
| 7 | 1111 | G.03 | Burro |
| 8 | 4191 | G.23 | Urso |
| 9 | 4403 | G.01 | Avestruz |
| 10 | 6021 | G.06 | Cabra |

#### LT MALUCA LOOK 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4414 | G.04 | Borboleta |
| 2 | 4110 | G.03 | Burro |
| 3 | 0916 | G.04 | Borboleta |
| 4 | 3119 | G.05 | Cachorro |
| 5 | 6862 | G.16 | Leão |
| 6 | 4403 | G.01 | Avestruz |
| 7 | 4191 | G.23 | Urso |
| 8 | 1111 | G.03 | Burro |
| 9 | 4069 | G.18 | Porco |
| 10 | 3195 | G.24 | Veado |

#### LT LOOK 23HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 5554 | G.14 | Gato |
| 2 | 1731 | G.08 | Camelo |
| 3 | 3656 | G.14 | Gato |
| 4 | 5719 | G.05 | Cachorro |
| 5 | 0508 | G.02 | Águia |
| 6 | 5135 | G.09 | Cobra |
| 7 | 5767 | G.17 | Macaco |
| 8 | 5351 | G.13 | Galo |
| 9 | 4169 | G.18 | Porco |
| 10 | 7590 | G.23 | Urso |

#### LT MALUCA LOOK 23HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4555 | G.14 | Gato |
| 2 | 1371 | G.18 | Porco |
| 3 | 6563 | G.16 | Leão |
| 4 | 9175 | G.19 | Pavão |
| 5 | 8050 | G.13 | Galo |
| 6 | 4169 | G.18 | Porco |
| 7 | 5351 | G.13 | Galo |
| 8 | 5767 | G.17 | Macaco |
| 9 | 5135 | G.09 | Cobra |
| 10 | 0136 | G.09 | Cobra |

---

### Dados incompletos/corrompidos (LOOK/GOIAS)
| Draw | Prêmio | Recebido | Valor correto (pelo padrão) |
|------|--------|----------|----------------------------|
| MALUCA LOOK 09HS | 6 | "7161 - G.16\no" | 7161 (L9) - animal truncado |
| MALUCA LOOK 14HS | 7 | "0850 -13 Galo" | 0850 (L8) - faltou "G." |
| MALUCA LOOK 18HS | 7 | "2509 - G.03" (sem animal) | 2509 (L8) - nome ausente |

> Problemas menores de formatação, números corretos.

### Mapeamento subloteria_id → Resultado (LOOK/GOIAS)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| go_07 | LOOK/GOIAS | 07:00 | LOOK | Scrape direto |
| go_07_maluca | LOOK/GOIAS | 07:00 | LOOK | Derivar de go_07 |
| go_09 | LOOK/GOIAS | 09:00 | LOOK | Scrape direto |
| go_09_maluca | LOOK/GOIAS | 09:00 | LOOK | Derivar de go_09 |
| go_11 | LOOK/GOIAS | 11:00 | LOOK | Scrape direto |
| go_11_maluca | LOOK/GOIAS | 11:00 | LOOK | Derivar de go_11 |
| go_14 | LOOK/GOIAS | 14:00 | LOOK | Scrape direto |
| go_14_maluca | LOOK/GOIAS | 14:00 | LOOK | Derivar de go_14 |
| go_16 | LOOK/GOIAS | 16:00 | LOOK | Scrape direto |
| go_16_maluca | LOOK/GOIAS | 16:00 | LOOK | Derivar de go_16 |
| go_18 | LOOK/GOIAS | 18:00 | LOOK | Scrape direto |
| go_18_maluca | LOOK/GOIAS | 18:00 | LOOK | Derivar de go_18 |
| go_21 | LOOK/GOIAS | 21:00 | LOOK | Scrape direto |
| go_21_maluca | LOOK/GOIAS | 21:00 | LOOK | Derivar de go_21 |
| go_23 | LOOK/GOIAS | 23:00 | LOOK | Scrape direto |
| go_23_maluca | LOOK/GOIAS | 23:00 | LOOK | Derivar de go_23 |

> ⚠️ LOOK/GOIAS tem **8 horários** (07, 09, 11, 14, 16, 18, 21, 23).

---

## LOTERIA LOTEP (Pernambuco)

Data dos resultados: **07/02/2026**

### Horários e Draws disponíveis

| Draw | Horário | Tem MALUCA? |
|------|---------|-------------|
| LT LOTEP 09HS | 09:00 | SIM |
| LT LOTEP 10HS | 10:00 | SIM |
| LT LOTEP 12HS | 12:00 | SIM |
| LT LOTEP 15HS | 15:00 | SIM |
| LT LOTEP 18HS | 18:00 | SIM |
| LT LOTEP 20HS | 20:00 | SIM |

> **6 horários** (09, 10, 12, 15, 18, 20)

### PADRÃO MALUCA CONFIRMADO (LOTEP)

Mesmo padrão universal - verificado em todos os 6 pares:

#### Prova (LOTEP 09HS):
| Pos | LOTEP | Invertido | MALUCA | Match? |
|-----|-------|-----------|--------|--------|
| 1 | 0990 | 0990 | 0990 | ✅ (palíndromo) |
| 2 | 2127 | 7212 | 7212 | ✅ |
| 3 | 9543 | 3459 | 3459 | ✅ |
| 4 | 5946 | 6495 | 6495 | ✅ |
| 5 | 7330 | 0337 | 0337 | ✅ |
| 6 | P9=0736 | - | 0736 | ✅ |
| 7 | P8=9244 | - | 9244 | ✅ |
| 8 | P7=9159 | - | 9159 | ✅ |
| 9 | P6=0295 | - | 0295 | ✅ |

#### Prova (LOTEP 12HS):
| Pos | LOTEP | Invertido | MALUCA | Match? |
|-----|-------|-----------|--------|--------|
| 1 | 7744 | 4477 | 4477 | ✅ |
| 2 | 9111 | 1119 | 1119 | ✅ |
| 3 | 2239 | 9322 | 9322 | ✅ |
| 4 | 1673 | 3761 | 3761 | ✅ |
| 5 | 6607 | 7066 | 7066 | ✅ |
| 6 | P9=4193 | - | 4193 | ✅ |
| 7 | P8=4137 | - | 4137 | ✅ |
| 8 | P7=7126 | - | 7126 | ✅ |
| 9 | P6=7921 | - | 7921 | ✅ |

#### Prova (LOTEP 20HS):
| Pos | LOTEP | Invertido | MALUCA | Match? |
|-----|-------|-----------|--------|--------|
| 1 | 2237 | 7322 | 7322 | ✅ |
| 2 | 9806 | 6089 | 6089 | ✅ |
| 3 | 7125 | 5217 | 5217 | ✅ |
| 4 | 9965 | 5699 | 5699 | ✅ |
| 5 | 9979 | 9799 | 9799 | ✅ |
| 6 | P9=7655 | - | ⚠️ "765.14" (corrupto) | ✅* |
| 7 | P8=3026 | - | 3026 | ✅ |
| 8 | P7=2819 | - | 2819 | ✅ |
| 9 | P6=2979 | - | 2979 | ✅ |

> *Prêmio 6 da MALUCA 20HS veio como "765.14 Gato" - corrupto. Pelo padrão: P9=7655, G.14=Gato ✅.

---

### Resultados Completos (10 prêmios cada)

#### LT LOTEP 09HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0990 | G.23 | Urso |
| 2 | 2127 | G.07 | Carneiro |
| 3 | 9543 | G.11 | Cavalo |
| 4 | 5946 | G.12 | Elefante |
| 5 | 7330 | G.08 | Camelo |
| 6 | 0295 | G.24 | Veado |
| 7 | 9159 | G.15 | Jacaré |
| 8 | 9244 | G.11 | Cavalo |
| 9 | 0736 | G.09 | Cobra |
| 10 | 5370 | G.18 | Porco |

#### LT MALUCA/LOTEP 09HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0990 | G.23 | Urso |
| 2 | 7212 | G.03 | Burro |
| 3 | 3459 | G.15 | Jacaré |
| 4 | 6495 | G.24 | Veado |
| 5 | 0337 | G.10 | Coelho |
| 6 | 0736 | G.09 | Cobra |
| 7 | 9244 | G.11 | Cavalo |
| 8 | 9159 | G.15 | Jacaré |
| 9 | 0295 | G.24 | Veado |
| 10 | 7927 | G.07 | Carneiro |

#### LT LOTEP 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 9842 | G.11 | Cavalo |
| 2 | 6156 | G.14 | Gato |
| 3 | 1751 | G.13 | Galo |
| 4 | 2457 | G.15 | Jacaré |
| 5 | 0954 | G.14 | Gato |
| 6 | 9612 | G.03 | Burro |
| 7 | 8174 | G.19 | Pavão |
| 8 | 4555 | G.14 | Gato |
| 9 | 2617 | G.05 | Cachorro |
| 10 | 6118 | G.05 | Cachorro |

#### LT MALUCA/LOTEP 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2489 | G.23 | Urso |
| 2 | 6516 | G.04 | Borboleta |
| 3 | 1571 | G.18 | Porco |
| 4 | 7542 | G.11 | Cavalo |
| 5 | 4590 | G.23 | Urso |
| 6 | 2617 | G.05 | Cachorro |
| 7 | 4555 | G.14 | Gato |
| 8 | 8174 | G.19 | Pavão |
| 9 | 9612 | G.03 | Burro |
| 10 | 7666 | G.17 | Macaco |

> ⚠️ Prêmio 6 veio como "2617 - \nCachorro" - faltou grupo "G.05".

#### LT LOTEP 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7744 | G.11 | Cavalo |
| 2 | 9111 | G.03 | Burro |
| 3 | 2239 | G.10 | Coelho |
| 4 | 1673 | G.19 | Pavão |
| 5 | 6607 | G.02 | Águia |
| 6 | 7921 | G.06 | Cabra |
| 7 | 7126 | G.07 | Carneiro |
| 8 | 4137 | G.10 | Coelho |
| 9 | 4193 | G.24 | Veado |
| 10 | 0751 | G.13 | Galo |

#### LT MALUCA/LOTEP 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4477 | G.20 | Peru |
| 2 | 1119 | G.05 | Cachorro |
| 3 | 9322 | G.06 | Cabra |
| 4 | 3761 | G.16 | Leão |
| 5 | 7066 | G.17 | Macaco |
| 6 | 4193 | G.24 | Veado |
| 7 | 4137 | G.10 | Coelho |
| 8 | 7126 | G.07 | Carneiro |
| 9 | 7921 | G.06 | Cabra |
| 10 | 9122 | G.06 | Cabra |

#### LT LOTEP 15HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 6072 | G.18 | Porco |
| 2 | 6740 | G.10 | Coelho |
| 3 | 1467 | G.17 | Macaco |
| 4 | 6924 | G.06 | Cabra |
| 5 | 2738 | G.10 | Coelho |
| 6 | 6616 | G.04 | Borboleta |
| 7 | 0749 | G.13 | Galo |
| 8 | 7462 | G.16 | Leão |
| 9 | 2074 | G.19 | Pavão |
| 10 | 0842 | G.11 | Cavalo |

#### LT MALUCA/LOTEP 15HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2706 | G.02 | Águia |
| 2 | 0476 | G.19 | Pavão |
| 3 | 7641 | G.11 | Cavalo |
| 4 | 4296 | G.24 | Veado |
| 5 | 8372 | G.18 | Porco |
| 6 | 2074 | G.19 | Pavão |
| 7 | 7462 | G.16 | Leão |
| 8 | 0749 | G.13 | Galo |
| 9 | 6616 | G.04 | Borboleta |
| 10 | 0392 | G.23 | Urso |

> ⚠️ Prêmio 6 veio como "2074 - vão" - animal truncado (deveria ser "G.19 Pavão").

#### LT LOTEP 18HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 5547 | G.12 | Elefante |
| 2 | 7246 | G.12 | Elefante |
| 3 | 7492 | G.23 | Urso |
| 4 | 5550 | G.13 | Galo |
| 5 | 0178 | G.20 | Peru |
| 6 | 5775 | G.19 | Pavão |
| 7 | 5245 | G.12 | Elefante |
| 8 | 4495 | G.24 | Veado |
| 9 | 7620 | G.05 | Cachorro |
| 10 | 9148 | G.12 | Elefante |

#### LT MALUCA/LOTEP 18HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7455 | G.14 | Gato |
| 2 | 6427 | G.07 | Carneiro |
| 3 | 2947 | G.12 | Elefante |
| 4 | 0555 | G.14 | Gato |
| 5 | 8710 | G.03 | Burro |
| 6 | 7620 | G.05 | Cachorro |
| 7 | 4495 | G.24 | Veado |
| 8 | 5245 | G.12 | Elefante |
| 9 | 5775 | G.19 | Pavão |
| 10 | 9229 | G.08 | Camelo |

#### LT LOTEP 20HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2237 | G.10 | Coelho |
| 2 | 9806 | G.02 | Águia |
| 3 | 7125 | G.07 | Carneiro |
| 4 | 9965 | G.17 | Macaco |
| 5 | 9979 | G.20 | Peru |
| 6 | 2979 | G.20 | Peru |
| 7 | 2819 | G.05 | Cachorro |
| 8 | 3026 | G.07 | Carneiro |
| 9 | 7655 | G.14 | Gato |
| 10 | 5591 | G.23 | Urso |

#### LT MALUCA/LOTEP 20HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7322 | G.06 | Cabra |
| 2 | 6089 | G.23 | Urso |
| 3 | 5217 | G.05 | Cachorro |
| 4 | 5699 | G.25 | Vaca |
| 5 | 9799 | G.25 | Vaca |
| 6 | ⚠️ CORRUPTO (~7655) | G.14 | Gato |
| 7 | 3026 | G.07 | Carneiro |
| 8 | 2819 | G.05 | Cachorro |
| 9 | 2979 | G.20 | Peru |
| 10 | 0605 | G.02 | Águia |

> ⚠️ Prêmio 6 veio como "765.14 Gato" - corrupto. Pelo padrão: P9=7655, G.14=Gato ✅.

---

### Dados incompletos/corrompidos (LOTEP)
| Draw | Prêmio | Recebido | Valor correto (pelo padrão) |
|------|--------|----------|----------------------------|
| MALUCA/LOTEP 10HS | 6 | "2617 - \nCachorro" | 2617 (P9) - faltou grupo |
| MALUCA/LOTEP 15HS | 6 | "2074 - vão" | 2074 (P9) - animal truncado |
| MALUCA/LOTEP 20HS | 6 | "765.14 Gato" | 7655 (P9) - corrupto |

> Padrão recorrente: prêmio 6 da MALUCA é o mais problemático em todas as loterias.

### Mapeamento subloteria_id → Resultado (LOTEP)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| pe_09 | LOTEP | 09:00 | GERAL | Scrape direto |
| pe_09_maluca | LOTEP | 09:00 | GERAL | Derivar de pe_09 |
| pe_10 | LOTEP | 10:00 | GERAL | Scrape direto |
| pe_10_maluca | LOTEP | 10:00 | GERAL | Derivar de pe_10 |
| pe_12 | LOTEP | 12:00 | GERAL | Scrape direto |
| pe_12_maluca | LOTEP | 12:00 | GERAL | Derivar de pe_12 |
| pe_15 | LOTEP | 15:00 | GERAL | Scrape direto |
| pe_15_maluca | LOTEP | 15:00 | GERAL | Derivar de pe_15 |
| pe_18 | LOTEP | 18:00 | GERAL | Scrape direto |
| pe_18_maluca | LOTEP | 18:00 | GERAL | Derivar de pe_18 |
| pe_20 | LOTEP | 20:00 | GERAL | Scrape direto |
| pe_20_maluca | LOTEP | 20:00 | GERAL | Derivar de pe_20 |

> ⚠️ LOTEP tem **6 horários** (09, 10, 12, 15, 18, 20).

---

## LOTERIA BAHIA (EXCEÇÃO - MALUCA SEPARADA!)

Data dos resultados: **07/02/2026**

### Horários e Draws disponíveis

| Draw | Horário | MALUCA separada? |
|------|---------|------------------|
| LT BAHIA 10HS | 10:00 | SIM - SEPARADA |
| LT BAHIA 12HS | 12:00 | SIM - SEPARADA |
| LT BAHIA 15HS | 15:00 | SIM - SEPARADA |
| LT BAHIA/FEDERAL 20HS | 20:00 | SIM - SEPARADA |
| LT BAHIA 21HS | 21:00 | SIM - SEPARADA |

> **5 horários** (10, 12, 15, 20/FEDERAL, 21)

### BAHIA É A EXCEÇÃO: MALUCA É SORTEIO INDEPENDENTE

Diferente de RIO, NACIONAL, LOOK e LOTEP, a BAHIA tem **sorteios MALUCA completamente independentes** - números diferentes, NÃO derivados do resultado normal.

#### Prova de que NÃO segue o padrão de inversão:

| Draw | Pos | BAHIA | Invertido seria | MALUCA real | Derivado? |
|------|-----|-------|-----------------|-------------|-----------|
| 10HS | 1 | 1674 | 4761 | 4332 | ❌ |
| 10HS | 2 | 3563 | 3653 | 7674 | ❌ |
| 12HS | 1 | 1261 | 1621 | 1455 | ❌ |
| 12HS | 2 | 2274 | 4722 | 6766 | ❌ |
| 15HS | 1 | 5517 | 7155 | 7885 | ❌ |
| 15HS | 2 | 7738 | 8377 | 1319 | ❌ |
| 21HS | 1 | 9748 | 8479 | 8098 | ❌ |
| 21HS | 2 | 5710 | 0175 | 4182 | ❌ |

#### Prova de que prêmios 6-9 também NÃO seguem o padrão reverso:

| Draw | Pos | BAHIA (seria P9,P8,P7,P6) | MALUCA real | Match? |
|------|-----|---------------------------|-------------|--------|
| 10HS | 6 | P9=1241 | 5021 | ❌ |
| 10HS | 7 | P8=0972 | 6774 | ❌ |
| 21HS | 6 | P9=8868 | 7528 | ❌ |
| 21HS | 7 | P8=7132 | 1936 | ❌ |

> **Conclusão:** BAHIA MALUCA é 100% independente. Deve ser scrapeada separadamente (como já está no scraper com loteria='MALUCA').

### BAHIA/FEDERAL 20HS - Análise especial

O draw "LT BAHIA/FEDERAL 20HS" compartilha prêmios 1-5 com a FEDERAL nacional, mas tem prêmios 6-10 próprios:

| Pos | FEDERAL (RIO) | BAHIA/FEDERAL | Match? |
|-----|---------------|---------------|--------|
| 1 | 1627 | 1627 | ✅ |
| 2 | 3789 | 3789 | ✅ |
| 3 | 5297 | 5297 | ✅ |
| 4 | 6903 | 6903 | ✅ |
| 5 | 5116 | 5116 | ✅ |
| 6 | 1356 | 1273 | ❌ (próprio) |
| 7 | 6729 | 6855 | ❌ (próprio) |
| 8 | 2890 | 2839 | ❌ (próprio) |
| 9 | 7973 | 9494 | ❌ (próprio) |
| 10 | 1680 | 4066 | ❌ (próprio) |

> Prêmios 1-5 são o resultado FEDERAL nacional. Prêmios 6-10 são exclusivos da BAHIA.

### MALUCA/BA FED. 20HS - Padrão híbrido

A MALUCA do FEDERAL na BAHIA usa um padrão diferente:

| Pos | MALUCA/BA FED | Origem |
|-----|---------------|--------|
| 1 | 7973 | = FEDERAL P9 (cópia) |
| 2 | 2890 | = FEDERAL P8 (cópia) |
| 3 | 6729 | = FEDERAL P7 (cópia) |
| 4 | 1356 | = FEDERAL P6 (cópia) |
| 5 | 6115 | = FEDERAL P5 invertido (5116→6115) |
| 6 | 3594 | ⚠️ CORRUPTO + independente |
| 7 | 7539 | Independente (BAHIA próprio) |
| 8 | 2884 | Independente (BAHIA próprio) |
| 9 | 1629 | Independente (BAHIA próprio) |

> **Prêmios 1-4:** Cópias de FEDERAL P9,P8,P7,P6 (ordem reversa)
> **Prêmio 5:** FEDERAL P5 milhar invertido
> **Prêmios 6-9:** Independentes (sorteio próprio BAHIA)

---

### Resultados Completos (10 prêmios cada)

#### LT BAHIA 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1674 | G.19 | Pavão |
| 2 | 3563 | G.16 | Leão |
| 3 | 3673 | G.19 | Pavão |
| 4 | 1942 | G.11 | Cavalo |
| 5 | 2129 | G.08 | Camelo |
| 6 | 4765 | G.17 | Macaco |
| 7 | 5070 | G.18 | Porco |
| 8 | 0972 | G.18 | Porco |
| 9 | 1241 | G.11 | Cavalo |
| 10 | 1574 | G.19 | Pavão |

#### LT MALUCA/BA 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4332 | G.08 | Camelo |
| 2 | 7674 | G.19 | Pavão |
| 3 | 6569 | G.18 | Porco |
| 4 | 1331 | G.08 | Camelo |
| 5 | 9212 | G.03 | Burro |
| 6 | 5021 | G.06 | Cabra |
| 7 | 6774 | G.19 | Pavão |
| 8 | 7092 | G.23 | Urso |
| 9 | 4501 | G.01 | Avestruz |
| 10 | 4751 | G.13 | Galo |

#### LT BAHIA 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1261 | G.16 | Leão |
| 2 | 2274 | G.19 | Pavão |
| 3 | 2765 | G.17 | Macaco |
| 4 | 6465 | G.17 | Macaco |
| 5 | 3017 | G.05 | Cachorro |
| 6 | 0142 | G.11 | Cavalo |
| 7 | 5207 | G.02 | Águia |
| 8 | 0926 | G.07 | Carneiro |
| 9 | 0731 | G.08 | Camelo |
| 10 | 6782 | G.21 | Touro |

#### LT MALUCA/BA 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1455 | G.14 | Gato |
| 2 | 6766 | G.17 | Macaco |
| 3 | 2274 | G.19 | Pavão |
| 4 | 1226 | G.07 | Carneiro |
| 5 | 7103 | G.01 | Avestruz |
| 6 | ⚠️ INCOMPLETO (2761?) | G.?? | ?? |
| 7 | 4023 | G.06 | Cabra |
| 8 | 1297 | G.25 | Vaca |
| 9 | 0500 | G.25 | Vaca |
| 10 | 2876 | G.19 | Pavão |

> ⚠️ Prêmio 6 veio como "2761 - G.7:" colado com prêmio 7. Número provavelmente 2761.

#### LT BAHIA 15HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 5517 | G.05 | Cachorro |
| 2 | 7738 | G.10 | Coelho |
| 3 | 6518 | G.05 | Cachorro |
| 4 | 7195 | G.24 | Veado |
| 5 | 9250 | G.13 | Galo |
| 6 | 5799 | G.25 | Vaca |
| 7 | 3456 | G.14 | Gato |
| 8 | 5471 | G.18 | Porco |
| 9 | 4021 | G.06 | Cabra |
| 10 | 5483 | G.21 | Touro |

#### LT MALUCA/BA 15HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7885 | G.22 | Tigre |
| 2 | 1319 | G.05 | Cachorro |
| 3 | 5751 | G.13 | Galo |
| 4 | 5767 | G.17 | Macaco |
| 5 | 0529 | G.08 | Camelo |
| 6 | 9611 | G.03 | Burro |
| 7 | 9572 | G.18 | Porco |
| 8 | 7440 | G.10 | Coelho |
| 9 | 5354 | G.14 | Gato |
| 10 | 3845 | G.12 | Elefante |

#### LT BAHIA/FEDERAL 20HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1627 | G.07 | Carneiro |
| 2 | 3789 | G.23 | Urso |
| 3 | 5297 | G.25 | Vaca |
| 4 | 6903 | G.01 | Avestruz |
| 5 | 5116 | G.04 | Borboleta |
| 6 | 1273 | G.19 | Pavão |
| 7 | 6855 | G.14 | Gato |
| 8 | 2839 | G.10 | Coelho |
| 9 | 9494 | G.24 | Veado |
| 10 | 4066 | G.17 | Macaco |

#### LT MALUCA/BA FED. 20HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7973 | G.19 | Pavão |
| 2 | 2890 | G.23 | Urso |
| 3 | 6729 | G.08 | Camelo |
| 4 | 1356 | G.14 | Gato |
| 5 | 6115 | G.04 | Borboleta |
| 6 | ⚠️ CORRUPTO (~3594) | G.24 | Veado |
| 7 | 7539 | G.10 | Coelho |
| 8 | 2884 | G.21 | Touro |
| 9 | 1629 | G.08 | Camelo |
| 10 | 6604 | G.01 | Avestruz |

> ⚠️ Prêmio 6 veio como "3594 - G.24\n\ndo" - animal truncado (Veado).

#### LT BAHIA 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 9748 | G.12 | Elefante |
| 2 | 5710 | G.03 | Burro |
| 3 | 1589 | G.23 | Urso |
| 4 | 7728 | G.07 | Carneiro |
| 5 | 8273 | G.19 | Pavão |
| 6 | 8817 | G.05 | Cachorro |
| 7 | 0295 | G.24 | Veado |
| 8 | 7132 | G.08 | Camelo |
| 9 | 8868 | G.17 | Macaco |
| 10 | 2914 | G.04 | Borboleta |

#### LT MALUCA/BA 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 8098 | G.25 | Vaca |
| 2 | 4182 | G.21 | Touro |
| 3 | 7757 | G.15 | Jacaré |
| 4 | 9517 | G.05 | Cachorro |
| 5 | 3728 | G.07 | Carneiro |
| 6 | 7528 | G.07 | Carneiro |
| 7 | 1936 | G.09 | Cobra |
| 8 | 8218 | G.05 | Cachorro |
| 9 | 8078 | G.20 | Peru |
| 10 | 4192 | G.23 | Urso |

---

### Dados incompletos/corrompidos (BAHIA)
| Draw | Prêmio | Recebido | Observação |
|------|--------|----------|------------|
| MALUCA/BA 12HS | 6 | "2761 - G.7:" | Colado com prêmio 7, grupo incompleto |
| MALUCA/BA FED 20HS | 6 | "3594 - G.24\ndo" | Animal truncado (Veado) |

### Mapeamento subloteria_id → Resultado (BAHIA)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| ba_10 | BAHIA | 10:00 | GERAL | Scrape direto |
| ba_maluca_10 | BAHIA | 10:00 | MALUCA | **Scrape direto (SEPARADO!)** |
| ba_12 | BAHIA | 12:00 | GERAL | Scrape direto |
| ba_maluca_12 | BAHIA | 12:00 | MALUCA | **Scrape direto (SEPARADO!)** |
| ba_15 | BAHIA | 15:00 | GERAL | Scrape direto |
| ba_maluca_15 | BAHIA | 15:00 | MALUCA | **Scrape direto (SEPARADO!)** |
| ba_fed_20 | BAHIA | 20:00 | FEDERAL | P1-5 de FEDERAL, P6-10 próprios |
| ba_maluca_fed_20 | BAHIA | 20:00 | MALUCA | **Híbrido** (P1-4=FED P9-P6, P5=FED P5 inv., P6-9=próprios) |
| ba_21 | BAHIA | 21:00 | GERAL | Scrape direto |
| ba_maluca_21 | BAHIA | 21:00 | MALUCA | **Scrape direto (SEPARADO!)** |

> ⚠️ BAHIA é a **ÚNICA** loteria que precisa scrape MALUCA separado. Todas as outras derivam.

---

## LOTERIA LOTECE (Ceará)

Data dos resultados: **07/02/2026**

### Horários e Draws disponíveis

| Draw | Horário | Tem MALUCA? |
|------|---------|-------------|
| LT LOTECE 10HS | 10:00 | SIM |
| LT LOTECE 14HS | 14:00 | SIM |
| LT LOTECE 15H45 | 15:45 | SIM |
| LT LOTECE 19HS | 19:00 | SIM |

> **4 horários** (10, 14, 15:45, 19). Nota: 15H45 é horário quebrado!

### PADRÃO MALUCA LOTECE - NOVO PADRÃO! (diferente de RIO/NAC/LOOK/LOTEP)

LOTECE usa um padrão **mais simples**: **TODOS os prêmios 1-9 são milhar invertido**. NÃO tem a troca de ordem nos prêmios 6-9.

| Padrão | Prêmios 1-5 | Prêmios 6-9 |
|--------|-------------|-------------|
| **RIO/NAC/LOOK/LOTEP** | Milhar invertido | Cópia reversa (P9→M6, P8→M7...) |
| **LOTECE** | Milhar invertido | **Milhar invertido também** |
| **BAHIA** | Independente | Independente |

#### Prova (LOTECE 10HS) - TODOS invertidos:
| Pos | LOTECE | Invertido | MALUCA | Match? |
|-----|--------|-----------|--------|--------|
| 1 | 9910 | 0199 | 0199 | ✅ |
| 2 | 6557 | 7556 | 7556 | ✅ |
| 3 | 1113 | 3111 | 3111 | ✅ |
| 4 | 4939 | 9394 | 9394 | ✅ |
| 5 | 7681 | 1867 | 1867 | ✅ |
| **6** | **1962** | **2691** | **2691** | **✅ (invertido, NÃO cópia de P9!)** |
| **7** | **0279** | **9720** | **9720** | **✅** |
| **8** | **6033** | **3306** | **3306** | **✅** |
| **9** | **7114** | **4117** | **4117** | **✅** |

#### Prova (LOTECE 14HS):
| Pos | LOTECE | Invertido | MALUCA | Match? |
|-----|--------|-----------|--------|--------|
| 1 | 3178 | 8713 | 8713 | ✅ |
| 2 | 1618 | 8161 | 8161 | ✅ |
| 3 | 0019 | 9100 | 9100 | ✅ |
| 4 | 6278 | 8726 | 8726 | ✅ |
| 5 | 4486 | 6844 | 6844 | ✅ |
| 6 | 3153 | 3513 | 3513 | ✅ |
| 7 | 6056 | 6506 | 6506 | ✅ |
| 8 | 3863 | 3683 | 3683 | ✅ |
| 9 | 9888 | 8889 | 8889 | ✅ |

#### Prova (LOTECE 15H45):
| Pos | LOTECE | Invertido | MALUCA | Match? |
|-----|--------|-----------|--------|--------|
| 1 | 8654 | 4568 | 4568 | ✅ |
| 2 | 2865 | 5682 | 5682 | ✅ |
| 3 | 4163 | 3614 | 3614 | ✅ |
| 4 | 9266 | 6629 | 6629 | ✅ |
| 5 | 2065 | 5602 | 5602 | ✅ |
| 6 | 4341 | 1434 | 1434 | ✅ |
| 7 | 6477 | 7746 | 7746 | ✅ |
| 8 | 4227 | 7224 | 7224 | ✅ |
| 9 | 6401 | 1046 | 1046 | ✅ |

#### Prova (LOTECE 19HS):
| Pos | LOTECE | Invertido | MALUCA | Match? |
|-----|--------|-----------|--------|--------|
| 1 | 4420 | 0244 | 0244 | ✅ |
| 2 | 4835 | 5384 | 5384 | ✅ |
| 3 | 2910 | 0192 | 0192 | ✅ |
| 4 | 3687 | 7863 | 7863 | ✅ |
| 5 | 9211 | 1129 | 1129 | ✅ |
| 6 | 8262 | 2628 | 2628 | ✅ |
| 7 | 6135 | 5316 | 5316 | ✅ |
| 8 | 9153 | 3519 | 3519 | ✅ |
| 9 | 2345 | 5432 | 5432 | ✅ |

> Todos os 4 pares verificados - 100% match. TODOS os prêmios 1-9 são milhar invertido.

---

### Resultados Completos (10 prêmios cada)

#### LT LOTECE 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 9910 | G.03 | Burro |
| 2 | 6557 | G.15 | Jacaré |
| 3 | 1113 | G.04 | Borboleta |
| 4 | 4939 | G.10 | Coelho |
| 5 | 7681 | G.21 | Touro |
| 6 | 1962 | G.16 | Leão |
| 7 | 0279 | G.20 | Peru |
| 8 | 6033 | G.09 | Cobra |
| 9 | 7114 | G.04 | Borboleta |
| 10 | 7379 | G.20 | Peru |

#### LT MALUCA/LOTECE 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0199 | G.25 | Vaca |
| 2 | 7556 | G.14 | Gato |
| 3 | 3111 | G.03 | Burro |
| 4 | 9394 | G.24 | Veado |
| 5 | 1867 | G.17 | Macaco |
| 6 | 2691 | G.23 | Urso |
| 7 | 9720 | G.05 | Cachorro |
| 8 | 3306 | G.02 | Águia |
| 9 | 4117 | G.05 | Cachorro |
| 10 | 9737 | G.10 | Coelho |

#### LT LOTECE 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 3178 | G.20 | Peru |
| 2 | 1618 | G.05 | Cachorro |
| 3 | 0019 | G.05 | Cachorro |
| 4 | 6278 | G.20 | Peru |
| 5 | 4486 | G.22 | Tigre |
| 6 | 3153 | G.14 | Gato |
| 7 | 6056 | G.14 | Gato |
| 8 | 3863 | G.16 | Leão |
| 9 | 9888 | G.22 | Tigre |
| 10 | 9624 | G.06 | Cabra |

#### LT MALUCA/LOTECE 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 8713 | G.04 | Borboleta |
| 2 | 8161 | G.16 | Leão |
| 3 | 9100 | G.25 | Vaca |
| 4 | 8726 | G.07 | Carneiro |
| 5 | 6844 | G.11 | Cavalo |
| 6 | 3513 | G.04 | Borboleta |
| 7 | 6506 | G.02 | Águia |
| 8 | 3683 | G.21 | Touro |
| 9 | 8889 | G.23 | Urso |
| 10 | 4269 | G.18 | Porco |

> ⚠️ Prêmio 6 veio como "3513 -\n\nBorboleta" - faltou grupo "G.04".

#### LT LOTECE 15H45
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 8654 | G.14 | Gato |
| 2 | 2865 | G.17 | Macaco |
| 3 | 4163 | G.16 | Leão |
| 4 | 9266 | G.17 | Macaco |
| 5 | 2065 | G.17 | Macaco |
| 6 | 4341 | G.11 | Cavalo |
| 7 | 6477 | G.20 | Peru |
| 8 | 4227 | G.07 | Carneiro |
| 9 | 6401 | G.01 | Avestruz |
| 10 | 5446 | G.12 | Elefante |

#### LT MALUCA/LOTECE 15H45
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4568 | G.17 | Macaco |
| 2 | 5682 | G.21 | Touro |
| 3 | 3614 | G.04 | Borboleta |
| 4 | 6629 | G.08 | Camelo |
| 5 | 5602 | G.01 | Avestruz |
| 6 | 1434 | G.09 | Cobra |
| 7 | 7746 | G.12 | Elefante |
| 8 | 7224 | G.06 | Cabra |
| 9 | 1046 | G.12 | Elefante |
| 10 | 6445 | G.12 | Elefante |

#### LT LOTECE 19HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4420 | G.05 | Cachorro |
| 2 | 4835 | G.09 | Cobra |
| 3 | 2910 | G.03 | Burro |
| 4 | 3687 | G.22 | Tigre |
| 5 | 9211 | G.03 | Burro |
| 6 | 8262 | G.16 | Leão |
| 7 | 6135 | G.09 | Cobra |
| 8 | 9153 | G.14 | Gato |
| 9 | 2345 | G.12 | Elefante |
| 10 | 1972 | G.18 | Porco |

#### LT MALUCA/LOTECE 19HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0244 | G.11 | Cavalo |
| 2 | 5384 | G.21 | Touro |
| 3 | 0192 | G.23 | Urso |
| 4 | 7863 | G.16 | Leão |
| 5 | 1129 | G.08 | Camelo |
| 6 | 2628 | G.07 | Carneiro |
| 7 | 5316 | G.04 | Borboleta |
| 8 | 3519 | G.05 | Cachorro |
| 9 | 5432 | G.08 | Camelo |
| 10 | 2791 | G.23 | Urso |

> ⚠️ Prêmio 5 veio como "1129 - G.08\n\nCo" - animal truncado (Camelo).

---

### Dados incompletos/corrompidos (LOTECE)
| Draw | Prêmio | Recebido | Observação |
|------|--------|----------|------------|
| MALUCA/LOTECE 14HS | 6 | "3513 -\nBorboleta" | Faltou "G.04" |
| MALUCA/LOTECE 19HS | 5 | "1129 - G.08\nCo" | Animal truncado (Camelo) |

### Mapeamento subloteria_id → Resultado (LOTECE)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| ce_10 | LOTECE | 10:00 | GERAL | Scrape direto |
| ce_10_maluca | LOTECE | 10:00 | GERAL | Derivar (inversão total P1-9) |
| ce_14 | LOTECE | 14:00 | GERAL | Scrape direto |
| ce_14_maluca | LOTECE | 14:00 | GERAL | Derivar (inversão total P1-9) |
| ce_15h45 | LOTECE | 15:45 | GERAL | Scrape direto |
| ce_15h45_maluca | LOTECE | 15:45 | GERAL | Derivar (inversão total P1-9) |
| ce_19 | LOTECE | 19:00 | GERAL | Scrape direto |
| ce_19_maluca | LOTECE | 19:00 | GERAL | Derivar (inversão total P1-9) |

> ⚠️ LOTECE tem **4 horários** (10, 14, 15:45, 19). Horário 15:45 é quebrado!

---

## LOTERIA SÃO PAULO

Data dos resultados: **07/02/2026**

### Horários e Draws disponíveis

| Draw | Horário | Tipo | Tem MALUCA? |
|------|---------|------|-------------|
| PT SP 08HS | 08:00 | Paratodos SP | SIM |
| PT SP 10HS | 10:00 | Paratodos SP | SIM |
| PT SP 12HS | 12:00 | Paratodos SP | SIM |
| PT SP 13HS | 13:00 | Paratodos SP | SIM |
| LT BAND 15HS | 15:00 | Bandeirantes | SIM |
| PT SP 17HS | 17:00 | Paratodos SP | SIM |
| PT SP 18HS | 18:00 | Paratodos SP | SIM |
| PT SP 19HS | 19:00 | Paratodos SP | SIM |

> **8 draws** (08, 10, 12, 13, 15/BAND, 17, 18, 19). BANDEIRANTES é loteria separada no horário das 15HS.

### PADRÃO MALUCA CONFIRMADO (SP) - Padrão A

SP segue o **Padrão A** (inversão + reverso) - mesmo de RIO/NACIONAL/LOOK/LOTEP.
Verificado em **todos os 8 pares** incluindo BANDEIRANTES.

#### Prova (PT SP 08HS):
| Pos | SP | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 1321 | 1231 | 1231 | ✅ |
| 2 | 6966 | 6696 | 6696 | ✅ |
| 3 | 2001 | 1002 | 1002 | ✅ |
| 4 | 6859 | 9586 | 9586 | ✅ |
| 5 | 2606 | 6062 | 6062 | ✅ |
| 6 | P9=1619 | - | 1619 | ✅ |
| 7 | P8=2605 | - | 2605 | ✅ |
| 8 | P7=3908 | - | 3908 | ✅ |
| 9 | P6=1626 | - | 1626 | ✅ |

#### Prova (LT BAND 15HS - Bandeirantes):
| Pos | BAND | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 2498 | 8942 | 8942 | ✅ |
| 2 | 5354 | 4535 | 4535 | ✅ |
| 3 | 1057 | 7501 | 7501 | ✅ |
| 4 | 2103 | 3012 | 3012 | ✅ |
| 5 | 3109 | 9013 | 9013 | ✅ |
| 6 | P9=8473 | - | 8473 | ✅ |
| 7 | P8=9550 | - | 9550 | ✅ |
| 8 | P7=4301 | - | 4301 | ✅ |
| 9 | P6=2512 | - | 2512 | ✅ |

#### Prova (PT SP 18HS):
| Pos | SP | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 8116 | 6118 | 6118 | ✅ |
| 2 | 7575 | 5757 | 5757 | ✅ |
| 3 | 1710 | 0171 | 0171 | ✅ |
| 4 | 1571 | 1751 | 1751 | ✅ |
| 5 | 4595 | 5954 | 5954 | ✅ |
| 6 | P9=6501 | - | 6501 | ✅ |
| 7 | P8=1717 | - | 1717 | ✅ |
| 8 | P7=1575 | - | 1575 | ✅ |
| 9 | P6=8711 | - | 8711 | ✅ |

> Todos os 8 pares verificados. 100% match Padrão A.

---

### Resultados Completos (10 prêmios cada)

#### PT SP 08HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1321 | G.06 | Cabra |
| 2 | 6966 | G.17 | Macaco |
| 3 | 2001 | G.01 | Avestruz |
| 4 | 6859 | G.15 | Jacaré |
| 5 | 2606 | G.02 | Águia |
| 6 | 1626 | G.07 | Carneiro |
| 7 | 3908 | G.02 | Águia |
| 8 | 2605 | G.02 | Águia |
| 9 | 1619 | G.05 | Cachorro |
| 10 | 9511 | G.03 | Burro |

#### PT MALUCA/SP 08HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1231 | G.08 | Camelo |
| 2 | 6696 | G.24 | Veado |
| 3 | 1002 | G.01 | Avestruz |
| 4 | 9586 | G.22 | Tigre |
| 5 | 6062 | G.16 | Leão |
| 6 | 1619 | G.05 | Cachorro |
| 7 | 2605 | G.02 | Águia |
| 8 | 3908 | G.02 | Águia |
| 9 | 1626 | G.07 | Carneiro |
| 10 | 4335 | G.09 | Cobra |

#### PT SP 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4622 | G.06 | Cabra |
| 2 | 5783 | G.21 | Touro |
| 3 | 3657 | G.15 | Jacaré |
| 4 | 7795 | G.24 | Veado |
| 5 | 0146 | G.12 | Elefante |
| 6 | 4537 | G.10 | Coelho |
| 7 | 6767 | G.17 | Macaco |
| 8 | 2859 | G.15 | Jacaré |
| 9 | 2375 | G.19 | Pavão |
| 10 | 8541 | G.11 | Cavalo |

#### PT MALUCA/SP 10HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2264 | G.16 | Leão |
| 2 | 3875 | G.19 | Pavão |
| 3 | 7563 | G.16 | Leão |
| 4 | 5977 | G.20 | Peru |
| 5 | 6410 | G.03 | Burro |
| 6 | 2375 | G.19 | Pavão |
| 7 | 2859 | G.15 | Jacaré |
| 8 | 6767 | G.17 | Macaco |
| 9 | 4537 | G.10 | Coelho |
| 10 | 2627 | G.07 | Carneiro |

> ⚠️ Prêmios 6/7 vieram colados: "2375 - G: 2859 - G.15". Separados: P6=2375, P7=2859.

#### PT SP 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0820 | G.05 | Cachorro |
| 2 | 7267 | G.17 | Macaco |
| 3 | 7477 | G.20 | Peru |
| 4 | 6812 | G.03 | Burro |
| 5 | 4530 | G.08 | Camelo |
| 6 | 0776 | G.19 | Pavão |
| 7 | 8248 | G.12 | Elefante |
| 8 | 2671 | G.18 | Porco |
| 9 | 0772 | G.18 | Porco |
| 10 | 9373 | G.19 | Pavão |

#### PT MALUCA/SP 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0280 | G.20 | Peru |
| 2 | 7627 | G.07 | Carneiro |
| 3 | 7747 | G.12 | Elefante |
| 4 | 2186 | G.22 | Tigre |
| 5 | 0354 | G.14 | Gato |
| 6 | 0772 | G.18 | Porco |
| 7 | 2671 | G.18 | Porco |
| 8 | 8248 | G.12 | Elefante |
| 9 | 0776 | G.19 | Pavão |
| 10 | 0661 | G.16 | Leão |

#### PT SP 13HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4697 | G.25 | Vaca |
| 2 | 1550 | G.13 | Galo |
| 3 | 9332 | G.08 | Camelo |
| 4 | 4988 | G.22 | Tigre |
| 5 | 4071 | G.18 | Porco |
| 6 | 4194 | G.24 | Veado |
| 7 | 6539 | G.10 | Coelho |
| 8 | 9538 | G.10 | Coelho |
| 9 | 7028 | G.07 | Carneiro |
| 10 | 1937 | G.10 | Coelho |

#### PT MALUCA/SP 13HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7964 | G.16 | Leão |
| 2 | 0551 | G.13 | Galo |
| 3 | 2339 | G.10 | Coelho |
| 4 | 8894 | G.24 | Veado |
| 5 | 1704 | G.01 | Avestruz |
| 6 | 7028 | G.07 | Carneiro |
| 7 | 9538 | G.10 | Coelho |
| 8 | 6539 | G.10 | Coelho |
| 9 | 4194 | G.24 | Veado |
| 10 | 8751 | G.13 | Galo |

#### LT BAND 15HS (Bandeirantes)
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2498 | G.25 | Vaca |
| 2 | 5354 | G.14 | Gato |
| 3 | 1057 | G.15 | Jacaré |
| 4 | 2103 | G.01 | Avestruz |
| 5 | 3109 | G.03 | Burro |
| 6 | 2512 | G.03 | Burro |
| 7 | 4301 | G.01 | Avestruz |
| 8 | 9550 | G.13 | Galo |
| 9 | 8473 | G.19 | Pavão |
| 10 | 8957 | G.15 | Jacaré |

#### LT MALUCA/BAND 15HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 8942 | G.11 | Cavalo |
| 2 | 4535 | G.09 | Cobra |
| 3 | 7501 | G.01 | Avestruz |
| 4 | 3012 | G.03 | Burro |
| 5 | 9013 | G.04 | Borboleta |
| 6 | 8473 | G.19 | Pavão |
| 7 | 9550 | G.13 | Galo |
| 8 | 4301 | G.01 | Avestruz |
| 9 | 2512 | G.03 | Burro |
| 10 | 7839 | G.10 | Coelho |

#### PT SP 17HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7737 | G.10 | Coelho |
| 2 | 7442 | G.11 | Cavalo |
| 3 | 4266 | G.17 | Macaco |
| 4 | 2499 | G.25 | Vaca |
| 5 | 5576 | G.19 | Pavão |
| 6 | 7742 | G.11 | Cavalo |
| 7 | 7424 | G.06 | Cabra |
| 8 | 3469 | G.18 | Porco |
| 9 | 7269 | G.18 | Porco |
| 10 | 3424 | G.06 | Cabra |

#### PT MALUCA/SP 17HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7377 | G.20 | Peru |
| 2 | 2447 | G.12 | Elefante |
| 3 | 6624 | G.06 | Cabra |
| 4 | 9942 | G.11 | Cavalo |
| 5 | 6755 | G.14 | Gato |
| 6 | 7269 | G.18 | Porco |
| 7 | ⚠️ CORRUPTO (~3469) | G.18 | Porco |
| 8 | 7424 | G.06 | Cabra |
| 9 | 7742 | G.11 | Cavalo |
| 10 | 9049 | G.13 | Galo |

> ⚠️ Prêmio 7 veio como "346orco" - corrupto. Pelo padrão: P8=3469, G.18=Porco ✅.

#### PT SP 18HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 8116 | G.04 | Borboleta |
| 2 | 7575 | G.19 | Pavão |
| 3 | 1710 | G.03 | Burro |
| 4 | 1571 | G.18 | Porco |
| 5 | 4595 | G.24 | Veado |
| 6 | 8711 | G.03 | Burro |
| 7 | 1575 | G.19 | Pavão |
| 8 | 1717 | G.05 | Cachorro |
| 9 | 6501 | G.01 | Avestruz |
| 10 | 2071 | G.18 | Porco |

#### PT MALUCA/SP 18HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 6118 | G.05 | Cachorro |
| 2 | 5757 | G.15 | Jacaré |
| 3 | 0171 | G.18 | Porco |
| 4 | 1751 | G.13 | Galo |
| 5 | 5954 | G.14 | Gato |
| 6 | 6501 | G.01 | Avestruz |
| 7 | 1717 | G.05 | Cachorro |
| 8 | 1575 | G.19 | Pavão |
| 9 | 8711 | G.03 | Burro |
| 10 | 8255 | G.14 | Gato |

#### PT SP 19HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 8063 | G.16 | Leão |
| 2 | 6467 | G.17 | Macaco |
| 3 | 3425 | G.07 | Carneiro |
| 4 | 3750 | G.13 | Galo |
| 5 | 7839 | G.10 | Coelho |
| 6 | 8633 | G.09 | Cobra |
| 7 | 0447 | G.12 | Elefante |
| 8 | 6625 | G.07 | Carneiro |
| 9 | 3750 | G.13 | Galo |
| 10 | 8999 | G.25 | Vaca |

#### PT MALUCA/SP 19HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 3608 | G.02 | Águia |
| 2 | 7646 | G.12 | Elefante |
| 3 | 5243 | G.11 | Cavalo |
| 4 | 0573 | G.19 | Pavão |
| 5 | 9387 | G.22 | Tigre |
| 6 | 3750 | G.13 | Galo |
| 7 | 6625 | G.07 | Carneiro |
| 8 | 0447 | G.12 | Elefante |
| 9 | 8633 | G.09 | Cobra |
| 10 | 5912 | G.03 | Burro |

> ⚠️ Prêmio 7 veio como "6625 - G.07\n\nCar" - animal truncado (Carneiro).

---

### Dados incompletos/corrompidos (SP)
| Draw | Prêmio | Recebido | Valor correto (pelo padrão) |
|------|--------|----------|----------------------------|
| MALUCA/SP 10HS | 6-7 | "2375 - G: 2859 - G.15" | P6=2375, P7=2859 (colados) |
| MALUCA/SP 17HS | 7 | "346orco" | 3469 (P8) - Porco |
| MALUCA/SP 19HS | 7 | "6625 - G.07\nCar" | 6625 - Carneiro (truncado) |

### Mapeamento subloteria_id → Resultado (SP)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| sp_08 | SAO-PAULO | 08:00 | PT | Scrape direto |
| sp_08_maluca | SAO-PAULO | 08:00 | PT | Derivar de sp_08 (Padrão A) |
| sp_10 | SAO-PAULO | 10:00 | PT | Scrape direto |
| sp_10_maluca | SAO-PAULO | 10:00 | PT | Derivar de sp_10 (Padrão A) |
| sp_12 | SAO-PAULO | 12:00 | PT | Scrape direto |
| sp_12_maluca | SAO-PAULO | 12:00 | PT | Derivar de sp_12 (Padrão A) |
| sp_13 | SAO-PAULO | 13:00 | PT | Scrape direto |
| sp_13_maluca | SAO-PAULO | 13:00 | PT | Derivar de sp_13 (Padrão A) |
| sp_band_15 | SAO-PAULO | 15:00 | BANDEIRANTES | Scrape direto |
| sp_band_15_maluca | SAO-PAULO | 15:00 | BANDEIRANTES | Derivar de sp_band_15 (Padrão A) |
| sp_17 | SAO-PAULO | 17:00 | PT | Scrape direto |
| sp_17_maluca | SAO-PAULO | 17:00 | PT | Derivar de sp_17 (Padrão A) |
| sp_18 | SAO-PAULO | 18:00 | PT | Scrape direto |
| sp_18_maluca | SAO-PAULO | 18:00 | PT | Derivar de sp_18 (Padrão A) |
| sp_19 | SAO-PAULO | 19:00 | PT | Scrape direto |
| sp_19_maluca | SAO-PAULO | 19:00 | PT | Derivar de sp_19 (Padrão A) |

> ⚠️ SP tem **8 draws** (08, 10, 12, 13, 15/BAND, 17, 18, 19). BANDEIRANTES é loteria separada mas mesmo Padrão A.

---

## LOTERIA SORTE (Rio Grande do Sul)

Data dos resultados: **07/02/2026**

### Horários e Draws disponíveis

| Draw | Horário | Tem MALUCA? |
|------|---------|-------------|
| LT SORTE 14HS | 14:00 | SIM |

> **1 horário** neste dia (14). MEMORY menciona horários expandidos (11, 16, 18, 21) que podem não ter resultado todos os dias.

### PADRÃO MALUCA CONFIRMADO (SORTE) - Padrão A

#### Prova (SORTE 14HS):
| Pos | SORTE | Invertido | MALUCA | Match? |
|-----|-------|-----------|--------|--------|
| 1 | 0323 | 3230 | 3230 | ✅ |
| 2 | 3556 | 6553 | 6553 | ✅ |
| 3 | 0924 | 4290 | 4290 | ✅ |
| 4 | 6112 | 2116 | 2116 | ✅ |
| 5 | 2960 | 0692 | 0692 | ✅ |
| 6 | P9=3642 | - | 3642 | ✅ |
| 7 | P8=2521 | - | 2521 | ✅ |
| 8 | P7=3591 | - | 3591 | ✅ |
| 9 | P6=0306 | - | 0306 | ✅ |

---

### Resultados Completos

#### LT SORTE 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0323 | G.06 | Cabra |
| 2 | 3556 | G.14 | Gato |
| 3 | 0924 | G.06 | Cabra |
| 4 | 6112 | G.03 | Burro |
| 5 | 2960 | G.15 | Jacaré |
| 6 | 0306 | G.02 | Águia |
| 7 | 3591 | G.23 | Urso |
| 8 | 2521 | G.06 | Cabra |
| 9 | 3642 | G.11 | Cavalo |
| 10 | 3935 | G.09 | Cobra |

#### LT MALUCA/SORTE 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 3230 | G.08 | Camelo |
| 2 | 6553 | G.14 | Gato |
| 3 | 4290 | G.23 | Urso |
| 4 | 2116 | G.04 | Borboleta |
| 5 | 0692 | G.23 | Urso |
| 6 | 3642 | G.11 | Cavalo |
| 7 | 2521 | G.06 | Cabra |
| 8 | 3591 | G.23 | Urso |
| 9 | 0306 | G.02 | Águia |
| 10 | 6941 | G.11 | Cavalo |

### Mapeamento subloteria_id → Resultado (SORTE/RS)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| rs_14 | SORTE/RS | 14:00 | SORTE | Scrape direto |
| rs_14_maluca | SORTE/RS | 14:00 | SORTE | Derivar de rs_14 (Padrão A) |

> ⚠️ Apenas 1 horário neste dia. Verificar se horários 11, 16, 18, 21 aparecem em outros dias.

---

## LOTERIA MINAS GERAIS

Data dos resultados: **07/02/2026**

### Horários e Draws disponíveis

| Draw | Horário | Tipo | Tem MALUCA? |
|------|---------|------|-------------|
| LT MINAS ALVORADA 12HS | 12:00 | Alvorada | SIM |
| LT MINAS DIA 15HS | 15:00 | Minas Dia | SIM |

> **2 draws** com nomes de loteria diferentes: "ALVORADA" (12HS) e "MINAS DIA" (15HS).

### PADRÃO MALUCA CONFIRMADO (MG) - Padrão A

#### Prova (MINAS ALVORADA 12HS):
| Pos | MG | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 9528 | 8259 | 8259 | ✅ |
| 2 | 4743 | 3474 | 3474 | ✅ |
| 3 | 5306 | 6035 | 6035 | ✅ |
| 4 | 3809 | 9083 | 9083 | ✅ |
| 5 | 9222 | 2229 | 2229 | ✅ |
| 6 | P9=8369 | - | 8369 | ✅ |
| 7 | P8=2400 | - | 2400 | ✅ |
| 8 | P7=5738 | - | 5738 | ✅ |
| 9 | P6=9453 | - | 9453 | ✅ |

#### Prova (MINAS DIA 15HS):
| Pos | MG | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 6066 | 6606 | 6606 | ✅ |
| 2 | 2049 | 9402 | 9402 | ✅ |
| 3 | 5795 | 5975 | 5975 | ✅ |
| 4 | 9527 | 7259 | 7259 | ✅ |
| 5 | 4533 | 3354 | 3354 | ✅ |
| 6 | P9=6957 | - | ⚠️ CORRUPTO (~6957) | ✅* |
| 7 | P8=6492 | - | 6492 | ✅ |
| 8 | P7=0075 | - | 0075 | ✅ |
| 9 | P6=6259 | - | 6259 | ✅ |

> *Prêmio 5/6 vieram colados: "3354 - G.14 Ga57 - G.15 Jacaré". Prêmio 6 = 6957 (P9), "57" são os últimos dígitos visíveis.

---

### Resultados Completos

#### LT MINAS ALVORADA 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 9528 | G.07 | Carneiro |
| 2 | 4743 | G.11 | Cavalo |
| 3 | 5306 | G.02 | Águia |
| 4 | 3809 | G.03 | Burro |
| 5 | 9222 | G.06 | Cabra |
| 6 | 9453 | G.14 | Gato |
| 7 | 5738 | G.10 | Coelho |
| 8 | 2400 | G.25 | Vaca |
| 9 | 8369 | G.18 | Porco |
| 10 | 8568 | G.17 | Macaco |

#### LT MALUCA/ALVORADA 12HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 8259 | G.15 | Jacaré |
| 2 | 3474 | G.19 | Pavão |
| 3 | 6035 | G.09 | Cobra |
| 4 | 9083 | G.21 | Touro |
| 5 | 2229 | G.08 | Camelo |
| 6 | 8369 | G.18 | Porco |
| 7 | 2400 | G.25 | Vaca |
| 8 | 5738 | G.10 | Coelho |
| 9 | 9453 | G.14 | Gato |
| 10 | 5040 | G.10 | Coelho |

#### LT MINAS DIA 15HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 6066 | G.17 | Macaco |
| 2 | 2049 | G.13 | Galo |
| 3 | 5795 | G.24 | Veado |
| 4 | 9527 | G.07 | Carneiro |
| 5 | 4533 | G.09 | Cobra |
| 6 | 6259 | G.15 | Jacaré |
| 7 | 0075 | G.19 | Pavão |
| 8 | 6492 | G.23 | Urso |
| 9 | 6957 | G.15 | Jacaré |
| 10 | 7753 | G.14 | Gato |

#### LT MALUCA/MINAS DIA 15HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 6606 | G.02 | Águia |
| 2 | 9402 | G.01 | Avestruz |
| 3 | 5975 | G.19 | Pavão |
| 4 | 7259 | G.15 | Jacaré |
| 5 | 3354 | G.14 | Gato |
| 6 | ⚠️ CORRUPTO (~6957) | G.15 | Jacaré |
| 7 | 6492 | G.23 | Urso |
| 8 | 0075 | G.19 | Pavão |
| 9 | 6259 | G.15 | Jacaré |
| 10 | 2379 | G.20 | Peru |

> ⚠️ Prêmios 5/6 colados: "3354 - G.14 Ga57 - G.15 Jacaré". Prêmio 6 deveria ser 6957 (P9).

---

### Dados incompletos/corrompidos (MG)
| Draw | Prêmio | Recebido | Valor correto (pelo padrão) |
|------|--------|----------|----------------------------|
| MALUCA/MINAS DIA 15HS | 6 | "Ga57 - G.15" | 6957 (P9) - colado com prêmio 5 |

### Mapeamento subloteria_id → Resultado (MG)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| mg_alv_12 | MINAS | 12:00 | ALVORADA | Scrape direto |
| mg_alv_12_maluca | MINAS | 12:00 | ALVORADA | Derivar (Padrão A) |
| mg_dia_15 | MINAS | 15:00 | MINAS DIA | Scrape direto |
| mg_dia_15_maluca | MINAS | 15:00 | MINAS DIA | Derivar (Padrão A) |

> ⚠️ MG tem **2 draws** com nomes distintos: ALVORADA (12HS) e MINAS DIA (15HS).

---

## SORTEIO SENA (Seninha)

Data dos resultados: **07/02/2026**

### Formato DIFERENTE - 6 dezenas (NÃO é jogo do bicho padrão!)

```
SORTEIO SENA: 32 - 42 - 59 - 41 - 22 - 37
```

| Dezena | Grupo | Animal |
|--------|-------|--------|
| 32 | G.08 | Camelo |
| 42 | G.11 | Cavalo |
| 59 | G.15 | Jacaré |
| 41 | G.11 | Cavalo |
| 22 | G.06 | Cabra |
| 37 | G.10 | Coelho |

### Análise Crítica - Contradição com MEMORY

O MEMORY dizia:
> "LOTINHA/QUININHA/SENINHA - NO separate scraping needed - uses existing results from all lotteries"
> "Verification handled in `verificar_premios_v2()` via `is_lotinha_quininha_seninha` check"

**MAS** este resultado mostra que SENINHA tem um **SORTEIO PRÓPRIO** com 6 dezenas dedicadas, NÃO derivadas dos resultados do bicho.

### Implicações para o Scraper

1. **SENINHA TEM draw próprio** - precisa ser scrapeado separadamente
2. Formato: 6 dezenas (números de 01-60 ou 01-99?)
3. **Sem MALUCA** para Seninha
4. **Sem horário específico** mostrado (draw único diário?)
5. **Precisa investigar:** Lotinha e Quininha também têm draws próprios ou usam os resultados do bicho?

> ⚠️ **TODO:** Verificar se o scraper atual captura o SORTEIO SENA. Se não, precisa adicionar.

---

## LOTO FÁCIL (Lotinha)

Data dos resultados: **07/02/2026**

### Formato DIFERENTE - 15 dezenas (estilo Lotofácil)

```
LOTO FACIL: 02 - 05 - 06 - 08 - 09 - 11 - 14 - 16 - 17 - 18 - 19 - 20 - 22 - 23 - 25
```

(Ordenadas: 02, 05, 06, 08, 09, 11, 14, 16, 17, 18, 19, 20, 22, 23, 25)

> **Range: 01-25** (maior número = 25, similar à Lotofácil da Caixa)

| # | Dezena | Grupo | Animal |
|---|--------|-------|--------|
| 1 | 02 | G.01 | Avestruz |
| 2 | 05 | G.02 | Águia |
| 3 | 06 | G.02 | Águia |
| 4 | 08 | G.02 | Águia |
| 5 | 09 | G.03 | Burro |
| 6 | 11 | G.03 | Burro |
| 7 | 14 | G.04 | Borboleta |
| 8 | 16 | G.04 | Borboleta |
| 9 | 17 | G.05 | Cachorro |
| 10 | 18 | G.05 | Cachorro |
| 11 | 19 | G.05 | Cachorro |
| 12 | 20 | G.05 | Cachorro |
| 13 | 22 | G.06 | Cabra |
| 14 | 23 | G.06 | Cabra |
| 15 | 25 | G.07 | Carneiro |

### Análise - Também contradiz o MEMORY

Assim como Seninha, Lotinha tem **draw próprio dedicado**. Não usa resultados do bicho.

- **15 dezenas** de um range de 01-25
- Formato idêntico à Lotofácil da Caixa
- **Sem MALUCA**, **sem horário específico** (draw único diário)
- Player precisa acertar N dezenas para ganhar

---

## SORTEIO QUINA (Quininha)

Data dos resultados: **07/02/2026**

### Formato DIFERENTE - 5 dezenas (estilo Quina)

```
SORTEIO QUINA: 03 - 21 - 32 - 46 - 57
```

(Ordenadas: 03, 21, 32, 46, 57)

> **Range: 01-80?** (maior número = 57, similar à Quina da Caixa que usa 01-80)

- **5 dezenas** sorteadas
- **Sem MALUCA**, **sem horário específico** (draw único diário)
- Player precisa acertar N dezenas para ganhar

---

## Resumo: Lotinha / Quininha / Seninha

**TODOS têm draws próprios dedicados.** O MEMORY estava ERRADO ao dizer "NO separate scraping needed".

| Jogo | Nome do draw | Qtd números | Range provável | Formato Caixa equivalente |
|------|-------------|-------------|----------------|--------------------------|
| **Lotinha** | LOTO FACIL | 15 dezenas | 01-25 | Lotofácil |
| **Quininha** | SORTEIO QUINA | 5 dezenas | 01-80 | Quina |
| **Seninha** | SORTEIO SENA | 6 dezenas | 01-60 | Mega-Sena |

### Implicações para o Scraper

1. **TODOS precisam scraping separado** - não usam resultados do bicho
2. **Nenhum tem MALUCA**
3. **Draw único diário** (sem horários múltiplos)
4. **Verificação diferente:** Player escolhe N dezenas, precisa acertar X delas
5. **TODO:** Verificar se o scraper atual captura esses draws. Se a verificação em `verificar_premios_v2()` usa resultados do bicho para esses jogos, está ERRADA

> ⚠️ **CRÍTICO:** A lógica de verificação em `verificar_premios_v2()` para Lotinha/Quininha/Seninha provavelmente precisa ser reescrita para usar os draws dedicados em vez dos resultados do bicho.

---

## LOTERIA BOASORTE (Goiás)

Data dos resultados: **07/02/2026**

### Horários e Draws disponíveis

| Draw | Horário | Tem MALUCA? |
|------|---------|-------------|
| LT BOASORTE 09HS | 09:00 | SIM |
| LT BOASORTE 11HS | 11:00 | SIM |
| LT BOASORTE 14HS | 14:00 | SIM |
| LT BOASORTE 16HS | 16:00 | SIM |
| LT BOASORTE 18HS | 18:00 | SIM |
| LT BOASORTE 21HS | 21:00 | SIM |

> **6 horários** (09, 11, 14, 16, 18, 21)

### PADRÃO MALUCA CONFIRMADO (BOASORTE) - Padrão A

Verificado em todos os 6 pares:

#### Prova (BOASORTE 09HS):
| Pos | BS | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 5849 | 9485 | 9485 | ✅ |
| 2 | 7911 | 1197 | 1197 | ✅ |
| 3 | 4666 | 6664 | 6664 | ✅ |
| 4 | 2296 | 6922 | 6922 | ✅ |
| 5 | 0069 | 9600 | 9600 | ✅ |
| 6 | P9=9166 | - | 9166 | ✅ |
| 7 | P8=4169 | - | 4169 | ✅ |
| 8 | P7=8962 | - | 8962 | ✅ |
| 9 | P6=5742 | - | 5742 | ✅ |

#### Prova (BOASORTE 14HS):
| Pos | BS | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 6470 | 0746 | 0746 | ✅ |
| 2 | 7157 | 7517 | 7517 | ✅ |
| 3 | 3719 | 9173 | 9173 | ✅ |
| 4 | 6953 | 3596 | 3596 | ✅ |
| 5 | 4644 | 4464 | 4464 | ✅ |
| 6 | P9=0793 | - | 0793 | ✅ |
| 7 | P8=7515 | - | 7515 | ✅ |
| 8 | P7=4179 | - | 4179 | ✅ |
| 9 | P6=6736 | - | 6736 | ✅ |

#### Prova (BOASORTE 21HS):
| Pos | BS | Invertido | MALUCA | Match? |
|-----|------|-----------|--------|--------|
| 1 | 7048 | 8407 | 8407 | ✅ |
| 2 | 2138 | 8312 | 8312 | ✅ |
| 3 | 7007 | 7007 | 7007 | ✅ (palíndromo) |
| 4 | 1779 | 9771 | 9771 | ✅ |
| 5 | 8242 | 2428 | ⚠️ CORRUPTO (~2428) | ✅* |
| 6 | P9=8879 | - | 8879 | ✅ |
| 7 | P8=4307 | - | 4307 | ✅ |
| 8 | P7=0107 | - | 0107 | ✅ |
| 9 | P6=7271 | - | 7271 | ✅ |

> *Prêmio 4/5 vieram colados: "9771 - G.18 Por428 - G.07 Carneiro". Prêmio 5 = 2428 (8242 invertido), G.07 ✅.

---

### Resultados Completos (10 prêmios cada)

#### LT BOASORTE 09HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 5849 | G.13 | Galo |
| 2 | 7911 | G.03 | Burro |
| 3 | 4666 | G.17 | Macaco |
| 4 | 2296 | G.24 | Veado |
| 5 | 0069 | G.18 | Porco |
| 6 | 5742 | G.11 | Cavalo |
| 7 | 8962 | G.16 | Leão |
| 8 | 4169 | G.18 | Porco |
| 9 | 9166 | G.17 | Macaco |
| 10 | 8830 | G.08 | Camelo |

#### LT MALUCA/BOASORTE 09HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 9485 | G.22 | Tigre |
| 2 | 1197 | G.25 | Vaca |
| 3 | 6664 | G.16 | Leão |
| 4 | 6922 | G.06 | Cabra |
| 5 | 9600 | G.25 | Vaca |
| 6 | 9166 | G.17 | Macaco |
| 7 | 4169 | G.18 | Porco |
| 8 | 8962 | G.16 | Leão |
| 9 | 5742 | G.11 | Cavalo |
| 10 | 1907 | G.02 | Águia |

#### LT BOASORTE 11HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 1770 | G.18 | Porco |
| 2 | 0922 | G.06 | Cabra |
| 3 | 8344 | G.11 | Cavalo |
| 4 | 1074 | G.19 | Pavão |
| 5 | 1558 | G.15 | Jacaré |
| 6 | 1081 | G.21 | Touro |
| 7 | 7930 | G.08 | Camelo |
| 8 | 7247 | G.12 | Elefante |
| 9 | 0244 | G.11 | Cavalo |
| 10 | 0170 | G.18 | Porco |

#### LT MALUCA/BOASORTE 11HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0771 | G.18 | Porco |
| 2 | 2290 | G.23 | Urso |
| 3 | 4438 | G.10 | Coelho |
| 4 | 4701 | G.01 | Avestruz |
| 5 | 8551 | G.13 | Galo |
| 6 | 0244 | G.11 | Cavalo |
| 7 | 7247 | G.12 | Elefante |
| 8 | 7930 | G.08 | Camelo |
| 9 | 1081 | G.21 | Touro |
| 10 | 7253 | G.14 | Gato |

> ⚠️ Prêmio 6 veio como "0244 - Cavalo" - faltou grupo "G.11".

#### LT BOASORTE 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 6470 | G.18 | Porco |
| 2 | 7157 | G.15 | Jacaré |
| 3 | 3719 | G.05 | Cachorro |
| 4 | 6953 | G.14 | Gato |
| 5 | 4644 | G.11 | Cavalo |
| 6 | 6736 | G.09 | Cobra |
| 7 | 4179 | G.20 | Peru |
| 8 | 7515 | G.04 | Borboleta |
| 9 | 0793 | G.24 | Veado |
| 10 | 8166 | G.17 | Macaco |

#### LT MALUCA/BOASORTE 14HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 0746 | G.12 | Elefante |
| 2 | 7517 | G.05 | Cachorro |
| 3 | 9173 | G.19 | Pavão |
| 4 | 3596 | G.24 | Veado |
| 5 | 4464 | G.16 | Leão |
| 6 | 0793 | G.24 | Veado |
| 7 | 7515 | G.04 | Borboleta |
| 8 | 4179 | G.20 | Peru |
| 9 | 6736 | G.09 | Cobra |
| 10 | 4719 | G.05 | Cachorro |

#### LT BOASORTE 16HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 5492 | G.23 | Urso |
| 2 | 8321 | G.06 | Cabra |
| 3 | 3324 | G.06 | Cabra |
| 4 | 2814 | G.04 | Borboleta |
| 5 | 9417 | G.05 | Cachorro |
| 6 | 5832 | G.08 | Camelo |
| 7 | 4338 | G.10 | Coelho |
| 8 | 9221 | G.06 | Cabra |
| 9 | 2144 | G.11 | Cavalo |
| 10 | 0903 | G.01 | Avestruz |

#### LT MALUCA/BOASORTE 16HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 2945 | G.12 | Elefante |
| 2 | 1238 | G.10 | Coelho |
| 3 | 4233 | G.09 | Cobra |
| 4 | 4182 | G.21 | Touro |
| 5 | 7149 | G.13 | Galo |
| 6 | 2144 | G.11 | Cavalo |
| 7 | 9221 | G.06 | Cabra |
| 8 | 4338 | G.10 | Coelho |
| 9 | 5832 | G.08 | Camelo |
| 10 | 1282 | G.21 | Touro |

> ⚠️ Prêmio 5 veio como "7149 -13 Galo" - faltou "G." no grupo.

#### LT BOASORTE 18HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 4817 | G.05 | Cachorro |
| 2 | 3381 | G.21 | Touro |
| 3 | 2761 | G.16 | Leão |
| 4 | 2553 | G.14 | Gato |
| 5 | 3051 | G.13 | Galo |
| 6 | 4322 | G.06 | Cabra |
| 7 | 8375 | G.19 | Pavão |
| 8 | 1865 | G.17 | Macaco |
| 9 | 7113 | G.04 | Borboleta |
| 10 | 8238 | G.10 | Coelho |

#### LT MALUCA/BOASORTE 18HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7184 | G.21 | Touro |
| 2 | 1833 | G.09 | Cobra |
| 3 | 1672 | G.18 | Porco |
| 4 | 3552 | G.13 | Galo |
| 5 | 1503 | G.01 | Avestruz |
| 6 | 7113 | G.04 | Borboleta |
| 7 | 1865 | G.17 | Macaco |
| 8 | 8375 | G.19 | Pavão |
| 9 | 4322 | G.06 | Cabra |
| 10 | 7419 | G.05 | Cachorro |

#### LT BOASORTE 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 7048 | G.12 | Elefante |
| 2 | 2138 | G.10 | Coelho |
| 3 | 7007 | G.02 | Águia |
| 4 | 1779 | G.20 | Peru |
| 5 | 8242 | G.11 | Cavalo |
| 6 | 7271 | G.18 | Porco |
| 7 | 0107 | G.02 | Águia |
| 8 | 4307 | G.02 | Águia |
| 9 | 8879 | G.20 | Peru |
| 10 | 6778 | G.20 | Peru |

#### LT MALUCA/BOASORTE 21HS
| Pos | Milhar | Grupo | Animal |
|-----|--------|-------|--------|
| 1 | 8407 | G.02 | Águia |
| 2 | 8312 | G.03 | Burro |
| 3 | 7007 | G.02 | Águia |
| 4 | 9771 | G.18 | Porco |
| 5 | ⚠️ CORRUPTO (~2428) | G.07 | Carneiro |
| 6 | 8879 | G.20 | Peru |
| 7 | 4307 | G.02 | Águia |
| 8 | 0107 | G.02 | Águia |
| 9 | 7271 | G.18 | Porco |
| 10 | 6489 | G.23 | Urso |

> ⚠️ Prêmios 4/5 colados: "9771 - G.18 Por428 - G.07 Carneiro". Prêmio 5 = 2428 (8242 inv.), G.07 ✅.

---

### Dados incompletos/corrompidos (BOASORTE)
| Draw | Prêmio | Recebido | Valor correto (pelo padrão) |
|------|--------|----------|----------------------------|
| MALUCA/BS 11HS | 6 | "0244 - Cavalo" | 0244 (P9) - faltou "G.11" |
| MALUCA/BS 16HS | 5 | "7149 -13 Galo" | 7149 - faltou "G." |
| MALUCA/BS 21HS | 5 | "Por428 - G.07" | 2428 (8242 inv.) - colado com P4 |

### Mapeamento subloteria_id → Resultado (BOASORTE)

| subloteria_id | banca | horario | loteria | Fonte resultado |
|---------------|-------|---------|---------|-----------------|
| bs_09 | BOASORTE | 09:00 | BOASORTE | Scrape direto |
| bs_09_maluca | BOASORTE | 09:00 | BOASORTE | Derivar (Padrão A) |
| bs_11 | BOASORTE | 11:00 | BOASORTE | Scrape direto |
| bs_11_maluca | BOASORTE | 11:00 | BOASORTE | Derivar (Padrão A) |
| bs_14 | BOASORTE | 14:00 | BOASORTE | Scrape direto |
| bs_14_maluca | BOASORTE | 14:00 | BOASORTE | Derivar (Padrão A) |
| bs_16 | BOASORTE | 16:00 | BOASORTE | Scrape direto |
| bs_16_maluca | BOASORTE | 16:00 | BOASORTE | Derivar (Padrão A) |
| bs_18 | BOASORTE | 18:00 | BOASORTE | Scrape direto |
| bs_18_maluca | BOASORTE | 18:00 | BOASORTE | Derivar (Padrão A) |
| bs_21 | BOASORTE | 21:00 | BOASORTE | Scrape direto |
| bs_21_maluca | BOASORTE | 21:00 | BOASORTE | Derivar (Padrão A) |

> ⚠️ BOASORTE tem **6 horários** (09, 11, 14, 16, 18, 21).
