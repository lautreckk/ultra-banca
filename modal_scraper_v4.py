"""
Ultra Banca - Scraper de Resultados v4
Correções: payout atômico via RPC, cron com timezone, parsing robusto
"""

import modal
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import re

# Fuso horário de Brasília (UTC-3)
FUSO_BRASILIA = timezone(timedelta(hours=-3))

def agora_brasilia() -> datetime:
    """Retorna datetime atual no horário de Brasília"""
    return datetime.now(FUSO_BRASILIA)

def hoje_brasilia() -> str:
    """Retorna data atual de Brasília no formato YYYY-MM-DD"""
    return agora_brasilia().strftime("%Y-%m-%d")

# Criar app Modal separado
app = modal.App("ultra-banca-scraper-v4")

# Imagem com Firecrawl (fallback) + requests (primário)
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "firecrawl-py",
    "beautifulsoup4",
    "supabase",
    "requests",
)

# Secrets
supabase_secret = modal.Secret.from_name("supabase-ultra-banca")
firecrawl_secret = modal.Secret.from_name("firecrawl-key")

# =============================================================================
# CONFIGURACAO DAS BANCAS - MULTIPLAS FONTES
# =============================================================================

# Fonte 1: ResultadoFacil (principal)
FONTE_RESULTADOFACIL = {
    "nome": "ResultadoFacil",
    "base_url": "https://www.resultadofacil.com.br",
    "url_pattern": "/resultado-do-jogo-do-bicho/{estado}/do-dia/{data}",
}

# Fonte 2: PortalBrasil (backup)
FONTE_PORTALBRASIL = {
    "nome": "PortalBrasil",
    "base_url": "https://portalbrasil.net",
    "url_pattern": "/jogodobicho/{estado_slug}/",
}

# Mapeamento de estados para cada fonte
ESTADOS_CONFIG = {
    "RJ": {
        "url_param": "RJ",
        "banca": "RIO/FEDERAL",
        "portalbrasil_slug": None,  # RJ fica na página principal
    },
    "BA": {
        "url_param": "BA",
        "banca": "BAHIA",
        "portalbrasil_slug": "bahia",
    },
    "GO": {
        "url_param": "GO",
        "banca": "LOOK/GOIAS",
        "portalbrasil_slug": "goias",
    },
    "CE": {
        "url_param": "CE",
        "banca": "LOTECE",
        "portalbrasil_slug": "ceara",
    },
    "PE": {
        "url_param": "PE",
        "banca": "LOTEP",
        "portalbrasil_slug": "pernambuco",
    },
    "PB": {
        "url_param": "PB",
        "banca": "PARAIBA",
        "portalbrasil_slug": "paraiba",
    },
    "SP": {
        "url_param": "SP",
        "banca": "SAO-PAULO",
        "portalbrasil_slug": "sao-paulo",
    },
    "MG": {
        "url_param": "MG",
        "banca": "MINAS-GERAIS",
        "portalbrasil_slug": "minas-gerais",
    },
    "DF": {
        "url_param": "DF",
        "banca": "BRASILIA",
        "portalbrasil_slug": "brasilia-df",
    },
    "RN": {
        "url_param": "RN",
        "banca": "RIO-GRANDE-NORTE",
        "portalbrasil_slug": "rio-grande-do-norte",
    },
    "RS": {
        "url_param": "RS",
        "banca": "RIO-GRANDE-SUL",
        "portalbrasil_slug": "rio-grande-do-sul",
    },
    "SE": {
        "url_param": "SE",
        "banca": "SERGIPE",
        "portalbrasil_slug": "sergipe",
    },
    "PR": {
        "url_param": "PR",
        "banca": "PARANA",
        "portalbrasil_slug": "parana",
    },
    "FED": {
        "url_param": "banca-federal",
        "banca": "FEDERAL",
        "portalbrasil_slug": None,
    },
    "NAC": {
        "url_param": None,  # URL especial - não usa padrão
        "banca": "NACIONAL",
        "portalbrasil_slug": None,
        "custom_url": "/resultados-loteria-nacional-do-dia-{data}",
    },
    "BS": {
        "url_param": None,  # URL especial - lookgoias.com
        "banca": "BOASORTE",
        "portalbrasil_slug": None,
        "custom_scraper": True,
    },
}

BASE_URL = "https://www.resultadofacil.com.br"

# =============================================================================
# HORARIOS ESPERADOS POR BANCA (para skip inteligente)
# =============================================================================

HORARIOS_ESPERADOS = {
    "RJ": 6,    # RIO/FEDERAL: 09:20, 11:00, 14:20, 16:00, 18:20, 21:20
    "BA": 12,   # BAHIA: 6 BAHIA + 6 MALUCA
    "GO": 8,    # LOOK/GOIAS: 07-23h
    "CE": 4,    # LOTECE: 11, 14, 15:45, 19
    "PE": 16,   # LOTEP: muitos horários
    "PB": 11,   # PARAIBA: 7 + 4 LOTEP
    "SP": 9,    # SAO-PAULO: 08-20h
    "MG": 5,    # MINAS-GERAIS: 12-21h
    "DF": 13,   # LBR/BRASILIA: 00-23h
    "NAC": 8,   # NACIONAL: 02-23h (inclui 23HS)
    "RN": 4,    # RIO-GRANDE-NORTE
    "RS": 5,    # RIO-GRANDE-SUL: 11, 14, 16, 18, 21
    "SE": 5,    # SERGIPE
    "PR": 2,    # PARANA
    "FED": 1,   # FEDERAL (só qua/sáb)
    "BS": 6,    # BOASORTE: 09:20, 11:20, 14:20, 16:20, 18:20, 21:20
}


# =============================================================================
# LOGGING HELPERS
# =============================================================================

def log_info(estado: str, fonte: str, msg: str):
    """Log informativo com formato padronizado"""
    print(f"[{estado}] 📡 {fonte}: {msg}")

def log_success(estado: str, fonte: str, msg: str):
    """Log de sucesso"""
    print(f"[{estado}] ✅ {fonte}: {msg}")

def log_warning(estado: str, fonte: str, msg: str):
    """Log de aviso"""
    print(f"[{estado}] ⚠️  {fonte}: {msg}")

def log_error(estado: str, fonte: str, msg: str):
    """Log de erro"""
    print(f"[{estado}] ❌ {fonte}: {msg}")

def log_fallback(estado: str, de: str, para: str, motivo: str):
    """Log de fallback entre fontes"""
    print(f"[{estado}] 🔄 FALLBACK: {de} → {para} (motivo: {motivo})")


# =============================================================================
# FONTE 2: PORTALBRASIL.NET (BACKUP)
# =============================================================================

def scrape_portalbrasil(estado: str, data: str, banca: str) -> list:
    """
    Scrape do PortalBrasil.net - fonte secundária com bicho incluso
    """
    import requests
    from bs4 import BeautifulSoup

    config = ESTADOS_CONFIG.get(estado)
    if not config or not config.get("portalbrasil_slug"):
        log_warning(estado, "PortalBrasil", "Estado não configurado para esta fonte")
        return []

    url = f"{FONTE_PORTALBRASIL['base_url']}/jogodobicho/{config['portalbrasil_slug']}/"
    log_info(estado, "PortalBrasil", f"Acessando: {url}")

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        html = response.text
        log_info(estado, "PortalBrasil", f"HTML recebido: {len(html)} bytes")

        soup = BeautifulSoup(html, "html.parser")
        resultados = parse_portalbrasil(soup, data, banca, estado)

        if resultados:
            log_success(estado, "PortalBrasil", f"Encontrados {len(resultados)} resultados")
        else:
            log_warning(estado, "PortalBrasil", "Nenhum resultado encontrado")

        return resultados

    except requests.exceptions.Timeout:
        log_error(estado, "PortalBrasil", "Timeout ao acessar")
        return []
    except requests.exceptions.RequestException as e:
        log_error(estado, "PortalBrasil", f"Erro de conexão: {e}")
        return []
    except Exception as e:
        log_error(estado, "PortalBrasil", f"Erro inesperado: {e}")
        return []


def parse_portalbrasil(soup, data: str, banca: str, estado: str) -> list:
    """
    Parser específico para PortalBrasil.net
    Formato: "9866-17 (Macaco)" = milhar-grupo (bicho)
    """
    resultados = []

    # PortalBrasil usa estrutura com h3 ou h4 para títulos das loterias
    # Exemplo: "12h00 – Alvorada MG"
    headers = soup.find_all(['h2', 'h3', 'h4'])

    for header in headers:
        header_text = header.get_text(strip=True)

        # Busca horário no formato "12h00" ou "12:00"
        horario_match = re.search(r'(\d{1,2})[h:H](\d{2})', header_text)
        if not horario_match:
            continue

        hora = horario_match.group(1).zfill(2)
        minuto = horario_match.group(2)
        horario = f"{hora}:{minuto}"

        # Normalização de horário por banca
        if banca == "LOTECE" and horario in ("10:00", "12:00"):
            horario = "11:00"

        # Identifica loteria
        loteria = identificar_loteria(header_text)

        # Busca os prêmios após o header
        # PortalBrasil usa formato: "1º: 9866-17 (Macaco)"
        premios = []

        # Procura no próximo elemento ou nos irmãos
        next_elem = header.find_next_sibling()
        content_text = ""

        # Coleta texto dos próximos elementos até encontrar outro header
        for _ in range(10):
            if next_elem is None:
                break
            if next_elem.name in ['h2', 'h3', 'h4', 'hr']:
                break
            content_text += " " + next_elem.get_text()
            next_elem = next_elem.find_next_sibling()

        # Extrai prêmios no formato "1º: 9866-17 (Macaco)" ou "9866-17 (Macaco)"
        # Padrão: 4 dígitos + hífen + 2 dígitos + bicho entre parênteses
        premio_pattern = r'(\d{4})-(\d{2})\s*\(([^)]+)\)'
        matches = re.findall(premio_pattern, content_text)

        if matches:
            for milhar, grupo, bicho in matches[:7]:
                premios.append({
                    "milhar": milhar,
                    "grupo": grupo,
                    "bicho": bicho.strip(),
                })

        # Fallback: busca só milhares se não encontrou padrão completo
        if len(premios) < 5:
            milhar_pattern = r'[1-7][ºª°]\s*[:\-]?\s*(\d{4})'
            milhar_matches = re.findall(milhar_pattern, content_text)
            if len(milhar_matches) >= 5:
                premios = [{"milhar": m, "grupo": "", "bicho": ""} for m in milhar_matches[:7]]

        if len(premios) >= 5:
            resultados.append({
                "data": data,
                "horario": horario,
                "banca": banca,
                "loteria": loteria,
                "premios": premios,
                "fonte": "PortalBrasil",
            })
            log_info(estado, "PortalBrasil", f"  → {horario} {loteria}: 1º={premios[0]['milhar']} ({premios[0].get('bicho', '')})")

    return resultados


# =============================================================================
# FONTE ESPECIAL: FEDERAL (usa pagina de ultimos resultados)
# =============================================================================

def scrape_federal_requests(data: str) -> list:
    """
    Scrape especifico para Federal - usa /ultimos-resultados-da-federal
    que lista todos os resultados recentes (a pagina por data retorna vazio).
    Filtra pelo resultado da data solicitada.
    """
    import requests
    from bs4 import BeautifulSoup

    url = "https://www.resultadofacil.com.br/ultimos-resultados-da-federal"
    log_info("FED", "Requests/Federal", f"Acessando: {url}")

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        html = response.text
        log_info("FED", "Requests/Federal", f"HTML recebido: {len(html)} bytes")

        soup = BeautifulSoup(html, "html.parser")

        # Converter data alvo de YYYY-MM-DD para DD/MM/YYYY para match
        parts = data.split("-")
        data_formatada = f"{parts[2]}/{parts[1]}/{parts[0]}"

        # Buscar todos os h3 com classe h4 que contem resultados
        resultados = []
        for h3 in soup.find_all("h3", class_="h4"):
            titulo = h3.get_text(strip=True)

            # Verificar se o titulo contem a data alvo (formato: "dia 04/02/2026")
            if data_formatada not in titulo:
                continue

            log_info("FED", "Requests/Federal", f"Encontrado resultado: {titulo}")

            # Buscar a tabela de premios dentro do mesmo container
            container = h3.find_parent("div")
            table = container.find("table") if container else None

            if not table:
                log_warning("FED", "Requests/Federal", "Tabela de premios nao encontrada")
                continue

            # Extrair premios da tabela
            rows = table.find_all("tr")
            premios = []
            for row in rows:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    premio_num = cells[0].get_text(strip=True)  # "1º", "2º", etc

                    # Pular linhas que não são prêmios (soma, multiplicação, etc.)
                    # Prêmios válidos começam com dígito: "1º", "2º", "1", "2", etc.
                    if not re.search(r'\d', premio_num):
                        continue

                    milhar = cells[1].get_text(strip=True)       # "4287"
                    grupo = cells[2].get_text(strip=True)        # "22"
                    bicho = cells[3].get_text(strip=True) if len(cells) >= 4 else ""  # "Tigre"

                    # Limpar milhar (remover texto extra)
                    milhar_clean = re.sub(r'[^\d]', '', milhar)

                    if milhar_clean and len(milhar_clean) >= 3 and len(milhar_clean) <= 4:
                        premios.append({
                            "milhar": milhar_clean.zfill(4),
                            "grupo": re.sub(r'[^\d]', '', grupo),
                            "bicho": bicho.strip(),
                        })

            if len(premios) >= 5:
                resultados.append({
                    "data": data,
                    "horario": "19:00",
                    "banca": "FEDERAL",
                    "loteria": "FEDERAL",
                    "premios": premios[:7],
                    "fonte": "Requests/Federal",
                })
                log_success("FED", "Requests/Federal",
                    f"Federal {data}: 1º={premios[0]['milhar']} ({premios[0].get('bicho', '')})")
            break  # Só precisa do primeiro match

        return resultados

    except Exception as e:
        log_error("FED", "Requests/Federal", f"Erro: {e}")
        return []


# =============================================================================
# FONTE ESPECIAL: BOASORTE GOIAS (usa lookgoias.com)
# =============================================================================

def scrape_boasorte_requests(data: str) -> list:
    """
    Scrape especifico para Boa Sorte Goias - usa lookgoias.com
    URL: https://lookgoias.com/boa-sorte-loterias-DD-MM-YYYY
    Horarios: 09:20, 11:20, 14:20, 16:20, 18:20, 21:20
    """
    import requests
    from bs4 import BeautifulSoup

    # Converter data de YYYY-MM-DD para DD-MM-YYYY
    parts = data.split("-")
    data_url = f"{parts[2]}-{parts[1]}-{parts[0]}"
    url = f"https://lookgoias.com/boa-sorte-loterias-{data_url}"
    log_info("BS", "Requests/BoaSorte", f"Acessando: {url}")

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        html = response.text
        log_info("BS", "Requests/BoaSorte", f"HTML recebido: {len(html)} bytes")

        soup = BeautifulSoup(html, "html.parser")

        # Horarios esperados da Boa Sorte
        horarios_boasorte = {
            "09": "09:20", "9": "09:20",
            "11": "11:20",
            "14": "14:20",
            "16": "16:20",
            "18": "18:20",
            "21": "21:20",
        }

        resultados = []

        # Buscar headers com horarios (h2, h3, h4, strong)
        for header in soup.find_all(["h2", "h3", "h4", "strong", "p"]):
            header_text = header.get_text(strip=True)

            # Busca horário no texto (ex: "09:20", "09h", "9h", "09hs", "9 horas")
            horario_match = re.search(r'(\d{1,2})(?::(\d{2})|\s*(?:[hH]|hs|horas)\s*(\d{2})?)', header_text)
            if not horario_match:
                continue

            hora = horario_match.group(1)
            horario = horarios_boasorte.get(hora)
            if not horario:
                continue

            # Buscar tabela de premios próxima
            table = header.find_next("table")
            if not table:
                continue

            premios = []
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                if len(cells) < 2:
                    continue
                # Pular linhas de soma/multiplicação
                row_text = row.get_text(strip=True).lower()
                if any(kw in row_text for kw in ["soma", "mult", "multiplicação", "multiplicacao"]):
                    continue

                # Busca célula com 4 dígitos (milhar)
                for cell in cells:
                    text = cell.get_text(strip=True)
                    milhar_match = re.search(r'\b(\d{4})\b', text)
                    if milhar_match:
                        bicho = ""
                        if len(cells) > 2:
                            bicho_text = cells[-1].get_text(strip=True)
                            if not re.search(r'\d{4}', bicho_text) and len(bicho_text) < 20:
                                bicho = bicho_text
                        premios.append({
                            "milhar": milhar_match.group(1),
                            "bicho": bicho,
                        })
                        break

            if len(premios) >= 5:
                resultados.append({
                    "data": data,
                    "horario": horario,
                    "banca": "BOASORTE",
                    "loteria": "BOASORTE",
                    "premios": premios[:7],
                    "fonte": "Requests/BoaSorte",
                })
                log_info("BS", "Requests/BoaSorte",
                    f"  → {horario}: 1º={premios[0]['milhar']} ({premios[0].get('bicho', '')})")

        if resultados:
            log_success("BS", "Requests/BoaSorte", f"Encontrados {len(resultados)} resultados")
        else:
            log_warning("BS", "Requests/BoaSorte", "Nenhum resultado encontrado")

            # Fallback: tenta hojenobicho.com (mostra resultados do dia atual)
            try:
                url_fallback = "https://hojenobicho.com/resultados/bs/"
                log_fallback("BS", "lookgoias.com", "hojenobicho.com", "sem resultados")
                resp2 = requests.get(url_fallback, headers=headers, timeout=30)
                resp2.raise_for_status()
                soup2 = BeautifulSoup(resp2.text, "html.parser")

                for header in soup2.find_all(["h2", "h3", "h4", "strong", "p", "div"]):
                    header_text = header.get_text(strip=True)
                    horario_match = re.search(r'(\d{1,2})(?::(\d{2})|\s*(?:[hH]|hs|horas)\s*(\d{2})?)', header_text)
                    if not horario_match:
                        continue
                    hora = horario_match.group(1)
                    horario = horarios_boasorte.get(hora)
                    if not horario:
                        continue
                    table = header.find_next("table")
                    if not table:
                        continue
                    premios = []
                    for row in table.find_all("tr"):
                        cells = row.find_all("td")
                        if len(cells) < 2:
                            continue
                        # Pular linhas de soma/multiplicação
                        row_text_fb = row.get_text(strip=True).lower()
                        if any(kw in row_text_fb for kw in ["soma", "mult", "multiplicação", "multiplicacao"]):
                            continue
                        for cell in cells:
                            text = cell.get_text(strip=True)
                            milhar_match = re.search(r'\b(\d{4})\b', text)
                            if milhar_match:
                                bicho = ""
                                if len(cells) > 2:
                                    bicho_text = cells[-1].get_text(strip=True)
                                    if not re.search(r'\d{4}', bicho_text) and len(bicho_text) < 20:
                                        bicho = bicho_text
                                premios.append({"milhar": milhar_match.group(1), "bicho": bicho})
                                break
                    if len(premios) >= 5:
                        resultados.append({
                            "data": data,
                            "horario": horario,
                            "banca": "BOASORTE",
                            "loteria": "BOASORTE",
                            "premios": premios[:7],
                            "fonte": "Requests/BoaSorte(fallback)",
                        })
                if resultados:
                    log_success("BS", "hojenobicho.com", f"Fallback: {len(resultados)} resultados")
            except Exception as e2:
                log_error("BS", "hojenobicho.com", f"Fallback falhou: {e2}")

        # Deduplicar resultados por horario
        seen = set()
        deduped = []
        for r in resultados:
            key = r["horario"]
            if key not in seen:
                seen.add(key)
                deduped.append(r)
        resultados = deduped
        if resultados:
            log_success("BS", "Requests/BoaSorte", f"Total único: {len(resultados)} resultados")

        return resultados

    except Exception as e:
        log_error("BS", "Requests/BoaSorte", f"Erro: {e}")
        return []


# =============================================================================
# FONTE 1: RESULTADOFACIL VIA REQUESTS (METODO PRIMARIO v4)
# =============================================================================

def scrape_resultadofacil_requests(url: str, estado: str, data: str, banca: str) -> list:
    """
    Scrape ResultadoFacil usando requests direto (método primário)
    """
    import requests
    from bs4 import BeautifulSoup

    log_info(estado, "Requests", f"Acessando: {url}")

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        html_content = response.text
        log_info(estado, "Requests", f"HTML recebido: {len(html_content)} bytes")

        soup = BeautifulSoup(html_content, "html.parser")
        resultados = parse_resultados(soup, data, banca)

        if resultados:
            log_success(estado, "Requests", f"Encontrados {len(resultados)} resultados")
        else:
            log_warning(estado, "Requests", "Nenhum resultado encontrado")

        return resultados

    except Exception as e:
        log_error(estado, "Requests", f"Erro: {e}")
        return []


# =============================================================================
# FUNCAO PRINCIPAL v4: requests → PortalBrasil → Firecrawl (fallback)
# =============================================================================

@app.function(image=image, secrets=[supabase_secret, firecrawl_secret], timeout=300)
def scrape_estado(estado: str, data: Optional[str] = None) -> dict:
    """
    Scrape otimizado v4 - ordem invertida para economia de créditos:
    1. ResultadoFacil via requests (grátis)
    2. PortalBrasil via requests (grátis)
    3. Firecrawl (fallback pago - só se os outros falharem)
    """
    config = ESTADOS_CONFIG.get(estado)
    if not config:
        log_error(estado, "Sistema", "Estado não configurado")
        return {"estado": estado, "error": "Estado não configurado", "resultados": []}

    data_scrape = data or hoje_brasilia()

    # URL customizada para bancas especiais (ex: NACIONAL)
    if config.get("custom_url"):
        url_resultadofacil = f"{BASE_URL}{config['custom_url'].format(data=data_scrape)}"
    else:
        url_resultadofacil = f"{BASE_URL}/resultado-do-jogo-do-bicho/{config['url_param']}/do-dia/{data_scrape}"

    print(f"\n{'='*60}")
    print(f"[{estado}] 🎯 SCRAPE v4 - {config['banca']} - {data_scrape}")
    print(f"{'='*60}")

    resultados = []
    fonte_utilizada = None
    tentativas = []
    creditos_firecrawl = 0

    # =========================================================================
    # CASO ESPECIAL: FEDERAL (usa pagina de ultimos resultados)
    # =========================================================================
    if estado == "FED":
        resultados = scrape_federal_requests(data_scrape)
        if resultados:
            fonte_utilizada = "Requests/Federal"
            tentativas.append({"fonte": "Requests/Federal", "status": "sucesso", "resultados": len(resultados)})
        else:
            tentativas.append({"fonte": "Requests/Federal", "status": "sem_dados"})

        # Se Federal não encontrou, tenta Firecrawl como fallback
        if not resultados:
            log_fallback(estado, "Requests/Federal", "Firecrawl", "sem resultados")

        return {
            "estado": estado,
            "banca": config["banca"],
            "url": "https://www.resultadofacil.com.br/ultimos-resultados-da-federal",
            "resultados": resultados,
            "fonte_utilizada": fonte_utilizada,
            "tentativas": tentativas,
            "creditos_firecrawl": creditos_firecrawl,
            "error": None,
        }

    # =========================================================================
    # CASO ESPECIAL: BOASORTE (usa lookgoias.com)
    # =========================================================================
    if estado == "BS":
        resultados = scrape_boasorte_requests(data_scrape)
        if resultados:
            fonte_utilizada = "Requests/BoaSorte"
            tentativas.append({"fonte": "Requests/BoaSorte", "status": "sucesso", "resultados": len(resultados)})
        else:
            tentativas.append({"fonte": "Requests/BoaSorte", "status": "sem_dados"})

        return {
            "estado": estado,
            "banca": config["banca"],
            "url": f"https://lookgoias.com/boa-sorte-loterias-{data_scrape.split('-')[2]}-{data_scrape.split('-')[1]}-{data_scrape.split('-')[0]}",
            "resultados": resultados,
            "fonte_utilizada": fonte_utilizada,
            "tentativas": tentativas,
            "creditos_firecrawl": creditos_firecrawl,
            "error": None,
        }

    # =========================================================================
    # TENTATIVA 1: ResultadoFacil via requests (GRÁTIS)
    # =========================================================================
    resultados = scrape_resultadofacil_requests(url_resultadofacil, estado, data_scrape, config['banca'])

    if resultados:
        fonte_utilizada = "Requests/ResultadoFacil"
        tentativas.append({"fonte": "Requests/ResultadoFacil", "status": "sucesso", "resultados": len(resultados)})
    else:
        tentativas.append({"fonte": "Requests/ResultadoFacil", "status": "sem_dados"})

    # =========================================================================
    # TENTATIVA 2: PortalBrasil via requests (GRÁTIS)
    # =========================================================================
    if not resultados:
        log_fallback(estado, "Requests/ResultadoFacil", "PortalBrasil", "sem resultados")

        resultados = scrape_portalbrasil(estado, data_scrape, config['banca'])

        if resultados:
            fonte_utilizada = "PortalBrasil"
            tentativas.append({"fonte": "PortalBrasil", "status": "sucesso", "resultados": len(resultados)})
        else:
            tentativas.append({"fonte": "PortalBrasil", "status": "sem_dados"})

    # =========================================================================
    # TENTATIVA 3: Firecrawl (FALLBACK PAGO - só quando necessário)
    # =========================================================================
    if not resultados:
        log_fallback(estado, "PortalBrasil", "Firecrawl", "sem resultados em fontes gratuitas")

        try:
            from firecrawl import Firecrawl
            from bs4 import BeautifulSoup

            api_key = os.environ.get("FIRECRAWL_API_KEY")
            if not api_key:
                log_error(estado, "Firecrawl", "API key não encontrada")
                tentativas.append({"fonte": "Firecrawl", "status": "erro", "motivo": "API key ausente"})
            else:
                firecrawl = Firecrawl(api_key=api_key)

                # Pede só HTML (1 crédito), sem wait_for nem markdown
                response = firecrawl.scrape(
                    url_resultadofacil,
                    formats=["html"],
                    timeout=30000,
                )
                creditos_firecrawl = 1

                if response:
                    html_content = getattr(response, "html", "") or ""
                    log_info(estado, "Firecrawl", f"HTML: {len(html_content)} bytes (1 crédito gasto)")

                    if html_content:
                        soup = BeautifulSoup(html_content, "html.parser")
                        resultados = parse_resultados(soup, data_scrape, config['banca'])

                    if resultados:
                        log_success(estado, "Firecrawl", f"✓ {len(resultados)} resultados encontrados")
                        fonte_utilizada = "Firecrawl/ResultadoFacil"
                        tentativas.append({"fonte": "Firecrawl", "status": "sucesso", "resultados": len(resultados)})
                    else:
                        log_warning(estado, "Firecrawl", "HTML recebido mas sem resultados parseáveis")
                        tentativas.append({"fonte": "Firecrawl", "status": "sem_dados", "html_size": len(html_content)})
                else:
                    log_warning(estado, "Firecrawl", "Resposta vazia")
                    tentativas.append({"fonte": "Firecrawl", "status": "erro", "motivo": "resposta vazia"})

        except Exception as e:
            error_msg = str(e)
            if "Rate Limit" in error_msg:
                log_warning(estado, "Firecrawl", "Rate limit atingido")
                tentativas.append({"fonte": "Firecrawl", "status": "rate_limit"})
            else:
                log_error(estado, "Firecrawl", f"Erro: {error_msg[:100]}")
                tentativas.append({"fonte": "Firecrawl", "status": "erro", "motivo": error_msg[:50]})

    # =========================================================================
    # RESUMO FINAL
    # =========================================================================
    print(f"\n[{estado}] 📊 RESUMO:")
    for t in tentativas:
        status_icon = "✅" if t["status"] == "sucesso" else "⚠️" if t["status"] == "sem_dados" else "❌"
        print(f"[{estado}]    {status_icon} {t['fonte']}: {t['status']}" + (f" ({t.get('resultados', 0)} resultados)" if t.get('resultados') else ""))

    if resultados:
        print(f"[{estado}] ✅ SUCESSO: {len(resultados)} resultados via {fonte_utilizada}")
    else:
        print(f"[{estado}] ⚠️  SEM RESULTADOS em nenhuma fonte")

    if creditos_firecrawl == 0:
        print(f"[{estado}] 💰 Créditos Firecrawl economizados: 1")
    else:
        print(f"[{estado}] 💸 Créditos Firecrawl gastos: {creditos_firecrawl}")

    print(f"{'='*60}\n")

    return {
        "estado": estado,
        "banca": config['banca'],
        "url": url_resultadofacil,
        "resultados": resultados,
        "fonte_utilizada": fonte_utilizada,
        "tentativas": tentativas,
        "creditos_firecrawl": creditos_firecrawl,
        "error": None
    }


def _premios_match(premios_a: list, premios_b: list) -> bool:
    """
    Verifica se dois conjuntos de prêmios são do MESMO sorteio.
    Compara os primeiros N prêmios (onde N = min dos dois tamanhos).
    Se as milhares coincidem, é o mesmo sorteio (versão 1-5 vs 1-10).
    """
    n = min(len(premios_a), len(premios_b))
    if n < 3:
        return False
    for i in range(n):
        if premios_a[i].get("milhar") != premios_b[i].get("milhar"):
            return False
    return True


def dedup_resultados(resultados: list) -> list:
    """
    Deduplica resultados por (horario, banca, loteria).
    O site publica primeiro prêmios 1-5, depois atualiza para 1-7 (ou 1-10).
    Ambas as versões aparecem no HTML como tabelas separadas.

    Regra: só mescla se os prêmios sobrepostos forem IDÊNTICOS (mesmo sorteio).
    Se os prêmios forem diferentes, são sorteios distintos no mesmo horário
    (ex: PE tem AVAL e LOTEP às 11:00) - mantém o com mais prêmios.
    """
    merged = {}

    for r in resultados:
        key = f"{r['horario']}|{r['banca']}|{r['loteria']}"
        premios = r.get("premios", [])

        if key not in merged:
            merged[key] = r
        else:
            existing = merged[key]
            existing_premios = existing.get("premios", [])

            if _premios_match(premios, existing_premios):
                # Mesmo sorteio: mantém a versão com mais prêmios (1-10 > 1-5)
                if len(premios) > len(existing_premios):
                    merged[key] = r
                # Se mesmo tamanho, merge bicho info
                elif len(premios) == len(existing_premios):
                    for i, p in enumerate(premios):
                        if i < len(existing_premios):
                            if not existing_premios[i].get("bicho") and p.get("bicho"):
                                existing_premios[i]["bicho"] = p["bicho"]
            else:
                # Sorteios diferentes no mesmo horário: mantém o com mais prêmios
                if len(premios) > len(existing_premios):
                    merged[key] = r

    return list(merged.values())


def parse_resultados(soup, data: str, banca: str) -> list:
    """Parser principal - tenta várias estratégias, depois deduplica"""
    resultados = []

    # Estratégia 1: h3 com classe "g"
    resultados = parse_estrutura_h3(soup, data, banca)
    if resultados:
        return dedup_resultados(resultados)

    # Estratégia 2: Qualquer h3 com horário
    resultados = parse_qualquer_h3(soup, data, banca)
    if resultados:
        return dedup_resultados(resultados)

    # Estratégia 3: Busca por tabelas
    resultados = parse_por_tabelas(soup, data, banca)

    return dedup_resultados(resultados)


def parse_estrutura_h3(soup, data: str, banca: str) -> list:
    """Parser pela estrutura conhecida com h3.g"""
    resultados = []

    for header in soup.find_all("h3", class_="g"):
        resultado = extrair_resultado_de_header(header, data, banca)
        if resultado:
            resultados.append(resultado)

    return resultados


def parse_qualquer_h3(soup, data: str, banca: str) -> list:
    """Parser por qualquer h3 que contenha horário"""
    resultados = []

    for header in soup.find_all("h3"):
        header_text = header.get_text(strip=True)

        # Verifica se tem horário no texto
        if re.search(r'\d{1,2}[h:H]\d{2}', header_text):
            resultado = extrair_resultado_de_header(header, data, banca)
            if resultado:
                resultados.append(resultado)

    return resultados


def extrair_resultado_de_header(header, data: str, banca: str) -> Optional[dict]:
    """Extrai resultado a partir de um elemento header"""
    header_text = header.get_text(strip=True)

    # Extrai horário
    horario_match = re.search(r'(\d{1,2})[h:H](\d{2})?', header_text)
    if not horario_match:
        return None

    horario = f"{horario_match.group(1).zfill(2)}:{horario_match.group(2) or '00'}"

    # Normalização de horário por banca (fonte usa horários diferentes do frontend)
    if banca == "LOTECE" and horario in ("10:00", "12:00"):
        horario = "11:00"

    # Identifica loteria
    loteria = identificar_loteria(header_text)

    # Busca tabela de prêmios
    table = header.find_next("table")
    if not table:
        return None

    premios = extrair_premios_tabela(table)

    if len(premios) >= 5:
        return {
            "data": data,
            "horario": horario,
            "banca": banca,
            "loteria": loteria,
            "premios": premios,
            "fonte": "ResultadoFacil",
        }

    return None


def parse_por_tabelas(soup, data: str, banca: str) -> list:
    """Parser buscando todas as tabelas com estrutura de prêmios"""
    resultados = []
    tabelas_processadas = set()

    for table in soup.find_all("table"):
        # Evita processar mesma tabela
        table_id = id(table)
        if table_id in tabelas_processadas:
            continue
        tabelas_processadas.add(table_id)

        premios = extrair_premios_tabela(table)

        if len(premios) >= 5:
            # Busca horário e loteria nos elementos anteriores
            horario, loteria = buscar_info_tabela(table, banca)

            if horario:
                resultados.append({
                    "data": data,
                    "horario": horario,
                    "banca": banca,
                    "loteria": loteria,
                    "premios": premios,
                    "fonte": "ResultadoFacil",
                })

    return resultados


def buscar_info_tabela(table, banca: str = "") -> tuple:
    """Busca horário e loteria nos elementos antes da tabela"""
    horario = None
    loteria = "GERAL"

    # Busca em elementos anteriores
    for elem in table.find_all_previous(["h1", "h2", "h3", "h4", "p", "div", "span"], limit=15):
        text = elem.get_text(strip=True)

        # Busca horário
        if not horario:
            h_match = re.search(r'(\d{1,2})[h:H](\d{2})?', text)
            if h_match:
                horario = f"{h_match.group(1).zfill(2)}:{h_match.group(2) or '00'}"

        # Busca loteria
        lot = identificar_loteria(text)
        if lot != "GERAL":
            loteria = lot
            break

    # Normalização de horário por banca
    if banca == "LOTECE" and horario in ("10:00", "12:00"):
        horario = "11:00"

    return horario, loteria


def identificar_loteria(texto: str) -> str:
    """Identifica a loteria pelo texto"""
    texto_upper = texto.upper()

    # Ordem importa: mais específico primeiro
    # RIO DE JANEIRO
    if "CORUJA" in texto_upper:
        return "CORUJA"
    if "PTM" in texto_upper:
        return "PTM"
    if "PTV" in texto_upper:
        return "PTV"
    if "PTN" in texto_upper:
        return "PTN"

    # BAHIA
    if "MALUCA" in texto_upper:
        return "MALUCA"

    # BRASILIA / DF
    if "LBR" in texto_upper:
        return "LBR"

    # CEARA
    if "LOTECE" in texto_upper:
        return "LOTECE"

    # PERNAMBUCO (PE tem 4 sub-loterias no mesmo horário)
    if "AVAL" in texto_upper and "PE" in texto_upper:
        return "AVAL"
    if "CAMINHO DA SORTE" in texto_upper:
        return "CAMINHO-DA-SORTE"
    if "POPULAR" in texto_upper and ("RECIFE" in texto_upper or "PE," in texto_upper):
        return "POPULAR"
    if "MONTE CARLOS" in texto_upper or "NORDESTE MONTE" in texto_upper:
        return "MONTE-CARLOS"
    if "LOTEP" in texto_upper:
        return "LOTEP"

    # PARAIBA (PB tem CAMPINA GRANDE + LOTEP + Paratodos)
    if "CAMPINA GRANDE" in texto_upper:
        return "CAMPINA-GRANDE"

    # MINAS GERAIS
    if "ALVORADA" in texto_upper:
        return "ALVORADA"
    if "MINAS DIA" in texto_upper:
        return "MINAS-DIA"
    if "MINAS NOITE" in texto_upper:
        return "MINAS-NOITE"
    if "PREFERIDA" in texto_upper:
        return "PREFERIDA"

    # RIO GRANDE DO SUL
    if "GAUCHA" in texto_upper or "GAÚCHA" in texto_upper:
        return "GAUCHA"

    # PARANA
    if "PARANA" in texto_upper or "PARANÁ" in texto_upper:
        return "PARANA"

    # GOIAS
    if "LOOK" in texto_upper:
        return "LOOK"
    if "GOIAS" in texto_upper or "GOIÁS" in texto_upper:
        return "GOIAS"

    # SAO PAULO
    if "BANDEIRANTES" in texto_upper:
        return "BANDEIRANTES"
    if "PAULISTA" in texto_upper:
        return "PAULISTA"

    # NACIONAL
    if "NACIONAL" in texto_upper:
        return "NACIONAL"

    # FEDERAL
    if "FEDERAL" in texto_upper:
        return "FEDERAL"

    # PT genérico (Rio)
    if re.search(r'\bPT\b', texto_upper):
        return "PT"

    return "GERAL"


def extrair_premios_tabela(table) -> list:
    """Extrai prêmios de uma tabela HTML"""
    premios = []

    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue

        # Pular linhas de soma/multiplicação (contêm "soma", "mult", "×", etc.)
        row_text = row.get_text(strip=True).lower()
        if any(kw in row_text for kw in ["soma", "mult", "multiplicação", "multiplicacao"]):
            continue

        # Busca célula com 4 dígitos (milhar)
        for i, cell in enumerate(cells):
            text = cell.get_text(strip=True)
            milhar_match = re.search(r'\b(\d{4})\b', text)
            if milhar_match:
                bicho = ""
                # Tenta pegar bicho da última célula
                if len(cells) > 2:
                    bicho_text = cells[-1].get_text(strip=True)
                    if not re.search(r'\d{4}', bicho_text) and len(bicho_text) < 20:
                        bicho = bicho_text

                premios.append({
                    "milhar": milhar_match.group(1),
                    "bicho": bicho,
                })
                break

    return premios[:7]  # Máximo 7 prêmios


# =============================================================================
# SCRAPING LOTERIAS CAIXA (Lotofácil, Quina, Mega-Sena)
# Usados para verificar Lotinha, Quininha e Seninha
# =============================================================================

CAIXA_LOTERIAS = {
    "lotofacil": {"banca": "CAIXA", "loteria": "LOTO_FACIL", "horario": "20:00"},
    "quina":     {"banca": "CAIXA", "loteria": "QUINA",      "horario": "20:00"},
    "megasena":  {"banca": "CAIXA", "loteria": "MEGA_SENA",  "horario": "20:00"},
}

def scrape_caixa_loterias(data_alvo: str) -> list:
    """
    Busca resultados da Lotofácil, Quina e Mega-Sena da API oficial da Caixa.
    Retorna lista de dicts prontos para upsert na tabela resultados.
    As dezenas são armazenadas como CSV em premio_1 (ex: "02,05,06,08,09,11,14,16,17,18,19,20,22,23,25").
    """
    import requests

    resultados = []
    base_url = "https://servicebus2.caixa.gov.br/portaldeloterias/api"

    for jogo, config in CAIXA_LOTERIAS.items():
        try:
            url = f"{base_url}/{jogo}/"
            resp = requests.get(url, timeout=15)
            resp.raise_for_status()
            data = resp.json()

            # Extrair data do sorteio (formato "dd/mm/yyyy")
            data_apuracao_raw = data.get("dataApuracao", "")
            if data_apuracao_raw:
                parts = data_apuracao_raw.split("/")
                if len(parts) == 3:
                    data_apuracao = f"{parts[2]}-{parts[1]}-{parts[0]}"
                else:
                    data_apuracao = data_apuracao_raw
            else:
                print(f"  [CAIXA/{jogo}] Sem dataApuracao, pulando")
                continue

            # Só processa se o resultado é do dia alvo
            if data_apuracao != data_alvo:
                print(f"  [CAIXA/{jogo}] Resultado é de {data_apuracao}, não de {data_alvo} - pulando")
                continue

            # Extrair dezenas sorteadas (campo "listaDezenas" = ["02","05","06",...])
            dezenas = data.get("listaDezenas", [])
            if not dezenas:
                # Fallback: campo "dezenasSorteadasOrdemSorteio"
                dezenas_str = data.get("dezenasSorteadasOrdemSorteio", "")
                if dezenas_str:
                    dezenas = [d.strip() for d in dezenas_str.split(",") if d.strip()]

            if not dezenas:
                print(f"  [CAIXA/{jogo}] Sem dezenas encontradas")
                continue

            # Formatar dezenas como CSV (ordenadas numericamente)
            dezenas_ordenadas = sorted(dezenas, key=lambda x: int(x))
            dezenas_csv = ",".join(dezenas_ordenadas)

            resultado = {
                "data": data_apuracao,
                "horario": config["horario"],
                "banca": config["banca"],
                "loteria": config["loteria"],
                "dezenas_csv": dezenas_csv,
                "concurso": data.get("numero", ""),
            }
            resultados.append(resultado)
            print(f"  [CAIXA/{jogo}] Concurso {data.get('numero', '?')}: {dezenas_csv}")

        except Exception as e:
            print(f"  [CAIXA/{jogo}] Erro: {e}")

    return resultados


def _upsert_resultados_caixa(supabase, resultados_caixa: list) -> int:
    """Salva resultados da Caixa no Supabase. Dezenas ficam em premio_1 como CSV."""
    upserted = 0
    for r in resultados_caixa:
        try:
            supabase.table("resultados").upsert({
                "data": r["data"],
                "horario": r["horario"],
                "banca": r["banca"],
                "loteria": r["loteria"],
                "premio_1": r["dezenas_csv"],  # CSV de dezenas: "02,05,06,..."
                "premio_2": None,
                "premio_3": None,
                "premio_4": None,
                "premio_5": None,
                "premio_6": None,
                "premio_7": None,
                "bicho_1": None,
                "bicho_2": None,
                "bicho_3": None,
                "bicho_4": None,
                "bicho_5": None,
                "bicho_6": None,
                "bicho_7": None,
            }, on_conflict="data,horario,banca,loteria").execute()
            upserted += 1
        except Exception as e:
            print(f"  [CAIXA] Erro upsert {r['loteria']}: {e}")
    return upserted


# =============================================================================
# FUNCAO PRINCIPAL v4
# =============================================================================

def _upsert_resultados(supabase, todos_resultados: list) -> int:
    """Salva resultados no Supabase, retorna quantidade upserted"""
    upserted = 0
    for r in todos_resultados:
        premios = r.get("premios", [])
        if len(premios) < 5:
            continue
        try:
            supabase.table("resultados").upsert({
                "data": r["data"],
                "horario": r["horario"],
                "banca": r["banca"],
                "loteria": r["loteria"],
                "premio_1": premios[0]["milhar"] if len(premios) > 0 else None,
                "premio_2": premios[1]["milhar"] if len(premios) > 1 else None,
                "premio_3": premios[2]["milhar"] if len(premios) > 2 else None,
                "premio_4": premios[3]["milhar"] if len(premios) > 3 else None,
                "premio_5": premios[4]["milhar"] if len(premios) > 4 else None,
                "premio_6": premios[5]["milhar"] if len(premios) > 5 else None,
                "premio_7": premios[6]["milhar"] if len(premios) > 6 else None,
                "bicho_1": premios[0].get("bicho", "") if len(premios) > 0 else None,
                "bicho_2": premios[1].get("bicho", "") if len(premios) > 1 else None,
                "bicho_3": premios[2].get("bicho", "") if len(premios) > 2 else None,
                "bicho_4": premios[3].get("bicho", "") if len(premios) > 3 else None,
                "bicho_5": premios[4].get("bicho", "") if len(premios) > 4 else None,
                "bicho_6": premios[5].get("bicho", "") if len(premios) > 5 else None,
                "bicho_7": premios[6].get("bicho", "") if len(premios) > 6 else None,
            }, on_conflict="data,horario,banca,loteria").execute()
            upserted += 1
        except Exception:
            pass
    return upserted


@app.function(image=image, secrets=[supabase_secret], timeout=900)
def scrape_todos_v4(data: Optional[str] = None, estados: Optional[list] = None) -> dict:
    """
    Scrape todos os estados usando v4 (requests primeiro)
    """
    from supabase import create_client
    import time

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    data_scrape = data or hoje_brasilia()
    estados_scrape = estados or list(ESTADOS_CONFIG.keys())

    print(f"=== Scrape V4 (requests-first) iniciado: {data_scrape} ===")
    print(f"Estados: {estados_scrape}")

    todos_resultados = []
    erros = []
    total_creditos = 0

    for estado in estados_scrape:
        try:
            resultado = scrape_estado.remote(estado, data_scrape)

            if resultado.get("error"):
                erros.append(f"{estado}: {resultado['error']}")
                print(f"[{estado}] Erro: {resultado['error']}")
            else:
                todos_resultados.extend(resultado.get("resultados", []))
                total_creditos += resultado.get("creditos_firecrawl", 0)
                print(f"[{estado}] OK: {len(resultado.get('resultados', []))} resultados via {resultado.get('fonte_utilizada', 'N/A')}")

            # Pequeno delay entre estados
            time.sleep(1)

        except Exception as e:
            erros.append(f"{estado}: {str(e)}")
            print(f"[{estado}] Exceção: {e}")

    print(f"\nTotal de resultados: {len(todos_resultados)}")
    print(f"💰 Total créditos Firecrawl gastos: {total_creditos}")

    # Salvar no Supabase
    upserted = _upsert_resultados(supabase, todos_resultados)

    resultado_final = {
        "success": True,
        "data": data_scrape,
        "total_scraped": len(todos_resultados),
        "upserted": upserted,
        "creditos_firecrawl": total_creditos,
        "scrape_errors": erros if erros else None,
    }

    print(f"\n=== Scrape V4 finalizado: {resultado_final} ===")
    return resultado_final


# =============================================================================
# MAPEAMENTO LOTERIAS -> RESULTADOS (para verificacao de apostas)
# =============================================================================

LOTERIA_TO_BANCA = {
    # (banca, horario, loteria) - loteria é usada para diferenciar resultados no mesmo horario+banca
    # RIO DE JANEIRO
    "rj_pt_09": ("RIO/FEDERAL", "09:20", "PT"),
    "rj_ptm_11": ("RIO/FEDERAL", "11:00", "PTM"),
    "rj_pt_14": ("RIO/FEDERAL", "14:20", "PT"),
    "pt_14": ("RIO/FEDERAL", "14:20", "PT"),  # alias
    "rj_ptv_16": ("RIO/FEDERAL", "16:00", "PTV"),
    "rj_ptn_18": ("RIO/FEDERAL", "18:20", "PTN"),
    "rj_coruja_21": ("RIO/FEDERAL", "21:20", "CORUJA"),
    "coruja_21": ("RIO/FEDERAL", "21:20", "CORUJA"),  # alias
    # BAHIA - GERAL e MALUCA têm resultados DIFERENTES no mesmo horário
    "ba_10": ("BAHIA", "10:00", "GERAL"),
    "ln_10": ("BAHIA", "10:00", "GERAL"),
    "ba_12": ("BAHIA", "12:00", "GERAL"),
    "ba_15": ("BAHIA", "15:00", "GERAL"),
    "ba_19": ("BAHIA", "19:00", "GERAL"),
    "ba_20": ("BAHIA", "20:00", "GERAL"),
    "ba_21": ("BAHIA", "21:00", "GERAL"),
    "ba_maluca_10": ("BAHIA", "10:00", "MALUCA"),
    "ba_maluca_12": ("BAHIA", "12:00", "MALUCA"),
    "ba_maluca_15": ("BAHIA", "15:00", "MALUCA"),
    "ba_maluca_19": ("BAHIA", "19:00", "MALUCA"),
    "ba_maluca_20": ("BAHIA", "20:00", "MALUCA"),
    "ba_maluca_21": ("BAHIA", "21:00", "MALUCA"),
    # GOIAS
    "go_07": ("LOOK/GOIAS", "07:00", "LOOK"),
    "go_09": ("LOOK/GOIAS", "09:00", "LOOK"),
    "go_11": ("LOOK/GOIAS", "11:00", "LOOK"),
    "go_14": ("LOOK/GOIAS", "14:00", "LOOK"),
    "go_16": ("LOOK/GOIAS", "16:00", "LOOK"),
    "go_18": ("LOOK/GOIAS", "18:00", "LOOK"),
    "go_21": ("LOOK/GOIAS", "21:00", "LOOK"),
    "go_23": ("LOOK/GOIAS", "23:00", "LOOK"),
    # CEARA
    "ce_11": ("LOTECE", "11:00", "LOTECE"),
    "ce_12": ("LOTECE", "11:00", "LOTECE"),  # fonte usa 12:00, normalizado para 11:00
    "ce_14": ("LOTECE", "14:00", "LOTECE"),
    "ce_15": ("LOTECE", "15:45", "LOTECE"),
    "ce_19": ("LOTECE", "19:00", "LOTECE"),
    # PERNAMBUCO
    "pe_09": ("LOTEP", "09:20", "GERAL"),
    "pe_09b": ("LOTEP", "09:30", "GERAL"),
    "pe_09c": ("LOTEP", "09:40", "GERAL"),
    "pe_10": ("LOTEP", "10:00", "GERAL"),
    "pe_11": ("LOTEP", "11:00", "GERAL"),
    "pe_12": ("LOTEP", "12:40", "GERAL"),
    "pe_12b": ("LOTEP", "12:45", "GERAL"),
    "pe_14": ("LOTEP", "14:00", "GERAL"),
    "pe_15": ("LOTEP", "15:40", "GERAL"),
    "pe_15b": ("LOTEP", "15:45", "GERAL"),
    "pe_17": ("LOTEP", "17:00", "GERAL"),
    "pe_18": ("LOTEP", "18:30", "GERAL"),
    "pe_19": ("LOTEP", "19:00", "GERAL"),
    "pe_19b": ("LOTEP", "19:30", "GERAL"),
    "pe_20": ("LOTEP", "20:00", "GERAL"),
    "pe_21": ("LOTEP", "21:00", "GERAL"),
    # PARAIBA - GERAL e LOTEP têm resultados DIFERENTES no mesmo horário
    "pb_09": ("PARAIBA", "09:45", "GERAL"),
    "pb_10": ("PARAIBA", "10:45", "GERAL"),
    "pb_12": ("PARAIBA", "12:45", "GERAL"),
    "pb_15": ("PARAIBA", "15:45", "GERAL"),
    "pb_18": ("PARAIBA", "18:00", "GERAL"),
    "pb_19": ("PARAIBA", "19:05", "GERAL"),
    "pb_20": ("PARAIBA", "20:00", "GERAL"),
    "pb_lotep_10": ("PARAIBA", "10:45", "LOTEP"),
    "pb_lotep_12": ("PARAIBA", "12:45", "LOTEP"),
    "pb_lotep_15": ("PARAIBA", "15:45", "LOTEP"),
    "pb_lotep_18": ("PARAIBA", "18:00", "LOTEP"),
    # SAO PAULO
    "sp_08": ("SAO-PAULO", "08:00", "GERAL"),
    "sp_10": ("SAO-PAULO", "10:00", "GERAL"),
    "sp_12": ("SAO-PAULO", "12:00", "GERAL"),
    "sp_13": ("SAO-PAULO", "13:00", "GERAL"),
    "sp_band_15": ("SAO-PAULO", "15:30", "BANDEIRANTES"),
    "sp_15": ("SAO-PAULO", "15:30", "GERAL"),  # alias backward compat
    "sp_17": ("SAO-PAULO", "17:00", "GERAL"),
    "sp_18": ("SAO-PAULO", "18:00", "GERAL"),
    "sp_19": ("SAO-PAULO", "19:00", "GERAL"),
    "sp_ptn_20": ("SAO-PAULO", "20:00", "PTN"),
    # MINAS GERAIS - cada horário tem loteria diferente
    "mg_12": ("MINAS-GERAIS", "12:00", "ALVORADA"),
    "mg_13": ("MINAS-GERAIS", "13:00", "GERAL"),
    "mg_15": ("MINAS-GERAIS", "15:00", "MINAS-DIA"),
    "mg_19": ("MINAS-GERAIS", "19:00", "MINAS-NOITE"),
    "mg_21": ("MINAS-GERAIS", "21:00", "PREFERIDA"),
    # DISTRITO FEDERAL / LBR
    "df_00": ("BRASILIA", "00:40", "LBR"),
    "df_07": ("BRASILIA", "07:30", "LBR"),
    "df_08": ("BRASILIA", "08:30", "LBR"),
    "df_10": ("BRASILIA", "10:00", "LBR"),
    "df_12": ("BRASILIA", "12:40", "LBR"),
    "df_13": ("BRASILIA", "13:00", "LBR"),
    "df_15": ("BRASILIA", "15:00", "LBR"),
    "df_17": ("BRASILIA", "17:00", "LBR"),
    "df_18": ("BRASILIA", "18:40", "LBR"),
    "df_19": ("BRASILIA", "19:00", "LBR"),
    "df_20": ("BRASILIA", "20:40", "LBR"),
    "df_22": ("BRASILIA", "22:00", "LBR"),
    "df_23": ("BRASILIA", "23:00", "LBR"),
    # RIO GRANDE DO NORTE
    "rn_08": ("RIO-GRANDE-NORTE", "08:30", "GERAL"),
    "rn_11": ("RIO-GRANDE-NORTE", "11:45", "GERAL"),
    "rn_16": ("RIO-GRANDE-NORTE", "16:45", "GERAL"),
    "rn_18": ("RIO-GRANDE-NORTE", "18:30", "GERAL"),
    # RIO GRANDE DO SUL (5 horários: 11, 14, 16, 18, 21)
    "rs_11": ("RIO-GRANDE-SUL", "11:00", "GERAL"),
    "rs_14": ("RIO-GRANDE-SUL", "14:00", "GERAL"),
    "rs_16": ("RIO-GRANDE-SUL", "16:00", "GERAL"),
    "rs_18": ("RIO-GRANDE-SUL", "18:00", "GERAL"),
    "rs_21": ("RIO-GRANDE-SUL", "21:00", "GERAL"),
    # SERGIPE
    "se_10": ("SERGIPE", "10:00", "GERAL"),
    "se_13": ("SERGIPE", "13:00", "GERAL"),
    "se_14": ("SERGIPE", "14:00", "GERAL"),
    "se_16": ("SERGIPE", "16:00", "GERAL"),
    "se_19": ("SERGIPE", "19:00", "GERAL"),
    # PARANA
    "pr_14": ("PARANA", "14:00", "GERAL"),
    "pr_18": ("PARANA", "18:00", "GERAL"),
    # NACIONAL
    "nac_02": ("NACIONAL", "02:00", "NACIONAL"),
    "nac_08": ("NACIONAL", "08:00", "NACIONAL"),
    "nac_10": ("NACIONAL", "10:00", "NACIONAL"),
    "nac_12": ("NACIONAL", "12:00", "NACIONAL"),
    "nac_15": ("NACIONAL", "15:00", "NACIONAL"),
    "nac_17": ("NACIONAL", "17:00", "NACIONAL"),
    "nac_21": ("NACIONAL", "21:00", "NACIONAL"),
    # FAZENDINHA
    "lt_look_23hs": ("LOOK/GOIAS", "23:19", "LOOK"),
    "lt_nacional_23hs": ("NACIONAL", "22:59", "NACIONAL"),
    # FEDERAL
    "fed_19": ("FEDERAL", "19:00", "FEDERAL"),
    # BOASORTE GOIAS
    "bs_09": ("BOASORTE", "09:20", "BOASORTE"),
    "bs_11": ("BOASORTE", "11:20", "BOASORTE"),
    "bs_14": ("BOASORTE", "14:20", "BOASORTE"),
    "bs_16": ("BOASORTE", "16:20", "BOASORTE"),
    "bs_18": ("BOASORTE", "18:20", "BOASORTE"),
    "bs_21": ("BOASORTE", "21:20", "BOASORTE"),
    # NACIONAL 23HS (novo)
    "nac_23": ("NACIONAL", "23:00", "NACIONAL"),
    # =========================================================================
    # MALUCA - usa mesmo resultado, verificação inverte dezena
    # (BAHIA MALUCA já está acima com resultados SEPARADOS)
    # =========================================================================
    # RIO DE JANEIRO - MALUCA
    "rj_pt_09_maluca": ("RIO/FEDERAL", "09:20", "PT"),
    "rj_ptm_11_maluca": ("RIO/FEDERAL", "11:00", "PTM"),
    "rj_pt_14_maluca": ("RIO/FEDERAL", "14:20", "PT"),
    "rj_ptv_16_maluca": ("RIO/FEDERAL", "16:00", "PTV"),
    "rj_coruja_21_maluca": ("RIO/FEDERAL", "21:20", "CORUJA"),
    # FEDERAL - MALUCA
    "fed_19_maluca": ("FEDERAL", "19:00", "FEDERAL"),
    # NACIONAL - MALUCA
    "nac_02_maluca": ("NACIONAL", "02:00", "NACIONAL"),
    "nac_08_maluca": ("NACIONAL", "08:00", "NACIONAL"),
    "nac_10_maluca": ("NACIONAL", "10:00", "NACIONAL"),
    "nac_12_maluca": ("NACIONAL", "12:00", "NACIONAL"),
    "nac_15_maluca": ("NACIONAL", "15:00", "NACIONAL"),
    "nac_17_maluca": ("NACIONAL", "17:00", "NACIONAL"),
    "nac_21_maluca": ("NACIONAL", "21:00", "NACIONAL"),
    "nac_23_maluca": ("NACIONAL", "23:00", "NACIONAL"),
    # LOOK/GOIAS - MALUCA
    "go_07_maluca": ("LOOK/GOIAS", "07:00", "LOOK"),
    "go_09_maluca": ("LOOK/GOIAS", "09:00", "LOOK"),
    "go_11_maluca": ("LOOK/GOIAS", "11:00", "LOOK"),
    "go_14_maluca": ("LOOK/GOIAS", "14:00", "LOOK"),
    "go_16_maluca": ("LOOK/GOIAS", "16:00", "LOOK"),
    "go_18_maluca": ("LOOK/GOIAS", "18:00", "LOOK"),
    "go_21_maluca": ("LOOK/GOIAS", "21:00", "LOOK"),
    # BOASORTE - MALUCA
    "bs_09_maluca": ("BOASORTE", "09:20", "BOASORTE"),
    "bs_11_maluca": ("BOASORTE", "11:20", "BOASORTE"),
    "bs_14_maluca": ("BOASORTE", "14:20", "BOASORTE"),
    "bs_16_maluca": ("BOASORTE", "16:20", "BOASORTE"),
    "bs_18_maluca": ("BOASORTE", "18:20", "BOASORTE"),
    "bs_21_maluca": ("BOASORTE", "21:20", "BOASORTE"),
    # LOTEP - MALUCA
    "pe_09_maluca": ("LOTEP", "09:20", "GERAL"),
    "pe_10_maluca": ("LOTEP", "10:00", "GERAL"),
    "pe_12_maluca": ("LOTEP", "12:40", "GERAL"),
    "pe_15_maluca": ("LOTEP", "15:40", "GERAL"),
    "pe_18_maluca": ("LOTEP", "18:30", "GERAL"),
    "pe_20_maluca": ("LOTEP", "20:00", "GERAL"),
    # LOTECE - MALUCA
    "ce_11_maluca": ("LOTECE", "11:00", "LOTECE"),
    "ce_14_maluca": ("LOTECE", "14:00", "LOTECE"),
    "ce_15_maluca": ("LOTECE", "15:45", "LOTECE"),
    "ce_19_maluca": ("LOTECE", "19:00", "LOTECE"),
    # SAO PAULO - MALUCA
    "sp_08_maluca": ("SAO-PAULO", "08:00", "GERAL"),
    "sp_10_maluca": ("SAO-PAULO", "10:00", "GERAL"),
    "sp_12_maluca": ("SAO-PAULO", "12:00", "GERAL"),
    "sp_13_maluca": ("SAO-PAULO", "13:00", "GERAL"),
    "sp_band_15_maluca": ("SAO-PAULO", "15:30", "BANDEIRANTES"),
    "sp_17_maluca": ("SAO-PAULO", "17:00", "GERAL"),
    "sp_18_maluca": ("SAO-PAULO", "18:00", "GERAL"),
    "sp_19_maluca": ("SAO-PAULO", "19:00", "GERAL"),
    # MINAS GERAIS - MALUCA
    "mg_12_maluca": ("MINAS-GERAIS", "12:00", "ALVORADA"),
    "mg_15_maluca": ("MINAS-GERAIS", "15:00", "MINAS-DIA"),
    # SORTE/RS - MALUCA
    "rs_11_maluca": ("RIO-GRANDE-SUL", "11:00", "GERAL"),
    "rs_14_maluca": ("RIO-GRANDE-SUL", "14:00", "GERAL"),
    "rs_16_maluca": ("RIO-GRANDE-SUL", "16:00", "GERAL"),
    "rs_18_maluca": ("RIO-GRANDE-SUL", "18:00", "GERAL"),
    "rs_21_maluca": ("RIO-GRANDE-SUL", "21:00", "GERAL"),
}


# =============================================================================
# FUNCAO AGENDADA (CRON) - COM SKIP INTELIGENTE
# =============================================================================

def check_pending_payments(supabase_url: str, supabase_key: str):
    """
    Verifica pagamentos PENDING via polling nas APIs BSPay/WashPay.
    Chamado ao final de cada scrape_scheduled (a cada 30 min).
    """
    import requests

    print(f"\n💳 Verificando pagamentos pendentes via polling...")

    try:
        url = f"{supabase_url}/functions/v1/check-pending-payments"
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
            },
            json={"hours_back": 24, "limit": 100},
            timeout=120,
        )

        if resp.status_code == 200:
            data = resp.json()
            checked = data.get("checked", 0)
            confirmed = data.get("confirmed", 0)
            errors = data.get("errors", 0)
            print(f"  ✅ Pagamentos: {checked} verificados, {confirmed} confirmados, {errors} erros")
        else:
            print(f"  ❌ Erro ao verificar pagamentos: HTTP {resp.status_code} - {resp.text[:200]}")
    except Exception as e:
        print(f"  ❌ Exceção ao verificar pagamentos: {e}")


@app.function(
    image=image,
    secrets=[supabase_secret],
    timeout=120,  # 2 min max
    schedule=modal.Cron("*/2 * * * *"),  # A cada 2 minutos, 24/7
)
def reconcile_payments():
    """
    Reconciliation job - roda a cada 2 minutos.
    Verifica pagamentos PENDING via API BSPay/WashPay.
    Padrão: Event-Driven (webhook) + Reconciliation (este cron).
    """
    from supabase import create_client

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    check_pending_payments(supabase_url, supabase_key)


@app.function(
    image=image,
    secrets=[supabase_secret, firecrawl_secret],
    timeout=900,  # 15 min
    schedule=modal.Cron("*/30 1,7-23 * * *", timezone="America/Sao_Paulo"),
)
def scrape_scheduled():
    """
    Scrape agendado v4 - roda a cada 30 minutos nos horários relevantes (BRT).
    Otimizações:
    - Skip inteligente: pula estados que já têm todos os resultados do dia
    - requests primeiro: Firecrawl só como fallback (economia de créditos)
    """
    from supabase import create_client
    import time

    print(f"=== Scrape V4 agendado: {agora_brasilia().strftime('%Y-%m-%d %H:%M:%S')} BRT ===")

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    data_scrape = hoje_brasilia()
    estados_scrape = list(ESTADOS_CONFIG.keys())

    todos_resultados = []
    erros = []
    total_creditos = 0
    skipped = []

    # =========================================================================
    # CONSULTA DB: quais estados já estão completos?
    # =========================================================================
    resultados_existentes = {}
    try:
        resp = supabase.table("resultados").select("banca").eq("data", data_scrape).execute()
        if resp.data:
            for row in resp.data:
                b = row.get("banca", "")
                resultados_existentes[b] = resultados_existentes.get(b, 0) + 1
        print(f"Resultados já no DB para {data_scrape}: {resultados_existentes}")
    except Exception as e:
        print(f"Erro ao consultar DB para skip: {e}")

    for estado in estados_scrape:
        config = ESTADOS_CONFIG.get(estado)
        if not config:
            continue

        banca = config["banca"]
        esperados = HORARIOS_ESPERADOS.get(estado, 0)
        existentes = resultados_existentes.get(banca, 0)

        # Skip inteligente: se já tem todos os resultados esperados, pula
        if esperados > 0 and existentes >= esperados:
            print(f"[{estado}] ⏭️  SKIP: {banca} já completo ({existentes}/{esperados} resultados)")
            skipped.append(estado)
            continue

        print(f"[{estado}] 🔍 Scrapando: {banca} ({existentes}/{esperados} resultados no DB)")

        try:
            resultado = scrape_estado.remote(estado, data_scrape)

            if resultado.get("error"):
                erros.append(f"{estado}: {resultado['error']}")
                print(f"[{estado}] Erro: {resultado['error']}")
            else:
                todos_resultados.extend(resultado.get("resultados", []))
                total_creditos += resultado.get("creditos_firecrawl", 0)
                print(f"[{estado}] OK: {len(resultado.get('resultados', []))} resultados via {resultado.get('fonte_utilizada', 'N/A')}")

            # Delay de 2 segundos entre estados (requests não precisa de 6s como Firecrawl)
            time.sleep(2)

        except Exception as e:
            erros.append(f"{estado}: {str(e)}")
            print(f"[{estado}] Exceção: {e}")

    # Salvar no Supabase
    upserted = _upsert_resultados(supabase, todos_resultados)

    # Scrape loterias da Caixa (Lotofácil, Quina, Mega-Sena) para Lotinha/Quininha/Seninha
    print(f"\n🎰 Scraping Loterias Caixa...")
    resultados_caixa = scrape_caixa_loterias(data_scrape)
    upserted_caixa = _upsert_resultados_caixa(supabase, resultados_caixa)
    print(f"  Caixa: {len(resultados_caixa)} resultados, {upserted_caixa} upserted")

    print(f"\n📊 RESUMO V4:")
    print(f"  Scraped: {len(todos_resultados)} resultados bicho + {len(resultados_caixa)} Caixa, {upserted + upserted_caixa} upserted total")
    print(f"  Skipped: {len(skipped)} estados ({', '.join(skipped) if skipped else 'nenhum'})")
    print(f"  💰 Créditos Firecrawl gastos: {total_creditos}")

    # Verificar apostas pendentes (hoje)
    verificar_premios_v2.remote(data_scrape)

    # Verificar apostas pendentes de ontem (cobre lotinha/quininha/seninha e resultados tardios)
    data_ontem = (agora_brasilia() - timedelta(days=1)).strftime("%Y-%m-%d")
    verificar_premios_v2.remote(data_ontem)

    return {"total": len(todos_resultados), "upserted": upserted, "skipped": len(skipped), "creditos_firecrawl": total_creditos}


# =============================================================================
# VERIFICACAO DE PREMIOS E REEMBOLSO
# =============================================================================

# -----------------------------------------------------------------------------
# FUNÇÕES AUXILIARES PARA VERIFICAÇÃO DE MODALIDADES
# -----------------------------------------------------------------------------

def extrair_dezena(premio: str) -> str:
    """Extrai os últimos 2 dígitos (dezena direita)"""
    return premio[-2:] if len(premio) >= 2 else premio.zfill(2)

def extrair_dezena_esq(premio: str) -> str:
    """Extrai os primeiros 2 dígitos (dezena esquerda)"""
    return premio[:2] if len(premio) >= 2 else premio.zfill(2)

def extrair_dezena_meio(premio: str) -> str:
    """Extrai os 2 dígitos do meio (posições 1 e 2 em milhar de 4 dígitos)"""
    if len(premio) >= 4:
        return premio[1:3]
    return premio[-2:] if len(premio) >= 2 else premio.zfill(2)

def extrair_centena(premio: str) -> str:
    """Extrai os últimos 3 dígitos (centena direita)"""
    return premio[-3:] if len(premio) >= 3 else premio.zfill(3)

def extrair_centena_esq(premio: str) -> str:
    """Extrai os primeiros 3 dígitos (centena esquerda)"""
    return premio[:3] if len(premio) >= 3 else premio.zfill(3)

def extrair_unidade(premio: str) -> str:
    """Extrai o último dígito"""
    return premio[-1] if premio else "0"

def dezena_to_grupo(dezena: str) -> int:
    """Converte dezena (00-99) para grupo (1-25)"""
    try:
        dez = int(dezena)
        if dez == 0:
            return 25  # 00 pertence ao grupo 25 (Vaca)
        return ((dez - 1) // 4) + 1
    except:
        return 0

def is_invertido(palpite: str, premio: str, n_digitos: int) -> bool:
    """Verifica se palpite é uma permutação dos últimos N dígitos do prêmio"""
    from itertools import permutations

    palpite_digits = palpite[-n_digitos:].zfill(n_digitos)
    premio_digits = premio[-n_digitos:].zfill(n_digitos)

    # Gera todas as permutações dos dígitos do prêmio
    for perm in permutations(premio_digits):
        if ''.join(perm) == palpite_digits:
            return True
    return False

def is_invertido_esq(palpite: str, premio: str, n_digitos: int) -> bool:
    """Verifica se palpite é uma permutação dos primeiros N dígitos do prêmio"""
    from itertools import permutations

    palpite_digits = palpite[:n_digitos].zfill(n_digitos)
    premio_digits = premio[:n_digitos].zfill(n_digitos)

    for perm in permutations(premio_digits):
        if ''.join(perm) == palpite_digits:
            return True
    return False

def verificar_modalidade(modalidade: str, palpites: list, resultado: dict, posicoes_validas: list) -> bool:
    """
    Verifica se a aposta ganhou baseado na modalidade.

    Args:
        modalidade: código da modalidade (ex: "milhar", "centena_inv", "duque_gp")
        palpites: lista de palpites do apostador
        resultado: dict com premio_1..premio_7
        posicoes_validas: lista de posições a verificar (ex: ["premio_1", "premio_2"...])

    Returns:
        True se ganhou, False caso contrário
    """
    modalidade = modalidade.lower().strip()

    # Extrai todos os prêmios das posições válidas
    premios = []
    for pos in posicoes_validas:
        premio = str(resultado.get(pos, "") or "").strip()
        if premio and len(premio) >= 2:
            premios.append(premio.zfill(4))

    if not premios:
        return False

    # Extrai dezenas e grupos dos prêmios
    dezenas = [extrair_dezena(p) for p in premios]
    dezenas_esq = [extrair_dezena_esq(p) for p in premios]
    dezenas_meio = [extrair_dezena_meio(p) for p in premios]
    grupos = [dezena_to_grupo(d) for d in dezenas]
    grupos_esq = [dezena_to_grupo(d) for d in dezenas_esq]
    grupos_meio = [dezena_to_grupo(d) for d in dezenas_meio]

    # Normaliza palpites
    palpites_norm = [str(p).strip() for p in palpites if p]
    if not palpites_norm:
        return False

    # =========================================================================
    # MILHAR (4 dígitos)
    # =========================================================================
    if modalidade == "milhar":
        for palpite in palpites_norm:
            for premio in premios:
                if palpite.zfill(4) == premio.zfill(4):
                    return True

    elif modalidade == "milhar_ct":
        # Milhar e Centena - ganha se acertar milhar OU centena
        for palpite in palpites_norm:
            for premio in premios:
                if palpite.zfill(4) == premio.zfill(4):  # Milhar exata
                    return True
                if len(palpite) >= 3 and premio.endswith(palpite[-3:]):  # Centena
                    return True

    elif modalidade.startswith("milhar_inv"):
        # Milhar invertida (permutações)
        for palpite in palpites_norm:
            for premio in premios:
                if is_invertido(palpite, premio, 4):
                    return True

    # =========================================================================
    # CENTENA (3 dígitos)
    # =========================================================================
    elif modalidade == "centena":
        for palpite in palpites_norm:
            for premio in premios:
                if len(palpite) >= 3 and premio.endswith(palpite[-3:]):
                    return True

    elif modalidade == "centena_esquerda" or modalidade == "centena_esq":
        for palpite in palpites_norm:
            for premio in premios:
                if len(palpite) >= 3 and premio.startswith(palpite[:3]):
                    return True

    elif modalidade == "centena_3x":
        # Centena em qualquer posição (esq, meio, dir)
        for palpite in palpites_norm:
            palpite_3 = palpite[-3:].zfill(3) if len(palpite) >= 3 else palpite.zfill(3)
            for premio in premios:
                # Direita
                if premio.endswith(palpite_3):
                    return True
                # Esquerda (em milhar de 4 dígitos)
                if len(premio) >= 4 and premio[:3] == palpite_3:
                    return True
                # Meio (posições 1-3 em milhar)
                if len(premio) >= 4 and premio[1:4] == palpite_3:
                    return True

    elif modalidade.startswith("centena_inv"):
        # Centena invertida
        is_esq = "esq" in modalidade
        for palpite in palpites_norm:
            for premio in premios:
                if is_esq:
                    if is_invertido_esq(palpite, premio, 3):
                        return True
                else:
                    if is_invertido(palpite, premio, 3):
                        return True

    # =========================================================================
    # DEZENA (2 dígitos)
    # =========================================================================
    elif modalidade == "dezena":
        for palpite in palpites_norm:
            palpite_dez = palpite[-2:].zfill(2)
            if palpite_dez in dezenas:
                return True

    elif modalidade == "dezena_esq":
        for palpite in palpites_norm:
            palpite_dez = palpite[-2:].zfill(2)
            if palpite_dez in dezenas_esq:
                return True

    elif modalidade == "dezena_meio":
        for palpite in palpites_norm:
            palpite_dez = palpite[-2:].zfill(2)
            if palpite_dez in dezenas_meio:
                return True

    # =========================================================================
    # GRUPO (bicho 1-25)
    # =========================================================================
    elif modalidade == "grupo":
        for palpite in palpites_norm:
            try:
                palpite_grupo = int(palpite)
                if palpite_grupo in grupos:
                    return True
            except:
                pass

    elif modalidade == "grupo_esq":
        for palpite in palpites_norm:
            try:
                palpite_grupo = int(palpite)
                if palpite_grupo in grupos_esq:
                    return True
            except:
                pass

    elif modalidade == "grupo_meio":
        for palpite in palpites_norm:
            try:
                palpite_grupo = int(palpite)
                if palpite_grupo in grupos_meio:
                    return True
            except:
                pass

    # =========================================================================
    # UNIDADE (1 dígito)
    # =========================================================================
    elif modalidade == "unidade":
        for palpite in palpites_norm:
            palpite_un = palpite[-1] if palpite else ""
            for premio in premios:
                if palpite_un == extrair_unidade(premio):
                    return True

    # =========================================================================
    # DUQUE DEZENA (2 dezenas devem aparecer nos prêmios)
    # =========================================================================
    elif modalidade.startswith("duque_dez"):
        if len(palpites_norm) < 2:
            return False

        # Determina qual conjunto de dezenas usar
        if "esq" in modalidade:
            dezenas_check = dezenas_esq
        elif "meio" in modalidade:
            dezenas_check = dezenas_meio
        else:
            dezenas_check = dezenas

        # Os 2 palpites devem estar nas dezenas dos prêmios
        palpite1 = palpites_norm[0][-2:].zfill(2)
        palpite2 = palpites_norm[1][-2:].zfill(2)

        if palpite1 in dezenas_check and palpite2 in dezenas_check:
            return True

    # =========================================================================
    # DUQUE GRUPO (2 grupos devem aparecer nos prêmios)
    # =========================================================================
    elif modalidade.startswith("duque_gp"):
        if len(palpites_norm) < 2:
            return False

        if "esq" in modalidade:
            grupos_check = grupos_esq
        elif "meio" in modalidade:
            grupos_check = grupos_meio
        else:
            grupos_check = grupos

        try:
            palpite1 = int(palpites_norm[0])
            palpite2 = int(palpites_norm[1])
            if palpite1 in grupos_check and palpite2 in grupos_check:
                return True
        except:
            pass

    # =========================================================================
    # TERNO DEZENA (3 dezenas devem aparecer)
    # =========================================================================
    elif modalidade.startswith("terno_dez"):
        if len(palpites_norm) < 3:
            return False

        is_seco = "seco" in modalidade

        if "esq" in modalidade:
            dezenas_check = dezenas_esq[:3] if is_seco else dezenas_esq
        elif "meio" in modalidade:
            dezenas_check = dezenas_meio[:3] if is_seco else dezenas_meio
        else:
            dezenas_check = dezenas[:3] if is_seco else dezenas

        palpites_dez = [p[-2:].zfill(2) for p in palpites_norm[:3]]

        # Todos os 3 palpites devem estar nas dezenas
        if all(p in dezenas_check for p in palpites_dez):
            return True

    # =========================================================================
    # TERNO GRUPO (3 grupos devem aparecer)
    # =========================================================================
    elif modalidade.startswith("terno_gp"):
        if len(palpites_norm) < 3:
            return False

        if "esq" in modalidade:
            grupos_check = grupos_esq
        elif "meio" in modalidade:
            grupos_check = grupos_meio
        else:
            grupos_check = grupos

        try:
            palpites_gp = [int(p) for p in palpites_norm[:3]]
            if all(p in grupos_check for p in palpites_gp):
                return True
        except:
            pass

    # =========================================================================
    # QUADRA GRUPO (4 grupos devem aparecer)
    # =========================================================================
    elif modalidade.startswith("quadra_gp"):
        if len(palpites_norm) < 4:
            return False

        if "esq" in modalidade:
            grupos_check = grupos_esq
        elif "meio" in modalidade:
            grupos_check = grupos_meio
        else:
            grupos_check = grupos

        try:
            palpites_gp = [int(p) for p in palpites_norm[:4]]
            if all(p in grupos_check for p in palpites_gp):
                return True
        except:
            pass

    # =========================================================================
    # QUINA GRUPO (5 grupos de 8 escolhidos devem aparecer em 5 prêmios)
    # =========================================================================
    elif modalidade.startswith("quina_gp"):
        if len(palpites_norm) < 8:
            return False

        if "esq" in modalidade:
            grupos_check = set(grupos_esq[:5])  # Usa 5 primeiros prêmios
        elif "meio" in modalidade:
            grupos_check = set(grupos_meio[:5])
        else:
            grupos_check = set(grupos[:5])

        try:
            palpites_gp = set(int(p) for p in palpites_norm[:8])
            # Pelo menos 5 dos 8 palpites devem estar nos grupos dos prêmios
            acertos = palpites_gp.intersection(grupos_check)
            if len(acertos) >= 5:
                return True
        except:
            pass

    # =========================================================================
    # SENA GRUPO (6 grupos de 10 escolhidos devem aparecer em 6 prêmios)
    # =========================================================================
    elif modalidade.startswith("sena_gp"):
        if len(palpites_norm) < 10:
            return False

        if "esq" in modalidade:
            grupos_check = set(grupos_esq[:6])
        elif "meio" in modalidade:
            grupos_check = set(grupos_meio[:6])
        else:
            grupos_check = set(grupos[:6])

        try:
            palpites_gp = set(int(p) for p in palpites_norm[:10])
            acertos = palpites_gp.intersection(grupos_check)
            if len(acertos) >= 6:
                return True
        except:
            pass

    # =========================================================================
    # PASSE (combinação de 2 grupos em sequência)
    # =========================================================================
    elif modalidade == "passe_vai":
        # Grupo do 1º prêmio = palpite1, Grupo do 2º prêmio = palpite2
        if len(palpites_norm) < 2 or len(grupos) < 2:
            return False
        try:
            p1, p2 = int(palpites_norm[0]), int(palpites_norm[1])
            if grupos[0] == p1 and grupos[1] == p2:
                return True
        except:
            pass

    elif modalidade == "passe_vai_vem":
        # Qualquer ordem: (p1,p2) ou (p2,p1) nos 2 primeiros grupos
        if len(palpites_norm) < 2 or len(grupos) < 2:
            return False
        try:
            p1, p2 = int(palpites_norm[0]), int(palpites_norm[1])
            g1, g2 = grupos[0], grupos[1]
            if (g1 == p1 and g2 == p2) or (g1 == p2 and g2 == p1):
                return True
        except:
            pass

    # =========================================================================
    # PALPITÃO (jogo especial - verificar regras específicas)
    # =========================================================================
    elif modalidade == "palpitao":
        # Palpitão geralmente é uma combinação especial
        # Implementação depende das regras específicas da banca
        # Por ora, assume que é uma milhar especial
        for palpite in palpites_norm:
            for premio in premios:
                if palpite.zfill(4) == premio.zfill(4):
                    return True

    # =========================================================================
    # LOTINHA / QUININHA / SENINHA (jogos de dezenas acumuladas)
    # O jogador escolhe N dezenas (ex: "03-06-13-18-24-28")
    # Precisa acertar X dezenas nos resultados do dia:
    # - Lotinha: 4 acertos
    # - Quininha: 5 acertos
    # - Seninha: 6 acertos
    # NOTA: A verificação completa é feita no loop principal (verificar_premios_v2)
    # pois precisa de TODOS os resultados do dia, não apenas um.
    # Esta seção é fallback caso seja chamada com resultado único.
    # =========================================================================
    elif modalidade.startswith("lotinha_") or modalidade.startswith("quininha_") or modalidade.startswith("seninha_"):
        # Determina quantos acertos são necessários
        if modalidade.startswith("lotinha_"):
            acertos_necessarios = 4
        elif modalidade.startswith("quininha_"):
            acertos_necessarios = 5
        elif modalidade.startswith("seninha_"):
            acertos_necessarios = 6
        else:
            return False

        # Pega o primeiro palpite (formato: "03-06-13-18-24-28-30-...")
        if not palpites_norm:
            return False

        palpite_str = palpites_norm[0]

        # Separa as dezenas do palpite
        dezenas_palpite = set()
        for part in palpite_str.replace(" ", "").split("-"):
            part = part.strip()
            if part and part.isdigit():
                dezenas_palpite.add(part.zfill(2))

        if not dezenas_palpite:
            return False

        # Extrai dezenas dos prêmios disponíveis (direita - últimos 2 dígitos)
        dezenas_resultado = set()
        for premio in premios:
            if len(premio) >= 2:
                dez = premio[-2:].zfill(2)
                dezenas_resultado.add(dez)

        # Conta quantas dezenas do palpite aparecem no resultado
        acertos = len(dezenas_palpite & dezenas_resultado)

        if acertos >= acertos_necessarios:
            return True

    # =========================================================================
    # FALLBACK - Modalidade não reconhecida
    # =========================================================================
    else:
        print(f"  [AVISO] Modalidade não reconhecida: {modalidade}")
        # Tenta verificação básica como milhar
        for palpite in palpites_norm:
            for premio in premios:
                if palpite.zfill(4) == premio.zfill(4):
                    return True

    return False


def horario_expirou(data_jogo: str, horario: str, horas_limite: int = 1) -> bool:
    """
    Verifica se passou X horas do horário do sorteio
    """
    try:
        # Monta datetime do sorteio
        hora, minuto = horario.split(":")
        sorteio_dt = datetime.strptime(f"{data_jogo} {hora}:{minuto}", "%Y-%m-%d %H:%M")

        # Adiciona horas de tolerância
        limite_dt = sorteio_dt + timedelta(hours=horas_limite)

        # Compara com agora (Brasília)
        now_brt = agora_brasilia().replace(tzinfo=None)

        return now_brt > limite_dt
    except Exception:
        return False


def _enviar_alerta_scraper(titulo: str, mensagem: str, exc: Optional[Exception] = None) -> None:
    """Envia sinal de erro para Admin Master (webhook ou log critico)."""
    import traceback
    body = f"[SCRAPER ULTRA BANCA] {titulo}\n{mensagem}"
    if exc:
        body += f"\n\nExceção: {exc}\n{traceback.format_exc()}"
    print(f"CRITICAL: {body}")
    webhook_url = os.environ.get("SCRAPER_ALERT_WEBHOOK_URL") or os.environ.get("ADMIN_ALERT_WEBHOOK_URL")
    if webhook_url:
        try:
            import requests
            requests.post(
                webhook_url,
                json={"title": titulo, "message": mensagem, "source": "ultra-banca-scraper", "exception": str(exc) if exc else None},
                timeout=10
            )
        except Exception as e:
            print(f"CRITICAL: Falha ao enviar webhook de alerta: {e}")


@app.function(image=image, secrets=[supabase_secret], timeout=300)
def verificar_premios_v2(data: Optional[str] = None) -> dict:
    """
    Verifica apostas pendentes contra resultados (Versão Otimizada)
    - Busca Odds Dinâmicas no banco
    - Paginação de apostas
    - Filtra por data e loterias com resultado
    - Premiação via RPC fn_process_payout (atômico)
    """
    from supabase import create_client

    try:
        supabase_url = os.environ["SUPABASE_URL"]
        supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        supabase = create_client(supabase_url, supabase_key)
    except Exception as e:
        _enviar_alerta_scraper("Erro de conexão com o banco", "Falha ao criar cliente Supabase.", e)
        return {"verificadas": 0, "ganhou": 0, "perdeu": 0, "reembolsado": 0, "error": str(e)}

    data_verificar = data or hoje_brasilia()
    print(f"=== Verificando premios para {data_verificar} ===")

    try:
        # 1. Busca resultados do dia (ANTES das apostas para saber o que validar)
        resultados_resp = supabase.table("resultados").select("*").eq("data", data_verificar).execute()
        resultados = resultados_resp.data or []
    except Exception as e:
        _enviar_alerta_scraper("Erro ao buscar resultados", f"data={data_verificar}", e)
        return {"verificadas": 0, "ganhou": 0, "perdeu": 0, "reembolsado": 0, "error": str(e)}

    if not resultados:
        print(f"  Sem resultados para {data_verificar}")
        return {"verificadas": 0, "ganhou": 0, "perdeu": 0, "reembolsado": 0}

    total_verificadas = 0
    ganhou = 0
    perdeu = 0
    reembolsado = 0
    ainda_pendente = 0
    try:
        # Indexa resultados por horario+banca+loteria (evita colisão GERAL vs MALUCA etc)
        resultados_map = {}
        loterias_com_resultado = set()
        for r in resultados:
            key = f"{r['horario']}_{r['banca']}_{r['loteria']}"
            resultados_map[key] = r
            loterias_com_resultado.add(r['banca'])
            # BAHIA: em dias de Federal (qua/sab), o horario 19:00/20:00 tem loteria="FEDERAL"
            # mas as apostas mapeiam para "GERAL". Duplica a chave para garantir match.
            if r['banca'] == 'BAHIA' and r['loteria'] == 'FEDERAL':
                key_geral = f"{r['horario']}_{r['banca']}_GERAL"
                if key_geral not in resultados_map:
                    resultados_map[key_geral] = r
        print(f"  Resultados disponíveis: {len(resultados)} ({len(loterias_com_resultado)} bancas)")

        # 2. Odds por plataforma (multi-tenant): platform_modalidades primeiro, fallback para modalidades_config
        def get_multiplicador_platform(platform_id: Optional[str], modalidade: str, aposta_multiplicador: float, dynamic: dict) -> float:
            # Se a aposta já tem multiplicador definido, usar esse
            if aposta_multiplicador and aposta_multiplicador > 0:
                return float(aposta_multiplicador)

            # Primeiro tenta buscar da tabela platform_modalidades (config por banca)
            if platform_id:
                try:
                    r = supabase.table("platform_modalidades").select("multiplicador").eq("platform_id", platform_id).eq("codigo", modalidade).eq("ativo", True).execute()
                    if r.data and len(r.data) > 0:
                        mult = float(r.data[0].get("multiplicador", 0) or 0)
                        if mult > 0:
                            return mult
                except Exception as e:
                    print(f"  [AVISO] Falha ao buscar multiplicador platform_modalidades: {e}")

            # Fallback: usa RPC fn_get_multiplicador que faz a lógica de fallback no banco
            if platform_id:
                try:
                    rpc = supabase.rpc("fn_get_multiplicador", {"p_platform_id": platform_id, "p_codigo": modalidade}).execute()
                    raw = getattr(rpc, "data", None)
                    if raw and float(raw) > 0:
                        return float(raw)
                except Exception:
                    pass

            # Último fallback: dynamic_odds carregado de modalidades_config global
            return float(dynamic.get(modalidade, 0))

        dynamic_odds = {}
        try:
            odds_resp = supabase.table("modalidades_config").select("codigo, multiplicador").eq("ativo", True).execute()
            if odds_resp.data:
                for item in odds_resp.data:
                    dynamic_odds[item["codigo"]] = float(item["multiplicador"])
                print(f"  Odds dinâmicas carregadas: {len(dynamic_odds)} modalidades")
        except Exception as e:
            print(f"  [AVISO] Falha ao buscar odds dinâmicas: {e}")

        loteria_ids_com_resultado = set()
        for lid, (mb, mh, ml) in LOTERIA_TO_BANCA.items():
            key = f"{mh}_{mb}_{ml}"
            if key in resultados_map:
                loteria_ids_com_resultado.add(lid)

        # Buscar todas as pendentes do dia (limite 50k) e processar em memoria para evitar loop de paginacao
        MAX_APOSTAS = 50000
        print(f"  Buscando apostas pendentes para {data_verificar} (limite {MAX_APOSTAS})...")
        query = supabase.table("apostas").select("*").eq("data_jogo", data_verificar).eq("status", "pendente").order("id").limit(MAX_APOSTAS)
        apostas_resp = query.execute()
        apostas_lote = apostas_resp.data or []
        total_verificadas = len(apostas_lote)
        print(f"  Total pendentes no dia: {len(apostas_lote)}")
        ids_perdeu_batch = []

        for aposta in apostas_lote:
            loterias = aposta.get("loterias", [])
            palpites_raw = aposta.get("palpites") or aposta.get("palpite")
            if isinstance(palpites_raw, list):
                palpites_lista = [str(p).strip() for p in palpites_raw if p is not None and str(p).strip()]
            else:
                palpites_lista = [str(palpites_raw).strip()] if palpites_raw else []
            if not palpites_lista:
                palpites_lista = [""]
            modalidade_raw = (aposta.get("modalidade") or "milhar").strip().upper()
            # FIX: NÃO converter milhar_ct para centena - deixar verificar_modalidade tratar
            modalidade = modalidade_raw.lower() if isinstance(aposta.get("modalidade"), str) else "milhar"
            # FIX: campo correto é "colocacao", não "posicao"
            posicao = aposta.get("colocacao", "1_premio")
            # FIX: usar valor_unitario (por palpite), não valor_total (soma de todos)
            valor_aposta = float(aposta.get("valor_unitario", 0) or aposta.get("valor_total", 0) or 0)
            user_id = aposta.get("user_id")
            platform_id = aposta.get("platform_id")

            # FIX: parser robusto para todos os formatos de colocacao
            posicoes_validas = []
            if posicao == "geral":
                posicoes_validas = ["premio_1", "premio_2", "premio_3", "premio_4", "premio_5", "premio_6", "premio_7"]
            elif "_e_" in posicao:
                # Combo format: "1_e_1_5_premio" → pega o range mais amplo
                parts = posicao.replace("_premio", "").split("_e_")
                for part in parts:
                    nums = [int(x) for x in part.split("_") if x.isdigit()]
                    if len(nums) == 1:
                        pos_key = f"premio_{min(nums[0], 7)}"
                        if pos_key not in posicoes_validas:
                            posicoes_validas.append(pos_key)
                    elif len(nums) >= 2:
                        for i in range(nums[0], min(nums[-1] + 1, 8)):
                            pos_key = f"premio_{i}"
                            if pos_key not in posicoes_validas:
                                posicoes_validas.append(pos_key)
            elif "_premio" in posicao:
                nums = [int(x) for x in posicao.replace("_premio", "").replace("_ao_", "_").split("_") if x.isdigit()]
                if len(nums) == 1:
                    posicoes_validas = [f"premio_{min(nums[0], 7)}"]
                elif len(nums) >= 2:
                    posicoes_validas = [f"premio_{i}" for i in range(nums[0], min(nums[-1] + 1, 8))]
            if not posicoes_validas:
                posicoes_validas = ["premio_1"]

            aposta_ganhou = False
            todos_resultados_saiu = True
            loterias_sem_resultado = []
            horario_mais_tardio = None

            # =========================================================================
            # TRATAMENTO ESPECIAL: LOTINHA / QUININHA / SENINHA
            # Usam resultados DEDICADOS da Caixa Federal (scrapeados da API oficial):
            # - Lotinha: Lotofácil (15 dezenas de 01-25), precisa acertar 4+
            # - Quininha: Quina (5 dezenas), precisa acertar 5+
            # - Seninha: Mega-Sena (6 dezenas), precisa acertar 6+
            # Resultados armazenados em resultados com banca='CAIXA', dezenas CSV em premio_1
            # =========================================================================
            is_lotinha_quininha_seninha = modalidade.startswith("lotinha_") or modalidade.startswith("quininha_") or modalidade.startswith("seninha_")

            if is_lotinha_quininha_seninha:
                # Mapeia modalidade para loteria da Caixa
                if modalidade.startswith("lotinha_"):
                    acertos_necessarios = 4
                    caixa_loteria = "LOTO_FACIL"
                elif modalidade.startswith("quininha_"):
                    acertos_necessarios = 5
                    caixa_loteria = "QUINA"
                else:  # seninha
                    acertos_necessarios = 6
                    caixa_loteria = "MEGA_SENA"

                # Busca resultado da Caixa no resultados_map (chave: "20:00_CAIXA_LOTO_FACIL" etc)
                caixa_key = f"20:00_CAIXA_{caixa_loteria}"
                resultado_caixa = resultados_map.get(caixa_key)

                if not resultado_caixa:
                    todos_resultados_saiu = False
                    ainda_pendente += 1
                    print(f"  Aposta {aposta['id'][:8]} ({modalidade}) - Aguardando resultado CAIXA/{caixa_loteria}")
                    continue

                # Pega o palpite (formato: "03-06-13-18-24-28-30-...")
                palpite_str = palpites_lista[0] if palpites_lista else ""

                # Separa as dezenas do palpite
                dezenas_palpite = set()
                for part in palpite_str.replace(" ", "").split("-"):
                    part = part.strip()
                    if part and part.isdigit():
                        dezenas_palpite.add(part.zfill(2))

                if not dezenas_palpite:
                    print(f"  Aposta {aposta['id'][:8]} ({modalidade}) - Palpite inválido: {palpite_str}")
                    ids_perdeu_batch.append(aposta["id"])
                    perdeu += 1
                    continue

                # Extrair dezenas do resultado Caixa (formato CSV em premio_1: "02,05,06,08,...")
                dezenas_csv = str(resultado_caixa.get("premio_1", "") or "").strip()
                dezenas_resultado = set()
                for d in dezenas_csv.split(","):
                    d = d.strip()
                    if d and d.isdigit():
                        dezenas_resultado.add(d.zfill(2))

                if not dezenas_resultado:
                    print(f"  Aposta {aposta['id'][:8]} ({modalidade}) - Resultado CAIXA/{caixa_loteria} sem dezenas válidas: {dezenas_csv}")
                    ainda_pendente += 1
                    continue

                # Conta quantas dezenas do palpite aparecem no resultado
                acertos = len(dezenas_palpite & dezenas_resultado)
                print(f"  Aposta {aposta['id'][:8]} ({modalidade}) - CAIXA/{caixa_loteria}: Palpite {dezenas_palpite} vs Resultado {dezenas_resultado} = {acertos}/{acertos_necessarios} acertos")

                if acertos >= acertos_necessarios:
                    aposta_ganhou = True
                    print(f"  Aposta {aposta['id'][:8]} ({modalidade}) - GANHOU! Acertos: {acertos}")
                else:
                    ids_perdeu_batch.append(aposta["id"])
                    perdeu += 1
                    print(f"  Aposta {aposta['id'][:8]} ({modalidade}) - Perdeu ({acertos} acertos, precisava {acertos_necessarios})")

                # Continua para próxima aposta se não ganhou
                if not aposta_ganhou:
                    continue

            # =========================================================================
            # VERIFICAÇÃO PADRÃO (para jogos normais com loterias específicas)
            # =========================================================================
            if not is_lotinha_quininha_seninha:
                for loteria_id in loterias:
                    mapping = LOTERIA_TO_BANCA.get(loteria_id)
                    if not mapping:
                        print(f"  Comparando Aposta {aposta['id'][:8]} - Loteria na aposta: {loteria_id} | Resultado no scraper: (nao mapeada)")
                        continue
                    banca, horario, loteria = mapping
                    key = f"{horario}_{banca}_{loteria}"
                    resultado = resultados_map.get(key)
                    print(f"  Comparando Aposta {aposta['id'][:8]} - Loteria na aposta: {loteria_id} (banca={banca}, horario={horario}, loteria={loteria}) | Resultado no scraper: key={key!r} | Existe: {'sim' if resultado else 'nao'}")
                    if horario_mais_tardio is None or horario > horario_mais_tardio:
                        horario_mais_tardio = horario
                    if not resultado:
                        todos_resultados_saiu = False
                        loterias_sem_resultado.append((loteria_id, banca, horario))
                        continue

                    # MALUCA (não-BAHIA): inversão COMPLETA da milhar (4 dígitos revertidos)
                    # Ex: resultado "1234" → maluca "4321" (str[::-1])
                    # BAHIA MALUCA já tem resultados separados, não precisa inverter
                    # Padrão A (RIO, NAC, LOOK, LOTEP, SP, RS, MG, BOASORTE): inversão milhar P1-P5, P6-P7 = None (derivam de P8-P9 que não temos no DB)
                    # Padrão B (LOTECE): inversão milhar em TODOS os prêmios (P1-P7)
                    is_maluca_nao_bahia = loteria_id.endswith("_maluca") and not loteria_id.startswith("ba_maluca")
                    if is_maluca_nao_bahia and resultado:
                        resultado_verificar = dict(resultado)
                        is_lotece = loteria_id.startswith("ce_")

                        if is_lotece:
                            # Padrão B: TODOS os prêmios recebem inversão completa da milhar
                            for pos in ["premio_1", "premio_2", "premio_3", "premio_4", "premio_5", "premio_6", "premio_7"]:
                                val = str(resultado_verificar.get(pos, "") or "").strip()
                                if val and len(val) >= 4:
                                    resultado_verificar[pos] = val[::-1]
                        else:
                            # Padrão A: P1-P5 = inversão completa da milhar, P6-P7 = None (não temos P8-P9 no DB)
                            for pos in ["premio_1", "premio_2", "premio_3", "premio_4", "premio_5"]:
                                val = str(resultado_verificar.get(pos, "") or "").strip()
                                if val and len(val) >= 4:
                                    resultado_verificar[pos] = val[::-1]
                            # P6-P7 da MALUCA derivam de P8-P9 normal (que não armazenamos), então anulamos
                            resultado_verificar["premio_6"] = None
                            resultado_verificar["premio_7"] = None

                        print(f"  MALUCA: Invertendo milhar ({'LOTECE' if is_lotece else 'padrao'}) para {loteria_id}")
                    else:
                        resultado_verificar = resultado

                    # Usa a função de verificação completa para todas as modalidades
                    aposta_ganhou = verificar_modalidade(
                        modalidade=modalidade,
                        palpites=palpites_lista,
                        resultado=resultado_verificar,
                        posicoes_validas=posicoes_validas
                    )

                    if aposta_ganhou:
                        print(f"  Aposta {aposta['id'][:8]} - Modalidade {modalidade} - GANHOU na loteria {loteria_id}")
                        break

            if aposta_ganhou:
                # FIX: Para milhar_ct, determinar se acertou milhar (rate alto) ou só centena (consolação)
                if modalidade == "milhar_ct" and not is_lotinha_quininha_seninha:
                    is_milhar_match = False
                    for palpite in palpites_lista:
                        palpite_4 = palpite.zfill(4)
                        for loteria_id_chk in loterias:
                            mapping_chk = LOTERIA_TO_BANCA.get(loteria_id_chk)
                            if not mapping_chk:
                                continue
                            banca_chk, horario_chk, loteria_chk = mapping_chk
                            key_chk = f"{horario_chk}_{banca_chk}_{loteria_chk}"
                            res_chk = resultados_map.get(key_chk)
                            if not res_chk:
                                continue
                            for pos_chk in posicoes_validas:
                                premio_chk = str(res_chk.get(pos_chk, "") or "").strip()
                                if premio_chk and palpite_4 == premio_chk.zfill(4):
                                    is_milhar_match = True
                                    break
                            if is_milhar_match:
                                break
                        if is_milhar_match:
                            break
                    if is_milhar_match:
                        # Milhar exata: usar multiplicador de milhar_ct
                        multiplicador = get_multiplicador_platform(
                            platform_id, "milhar_ct",
                            float(aposta.get("multiplicador", 0) or 0),
                            dynamic_odds
                        )
                    else:
                        # Só centena (consolação): usar multiplicador de centena, ignorar o da aposta
                        multiplicador = get_multiplicador_platform(
                            platform_id, "centena", 0, dynamic_odds
                        )
                else:
                    multiplicador = get_multiplicador_platform(
                        platform_id, modalidade,
                        float(aposta.get("multiplicador", 0) or 0),
                        dynamic_odds
                    )
                valor_premio = valor_aposta * multiplicador
                ganhou += 1
                print(f"  Aposta {aposta['id'][:8]} GANHOU! Premio: R${valor_premio:.2f} (mult={multiplicador}, valor={valor_aposta})")
                if user_id and valor_premio > 0:
                    try:
                        premio_arredondado = round(float(valor_premio), 2)
                        # 1. Creditar saldo via RPC atômico (FOR UPDATE + ledger)
                        rpc_result = supabase.rpc("fn_change_balance", {
                            "p_user_id": user_id,
                            "p_amount": premio_arredondado,
                            "p_type": "premio",
                            "p_wallet": "saldo",
                            "p_reference_id": aposta["id"],
                            "p_description": f"Premio {modalidade} aposta {aposta['id'][:8]}",
                        }).execute()
                        rpc_data = getattr(rpc_result, "data", None)
                        if isinstance(rpc_data, dict) and rpc_data.get("error"):
                            raise Exception(f"fn_change_balance error: {rpc_data['error']}")
                        novo_saldo = rpc_data.get("balance_after", 0) if isinstance(rpc_data, dict) else 0
                        print(f"  Saldo creditado via RPC para {aposta['id'][:8]}, novo saldo: R${novo_saldo:.2f}")
                        # 2. SÓ DEPOIS do crédito: marcar aposta como premiada
                        supabase.table("apostas").update({
                            "status": "premiada",
                            "premio_valor": premio_arredondado
                        }).eq("id", aposta["id"]).execute()
                        # 3. Registrar transação
                        supabase.table("transactions").insert({
                            "user_id": user_id,
                            "platform_id": platform_id,
                            "tipo": "prize",
                            "amount": premio_arredondado,
                            "status": "completed",
                            "external_id": f"payout_{aposta['id']}",
                            "metadata": {"modalidade": modalidade, "description": f"Premio de aposta: {aposta['id']}"},
                        }).execute()
                        print(f"  Aposta {aposta['id'][:8]} PAGA! Novo saldo: R${novo_saldo:.2f}")
                        # 4. Notificar premio (sem dados pessoais nos logs)
                        try:
                            app_url = os.environ.get("APP_URL", "https://ultrabanca.app")
                            internal_secret = os.environ.get("INTERNAL_API_SECRET", "")
                            if internal_secret:
                                import requests
                                profile_resp = supabase.table("profiles").select("nome, telefone").eq("id", user_id).single().execute()
                                requests.post(
                                    f"{app_url}/api/internal/triggers",
                                    json={
                                        "triggerType": "premio",
                                        "userData": {
                                            "nome": (profile_resp.data or {}).get("nome", "Cliente"),
                                            "telefone": (profile_resp.data or {}).get("telefone"),
                                            "premio": valor_premio,
                                            "modalidade": modalidade,
                                            "saldo": novo_saldo
                                        }
                                    },
                                    headers={"x-internal-secret": internal_secret},
                                    timeout=5
                                )
                        except Exception as trigger_err:
                            print(f"  [Erro Gatilho] {trigger_err}")
                    except Exception as e:
                        print(f"  ERRO payout {aposta['id'][:8]}: {type(e).__name__}: {e}")
                        import traceback
                        traceback.print_exc()

            elif todos_resultados_saiu:
                ids_perdeu_batch.append(aposta["id"])
                perdeu += 1
                print(f"  Aposta {aposta['id'][:8]} perdeu")
            else:
                todas_expiraram = True
                for lot_id, banca, horario in loterias_sem_resultado:
                    if not horario_expirou(data_verificar, horario, horas_limite=12):
                        todas_expiraram = False
                        break
                if todas_expiraram and loterias_sem_resultado:
                    # Reembolso atômico via RPC
                    try:
                        loterias_str = ", ".join([f"{lid} ({banca} {h})" for lid, banca, h in loterias_sem_resultado])
                        valor_reembolso = float(aposta.get("valor_total", 0) or 0)
                        if not user_id:
                            print(f"  ERRO reembolso {aposta['id'][:8]}: user_id ausente, pulando")
                            ainda_pendente += 1
                            continue
                        if valor_reembolso > 0:
                            # 1. Creditar saldo via RPC atômico
                            rpc_result = supabase.rpc("fn_change_balance", {
                                "p_user_id": user_id,
                                "p_amount": valor_reembolso,
                                "p_type": "reembolso",
                                "p_wallet": "saldo",
                                "p_reference_id": aposta["id"],
                                "p_description": f"Reembolso: resultado indisponivel apos 12h",
                            }).execute()
                            rpc_data = getattr(rpc_result, "data", None)
                            if isinstance(rpc_data, dict) and rpc_data.get("error"):
                                raise Exception(f"fn_change_balance error: {rpc_data['error']}")
                            # 2. Registrar transação
                            supabase.table("transactions").insert({
                                "user_id": user_id,
                                "platform_id": platform_id,
                                "tipo": "refund",
                                "amount": valor_reembolso,
                                "status": "completed",
                                "external_id": f"refund_{aposta['id']}",
                                "metadata": {"reason": f"Resultado indisponivel apos 12h: {loterias_str}", "bet_id": aposta["id"]},
                            }).execute()
                            # 3. SÓ DEPOIS do crédito: marcar aposta como reembolsada
                            supabase.table("apostas").update({
                                "status": "reembolsado"
                            }).eq("id", aposta["id"]).execute()
                            reembolsado += 1
                            print(f"  Aposta {aposta['id'][:8]} REEMBOLSADA (R${valor_reembolso:.2f})")
                        else:
                            # valor_reembolso == 0, marcar como reembolsado sem crédito
                            supabase.table("apostas").update({
                                "status": "reembolsado"
                            }).eq("id", aposta["id"]).execute()
                            reembolsado += 1
                            print(f"  Aposta {aposta['id'][:8]} REEMBOLSADA (valor=R$0, sem crédito)")
                    except Exception as e:
                        print(f"  Erro ao reembolsar {aposta['id'][:8]}: {e}")
                        ainda_pendente += 1
                else:
                    ainda_pendente += 1
                    print(f"  Aposta {aposta['id'][:8]} ainda pendente (aguardando resultado)")

        # Marcar como perdeu em lote (evita N updates)
        if ids_perdeu_batch:
            try:
                rpc = supabase.rpc("fn_mark_bets_lost", {"p_bet_ids": ids_perdeu_batch}).execute()
                raw = getattr(rpc, "data", None)
                res = (raw[0] if isinstance(raw, list) and raw else raw) or {}
                n = res.get("updated", 0) if isinstance(res, dict) else 0
                print(f"  Batch perdeu: {len(ids_perdeu_batch)} IDs enviados, {n} atualizados")
            except Exception as e:
                print(f"  [AVISO] Batch perdeu falhou: {e}; marcando uma a uma")
                for bid in ids_perdeu_batch:
                    try:
                        supabase.table("apostas").update({"status": "perdeu"}).eq("id", bid).execute()
                    except Exception:
                        pass

        resultado_final = {
            "data": data_verificar,
            "verificadas": total_verificadas,
            "ganhou": ganhou,
            "perdeu": perdeu,
            "reembolsado": reembolsado,
            "pendente": ainda_pendente,
        }
        print(f"=== Verificacao concluida: {resultado_final} ===")
        return resultado_final
    except Exception as e:
        _enviar_alerta_scraper("Erro na verificacao de premios", f"data={data_verificar}. Processo interrompido.", e)
        return {
            "data": data_verificar,
            "verificadas": total_verificadas,
            "ganhou": ganhou,
            "perdeu": perdeu,
            "reembolsado": reembolsado,
            "pendente": ainda_pendente,
            "error": str(e),
        }


# =============================================================================
# CLI
# =============================================================================

@app.function(image=image, secrets=[supabase_secret], timeout=1800)
def scrape_ultimos_dias(dias: int = 7) -> dict:
    """
    Scrape dos últimos N dias para todos os estados (v4 - requests primeiro)
    """
    from supabase import create_client
    import time

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    hoje = agora_brasilia()
    resultados_total = []
    resumo_por_dia = {}

    print(f"\n{'='*70}")
    print(f"SCRAPE V4 DOS ÚLTIMOS {dias} DIAS")
    print(f"{'='*70}\n")

    total_creditos = 0

    for i in range(dias):
        data_scrape = (hoje - timedelta(days=i)).strftime("%Y-%m-%d")
        print(f"\n{'='*70}")
        print(f"DIA {i+1}/{dias}: {data_scrape}")
        print(f"{'='*70}")

        todos_resultados = []
        erros = []
        dia_creditos = 0

        for estado in list(ESTADOS_CONFIG.keys()):
            try:
                resultado = scrape_estado.remote(estado, data_scrape)

                if resultado.get("error"):
                    erros.append(f"{estado}: {resultado['error']}")
                else:
                    todos_resultados.extend(resultado.get("resultados", []))
                    dia_creditos += resultado.get("creditos_firecrawl", 0)
                    print(f"[{estado}] OK: {len(resultado.get('resultados', []))} resultados via {resultado.get('fonte_utilizada', 'N/A')}")

                # Delay entre estados
                time.sleep(2)

            except Exception as e:
                erros.append(f"{estado}: {str(e)}")
                print(f"[{estado}] Exceção: {e}")

        # Salvar no Supabase
        upserted = _upsert_resultados(supabase, todos_resultados)

        resumo_por_dia[data_scrape] = {
            "scraped": len(todos_resultados),
            "upserted": upserted,
            "erros": len(erros),
            "creditos_firecrawl": dia_creditos,
        }
        resultados_total.extend(todos_resultados)
        total_creditos += dia_creditos

        print(f"\n📊 Resumo {data_scrape}: {len(todos_resultados)} scraped, {upserted} upserted, 💰 {dia_creditos} créditos Firecrawl")

        # Verificar apostas do dia
        verificar_premios_v2.remote(data_scrape)

    print(f"\n{'='*70}")
    print(f"RESUMO FINAL V4 - {dias} DIAS")
    print(f"{'='*70}")
    for data_str, stats in resumo_por_dia.items():
        print(f"  {data_str}: {stats['scraped']} scraped, {stats['upserted']} upserted, {stats['erros']} erros, {stats['creditos_firecrawl']} créditos")
    print(f"\nTOTAL: {len(resultados_total)} resultados, 💰 {total_creditos} créditos Firecrawl gastos")

    return {
        "success": True,
        "dias": dias,
        "total_resultados": len(resultados_total),
        "creditos_firecrawl": total_creditos,
        "resumo_por_dia": resumo_por_dia,
    }


@app.local_entrypoint()
def main(
    comando: str = "scrape",
    estado: str = "RJ",
    data: Optional[str] = None,
    dias: int = 7,
):
    """
    Comandos v4 (requests-first, Firecrawl como fallback):
        scrape   - Scrape otimizado de um estado (requests primeiro)
        todos    - Scrape de todos os estados para uma data
        historico - Scrape dos últimos N dias (padrão: 7)
        verificar - Verificar prêmios de apostas pendentes

    Exemplos:
        modal run modal_scraper_v4.py --comando scrape --estado MG --data 2026-01-30
        modal run modal_scraper_v4.py --comando todos --data 2026-01-29
        modal run modal_scraper_v4.py --comando historico --dias 7
        modal run modal_scraper_v4.py --comando verificar --data 2026-01-29
    """
    if comando == "scrape":
        print(f"\n{'#'*70}")
        print(f"# SCRAPE V4 (requests-first): {estado} - {data or 'hoje'}")
        print(f"{'#'*70}\n")

        resultado = scrape_estado.remote(estado, data)

        print(f"\n{'#'*70}")
        print(f"# RESULTADO FINAL")
        print(f"{'#'*70}")
        print(f"Estado: {resultado.get('estado')}")
        print(f"Banca: {resultado.get('banca')}")
        print(f"Fonte utilizada: {resultado.get('fonte_utilizada', 'N/A')}")
        print(f"Total de resultados: {len(resultado.get('resultados', []))}")
        print(f"Créditos Firecrawl: {resultado.get('creditos_firecrawl', 0)}")

        if resultado.get('tentativas'):
            print(f"\nTentativas:")
            for t in resultado.get('tentativas', []):
                print(f"  - {t}")

        if resultado.get('resultados'):
            print(f"\nResultados encontrados:")
            for r in resultado.get('resultados', [])[:5]:
                premios = r.get('premios', [])
                p1 = premios[0]['milhar'] if premios else 'N/A'
                bicho = premios[0].get('bicho', '') if premios else ''
                print(f"  {r['horario']} {r['loteria']}: 1º={p1} {bicho}")

        if resultado.get('error'):
            print(f"\n❌ ERRO: {resultado.get('error')}")

    elif comando == "todos":
        print(f"Scraping V4 todos os estados para {data or 'hoje'}...")
        resultado = scrape_todos_v4.remote(data)
        print(f"\nResultado: {resultado}")

    elif comando == "historico":
        print(f"\n{'#'*70}")
        print(f"# SCRAPE V4 HISTÓRICO: ÚLTIMOS {dias} DIAS")
        print(f"{'#'*70}\n")
        resultado = scrape_ultimos_dias.remote(dias)
        print(f"\nResultado final: {resultado}")

    elif comando == "verificar":
        data_verificar = data or hoje_brasilia()
        print(f"\n{'#'*70}")
        print(f"# VERIFICAR PRÊMIOS: {data_verificar}")
        print(f"{'#'*70}\n")
        resultado = verificar_premios_v2.remote(data_verificar)
        print(f"\nResultado: {resultado}")

    else:
        print(f"Comando: {comando}")
        print("Comandos válidos: scrape, todos, historico, verificar")
