"""
Comparação detalhada: V3 requests vs DB (v2)
Cruza os dados scrapados pelo v3 com os já salvos no banco pelo v2.
"""
import json
from datetime import datetime

# Dados do DB (query Supabase atual)
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

# Dados do V3 (do JSON salvo)
with open("/tmp/v3_comparison_2026-02-04.json") as f:
    v3_data = json.load(f)

v3_detalhes = v3_data["v3_detalhes"]

def main():
    print(f"{'='*90}")
    print(f"  COMPARACAO DETALHADA: V3 (requests) vs DB (v2)")
    print(f"  Data: {v3_data['data']}")
    print(f"{'='*90}\n")

    # Index DB by key
    db_by_key = {}
    for r in DB_RESULTS:
        key = f"{r['banca']}|{r['horario']}|{r['loteria']}"
        db_by_key[key] = r

    # Index V3 by key (dedup)
    v3_by_key = {}
    v3_duplicates = 0
    for banca, detalhes in v3_detalhes.items():
        for d in detalhes:
            key = f"{banca}|{d['horario']}|{d['loteria']}"
            if key in v3_by_key:
                v3_duplicates += 1
            else:
                v3_by_key[key] = d

    # === PARTE 1: Dados que AMBOS têm (verificar se valores batem) ===
    print(f"1. VALORES COINCIDENTES (DB e V3 têm o mesmo registro)")
    print(f"{'='*90}")
    print(f"{'Banca':<22} {'Horario':<8} {'Loteria':<12} {'DB 1o':<8} {'V3 1o':<8} {'Status'}")
    print(f"{'-'*90}")

    match_count = 0
    mismatch_count = 0
    mismatch_details = []

    for key in sorted(db_by_key.keys()):
        db_r = db_by_key[key]
        v3_r = v3_by_key.get(key)

        if v3_r:
            db_p1 = db_r["premio_1"]
            v3_p1 = v3_r["premio_1"]

            if db_p1 == v3_p1:
                status = "OK"
                match_count += 1
            else:
                status = "DIFERENTE !!!"
                mismatch_count += 1
                mismatch_details.append((key, db_p1, v3_p1))

            print(f"{db_r['banca']:<22} {db_r['horario']:<8} {db_r['loteria']:<12} {db_p1:<8} {v3_p1:<8} {status}")

    print(f"\n  Coincidentes: {match_count} | Diferentes: {mismatch_count}")

    if mismatch_details:
        print(f"\n  !!! ATENCAO - VALORES DIFERENTES:")
        for key, db_p1, v3_p1 in mismatch_details:
            print(f"    {key}: DB={db_p1} vs V3={v3_p1}")

    # === PARTE 2: Dados que V3 encontrou mas DB NÃO tem ===
    print(f"\n\n2. DADOS EXTRAS NO V3 (não estão no DB)")
    print(f"{'='*90}")

    extras_v3 = []
    for key in sorted(v3_by_key.keys()):
        if key not in db_by_key:
            extras_v3.append((key, v3_by_key[key]))

    if extras_v3:
        for key, d in extras_v3:
            parts = key.split("|")
            print(f"  + {parts[0]:<22} {parts[1]:<8} {parts[2]:<12} 1o={d['premio_1']}")
        print(f"\n  Total extras no V3: {len(extras_v3)}")
    else:
        print(f"  Nenhum dado extra no V3")

    # === PARTE 3: Dados que DB tem mas V3 NÃO encontrou ===
    print(f"\n\n3. DADOS FALTANDO NO V3 (estão no DB mas V3 não encontrou)")
    print(f"{'='*90}")

    missing_v3 = []
    for key in sorted(db_by_key.keys()):
        if key not in v3_by_key:
            missing_v3.append((key, db_by_key[key]))

    if missing_v3:
        for key, d in missing_v3:
            print(f"  - {d['banca']:<22} {d['horario']:<8} {d['loteria']:<12} 1o={d['premio_1']}")
        print(f"\n  Total faltando no V3: {len(missing_v3)}")
    else:
        print(f"  Nenhum dado faltando - V3 capturou tudo que o DB tem!")

    # === PARTE 4: Problema de duplicatas ===
    print(f"\n\n4. DUPLICATAS NO V3 (mesmo horario+banca+loteria aparece mais de 1x)")
    print(f"{'='*90}")

    dup_details = {}
    for banca, detalhes in v3_detalhes.items():
        for d in detalhes:
            key = f"{banca}|{d['horario']}|{d['loteria']}"
            if key not in dup_details:
                dup_details[key] = []
            dup_details[key].append(d["premio_1"])

    dup_count = 0
    dup_conflict = 0
    for key, premios in sorted(dup_details.items()):
        if len(premios) > 1:
            dup_count += 1
            unique_premios = set(premios)
            if len(unique_premios) > 1:
                dup_conflict += 1
                print(f"  !! CONFLITO: {key} -> valores diferentes: {premios}")
            else:
                print(f"  ~  Duplicata inofensiva: {key} -> {premios[0]} (x{len(premios)})")

    print(f"\n  Total duplicatas: {dup_count} (conflitos com valores diferentes: {dup_conflict})")
    if dup_conflict == 0:
        print(f"  Todas as duplicatas têm o mesmo valor -> upsert resolve automaticamente")

    # === RESUMO FINAL ===
    print(f"\n\n{'='*90}")
    print(f"  RESUMO FINAL")
    print(f"{'='*90}")
    print(f"  DB (v2) total registros:    {len(DB_RESULTS)}")
    print(f"  V3 total registros:         {v3_data['total_v3']} (bruto) / {len(v3_by_key)} (dedupado)")
    print(f"  Valores que batem:          {match_count}/{len(db_by_key)}")
    print(f"  Valores diferentes:         {mismatch_count}")
    print(f"  Extras no V3 (novos):       {len(extras_v3)}")
    print(f"  Faltando no V3:             {len(missing_v3)}")
    print(f"  Duplicatas no parse:        {v3_duplicates}")
    print(f"  Conflitos de duplicata:     {dup_conflict}")
    print(f"  Creditos Firecrawl gastos:  0")

    # Veredito
    print(f"\n  {'='*50}")
    if mismatch_count == 0 and len(missing_v3) == 0:
        print(f"  VEREDITO: V3 APROVADO - dados idênticos ao DB")
    elif mismatch_count == 0 and len(missing_v3) > 0:
        print(f"  VEREDITO: V3 PARCIAL - faltam {len(missing_v3)} registros")
        print(f"  (pode ser que esses sorteios ainda não foram realizados)")
    elif mismatch_count > 0:
        print(f"  VEREDITO: V3 DIVERGENTE - {mismatch_count} valores diferentes")
    print(f"  {'='*50}")

if __name__ == "__main__":
    main()
