# Plano de Correção de Vulnerabilidades — Ultra-Banca

> Gerado em: 2026-02-19
> Atualizado em: 2026-02-19
> Total de itens: 22
> Classificação: 8 P0 (Bloqueadores) | 5 P1 (Críticas) | 5 P2 (Importantes) | 4 P3 (Hardening)

---

## ARQUITETURA SEGURA OBRIGATORIA PARA SALDO

Antes de qualquer correção individual, o modelo de segurança financeira do sistema precisa seguir este fluxo:

```
Cliente (browser)
    |
    v
API segura (Server Action / Edge Function)
    |-- valida JWT (auth.uid())
    |-- valida permissões (RLS / admin_roles)
    |
    v
Função SQL (SECURITY DEFINER)
    |-- SELECT ... FOR UPDATE (lock de linha)
    |-- UPDATE saldo (operação atômica)
    |-- INSERT INTO ledger (registro imutável)
    |
    v
Retorno ao cliente
```

**Regra absoluta:** O cliente NUNCA deve poder fazer UPDATE direto em colunas de saldo. Todo movimento financeiro passa por função SQL transacional com lock.

---

## P0 — BLOQUEADORES DE OPERACAO (corrigir ANTES de operar com dinheiro real)

---

### 1. Bloquear edição direta de saldo (IDOR financeiro)

**Problema:** A tabela `profiles` contém as colunas `saldo`, `saldo_bonus`, `saldo_cassino` e `saldo_bonus_cassino`. Se a RLS policy de UPDATE não bloquear explicitamente essas colunas, um usuário autenticado pode enviar um PATCH direto via Supabase client e alterar seu próprio saldo para qualquer valor.

**Arquivos relacionados no código:**
- `lib/supabase/client.ts` — cliente browser com anon key
- `lib/admin/actions/users.ts:349` — já usa `createAdminClient()` para bypass do trigger
- Existe trigger `prevent_balance_tampering` mas ele é bypassado pelo service_role

**Correção em 2 partes:**

#### 1.1 — RLS: Impedir UPDATE de saldo pelo cliente

```sql
-- Remover policy atual de update (se existir)
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_profiles" ON profiles;

-- Nova policy: usuário pode atualizar SEU perfil, MAS saldo permanece inalterado
-- Nota: PostgreSQL RLS não suporta referenciar OLD diretamente no WITH CHECK.
-- A solução correta é usar um TRIGGER que rejeita alterações nas colunas de saldo.
CREATE POLICY "users_update_own_profile_safe"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**Importante:** Como RLS WITH CHECK não tem acesso a `OLD`, a proteção real vem do trigger:

```sql
-- Trigger que REJEITA alterações de saldo EXCETO quando vindo da fn_change_balance
-- IMPORTANTE: Usa GUC flag (app.allow_balance_update) ao invés de checar role.
-- Isso impede alterações de saldo fora do caminho oficial (fn_change_balance),
-- reduzindo regressões e acidentes (ex: dev usando adminClient errado).
-- NOTA: Isso é DEFESA EM PROFUNDIDADE, não escudo absoluto. Um atacante com
-- service_role comprometido poderia desabilitar triggers ou setar o flag manualmente.
-- A proteção real do service_role key é não vazá-la. O GUC flag é camada extra.
CREATE OR REPLACE FUNCTION prevent_balance_tampering()
RETURNS TRIGGER AS $$
BEGIN
  -- PERMITE alteração SOMENTE se a função financeira setou o flag GUC
  -- O flag é setado por fn_change_balance com set_config('app.allow_balance_update', 'on', true)
  -- O terceiro parâmetro 'true' garante que o flag é LOCAL à transação (reseta automaticamente)
  IF current_setting('app.allow_balance_update', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Defesa em profundidade: bloqueia alterações de saldo fora do caminho oficial
  -- Previne acidentes (dev usando adminClient errado) e reduz superfície de ataque
  -- NOTA: Um service_role comprometido pode desabilitar triggers — proteja a key
  IF NEW.saldo IS DISTINCT FROM OLD.saldo
     OR NEW.saldo_bonus IS DISTINCT FROM OLD.saldo_bonus
     OR NEW.saldo_cassino IS DISTINCT FROM OLD.saldo_cassino
     OR NEW.saldo_bonus_cassino IS DISTINCT FROM OLD.saldo_bonus_cassino
  THEN
    -- Best-effort: logar tentativa de fraude/bypass (não pode quebrar a transação)
    BEGIN
      INSERT INTO audit_logs (actor_id, action, entity, details, created_at)
      VALUES (
        auth.uid(),  -- pode ser NULL (actor_id é NULLABLE)
        'BALANCE_TAMPERING_BLOCKED',
        'profiles:' || NEW.id::text,
        jsonb_build_object(
          'saldo_old', OLD.saldo, 'saldo_new', NEW.saldo,
          'bonus_old', OLD.saldo_bonus, 'bonus_new', NEW.saldo_bonus,
          'cassino_old', OLD.saldo_cassino, 'cassino_new', NEW.saldo_cassino,
          'bonus_cassino_old', OLD.saldo_bonus_cassino, 'bonus_cassino_new', NEW.saldo_bonus_cassino,
          'role', current_setting('request.jwt.claim.role', true),
          'timestamp', now()
        ),
        now()
      );
    EXCEPTION WHEN OTHERS THEN
      -- Best-effort: se log falhar (RLS, constraint, etc.), não impede o RAISE abaixo
      NULL;
    END;

    RAISE EXCEPTION 'Alteração de saldo não permitida por esta via. Use fn_change_balance.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger (DROP primeiro se já existir)
DROP TRIGGER IF EXISTS trg_prevent_balance_tampering ON profiles;
CREATE TRIGGER trg_prevent_balance_tampering
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_balance_tampering();
```

> **NOTA DE SEGURANÇA:** A checagem anterior usava `current_setting('role') = 'service_role'` que é frágil no Supabase (o GUC `role` pode não existir ou ter valor inesperado). A nova abordagem com flag GUC (`app.allow_balance_update`) é **defesa em profundidade**: impede alterações de saldo fora do caminho oficial e previne acidentes/regressões (ex: dev usando adminClient no lugar errado). **Ressalva:** um atacante com service_role key comprometida poderia desabilitar triggers, alterar a função ou setar o flag manualmente — portanto a GUC flag NÃO substitui a proteção do segredo do service_role. É camada extra, não escudo absoluto. O flag é `LOCAL` à transação (reseta automaticamente após COMMIT/ROLLBACK).

#### 1.2 — Função SQL transacional para movimentação de saldo

```sql
CREATE OR REPLACE FUNCTION fn_change_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT,           -- 'deposito', 'saque', 'aposta', 'premio', 'bonus', 'transferencia', 'ajuste_admin'
  p_wallet TEXT DEFAULT 'saldo',  -- 'saldo', 'saldo_bonus', 'saldo_cassino', 'saldo_bonus_cassino'
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- 0. Validar wallet (previne SQL injection via nome de coluna)
  IF p_wallet NOT IN ('saldo', 'saldo_bonus', 'saldo_cassino', 'saldo_bonus_cassino') THEN
    RETURN json_build_object('success', false, 'error', 'Wallet inválida');
  END IF;

  -- 1. Ativar flag GUC para permitir alteração de saldo pelo trigger
  -- O 'true' torna LOCAL à transação (reseta automaticamente após COMMIT/ROLLBACK)
  PERFORM set_config('app.allow_balance_update', 'on', true);

  -- 2. Lock da linha (impede race condition)
  EXECUTE format(
    'SELECT %I FROM profiles WHERE id = $1 FOR UPDATE',
    p_wallet
  ) INTO v_current_balance USING p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  -- 3. Calcular novo saldo
  v_new_balance := v_current_balance + p_amount;

  -- 4. Impedir saldo negativo (exceto para ajuste_admin)
  IF v_new_balance < 0 AND p_type != 'ajuste_admin' THEN
    RETURN json_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  -- 5. Atualizar saldo (trigger permite porque flag GUC está ativo)
  EXECUTE format(
    'UPDATE profiles SET %I = $1 WHERE id = $2',
    p_wallet
  ) USING v_new_balance, p_user_id;

  -- 6. Desativar flag GUC imediatamente após o UPDATE
  PERFORM set_config('app.allow_balance_update', 'off', true);

  -- 7. Registrar no ledger (imutável)
  INSERT INTO financial_ledger (
    user_id, type, wallet, amount,
    balance_before, balance_after,
    reference_id, description
  ) VALUES (
    p_user_id, p_type, p_wallet, p_amount,
    v_current_balance, v_new_balance,
    p_reference_id, p_description
  );

  RETURN json_build_object(
    'success', true,
    'balance_before', v_current_balance,
    'balance_after', v_new_balance
  );

EXCEPTION WHEN OTHERS THEN
  -- Garantir que o flag é desativado mesmo em caso de erro
  PERFORM set_config('app.allow_balance_update', 'off', true);
  RAISE;
END;
$$;

-- Ownership: garantir que a função pertence ao postgres (role com bypassrls)
ALTER FUNCTION fn_change_balance OWNER TO postgres;

-- Apenas service_role pode executar
REVOKE EXECUTE ON FUNCTION fn_change_balance FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_change_balance TO service_role;
```

> **NOTA:** A função agora: (1) seta `app.allow_balance_update = 'on'` antes do UPDATE (permite o trigger); (2) desativa imediatamente após; (3) tem EXCEPTION handler que garante desativação mesmo em erro; (4) valida o nome da wallet para prevenir injection; (5) é owned by `postgres` para ter bypassrls.

**Tabela ledger necessária:**

```sql
CREATE TABLE IF NOT EXISTS financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  wallet TEXT NOT NULL DEFAULT 'saldo',
  amount NUMERIC NOT NULL,
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_ledger_user_id ON financial_ledger(user_id);
CREATE INDEX idx_ledger_type ON financial_ledger(type);
CREATE INDEX idx_ledger_created_at ON financial_ledger(created_at);

-- RLS: ninguém lê/escreve direto (só via função SQL)
ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger FORCE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para checar se admin pode ler ledger de um user
-- Evita JOIN pesado dentro de policy (performance + interação de RLS entre tabelas)
CREATE OR REPLACE FUNCTION can_read_user_ledger(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    -- Super admin lê tudo
    is_super_admin()
    OR
    -- Platform admin lê ledger de users da sua plataforma
    EXISTS (
      SELECT 1 FROM platform_admins pa
      JOIN profiles p ON p.platform_id = pa.platform_id
      WHERE pa.user_id = auth.uid()
      AND p.id = p_user_id
    )
$$;

-- Admins podem ler (para auditoria), scoped por plataforma via função
CREATE POLICY "admins_read_ledger" ON financial_ledger
  FOR SELECT USING (can_read_user_ledger(user_id));

-- Usuário pode ver seu próprio extrato
CREATE POLICY "users_read_own_ledger" ON financial_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- IMPORTANTE: Sem policy de INSERT/UPDATE/DELETE para authenticated/anon
-- Inserções acontecem via fn_change_balance (SECURITY DEFINER, owned by postgres)
--
-- NOTA SOBRE RLS + SECURITY DEFINER:
-- fn_change_balance é SECURITY DEFINER com OWNER = postgres.
-- Se FORCE RLS estiver ativo, o INSERT no ledger será avaliado contra as policies.
-- Como não há policy de INSERT para nenhum role, a inserção falharia.
-- SOLUÇÃO: Criar policy de INSERT restrita via GUC flag (mesmo padrão do saldo):

CREATE POLICY "allow_ledger_insert_via_fn"
ON financial_ledger FOR INSERT
WITH CHECK (current_setting('app.allow_balance_update', true) = 'on');

-- Isso garante que SOMENTE fn_change_balance (que seta o flag) consegue inserir.
-- Qualquer outro caminho é bloqueado.

-- IMUTABILIDADE: Trigger que impede UPDATE e DELETE no ledger
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger financeiro é imutável. Correções devem ser feitas via lançamento compensatório (novo INSERT com valor reverso).'
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_ledger_update
  BEFORE UPDATE ON financial_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

CREATE TRIGGER trg_prevent_ledger_delete
  BEFORE DELETE ON financial_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();
```

**Risco de quebra:**
- **ALTO** — Toda lógica que hoje faz `UPDATE profiles SET saldo = ...` precisa ser migrada para chamar `fn_change_balance` via `createAdminClient().rpc()`
- Arquivos afetados: `lib/admin/actions/financial.ts` (approveDeposit, rejectWithdrawal), `lib/admin/actions/users.ts` (updateUserBalance, updateUserProfile), Edge Functions (create-pix-payment, playfiver-callback)
- As RPCs existentes `atomic_credit_balance` e `atomic_status_transition` já fazem parte desse caminho — podem ser mantidas ou substituídas pela nova `fn_change_balance`
- **Recomendação:** Implementar `fn_change_balance` e o ledger primeiro, depois migrar cada ponto de alteração de saldo um por um, testando cada fluxo

---

### 2. Resolver IDOR entre usuários

**Problema:** Se as RLS policies não forçam `auth.uid() = user_id` em todas as tabelas sensíveis, um usuário pode ler ou modificar dados de outro usuário enviando um ID diferente no request.

**Correção — RLS obrigatório em tabelas sensíveis:**

```sql
-- PROFILES
-- SELECT: usuário vê só o seu, admins veem todos
CREATE POLICY "users_select_own_profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );

-- APOSTAS
CREATE POLICY "users_select_own_bets" ON apostas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_bets" ON apostas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PAGAMENTOS (depósitos)
CREATE POLICY "users_select_own_payments" ON pagamentos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_payments" ON pagamentos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SAQUES
CREATE POLICY "users_select_own_withdrawals" ON saques
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_withdrawals" ON saques
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PLAYFIVER_TRANSACTIONS
CREATE POLICY "users_select_own_casino_txn" ON playfiver_transactions
  FOR SELECT USING (auth.uid() = user_id);
```

**Risco de quebra:**
- **MEDIO** — Se já existem policies diferentes, o DROP + CREATE pode causar erro 403 temporário
- Testar cada tabela individualmente: fazer login como usuário normal e verificar se consegue listar seus próprios dados
- Admins usam `createAdminClient()` (service_role) que bypassa RLS, então o painel admin não é afetado
- **Recomendação:** Antes de aplicar, listar policies atuais com `SELECT * FROM pg_policies WHERE schemaname = 'public'` para não sobrescrever regras válidas

---

### 3. Resolver Race Condition financeira

**Problema:** Sem `SELECT ... FOR UPDATE`, duas requisições concorrentes podem ler o mesmo saldo e ambas creditarem, resultando em saldo duplicado.

**Correção:**

A função `fn_change_balance` do item 1.2 já resolve isso com `FOR UPDATE`. Mas para os fluxos existentes que ainda não usam essa função:

#### 3.1 — Verificar RPCs existentes

As RPCs `atomic_credit_balance` e `atomic_status_transition` já existem no sistema. Verificar se usam `FOR UPDATE`:

```sql
-- Se NÃO usam FOR UPDATE, adicionar:
-- Dentro de atomic_credit_balance:
SELECT saldo FROM profiles WHERE id = p_user_id FOR UPDATE;
-- Depois: UPDATE profiles SET saldo = saldo + p_amount ...
```

#### 3.2 — Idempotency key em depósitos e saques

```sql
-- Adicionar coluna (se não existir)
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE saques ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Índice para busca rápida
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagamentos_idempotency ON pagamentos(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_saques_idempotency ON saques(idempotency_key) WHERE idempotency_key IS NOT NULL;
```

**No código (Edge Functions e Server Actions):**
```typescript
// Gerar idempotency_key no cliente antes de enviar
const idempotencyKey = `dep_${userId}_${amount}_${Date.now()}`;

// Na Edge Function, antes de processar:
const { data: existing } = await supabase
  .from('pagamentos')
  .select('id')
  .eq('idempotency_key', idempotencyKey)
  .maybeSingle();

if (existing) {
  return { success: true, message: 'Pagamento já processado', id: existing.id };
}
```

**Risco de quebra:**
- **BAIXO** — `ALTER TABLE ADD COLUMN` com `IF NOT EXISTS` é seguro
- A idempotency key é opcional (nullable), não quebra fluxos existentes
- O `FOR UPDATE` nas RPCs pode causar lentidão sob carga alta (locks), mas é necessário para segurança

---

### 4. Edge Functions financeiras sem autenticação

**Problema:** 9 de 11 Edge Functions têm `verify_jwt: false`.

**Correção detalhada:**

| Função | Ação | Motivo |
|--------|------|--------|
| `create-pix-payment` | `verify_jwt: true` | Usuário autenticado cria pagamento |
| `create-withdrawal` | `verify_jwt: true` | Usuário autenticado solicita saque |
| `create-deposit` | `verify_jwt: true` | Usuário autenticado cria depósito |
| `check-pix-status` | `verify_jwt: true` | Usuário autenticado consulta status |
| `check-pending-payments` | `verify_jwt: true` | Admin verifica pagamentos pendentes |
| `create-admin-user` | `verify_jwt: true` (já está) | Manter |
| `reset-user-password` | `verify_jwt: true` (já está) | Manter |
| `washpay-webhook` | Manter `false` | Webhook externo — validar HMAC internamente |
| `bspay-webhook` | Manter `false` | Webhook externo — validar HMAC internamente |
| `bspay-withdrawal-webhook` | Manter `false` | Webhook externo — validar HMAC internamente |
| `playfiver-callback` | Manter `false` | Callback externo — validar secret internamente |

**Para webhooks, adicionar validação interna:**
```typescript
// No início de cada webhook Edge Function:
const signature = req.headers.get('x-signature') || req.headers.get('x-webhook-signature');
const body = await req.text();

// Buscar secret da plataforma
const { data: config } = await supabaseAdmin
  .from('gateway_config')
  .select('client_secret')
  .eq('gateway_name', 'washpay')
  .single();

// Validar HMAC
const expectedSig = crypto
  .createHmac('sha256', config.client_secret)
  .update(body)
  .digest('hex');

if (signature !== expectedSig) {
  return new Response('Invalid signature', { status: 401 });
}
```

**Risco de quebra:**
- **ALTO** — Ao mudar para `verify_jwt: true`, o frontend PRECISA enviar o token JWT no header `Authorization: Bearer <token>`. Se o código frontend não faz isso, todas as chamadas vão falhar com 401
- **Verificar antes:** Como o frontend chama cada Edge Function (provavelmente via `supabase.functions.invoke()` que já envia o JWT automaticamente)
- **Recomendação:** Mudar UMA função por vez, testar o fluxo completo, depois seguir para a próxima

---

### 5. Leitura pública de dados financeiros

**Problema:** Se `ultimo_ganhador` (ou tabelas similares) tem RLS permissivo para SELECT anon, dados financeiros ficam expostos.

**Correção — Opção B (view sanitizada, recomendada):**

```sql
-- View pública que expõe APENAS dados não-identificáveis
-- LGPD: NÃO expor user_id, cpf, platform_id, transaction_id nem nada identificável
CREATE OR REPLACE VIEW public_ultimo_ganhador AS
SELECT
  modalidade,
  SUBSTRING(nome FROM 1 FOR 3) || '***' AS nome_mascarado,  -- Mascarar nome (apenas 3 letras)
  valor,
  created_at
FROM ultimo_ganhador
ORDER BY created_at DESC
LIMIT 10;
-- NOTA: Esta view NÃO deve conter: user_id, id, cpf, telefone, email, platform_id

-- Dar acesso anon apenas à view
GRANT SELECT ON public_ultimo_ganhador TO anon, authenticated;

-- Revogar acesso direto à tabela original
REVOKE SELECT ON ultimo_ganhador FROM anon;
```

**Risco de quebra:**
- **MEDIO** — Se o frontend ou componentes como `winner-banner.tsx` leem direto de `ultimo_ganhador`, precisam ser atualizados para usar a view
- Verificar `components/dashboard/winner-banner.tsx` e qualquer query que referencie essa tabela

---

### 6. RPC públicas executáveis por anon

**Problema:** Funções SQL públicas podem ser chamadas por qualquer pessoa sem autenticação.

**Correção:**

```sql
-- Revogar execução de funções sensíveis para anon
REVOKE EXECUTE ON FUNCTION fn_get_ultimo_ganhador FROM anon;
REVOKE EXECUTE ON FUNCTION verificar_apostas FROM anon;
REVOKE EXECUTE ON FUNCTION transfer_balance FROM anon;
REVOKE EXECUTE ON FUNCTION fn_playfiver_game_launch FROM anon;
REVOKE EXECUTE ON FUNCTION atomic_credit_balance FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION atomic_status_transition FROM anon, authenticated;

-- Funções financeiras: apenas service_role
GRANT EXECUTE ON FUNCTION atomic_credit_balance TO service_role;
GRANT EXECUTE ON FUNCTION atomic_status_transition TO service_role;
GRANT EXECUTE ON FUNCTION fn_change_balance TO service_role;

-- Funções de usuário: apenas authenticated
GRANT EXECUTE ON FUNCTION transfer_balance TO authenticated;
GRANT EXECUTE ON FUNCTION fn_playfiver_game_launch TO authenticated;
```

**Risco de quebra:**
- **MEDIO** — Se alguma Edge Function chama RPCs com o client anon (ao invés de service_role), vai falhar
- **Verificar antes:** Listar todas as RPCs com `SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace` e quem as chama
- Edge Functions que usam `supabaseAdmin` (service_role) não são afetadas

---

### 7. Cookie `platform_id` manipulável

**Problema:** Cookie `httpOnly: false`, cliente pode alterar para acessar dados de outra plataforma.

**Correção no código (`lib/utils/platform.ts`):**

```typescript
export async function getPlatformId(): Promise<string> {
  const cookieStore = await cookies();
  const platformIdFromCookie = cookieStore.get('platform_id')?.value;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_id')
      .eq('id', user.id)
      .single();

    if (profile?.platform_id) {
      // Admin pode trocar plataforma, jogador não
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!adminRole && platformIdFromCookie !== profile.platform_id) {
        // LOG DE SEGURANCA: cookie manipulado
        console.warn('[SECURITY] Cookie platform_id mismatch', {
          userId: user.id,
          cookie: platformIdFromCookie,
          profile: profile.platform_id,
        });
        return profile.platform_id; // Ignora cookie manipulado
      }
    }
  }

  return platformIdFromCookie || DEFAULT_PLATFORM_ID;
}
```

**Risco de quebra:**
- **BAIXO** — Adiciona uma query extra ao `getPlatformId()` para jogadores autenticados
- O middleware já faz query similar, então o impacto de performance é mínimo (dados provavelmente em cache do Supabase)
- Admins continuam podendo trocar plataforma normalmente

---

## P1 — CRITICAS (corrigir em 1 semana)

---

### 8. Rate Limiting global

**Problema:** Nenhuma rota possui rate limiting. Login, depósitos, saques podem ser abusados por brute force ou flood.

**Correção recomendada — Upstash Redis + @upstash/ratelimit:**

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Criar `lib/utils/rate-limit.ts`:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Limites por tipo de operação
export const rateLimiters = {
  login: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(5, '15 m') }),       // 5/15min
  signup: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(3, '1 h') }),        // 3/hora
  deposit: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(10, '1 h') }),      // 10/hora
  withdrawal: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(5, '1 h') }),    // 5/hora
  scraper: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(10, '1 m') }),      // 10/min
  rpc: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(30, '1 m') }),          // 30/min
};

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining };
}
```

**Alternativa sem dependência (para MVP):**
Implementar rate limiter simples em memória no middleware usando `Map<string, { count: number, reset: number }>`. Funciona para single-instance, mas não para múltiplas instâncias (Vercel serverless).

**Risco de quebra:**
- **BAIXO** — Rate limiting é aditivo, não altera lógica existente
- Requer variáveis de ambiente `UPSTASH_REDIS_URL` e `UPSTASH_REDIS_TOKEN`
- Se Redis ficar indisponível, deve falhar aberto (permitir request) para não bloquear todo o sistema

---

### 9. Stored XSS

**Problema:** Campos como `nome`, mensagens e inputs de admin são renderizados sem sanitização. Um atacante pode inserir `<script>` no nome que será executado no browser de admins.

**Correção frontend (`components/` e `app/`):**
```typescript
// Instalar DOMPurify (já está no devDependencies como @types/dompurify)
npm install dompurify

// Criar utility lib/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }); // Remove TUDO
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, '') // Remove caracteres perigosos
    .trim()
    .slice(0, 500);         // Limitar tamanho
}
```

**Correção server-side (Server Actions):**
```typescript
// Em todo Server Action que recebe input de texto:
const nome = sanitizeInput(rawNome);
```

**Risco de quebra:**
- **BAIXO** — Sanitização de output não altera dados existentes
- Se nomes existentes contêm `&` ou `'` (ex: "D'Angelo"), a sanitização pode removê-los — usar lista branca mais permissiva se necessário
- React já escapa HTML por padrão em JSX, mas `dangerouslySetInnerHTML` ou interpolação em atributos são vetores

---

### 10. Enumeração de schema

**Problema:** Erros do Supabase/PostgREST podem expor nomes de tabelas, colunas e funções para atacantes.

**Correção — Padronizar respostas de erro:**

```typescript
// lib/utils/safe-error.ts
export function safeError(error: unknown): string {
  // Nunca expor detalhes internos ao cliente
  if (process.env.NODE_ENV === 'development') {
    return String(error);
  }
  return 'Erro interno do servidor';
}

// Nas API routes, trocar:
// ANTES:  return NextResponse.json({ error: error.message }, { status: 500 });
// DEPOIS: return NextResponse.json({ error: safeError(error) }, { status: 500 });
```

**No Supabase (PostgREST):**

> **Nota:** `REVOKE ALL ON information_schema FROM anon` pode não ter efeito prático no Supabase/PostgREST, pois a enumeração acontece via mensagens de erro do PostgREST (nomes de tabela/coluna nos erros 4xx), não via consulta direta ao information_schema.

A proteção real contra enumeração é:
1. Não retornar mensagens detalhadas ao cliente (já coberto pelo `safeError()` acima)
2. Não dar grants desnecessários em tabelas sensíveis (coberto pelo Item 21)
3. Restringir schemas expostos no PostgREST via `db-schemas` config (se aplicável)

```sql
-- Opcional: revogar grants desnecessários em tabelas que anon não precisa acessar
-- (Já coberto no Item 21, mas reforçar aqui)
REVOKE ALL ON admin_roles, platform_admins, gateway_config FROM anon;
```

**Risco de quebra:**
- **NENHUM** em produção — erros genéricos são mais seguros
- Em desenvolvimento, erros detalhados continuam visíveis (check `NODE_ENV`)

---

### 11. Endpoint interno sem secret (triggers)

**Arquivo:** `app/api/internal/triggers/route.ts:11`

**Problema:** Se `INTERNAL_API_SECRET` não está definida, `undefined !== undefined` é `false`, então a verificação **passa** (ambos são `undefined` e a comparação `!==` retorna `false`).

**Correção:**
```typescript
const expectedSecret = process.env.INTERNAL_API_SECRET;

// OBRIGATÓRIO: secret deve existir E bater
if (!expectedSecret || !secret || secret !== expectedSecret) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Risco de quebra:**
- **NENHUM** se a env var já está configurada em produção
- Se NÃO está configurada, este fix vai **bloquear** o endpoint até configurar — o que é o comportamento correto

---

### 12. Search injection

**Arquivos:** `lib/admin/actions/financial.ts:73,290`, `lib/admin/actions/users.ts:89`

**Problema:** Parâmetro `search` interpolado diretamente em filtro PostgREST.

**Correção — Criar utility e aplicar:**

```typescript
// lib/utils/sanitize.ts
export function sanitizeSearchParam(input: string): string {
  return input
    .replace(/[%_\\(),.;'"<>{}[\]|&!]/g, '') // Remove metacaracteres SQL/PostgREST
    .trim()
    .slice(0, 100); // Limitar tamanho
}
```

**Aplicar em cada arquivo:**
```typescript
// ANTES:
if (search) {
  query = query.or(`profiles.nome.ilike.%${search}%,profiles.cpf.ilike.%${search}%`);
}

// DEPOIS:
if (search) {
  const safe = sanitizeSearchParam(search);
  if (safe.length > 0) {
    query = query.or(`profiles.nome.ilike.%${safe}%,profiles.cpf.ilike.%${safe}%`);
  }
}
```

**Risco de quebra:**
- **BAIXO** — Apenas remove caracteres especiais do input de busca
- Buscas com caracteres especiais (improvável em nomes/CPFs) deixarão de funcionar

---

## P2 — IMPORTANTES (corrigir em 2 semanas)

---

### 13. Content Security Policy (CSP)

**Arquivo:** `next.config.ts`

**Correção:**
```typescript
// Adicionar ao array de headers em next.config.ts
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://api.playfivers.com",
    "connect-src 'self' https://*.supabase.co https://api.playfivers.com wss://*.supabase.co",
    "frame-src 'self' https://*.playfivers.com",
    "font-src 'self'",
  ].join('; '),
}
```

**Risco de quebra:**
- **ALTO** — CSP mal configurado pode bloquear scripts, estilos, imagens e conexões
- **Usar `Content-Security-Policy-Report-Only` primeiro** por 1 semana para monitorar violações sem bloquear
- Cassino (iframes do PlayFivers) e Facebook Pixel são os mais sensíveis

---

### 14. Proteção contra senhas vazadas

**Local:** Supabase Dashboard > Authentication > Settings

**Correção:** Habilitar "Leaked Password Protection" (HaveIBeenPwned).

**Risco de quebra:**
- **BAIXO** — Afeta apenas novos cadastros e trocas de senha
- Usuários com senhas já vazadas continuam acessando normalmente (só são bloqueados ao tentar criar/trocar para uma senha vazada)

---

### 15. Token sensível em URL (Facebook CAPI)

**Arquivo:** `lib/tracking/facebook-capi.ts:94`

**Correção:**
```typescript
// ANTES:
`https://graph.facebook.com/v19.0/${pixel}/events?access_token=${token}`

// DEPOIS:
const response = await fetch(
  `https://graph.facebook.com/v19.0/${pixel}/events`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,

      
    },
    body: JSON.stringify({ data: events }),
  }
);
```

**Risco de quebra:**
- **BAIXO** — Facebook Graph API suporta token via header Authorization
- Testar em staging antes: se a API rejeitar o header, manter na URL mas logar um warning

---

### 16. Geolocalização via HTTP

**Arquivo:** `lib/security/tracker.ts:69`

**Correção — Migrar para provider HTTPS:**
```typescript
// ANTES:
const response = await fetch(`http://ip-api.com/json/${ip}?fields=...`);

// DEPOIS (usando ipapi.co, gratuito com HTTPS):
const response = await fetch(`https://ipapi.co/${ip}/json/`, {
  next: { revalidate: 3600 },
});
const data = await response.json();
// Mapear campos: data.city, data.region, data.country_name, data.country_code, data.org
```

**Risco de quebra:**
- **BAIXO** — Apenas muda o provider de geolocalização
- Os campos retornados podem ter nomes diferentes — ajustar o parsing

---

### 17. API keys multi-tenant (singleton WashPay)

**Arquivo:** `lib/washpay/client.ts:221-232`

**Correção:**
1. Remover o singleton `getWashPayClient()` e a env var `WASHPAY_API_KEY`
2. Toda chamada WashPay deve buscar a API key da tabela `gateway_config` por `platform_id` (como já feito em `financial.ts:395`)
3. Auditar se algum outro local usa o singleton

**Risco de quebra:**
- **MEDIO** — Se algum fluxo usa `getWashPayClient()`, precisa ser migrado
- Fazer busca no código por `getWashPayClient` antes de remover

---

## P3 — HARDENING (boas práticas, corrigir quando possível)

---

### 18. Logs de segurança obrigatórios

O sistema já tem `audit_logs` e `logAudit()`. Expandir para logar:

- Tentativa de alteração de saldo bloqueada pelo trigger (**já incluído no trigger atualizado do Item 1.1**)
- Mismatch de `platform_id` (cookie vs profile)
- Falha de webhook (assinatura inválida)
- Repetição de idempotency key (possível replay attack)
- Login com senha incorreta (já logado? verificar)
- **Toda execução de `fn_change_balance`** (já registrada automaticamente no ledger)
- **Tentativas de escalação de role bloqueadas** (já incluído no trigger do Item 22)

**Onde implementar:**
- Trigger `prevent_balance_tampering` — **FEITO** (Item 1.1 atualizado com INSERT INTO audit_logs)
- Trigger `prevent_role_escalation` — **FEITO** (Item 22 com auditoria completa)
- `getPlatformId()` — log de mismatch (já incluído no item 7)
- Edge Functions de webhook — log de assinatura inválida

**PRE-REQUISITO CRITICO — audit_logs acessível por triggers:**

A tabela `audit_logs` tem RLS habilitado. Os triggers fazem INSERT nela. Para que os logs não falhem silenciosamente:

```sql
-- Garantir que audit_logs aceita INSERT via GUC flags dos triggers
-- (os triggers usam SECURITY DEFINER, mas FORCE RLS pode bloquear)
CREATE POLICY "allow_audit_insert_from_triggers"
ON audit_logs FOR INSERT
WITH CHECK (
  -- Permite quando qualquer flag de controle está ativo (operação legítima em andamento)
  current_setting('app.allow_balance_update', true) = 'on'
  OR current_setting('app.allow_role_change', true) = 'on'
  OR current_setting('app.allow_platform_admin_change', true) = 'on'
  -- Permite para service_role (operações admin normais via logAudit())
  OR current_setting('request.jwt.claim.role', true) = 'service_role'
  -- Permite para authenticated (server actions que chamam logAudit())
  OR auth.uid() IS NOT NULL
);
```

**Confirmado:** `audit_logs.actor_id` já é NULLABLE — sem risco de NOT NULL constraint quando `auth.uid()` retorna NULL (operações via service_role sem contexto de usuário).

**Padrão best-effort:** Todos os INSERTs em audit_logs dentro de triggers estão wrapped em `BEGIN...EXCEPTION WHEN OTHERS THEN NULL; END;`. Isso garante que **falha de log nunca quebra a operação principal** (saldo, role change, etc.). O log pode falhar silenciosamente em edge cases, mas a operação financeira/administrativa completa normalmente.

**Risco de quebra:** NENHUM — apenas adiciona logs. Se audit_logs falhar, a operação principal continua.

---

### 19. Monitoramento financeiro

**Criar alertas automáticos para:**
- Saldo negativo em qualquer perfil
- Mais de 5 créditos no mesmo minuto para o mesmo usuário
- Depósito acima de R$ 10.000 (threshold configurável)
- Spike de saques (> 20 em 1 hora)

**Implementação sugerida — Cron via Edge Function:**
```sql
-- View para monitoramento
CREATE OR REPLACE VIEW vw_financial_alerts AS
SELECT
  'saldo_negativo' as alert_type,
  id as user_id,
  saldo as value
FROM profiles
WHERE saldo < 0 OR saldo_cassino < 0

UNION ALL

SELECT
  'multiplos_creditos' as alert_type,
  user_id,
  COUNT(*) as value
FROM financial_ledger
WHERE created_at > now() - interval '1 minute'
  AND amount > 0
GROUP BY user_id
HAVING COUNT(*) > 5;
```

**Risco de quebra:** NENHUM — view é read-only.

---

### 20. Auditoria financeira (ledger imutável)

Já coberto no item 1.2 (tabela `financial_ledger` com triggers de imutabilidade).

**Regra fundamental:** O ledger é APPEND-ONLY. Correções de lançamentos nunca são feitas via UPDATE ou DELETE. A forma correta é criar um **lançamento compensatório** (novo INSERT com valor inverso):

```sql
-- EXEMPLO: Corrigir um crédito indevido de R$ 100 para o user X
-- NÃO FAZER: UPDATE financial_ledger SET amount = 0 WHERE id = '...'
-- NÃO FAZER: DELETE FROM financial_ledger WHERE id = '...'
-- FAZER: Lançamento reverso via fn_change_balance
SELECT fn_change_balance(
  'user_x_uuid',
  -100.00,                          -- valor negativo (estorno)
  'ajuste_admin',
  'saldo',
  'referencia_do_lancamento_original'::uuid,
  'Estorno: crédito indevido ref #ABC - aprovado por admin Y'
);
```

**Isso garante:**
- Trilha de auditoria completa (o erro original E a correção ficam registrados)
- Rastreabilidade: quem corrigiu, quando e por quê
- Integridade: saldos `balance_before` e `balance_after` permanecem consistentes em toda a cadeia

**Risco de quebra:** NENHUM — apenas impede operações que nunca deveriam acontecer.

---

### 21. Deny-by-default: revogar anon + FORCE RLS em tabelas sensíveis

#### 21.1 — Revogar acesso anon de tabelas internas

```sql
-- Revogar acesso anon de tabelas que NUNCA devem ser acessadas publicamente
REVOKE ALL ON admin_roles FROM anon;
REVOKE ALL ON promotor_roles FROM anon;
REVOKE ALL ON platform_admins FROM anon;
REVOKE ALL ON gateway_config FROM anon;
REVOKE ALL ON webhooks_config FROM anon;
REVOKE ALL ON webhook_logs FROM anon;
REVOKE ALL ON system_settings FROM anon;
REVOKE ALL ON audit_logs FROM anon;
REVOKE ALL ON playfiver_config FROM anon;
REVOKE ALL ON financial_ledger FROM anon;
REVOKE ALL ON evolution_config FROM anon;
```

#### 21.2 — FORCE ROW LEVEL SECURITY em tabelas financeiras

Complementa o Item 22 (que aplicou FORCE apenas em role tables). Aqui aplicamos nas tabelas financeiras para proteger contra execução como table owner:

```sql
-- Migration: force_rls_financial_tables
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE pagamentos FORCE ROW LEVEL SECURITY;
ALTER TABLE saques FORCE ROW LEVEL SECURITY;
ALTER TABLE apostas FORCE ROW LEVEL SECURITY;
ALTER TABLE playfiver_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE financial_ledger FORCE ROW LEVEL SECURITY;
```

> **Nota:** `FORCE ROW LEVEL SECURITY` endurece contra execução como table owner. Não é barreira contra roles com `BYPASSRLS` (como service_role no Supabase). É defesa em profundidade contra SQL injection que execute como owner.

#### 21.3 — Não criar policy SELECT para anon em tabelas sensíveis

**Regra:** Nenhuma tabela sensível deve ter policy que inclua `anon` nos roles. A única exposição pública deve ser via views sanitizadas (ex: `public_ultimo_ganhador`).

**Verificar com:**
```sql
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND roles::text LIKE '%anon%'
  AND tablename IN ('profiles', 'apostas', 'pagamentos', 'saques', 'admin_roles', 'playfiver_transactions', 'financial_ledger');
-- DEVE retornar 0 linhas
```

**Risco de quebra:**
- **BAIXO** — Tabelas internas não devem ser acessadas por anon
- `FORCE RLS` não muda comportamento para service_role nem authenticated
- Verificar se alguma Edge Function usa client anon para ler essas tabelas (provavelmente não, pois usam service_role)

---

## ORDEM REAL DE EXECUCAO (recomendada)

| Etapa | Item | Ação | Risco | Downtime |
|-------|------|------|-------|----------|
| 1 | 11 | Fix endpoint interno (1 linha) | Nenhum | 0 |
| 2 | 22.1-2 | FORCE RLS + CHECK CONSTRAINT em role tables | Nenhum | 0 |
| 3 | 22.3-4 | Triggers anti-escalação (admin_roles + platform_admins) | Baixo | 0 |
| 4 | 1.1 | Trigger `prevent_balance_tampering` (com GUC flag) | Baixo | 0 |
| 5 | 1.2 | Criar `fn_change_balance` + tabela `financial_ledger` | Baixo | 0 |
| 6 | 21+ | Revogar anon + FORCE RLS em tabelas financeiras | Baixo | 0 |
| 7 | 6 | Revogar anon em RPCs sensíveis | Medio | 0 |
| 8 | 2 | RLS em todas tabelas sensíveis | Medio | Possível 403 temporário |
| 9 | 22.6-7 | `is_admin_for_platform()` + policies scoped | Medio | Testar painel admin |
| 10 | 3 | Idempotency keys + verificar FOR UPDATE nas RPCs | Baixo | 0 |
| 11 | 7 | Validar cookie platform_id | Baixo | 0 |
| 12 | 4 | Edge Functions: `verify_jwt: true` (1 por vez) | Baixo* | Possível 401 (reclassificado) |
| 13 | 12 | Sanitizar search params | Baixo | 0 |
| 14 | 5 | View pública para ultimo_ganhador (sem PII) | Medio | Ajustar frontend |
| 15 | 9 | Sanitização XSS | Baixo | 0 |
| 16 | 10 | Padronizar erros | Nenhum | 0 |
| 17 | 8 | Rate limiting (Upstash Redis) | Baixo | 0 |
| 18 | 14 | Habilitar leaked password protection | Baixo | 0 |
| 19 | 15 | FB token para header | Baixo | 0 |
| 20 | 16 | Geolocalização HTTPS | Baixo | 0 |
| 21 | 17 | Remover singleton WashPay | Medio | Testar fluxo completo |
| 22 | 13 | CSP (Report-Only primeiro) | Alto | Possível bloqueio de recursos |
| 23 | 22.5 | Corrigir bug `linkAdminToPlatform()` | Baixo | Testar criação de admin |
| 24 | 18-20 | Logs + monitoramento + ledger imutável | Nenhum | 0 |

\* Item 4 reclassificado de ALTO para BAIXO após descobrir que Edge Functions já validam JWT internamente.

---

## RESUMO DE RISCOS DE QUEBRA

| Risco | Itens | O que pode acontecer |
|-------|-------|---------------------|
| **ALTO** | 13 (CSP) | CSP pode bloquear scripts/iframes do cassino e Facebook Pixel |
| **MEDIO** | 2 (RLS), 5 (view), 6 (RPCs), 17 (WashPay), 22.6-7 (policies scoped) | Erros 403 se policies conflitarem; admin pode perder acesso cross-platform |
| **BAIXO** | 1, 3, 4, 7, 8, 9, 10, 12, 14, 15, 16, 22.1-5 | Impacto mínimo, mudanças aditivas |
| **NENHUM** | 11, 18, 19, 20, 21 | Sem impacto em funcionalidades existentes |

---

## CONCLUSAO

O sistema apresenta **vulnerabilidade estrutural** em 4 eixos:

1. **Autorização** — RLS insuficiente permite IDOR e manipulação de saldo
2. **Transação financeira** — Ausência de locks e ledger permite race conditions e inconsistências
3. **Autenticação** — Edge Functions financeiras sem JWT e endpoints internos com bypass
4. **Escalação de privilégio** — Sem triggers anti-escalação, um vazamento de service_role key ou SQL injection permite promoção a super_admin

A correção exige:
- **GUC flag** (`app.allow_balance_update`) como defesa em profundidade — impede alterações de saldo fora do caminho oficial e previne acidentes/regressões (não substitui a proteção da service_role key)
- **Triggers anti-escalação** em admin_roles e platform_admins com auditoria completa
- **RLS rigoroso + FORCE** em todas as tabelas sensíveis (financeiras e de roles)
- **Ledger financeiro imutável** (append-only, correções via lançamento compensatório)
- Função SQL transacional com `FOR UPDATE` para todo movimento de saldo
- `verify_jwt: true` em Edge Functions de usuário
- **Policies com escopo de plataforma** — admin da plataforma A não acessa plataforma B
- Rate limiting em endpoints críticos
- Hardening de erro, XSS e exposição de schema
- **Deny-by-default** — nenhuma tabela sensível acessível por anon

**Sem estas medidas o sistema permanece explorável mesmo após correções superficiais.**

---

## ESTRATEGIAS DE MIGRACAO SEM GARGALO (Itens 4, 13 e 2)

Após análise detalhada do código-fonte das Edge Functions e do frontend, seguem as estratégias para implementar os 3 itens de maior risco **sem causar downtime ou quebra**.

---

### ITEM 4 — Edge Functions com `verify_jwt: true`

#### Descoberta importante (risco reclassificado: ALTO → BAIXO)

Ao analisar o código-fonte das Edge Functions, descobri que **todas já fazem autenticação interna**. Exemplo da `create-pix-payment` (linha 155):

```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(
    JSON.stringify({ success: false, error: "Nao autorizado" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
const token = authHeader.replace("Bearer ", "");
const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
if (authError || !user) {
  return new Response(
    JSON.stringify({ success: false, error: "Token invalido" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

A `create-withdrawal` faz exatamente o mesmo padrão.

O frontend chama via `supabase.functions.invoke()`:
```typescript
// app/recarga-pix/page.tsx:158
const { data, error } = await supabase.functions.invoke('create-pix-payment', { body: {...} });

// app/saques/novo/page.tsx:157
const { data, error } = await supabase.functions.invoke('create-withdrawal', { body: {...} });

// hooks/use-payment-watcher.ts:94
const { data, error } = await supabase.functions.invoke('check-pix-status', { body: {...} });
```

O método `supabase.functions.invoke()` do `@supabase/supabase-js` **envia automaticamente** o JWT do usuário logado no header `Authorization: Bearer <token>`.

#### Por que o risco é BAIXO

1. O frontend **já envia** o JWT (via `supabase.functions.invoke`)
2. As Edge Functions **já validam** o JWT internamente
3. Ativar `verify_jwt: true` apenas adiciona uma camada extra no gateway do Supabase (valida antes de chegar na função)
4. Se o JWT for válido para a função (como já é), será válido para o gateway também

#### Estratégia de migração (zero downtime)

**Passo 1 — Validar em staging (5 min):**
```bash
# Testar se o frontend envia o header corretamente
# No browser, abrir DevTools > Network > fazer um depósito
# Verificar que o request para /functions/v1/create-pix-payment tem:
# Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Passo 2 — Migrar uma função por vez (não todas de uma vez):**
Ordem recomendada (da menos crítica para a mais crítica):
1. `check-pix-status` (apenas consulta, se falhar o pagamento ainda funciona)
2. `create-deposit` (função secundária, create-pix-payment é a principal)
3. `check-pending-payments` (admin, baixo volume)
4. `create-pix-payment` (depósitos — testar bem)
5. `create-withdrawal` (saques — testar bem)

**Passo 3 — Deploy com rollback imediato:**
```bash
# Deploy com verify_jwt: true
supabase functions deploy check-pix-status --verify-jwt

# Testar imediatamente (fazer um depósito de teste)
# Se falhar:
supabase functions deploy check-pix-status --no-verify-jwt  # Rollback em 30 segundos
```

Ou via MCP:
```
mcp__supabase__deploy_edge_function(name="check-pix-status", verify_jwt=true, ...)
```

**Passo 4 — Monitorar:**
Após cada deploy, verificar nos logs do Supabase se há erros 401:
```
mcp__supabase__get_logs(service="edge-function")
```

#### Exceções que DEVEM permanecer `verify_jwt: false`

| Função | Motivo | Proteção alternativa |
|--------|--------|---------------------|
| `washpay-webhook` | Chamada pelo WashPay, sem JWT | Validar HMAC + secret header |
| `bspay-webhook` | Chamada pelo BSPay, sem JWT | Validar assinatura + IP whitelist |
| `bspay-withdrawal-webhook` | Chamada pelo BSPay, sem JWT | Validar assinatura + IP whitelist |
| `playfiver-callback` | Chamada pelo PlayFivers, sem JWT | Validar secret_key da config |

Para esses webhooks, a proteção correta é validar a assinatura HMAC internamente (não JWT). Exemplo para adicionar em cada webhook:

```typescript
// No início do webhook, ANTES de processar:
const receivedSignature = req.headers.get('x-signature') || req.headers.get('x-webhook-signature');
const body = await req.text();

// Buscar secret da plataforma (já tem acesso via service_role)
const { data: gwConfig } = await supabase
  .from('gateway_config')
  .select('client_secret')
  .eq('gateway_name', 'washpay')  // ou 'bspay'
  .single();

if (gwConfig?.client_secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(gwConfig.client_secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  if (receivedSignature !== expectedSig) {
    console.error('[WEBHOOK] Invalid signature');
    return new Response('Unauthorized', { status: 401 });
  }
}

// Seguro: parsear o body e processar
const payload = JSON.parse(body);
```

---

### ITEM 13 — Content Security Policy (CSP)

#### Por que o risco é ALTO

CSP bloqueia **qualquer recurso** que não esteja na whitelist. Se esquecer de incluir um domínio, a funcionalidade quebra silenciosamente (sem erro visível ao usuário, apenas no console).

Recursos do sistema que podem ser bloqueados:
- Iframes do PlayFivers (cassino) — `frame-src`
- Facebook Pixel script — `script-src`
- Imagens de jogos da PlayFivers API — `img-src`
- WebSocket do Supabase Realtime — `connect-src`
- QR Code gerado externamente — `img-src` (data: e blob:)
- Fontes customizadas (barao-font.woff) — `font-src`

#### Estratégia de migração em 3 fases (zero quebra)

**FASE 1 — Report-Only (1 semana, zero risco):**

Usar `Content-Security-Policy-Report-Only` ao invés de `Content-Security-Policy`. Isso **não bloqueia nada**, apenas loga violações no console do browser.

```typescript
// next.config.ts — FASE 1 (Report-Only)
{
  key: 'Content-Security-Policy-Report-Only',  // <-- NÃO bloqueia, só reporta
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://*.facebook.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://api.playfivers.com https://api.qrserver.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.playfivers.com https://graph.facebook.com https://ipapi.co",
    "frame-src 'self' https://*.playfivers.com https://*.playfiver.com",
    "font-src 'self'",
    "report-uri /api/csp-report",
  ].join('; '),
}
```

**Criar endpoint de coleta de violações (opcional mas recomendado):**

```typescript
// app/api/csp-report/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const report = await request.json();
    console.warn('[CSP-VIOLATION]', JSON.stringify(report['csp-report'] || report, null, 2));
  } catch {}
  return NextResponse.json({ ok: true });
}
```

**O que fazer durante a FASE 1:**
- Deploy normalmente
- Navegar por TODAS as páginas do sistema (home, loterias, cassino, admin, promotor)
- Verificar no console do browser (F12) se há violações CSP
- Para cada violação, adicionar o domínio à whitelist

**FASE 2 — Enforcement com whitelist refinada (após 1 semana sem violações):**

Trocar `Content-Security-Policy-Report-Only` por `Content-Security-Policy`:

```typescript
// next.config.ts — FASE 2 (Enforcement)
{
  key: 'Content-Security-Policy',  // <-- Agora bloqueia
  value: [
    // Mesma policy refinada da FASE 1 com todos os domínios descobertos
  ].join('; '),
}
```

**FASE 3 — Remover `unsafe-inline` e `unsafe-eval` (futuro):**

Depois que o sistema estiver estável com CSP, trabalhar para remover `unsafe-inline` e `unsafe-eval` usando nonces ou hashes. Isso é avançado e pode ser feito gradualmente.

#### Rollback instantâneo

Se algo quebrar após ativar enforcement (FASE 2):
- Reverter o header de volta para `Content-Security-Policy-Report-Only`
- O deploy no Vercel leva ~30 segundos
- Nenhum dado é perdido, apenas a proteção CSP é temporariamente desabilitada

---

### ITEM 2 — RLS em todas tabelas sensíveis

#### Por que o risco é MEDIO

Alterar RLS policies pode causar:
- **403 Forbidden** se a nova policy for mais restritiva que o esperado
- **Dados inacessíveis** se a policy estiver errada
- **Conflito de policies** se policies antigas ainda existirem (Supabase combina policies com OR)

#### Descoberta importante sobre PostgreSQL RLS

No PostgreSQL, policies são **combinadas com OR** (para policies PERMISSIVE, que é o default). Isso significa que:
- Se existir uma policy antiga `USING (true)` e você adicionar `USING (auth.uid() = user_id)`, **a antiga ainda permite tudo** (true OR qualquer_coisa = true)
- Por isso, é **obrigatório** fazer `DROP POLICY` da antiga antes de criar a nova

#### Estratégia de migração em 4 passos (sem 403)

**Passo 1 — Inventariar policies atuais (antes de tocar em qualquer coisa):**

```sql
-- Executar via mcp__supabase__execute_sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Salvar o resultado como backup. Se algo der errado, pode recriar as policies originais.

**Passo 2 — Migrar UMA tabela por vez (não todas de uma vez):**

Ordem recomendada (da menos usada para a mais usada):
1. `playfiver_transactions` (cassino, menor impacto)
2. `saques` (saques, admin verifica status)
3. `pagamentos` (depósitos, admin verifica status)
4. `apostas` (apostas, alta frequência)
5. `profiles` (perfil, usada em TODA requisição)

**Passo 3 — Para cada tabela, usar transação atômica (DROP + CREATE juntos):**

```sql
-- IMPORTANTE: Fazer DROP e CREATE na mesma transação
-- Se o CREATE falhar, o DROP é revertido automaticamente
BEGIN;

-- 1. Remover policy antiga
DROP POLICY IF EXISTS "nome_policy_antiga" ON tabela;

-- 2. Criar nova policy
CREATE POLICY "nome_policy_nova" ON tabela
  FOR SELECT USING (auth.uid() = user_id);

COMMIT;
```

Usar `mcp__supabase__apply_migration` que executa como transação.

**Passo 4 — Testar imediatamente após cada tabela:**

Após aplicar RLS em uma tabela, testar os 3 cenários:
1. **Usuário normal** — Fazer login como jogador, verificar se vê seus próprios dados
2. **Admin** — Verificar se o painel admin funciona (usa `createAdminClient()` = service_role, bypassa RLS)
3. **Anon** — Verificar que um request sem auth retorna vazio (não 403)

```typescript
// Teste rápido no browser console:
const { data, error } = await supabase.from('apostas').select('*').limit(5);
console.log('Data:', data, 'Error:', error);
// Deve retornar apenas apostas do usuário logado
```

#### Template SQL para cada tabela

```sql
-- ============================================
-- TEMPLATE: Aplicar RLS seguro em uma tabela
-- Substituir {TABELA} e {COLUNA_USER} antes de executar
-- ============================================

BEGIN;

-- Garantir que RLS está habilitado
ALTER TABLE {TABELA} ENABLE ROW LEVEL SECURITY;

-- Forçar RLS mesmo para table owner (previne bypass acidental)
ALTER TABLE {TABELA} FORCE ROW LEVEL SECURITY;

-- Remover policies antigas (listar nomes reais do Passo 1)
-- DROP POLICY IF EXISTS "policy_antiga_1" ON {TABELA};
-- DROP POLICY IF EXISTS "policy_antiga_2" ON {TABELA};

-- SELECT: usuário vê só os seus
CREATE POLICY "users_select_own_{TABELA}"
ON {TABELA} FOR SELECT
USING (auth.uid() = {COLUNA_USER});

-- INSERT: usuário insere só para si
CREATE POLICY "users_insert_own_{TABELA}"
ON {TABELA} FOR INSERT
WITH CHECK (auth.uid() = {COLUNA_USER});

-- UPDATE: usuário atualiza só os seus (se necessário)
-- CREATE POLICY "users_update_own_{TABELA}"
-- ON {TABELA} FOR UPDATE
-- USING (auth.uid() = {COLUNA_USER})
-- WITH CHECK (auth.uid() = {COLUNA_USER});

-- ADMIN: admins veem tudo (via service_role, não precisa policy)
-- Service_role bypassa RLS automaticamente

COMMIT;
```

#### Caso específico: tabela `profiles`

`profiles` é especial porque:
- A coluna do user é `id` (não `user_id`)
- É usada no middleware (TODA requisição)
- Admins precisam ler profiles de outros usuários (mas usam service_role)

```sql
BEGIN;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- SELECT: usuário vê só o seu
-- (admins usam createAdminClient que bypassa RLS)
CREATE POLICY "users_select_own_profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- UPDATE: usuário atualiza só o seu, MAS sem alterar saldo
-- (saldo protegido pelo trigger prevent_balance_tampering)
CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- INSERT: apenas via trigger de signup (auth.users → profiles)
-- Geralmente feito por trigger AFTER INSERT ON auth.users
-- Não precisa de policy para INSERT se o trigger usa service_role

COMMIT;
```

#### Rollback instantâneo (se algo quebrar)

```sql
-- Se uma tabela ficar inacessível, criar policy temporária permissiva:
CREATE POLICY "emergency_allow_all" ON {TABELA}
  FOR ALL USING (true) WITH CHECK (true);

-- Depois investigar e corrigir com calma
-- Quando corrigido, remover a policy de emergência:
DROP POLICY "emergency_allow_all" ON {TABELA};
```

---

### RESUMO: MIGRAÇÃO SEGURA DOS 3 ITENS

| Item | Estratégia | Tempo de risco | Rollback |
|------|-----------|----------------|----------|
| **4 (Edge Functions)** | Risco real é BAIXO — frontend já envia JWT, funções já validam internamente. Migrar 1 por vez, da menos para a mais crítica. | ~30s por função (tempo do deploy) | Re-deploy com `--no-verify-jwt` em 30s |
| **13 (CSP)** | Usar `Report-Only` por 1 semana antes de enforcement. Zero risco na FASE 1. | 0 na FASE 1; ~30s na FASE 2 (tempo do deploy) | Trocar header de volta para `Report-Only` |
| **2 (RLS)** | Inventariar policies atuais primeiro. Migrar 1 tabela por vez em transação atômica. Testar imediatamente. | ~5min por tabela (tempo de teste) | `CREATE POLICY emergency_allow_all` instantâneo |

**Nenhum dos 3 itens requer downtime se seguir a estratégia acima.**

---

## ITEM 22 — DEFESA EM PROFUNDIDADE PARA ROLES ADMIN E SUPER_ADMIN (P0 — BLOQUEADOR)

### Prioridade: P0 (Bloqueador)
### Risco de quebra: BAIXO (aditivo — adiciona camadas sem alterar fluxo existente)

---

### ESTADO ATUAL (o que já existe)

Após auditoria nas policies e funções SQL, o estado atual é:

**Tabela `admin_roles`** — RLS HABILITADO:
| Policy | Comando | Regra | Status |
|--------|---------|-------|--------|
| `Block client insert on admin_roles` | INSERT | `WITH CHECK (false)` | OK — bloqueia INSERT via client |
| `Block client update on admin_roles` | UPDATE | `USING (false) WITH CHECK (false)` | OK — bloqueia UPDATE via client |
| `Block client delete on admin_roles` | DELETE | `USING (false)` | OK — bloqueia DELETE via client |
| `Users can check own admin status` | SELECT | `USING (user_id = auth.uid())` | OK — usuario ve so o proprio |

**Tabela `platform_admins`** — RLS HABILITADO:
| Policy | Comando | Regra | Status |
|--------|---------|-------|--------|
| `Super admins can manage platform admins` | ALL | `USING (is_super_admin())` | OK |
| `Users can view own platform links` | SELECT | `USING (user_id = auth.uid() OR is_super_admin())` | OK |

**Tabela `promotor_roles`** — RLS HABILITADO:
| Policy | Comando | Regra | Status |
|--------|---------|-------|--------|
| `Admins can do everything with promotor_roles` | ALL | `is_admin(auth.uid())` | OK |
| `Users can view their own promotor role` | SELECT | `user_id = auth.uid()` | OK |

**Funções SQL existentes:**
- `is_admin()` — SECURITY DEFINER, verifica existência em admin_roles
- `is_super_admin()` — SECURITY DEFINER, verifica role = 'super_admin'
- `is_platform_admin(p_platform_id)` — SECURITY DEFINER, verifica platform_admins + super_admin

---

### VULNERABILIDADES IDENTIFICADAS (7 lacunas)

#### LACUNA 1 — `FORCE ROW LEVEL SECURITY` ausente

```
admin_roles:     rls_enabled=true, rls_forced=false
platform_admins: rls_enabled=true, rls_forced=false
promotor_roles:  rls_enabled=true, rls_forced=false
```

**Risco:** Sem `FORCE`, o table owner (role `postgres`) bypassa RLS. Se houver qualquer SQL injection que execute como owner, as policies são inúteis.

#### LACUNA 2 — Sem TRIGGER de proteção contra escalação de privilégio

As policies bloqueiam via client (anon/authenticated), mas se algum código usa `createAdminClient()` (service_role), ele **bypassa todas as policies**. Não existe nenhum trigger que impeça:

```sql
-- Isso passaria se executado via service_role:
INSERT INTO admin_roles (user_id, role) VALUES ('qualquer_uuid', 'super_admin');
UPDATE admin_roles SET role = 'super_admin' WHERE user_id = 'algum_admin';
```

O código em `lib/admin/actions/master.ts` (`linkAdminToPlatform`) tenta inserir em admin_roles via `createClient()`, mas falha silenciosamente porque a policy bloqueia. Se alguém "corrigir" para usar `createAdminClient()`, a proteção desaparece.

#### LACUNA 3 — Sem CHECK CONSTRAINT nos valores de role

```sql
-- Nada impede isso no banco:
INSERT INTO admin_roles (user_id, role) VALUES ('uuid', 'god_mode');
UPDATE admin_roles SET role = 'megaadmin' WHERE user_id = 'uuid';
```

Não há constraint limitando os valores válidos de `role`.

#### LACUNA 4 — Sem auditoria em alterações de admin_roles

Não existe trigger de auditoria na tabela admin_roles. Se alguém conseguir inserir/atualizar (via service_role ou SQL injection), não há rastro no banco.

#### LACUNA 5 — `linkAdminToPlatform()` tem bug silencioso

```typescript
// lib/admin/actions/master.ts (linkAdminToPlatform)
if (!adminRole) {
    await supabase.from('admin_roles').insert({
      user_id: userId,
      role: 'admin',
      permissions: {},
    });
    // ← Erro NÃO é verificado! INSERT falha silenciosamente pela RLS
}
```

O INSERT em `admin_roles` é feito com `createClient()` (autenticado), mas a policy `WITH CHECK (false)` bloqueia TODOS os inserts. O erro não é capturado. O admin é linkado em `platform_admins` mas NÃO recebe a role.

**Correção:** Usar `createAdminClient()` apenas para o INSERT em admin_roles, com validação e auditoria.

#### LACUNA 6 — `is_admin()` não tem escopo de plataforma

```sql
-- Função atual:
CREATE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid());
END;
$$
```

Um admin da plataforma A é considerado admin globalmente. As policies que usam `is_admin()` (ex: `"Admins can update any profile"` em profiles) dão acesso a TODOS os profiles de TODAS as plataformas.

#### LACUNA 7 — Profiles permite admin atualizar qualquer perfil sem escopo

```
Policy: "Admins can update any profile"
USING: is_admin()
WITH CHECK: is_admin()
```

Um admin da plataforma A pode fazer UPDATE em profiles de usuarios da plataforma B. Deveria ser restrito por `platform_id`.

---

### CORREÇÕES (7 partes)

#### PARTE 1 — Forçar RLS em todas tabelas de roles

```sql
-- Migration: force_rls_on_role_tables
ALTER TABLE admin_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE platform_admins FORCE ROW LEVEL SECURITY;
ALTER TABLE promotor_roles FORCE ROW LEVEL SECURITY;
```

**Risco de quebra:** NENHUM. `FORCE RLS` endurece contra execução como table owner; não é barreira contra roles com `BYPASSRLS` (como service_role no Supabase, que tipicamente tem esse atributo).

#### PARTE 2 — CHECK CONSTRAINT para valores válidos de role

```sql
-- Migration: add_role_check_constraint
ALTER TABLE admin_roles
  ADD CONSTRAINT admin_roles_valid_role
  CHECK (role IN ('admin', 'super_admin'));
```

**Risco de quebra:** NENHUM (aditivo). Só bloqueia valores inválidos futuros. Dados existentes já usam 'admin' ou 'super_admin'.

#### PARTE 3 — Trigger anti-escalação de privilégio (com GUC flag)

Mesma estratégia do saldo: usar GUC flag para controlar o caminho oficial. Sem o flag, **nenhuma operação passa** — nem via service_role.

**Primeiro, criar a função controlada que seta o flag:**

```sql
-- Migration: fn_grant_admin_role
CREATE OR REPLACE FUNCTION fn_grant_admin_role(
  p_target_user_id UUID,
  p_role TEXT DEFAULT 'admin',
  p_actor_id UUID DEFAULT NULL,
  p_permissions JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validar role
  IF p_role NOT IN ('admin', 'super_admin') THEN
    RETURN json_build_object('success', false, 'error', 'Role inválido');
  END IF;

  -- Ativar flag GUC para permitir operação no trigger
  PERFORM set_config('app.allow_role_change', 'on', true);

  -- Inserir ou atualizar role
  INSERT INTO admin_roles (user_id, role, permissions)
  VALUES (p_target_user_id, p_role, p_permissions)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions;

  -- Desativar flag imediatamente
  PERFORM set_config('app.allow_role_change', 'off', true);

  -- Auditoria (best-effort, via função separada para não quebrar a transação)
  BEGIN
    INSERT INTO audit_logs (actor_id, action, entity, details, created_at)
    VALUES (
      p_actor_id,
      'ROLE_GRANTED',
      'admin_roles:' || p_target_user_id::text,
      jsonb_build_object(
        'actor', p_actor_id,
        'target_user', p_target_user_id,
        'role', p_role,
        'timestamp', now()
      ),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log best-effort: não quebra a transação principal se audit falhar
    RAISE WARNING 'Audit log failed: %', SQLERRM;
  END;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('app.allow_role_change', 'off', true);
  RAISE;
END;
$$;

ALTER FUNCTION fn_grant_admin_role OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION fn_grant_admin_role FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_grant_admin_role TO service_role;

-- Função para revogar role
CREATE OR REPLACE FUNCTION fn_revoke_admin_role(
  p_target_user_id UUID,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM set_config('app.allow_role_change', 'on', true);

  DELETE FROM admin_roles WHERE user_id = p_target_user_id;

  PERFORM set_config('app.allow_role_change', 'off', true);

  BEGIN
    INSERT INTO audit_logs (actor_id, action, entity, details, created_at)
    VALUES (
      p_actor_id,
      'ROLE_REVOKED',
      'admin_roles:' || p_target_user_id::text,
      jsonb_build_object(
        'actor', p_actor_id,
        'target_user', p_target_user_id,
        'timestamp', now()
      ),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Audit log failed: %', SQLERRM;
  END;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('app.allow_role_change', 'off', true);
  RAISE;
END;
$$;

ALTER FUNCTION fn_revoke_admin_role OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION fn_revoke_admin_role FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_revoke_admin_role TO service_role;
```

**Agora o trigger, que só permite passagem com o flag GUC ativo:**

```sql
-- Migration: trigger_prevent_role_escalation
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Permite SOMENTE se a função oficial (fn_grant_admin_role / fn_revoke_admin_role)
  -- setou o flag GUC. Sem o flag, BLOQUEIA TUDO — inclusive service_role.
  IF current_setting('app.allow_role_change', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Defesa em profundidade: bloqueia qualquer operação fora do caminho oficial
  -- Loga tentativa (best-effort — não pode quebrar por causa de log)
  BEGIN
    INSERT INTO audit_logs (actor_id, action, entity, details, created_at)
    VALUES (
      auth.uid(),  -- pode ser NULL (actor_id deve ser NULLABLE)
      'ROLE_ESCALATION_BLOCKED',
      'admin_roles:' || COALESCE(NEW.user_id::text, OLD.user_id::text),
      jsonb_build_object(
        'operation', TG_OP,
        'caller_uid', auth.uid(),
        'caller_role', current_setting('request.jwt.claim.role', true),
        'target_user', COALESCE(NEW.user_id, OLD.user_id),
        'attempted_role', CASE WHEN TG_OP != 'DELETE' THEN NEW.role ELSE NULL END,
        'timestamp', now()
      ),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Best-effort: não impede o RAISE abaixo
    NULL;
  END;

  RAISE EXCEPTION 'Alteração de admin_roles não permitida. Use fn_grant_admin_role() ou fn_revoke_admin_role().'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER trg_prevent_role_escalation
  BEFORE INSERT OR UPDATE OR DELETE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();
```

**O que este trigger garante:**
1. Sem o flag `app.allow_role_change = 'on'`, **nenhuma operação passa** — nem service_role, nem table owner
2. O flag só é setado por `fn_grant_admin_role` e `fn_revoke_admin_role` (SECURITY DEFINER, owned by postgres)
3. Tentativas bloqueadas são logadas (best-effort — se o log falhar, a transação não quebra)
4. A lógica de "quem pode chamar fn_grant_admin_role" fica no **código TypeScript** (requireSuperAdmin), não no trigger

> **Defesa em profundidade, não escudo absoluto:** um atacante com service_role comprometido pode desabilitar triggers ou alterar funções. O GUC flag previne acidentes e uso incorreto do adminClient — não substitui a proteção da service_role key.

**Risco de quebra:** BAIXO. O trigger bloqueia tudo por padrão. O único caminho é via as funções SQL. Testes necessários: verificar que `linkAdminToPlatform()` use `fn_grant_admin_role` via RPC.

#### PARTE 4 — Trigger anti-escalação em platform_admins (com GUC flag)

Mesmo padrão: GUC flag como porta de entrada, função controlada como caminho oficial.

```sql
-- Função controlada para linkar admin a plataforma
CREATE OR REPLACE FUNCTION fn_link_platform_admin(
  p_user_id UUID,
  p_platform_id UUID,
  p_permissions JSONB DEFAULT '{}'::jsonb,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM set_config('app.allow_platform_admin_change', 'on', true);

  INSERT INTO platform_admins (user_id, platform_id, permissions, created_by)
  VALUES (p_user_id, p_platform_id, p_permissions, p_created_by)
  ON CONFLICT (user_id, platform_id) DO UPDATE SET
    permissions = EXCLUDED.permissions;

  PERFORM set_config('app.allow_platform_admin_change', 'off', true);

  BEGIN
    INSERT INTO audit_logs (actor_id, action, entity, details, created_at)
    VALUES (
      p_created_by,
      'PLATFORM_ADMIN_LINKED',
      'platform_admins:' || p_user_id::text,
      jsonb_build_object(
        'actor', p_created_by,
        'target_user', p_user_id,
        'platform_id', p_platform_id,
        'timestamp', now()
      ),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Audit log failed: %', SQLERRM;
  END;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('app.allow_platform_admin_change', 'off', true);
  RAISE;
END;
$$;

ALTER FUNCTION fn_link_platform_admin OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION fn_link_platform_admin FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_link_platform_admin TO service_role;

-- Trigger: bloqueia tudo sem o flag
CREATE OR REPLACE FUNCTION prevent_platform_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF current_setting('app.allow_platform_admin_change', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  -- Best-effort audit log
  BEGIN
    INSERT INTO audit_logs (actor_id, action, entity, details, created_at)
    VALUES (
      auth.uid(),
      'PLATFORM_ADMIN_ESCALATION_BLOCKED',
      'platform_admins:' || COALESCE(NEW.user_id::text, OLD.user_id::text),
      jsonb_build_object(
        'operation', TG_OP,
        'caller_uid', auth.uid(),
        'target_user', COALESCE(NEW.user_id, OLD.user_id),
        'platform_id', COALESCE(NEW.platform_id, OLD.platform_id),
        'timestamp', now()
      ),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RAISE EXCEPTION 'Alteração de platform_admins não permitida. Use fn_link_platform_admin().'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER trg_prevent_platform_admin_escalation
  BEFORE INSERT OR UPDATE OR DELETE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION prevent_platform_admin_escalation();
```

#### PARTE 5 — Corrigir `linkAdminToPlatform()` (usar funções SQL controladas)

```typescript
// lib/admin/actions/master.ts — CORRIGIR linkAdminToPlatform()

// ANTES (bug — INSERT direto bloqueado pela RLS + trigger):
// await supabase.from('admin_roles').insert({...}); // ← Falha silenciosamente

// DEPOIS (correto — usar as funções SQL controladas via RPC):
const adminClient = createAdminClient();

// 1. Criar role via fn_grant_admin_role (seta GUC flag, passa pelo trigger)
if (!adminRole) {
    const { data: roleResult, error: roleError } = await adminClient.rpc(
      'fn_grant_admin_role',
      {
        p_target_user_id: userId,
        p_role: 'admin',
        p_actor_id: user.id,
        p_permissions: permissions || {},
      }
    );

    if (roleError || !roleResult?.success) {
      console.error('Error creating admin role:', roleError || roleResult?.error);
      return { success: false, error: 'Falha ao criar role de admin' };
    }
}

// 2. Linkar à plataforma via fn_link_platform_admin
const { data: linkResult, error: linkError } = await adminClient.rpc(
  'fn_link_platform_admin',
  {
    p_user_id: userId,
    p_platform_id: platformId,
    p_permissions: permissions || {},
    p_created_by: user.id,
  }
);

if (linkError || !linkResult?.success) {
  console.error('Error linking platform admin:', linkError || linkResult?.error);
  // Reverter role se link falhou
  await adminClient.rpc('fn_revoke_admin_role', {
    p_target_user_id: userId,
    p_actor_id: user.id,
  });
  return { success: false, error: 'Falha ao linkar admin à plataforma' };
}
```

> **Nota:** Com este padrão, tanto o INSERT em `admin_roles` quanto em `platform_admins` passam pelas funções controladas (que setam o GUC flag). O trigger permite a operação e a auditoria é feita dentro da própria função SQL.

#### PARTE 6 — Restringir `is_admin()` com escopo de plataforma

```sql
-- Migration: add_is_platform_scoped_admin_function

-- Nova função que verifica admin COM escopo de plataforma
CREATE OR REPLACE FUNCTION is_admin_for_platform(p_platform_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    -- Super admin tem acesso a tudo
    is_super_admin()
    OR
    -- Platform admin tem acesso à sua plataforma
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid()
      AND platform_id = p_platform_id
    )
$$;
```

#### PARTE 7 — Restringir policy de profiles para escopo de plataforma

```sql
-- Migration: restrict_admin_profile_access_by_platform
BEGIN;

-- Remover policy antiga que dá acesso global
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Nova: admin vê apenas profiles da sua plataforma
CREATE POLICY "Admins can view platform profiles"
ON profiles FOR SELECT
USING (
  is_super_admin()
  OR
  EXISTS (
    SELECT 1 FROM platform_admins pa
    WHERE pa.user_id = auth.uid()
    AND pa.platform_id = profiles.platform_id
  )
);

-- Nova: admin edita apenas profiles da sua plataforma
CREATE POLICY "Admins can update platform profiles"
ON profiles FOR UPDATE
USING (
  is_super_admin()
  OR
  EXISTS (
    SELECT 1 FROM platform_admins pa
    WHERE pa.user_id = auth.uid()
    AND pa.platform_id = profiles.platform_id
  )
)
WITH CHECK (
  is_super_admin()
  OR
  EXISTS (
    SELECT 1 FROM platform_admins pa
    WHERE pa.user_id = auth.uid()
    AND pa.platform_id = profiles.platform_id
  )
);

COMMIT;
```

**Risco de quebra:** MEDIO. O painel admin usa `createAdminClient()` (service_role) que bypassa RLS, então NÃO é afetado. Mas se algum código usar `createClient()` para consultas admin, pode quebrar. Testar:
- Middleware (usa `createClient()` para ler profiles → afetado pela policy SELECT, MAS middleware lê profile do PRÓPRIO user via `auth.uid() = id`, então OK)
- Painel admin (usa `createAdminClient()` → bypassa RLS, OK)

---

### ORDEM DE EXECUÇÃO

| Passo | Parte | Descrição | Risco |
|-------|-------|-----------|-------|
| 1 | PARTE 2 | CHECK CONSTRAINT em role | NENHUM |
| 2 | PARTE 1 | FORCE RLS nas 3 tabelas | NENHUM |
| 3 | PARTE 3 | Trigger anti-escalação em admin_roles | BAIXO |
| 4 | PARTE 4 | Trigger anti-escalação em platform_admins | BAIXO |
| 5 | PARTE 6 | Criar função `is_admin_for_platform()` | NENHUM |
| 6 | PARTE 7 | Restringir policies de profiles por plataforma | MEDIO — testar |
| 7 | PARTE 5 | Corrigir bug em `linkAdminToPlatform()` | BAIXO — testar |

---

### TESTE PÓS-IMPLEMENTAÇÃO

```
1. [CRITICO] Tentar INSERT em admin_roles via browser console:
   const { error } = await supabase.from('admin_roles').insert({ user_id: 'meu-id', role: 'super_admin' });
   // DEVE retornar: erro de permissão

2. [CRITICO] Tentar UPDATE em admin_roles via browser console:
   const { error } = await supabase.from('admin_roles').update({ role: 'super_admin' }).eq('user_id', 'meu-id');
   // DEVE retornar: erro de permissão

3. [CRITICO] Tentar INSERT em platform_admins via browser console:
   const { error } = await supabase.from('platform_admins').insert({ user_id: 'meu-id', platform_id: 'algum-id' });
   // DEVE retornar: erro de permissão

4. [FUNCIONAL] Login como super_admin → criar novo admin via painel → DEVE funcionar
5. [FUNCIONAL] Login como admin → acessar painel admin → DEVE ver apenas usuarios da plataforma
6. [FUNCIONAL] Login como usuario normal → NÃO deve ver nada de admin
7. [AUDITORIA] Verificar audit_logs após cada teste:
   SELECT * FROM audit_logs WHERE action LIKE 'ROLE%' OR action LIKE 'PLATFORM_ADMIN%' ORDER BY created_at DESC;
```

---

### RESUMO — DEFESA EM PROFUNDIDADE

| Camada | Proteção | O que impede | Limitação |
|--------|----------|-------------|-----------|
| **RLS Policy** | `WITH CHECK (false)` em INSERT/UPDATE/DELETE | Operação via client (anon/authenticated) | Não afeta service_role |
| **FORCE RLS** | `FORCE ROW LEVEL SECURITY` | Bypass por table owner | Não afeta roles com BYPASSRLS |
| **CHECK CONSTRAINT** | `role IN ('admin', 'super_admin')` | Valores de role inventados | — |
| **GUC Flag + Trigger** | `app.allow_role_change` | Operação fora do caminho oficial (acidentes, uso incorreto de adminClient) | Atacante com acesso total pode desabilitar triggers |
| **Funções SQL** | `fn_grant_admin_role`, `fn_link_platform_admin` | Única porta de entrada controlada | Precisam de service_role para executar |
| **Função SQL** | `is_admin_for_platform()` | Admin acessar dados de outra plataforma | — |
| **Policy scoped** | profiles restrito por platform_id | Admin ver/editar usuarios de outra plataforma | — |
| **Auditoria** | Logs best-effort em toda tentativa | Rastreabilidade (inclusive tentativas bloqueadas) | Best-effort: pode falhar silenciosamente |

**Estas camadas são defesa em profundidade. Cada uma reduz a superfície de ataque e previne classes diferentes de acidente/ataque. Nenhuma é "escudo mágico" isoladamente — a força está na combinação. A proteção mais crítica continua sendo: não vazar a service_role key.**
