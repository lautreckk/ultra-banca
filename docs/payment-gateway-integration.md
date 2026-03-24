# Integração de Gateways de Pagamento (Saques/Withdrawals)

## Arquitetura Geral

```
[Usuário solicita saque]
        ↓
[Edge Function: create-withdrawal]  →  Cria saque como PENDING
        ↓
[Admin aprova no painel]
        ↓
[Server Action: approveWithdrawal()]  →  lib/admin/actions/financial.ts
        ↓
[proxyFetch()]  →  VPS Proxy (IP fixo) →  Gateway API (BSPay, WashPay, etc)
        ↓
[Saque marcado como PAID]
```

## Componentes

### 1. Edge Function: `create-withdrawal`
- **Local**: Supabase Edge Functions
- **verify_jwt**: `false` (valida token internamente via `getUser()`)
- **Função**: Debita saldo do usuário e cria registro na tabela `saques` com status PENDING
- **Config por plataforma**: `withdrawal_min`, `withdrawal_max`, `withdrawal_fee_percent`

### 2. Server Action: `approveWithdrawal()`
- **Local**: `lib/admin/actions/financial.ts`
- **Função**: Admin aprova saque → chama gateway API → marca como PAID
- **Segurança**: `atomic_status_transition` RPC previne double-approve
- **Profile**: Usa `adminClient` (service role) para buscar dados do usuário (bypass RLS)

### 3. Payment Proxy (VPS IP Fixo)
- **Local**: VPS Hostinger `82.25.68.62:3001`
- **Código**: `/payment-proxy/index.js`
- **Função**: Recebe requests do Vercel e repassa ao gateway com IP fixo
- **Necessário porque**: Vercel usa IPs rotativos; gateways exigem IP whitelistado

## Proxy: Detalhes Técnicos

### Configuração
```
# Vercel env vars (AMBOS projetos que servem o app)
PAYMENT_PROXY_URL=http://82.25.68.62:3001
PAYMENT_PROXY_SECRET=<hash-sha256>

# VPS .env
PROXY_SECRET=<mesmo-hash-sha256>
PORT=3001
```

### Problemas Conhecidos e Soluções

| Problema | Causa | Solução |
|---|---|---|
| Proxy sai via IPv6 | VPS dual-stack, Node prefere IPv6 | `undici.Agent({ connect: { family: 4 } })` + `dns.setDefaultResultOrder('ipv4first')` |
| Processo antigo não morre no deploy | `pkill` pattern não bate com flags do node | Usar `pkill -f "index.js"` + `fuser -k 3001/tcp` |
| Proxy não lê .env | Node.js não carrega .env automaticamente | Flag `--env-file=.env` no Node 20 |
| `[SEM_PROXY, secret=VAZIO]` | Env vars não configuradas no Vercel | Adicionar em Settings → Environment Variables → All Environments |

### Deploy do Proxy
```bash
cd /payment-proxy && ./deploy.sh
```
O script copia arquivos para a VPS via SCP, instala deps, mata processo antigo e inicia novo.

### Domínios Permitidos (whitelist)
```js
const ALLOWED_DOMAINS = [
  'api.bspay.co',
  'api.pixupbr.com',
  'washpay.com.br',
  'api.inpagamentos.com',
  'api.realtechdev.com.br',
];
```
Para adicionar um novo gateway, incluir o domínio da API nesta lista.

## BSPay API v2

### Autenticação (2 passos)
```
1. POST /v2/oauth/token
   Header: Authorization: Basic base64(client_id:client_secret)
   → Retorna: { access_token: "jwt..." }    (expira em ~153s)

2. POST /v2/pix/payment
   Header: Authorization: Bearer {access_token}
```

**IMPORTANTE**: O `client_secret` (64 chars, SHA256) NÃO é Bearer token direto. Precisa trocar via OAuth.

### Endpoint de Pagamento
```
POST https://api.bspay.co/v2/pix/payment

{
  "amount": 20.00,
  "external_id": "uuid-do-saque",
  "creditParty": {
    "name": "Nome Completo",
    "keyType": "cpf",          // cpf, cnpj, telefone, email, aleatoria
    "key": "11890996912",
    "taxId": "11890996912"
  }
}
```

### IP Whitelist
- Configurar em: app.bspay.co → Configurações → Credenciais → IPs Permitidos
- Adicionar o IPv4 da VPS proxy: `82.25.68.62`
- BSPay NÃO suporta IPv6

### Erros Comuns BSPay

| Erro | Causa | Solução |
|---|---|---|
| HTML em vez de JSON | Endpoint errado (`/pix/cashout` não existe) | Usar `/pix/payment` |
| "Usuário não encontrado" | client_secret usado direto como Bearer (precisa OAuth) | Implementar fluxo OAuth de 2 passos |
| "Não autorizado, IP: x.x.x.x" | IP não cadastrado no BSPay | Liberar IP no painel BSPay |
| "Erro de autorização" | Basic Auth inválido no token endpoint | Verificar client_id:client_secret |

## WashPay

### Autenticação
- API Key direto no header ou no construtor `WashPayClient(apiKey)`
- Sem OAuth

### Endpoint
- Usa o client `lib/washpay/client.ts`
- `requestWithdrawal({ pixKeyType, pixKey, amount })`

### Key Type Mapping
```
cpf → CPF, cnpj → CNPJ, telefone → PHONE, email → EMAIL, aleatoria → RANDOM_KEY
```

## Como Adicionar Novo Gateway

### 1. Configuração no Banco
```sql
INSERT INTO gateway_config (platform_id, gateway_name, client_id, client_secret, config, ativo)
VALUES ('platform-uuid', 'novo-gateway', 'key', 'secret', '{"base_url":"https://api.novo.com"}', true);

UPDATE platforms SET active_gateway = 'novo-gateway' WHERE id = 'platform-uuid';
```

### 2. Código em `financial.ts`
Adicionar novo `else if` no `approveWithdrawal()`:
```typescript
} else if (activeGateway === 'novo-gateway') {
  // 1. Buscar config
  const { data: config } = await supabase
    .from('gateway_config')
    .select('client_id, client_secret, config')
    .eq('gateway_name', 'novo-gateway')
    .eq('platform_id', platformId)
    .single();

  // 2. Autenticar (se necessário)
  // 3. Chamar endpoint de pagamento via proxyFetch()
  const res = await proxyFetch('https://api.novo.com/pix/payment', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* payload do gateway */ }),
  });

  // 4. Processar resposta
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erro no gateway');
  txId = data.transactionId;
  gatewayUsed = 'novo-gateway';
}
```

### 3. Proxy: Liberar Domínio
Em `payment-proxy/index.js`, adicionar o domínio da API na `ALLOWED_DOMAINS`.

### 4. Gateway: Liberar IP
No painel do novo gateway, adicionar `82.25.68.62` (IPv4 da VPS proxy).

### 5. Vercel: Verificar Env Vars
Confirmar que `PAYMENT_PROXY_URL` e `PAYMENT_PROXY_SECRET` estão configuradas no projeto Vercel correto.

## Tabela `gateway_config`

| Coluna | Tipo | Descrição |
|---|---|---|
| platform_id | UUID | FK para platforms |
| gateway_name | text | Identificador: bspay, washpay, buckpay, etc |
| client_id | text | Chave pública / username |
| client_secret | text | Chave secreta (nunca exposta no frontend) |
| config | jsonb | Config extra: `{"base_url": "..."}` |
| ativo | boolean | Se este gateway está ativo |

## Tabela `platforms` (colunas relevantes)

| Coluna | Tipo | Descrição |
|---|---|---|
| active_gateway | text | Gateway ativo: bspay, washpay |
| withdrawal_mode | text | manual, automatic |
| withdrawal_min | decimal | Valor mínimo de saque |
| withdrawal_max | decimal | Valor máximo de saque |
| withdrawal_fee_percent | decimal | % de taxa sobre o saque |
