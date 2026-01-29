# Sistema de Tracking - Facebook Pixel + Conversions API

## Visão Geral

O sistema de tracking permite rastrear eventos de usuários para o Facebook Ads, utilizando duas camadas:

1. **Facebook Pixel (Client-side)** - Script que roda no navegador do usuário
2. **Conversions API (Server-side)** - Chamadas feitas pelo servidor para maior precisão

## Configuração

### No Admin

Acesse **Admin > Configurações > Marketing** e configure:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| Facebook Pixel ID | ID do pixel obtido no Meta Business Manager | `911032131878281` |
| Facebook Access Token (CAPI) | Token para Conversions API | `EAAKBdAGZBN6ABQ...` |

### Obtendo as Credenciais

1. Acesse [Meta Business Manager](https://business.facebook.com/)
2. Vá em **Events Manager > Data Sources**
3. Selecione seu Pixel
4. **Pixel ID**: Visível no topo da página
5. **Access Token**: Vá em **Settings > Generate Access Token**

## Eventos Rastreados

### 1. PageView (Automático)

Disparado automaticamente em todas as páginas quando o Pixel está configurado.

```javascript
fbq('track', 'PageView');
```

### 2. CompleteRegistration (Cadastro)

Disparado quando o usuário completa o cadastro com sucesso.

**Arquivo:** `components/auth/register-form.tsx`

```typescript
import { trackCompleteRegistration } from '@/lib/tracking/facebook';

// Após cadastro bem-sucedido
trackCompleteRegistration();
```

### 3. Purchase (Depósito Confirmado)

Disparado quando um depósito PIX é confirmado.

**Arquivo:** `app/recarga-pix/page.tsx`

```typescript
import { trackPurchase, generateEventId } from '@/lib/tracking/facebook';

// Quando status === 'PAID'
const eventId = generateEventId('dep', paymentData.id);
trackPurchase(paymentData.valor, eventId);
```

**Parâmetros enviados:**
- `value`: Valor do depósito em reais
- `currency`: 'BRL'
- `eventID`: ID único para deduplicação

### 4. Lead (Clique WhatsApp)

Disponível para uso quando implementar link do WhatsApp.

```typescript
import { trackLead } from '@/lib/tracking/facebook';

// No onClick do link
onClick={() => trackLead()}
```

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      NAVEGADOR                          │
│                                                         │
│  ┌─────────────┐     ┌─────────────────────────────┐   │
│  │   Página    │────▶│  lib/tracking/facebook.ts   │   │
│  │  (React)    │     │  - trackCompleteRegistration │   │
│  └─────────────┘     │  - trackPurchase             │   │
│                      │  - trackLead                 │   │
│                      └──────────────┬──────────────┘   │
│                                     │                   │
│                                     ▼                   │
│                      ┌─────────────────────────────┐   │
│                      │     Facebook Pixel (fbq)     │   │
│                      └──────────────┬──────────────┘   │
└─────────────────────────────────────┼───────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │         FACEBOOK            │
                        │      Events Manager         │
                        └─────────────────────────────┘
                                      ▲
                                      │
┌─────────────────────────────────────┼───────────────────┐
│                      SERVIDOR       │                   │
│                                     │                   │
│  ┌─────────────────────────────────┴──────────────┐   │
│  │      lib/tracking/facebook-capi.ts              │   │
│  │      - sendCAPIEvent                            │   │
│  │      - trackRegistrationCAPI                    │   │
│  │      - trackPurchaseCAPI                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Deduplicação

Para evitar eventos duplicados entre Pixel e CAPI, usamos o mesmo `eventID`:

```typescript
// Client-side (Pixel)
const eventId = generateEventId('dep', paymentData.id);
trackPurchase(paymentData.valor, eventId);

// Server-side (CAPI) - mesmo eventId
await trackPurchaseCAPI({
  eventId: eventId,
  value: valor,
  // ...
});
```

O Facebook automaticamente deduplica eventos com mesmo `event_id` recebidos em até 48 horas.

## Conversions API (CAPI)

### Quando Usar

A CAPI é recomendada para eventos importantes como `Purchase`, pois:
- Não depende do navegador do usuário
- Não é bloqueada por ad blockers
- Fornece dados mais precisos

### Server Action Disponível

```typescript
import { trackPurchaseCAPI } from '@/lib/tracking/facebook-capi';

await trackPurchaseCAPI({
  eventId: 'dep_abc123',
  value: 100.00,
  email: 'usuario@email.com',     // opcional
  phone: '11999999999',           // opcional
  clientIp: '192.168.1.1',        // opcional
  clientUserAgent: 'Mozilla/...', // opcional
});
```

### Dados do Usuário (Hashing)

A CAPI faz hash SHA256 dos dados pessoais antes de enviar:

```typescript
// Email e telefone são hasheados automaticamente
email: 'teste@email.com' → sha256('teste@email.com')
phone: '11999999999'     → sha256('5511999999999')
```

## Arquivos do Sistema

```
lib/tracking/
├── facebook.ts       # Utilitários client-side (Pixel)
└── facebook-capi.ts  # Server Actions (CAPI)

Integrações:
├── components/auth/register-form.tsx  # CompleteRegistration
└── app/recarga-pix/page.tsx           # Purchase
```

## Testando

### 1. Facebook Events Manager

1. Acesse [Events Manager](https://www.facebook.com/events_manager/)
2. Selecione seu Pixel
3. Vá em **Test Events**
4. Copie o código de teste e adicione ao Pixel
5. Realize ações no site e verifique se aparecem

### 2. Browser DevTools

Abra o console (F12) e procure por logs:

```
[Pixel] Evento CompleteRegistration disparado
[Pixel] Evento Purchase disparado { value: 100, currency: 'BRL', eventID: 'dep_xxx' }
```

### 3. Verificar Pixel Helper

Instale a extensão [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) no Chrome para debug visual.

## Troubleshooting

### Pixel não dispara eventos

1. Verifique se o Pixel ID está configurado no Admin
2. Verifique se não há ad blocker ativo
3. Abra o console e procure por erros

### CAPI retorna erro

1. Verifique se o Access Token está correto
2. Verifique se o token tem permissões de CAPI
3. Consulte os logs do servidor

### Eventos duplicados

- Certifique-se de usar o mesmo `eventID` no Pixel e CAPI
- O Facebook deduplica automaticamente em 48h

## Referências

- [Facebook Pixel Documentation](https://developers.facebook.com/docs/meta-pixel/)
- [Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/)
- [Event Deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
