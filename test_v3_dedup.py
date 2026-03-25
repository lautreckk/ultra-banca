"""
Teste do dedup: roda o scraping v3 com dedup_resultados e compara com DB.
"""
import sys, os, re, json, time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

# =============================================================================
# CONFIG
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
# PARSE (copiado do v3)
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
    if "AVAL" in texto_upper and "PE" in texto_upper: return "AVAL"
    if "CAMINHO DA SORTE" in texto_upper: return "CAMINHO-DA-SORTE"
    if "POPULAR" in texto_upper and ("RECIFE" in texto_upper or "PE," in texto_upper): return "POPULAR"
    if "MONTE CARLOS" in texto_upper or "NORDESTE MONTE" in texto_upper: return "MONTE-CARLOS"
    if "LOTEP" in texto_upper: return "LOTEP"
    if "CAMPINA GRANDE" in texto_upper: return "CAMPINA-GRANDE"
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

def _premios_match(premios_a, premios_b):
    n = min(len(premios_a), len(premios_b))
    if n < 3:
        return False
    for i in range(n):
        if premios_a[i].get("milhar") != premios_b[i].get("milhar"):
            return False
    return True

def dedup_resultados(resultados):
    """
    Deduplica resultados por (horario, banca, loteria).
    Só mescla se prêmios sobrepostos forem idênticos (mesmo sorteio 1-5 vs 1-10).
    Se diferentes, são sorteios distintos - mantém o com mais prêmios.
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
                if len(premios) > len(existing_premios):
                    merged[key] = r
                elif len(premios) == len(existing_premios):
                    for i, p in enumerate(premios):
                        if i < len(existing_premios):
                            if not existing_premios[i].get("bicho") and p.get("bicho"):
                                existing_premios[i]["bicho"] = p["bicho"]
            else:
                if len(premios) > len(existing_premios):
                    merged[key] = r
    return list(merged.values())

def parse_resultados(soup, data, banca):
    resultados = []
    resultados = [r for h in soup.find_all("h3", class_="g") if (r := extrair_resultado_de_header(h, data, banca))]
    if resultados:
        return dedup_resultados(resultados)
    resultados = [r for h in soup.find_all("h3") if re.search(r'\d{1,2}[h:H]\d{2}', h.get_text(strip=True)) and (r := extrair_resultado_de_header(h, data, banca))]
    if resultados:
        return dedup_resultados(resultados)
    tabelas_processadas = set()
    for table in soup.find_all("table"):
        tid = id(table)
        if tid in tabelas_processadas: continue
        tabelas_processadas.add(tid)
        premios = extrair_premios_tabela(table)
        if len(premios) >= 5:
            horario, loteria = buscar_info_tabela(table)
            if horario:
                resultados.append({"data": data, "horario": horario, "banca": banca, "loteria": loteria, "premios": premios})
    return dedup_resultados(resultados)


# =============================================================================
# DB DATA
# =============================================================================
DB_RESULTS = [
    {"banca":"BAHIA","horario":"10:00","loteria":"MALUCA","premio_1":"0674"},
    {"banca":"BAHIA","horario":"10:00","loteria":"GERAL","premio_1":"1730"},
    {"banca":"BRASILIA","horario":"00:40","loteria":"LBR","premio_1":"9188"},
    {"banca":"BRASILIA","horario":"07:30","loteria":"LBR","premio_1":"1108"},
    {"banca":"BRASILIA","horario":"08:30","loteria":"LBR","premio_1":"8150"},
    {"banca":"BRASILIA","horario":"10:00","loteria":"LBR","premio_1":"2844"},
    {"banca":"LOOK/GOIAS","horario":"07:00","loteria":"LOOK","premio_1":"1241"},
    {"banca":"LOOK/GOIAS","horario":"09:00","loteria":"LOOK","premio_1":"3888"},
    {"banca":"LOOK/GOIAS","horario":"11:00","loteria":"LOOK","premio_1":"7767"},
    {"banca":"LOTECE","horario":"11:00","loteria":"LOTECE","premio_1":"7183"},
    {"banca":"LOTEP","horario":"09:20","loteria":"GERAL","premio_1":"3065"},
    {"banca":"LOTEP","horario":"09:30","loteria":"GERAL","premio_1":"7802"},
    {"banca":"LOTEP","horario":"09:40","loteria":"GERAL","premio_1":"1557"},
    {"banca":"LOTEP","horario":"10:00","loteria":"GERAL","premio_1":"0551"},
    {"banca":"LOTEP","horario":"11:00","loteria":"GERAL","premio_1":"9694"},
    {"banca":"LOTEP","horario":"12:40","loteria":"GERAL","premio_1":"0551"},
    {"banca":"LOTEP","horario":"12:45","loteria":"GERAL","premio_1":"1557"},
    {"banca":"LOTEP","horario":"14:00","loteria":"GERAL","premio_1":"0551"},
    {"banca":"LOTEP","horario":"15:40","loteria":"GERAL","premio_1":"0551"},
    {"banca":"LOTEP","horario":"15:45","loteria":"GERAL","premio_1":"1557"},
    {"banca":"LOTEP","horario":"17:00","loteria":"GERAL","premio_1":"0551"},
    {"banca":"LOTEP","horario":"18:30","loteria":"GERAL","premio_1":"0551"},
    {"banca":"LOTEP","horario":"19:00","loteria":"GERAL","premio_1":"1557"},
    {"banca":"LOTEP","horario":"19:30","loteria":"GERAL","premio_1":"7802"},
    {"banca":"LOTEP","horario":"21:00","loteria":"GERAL","premio_1":"7802"},
    {"banca":"NACIONAL","horario":"02:00","loteria":"NACIONAL","premio_1":"6162"},
    {"banca":"NACIONAL","horario":"08:00","loteria":"NACIONAL","premio_1":"3596"},
    {"banca":"NACIONAL","horario":"10:00","loteria":"NACIONAL","premio_1":"2038"},
    {"banca":"PARAIBA","horario":"09:45","loteria":"GERAL","premio_1":"0891"},
    {"banca":"PARAIBA","horario":"10:45","loteria":"LOTEP","premio_1":"6110"},
    {"banca":"PARAIBA","horario":"10:45","loteria":"GERAL","premio_1":"7107"},
    {"banca":"RIO-GRANDE-NORTE","horario":"08:30","loteria":"GERAL","premio_1":"0175"},
    {"banca":"RIO/FEDERAL","horario":"09:20","loteria":"PT","premio_1":"2087"},
    {"banca":"RIO/FEDERAL","horario":"11:00","loteria":"PTM","premio_1":"4255"},
    {"banca":"SAO-PAULO","horario":"08:00","loteria":"GERAL","premio_1":"0627"},
    {"banca":"SAO-PAULO","horario":"10:00","loteria":"GERAL","premio_1":"5345"},
    {"banca":"SERGIPE","horario":"10:00","loteria":"GERAL","premio_1":"9729"},
]

# =============================================================================
# MAIN
# =============================================================================
def main():
    data = "2026-02-04"
    print(f"{'='*90}")
    print(f"  TESTE DEDUP V3 - Scraping com dedup_resultados")
    print(f"{'='*90}\n")

    db_by_key = {}
    for r in DB_RESULTS:
        key = f"{r['banca']}|{r['horario']}|{r['loteria']}"
        db_by_key[key] = r

    v3_by_key = {}
    total_bruto = 0
    total_dedup = 0

    for estado, config in ESTADOS_CONFIG.items():
        banca = config["banca"]

        if config.get("custom_url"):
            url = f"{BASE_URL}{config['custom_url'].format(data=data)}"
        else:
            url = f"{BASE_URL}/resultado-do-jogo-do-bicho/{config['url_param']}/do-dia/{data}"

        print(f"[{estado}] Scrapando...", end=" ", flush=True)
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "pt-BR,pt;q=0.9",
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            # Parse SEM dedup (bruto)
            raw = []
            for h in soup.find_all("h3", class_="g"):
                r = extrair_resultado_de_header(h, data, banca)
                if r:
                    raw.append(r)

            # Parse COM dedup
            resultados = parse_resultados(soup, data, banca)

            bruto = len(raw) if raw else "?"
            dedup = len(resultados)
            total_bruto += len(raw) if raw else 0
            total_dedup += dedup

            print(f"bruto={bruto} -> dedup={dedup}", end="")

            # Mostra detalhes dos prêmios para os dedupados
            for r in resultados:
                key = f"{banca}|{r['horario']}|{r['loteria']}"
                v3_by_key[key] = r
                n_premios = len(r.get("premios", []))
                p1 = r["premios"][0]["milhar"] if r.get("premios") else "?"
                print(f"\n    {r['horario']} {r['loteria']:<12} 1o={p1} ({n_premios} premios)", end="")

            print()

        except Exception as e:
            print(f"ERRO: {e}")

        time.sleep(1)

    # COMPARACAO COM DB
    print(f"\n{'='*90}")
    print(f"  COMPARACAO COM DB (dedup aplicado)")
    print(f"{'='*90}")

    match = 0
    diff = 0
    missing = 0

    for key in sorted(db_by_key.keys()):
        db_p1 = db_by_key[key]["premio_1"]
        v3_r = v3_by_key.get(key)

        if not v3_r:
            missing += 1
            continue

        v3_p1 = v3_r["premios"][0]["milhar"] if v3_r.get("premios") else "---"
        v3_n = len(v3_r.get("premios", []))

        if db_p1 == v3_p1:
            match += 1
        else:
            diff += 1
            print(f"  DIFF: {key}: DB={db_p1} vs V3={v3_p1} ({v3_n} premios)")

    print(f"\n{'='*90}")
    print(f"  RESULTADO FINAL")
    print(f"{'='*90}")
    print(f"  Total no DB:       {len(db_by_key)}")
    print(f"  Match:             {match}/{len(db_by_key)}")
    print(f"  Diferentes:        {diff}")
    print(f"  Faltando:          {missing}")
    print(f"  Bruto (sem dedup): {total_bruto}")
    print(f"  Dedup (com dedup): {total_dedup}")
    print(f"  Reducao:           {total_bruto - total_dedup} duplicatas removidas")

    if diff == 0 and missing == 0:
        print(f"\n  VEREDITO: DEDUP FUNCIONA PERFEITAMENTE - 100% match!")
    elif diff == 0:
        print(f"\n  VEREDITO: DEDUP OK - {missing} faltando (provavelmente ainda nao sortearam)")
    else:
        print(f"\n  VEREDITO: AINDA TEM {diff} DIVERGENCIAS")

if __name__ == "__main__":
    main()
