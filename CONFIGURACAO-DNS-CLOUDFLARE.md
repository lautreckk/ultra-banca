# Configuração DNS - Cloudflare + Vercel

## Domínio: ojogodobicho.vip

---

## PASSO 1: Editar o Registro A (domínio raiz)

1. No Cloudflare, vá em **DNS → Registros**
2. Encontre o registro **A** com nome `ojogodobicho.vip`
3. Clique em **"Editar"**
4. Altere o campo **"Endereço IPv4"**:

| Campo | Valor Atual (ERRADO) | Novo Valor (CORRETO) |
|-------|---------------------|----------------------|
| Endereço IPv4 | `216.150.1.1` | `76.76.21.21` |

5. Mantenha **"Status do proxy"** como **"Somente DNS"** (nuvem CINZA)
6. Clique em **"Salvar"**

---

## PASSO 2: Verificar o Registro CNAME (www)

O registro CNAME para `www` já está correto:

| Tipo | Nome | Conteúdo | Status |
|------|------|----------|--------|
| CNAME | www | `5454bb550251b79c.vercel...` | Somente DNS (cinza) |

**Não precisa alterar nada aqui.**

---

## PASSO 3: Configurar SSL/TLS no Cloudflare

1. No menu lateral, clique em **SSL/TLS → Visão geral**
2. Selecione o modo: **Full (strict)**

---

## PASSO 4: Aguardar Propagação DNS

- A propagação pode levar de **5 minutos a 24 horas**
- Normalmente fica pronto em **15-30 minutos**

---

## PASSO 5: Verificar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá em **Settings → Domains**
3. Clique em **"Refresh"** em cada domínio
4. Aguarde até aparecer **"Valid Configuration"** em todos

---

## Configuração Final Esperada

### Cloudflare DNS:
```
Tipo    Nome              Conteúdo                    Proxy
─────────────────────────────────────────────────────────────
A       ojogodobicho.vip  76.76.21.21                 Somente DNS (cinza)
CNAME   www               5454bb550251b79c.vercel...  Somente DNS (cinza)
```

### Vercel Domains:
```
Domínio                    Status
───────────────────────────────────────
ojogodobicho.vip          ✅ Valid Configuration
www.ojogodobicho.vip      ✅ Valid Configuration
ultra-banca.vercel.app    ✅ Valid Configuration
```

---

## Teste Final

Após tudo configurado, acesse:

- https://ojogodobicho.vip
- https://www.ojogodobicho.vip
- https://ojogodobicho.vip/login
- https://ojogodobicho.vip/cadastro

Todos devem abrir sem erros de SSL.

---

## Troubleshooting

### Erro: "ERR_CERT_COMMON_NAME_INVALID"
- O SSL ainda não foi emitido
- Verifique se o proxy está **desativado** (nuvem cinza)
- Aguarde mais alguns minutos

### Erro: "DNS_PROBE_FINISHED_NXDOMAIN"
- DNS ainda não propagou
- Aguarde até 30 minutos
- Teste com: `nslookup ojogodobicho.vip`

### Domínio não aparece como "Valid" no Vercel
- Verifique se o IP está correto: `76.76.21.21`
- Clique em "Refresh" no Vercel
