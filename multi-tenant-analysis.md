# Plano de Migração: Arquitetura Multi-Tenant SaaS

## Resumo Executivo

Transformar a plataforma Ultra Banca de single-tenant para multi-tenant SaaS, onde **um único código e um único projeto Supabase** gerencia múltiplas bancas simultaneamente, identificando cada uma pelo domínio (ex: banca1.com, banca2.com).

**Premissas:**
- A banca atual será a "Banca Principal" (Default) - ID fixo para preservar funcionamento
- Sistema atual não pode parar de funcionar durante migração
- Isolamento total: Admin da Banca A nunca vê dados da Banca B

---

## 1. Estrutura do Banco de Dados

### 1.1 Nova Tabela: `platforms`

```sql
CREATE TABLE public.platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  domain VARCHAR(255) NOT NULL UNIQUE,        -- ex: "ultrabanca.vip", "banca2.com"
  slug VARCHAR(50) NOT NULL UNIQUE,           -- ex: "ultrabanca", "banca2" (para subdomínios)
  name VARCHAR(255) NOT NULL,                 -- Nome da banca

  -- Configurações (migradas de platform_config)
  settings JSONB DEFAULT '{}'::jsonb,         -- Configurações gerais
  theme_config JSONB DEFAULT '{}'::jsonb,     -- Cores, logo, etc.

  -- Financeiro
  wallet_id_master UUID,                      -- Carteira principal do dono da banca
  active_gateway VARCHAR(50) DEFAULT 'bspay',
  gateway_credentials JSONB DEFAULT '{}'::jsonb, -- Credenciais do gateway por banca

  -- Limites
  deposit_min NUMERIC(12,2) DEFAULT 10.00,
  deposit_max NUMERIC(12,2) DEFAULT 10000.00,
  withdrawal_min NUMERIC(12,2) DEFAULT 20.00,
  withdrawal_max NUMERIC(12,2) DEFAULT 5000.00,
  bet_min NUMERIC(12,2) DEFAULT 1.00,
  bet_max NUMERIC(12,2) DEFAULT 1000.00,

  -- Status
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_platforms_domain ON platforms(domain);
CREATE INDEX idx_platforms_slug ON platforms(slug);
CREATE INDEX idx_platforms_ativo ON platforms(ativo);

-- Inserir banca atual como default (preservar ID se existir)
INSERT INTO platforms (id, domain, slug, name, ativo)
VALUES (
  'DEFAULT_PLATFORM_UUID',  -- UUID fixo para a banca atual
  'ultrabanca.vip',
  'ultrabanca',
  'Ultra Banca',
  true
);
```

### 1.2 Tabelas que Precisam de `platform_id`

| Tabela | Prioridade | Observações |
|--------|------------|-------------|
| `profiles` | CRÍTICA | Todos os usuários pertencem a uma plataforma |
| `apostas` | CRÍTICA | Apostas são isoladas por plataforma |
| `pagamentos` | CRÍTICA | Depósitos isolados |
| `saques` | CRÍTICA | Saques isolados |
| `transactions` | CRÍTICA | Transações isoladas |
| `admin_roles` | CRÍTICA | Admins pertencem a uma plataforma |
| `promotores` | ALTA | Promotores são por plataforma |
| `promotor_referidos` | ALTA | Herda de promotores |
| `promotor_comissoes` | ALTA | Herda de promotores |
| `promotor_roles` | ALTA | Herda de promotores |
| `resultados` | N/A | **COMPARTILHADO** - Todos usam mesmos resultados oficiais |
| `modalidades_config` | MÉDIA | Configuração por plataforma |
| `bonus_deposito_config` | MÉDIA | Configuração por plataforma |
| `bonus_deposito_aplicados` | MÉDIA | Histórico por plataforma |
| `promocoes` | MÉDIA | Promoções por plataforma |
| `propagandas` | MÉDIA | Propagandas por plataforma |
| `webhooks_config` | MÉDIA | Webhooks por plataforma |
| `webhook_logs` | BAIXA | Logs por plataforma |
| `gateway_config` | MÉDIA | Pode ser por plataforma |
| `audit_logs` | BAIXA | Logs por plataforma |
| `comissoes_indicacao` | MÉDIA | Comissões por plataforma |
| `verificacao_apostas` | MÉDIA | Verificações por plataforma |
| `evolution_*` | BAIXA | WhatsApp por plataforma |
| `system_settings` | MÉDIA | Configurações por plataforma |
| `page_views` | BAIXA | Analytics por plataforma |
| `visitor_presence` | BAIXA | Presença por plataforma |
| `ultimo_ganhador` | BAIXA | Por plataforma |

### 1.3 Migração SQL para Adicionar `platform_id`

```sql
-- Exemplo para tabela profiles
ALTER TABLE profiles
ADD COLUMN platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

-- Definir plataforma default para registros existentes
UPDATE profiles SET platform_id = 'DEFAULT_PLATFORM_UUID' WHERE platform_id IS NULL;

-- Tornar NOT NULL após migração
ALTER TABLE profiles ALTER COLUMN platform_id SET NOT NULL;

-- Criar índice
CREATE INDEX idx_profiles_platform ON profiles(platform_id);

-- Repetir para todas as 26 tabelas listadas acima
```

---

## 2. Row Level Security (RLS)

### 2.1 Funções Helper

```sql
-- Função para obter platform_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_platform_id()
RETURNS UUID AS $$
  SELECT platform_id
  FROM profiles
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função para verificar se é admin da plataforma
CREATE OR REPLACE FUNCTION is_platform_admin(p_platform_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_roles ar
    JOIN profiles p ON ar.user_id = p.id
    WHERE ar.user_id = auth.uid()
    AND p.platform_id = p_platform_id
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função para verificar se é super_admin (acesso a todas as plataformas)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 2.2 Políticas RLS por Tabela

```sql
-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own platform profiles" ON profiles
  FOR SELECT USING (
    platform_id = get_user_platform_id()
    OR is_super_admin()
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage platform profiles" ON profiles
  FOR ALL USING (
    is_platform_admin(platform_id)
    OR is_super_admin()
  );

-- APOSTAS
ALTER TABLE apostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bets" ON apostas
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own bets" ON apostas
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND platform_id = get_user_platform_id()
  );

CREATE POLICY "Admins can view platform bets" ON apostas
  FOR SELECT USING (
    is_platform_admin(platform_id)
    OR is_super_admin()
  );

-- PAGAMENTOS
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON pagamentos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage platform payments" ON pagamentos
  FOR ALL USING (
    is_platform_admin(platform_id)
    OR is_super_admin()
  );

-- Repetir padrão para todas as tabelas...
```

---

## 3. Middleware - Resolução de Domínio

### 3.1 Fluxo do Middleware

```
Requisição chega (ex: banca2.com/apostas)
        ↓
  MIDDLEWARE (middleware.ts)
        ↓
  1. Extrair host da requisição
        ↓
  2. Buscar platform_id no banco pelo domínio
        ↓
  3. Armazenar platform_id em:
     - Cookie (para client)
     - Header customizado (para server actions)
        ↓
  4. Verificar autenticação (fluxo atual)
        ↓
  5. Verificar se user pertence à plataforma
        ↓
  6. Continuar para rota/página
```

### 3.2 Modificações no Middleware

**Arquivo:** `/lib/supabase/middleware.ts`

```typescript
// Função para resolver plataforma pelo domínio
async function resolvePlatformByDomain(
  supabase: SupabaseClient,
  host: string
): Promise<{ platformId: string; platform: Platform } | null> {
  // Remove porta se existir (localhost:3000)
  const domain = host.split(':')[0];

  const { data: platform } = await supabase
    .from('platforms')
    .select('*')
    .eq('domain', domain)
    .eq('ativo', true)
    .single();

  if (!platform) {
    // Tentar por slug (subdomínio)
    const subdomain = domain.split('.')[0];
    const { data: platformBySlug } = await supabase
      .from('platforms')
      .select('*')
      .eq('slug', subdomain)
      .eq('ativo', true)
      .single();

    if (platformBySlug) {
      return { platformId: platformBySlug.id, platform: platformBySlug };
    }
    return null;
  }

  return { platformId: platform.id, platform };
}

// No início do middleware, antes da verificação de auth:
export async function updateSession(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost';

  // Criar cliente Supabase
  const supabase = createServerClient(...);

  // Resolver plataforma pelo domínio
  const platformResult = await resolvePlatformByDomain(supabase, host);

  if (!platformResult) {
    // Plataforma não encontrada - redirecionar para página de erro
    return NextResponse.redirect(new URL('/platform-not-found', request.url));
  }

  const { platformId, platform } = platformResult;

  // Armazenar platform_id em cookie para acesso no client
  response.cookies.set('platform_id', platformId, {
    httpOnly: false, // Client precisa acessar
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Armazenar config da plataforma em cookie (para hydration)
  response.cookies.set('platform_config', JSON.stringify(platform), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Continuar com verificação de auth existente...
  // Mas agora verificar se user.platform_id === platformId
}
```

### 3.3 Verificação de Pertencimento à Plataforma

```typescript
// Após obter o user autenticado:
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  // Buscar profile para verificar platform_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_id')
    .eq('id', user.id)
    .single();

  if (profile?.platform_id !== platformId) {
    // Usuário não pertence a esta plataforma
    // Opção 1: Redirecionar para login
    // Opção 2: Fazer logout e redirecionar
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

## 4. Modificações no Código

### 4.1 Server Actions - Padrão de Filtro

**Criar helper para obter platform_id:**

```typescript
// /lib/utils/platform.ts
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function getPlatformId(): Promise<string> {
  // Opção 1: Do cookie (definido pelo middleware)
  const cookieStore = await cookies();
  const platformId = cookieStore.get('platform_id')?.value;

  if (platformId) return platformId;

  // Opção 2: Do profile do usuário autenticado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_id')
    .eq('id', user.id)
    .single();

  if (!profile?.platform_id) throw new Error('Platform não encontrada');

  return profile.platform_id;
}
```

**Exemplo de modificação em server action:**

```typescript
// /lib/admin/actions/users.ts - ANTES
export async function getUsers(params) {
  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  // ... filtros
  return query;
}

// /lib/admin/actions/users.ts - DEPOIS
export async function getUsers(params) {
  const supabase = await createClient();
  const platformId = await getPlatformId();

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('platform_id', platformId);  // <-- FILTRO ADICIONADO

  // ... filtros
  return query;
}
```

### 4.2 Arquivos que Precisam de Modificação

| Arquivo | Funções | Qtd. Filtros |
|---------|---------|--------------|
| `/lib/admin/actions/promotores.ts` | 17 funções | ~25 |
| `/lib/admin/actions/users.ts` | 4 funções | ~8 |
| `/lib/admin/actions/financial.ts` | 6 funções | ~10 |
| `/lib/admin/actions/dashboard.ts` | 4 funções | ~12 |
| `/lib/admin/actions/bets.ts` | 2 funções | ~3 |
| `/lib/admin/actions/bonus-config.ts` | 8 funções | ~8 |
| `/lib/admin/actions/analytics.ts` | 3 funções | ~5 |
| `/lib/admin/actions/audit.ts` | 2 funções | ~2 |
| `/lib/admin/actions/ads.ts` | 4 funções | ~4 |
| `/lib/admin/actions/inactive-leads.ts` | 2 funções | ~2 |
| `/lib/promotor/actions/dashboard.ts` | 4 funções | ~6 |
| `/lib/promotor/actions/apostas.ts` | 2 funções | ~2 |
| `/lib/actions/apostas.ts` | 3 funções | ~3 |
| `/lib/actions/auth.ts` | 4 funções | ~4 |
| `/lib/actions/financial.ts` | 2 funções | ~2 |
| **TOTAL** | ~67 funções | ~96 filtros |

### 4.3 Modificação do PlatformConfig

**Arquivo:** `/lib/admin/actions/platform-config.ts`

```typescript
// ANTES - Busca singleton
export async function getPlatformConfig() {
  const { data } = await supabase
    .from('platform_config')
    .select('*')
    .limit(1)
    .single();
  return data;
}

// DEPOIS - Busca por platform_id (da tabela platforms)
export async function getPlatformConfig() {
  const platformId = await getPlatformId();

  const { data: platform } = await supabase
    .from('platforms')
    .select('*')
    .eq('id', platformId)
    .single();

  // Converter formato platforms para PlatformConfig
  return {
    id: platform.id,
    site_name: platform.name,
    logo_url: platform.theme_config?.logo_url,
    color_primary: platform.theme_config?.color_primary,
    // ... mapear demais campos
    ...platform.settings,
  };
}
```

---

## 5. Frontend - Context Multi-Tenant

### 5.1 Novo Context para Platform ID

```typescript
// /contexts/tenant-context.tsx
'use client';

import { createContext, useContext } from 'react';

interface TenantContext {
  platformId: string;
  domain: string;
  isMultiTenant: boolean;
}

const TenantContext = createContext<TenantContext | null>(null);

export function TenantProvider({
  platformId,
  domain,
  children
}: {
  platformId: string;
  domain: string;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={{ platformId, domain, isMultiTenant: true }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
```

### 5.2 Atualização do Root Layout

```typescript
// /app/layout.tsx
export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const platformId = cookieStore.get('platform_id')?.value || 'DEFAULT_PLATFORM_UUID';
  const platformConfigStr = cookieStore.get('platform_config')?.value;

  // Buscar config da plataforma (se não tiver no cookie)
  const config = platformConfigStr
    ? JSON.parse(platformConfigStr)
    : await getPlatformConfig();

  return (
    <html>
      <body>
        <TenantProvider platformId={platformId} domain={config.domain}>
          <ConfigProvider config={config}>
            <ThemeInjector />
            {children}
          </ConfigProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
```

---

## 6. Fluxo de Cadastro Multi-Tenant

### 6.1 Trigger para Associar User à Plataforma

```sql
-- Modificar trigger handle_new_user para incluir platform_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_platform_id UUID;
BEGIN
  -- Obter platform_id do metadata (definido no signup)
  v_platform_id := (NEW.raw_user_meta_data->>'platform_id')::UUID;

  -- Se não tiver, usar default
  IF v_platform_id IS NULL THEN
    v_platform_id := 'DEFAULT_PLATFORM_UUID';
  END IF;

  INSERT INTO public.profiles (
    id,
    cpf,
    nome,
    telefone,
    platform_id  -- NOVO
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'nome',
    NEW.raw_user_meta_data->>'telefone',
    v_platform_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.2 Modificação no Signup

```typescript
// /lib/actions/auth.ts
export async function signUp(formData: SignUpData) {
  const platformId = await getPlatformId(); // Do cookie/context

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        cpf: formData.cpf,
        nome: formData.nome,
        telefone: formData.telefone,
        platform_id: platformId,  // <-- NOVO
      },
    },
  });
}
```

---

## 7. Ordem de Implementação

| # | Fase | Descrição | Risco |
|---|------|-----------|-------|
| 1 | **Banco de Dados** | Criar tabela `platforms` | Baixo |
| 2 | **Migração** | Adicionar `platform_id` às tabelas (com default) | Médio |
| 3 | **RLS** | Implementar políticas de segurança | Médio |
| 4 | **Middleware** | Resolução de domínio | Alto |
| 5 | **Helper** | Função `getPlatformId()` | Baixo |
| 6 | **Server Actions** | Adicionar filtros (96 pontos) | Alto |
| 7 | **Frontend Context** | TenantProvider | Baixo |
| 8 | **Testes** | Testar isolamento entre plataformas | Crítico |

---

## 8. Verificação e Testes

### 8.1 Checklist de Testes

- [ ] Criar segunda plataforma (banca2.com)
- [ ] Cadastrar usuário na banca2
- [ ] Verificar que usuário da banca1 NÃO vê dados da banca2
- [ ] Verificar que admin da banca1 NÃO vê usuários da banca2
- [ ] Verificar que apostas são isoladas
- [ ] Verificar que depósitos/saques são isolados
- [ ] Verificar que promotores são isolados
- [ ] Testar login cross-platform (deve falhar ou redirecionar)

### 8.2 Queries de Verificação

```sql
-- Verificar isolamento de profiles
SELECT p.id, p.nome, pl.name as plataforma
FROM profiles p
JOIN platforms pl ON p.platform_id = pl.id;

-- Verificar que não há registros órfãos
SELECT COUNT(*) FROM profiles WHERE platform_id IS NULL;
SELECT COUNT(*) FROM apostas WHERE platform_id IS NULL;

-- Verificar RLS funcionando (como usuário específico)
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM profiles; -- Deve retornar apenas da plataforma do user
```

---

## 9. Considerações de Performance

- **Índices**: Criar índice em `platform_id` em todas as tabelas
- **Cache**: Platform config pode ser cacheado por domínio (Redis/Vercel KV)
- **RLS**: Usar `SECURITY DEFINER` nas funções helper para evitar queries aninhadas

---

## 10. Rollback Plan

Se algo der errado:

1. **Banco**: Coluna `platform_id` é adicionada como nullable inicialmente
2. **Código**: Manter flag `MULTI_TENANT_ENABLED` para ativar/desativar
3. **Middleware**: Fallback para `DEFAULT_PLATFORM_UUID` se domínio não encontrado
