"""
Catálogo completo: todos os estados, loterias e horários que o v3 captura.
Scrapa todos os estados e monta uma tabela completa.
"""
import sys, os, re, json, time
from datetime import datetime, timedelta

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

# =============================================================================
# PARSE (copiado do v3 atualizado)
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
        if len(cells) < 2: continue
        for cell in cells:
            text = cell.get_text(strip=True)
            m = re.search(r'\b(\d{4})\b', text)
            if m:
                bicho = ""
                if len(cells) > 2:
                    bt = cells[-1].get_text(strip=True)
                    if not re.search(r'\d{4}', bt) and len(bt) < 20:
                        bicho = bt
                premios.append({"milhar": m.group(1), "bicho": bicho})
                break
    return premios[:7]

def _premios_match(a, b):
    n = min(len(a), len(b))
    if n < 3: return False
    return all(a[i].get("milhar") == b[i].get("milhar") for i in range(n))

def dedup_resultados(resultados):
    merged = {}
    for r in resultados:
        key = f"{r['horario']}|{r['banca']}|{r['loteria']}"
        premios = r.get("premios", [])
        if key not in merged:
            merged[key] = r
        else:
            existing_premios = merged[key].get("premios", [])
            if _premios_match(premios, existing_premios):
                if len(premios) > len(existing_premios):
                    merged[key] = r
            else:
                if len(premios) > len(existing_premios):
                    merged[key] = r
    return list(merged.values())

def scrape_headers(soup):
    """Retorna lista de (header_text, n_premios) para análise"""
    results = []
    for h3 in soup.find_all("h3", class_="g"):
        text = h3.get_text(strip=True)
        table = h3.find_next("table")
        n = 0
        if table:
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                if len(cells) >= 2:
                    for cell in cells:
                        if re.search(r'\b\d{4}\b', cell.get_text(strip=True)):
                            n += 1
                            break
        results.append((text, n))
    return results

def parse_resultados(soup, data, banca):
    resultados = []
    for h in soup.find_all("h3", class_="g"):
        ht = h.get_text(strip=True)
        hm = re.search(r'(\d{1,2})[h:H](\d{2})?', ht)
        if not hm: continue
        horario = f"{hm.group(1).zfill(2)}:{hm.group(2) or '00'}"
        loteria = identificar_loteria(ht)
        table = h.find_next("table")
        if not table: continue
        premios = extrair_premios_tabela(table)
        if len(premios) >= 5:
            resultados.append({"data": data, "horario": horario, "banca": banca, "loteria": loteria, "premios": premios})
    if resultados:
        return dedup_resultados(resultados)
    # fallback: any h3 with time
    for h in soup.find_all("h3"):
        ht = h.get_text(strip=True)
        if not re.search(r'\d{1,2}[h:H]\d{2}', ht): continue
        hm = re.search(r'(\d{1,2})[h:H](\d{2})?', ht)
        if not hm: continue
        horario = f"{hm.group(1).zfill(2)}:{hm.group(2) or '00'}"
        loteria = identificar_loteria(ht)
        table = h.find_next("table")
        if not table: continue
        premios = extrair_premios_tabela(table)
        if len(premios) >= 5:
            resultados.append({"data": data, "horario": horario, "banca": banca, "loteria": loteria, "premios": premios})
    return dedup_resultados(resultados)


# =============================================================================
# MAIN
# =============================================================================
def main():
    # Usa ontem para ter dados mais completos (todos horários já passaram)
    data = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    if len(sys.argv) > 1:
        data = sys.argv[1]

    print(f"{'='*90}")
    print(f"  CATALOGO COMPLETO v3 - Data: {data}")
    print(f"{'='*90}\n")

    all_data = {}

    for estado, config in ESTADOS_CONFIG.items():
        banca = config["banca"]
        if config.get("custom_url"):
            url = f"{BASE_URL}{config['custom_url'].format(data=data)}"
        else:
            url = f"{BASE_URL}/resultado-do-jogo-do-bicho/{config['url_param']}/do-dia/{data}"

        print(f"[{estado}] Scrapando {banca}...", end=" ", flush=True)

        try:
            headers_req = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "pt-BR,pt;q=0.9",
            }
            resp = requests.get(url, headers=headers_req, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            # Headers brutos (para ver nomes originais)
            raw_headers = scrape_headers(soup)

            # Resultados parseados + dedupados
            resultados = parse_resultados(soup, data, banca)

            all_data[estado] = {
                "banca": banca,
                "url": url,
                "raw_headers": raw_headers,
                "resultados": resultados,
            }
            print(f"{len(raw_headers)} headers brutos -> {len(resultados)} resultados")

        except Exception as e:
            all_data[estado] = {"banca": banca, "url": url, "raw_headers": [], "resultados": [], "error": str(e)}
            print(f"ERRO: {e}")

        time.sleep(1)

    # ==========================================================================
    # RELATORIO
    # ==========================================================================
    print(f"\n\n{'='*90}")
    print(f"  RELATORIO DETALHADO POR ESTADO")
    print(f"{'='*90}")

    grand_total = 0

    for estado, config in ESTADOS_CONFIG.items():
        info = all_data[estado]
        banca = info["banca"]
        resultados = info.get("resultados", [])

        if info.get("error"):
            print(f"\n  {estado} ({banca}): ERRO - {info['error']}")
            continue

        # Agrupa por loteria
        by_loteria = {}
        for r in resultados:
            lot = r["loteria"]
            if lot not in by_loteria:
                by_loteria[lot] = []
            by_loteria[lot].append(r)

        total_estado = len(resultados)
        grand_total += total_estado

        print(f"\n  {'='*70}")
        print(f"  {estado} | Banca: {banca} | {total_estado} resultados")
        print(f"  {'='*70}")

        for loteria in sorted(by_loteria.keys()):
            items = sorted(by_loteria[loteria], key=lambda x: x["horario"])
            horarios = [r["horario"] for r in items]
            n_premios = [len(r.get("premios", [])) for r in items]

            print(f"\n    Loteria: {loteria} ({len(items)} horários)")
            print(f"    {'Horário':<10} {'1º Prêmio':<12} {'Prêmios':<10}")
            print(f"    {'-'*35}")
            for r in items:
                p1 = r["premios"][0]["milhar"] if r.get("premios") else "---"
                bicho = r["premios"][0].get("bicho", "") if r.get("premios") else ""
                np = len(r.get("premios", []))
                bicho_str = f" ({bicho})" if bicho else ""
                print(f"    {r['horario']:<10} {p1}{bicho_str:<12} {np} prêmios")

    # ==========================================================================
    # RESUMO CONSOLIDADO
    # ==========================================================================
    print(f"\n\n{'='*90}")
    print(f"  RESUMO CONSOLIDADO")
    print(f"{'='*90}")
    print(f"\n  {'Estado':<6} {'Banca':<22} {'Loterias':<50} {'Total'}")
    print(f"  {'-'*90}")

    for estado, config in ESTADOS_CONFIG.items():
        info = all_data[estado]
        banca = info["banca"]
        resultados = info.get("resultados", [])

        loterias = sorted(set(r["loteria"] for r in resultados))
        lot_str = ", ".join(loterias) if loterias else "(sem dados)"

        print(f"  {estado:<6} {banca:<22} {lot_str:<50} {len(resultados)}")

    print(f"\n  TOTAL GERAL: {grand_total} resultados")

    # ==========================================================================
    # HEADERS BRUTOS (nomes originais do site)
    # ==========================================================================
    print(f"\n\n{'='*90}")
    print(f"  HEADERS BRUTOS DO SITE (nomes originais)")
    print(f"{'='*90}")

    for estado, config in ESTADOS_CONFIG.items():
        info = all_data[estado]
        raw = info.get("raw_headers", [])
        if not raw:
            continue

        print(f"\n  {estado} ({info['banca']}):")
        for text, n in raw:
            # Extrai só o nome relevante (remove "Resultado do Jogo do Bicho ")
            clean = text.replace("Resultado do Jogo do Bicho ", "").strip()
            print(f"    {clean:<75} ({n} prêmios)")


if __name__ == "__main__":
    main()
