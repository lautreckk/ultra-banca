# Prompt para análise das modificações (Claude Code)

Use o texto abaixo como prompt ao enviar para o Claude Code para que ele analise todas as modificações feitas no projeto Ultra Banca (scraper, premiação, multi-tenant e segurança).

---

## Prompt (copie e envie ao Claude Code)

```
Analise todas as modificações recentes feitas no projeto Ultra Banca, focando em:

1. **Segurança e premiação (Postgres)**
   - Arquivo: `supabase/migrations/20240203000000_fn_process_payout.sql` — RPC que processa payout de forma atômica (verifica status pendente, atualiza aposta para ganhou, incrementa saldo com SET saldo = saldo + amount, insere em transactions). Confira se está alinhada com o uso no Python.
   - Arquivo: `supabase/migrations/20240203200000_fn_mark_bets_lost.sql` — RPC para marcar apostas como 'perdeu' em lote (recebe array de UUIDs). Verifique se o Python chama corretamente.

2. **Scraper Modal (`modal_scraper_v2.py`)**
   - Função `verificar_premios_v2`:
     - Correção do loop: antes havia paginação que reprocessava as mesmas apostas; agora busca todas as pendentes do dia (limite 50k) em uma query e processa em memória. Revise se não há regressões ou edge cases.
     - Log de conferência: "Comparando Aposta [ID] - Loteria na aposta: ... | Resultado no scraper: key=... | Existe: sim/nao". Confira se ajuda a debugar mismatch de nomes de loteria.
     - Tratamento de "perdeu": IDs acumulados em lista e enviados à RPC `fn_mark_bets_lost` no fim; fallback para update um a um em caso de erro. Verifique consistência.
     - Multi-tenant: consulta inclui platform_id; multiplicador por banca via `get_multiplicador_platform` (aposta → modalidades_config → dynamic_odds). Valide a ordem de fallback.
     - Modalidade MILHAR_CT tratada como centena; posição 1_10_premio mapeada para premio_1 a premio_7; suporte a palpites múltiplos (lista ou único). Confira lógica de centena (últimos 3 dígitos) e se cobre o caso 8070 vs 6070 (4º prêmio).
     - Alias ln_10 → BAHIA 10:00 em LOTERIA_TO_BANCA. Verifique se há outros aliases necessários.
   - Sistema de alerta: função `_enviar_alerta_scraper` e try/except em verificar_premios_v2 (conexão, busca resultados, processamento) com webhook opcional (SCRAPER_ALERT_WEBHOOK_URL / ADMIN_ALERT_WEBHOOK_URL). Revise se todos os erros críticos são notificados.
   - O Python NÃO atualiza mais saldo diretamente; usa apenas a RPC `fn_process_payout` para ganhadores. Confirme que não há update em profiles ou apostas fora da RPC para o fluxo de premiação.

3. **Índices e performance**
   - Arquivo: `supabase/migrations/20240203100000_idx_apostas_verificacao.sql` — índices em apostas (data_jogo, status) e (data_jogo, status, platform_id). Verifique se as queries do scraper se beneficiam.

4. **Deploy e operação**
   - `.cursor/rules/modal-deploy.mdc` — regra para deploy do Modal pelo chat.
   - `docs/MODAL_CHAT_DEPLOY.md` — instruções para o usuário (pip install modal, modal setup, pedir deploy no chat).

Faça uma análise crítica: identifique possíveis bugs, regressões, melhorias de segurança ou performance, e inconsistências entre migrations e código Python. Liste os arquivos e trechos relevantes que você analisou.
```

---

## Arquivos principais a considerar

| Caminho | Descrição |
|--------|-----------|
| `ultra-banca/modal_scraper_v2.py` | Scraper Modal; `verificar_premios_v2`, `_enviar_alerta_scraper`, LOTERIA_TO_BANCA, CLI comando `verificar` |
| `ultra-banca/supabase/migrations/20240203000000_fn_process_payout.sql` | RPC payout atômico |
| `ultra-banca/supabase/migrations/20240203100000_idx_apostas_verificacao.sql` | Índices apostas |
| `ultra-banca/supabase/migrations/20240203200000_fn_mark_bets_lost.sql` | RPC marcar perdeu em lote |
| `ultra-banca/.cursor/rules/modal-deploy.mdc` | Regra deploy Modal no chat |
| `ultra-banca/docs/MODAL_CHAT_DEPLOY.md` | Doc deploy Modal |

---

*Gerado para uso com Claude Code na análise das modificações de premiação, multi-tenant e scraper.*
