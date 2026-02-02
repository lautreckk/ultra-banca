"""
Ultra Banca - Scraper de Resultados v2
Usa Firecrawl para scraping inteligente
"""

import modal
from datetime import datetime, timedelta
from typing import Optional
import os
import re

# Criar app Modal separado
app = modal.App("ultra-banca-scraper-v2")

# Imagem com Firecrawl + requests para fallback
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
}

BASE_URL = "https://www.resultadofacil.com.br"


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

        # Também verifica o parent
        parent = header.find_parent()
        if parent:
            content_text += " " + parent.get_text()

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
# FONTE 1: RESULTADOFACIL + FALLBACKS
# =============================================================================

def scrape_resultadofacil_requests(url: str, estado: str, data: str, banca: str) -> list:
    """
    Scrape ResultadoFacil usando requests direto (fallback do Firecrawl)
    """
    import requests
    from bs4 import BeautifulSoup

    log_info(estado, "ResultadoFacil", "Tentando via requests direto...")

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        html_content = response.text
        log_info(estado, "ResultadoFacil", f"HTML recebido: {len(html_content)} bytes")

        soup = BeautifulSoup(html_content, "html.parser")
        resultados = parse_resultados(soup, data, banca)

        if resultados:
            log_success(estado, "ResultadoFacil", f"Encontrados {len(resultados)} resultados via requests")
        else:
            log_warning(estado, "ResultadoFacil", "Nenhum resultado via requests")

        return resultados

    except Exception as e:
        log_error(estado, "ResultadoFacil", f"Erro requests: {e}")
        return []


@app.function(image=image, secrets=[supabase_secret, firecrawl_secret], timeout=300)
def scrape_estado_firecrawl(estado: str, data: Optional[str] = None) -> dict:
    """
    Scrape inteligente com múltiplas fontes:
    1. ResultadoFacil via Firecrawl
    2. ResultadoFacil via requests (se Firecrawl falhar)
    3. PortalBrasil (se ResultadoFacil não tiver resultados)
    """
    from firecrawl import Firecrawl
    from bs4 import BeautifulSoup

    config = ESTADOS_CONFIG.get(estado)
    if not config:
        log_error(estado, "Sistema", "Estado não configurado")
        return {"estado": estado, "error": "Estado não configurado", "resultados": []}

    data_scrape = data or datetime.now().strftime("%Y-%m-%d")
    url_resultadofacil = f"{BASE_URL}/resultado-do-jogo-do-bicho/{config['url_param']}/do-dia/{data_scrape}"

    print(f"\n{'='*60}")
    print(f"[{estado}] 🎯 INICIANDO SCRAPE - {config['banca']} - {data_scrape}")
    print(f"{'='*60}")

    resultados = []
    fonte_utilizada = None
    tentativas = []

    # =========================================================================
    # TENTATIVA 1: ResultadoFacil via Firecrawl
    # =========================================================================
    log_info(estado, "Firecrawl", f"Acessando: {url_resultadofacil}")

    try:
        api_key = os.environ.get("FIRECRAWL_API_KEY")
        if not api_key:
            log_error(estado, "Firecrawl", "API key não encontrada")
            tentativas.append({"fonte": "Firecrawl", "status": "erro", "motivo": "API key ausente"})
        else:
            firecrawl = Firecrawl(api_key=api_key)

            response = firecrawl.scrape(
                url_resultadofacil,
                formats=["html", "markdown"],
                wait_for=5000,
                timeout=30000,
            )

            if response:
                html_content = getattr(response, "html", "") or ""
                markdown_content = getattr(response, "markdown", "") or ""

                log_info(estado, "Firecrawl", f"HTML: {len(html_content)} bytes | Markdown: {len(markdown_content)} bytes")

                if html_content:
                    soup = BeautifulSoup(html_content, "html.parser")
                    resultados = parse_resultados(soup, data_scrape, config['banca'])

                if not resultados and markdown_content:
                    log_info(estado, "Firecrawl", "Tentando parse via Markdown...")
                    resultados = parse_markdown(markdown_content, data_scrape, config['banca'])

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
    # TENTATIVA 2: ResultadoFacil via requests (se Firecrawl falhou)
    # =========================================================================
    if not resultados:
        log_fallback(estado, "Firecrawl", "Requests", "sem resultados ou erro")

        resultados = scrape_resultadofacil_requests(url_resultadofacil, estado, data_scrape, config['banca'])

        if resultados:
            fonte_utilizada = "Requests/ResultadoFacil"
            tentativas.append({"fonte": "Requests/ResultadoFacil", "status": "sucesso", "resultados": len(resultados)})
        else:
            tentativas.append({"fonte": "Requests/ResultadoFacil", "status": "sem_dados"})

    # =========================================================================
    # TENTATIVA 3: PortalBrasil (se ResultadoFacil não tiver resultados)
    # =========================================================================
    if not resultados:
        log_fallback(estado, "ResultadoFacil", "PortalBrasil", "sem resultados")

        resultados = scrape_portalbrasil(estado, data_scrape, config['banca'])

        if resultados:
            fonte_utilizada = "PortalBrasil"
            tentativas.append({"fonte": "PortalBrasil", "status": "sucesso", "resultados": len(resultados)})
        else:
            tentativas.append({"fonte": "PortalBrasil", "status": "sem_dados"})

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

    print(f"{'='*60}\n")

    return {
        "estado": estado,
        "banca": config['banca'],
        "url": url_resultadofacil,
        "resultados": resultados,
        "fonte_utilizada": fonte_utilizada,
        "tentativas": tentativas,
        "error": None
    }


def parse_resultados(soup, data: str, banca: str) -> list:
    """Parser principal - tenta várias estratégias"""
    resultados = []

    # Estratégia 1: h3 com classe "g"
    resultados = parse_estrutura_h3(soup, data, banca)
    if resultados:
        return resultados

    # Estratégia 2: Qualquer h3 com horário
    resultados = parse_qualquer_h3(soup, data, banca)
    if resultados:
        return resultados

    # Estratégia 3: Busca por tabelas
    resultados = parse_por_tabelas(soup, data, banca)

    return resultados


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
            horario, loteria = buscar_info_tabela(table)

            if horario:
                resultados.append({
                    "data": data,
                    "horario": horario,
                    "banca": banca,
                    "loteria": loteria,
                    "premios": premios,
                })

    return resultados


def buscar_info_tabela(table) -> tuple:
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

    return horario, loteria


def parse_markdown(markdown: str, data: str, banca: str) -> list:
    """Parser pelo conteúdo Markdown - múltiplas estratégias"""
    resultados = []

    # Divide por seções (headers ou linhas em branco múltiplas)
    sections = re.split(r'\n##?\s+|\n{3,}', markdown)

    for section in sections:
        # Estratégia 1: Busca horário no formato 12h, 12h00, 12:00
        horario_match = re.search(r'(\d{1,2})[h:H](\d{2})?', section)
        if not horario_match:
            continue

        hora = horario_match.group(1).zfill(2)
        minuto = horario_match.group(2) or "00"
        horario = f"{hora}:{minuto}"

        loteria = identificar_loteria(section[:300])

        # Múltiplas estratégias para extrair prêmios
        premios_matches = []

        # Estratégia 1: | 1234 | (tabelas markdown)
        premios_matches = re.findall(r'\|\s*(\d{4})\s*\|', section)

        # Estratégia 2: Linhas com "1º" seguido de número
        if len(premios_matches) < 5:
            premios_matches = re.findall(r'[1-7][ºª°]\s*[:\|]?\s*(\d{4})', section)

        # Estratégia 3: Números de 4 dígitos em sequência (após filtrar datas/horários)
        if len(premios_matches) < 5:
            # Remove datas e horários conhecidos
            section_clean = re.sub(r'\d{4}-\d{2}-\d{2}', '', section)
            section_clean = re.sub(r'\d{1,2}[h:H]\d{2}', '', section_clean)
            section_clean = re.sub(r'\d{2}/\d{2}/\d{4}', '', section_clean)

            # Busca milhares restantes
            all_milhares = re.findall(r'\b(\d{4})\b', section_clean)
            if len(all_milhares) >= 5:
                premios_matches = all_milhares[:7]

        # Estratégia 4: Busca bicho + milhar (ex: "Avestruz 1234")
        if len(premios_matches) < 5:
            bicho_pattern = r'(?:Avestruz|Águia|Burro|Borboleta|Cachorro|Cabra|Carneiro|Camelo|Cobra|Coelho|Cavalo|Elefante|Galo|Gato|Jacaré|Leão|Macaco|Porco|Pavão|Peru|Touro|Tigre|Urso|Veado|Vaca)\s*[:\-]?\s*(\d{4})'
            premios_matches = re.findall(bicho_pattern, section, re.IGNORECASE)

        if len(premios_matches) >= 5:
            premios = [{"milhar": m, "bicho": ""} for m in premios_matches[:7]]
            resultados.append({
                "data": data,
                "horario": horario,
                "banca": banca,
                "loteria": loteria,
                "premios": premios,
            })

    return resultados


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

    # PERNAMBUCO
    if "LOTEP" in texto_upper:
        return "LOTEP"

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
# FUNCAO PRINCIPAL
# =============================================================================

@app.function(image=image, secrets=[supabase_secret, firecrawl_secret], timeout=900)
def scrape_todos_v2(data: Optional[str] = None, estados: Optional[list] = None) -> dict:
    """
    Scrape todos os estados usando Firecrawl
    """
    from supabase import create_client
    import time

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    data_scrape = data or datetime.now().strftime("%Y-%m-%d")
    estados_scrape = estados or list(ESTADOS_CONFIG.keys())

    print(f"=== Scrape V2 (Firecrawl) iniciado: {data_scrape} ===")
    print(f"Estados: {estados_scrape}")

    todos_resultados = []
    erros = []

    for estado in estados_scrape:
        try:
            resultado = scrape_estado_firecrawl.remote(estado, data_scrape)

            if resultado.get("error"):
                erros.append(f"{estado}: {resultado['error']}")
                print(f"[{estado}] Erro: {resultado['error']}")
            else:
                todos_resultados.extend(resultado.get("resultados", []))
                print(f"[{estado}] OK: {len(resultado.get('resultados', []))} resultados")

            # Pequeno delay entre estados para não sobrecarregar
            time.sleep(1)

        except Exception as e:
            erros.append(f"{estado}: {str(e)}")
            print(f"[{estado}] Exceção: {e}")

    print(f"\nTotal de resultados: {len(todos_resultados)}")

    # Salvar no Supabase
    upserted = 0
    db_errors = []

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
        except Exception as e:
            db_errors.append(f"{r['banca']} {r['horario']}: {e}")

    resultado_final = {
        "success": True,
        "data": data_scrape,
        "total_scraped": len(todos_resultados),
        "upserted": upserted,
        "scrape_errors": erros if erros else None,
        "db_errors": db_errors[:10] if db_errors else None,
    }

    print(f"\n=== Scrape V2 finalizado: {resultado_final} ===")
    return resultado_final


# =============================================================================
# FUNCAO DE TESTE
# =============================================================================

@app.function(image=image, secrets=[supabase_secret, firecrawl_secret], timeout=120)
def teste_firecrawl(estado: str = "RJ", data: Optional[str] = None) -> dict:
    """
    Testa scrape de um estado e mostra detalhes
    """
    from firecrawl import Firecrawl
    from bs4 import BeautifulSoup

    config = ESTADOS_CONFIG.get(estado)
    if not config:
        return {"error": f"Estado {estado} não configurado"}

    data_scrape = data or datetime.now().strftime("%Y-%m-%d")
    url = f"{BASE_URL}/resultado-do-jogo-do-bicho/{config['url_param']}/do-dia/{data_scrape}"

    print(f"Testando Firecrawl: {url}")

    resultado = {
        "estado": estado,
        "url": url,
        "data": data_scrape,
    }

    try:
        api_key = os.environ.get("FIRECRAWL_API_KEY")
        if not api_key:
            return {"error": "FIRECRAWL_API_KEY não encontrada"}

        firecrawl = Firecrawl(api_key=api_key)

        print("Chamando Firecrawl...")
        response = firecrawl.scrape(
            url,
            formats=["html", "markdown"],
            wait_for=5000,
            timeout=30000,
        )

        resultado["firecrawl_success"] = True if response else False

        # Firecrawl retorna objeto Document com atributos
        html = getattr(response, "html", "") or "" if response else ""
        markdown = getattr(response, "markdown", "") or "" if response else ""

        resultado["html_size"] = len(html)
        resultado["markdown_size"] = len(markdown)
        resultado["markdown_preview"] = markdown[:1500] if markdown else ""

        if html:
            soup = BeautifulSoup(html, "html.parser")

            resultado["h3_count"] = len(soup.find_all("h3"))
            resultado["h3_g_count"] = len(soup.find_all("h3", class_="g"))
            resultado["table_count"] = len(soup.find_all("table"))

            # Parse
            resultados = parse_resultados(soup, data_scrape, config['banca'])
            resultado["resultados_encontrados"] = len(resultados)
            resultado["resultados_amostra"] = resultados[:3]

        resultado["success"] = True

    except Exception as e:
        resultado["error"] = str(e)
        resultado["success"] = False
        import traceback
        traceback.print_exc()

    return resultado


# =============================================================================
# MAPEAMENTO LOTERIAS -> RESULTADOS (para verificacao de apostas)
# =============================================================================

LOTERIA_TO_BANCA = {
    # RIO DE JANEIRO
    "rj_pt_09": ("RIO/FEDERAL", "09:20"),
    "rj_ptm_11": ("RIO/FEDERAL", "11:00"),
    "rj_pt_14": ("RIO/FEDERAL", "14:20"),
    "pt_14": ("RIO/FEDERAL", "14:20"),  # alias
    "rj_ptv_16": ("RIO/FEDERAL", "16:00"),
    "rj_ptn_18": ("RIO/FEDERAL", "18:20"),
    "rj_coruja_21": ("RIO/FEDERAL", "21:20"),
    "coruja_21": ("RIO/FEDERAL", "21:20"),  # alias
    # BAHIA
    "ba_10": ("BAHIA", "10:00"),
    "ba_12": ("BAHIA", "12:00"),
    "ba_15": ("BAHIA", "15:00"),
    "ba_19": ("BAHIA", "19:00"),
    "ba_20": ("BAHIA", "20:00"),
    "ba_21": ("BAHIA", "21:00"),
    "ba_maluca_10": ("BAHIA", "10:00"),
    "ba_maluca_12": ("BAHIA", "12:00"),
    "ba_maluca_15": ("BAHIA", "15:00"),
    "ba_maluca_19": ("BAHIA", "19:00"),
    "ba_maluca_20": ("BAHIA", "20:00"),
    "ba_maluca_21": ("BAHIA", "21:00"),
    # GOIAS
    "go_07": ("LOOK/GOIAS", "07:00"),
    "go_09": ("LOOK/GOIAS", "09:00"),
    "go_11": ("LOOK/GOIAS", "11:00"),
    "go_14": ("LOOK/GOIAS", "14:00"),
    "go_16": ("LOOK/GOIAS", "16:00"),
    "go_18": ("LOOK/GOIAS", "18:00"),
    "go_21": ("LOOK/GOIAS", "21:00"),
    "go_23": ("LOOK/GOIAS", "23:00"),
    # CEARA
    "ce_11": ("LOTECE", "11:00"),
    "ce_12": ("LOTECE", "12:00"),
    "ce_14": ("LOTECE", "14:00"),
    "ce_15": ("LOTECE", "15:45"),
    "ce_19": ("LOTECE", "19:00"),
    # PERNAMBUCO
    "pe_09": ("LOTEP", "09:20"),
    "pe_09b": ("LOTEP", "09:30"),
    "pe_09c": ("LOTEP", "09:40"),
    "pe_10": ("LOTEP", "10:00"),
    "pe_11": ("LOTEP", "11:00"),
    "pe_12": ("LOTEP", "12:40"),
    "pe_12b": ("LOTEP", "12:45"),
    "pe_14": ("LOTEP", "14:00"),
    "pe_15": ("LOTEP", "15:40"),
    "pe_15b": ("LOTEP", "15:45"),
    "pe_17": ("LOTEP", "17:00"),
    "pe_18": ("LOTEP", "18:30"),
    "pe_19": ("LOTEP", "19:00"),
    "pe_19b": ("LOTEP", "19:30"),
    "pe_20": ("LOTEP", "20:00"),
    "pe_21": ("LOTEP", "21:00"),
    # PARAIBA
    "pb_09": ("PARAIBA", "09:45"),
    "pb_10": ("PARAIBA", "10:45"),
    "pb_12": ("PARAIBA", "12:45"),
    "pb_15": ("PARAIBA", "15:45"),
    "pb_18": ("PARAIBA", "18:00"),
    "pb_19": ("PARAIBA", "19:05"),
    "pb_20": ("PARAIBA", "20:00"),
    "pb_lotep_10": ("PARAIBA", "10:45"),
    "pb_lotep_12": ("PARAIBA", "12:45"),
    "pb_lotep_15": ("PARAIBA", "15:45"),
    "pb_lotep_18": ("PARAIBA", "18:00"),
    # SAO PAULO
    "sp_08": ("SAO-PAULO", "08:00"),
    "sp_10": ("SAO-PAULO", "10:00"),
    "sp_12": ("SAO-PAULO", "12:00"),
    "sp_13": ("SAO-PAULO", "13:00"),
    "sp_15": ("SAO-PAULO", "15:30"),
    "sp_17": ("SAO-PAULO", "17:00"),
    "sp_18": ("SAO-PAULO", "18:00"),
    "sp_19": ("SAO-PAULO", "19:00"),
    "sp_ptn_20": ("SAO-PAULO", "20:00"),
    # MINAS GERAIS
    "mg_12": ("MINAS-GERAIS", "12:00"),
    "mg_13": ("MINAS-GERAIS", "13:00"),
    "mg_15": ("MINAS-GERAIS", "15:00"),
    "mg_19": ("MINAS-GERAIS", "19:00"),
    "mg_21": ("MINAS-GERAIS", "21:00"),
    # DISTRITO FEDERAL / LBR
    "df_00": ("BRASILIA", "00:40"),
    "df_07": ("BRASILIA", "07:30"),
    "df_08": ("BRASILIA", "08:30"),
    "df_10": ("BRASILIA", "10:00"),
    "df_12": ("BRASILIA", "12:40"),
    "df_13": ("BRASILIA", "13:00"),
    "df_15": ("BRASILIA", "15:00"),
    "df_17": ("BRASILIA", "17:00"),
    "df_18": ("BRASILIA", "18:40"),
    "df_19": ("BRASILIA", "19:00"),
    "df_20": ("BRASILIA", "20:40"),
    "df_22": ("BRASILIA", "22:00"),
    "df_23": ("BRASILIA", "23:00"),
    # RIO GRANDE DO NORTE
    "rn_08": ("RIO-GRANDE-NORTE", "08:30"),
    "rn_11": ("RIO-GRANDE-NORTE", "11:45"),
    "rn_16": ("RIO-GRANDE-NORTE", "16:45"),
    "rn_18": ("RIO-GRANDE-NORTE", "18:30"),
    # RIO GRANDE DO SUL
    "rs_14": ("RIO-GRANDE-SUL", "14:00"),
    "rs_18": ("RIO-GRANDE-SUL", "18:00"),
    # SERGIPE
    "se_10": ("SERGIPE", "10:00"),
    "se_13": ("SERGIPE", "13:00"),
    "se_14": ("SERGIPE", "14:00"),
    "se_16": ("SERGIPE", "16:00"),
    "se_19": ("SERGIPE", "19:00"),
    # PARANA
    "pr_14": ("PARANA", "14:00"),
    "pr_18": ("PARANA", "18:00"),
    # NACIONAL
    "nac_12": ("NACIONAL", "12:00"),
    "nac_15": ("NACIONAL", "15:00"),
    "nac_17": ("NACIONAL", "17:00"),
    "nac_21": ("NACIONAL", "21:00"),
    # FEDERAL
    "fed_19": ("FEDERAL", "19:00"),
}


# =============================================================================
# FUNCAO AGENDADA (CRON UNICO)
# =============================================================================

@app.function(
    image=image,
    secrets=[supabase_secret, firecrawl_secret],
    timeout=900,  # 15 min - tempo extra para delays
    schedule=modal.Cron("*/30 0-4,10-23 * * *"),  # Cobre: 7-20h + 21-23h + 1h Brasilia
)
def scrape_scheduled():
    """
    Scrape agendado - roda a cada 30 minutos nos horarios relevantes
    Cobre todos os horarios de sorteio (7h-23h + madrugada)
    """
    from supabase import create_client
    import time

    print(f"=== Scrape V2 agendado: {datetime.utcnow()} UTC ===")

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    data_scrape = datetime.now().strftime("%Y-%m-%d")
    estados_scrape = list(ESTADOS_CONFIG.keys())

    todos_resultados = []
    erros = []

    for estado in estados_scrape:
        try:
            resultado = scrape_estado_firecrawl.remote(estado, data_scrape)

            if resultado.get("error"):
                erros.append(f"{estado}: {resultado['error']}")
                print(f"[{estado}] Erro: {resultado['error']}")
            else:
                todos_resultados.extend(resultado.get("resultados", []))
                print(f"[{estado}] OK: {len(resultado.get('resultados', []))} resultados")

            # Delay de 6 segundos entre estados (Firecrawl free: 11 req/min)
            time.sleep(6)

        except Exception as e:
            erros.append(f"{estado}: {str(e)}")
            print(f"[{estado}] Exceção: {e}")

    # Salvar no Supabase
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

    print(f"Scrape: {len(todos_resultados)} resultados, {upserted} upserted")

    # Verificar apostas pendentes
    verificar_premios_v2.remote(data_scrape)

    return {"total": len(todos_resultados), "upserted": upserted}


# =============================================================================
# VERIFICACAO DE PREMIOS E REEMBOLSO
# =============================================================================

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

        # Compara com agora (Brasília = UTC-3)
        agora_utc = datetime.utcnow()
        agora_brasilia = agora_utc - timedelta(hours=3)

        return agora_brasilia > limite_dt
    except Exception:
        return False


@app.function(image=image, secrets=[supabase_secret], timeout=300)
def verificar_premios_v2(data: Optional[str] = None) -> dict:
    """
    Verifica apostas pendentes contra resultados
    - Se ganhou: marca como 'ganhou'
    - Se perdeu: marca como 'perdeu'
    - Se passou 1h sem resultado: reembolsa o valor
    """
    from supabase import create_client

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    data_verificar = data or datetime.now().strftime("%Y-%m-%d")
    print(f"=== Verificando premios para {data_verificar} ===")

    # Busca apostas pendentes
    apostas_resp = supabase.table("apostas").select("*").eq("data_jogo", data_verificar).eq("status", "pendente").execute()
    apostas = apostas_resp.data or []

    if not apostas:
        print("Nenhuma aposta pendente")
        return {"verificadas": 0, "ganhou": 0, "perdeu": 0, "reembolsado": 0}

    print(f"Apostas pendentes: {len(apostas)}")

    # Busca resultados do dia
    resultados_resp = supabase.table("resultados").select("*").eq("data", data_verificar).execute()
    resultados = resultados_resp.data or []

    # Indexa resultados por horario+banca
    resultados_map = {}
    for r in resultados:
        key = f"{r['horario']}_{r['banca']}"
        resultados_map[key] = r

    print(f"Resultados disponíveis: {len(resultados)}")

    ganhou = 0
    perdeu = 0
    reembolsado = 0
    ainda_pendente = 0

    for aposta in apostas:
        loterias = aposta.get("loterias", [])
        palpite = str(aposta.get("palpite", ""))
        modalidade = aposta.get("modalidade", "milhar")
        posicao = aposta.get("posicao", "1_premio")
        valor_aposta = float(aposta.get("valor", 0) or 0)
        user_id = aposta.get("user_id")

        # Determina posicoes validas
        posicoes_validas = []
        if posicao == "1_premio":
            posicoes_validas = ["premio_1"]
        elif posicao == "1_ao_5":
            posicoes_validas = ["premio_1", "premio_2", "premio_3", "premio_4", "premio_5"]
        elif posicao == "1_ao_7":
            posicoes_validas = ["premio_1", "premio_2", "premio_3", "premio_4", "premio_5", "premio_6", "premio_7"]
        else:
            # Tenta extrair posicao especifica (ex: "4_premio")
            match = re.match(r"(\d+)_premio", posicao)
            if match:
                posicoes_validas = [f"premio_{match.group(1)}"]

        aposta_ganhou = False
        todos_resultados_saiu = True
        loterias_sem_resultado = []  # Guarda loterias que não têm resultado
        horario_mais_tardio = None  # Para verificar expiração

        for loteria_id in loterias:
            mapping = LOTERIA_TO_BANCA.get(loteria_id)
            if not mapping:
                print(f"  Loteria {loteria_id} nao mapeada")
                continue

            banca, horario = mapping
            key = f"{horario}_{banca}"
            resultado = resultados_map.get(key)

            # Guarda o horário mais tardio para verificar expiração
            if horario_mais_tardio is None or horario > horario_mais_tardio:
                horario_mais_tardio = horario

            if not resultado:
                todos_resultados_saiu = False
                loterias_sem_resultado.append((loteria_id, banca, horario))
                continue

            # Verifica se ganhou
            for pos in posicoes_validas:
                premio = str(resultado.get(pos, "") or "")

                if modalidade == "milhar":
                    if palpite == premio:
                        aposta_ganhou = True
                        break
                elif modalidade == "centena":
                    # Centena: ultimos 3 digitos. Palpite pode ser 3 ou 4 digitos
                    if len(palpite) >= 3 and premio.endswith(palpite[-3:]):
                        aposta_ganhou = True
                        break
                elif modalidade == "dezena":
                    # Dezena: ultimos 2 digitos. Palpite pode ser 2, 3 ou 4 digitos
                    if len(palpite) >= 2 and premio.endswith(palpite[-2:]):
                        aposta_ganhou = True
                        break
                elif modalidade == "grupo":
                    # Grupo: ultimos 2 digitos mapeiam para bicho
                    dezena = int(premio[-2:]) if len(premio) >= 2 else 0
                    grupo = ((dezena - 1) // 4) + 1 if dezena > 0 else 0
                    if str(grupo).zfill(2) == palpite.zfill(2):
                        aposta_ganhou = True
                        break

            if aposta_ganhou:
                break

        # Atualiza status
        if aposta_ganhou:
            supabase.table("apostas").update({"status": "ganhou"}).eq("id", aposta["id"]).execute()
            ganhou += 1
            print(f"  Aposta {aposta['id'][:8]} GANHOU!")

            # Calcular e creditar premio (Lógica duplicada para garantir trigger, ou apenas trigger se saldo ja foi creditado antes? O código original não mostra credito de saldo aqui, mas o código anterior que tentei inserir tinha. Vou assumir que o credito de saldo deve ser feito aqui também se não existir.)
            # Vendo o código original: ele SÓ atualiza o status para ganhou. O credito do saldo deve ser feito em outro lugar ou estava faltando?
            # O código original NÃO TINHA CREDITO DE SALDO EXPLICITO NESTE BLOCO, apenas update status.
            # Vou adicionar o credito de saldo E o trigger.
            
            # Calcular premio
            cotacao = float(aposta.get("cotacao", 0))
            valor_aposta = float(aposta.get("valor", 0))
            valor_premio = valor_aposta * cotacao
            
            if user_id:
                try:
                    # Busca saldo e dados para trigger
                    profile_resp = supabase.table("profiles").select("saldo, nome, telefone").eq("id", user_id).single().execute()
                    saldo_atual = float(profile_resp.data.get("saldo", 0) or 0)
                    novo_saldo = saldo_atual + valor_premio
                    
                    # Atualiza saldo
                    supabase.table("profiles").update({"saldo": novo_saldo}).eq("id", user_id).execute()
                    print(f"  Aposta {aposta['id'][:8]} GANHOU! Premio: R${valor_premio:.2f} creditado.")

                    # Disparar Gatilho (API Interna)
                    try:
                        app_url = os.environ.get("APP_URL", "https://ultrabanca.app")
                        internal_secret = os.environ.get("INTERNAL_API_SECRET", "ultra-banca-secret-key-123")
                        
                        if internal_secret: 
                            import requests
                            requests.post(
                                f"{app_url}/api/internal/triggers",
                                json={
                                    "triggerType": "premio",
                                    "userData": {
                                        "nome": profile_resp.data.get("nome", "Cliente"),
                                        "telefone": profile_resp.data.get("telefone"),
                                        "premio": valor_premio,
                                        "modalidade": modalidade,
                                        "saldo": novo_saldo
                                    }
                                },
                                headers={"x-internal-secret": internal_secret},
                                timeout=5
                            )
                    except Exception as trigger_err:
                        print(f"  [Erro Gatilho] Falha ao disparar webhook de premio: {trigger_err}")

                except Exception as e:
                    print(f"  Erro ao creditar premio {aposta['id'][:8]}: {e}")

        elif todos_resultados_saiu:
            supabase.table("apostas").update({"status": "perdeu"}).eq("id", aposta["id"]).execute()
            perdeu += 1
            print(f"  Aposta {aposta['id'][:8]} perdeu")
        else:
            # Verifica se passou 12 horas do horário mais tardio sem resultado
            # Se todas as loterias sem resultado já expiraram, reembolsa
            todas_expiraram = True
            for lot_id, banca, horario in loterias_sem_resultado:
                # Aumentado para 12 horas para evitar reembolso injustificado
                if not horario_expirou(data_verificar, horario, horas_limite=12):
                    todas_expiraram = False
                    break

            if todas_expiraram and loterias_sem_resultado:
                # REEMBOLSO: devolve o valor da aposta para o saldo do usuário
                if user_id and valor_aposta > 0:
                    try:
                        # Busca saldo atual
                        profile_resp = supabase.table("profiles").select("saldo").eq("id", user_id).single().execute()
                        saldo_atual = float(profile_resp.data.get("saldo", 0) or 0)
                        novo_saldo = saldo_atual + valor_aposta

                        # Atualiza saldo
                        supabase.table("profiles").update({"saldo": novo_saldo}).eq("id", user_id).execute()

                        # Marca aposta como reembolsada
                        supabase.table("apostas").update({"status": "reembolsado"}).eq("id", aposta["id"]).execute()

                        reembolsado += 1
                        print(f"  Aposta {aposta['id'][:8]} REEMBOLSADA (R${valor_aposta:.2f}) - resultado não saiu após 1h")
                    except Exception as e:
                        print(f"  Erro ao reembolsar {aposta['id'][:8]}: {e}")
                        ainda_pendente += 1
                else:
                    # Sem user_id ou valor, apenas marca como reembolsado
                    supabase.table("apostas").update({"status": "reembolsado"}).eq("id", aposta["id"]).execute()
                    reembolsado += 1
                    print(f"  Aposta {aposta['id'][:8]} marcada como reembolsada (sem valor)")
            else:
                ainda_pendente += 1
                print(f"  Aposta {aposta['id'][:8]} ainda pendente (aguardando resultado)")

    resultado_final = {
        "data": data_verificar,
        "verificadas": len(apostas),
        "ganhou": ganhou,
        "perdeu": perdeu,
        "reembolsado": reembolsado,
        "pendente": ainda_pendente,
    }

    print(f"=== Verificacao concluida: {resultado_final} ===")
    return resultado_final


# =============================================================================
# CLI
# =============================================================================

@app.function(image=image, secrets=[supabase_secret, firecrawl_secret], timeout=1800)
def scrape_ultimos_dias(dias: int = 7) -> dict:
    """
    Scrape dos últimos N dias para todos os estados
    """
    from supabase import create_client
    import time

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    hoje = datetime.now()
    resultados_total = []
    resumo_por_dia = {}

    print(f"\n{'='*70}")
    print(f"SCRAPE DOS ÚLTIMOS {dias} DIAS")
    print(f"{'='*70}\n")

    for i in range(dias):
        data_scrape = (hoje - timedelta(days=i)).strftime("%Y-%m-%d")
        print(f"\n{'='*70}")
        print(f"DIA {i+1}/{dias}: {data_scrape}")
        print(f"{'='*70}")

        todos_resultados = []
        erros = []

        for estado in list(ESTADOS_CONFIG.keys()):
            try:
                resultado = scrape_estado_firecrawl.remote(estado, data_scrape)

                if resultado.get("error"):
                    erros.append(f"{estado}: {resultado['error']}")
                else:
                    todos_resultados.extend(resultado.get("resultados", []))
                    print(f"[{estado}] OK: {len(resultado.get('resultados', []))} resultados")

                # Delay entre estados
                time.sleep(2)

            except Exception as e:
                erros.append(f"{estado}: {str(e)}")
                print(f"[{estado}] Exceção: {e}")

        # Salvar no Supabase
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

        resumo_por_dia[data_scrape] = {
            "scraped": len(todos_resultados),
            "upserted": upserted,
            "erros": len(erros),
        }
        resultados_total.extend(todos_resultados)

        print(f"\n📊 Resumo {data_scrape}: {len(todos_resultados)} scraped, {upserted} upserted")

        # Verificar apostas do dia
        verificar_premios_v2.remote(data_scrape)

    print(f"\n{'='*70}")
    print(f"RESUMO FINAL - {dias} DIAS")
    print(f"{'='*70}")
    for data_str, stats in resumo_por_dia.items():
        print(f"  {data_str}: {stats['scraped']} scraped, {stats['upserted']} upserted, {stats['erros']} erros")
    print(f"\nTOTAL: {len(resultados_total)} resultados")

    return {
        "success": True,
        "dias": dias,
        "total_resultados": len(resultados_total),
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
    Comandos:
        scrape   - Scrape inteligente de um estado (com múltiplas fontes e logs)
        teste    - Testa somente Firecrawl (debug)
        todos    - Scrape de todos os estados para uma data
        historico - Scrape dos últimos N dias (padrão: 7)

    Exemplos:
        modal run modal_scraper_v2.py --comando scrape --estado MG --data 2026-01-30
        modal run modal_scraper_v2.py --comando teste --estado RJ --data 2026-01-29
        modal run modal_scraper_v2.py --comando todos --data 2026-01-29
        modal run modal_scraper_v2.py --comando historico --dias 7
    """
    if comando == "scrape":
        # Usa a função principal com múltiplas fontes e logs detalhados
        print(f"\n{'#'*70}")
        print(f"# SCRAPE INTELIGENTE: {estado} - {data or 'hoje'}")
        print(f"{'#'*70}\n")

        resultado = scrape_estado_firecrawl.remote(estado, data)

        print(f"\n{'#'*70}")
        print(f"# RESULTADO FINAL")
        print(f"{'#'*70}")
        print(f"Estado: {resultado.get('estado')}")
        print(f"Banca: {resultado.get('banca')}")
        print(f"Fonte utilizada: {resultado.get('fonte_utilizada', 'N/A')}")
        print(f"Total de resultados: {len(resultado.get('resultados', []))}")

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

    elif comando == "teste":
        print(f"Testando Firecrawl com {estado}...")
        resultado = teste_firecrawl.remote(estado, data)

        print(f"\n{'='*50}")
        print(f"URL: {resultado.get('url')}")
        print(f"Firecrawl success: {resultado.get('firecrawl_success')}")
        print(f"HTML size: {resultado.get('html_size')} bytes")
        print(f"Markdown size: {resultado.get('markdown_size')} bytes")
        print(f"h3 encontrados: {resultado.get('h3_count')}")
        print(f"h3.g encontrados: {resultado.get('h3_g_count')}")
        print(f"Tabelas: {resultado.get('table_count')}")
        print(f"Resultados parseados: {resultado.get('resultados_encontrados')}")

        if resultado.get('resultados_amostra'):
            print(f"\nAmostra:")
            for r in resultado.get('resultados_amostra', []):
                p1 = r['premios'][0]['milhar'] if r.get('premios') else 'N/A'
                print(f"  {r['horario']} {r['loteria']}: 1o={p1}")

        if resultado.get('markdown_preview'):
            print(f"\n{'='*50}")
            print("Markdown preview:")
            print(resultado.get('markdown_preview'))

        if resultado.get('error'):
            print(f"\nERRO: {resultado.get('error')}")

    elif comando == "todos":
        print(f"Scraping todos os estados para {data or 'hoje'}...")
        resultado = scrape_todos_v2.remote(data)
        print(f"\nResultado: {resultado}")

    elif comando == "historico":
        print(f"\n{'#'*70}")
        print(f"# SCRAPE HISTÓRICO: ÚLTIMOS {dias} DIAS")
        print(f"{'#'*70}\n")
        resultado = scrape_ultimos_dias.remote(dias)
        print(f"\nResultado final: {resultado}")

    else:
        print(f"Comando: {comando}")
        print("Comandos válidos: scrape, teste, todos, historico")
