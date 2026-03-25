"""
Comparação v2: Verifica se com last-wins (como o upsert faz) os valores batem.
"""
import json

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

with open("/tmp/v3_comparison_2026-02-04.json") as f:
    v3_data = json.load(f)

v3_detalhes = v3_data["v3_detalhes"]

# Index DB
db_by_key = {}
for r in DB_RESULTS:
    key = f"{r['banca']}|{r['horario']}|{r['loteria']}"
    db_by_key[key] = r

# Index V3: FIRST-wins vs LAST-wins
v3_first = {}
v3_last = {}
v3_all = {}

for banca, detalhes in v3_detalhes.items():
    for d in detalhes:
        key = f"{banca}|{d['horario']}|{d['loteria']}"
        if key not in v3_first:
            v3_first[key] = d
        v3_last[key] = d  # sempre sobrescreve = last wins
        if key not in v3_all:
            v3_all[key] = []
        v3_all[key].append(d["premio_1"])

print(f"{'='*100}")
print(f"  COMPARACAO: first-wins vs last-wins vs DB")
print(f"{'='*100}")
print(f"{'Key':<45} {'DB':<8} {'First':<8} {'Last':<8} {'Todas encontradas'}")
print(f"{'-'*100}")

first_match = 0
last_match = 0
total = 0

for key in sorted(db_by_key.keys()):
    db_p1 = db_by_key[key]["premio_1"]
    first_p1 = v3_first.get(key, {}).get("premio_1", "---")
    last_p1 = v3_last.get(key, {}).get("premio_1", "---")
    all_vals = v3_all.get(key, [])

    f_ok = "OK" if first_p1 == db_p1 else "XX"
    l_ok = "OK" if last_p1 == db_p1 else "XX"

    if first_p1 == db_p1:
        first_match += 1
    if last_p1 == db_p1:
        last_match += 1
    total += 1

    # Só mostra as que têm conflito
    if len(set(all_vals)) > 1 or first_p1 != db_p1 or last_p1 != db_p1:
        print(f"{key:<45} {db_p1:<8} {first_p1:<8}{f_ok:<4} {last_p1:<8}{l_ok:<4} {all_vals}")

print(f"\n{'='*100}")
print(f"  RESULTADO:")
print(f"  Total registros no DB:  {total}")
print(f"  First-wins match:       {first_match}/{total} ({100*first_match//total}%)")
print(f"  Last-wins match:        {last_match}/{total} ({100*last_match//total}%)")
print(f"{'='*100}")

if last_match == total:
    print(f"\n  VEREDITO: Com last-wins (upsert), V3 bate 100% com o DB!")
elif last_match > first_match:
    print(f"\n  VEREDITO: Last-wins é melhor ({last_match} vs {first_match})")
    print(f"  Divergências restantes:")
    for key in sorted(db_by_key.keys()):
        db_p1 = db_by_key[key]["premio_1"]
        last_p1 = v3_last.get(key, {}).get("premio_1", "---")
        if last_p1 != db_p1:
            all_vals = v3_all.get(key, [])
            print(f"    {key}: DB={db_p1}, last={last_p1}, all={all_vals}")
else:
    print(f"\n  VEREDITO: Divergências persistem com ambas estratégias")
