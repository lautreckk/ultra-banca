"""
Ultra Banca - Scraper de Resultados do Jogo do Bicho
Roda no Modal com schedules e retries automaticos
"""

import modal
from datetime import datetime, timedelta
from typing import Optional
import os

# Criar app Modal
app = modal.App("ultra-banca-scraper")

# Imagem com dependencias
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "httpx",
    "beautifulsoup4",
    "supabase",
)

# Secrets do Supabase (configurar no Modal dashboard)
supabase_secret = modal.Secret.from_name("supabase-ultra-banca")

# Secret do ScraperAPI para contornar bloqueios
scraperapi_secret = modal.Secret.from_name("scraperapi-key")

# =============================================================================
# CONFIGURACAO DAS BANCAS E HORARIOS
# =============================================================================

ESTADOS_CONFIG = {
    "RJ": "RIO/FEDERAL",
    "BA": "BAHIA",
    "GO": "LOOK/GOIAS",
    "CE": "LOTECE",
    "PE": "LOTEP",
    "PB": "PARAIBA",
    "SP": "SAO-PAULO",
    "MG": "MINAS-GERAIS",
    "DF": "BRASILIA",
    "RN": "RIO-GRANDE-NORTE",
    "RS": "RIO-GRANDE-SUL",
    "SE": "SERGIPE",
    "PR": "PARANA",
}

# Horarios de sorteio por estado (para saber quando rodar o scraping)
HORARIOS_SORTEIO = {
    "RJ": ["09:20", "11:00", "14:20", "16:00", "18:00", "21:00"],
    "BA": ["10:20", "12:20", "15:20", "19:20", "21:20"],
    "GO": ["07:20", "09:20", "11:20", "14:20", "16:20", "18:20", "21:20", "23:20"],
    "CE": ["11:00", "14:00", "15:45", "19:00"],
    "PE": ["09:20", "10:00", "11:00", "12:40", "14:00", "15:40", "17:00", "18:30", "19:00", "20:00", "21:00"],
    "PB": ["09:45", "10:45", "12:45", "15:45", "18:00", "19:05", "20:00"],
    "SP": ["08:00", "10:00", "12:00", "13:00", "15:00", "17:00", "19:00", "20:00"],
    "MG": ["12:00", "15:00", "19:00", "21:00"],
    "DF": ["00:40", "07:30", "08:30", "10:00", "12:40", "13:00", "15:00", "17:00", "19:00", "20:40", "22:00", "23:30"],
    "RN": ["08:00", "11:00", "16:00", "18:00"],
    "RS": ["14:00", "18:00"],
    "SE": ["10:00", "14:00", "18:00"],
    "PR": ["14:00", "18:00"],
}

BASE_URL = "https://www.resultadofacil.com.br"


# =============================================================================
# FUNCOES MODAL
# =============================================================================

@app.function(image=image, secrets=[supabase_secret, scraperapi_secret], timeout=600)
def scrape_todos_estados(data: Optional[str] = None) -> dict:
    """
    Scrape todos os estados para uma data especifica

    Args:
        data: Data no formato YYYY-MM-DD (None = hoje)
    """
    import httpx
    from bs4 import BeautifulSoup
    from supabase import create_client
    import re
    import time
    import random

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    def fetch_html(url: str, retries: int = 3) -> Optional[str]:
        """Busca HTML usando ScraperAPI para contornar bloqueios"""
        try:
            api_key = os.environ.get("SCRAPERAPI_KEY")
            if not api_key:
                print("SCRAPERAPI_KEY nao encontrada, tentando requisicao direta...")
                # Fallback para requisição direta
                return fetch_html_direct(url, retries)

            scraperapi_url = "http://api.scraperapi.com/"
            params = {
                "api_key": api_key,
                "url": url,
                "render": "false",
                "country_code": "br"
            }

            print(f"Requisicao via ScraperAPI: {url}")

            for attempt in range(retries):
                try:
                    with httpx.Client(timeout=60.0) as client:
                        response = client.get(scraperapi_url, params=params)

                        if response.status_code == 200:
                            print(f"Sucesso! Tamanho: {len(response.text)} bytes")
                            return response.text
                        elif response.status_code == 401:
                            print(f"API key invalida")
                            return None
                        elif response.status_code == 429:
                            print(f"Rate limit, aguardando...")
                            time.sleep(10 * (attempt + 1))
                            continue
                        else:
                            print(f"Status {response.status_code}, tentativa {attempt + 1}/{retries}")
                            if attempt < retries - 1:
                                time.sleep(5)
                except Exception as e:
                    print(f"Erro na tentativa {attempt + 1}: {e}")
                    if attempt < retries - 1:
                        time.sleep(5)

            print(f"Todas as tentativas falharam: {url}")
            return None
        except Exception as e:
            print(f"Erro critico: {e}")
            return None

    def fetch_html_direct(url: str, retries: int = 3) -> Optional[str]:
        """Fallback: requisição direta sem ScraperAPI"""
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ]

        for attempt in range(retries):
            headers = {
                "User-Agent": random.choice(user_agents),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            }
            time.sleep(random.uniform(2.0, 4.0))

            try:
                with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                    response = client.get(url, headers=headers)
                    if response.status_code == 200:
                        return response.text
                    print(f"Status {response.status_code}, tentativa {attempt + 1}")
            except Exception as e:
                print(f"Erro tentativa {attempt + 1}: {e}")

        return None

    def parse_horario(text: str) -> Optional[str]:
        match = re.search(r'(\d{1,2})[h:H](\d{2})?', text)
        if match:
            return f"{match.group(1).zfill(2)}:{match.group(2) or '00'}"
        return None

    def parse_loteria(text: str) -> str:
        text_upper = text.upper()
        loterias = {
            "MALUCA": "MALUCA", "CORUJA": "CORUJA", "PTM": "PTM",
            "PTV": "PTV", "PTN": "PTN", "LBR": "LBR",
            "LOTECE": "LOTECE", "LOTEP": "LOTEP", " PT ": "PT", " PT,": "PT",
        }
        for key, value in loterias.items():
            if key in text_upper:
                return value
        return "GERAL"

    def extract_premios(soup, header_el) -> list:
        table = header_el.find_next("table")
        if not table:
            return []
        premios = []
        for i, row in enumerate(table.find_all("tr")):
            tds = row.find_all("td")
            if len(tds) >= 4:
                milhar = tds[1].get_text(strip=True)
                milhar_clean = re.sub(r'[^\d]', '', milhar)
                if milhar_clean:
                    premios.append({
                        "milhar": milhar_clean.zfill(4),
                        "bicho": tds[3].get_text(strip=True),
                    })
        return premios[:7]  # Retorna até 7 prêmios

    def scrape_estado(estado: str, data_param: Optional[str] = None) -> list:
        if data_param:
            url = f"{BASE_URL}/resultado-do-jogo-do-bicho/{estado}/do-dia/{data_param}"
        else:
            url = f"{BASE_URL}/resultado-do-jogo-do-bicho/{estado}"

        html = fetch_html(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "html.parser")
        resultados = []

        # Extrair data do titulo
        data_resultado = data_param
        if not data_resultado:
            title = soup.find("title")
            if title:
                match = re.search(r'(\d{2})/(\d{2})/(\d{4})', title.get_text())
                if match:
                    data_resultado = f"{match.group(3)}-{match.group(2)}-{match.group(1)}"
                else:
                    data_resultado = datetime.now().strftime("%Y-%m-%d")

        for header in soup.find_all("h3", class_="g"):
            header_text = header.get_text(strip=True)
            horario = parse_horario(header_text)
            if not horario:
                continue

            loteria = parse_loteria(header_text)
            premios = extract_premios(soup, header)

            if len(premios) >= 5:
                resultados.append({
                    "data": data_resultado,
                    "horario": horario,
                    "banca": ESTADOS_CONFIG.get(estado, estado),
                    "loteria": loteria,
                    "premios": premios,
                })

        return resultados

    # Scrape todos estados
    todos_resultados = []
    erros_scrape = []

    for estado in ESTADOS_CONFIG.keys():
        try:
            resultados = scrape_estado(estado, data)
            todos_resultados.extend(resultados)
            print(f"{estado}: {len(resultados)} resultados")
        except Exception as e:
            erros_scrape.append(f"{estado}: {e}")
            print(f"Erro {estado}: {e}")
        time.sleep(random.uniform(2.0, 4.0))  # Delay maior entre estados

    # Salvar no Supabase
    upserted = 0
    erros_db = []

    for r in todos_resultados:
        premios = r["premios"]
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
                "bicho_1": premios[0]["bicho"] if len(premios) > 0 else None,
                "bicho_2": premios[1]["bicho"] if len(premios) > 1 else None,
                "bicho_3": premios[2]["bicho"] if len(premios) > 2 else None,
                "bicho_4": premios[3]["bicho"] if len(premios) > 3 else None,
                "bicho_5": premios[4]["bicho"] if len(premios) > 4 else None,
                "bicho_6": premios[5]["bicho"] if len(premios) > 5 else None,
                "bicho_7": premios[6]["bicho"] if len(premios) > 6 else None,
            }, on_conflict="data,horario,banca,loteria").execute()
            upserted += 1
        except Exception as e:
            erros_db.append(f"{r['banca']} {r['horario']}: {e}")

    return {
        "success": True,
        "data": data or datetime.now().strftime("%Y-%m-%d"),
        "total_scraped": len(todos_resultados),
        "upserted": upserted,
        "scrape_errors": erros_scrape if erros_scrape else None,
        "db_errors": erros_db[:10] if erros_db else None,
    }


@app.function(image=image, secrets=[supabase_secret, scraperapi_secret], timeout=300)
def verificar_premios(data: Optional[str] = None) -> dict:
    """
    Verifica apostas pendentes contra resultados e calcula prêmios.

    Args:
        data: Data no formato YYYY-MM-DD (None = hoje)
    """
    from supabase import create_client
    from decimal import Decimal

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    data_verificar = data or datetime.now().strftime("%Y-%m-%d")
    print(f"=== Verificando prêmios para {data_verificar} ===")

    # Mapeamento de ID de loteria para banca (para matching com resultados)
    LOTERIA_TO_BANCA = {
        # RIO DE JANEIRO (com aliases)
        "rj_pt_09": ("RIO/FEDERAL", "09:20"), "pt_09": ("RIO/FEDERAL", "09:20"),
        "rj_ptm_11": ("RIO/FEDERAL", "11:00"), "ptm_11": ("RIO/FEDERAL", "11:00"),
        "rj_pt_14": ("RIO/FEDERAL", "14:20"), "pt_14": ("RIO/FEDERAL", "14:20"),
        "rj_ptv_16": ("RIO/FEDERAL", "16:00"), "ptv_16": ("RIO/FEDERAL", "16:00"),
        "rj_ptn_18": ("RIO/FEDERAL", "18:20"), "ptn_18": ("RIO/FEDERAL", "18:20"),
        "rj_coruja_21": ("RIO/FEDERAL", "21:20"), "coruja_21": ("RIO/FEDERAL", "21:20"),
        # BAHIA
        "ba_10": ("BAHIA", "10:00"), "ba_12": ("BAHIA", "12:00"), "ba_15": ("BAHIA", "15:00"),
        "ba_19": ("BAHIA", "19:00"), "ba_20": ("BAHIA", "20:00"), "ba_21": ("BAHIA", "21:00"),
        "ba_maluca_10": ("BAHIA", "10:00"), "ba_maluca_12": ("BAHIA", "12:00"),
        "ba_maluca_15": ("BAHIA", "15:00"), "ba_maluca_19": ("BAHIA", "19:00"),
        "ba_maluca_20": ("BAHIA", "20:00"), "ba_maluca_21": ("BAHIA", "21:00"),
        # GOIÁS
        "go_07": ("LOOK/GOIAS", "07:00"), "go_09": ("LOOK/GOIAS", "09:00"),
        "go_11": ("LOOK/GOIAS", "11:00"), "go_14": ("LOOK/GOIAS", "14:00"),
        "go_16": ("LOOK/GOIAS", "16:00"), "go_18": ("LOOK/GOIAS", "18:00"),
        "go_21": ("LOOK/GOIAS", "21:00"), "go_23": ("LOOK/GOIAS", "23:00"),
        # CEARÁ
        "ce_11": ("LOTECE", "11:00"), "ce_12": ("LOTECE", "12:00"),
        "ce_14": ("LOTECE", "14:00"), "ce_15": ("LOTECE", "15:45"), "ce_19": ("LOTECE", "19:00"),
        # PERNAMBUCO (LOTEP)
        "pe_09": ("LOTEP", "09:20"), "pe_09b": ("LOTEP", "09:30"), "pe_09c": ("LOTEP", "09:40"),
        "pe_10": ("LOTEP", "10:00"), "pe_11": ("LOTEP", "11:00"), "pe_12": ("LOTEP", "12:40"),
        "pe_12b": ("LOTEP", "12:45"), "pe_14": ("LOTEP", "14:00"), "pe_15": ("LOTEP", "15:40"),
        "pe_15b": ("LOTEP", "15:45"), "pe_17": ("LOTEP", "17:00"), "pe_18": ("LOTEP", "18:30"),
        "pe_19": ("LOTEP", "19:00"), "pe_19b": ("LOTEP", "19:30"), "pe_20": ("LOTEP", "20:00"),
        "pe_21": ("LOTEP", "21:00"),
        # PARAÍBA
        "pb_09": ("PARAIBA", "09:45"), "pb_10": ("PARAIBA", "10:45"), "pb_12": ("PARAIBA", "12:45"),
        "pb_15": ("PARAIBA", "15:45"), "pb_18": ("PARAIBA", "18:00"), "pb_19": ("PARAIBA", "19:05"),
        "pb_20": ("PARAIBA", "20:00"), "pb_lotep_10": ("PARAIBA", "10:45"),
        "pb_lotep_12": ("PARAIBA", "12:45"), "pb_lotep_15": ("PARAIBA", "15:45"),
        "pb_lotep_18": ("PARAIBA", "18:00"),
        # SÃO PAULO
        "sp_08": ("SAO-PAULO", "08:00"), "sp_10": ("SAO-PAULO", "10:00"),
        "sp_12": ("SAO-PAULO", "12:00"), "sp_13": ("SAO-PAULO", "13:00"),
        "sp_15": ("SAO-PAULO", "15:30"), "sp_17": ("SAO-PAULO", "17:00"),
        "sp_18": ("SAO-PAULO", "18:00"), "sp_19": ("SAO-PAULO", "19:00"),
        "sp_ptn_20": ("SAO-PAULO", "20:00"),
        # MINAS GERAIS
        "mg_12": ("MINAS-GERAIS", "12:00"), "mg_13": ("MINAS-GERAIS", "13:00"),
        "mg_15": ("MINAS-GERAIS", "15:00"), "mg_19": ("MINAS-GERAIS", "19:00"),
        "mg_21": ("MINAS-GERAIS", "21:00"),
        # DISTRITO FEDERAL (LBR)
        "df_00": ("LBR/BRASILIA", "00:40"), "df_07": ("LBR/BRASILIA", "07:30"),
        "df_08": ("LBR/BRASILIA", "08:30"), "df_10": ("LBR/BRASILIA", "10:00"),
        "df_12": ("LBR/BRASILIA", "12:40"), "df_13": ("LBR/BRASILIA", "13:00"),
        "df_15": ("LBR/BRASILIA", "15:00"), "df_17": ("LBR/BRASILIA", "17:00"),
        "df_18": ("LBR/BRASILIA", "18:40"), "df_19": ("LBR/BRASILIA", "19:00"),
        "df_20": ("LBR/BRASILIA", "20:40"), "df_22": ("LBR/BRASILIA", "22:00"),
        "df_23": ("LBR/BRASILIA", "23:00"),
        # NACIONAL
        "nac_12": ("NACIONAL", "12:00"), "nac_15": ("NACIONAL", "15:00"),
        "nac_17": ("NACIONAL", "17:00"), "nac_21": ("NACIONAL", "21:00"),
        # RIO GRANDE DO NORTE
        "rn_08": ("RIO-GRANDE-NORTE", "08:30"), "rn_11": ("RIO-GRANDE-NORTE", "11:45"),
        "rn_16": ("RIO-GRANDE-NORTE", "16:45"), "rn_18": ("RIO-GRANDE-NORTE", "18:30"),
        # RIO GRANDE DO SUL
        "rs_14": ("RIO-GRANDE-SUL", "14:00"), "rs_18": ("RIO-GRANDE-SUL", "18:00"),
        # SERGIPE
        "se_10": ("SERGIPE", "10:00"), "se_13": ("SERGIPE", "13:00"),
        "se_14": ("SERGIPE", "14:00"), "se_16": ("SERGIPE", "16:00"), "se_19": ("SERGIPE", "19:00"),
        # PARANÁ
        "pr_14": ("PARANA", "14:00"), "pr_18": ("PARANA", "18:00"),
    }

    # Funções auxiliares
    def extrair_digitos(premio: str, modalidade: str) -> str:
        """Extrai os dígitos relevantes do prêmio baseado na modalidade"""
        if not premio:
            return ""
        premio = premio.zfill(4)  # Garante 4 dígitos
        modalidade_lower = modalidade.lower()

        if "milhar" in modalidade_lower:
            return premio[-4:]
        elif "centena" in modalidade_lower:
            return premio[-3:]
        elif "dezena" in modalidade_lower and "grupo" not in modalidade_lower:
            return premio[-2:]
        elif "unidade" in modalidade_lower:
            return premio[-1:]
        elif "grupo" in modalidade_lower or "duque" in modalidade_lower or "terno" in modalidade_lower:
            # Converte dezena para grupo (1-25)
            dezena = int(premio[-2:])
            if dezena == 0:
                grupo = 25  # 00 = grupo 25 (Vaca)
            else:
                grupo = ((dezena - 1) // 4) + 1
            return str(grupo).zfill(2)
        return premio[-4:]  # Default: milhar

    def get_posicoes_verificar(colocacao: str) -> list:
        """Retorna lista de posições a verificar baseado na colocação"""
        colocacao_lower = colocacao.lower().replace(" ", "_").replace("-", "_")

        if "1_7" in colocacao_lower or "1_ao_7" in colocacao_lower:
            return [1, 2, 3, 4, 5, 6, 7]
        elif "1_5" in colocacao_lower or "1_ao_5" in colocacao_lower:
            return [1, 2, 3, 4, 5]
        elif "1_premio" in colocacao_lower or "1º" in colocacao_lower or colocacao_lower == "1":
            return [1]
        elif "2_premio" in colocacao_lower or "2º" in colocacao_lower:
            return [2]
        elif "3_premio" in colocacao_lower or "3º" in colocacao_lower:
            return [3]
        elif "4_premio" in colocacao_lower or "4º" in colocacao_lower:
            return [4]
        elif "5_premio" in colocacao_lower or "5º" in colocacao_lower:
            return [5]
        # Default: 1 ao 5
        return [1, 2, 3, 4, 5]

    def get_fator_divisor(colocacao: str) -> int:
        """Retorna o fator divisor para cálculo do prêmio"""
        colocacao_lower = colocacao.lower().replace(" ", "_").replace("-", "_")

        if "1_7" in colocacao_lower or "1_ao_7" in colocacao_lower:
            return 7
        elif "1_5" in colocacao_lower or "1_ao_5" in colocacao_lower:
            return 5
        return 1  # Prêmio único

    # 1. Buscar apostas pendentes para a data
    apostas_response = supabase.table("apostas").select("*").eq(
        "data_jogo", data_verificar
    ).eq("status", "pendente").execute()

    apostas = apostas_response.data or []
    print(f"Apostas pendentes encontradas: {len(apostas)}")

    if not apostas:
        return {
            "success": True,
            "data": data_verificar,
            "apostas_verificadas": 0,
            "premiadas": 0,
            "perderam": 0,
            "total_premios": 0,
            "message": "Nenhuma aposta pendente encontrada"
        }

    # 2. Buscar resultados para a data
    resultados_response = supabase.table("resultados").select("*").eq(
        "data", data_verificar
    ).execute()

    resultados = resultados_response.data or []
    print(f"Resultados encontrados: {len(resultados)}")

    # Função para normalizar horário (arredonda para hora cheia se necessário)
    def normalizar_horario(horario: str) -> str:
        """Normaliza horário para comparação flexível"""
        if not horario:
            return ""
        # Retorna o horário como está (já deve coincidir após correção das BANCAS)
        return horario

    def horarios_coincidem(h1: str, h2: str) -> bool:
        """Verifica se dois horários coincidem (com tolerância de ±30min)"""
        if h1 == h2:
            return True
        try:
            # Parse horários
            h1_parts = h1.split(":")
            h2_parts = h2.split(":")
            h1_min = int(h1_parts[0]) * 60 + int(h1_parts[1])
            h2_min = int(h2_parts[0]) * 60 + int(h2_parts[1])
            # Tolerância de 30 minutos
            return abs(h1_min - h2_min) <= 30
        except:
            return False

    # Criar índice de resultados por horário e banca
    resultados_index = {}
    resultados_por_hora = {}  # Agrupa por hora cheia para fallback
    for r in resultados:
        key = f"{r['horario']}_{r.get('banca', 'BRASILIA')}"
        resultados_index[key] = r
        # Também indexar só por horário para fallback
        if r['horario'] not in resultados_index:
            resultados_index[r['horario']] = r
        # Indexar por hora cheia para fallback
        hora_cheia = r['horario'].split(":")[0] + ":00"
        if hora_cheia not in resultados_por_hora:
            resultados_por_hora[hora_cheia] = []
        resultados_por_hora[hora_cheia].append(r)

    # 3. Processar cada aposta
    premiadas = 0
    perderam = 0
    total_premios = Decimal("0")
    erros = []
    verificacoes = []

    for aposta in apostas:
        try:
            palpites = aposta.get("palpites", [])
            modalidade = aposta.get("modalidade", "milhar")
            colocacao = aposta.get("colocacao", "1_5_premio")
            horarios = aposta.get("horarios", [])
            loterias = aposta.get("loterias", [])
            valor_unitario = Decimal(str(aposta.get("valor_unitario", 0)))
            multiplicador = Decimal(str(aposta.get("multiplicador", 1)))

            posicoes = get_posicoes_verificar(colocacao)
            fator = get_fator_divisor(colocacao)

            total_matches = 0
            aposta_verificacoes = []
            resultados_verificados = []

            print(f"Verificando aposta {aposta['id']}: {len(palpites)} palpites, {len(loterias)} loterias, {len(horarios)} horários")

            # Caso sem loterias nem horarios - aposta inválida, manter pendente
            if not loterias and not horarios:
                print(f"  AVISO: Aposta {aposta['id']} sem loterias nem horários - mantendo pendente")
                continue

            # Se temos loterias, usar elas para buscar resultados específicos
            if loterias:
                for loteria_id in loterias:
                    lot_info = LOTERIA_TO_BANCA.get(loteria_id)
                    if not lot_info:
                        continue

                    banca, horario = lot_info
                    # Buscar resultado específico por banca + horário
                    key = f"{horario}_{banca}"
                    resultado = resultados_index.get(key)

                    # Fallback: tentar com tolerância de horário
                    if not resultado:
                        for r in resultados:
                            if r.get('banca') == banca and horarios_coincidem(horario, r.get('horario', '')):
                                resultado = r
                                break

                    if resultado and resultado['id'] not in resultados_verificados:
                        resultados_verificados.append(resultado['id'])

                        # Verificar palpites contra este resultado
                        for palpite in palpites:
                            palpite_str = str(palpite).zfill(len(str(palpite)))
                            for pos in posicoes:
                                premio_key = f"premio_{pos}"
                                premio_valor = resultado.get(premio_key)
                                if not premio_valor:
                                    continue
                                digitos_resultado = extrair_digitos(premio_valor, modalidade)
                                if palpite_str == digitos_resultado:
                                    total_matches += 1
                                    aposta_verificacoes.append({
                                        "aposta_id": aposta["id"],
                                        "resultado_id": resultado["id"],
                                        "palpite": palpite_str,
                                        "premio_posicao": pos,
                                        "premio_numero": premio_valor,
                                        "ganhou": True,
                                    })
                                    print(f"  MATCH! Palpite {palpite_str} = Premio {pos} ({premio_valor}) - {banca} {horario}")

            # FALLBACK: Se não tem loterias, usar horarios (comportamento antigo)
            elif horarios:
                for horario in horarios:
                    # Buscar resultado para este horário
                    resultado = resultados_index.get(horario)

                    # Fallback: tentar por hora cheia se não encontrar exato
                    if not resultado:
                        hora_cheia = horario.split(":")[0] + ":00"
                        candidatos = resultados_por_hora.get(hora_cheia, [])
                        for candidato in candidatos:
                            if horarios_coincidem(horario, candidato['horario']):
                                resultado = candidato
                                break

                    if not resultado:
                        # Ainda não encontrou, pode ser que o resultado ainda não saiu
                        continue

                # Verificar cada palpite contra cada posição permitida
                for palpite in palpites:
                    palpite_str = str(palpite).zfill(len(str(palpite)))

                    for pos in posicoes:
                        premio_key = f"premio_{pos}"
                        premio_valor = resultado.get(premio_key)

                        if not premio_valor:
                            continue

                        # Extrair dígitos relevantes do resultado
                        digitos_resultado = extrair_digitos(premio_valor, modalidade)

                        # Comparar
                        if palpite_str == digitos_resultado:
                            total_matches += 1
                            aposta_verificacoes.append({
                                "aposta_id": aposta["id"],
                                "resultado_id": resultado["id"],
                                "palpite": palpite_str,
                                "premio_posicao": pos,
                                "premio_numero": premio_valor,
                                "ganhou": True,
                            })
                            print(f"  MATCH! Palpite {palpite_str} = Premio {pos} ({premio_valor}) - Horário {horario}")

            # Calcular prêmio
            if total_matches > 0:
                premio_valor_calc = valor_unitario * (multiplicador / Decimal(str(fator))) * Decimal(str(total_matches))
                total_premios += premio_valor_calc
                premiadas += 1

                # Atualizar aposta como premiada
                supabase.table("apostas").update({
                    "status": "premiada",
                    "premio_valor": float(premio_valor_calc)
                }).eq("id", aposta["id"]).execute()

                # Creditar saldo do usuário
                user_id = aposta.get("user_id")
                if user_id:
                    # Buscar saldo atual
                    profile = supabase.table("profiles").select("saldo").eq("id", user_id).single().execute()
                    saldo_atual = Decimal(str(profile.data.get("saldo", 0)))
                    novo_saldo = saldo_atual + premio_valor_calc

                    supabase.table("profiles").update({
                        "saldo": float(novo_saldo)
                    }).eq("id", user_id).execute()

                    print(f"  Usuário {user_id}: saldo atualizado de {saldo_atual} para {novo_saldo}")

                # Registrar verificações
                for v in aposta_verificacoes:
                    v["premio_calculado"] = float(premio_valor_calc / len(aposta_verificacoes))
                    verificacoes.append(v)

            else:
                # Verificar se todos os resultados já foram sorteados
                todos_resultados_verificados = False

                if loterias:
                    # Contar quantas loterias já tem resultado
                    loterias_com_resultado = 0
                    for loteria_id in loterias:
                        lot_info = LOTERIA_TO_BANCA.get(loteria_id)
                        if lot_info:
                            banca, horario = lot_info
                            key = f"{horario}_{banca}"
                            if resultados_index.get(key):
                                loterias_com_resultado += 1
                            else:
                                # Tentar com tolerância de horário
                                for r in resultados:
                                    if r.get('banca') == banca and horarios_coincidem(horario, r.get('horario', '')):
                                        loterias_com_resultado += 1
                                        break

                    todos_resultados_verificados = loterias_com_resultado == len(loterias) and len(loterias) > 0
                    print(f"  Aposta {aposta['id']}: {loterias_com_resultado}/{len(loterias)} loterias com resultado")

                elif horarios:
                    horarios_com_resultado = sum(1 for h in horarios if h in resultados_index)
                    todos_resultados_verificados = horarios_com_resultado == len(horarios) and len(horarios) > 0
                    print(f"  Aposta {aposta['id']}: {horarios_com_resultado}/{len(horarios)} horários com resultado")

                if todos_resultados_verificados:
                    # Todos os resultados já saíram e não ganhou
                    perderam += 1
                    supabase.table("apostas").update({
                        "status": "perdeu",
                        "premio_valor": 0
                    }).eq("id", aposta["id"]).execute()
                    print(f"  Aposta {aposta['id']} marcada como PERDEU")

                    # Registrar verificação negativa
                    for palpite in palpites:
                        verificacoes.append({
                            "aposta_id": aposta["id"],
                            "resultado_id": resultados_verificados[0] if resultados_verificados else None,
                            "palpite": str(palpite),
                            "premio_posicao": None,
                            "premio_numero": None,
                            "ganhou": False,
                            "premio_calculado": 0
                        })
                else:
                    print(f"  Aposta {aposta['id']} mantida como PENDENTE - aguardando resultados")

        except Exception as e:
            erros.append(f"Aposta {aposta.get('id')}: {str(e)}")
            print(f"Erro ao verificar aposta {aposta.get('id')}: {e}")

    # 4. Inserir registros de verificação em batch
    if verificacoes:
        try:
            supabase.table("verificacao_apostas").insert(verificacoes).execute()
        except Exception as e:
            print(f"Erro ao inserir verificações: {e}")

    resultado_final = {
        "success": True,
        "data": data_verificar,
        "apostas_verificadas": len(apostas),
        "premiadas": premiadas,
        "perderam": perderam,
        "ainda_pendentes": len(apostas) - premiadas - perderam,
        "total_premios": float(total_premios),
        "erros": erros[:10] if erros else None
    }

    print(f"=== Verificação concluída: {resultado_final} ===")
    return resultado_final


@app.function(image=image, secrets=[supabase_secret, scraperapi_secret], timeout=900)
def scrape_historico(dias: int = 7) -> dict:
    """Scrape ultimos N dias (para popular o sistema)"""
    resultados_por_dia = {}
    total_upserted = 0

    for i in range(dias):
        data = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        print(f"\n=== Scraping {data} ===")

        resultado = scrape_todos_estados.local(data)
        resultados_por_dia[data] = {
            "scraped": resultado["total_scraped"],
            "upserted": resultado["upserted"]
        }
        total_upserted += resultado["upserted"]

    return {
        "success": True,
        "dias": dias,
        "total_upserted": total_upserted,
        "por_dia": resultados_por_dia,
    }


# =============================================================================
# SCHEDULES - SCRAPING AUTOMATICO
# =============================================================================
# NOTA: Modal usa UTC. Brasília = UTC-3
# - 7h Brasília = 10h UTC
# - 20h Brasília = 23h UTC
# - 23h Brasília = 02h UTC (dia seguinte)
# - 1h Brasília = 04h UTC

@app.function(
    image=image,
    secrets=[supabase_secret, scraperapi_secret],
    timeout=600,
    # schedule removido - usando modal_scraper_v2.py agora
)
def scrape_scheduled():
    """Scraping agendado - roda a cada 30 minutos (7h-20h Brasília)"""
    print(f"=== Scrape agendado: {datetime.now()} UTC ===")

    # 1. Scrape resultados
    resultado_scrape = scrape_todos_estados.local()
    print(f"Scrape: {resultado_scrape}")

    # 2. Verificar prêmios
    resultado_verificacao = verificar_premios.local()
    print(f"Verificação: {resultado_verificacao}")

    return {
        "scrape": resultado_scrape,
        "verificacao": resultado_verificacao
    }


@app.function(
    image=image,
    secrets=[supabase_secret, scraperapi_secret],
    timeout=600,
    # schedule removido - usando modal_scraper_v2.py agora
)
def scrape_noturno():
    """Scrape noturno - 21h-23h Brasília"""
    print(f"=== Scrape noturno: {datetime.now()} UTC ===")

    # 1. Scrape resultados
    resultado_scrape = scrape_todos_estados.local()
    print(f"Scrape: {resultado_scrape}")

    # 2. Verificar prêmios
    resultado_verificacao = verificar_premios.local()
    print(f"Verificação: {resultado_verificacao}")

    return {
        "scrape": resultado_scrape,
        "verificacao": resultado_verificacao
    }


@app.function(
    image=image,
    secrets=[supabase_secret, scraperapi_secret],
    timeout=300,
    # schedule removido - usando modal_scraper_v2.py agora
)
def scrape_madrugada():
    """Scrape madrugada - 1h Brasília para pegar LBR 00:40"""
    print(f"=== Scrape madrugada: {datetime.now()} UTC ===")

    # 1. Scrape resultados
    resultado_scrape = scrape_todos_estados.local()
    print(f"Scrape: {resultado_scrape}")

    # 2. Verificar prêmios (do dia anterior também)
    from datetime import timedelta
    ontem = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    resultado_verificacao_ontem = verificar_premios.local(ontem)
    resultado_verificacao_hoje = verificar_premios.local()

    print(f"Verificação ontem: {resultado_verificacao_ontem}")
    print(f"Verificação hoje: {resultado_verificacao_hoje}")

    return {
        "scrape": resultado_scrape,
        "verificacao_ontem": resultado_verificacao_ontem,
        "verificacao_hoje": resultado_verificacao_hoje
    }


# =============================================================================
# CLI LOCAL PARA TESTES
# =============================================================================

@app.local_entrypoint()
def main(
    comando: str = "hoje",
    data: Optional[str] = None,
    dias: int = 7,
):
    """
    Entrypoint local para testes

    Comandos:
        hoje      - Scrape de hoje
        historico - Scrape dos ultimos N dias
        verificar - Verificar prêmios de apostas pendentes
        completo  - Scrape + verificação (simula schedule)

    Exemplos:
        modal run modal_scraper.py --comando hoje
        modal run modal_scraper.py --comando hoje --data 2026-01-25
        modal run modal_scraper.py --comando historico --dias 7
        modal run modal_scraper.py --comando verificar
        modal run modal_scraper.py --comando verificar --data 2026-01-28
        modal run modal_scraper.py --comando completo
    """
    if comando == "hoje":
        print(f"Scraping {data or 'hoje'}...")
        resultado = scrape_todos_estados.remote(data)
        print(f"\nResultado: {resultado}")

    elif comando == "historico":
        print(f"Scraping ultimos {dias} dias...")
        resultado = scrape_historico.remote(dias)
        print(f"\nResultado: {resultado}")

    elif comando == "verificar":
        print(f"Verificando prêmios para {data or 'hoje'}...")
        resultado = verificar_premios.remote(data)
        print(f"\nResultado: {resultado}")

    elif comando == "completo":
        print(f"Executando scrape + verificação para {data or 'hoje'}...")
        resultado_scrape = scrape_todos_estados.remote(data)
        print(f"\nScrape: {resultado_scrape}")

        resultado_verificacao = verificar_premios.remote(data)
        print(f"\nVerificação: {resultado_verificacao}")

    else:
        print(f"Comando desconhecido: {comando}")
        print("Comandos validos: hoje, historico, verificar, completo")
