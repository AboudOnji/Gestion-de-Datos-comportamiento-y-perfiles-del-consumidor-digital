"""crear_excel_ejemplo_cap09.py — Genera los Excel de ejemplo de la app «datos propios» del Cap. 9

Autor:       Dr. Aboud Barsekh-Onji · IPN — ESCA Unidad Santo Tomás
Descripción: Dos libros de ejemplo (y plantilla) para cap09_seleccion_datos_propios.html:
             «cap09_datos_ejemplo.xlsx»         — la matriz de decisión del laboratorio del libro (cinco TIPOS
                                                   de herramienta × cuatro criterios) con los juicios por defecto.
                                                   Hojas «Alternativas», «Criterios» y «Juicios» (formato lista).
             «cap09_datos_ejemplo_agencia.xlsx» — seis agencias de mercadotecnia ficticias × cinco criterios, con
                                                   juicios en formato MATRIZ y una contradicción deliberada.
             También escribe datos/cap09_ejemplo.json para los botones de ejemplo de la app.
             Todos los datos son SINTÉTICOS.
Uso:         conda run -n research python matlab/utils/apps/datos/crear_excel_ejemplo_cap09.py
"""
import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

AQUI = Path(__file__).resolve().parent
CARPETA = AQUI.parents[2] / "cap09"
GUINDA = "6F1D46"

LIBRO = {
    "Alternativas": [["Herramienta", "Cobertura", "Privacidad", "Interoperabilidad", "Costo_miles_MXN"],
                     ["Analítica web básica", 6, 5, 8, 20], ["Mapas de calor y sesiones", 5, 4, 5, 60], ["Analítica de embudo", 8, 6, 7, 180],
                     ["Plataforma de datos de clientes", 9, 8, 9, 600], ["Suite todo en uno", 7, 7, 4, 350]],
    "Criterios": [["Criterio", "Tipo"], ["Cobertura", "beneficio"], ["Privacidad", "beneficio"], ["Interoperabilidad", "beneficio"], ["Costo_miles_MXN", "costo"]],
    "Juicios": [["Criterio_A", "Criterio_B", "Juicio"], ["Cobertura", "Privacidad", 2], ["Cobertura", "Interoperabilidad", 3], ["Cobertura", "Costo_miles_MXN", 3],
                ["Privacidad", "Interoperabilidad", 2], ["Privacidad", "Costo_miles_MXN", 2], ["Interoperabilidad", "Costo_miles_MXN", 1]],
}
AGENCIA = {
    "Alternativas": [["Agencia", "Experiencia_anios", "Costo_mensual_miles", "Creatividad_1a10", "Privacidad_1a10", "Respuesta_horas"],
                     ["Agencia Aurora", 12, 85, 9, 6, 24], ["Estudio Brújula", 5, 40, 7, 8, 12], ["Grupo Cénit", 20, 150, 8, 9, 48],
                     ["Digital Delta", 8, 60, 6, 7, 8], ["Impulso Estratégico", 15, 110, 9, 5, 36], ["Taller Zafiro", 3, 25, 8, 6, 6]],
    "Criterios": [["Criterio", "Tipo"], ["Experiencia_anios", "beneficio"], ["Costo_mensual_miles", "costo"], ["Creatividad_1a10", "beneficio"],
                  ["Privacidad_1a10", "beneficio"], ["Respuesta_horas", "costo"]],
    # matriz de comparaciones (fila frente a columna); solo el triángulo superior cuenta, el inferior son sus recíprocos.
    # Con una contradicción moderada: Costo > Creatividad > Experiencia, pero Experiencia > Costo.
    "Juicios": [["Criterio", "Experiencia_anios", "Costo_mensual_miles", "Creatividad_1a10", "Privacidad_1a10", "Respuesta_horas"],
                ["Experiencia_anios", 1, 3, 1, 1, 2], ["Costo_mensual_miles", 0.333, 1, 3, 2, 2], ["Creatividad_1a10", 1, 0.333, 1, 2, 3],
                ["Privacidad_1a10", 1, 0.5, 0.5, 1, 2], ["Respuesta_horas", 0.5, 0.5, 0.333, 0.5, 1]],
}


def estilo(ws, anchos):
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor=GUINDA); c.alignment = Alignment(horizontal="center")
    for col, ancho in zip("ABCDEFG", anchos):
        ws.column_dimensions[col].width = ancho
    ws.freeze_panes = "A2"


def libro(datos, ruta, titulo):
    wb = Workbook()
    for k, nombre in enumerate(["Alternativas", "Criterios", "Juicios"]):
        ws = wb.active if k == 0 else wb.create_sheet(nombre)
        ws.title = nombre
        for f in datos[nombre]:
            ws.append(f)
        estilo(ws, (32, 18, 22, 22, 22, 18))
    wb.properties.creator = "Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji"; wb.properties.title = titulo
    CARPETA.mkdir(parents=True, exist_ok=True)
    wb.save(ruta); print(f"[OK] {ruta}")


def main():
    libro(LIBRO, CARPETA / "cap09_datos_ejemplo.xlsx", "Datos de ejemplo — herramientas de análisis del laboratorio (Cap. 9)")
    libro(AGENCIA, CARPETA / "cap09_datos_ejemplo_agencia.xlsx", "Datos de ejemplo — agencias de mercadotecnia ficticias (Cap. 9)")
    (AQUI / "cap09_ejemplo.json").write_text(json.dumps({"libro": LIBRO, "agencia": AGENCIA}, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] {AQUI / 'cap09_ejemplo.json'}")


if __name__ == "__main__":
    main()
