"""crear_excel_ejemplo_cap04.py — Genera matlab/cap04/cap04_datos_ejemplo.xlsx

Autor:       Dr. Aboud Barsekh-Onji · IPN — ESCA Unidad Santo Tomás
Descripción: Archivo de ejemplo (y plantilla) para la app cap04_series_datos_propios.html.
             Dos hojas:
             «Serie»       — 104 semanas de un índice de interés de búsqueda (Fecha, Interes_busqueda).
                             Es la serie SINTÉTICA del Caso A de cap04_series_texto.m (mismo flujo de
                             randn de MATLAB tras rng(42)), redondeada a 2 decimales.
             «Comentarios» — los 20 comentarios sintéticos de escucha social del script.
             También genera un segundo ejemplo, el del estudio de caso del libro (marca de electrodomésticos
             cuyo índice «salta» ~20 puntos cada año en la misma época), solo dentro de datos/cap04_ejemplo.json
             y del Excel «cap04_datos_ejemplo_caso.xlsx», para el botón «Ejemplo 2» de la app.
Uso:         conda run -n research python matlab/utils/apps/datos/crear_excel_ejemplo_cap04.py
"""
import json
import math
import re
from datetime import date, timedelta
from pathlib import Path

import numpy as np
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

AQUI = Path(__file__).resolve().parent
CARPETA = AQUI.parents[2] / "cap04"
GUINDA = "6F1D46"


def comentarios():
    texto = (AQUI.parent / "modelos" / "cap04.js").read_text(encoding="utf-8")
    bloque = texto[texto.index("const COMENTARIOS = ["):texto.index("];", texto.index("const COMENTARIOS = ["))]
    return re.findall(r"'((?:[^'\\]|\\.)*)'", bloque)


def serie_libro():
    z = json.loads((AQUI / "randn42.json").read_text())
    ini = date(2024, 9, 16)
    filas = []
    for i in range(104):
        s = i + 1
        v = 30 + 0.35 * s + 12 * math.sin(2 * math.pi * s / 52 - math.pi / 2) + 6 + 4 * z[i]
        filas.append((ini + timedelta(weeks=i), round(max(v, 0), 2)))
    return filas


def serie_caso():
    rng = np.random.RandomState(42)
    ini = date(2024, 10, 7)
    filas = []
    for i in range(104):
        s = i + 1
        v = 45 + 0.10 * s + 40 * math.sin(2 * math.pi * (s - 100) / 52) / 1.0 + rng.normal(0, 3)
        filas.append((ini + timedelta(weeks=i), round(min(max(v, 0), 100), 1)))
    return filas


def hoja(ws, titulos, filas, anchos, formato_fecha=False):
    ws.append(titulos)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor=GUINDA); c.alignment = Alignment(horizontal="center")
    for f in filas:
        ws.append(list(f))
    if formato_fecha:
        for r in ws.iter_rows(min_row=2, min_col=1, max_col=1):
            r[0].number_format = "yyyy-mm-dd"
    for col, ancho in zip("ABCD", anchos):
        ws.column_dimensions[col].width = ancho
    ws.freeze_panes = "A2"


def libro(serie, coment, ruta, titulo):
    wb = Workbook()
    ws = wb.active; ws.title = "Serie"
    hoja(ws, ["Fecha", "Interes_busqueda"], serie, (13, 18), True)
    wc = wb.create_sheet("Comentarios")
    hoja(wc, ["Comentario"], [(c,) for c in coment], (80,))
    wb.properties.creator = "Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji"; wb.properties.title = titulo
    CARPETA.mkdir(parents=True, exist_ok=True)
    wb.save(ruta); print(f"[OK] {ruta}")


def main():
    com = comentarios()
    assert len(com) == 20
    s1, s2 = serie_libro(), serie_caso()
    libro(s1, com, CARPETA / "cap04_datos_ejemplo.xlsx", "Datos de ejemplo — serie de búsqueda y escucha social (Cap. 4)")
    libro(s2, com, CARPETA / "cap04_datos_ejemplo_caso.xlsx", "Ejemplo del estudio de caso — marca de electrodomésticos (Cap. 4)")
    paq = lambda s: {"encabezados": ["Fecha", "Interes_busqueda"], "filas": [[f.isoformat(), v] for f, v in s]}
    (AQUI / "cap04_ejemplo.json").write_text(json.dumps(
        {"libro": paq(s1), "caso": paq(s2), "comentarios": com}, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] {AQUI / 'cap04_ejemplo.json'}")


if __name__ == "__main__":
    main()
