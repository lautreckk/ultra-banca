# Conectar Modal ao chat para deploy automático

Assim você pode pedir no chat para eu fazer o deploy do scraper sem sair do Cursor.

## 1. Instalar o Modal CLI (uma vez)

No terminal:

```bash
pip install modal
```

Ou com uv:

```bash
uv pip install modal
```

## 2. Autenticar no Modal (uma vez)

```bash
modal setup
```

Isso abre o navegador para você fazer login na Modal Labs. Depois disso o ambiente fica autenticado.

## 3. Deploy pelo chat

A partir daí, sempre que quiser publicar a versão atual do scraper, basta pedir no chat, por exemplo:

- “Faz o deploy do Modal”
- “Publica o scraper no Modal”
- “Deploy do modal_scraper_v2”

Eu vou rodar, a partir da pasta `ultra-banca`:

```bash
modal deploy modal_scraper_v2.py
```

O app no Modal se chama **ultra-banca-scraper-v2**.

## 4. Secrets no Modal

No [Dashboard da Modal](https://modal.com), o projeto precisa dos secrets:

- **supabase-ultra-banca** (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)
- **firecrawl-key** (para o scraping com Firecrawl)

Se ainda não criou, crie em **Secrets** no dashboard e associe ao app.

## Resumo

| O que              | Onde / Como                          |
|--------------------|--------------------------------------|
| Instalar CLI       | `pip install modal`                  |
| Autenticar         | `modal setup` (uma vez)              |
| Pedir deploy       | No chat: “faz deploy do modal”      |
| App deployado      | `ultra-banca-scraper-v2`             |
| Arquivo do app     | `ultra-banca/modal_scraper_v2.py`    |

Depois de `pip install modal` e `modal setup`, o deploy pelo chat funciona sempre que você pedir.
