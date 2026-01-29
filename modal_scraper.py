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

@app.function(image=image, secrets=[supabase_secret], timeout=600)
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

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(supabase_url, supabase_key)

    def fetch_html(url: str, retries: int = 3) -> Optional[str]:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }
        for attempt in range(retries):
            try:
                with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                    response = client.get(url, headers=headers)
                    if response.status_code == 429:
                        time.sleep(5 * (attempt + 1))
                        continue
                    response.raise_for_status()
                    return response.text
            except Exception as e:
                print(f"Tentativa {attempt + 1} falhou: {e}")
                if attempt < retries - 1:
                    time.sleep(2 * (attempt + 1))
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
        time.sleep(0.8)

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


@app.function(image=image, secrets=[supabase_secret], timeout=300)
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
            valor_unitario = Decimal(str(aposta.get("valor_unitario", 0)))
            multiplicador = Decimal(str(aposta.get("multiplicador", 1)))

            posicoes = get_posicoes_verificar(colocacao)
            fator = get_fator_divisor(colocacao)

            total_matches = 0
            aposta_verificacoes = []

            # Verificar cada horário apostado
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
                # Verificar se todos os horários já foram sorteados
                horarios_com_resultado = sum(1 for h in horarios if h in resultados_index)

                if horarios_com_resultado == len(horarios):
                    # Todos os horários já saíram e não ganhou
                    perderam += 1
                    supabase.table("apostas").update({
                        "status": "perdeu",
                        "premio_valor": 0
                    }).eq("id", aposta["id"]).execute()

                    # Registrar verificação negativa
                    for horario in horarios:
                        resultado = resultados_index.get(horario)
                        if resultado:
                            for palpite in palpites:
                                verificacoes.append({
                                    "aposta_id": aposta["id"],
                                    "resultado_id": resultado["id"],
                                    "palpite": str(palpite),
                                    "premio_posicao": None,
                                    "premio_numero": None,
                                    "ganhou": False,
                                    "premio_calculado": 0
                                })
                # else: manter como pendente, ainda faltam horários

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


@app.function(image=image, secrets=[supabase_secret], timeout=900)
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
    secrets=[supabase_secret],
    timeout=600,
    schedule=modal.Cron("*/30 10-23 * * *")  # 7h-20h Brasília (10h-23h UTC)
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
    secrets=[supabase_secret],
    timeout=600,
    schedule=modal.Cron("*/30 0-2 * * *")  # 21h-23h Brasília (0h-2h UTC)
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
    secrets=[supabase_secret],
    timeout=300,
    schedule=modal.Cron("0 4 * * *")  # 1h Brasília (4h UTC)
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
