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

# Imagem com Firecrawl
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "firecrawl-py",
    "beautifulsoup4",
    "supabase",
)

# Secrets
supabase_secret = modal.Secret.from_name("supabase-ultra-banca")
firecrawl_secret = modal.Secret.from_name("firecrawl-key")

# =============================================================================
# CONFIGURACAO DAS BANCAS
# =============================================================================

ESTADOS_CONFIG = {
    "RJ": {"url_param": "RJ", "banca": "RIO/FEDERAL"},
    "BA": {"url_param": "BA", "banca": "BAHIA"},
    "GO": {"url_param": "GO", "banca": "LOOK/GOIAS"},
    "CE": {"url_param": "CE", "banca": "LOTECE"},
    "PE": {"url_param": "PE", "banca": "LOTEP"},
    "PB": {"url_param": "PB", "banca": "PARAIBA"},
    "SP": {"url_param": "SP", "banca": "SAO-PAULO"},
    "MG": {"url_param": "MG", "banca": "MINAS-GERAIS"},
    "DF": {"url_param": "DF", "banca": "BRASILIA"},
    "RN": {"url_param": "RN", "banca": "RIO-GRANDE-NORTE"},
    "RS": {"url_param": "RS", "banca": "RIO-GRANDE-SUL"},
    "SE": {"url_param": "SE", "banca": "SERGIPE"},
    "PR": {"url_param": "PR", "banca": "PARANA"},
}

BASE_URL = "https://www.resultadofacil.com.br"


# =============================================================================
# FUNCOES DE SCRAPING COM FIRECRAWL
# =============================================================================

@app.function(image=image, secrets=[supabase_secret, firecrawl_secret], timeout=300)
def scrape_estado_firecrawl(estado: str, data: Optional[str] = None) -> dict:
    """
    Scrape um estado usando Firecrawl
    """
    from firecrawl import Firecrawl
    from bs4 import BeautifulSoup

    config = ESTADOS_CONFIG.get(estado)
    if not config:
        return {"estado": estado, "error": "Estado não configurado", "resultados": []}

    data_scrape = data or datetime.now().strftime("%Y-%m-%d")
    url = f"{BASE_URL}/resultado-do-jogo-do-bicho/{config['url_param']}/do-dia/{data_scrape}"

    print(f"[{estado}] Acessando via Firecrawl: {url}")

    resultados = []

    try:
        # Inicializa Firecrawl
        api_key = os.environ.get("FIRECRAWL_API_KEY")
        if not api_key:
            return {"estado": estado, "error": "FIRECRAWL_API_KEY não encontrada", "resultados": []}

        firecrawl = Firecrawl(api_key=api_key)

        # Scrape a página
        response = firecrawl.scrape(url, formats=["html", "markdown"])

        if not response:
            return {"estado": estado, "error": "Firecrawl retornou erro", "resultados": []}

        # Firecrawl retorna objeto Document com atributos
        html_content = getattr(response, "html", "") or ""
        markdown_content = getattr(response, "markdown", "") or ""

        print(f"[{estado}] HTML: {len(html_content)} bytes, Markdown: {len(markdown_content)} bytes")

        # Parse com BeautifulSoup
        if html_content:
            soup = BeautifulSoup(html_content, "html.parser")
            resultados = parse_resultados(soup, data_scrape, config['banca'])

        # Se não encontrou pelo HTML, tenta pelo Markdown
        if not resultados and markdown_content:
            print(f"[{estado}] Tentando parse pelo Markdown...")
            resultados = parse_markdown(markdown_content, data_scrape, config['banca'])

        print(f"[{estado}] Resultados encontrados: {len(resultados)}")

    except Exception as e:
        print(f"[{estado}] Erro: {e}")
        import traceback
        traceback.print_exc()
        return {"estado": estado, "error": str(e), "resultados": []}

    return {
        "estado": estado,
        "banca": config['banca'],
        "url": url,
        "resultados": resultados,
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
    """Parser pelo conteúdo Markdown"""
    resultados = []

    # Busca padrões no markdown
    # Formato típico: ## 21:20, CORUJA ... | 1º | 3238 | ...

    # Divide por seções (headers)
    sections = re.split(r'\n##?\s+', markdown)

    for section in sections:
        # Busca horário na seção
        horario_match = re.search(r'(\d{1,2})[h:H](\d{2})', section)
        if not horario_match:
            continue

        horario = f"{horario_match.group(1).zfill(2)}:{horario_match.group(2)}"
        loteria = identificar_loteria(section[:200])  # Primeiros 200 chars

        # Busca prêmios (4 dígitos)
        premios_matches = re.findall(r'\|\s*(\d{4})\s*\|', section)

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
    if "CORUJA" in texto_upper:
        return "CORUJA"
    if "MALUCA" in texto_upper:
        return "MALUCA"
    if "PTM" in texto_upper:
        return "PTM"
    if "PTV" in texto_upper:
        return "PTV"
    if "PTN" in texto_upper:
        return "PTN"
    if "LBR" in texto_upper:
        return "LBR"
    if "LOTECE" in texto_upper:
        return "LOTECE"
    if "LOTEP" in texto_upper:
        return "LOTEP"
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
        response = firecrawl.scrape(url, formats=["html", "markdown"])

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
                    if len(palpite) == 3 and premio.endswith(palpite):
                        aposta_ganhou = True
                        break
                elif modalidade == "dezena":
                    if len(palpite) == 2 and premio.endswith(palpite):
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
        elif todos_resultados_saiu:
            supabase.table("apostas").update({"status": "perdeu"}).eq("id", aposta["id"]).execute()
            perdeu += 1
            print(f"  Aposta {aposta['id'][:8]} perdeu")
        else:
            # Verifica se passou 1 hora do horário mais tardio sem resultado
            # Se todas as loterias sem resultado já expiraram, reembolsa
            todas_expiraram = True
            for lot_id, banca, horario in loterias_sem_resultado:
                if not horario_expirou(data_verificar, horario, horas_limite=1):
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

@app.local_entrypoint()
def main(
    comando: str = "teste",
    estado: str = "RJ",
    data: Optional[str] = None,
):
    """
    Comandos:
        teste  - Testa scrape de um estado
        todos  - Scrape de todos os estados

    Exemplos:
        modal run modal_scraper_v2.py
        modal run modal_scraper_v2.py --comando teste --estado RJ --data 2026-01-29
        modal run modal_scraper_v2.py --comando todos --data 2026-01-29
    """
    if comando == "teste":
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

    else:
        print(f"Comando: {comando}")
        print("Comandos válidos: teste, todos")
