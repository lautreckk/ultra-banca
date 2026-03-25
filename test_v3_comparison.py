"""
Script de comparação: V3 requests scraping vs dados existentes no DB (v2)
Roda localmente sem Modal, testando a lógica de scraping do v3.
"""
import sys
import os
import re
import json
import time
from datetime import datetime

# Importa as funções de parse do v3 diretamente
sys.path.insert(0, os.path.dirname(__file__))

# Reimporta as funções necessárias sem precisar do Modal
import requests
from bs4 import BeautifulSoup

# =============================================================================
# CONFIG (copiado do v3)
# =============================================================================
ESTADOS_CONFIG = {
    "RJ": {"url_param": "RJ", "banca": "RIO/FEDERAL", "portalbrasil_slug": None},
    "BA": {"url_param": "BA", "banca": "BAHIA", "portalbrasil_slug": "bahia"},
    "GO": {"url_param": "GO", "banca": "LOOK/GOIAS", "portalbrasil_slug": "goias"},
    "CE": {"url_param": "CE", "banca": "LOTECE", "portalbrasil_slug": "ceara"},
    "PE": {"url_param": "PE", "banca": "LOTEP", "portalbrasil_slug": "pernambuco"},
    "PB": {"url_param": "PB", "banca": "PARAIBA", "portalbrasil_slug": "paraiba"},
    "SP": {"url_param": "SP", "banca": "SAO-PAULO", "portalbrasil_slug": "sao-paulo"},
    "MG": {"url_param": "MG", "banca": "MINAS-GERAIS", "portalbrasil_slug": "minas-gerais"},
    "DF": {"url_param": "DF", "banca": "BRASILIA", "portalbrasil_slug": "brasilia-df"},
    "RN": {"url_param": "RN", "banca": "RIO-GRANDE-NORTE", "portalbrasil_slug": "rio-grande-do-norte"},
    "RS": {"url_param": "RS", "banca": "RIO-GRANDE-SUL", "portalbrasil_slug": "rio-grande-do-sul"},
    "SE": {"url_param": "SE", "banca": "SERGIPE", "portalbrasil_slug": "sergipe"},
    "PR": {"url_param": "PR", "banca": "PARANA", "portalbrasil_slug": "parana"},
    "FED": {"url_param": "banca-federal", "banca": "FEDERAL", "portalbrasil_slug": None},
    "NAC": {"url_param": None, "banca": "NACIONAL", "portalbrasil_slug": None, "custom_url": "/resultados-loteria-nacional-do-dia-{data}"},
}

BASE_URL = "https://www.resultadofacil.com.br"

HORARIOS_ESPERADOS = {
    "RJ": 6, "BA": 12, "GO": 8, "CE": 5, "PE": 16, "PB": 11,
    "SP": 9, "MG": 5, "DF": 13, "NAC": 7, "RN": 4, "RS": 2,
    "SE": 5, "PR": 2, "FED": 1,
}

# =============================================================================
# PARSE FUNCTIONS (copiadas do v3)
# =============================================================================
def identificar_loteria(texto):
    texto_upper = texto.upper()
    if "CORUJA" in texto_upper: return "CORUJA"
    if "PTM" in texto_upper: return "PTM"
    if "PTV" in texto_upper: return "PTV"
    if "PTN" in texto_upper: return "PTN"
    if "MALUCA" in texto_upper: return "MALUCA"
    if "LBR" in texto_upper: return "LBR"
    if "LOTECE" in texto_upper: return "LOTECE"
    if "LOTEP" in texto_upper: return "LOTEP"
    if "ALVORADA" in texto_upper: return "ALVORADA"
    if "MINAS DIA" in texto_upper: return "MINAS-DIA"
    if "MINAS NOITE" in texto_upper: return "MINAS-NOITE"
    if "PREFERIDA" in texto_upper: return "PREFERIDA"
    if "GAUCHA" in texto_upper or "GAÚCHA" in texto_upper: return "GAUCHA"
    if "PARANA" in texto_upper or "PARANÁ" in texto_upper: return "PARANA"
    if "LOOK" in texto_upper: return "LOOK"
    if "GOIAS" in texto_upper or "GOIÁS" in texto_upper: return "GOIAS"
    if "PAULISTA" in texto_upper: return "PAULISTA"
    if "NACIONAL" in texto_upper: return "NACIONAL"
    if "FEDERAL" in texto_upper: return "FEDERAL"
    if re.search(r'\bPT\b', texto_upper): return "PT"
    return "GERAL"

def extrair_premios_tabela(table):
    premios = []
    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        for i, cell in enumerate(cells):
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
    return premios[:7]

def extrair_resultado_de_header(header, data, banca):
    header_text = header.get_text(strip=True)
    horario_match = re.search(r'(\d{1,2})[h:H](\d{2})?', header_text)
    if not horario_match:
        return None
    horario = f"{horario_match.group(1).zfill(2)}:{horario_match.group(2) or '00'}"
    loteria = identificar_loteria(header_text)
    table = header.find_next("table")
    if not table:
        return None
    premios = extrair_premios_tabela(table)
    if len(premios) >= 5:
        return {"data": data, "horario": horario, "banca": banca, "loteria": loteria, "premios": premios}
    return None

def buscar_info_tabela(table):
    horario = None
    loteria = "GERAL"
    for elem in table.find_all_previous(["h1", "h2", "h3", "h4", "p", "div", "span"], limit=15):
        text = elem.get_text(strip=True)
        if not horario:
            h_match = re.search(r'(\d{1,2})[h:H](\d{2})?', text)
            if h_match:
                horario = f"{h_match.group(1).zfill(2)}:{h_match.group(2) or '00'}"
        lot = identificar_loteria(text)
        if lot != "GERAL":
            loteria = lot
            break
    return horario, loteria

def parse_resultados(soup, data, banca):
    # Estratégia 1: h3 com classe "g"
    resultados = []
    for header in soup.find_all("h3", class_="g"):
        resultado = extrair_resultado_de_header(header, data, banca)
        if resultado:
            resultados.append(resultado)
    if resultados:
        return resultados

    # Estratégia 2: Qualquer h3 com horário
    for header in soup.find_all("h3"):
        header_text = header.get_text(strip=True)
        if re.search(r'\d{1,2}[h:H]\d{2}', header_text):
            resultado = extrair_resultado_de_header(header, data, banca)
            if resultado:
                resultados.append(resultado)
    if resultados:
        return resultados

    # Estratégia 3: Busca por tabelas
    tabelas_processadas = set()
    for table in soup.find_all("table"):
        table_id = id(table)
        if table_id in tabelas_processadas:
            continue
        tabelas_processadas.add(table_id)
        premios = extrair_premios_tabela(table)
        if len(premios) >= 5:
            horario, loteria = buscar_info_tabela(table)
            if horario:
                resultados.append({"data": data, "horario": horario, "banca": banca, "loteria": loteria, "premios": premios})

    return resultados


# =============================================================================
# SCRAPE VIA REQUESTS (mesma lógica do v3)
# =============================================================================
def scrape_estado_requests(estado, data):
    config = ESTADOS_CONFIG.get(estado)
    if not config:
        return {"estado": estado, "error": "não configurado", "resultados": []}

    if config.get("custom_url"):
        url = f"{BASE_URL}{config['custom_url'].format(data=data)}"
    else:
        url = f"{BASE_URL}/resultado-do-jogo-do-bicho/{config['url_param']}/do-dia/{data}"

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        html_content = response.text
        soup = BeautifulSoup(html_content, "html.parser")
        resultados = parse_resultados(soup, data, config['banca'])

        return {
            "estado": estado,
            "banca": config["banca"],
            "url": url,
            "html_size": len(html_content),
            "resultados": resultados,
            "error": None,
        }
    except Exception as e:
        return {
            "estado": estado,
            "banca": config["banca"],
            "url": url,
            "html_size": 0,
            "resultados": [],
            "error": str(e),
        }


# =============================================================================
# MAIN - COMPARACAO
# =============================================================================
def main():
    data = datetime.now().strftime("%Y-%m-%d")
    if len(sys.argv) > 1:
        data = sys.argv[1]

    print(f"{'='*80}")
    print(f"  COMPARACAO V3 (requests) vs DB existente - {data}")
    print(f"{'='*80}\n")

    # Scrape todos os estados
    v3_results = {}
    total_v3 = 0

    for estado in ESTADOS_CONFIG:
        print(f"[{estado}] Scrapando via requests...", end=" ", flush=True)
        result = scrape_estado_requests(estado, data)

        n = len(result["resultados"])
        total_v3 += n

        if result["error"]:
            print(f"ERRO: {result['error']}")
        elif n == 0:
            print(f"0 resultados (HTML: {result['html_size']} bytes)")
        else:
            # Mostra primeiro resultado como amostra
            sample = result["resultados"][0]
            p1 = sample["premios"][0]["milhar"] if sample.get("premios") else "?"
            print(f"{n} resultados (1o: {sample['horario']} {sample['loteria']} 1o={p1})")

        v3_results[estado] = result
        time.sleep(1)  # Delay entre requests

    # Resumo por banca
    v3_por_banca = {}
    v3_detalhes = {}
    for estado, result in v3_results.items():
        banca = result["banca"]
        resultados = result["resultados"]
        v3_por_banca[banca] = len(resultados)
        v3_detalhes[banca] = []
        for r in resultados:
            p1 = r["premios"][0]["milhar"] if r.get("premios") else "?"
            v3_detalhes[banca].append({
                "horario": r["horario"],
                "loteria": r["loteria"],
                "premio_1": p1,
            })

    # Salva resultado detalhado em JSON para referência
    output = {
        "data": data,
        "v3_por_banca": v3_por_banca,
        "v3_detalhes": v3_detalhes,
        "total_v3": total_v3,
    }

    output_file = f"/tmp/v3_comparison_{data}.json"
    with open(output_file, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*80}")
    print(f"  RESULTADO DA COMPARACAO")
    print(f"{'='*80}")
    print(f"\n{'Banca':<22} {'V3(requests)':<14} {'Esperado':<10}")
    print(f"{'-'*22} {'-'*14} {'-'*10}")

    for estado, config in ESTADOS_CONFIG.items():
        banca = config["banca"]
        v3_count = v3_por_banca.get(banca, 0)
        esperado = HORARIOS_ESPERADOS.get(estado, "?")

        if v3_count == 0:
            status = "!!! ZERO"
        elif isinstance(esperado, int) and v3_count >= esperado:
            status = "COMPLETO"
        else:
            status = f"parcial"

        print(f"{banca:<22} {v3_count:<14} {esperado:<10} {status}")

    print(f"\n{'='*80}")
    print(f"  TOTAL V3: {total_v3} resultados via requests (0 creditos Firecrawl)")
    print(f"{'='*80}")

    # Mostra detalhes por banca
    print(f"\n{'='*80}")
    print(f"  DETALHES POR BANCA (horarios encontrados)")
    print(f"{'='*80}")
    for banca in sorted(v3_detalhes.keys()):
        detalhes = v3_detalhes[banca]
        if not detalhes:
            continue
        horarios = sorted(set(d["horario"] for d in detalhes))
        print(f"\n  {banca}: {len(detalhes)} resultados")
        for d in sorted(detalhes, key=lambda x: x["horario"]):
            print(f"    {d['horario']} {d['loteria']:<12} 1o={d['premio_1']}")

    print(f"\nJSON salvo em: {output_file}")


if __name__ == "__main__":
    main()
