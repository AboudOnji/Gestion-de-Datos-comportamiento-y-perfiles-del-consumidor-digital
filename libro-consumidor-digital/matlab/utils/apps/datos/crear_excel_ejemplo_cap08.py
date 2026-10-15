"""crear_excel_ejemplo_cap08.py — Genera los Excel de ejemplo de la app «datos propios» del Cap. 8

Autor:       Dr. Aboud Barsekh-Onji · IPN — ESCA Unidad Santo Tomás
Descripción: Dos libros de ejemplo (y plantilla) para cap08_red_datos_propios.html:
             «cap08_datos_ejemplo.xlsx»        — la red SINTÉTICA de 60 personas del laboratorio del libro
                                                  (valores por defecto de cap08_red_influencia.m), con las
                                                  hojas «Conexiones» (Persona_A, Persona_B) y «Personas»
                                                  (Persona, Grupo). Se reconstruye con el mismo flujo de rand
                                                  de MATLAB (datos/rand42.json) y el mismo algoritmo.
             «cap08_datos_ejemplo_club.xlsx»   — red ficticia de 36 personas de un club de aficionados, con una
                                                  creadora muy conectada en un grupo y un puente entre grupos.
             También escribe datos/cap08_ejemplo.json para los botones de ejemplo de la app.
             Las personas se identifican con seudónimos (P01, P02…): no uses nombres reales.
Uso:         conda run -n research python matlab/utils/apps/datos/crear_excel_ejemplo_cap08.py
"""
import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

AQUI = Path(__file__).resolve().parent
CARPETA = AQUI.parents[2] / "cap08"
GUINDA = "6F1D46"


def red_del_libro(n=60, k=3, p_dentro=0.20, p_entre=0.01):
    u = json.loads((AQUI / "rand42.json").read_text())
    grupo = [int(-(-(i + 1) * k // n)) for i in range(n)]  # ceil((i+1)*k/n)
    A = [[False] * n for _ in range(n)]
    for i in range(n - 1):
        if grupo[i] == grupo[i + 1]:
            A[i][i + 1] = True
    for g in range(1, k):
        ultimo = max(i for i in range(n) if grupo[i] == g)
        A[ultimo][ultimo + 1] = True
    c = 0
    for j in range(1, n):
        for i in range(j):
            p = p_dentro if grupo[i] == grupo[j] else p_entre
            if u[c] < p:
                A[i][j] = True
            c += 1
    aristas = [(i, j) for i in range(n) for j in range(i + 1, n) if A[i][j] or A[j][i]]
    return grupo, aristas


def red_del_club():
    n = 36
    nombres = [f"C{i + 1:02d}" for i in range(n)]
    grupo = [1] * 14 + [2] * 12 + [3] * 10
    E = set()
    # grupo 1: una creadora (C01) conectada con casi todas; pocas conexiones entre seguidoras
    for j in range(1, 14):
        E.add((0, j))
    for a, b in [(1, 2), (3, 4), (5, 6), (7, 8), (9, 10), (11, 12), (2, 13)]:
        E.add((a, b))
    # grupo 2: grupo denso (aficionados entre sí)
    g2 = list(range(14, 26))
    for a in g2:
        for b in g2:
            if a < b and (a * 7 + b * 3) % 5 in (0, 1, 2):
                E.add((a, b))
    for a in range(14, 25):
        E.add((a, a + 1))
    # grupo 3: cadena con algunos atajos
    g3 = list(range(26, 36))
    for a in range(26, 35):
        E.add((a, a + 1))
    for a, b in [(26, 28), (29, 31), (30, 33), (32, 35), (27, 30)]:
        E.add((a, b))
    # puentes: C15 une al grupo 1 con el 2; C27 une al 2 con el 3
    for a, b in [(13, 14), (3, 15), (25, 26), (20, 28)]:
        E.add((a, b))
    return nombres, grupo, sorted(E)


def estilo(ws, anchos):
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor=GUINDA); c.alignment = Alignment(horizontal="center")
    for col, ancho in zip("ABC", anchos):
        ws.column_dimensions[col].width = ancho
    ws.freeze_panes = "A2"


def libro(nombres, grupos, aristas, ruta, titulo):
    wb = Workbook()
    ws = wb.active; ws.title = "Conexiones"
    ws.append(["Persona_A", "Persona_B"])
    for i, j in aristas:
        ws.append([nombres[i], nombres[j]])
    estilo(ws, (14, 14))
    wp = wb.create_sheet("Personas")
    wp.append(["Persona", "Grupo"])
    for nm, g in zip(nombres, grupos):
        wp.append([nm, g])
    estilo(wp, (14, 10))
    wb.properties.creator = "Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji"; wb.properties.title = titulo
    CARPETA.mkdir(parents=True, exist_ok=True)
    wb.save(ruta); print(f"[OK] {ruta}")
    return {"Conexiones": [["Persona_A", "Persona_B"]] + [[nombres[i], nombres[j]] for i, j in aristas],
            "Personas": [["Persona", "Grupo"]] + [[nm, g] for nm, g in zip(nombres, grupos)]}


def main():
    grupo, aristas = red_del_libro()
    nombres1 = [f"P{i + 1:02d}" for i in range(60)]
    j1 = libro(nombres1, grupo, aristas, CARPETA / "cap08_datos_ejemplo.xlsx", "Datos de ejemplo — red sintética del libro (Cap. 8)")
    nombres2, grupo2, aristas2 = red_del_club()
    j2 = libro(nombres2, grupo2, aristas2, CARPETA / "cap08_datos_ejemplo_club.xlsx", "Datos de ejemplo — club ficticio de aficionados (Cap. 8)")
    (AQUI / "cap08_ejemplo.json").write_text(json.dumps({"libro": j1, "club": j2}, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] {AQUI / 'cap08_ejemplo.json'}  (red del libro: {len(aristas)} conexiones; club: {len(aristas2)})")


if __name__ == "__main__":
    main()
