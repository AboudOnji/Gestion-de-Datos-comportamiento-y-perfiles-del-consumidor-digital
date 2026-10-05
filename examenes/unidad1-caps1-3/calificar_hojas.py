#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Califica las hojas de respuestas escaneadas del examen de la Unidad I (Caps. 1 a 3).

Uso:
    conda run -n research python calificar_hojas.py RUTA [--salida resultados] [--dpi 150] [--todas]
    RUTA: un PDF/imagen o una carpeta con PDFs/imágenes (cada página = una hoja de alumno).

Qué hace con cada hoja:
  1. Localiza los 4 cuadros negros de registro (el más grande es la esquina superior izquierda;
     así corrige giros, inclinación y escaneos al revés) y calcula la transformación a la hoja ideal.
  2. Lee la casilla de VERSIÓN (A/B/C) y, para cada reactivo, el círculo más oscuro.
  3. Aplica la clave de la versión marcada (claves.json) y calcula aciertos y calificación sobre 10.
  4. Marca incidencias para revisión humana: versión sin marcar o doble, reactivos en blanco, con
     marca doble o marca muy tenue, y hoja sin marcas de registro.
Salidas (carpeta --salida): resultados.csv, resultados.xlsx, recortes_nombre/ (nombre, grupo y matrícula
de cada hoja, para capturarlos o leerlos) y revision/ (imagen corregida con los círculos coloreados:
verde = acierto, rojo = error, azul = en blanco, naranja = doble marca; solo las hojas con incidencias,
o todas con --todas).
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

AQUI = Path(__file__).resolve().parent
LAYOUT = json.loads((AQUI / "hoja_layout.json").read_text(encoding="utf-8"))
CLAVES = json.loads((AQUI / "claves.json").read_text(encoding="utf-8"))
N = len(CLAVES["A"])
UMBRAL_MARCA = 0.30       # oscuridad media del interior del círculo a partir de la cual se considera marcado
UMBRAL_TENUE = 0.18       # entre este valor y el anterior: marca dudosa
MARGEN = 0.12             # diferencia mínima entre la marca más oscura y la siguiente


# ------------------------------------------------------------------ lectura de páginas
def paginas(ruta, dpi):
    """Genera (nombre, imagen en grises 0-255) por cada página/imagen."""
    ruta = Path(ruta)
    archivos = sorted(p for p in ruta.rglob("*") if p.suffix.lower() in (".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff")) if ruta.is_dir() else [ruta]
    for a in archivos:
        if a.suffix.lower() == ".pdf":
            with tempfile.TemporaryDirectory() as tmp:
                subprocess.run(["pdftoppm", "-r", str(dpi), "-gray", "-png", str(a), str(Path(tmp) / "p")], check=True)
                for i, f in enumerate(sorted(Path(tmp).glob("p*.png")), 1):
                    yield f"{a.name} p.{i}", np.array(Image.open(f).convert("L"), dtype=np.float32)
        else:
            yield a.name, np.array(Image.open(a).convert("L"), dtype=np.float32)


# ------------------------------------------------------------------ marcas de registro
def hallar_fiduciales(g):
    """Devuelve los 4 centros (x, y) en orden TL, TR, BR, BL (en el sentido de las manecillas, desde el
    cuadro más grande), o None si no se encuentran."""
    papel = np.percentile(g, 90)
    oscuro = g < papel * 0.45
    lab, n = ndimage.label(oscuro)
    if n == 0:
        return None
    objs = ndimage.find_objects(lab)
    h, w = g.shape
    cand = []
    for i, sl in enumerate(objs, 1):
        alto, ancho = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        area = (lab[sl] == i).sum()
        if alto < 0.012 * h or ancho < 0.012 * w or alto > 0.08 * h or ancho > 0.08 * w:
            continue
        if not 0.75 < ancho / alto < 1.33 or area / (alto * ancho) < 0.85:
            continue
        cy, cx = ndimage.center_of_mass(lab == i) if area < 4e4 else ((sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2)
        cand.append((area, cx, cy))
    if len(cand) < 4:
        return None
    # un cuadro por cuadrante de la imagen (el de mayor área)
    cuad = {}
    for area, cx, cy in cand:
        k = (cx > w / 2, cy > h / 2)
        if k not in cuad or area > cuad[k][0]:
            cuad[k] = (area, cx, cy)
    if len(cuad) < 4:
        return None
    pts = list(cuad.values())
    ancla = max(range(4), key=lambda i: pts[i][0])
    cx0 = np.mean([p[1] for p in pts]); cy0 = np.mean([p[2] for p in pts])
    ang = lambda p: np.arctan2(p[2] - cy0, p[1] - cx0)       # sentido horario en coordenadas de imagen (y hacia abajo)
    base = ang(pts[ancla])
    orden = sorted(range(4), key=lambda i: (ang(pts[i]) - base) % (2 * np.pi))
    return [(pts[i][1], pts[i][2]) for i in orden]


def homografia(origen, destino):
    A = []
    for (x, y), (u, v) in zip(origen, destino):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y, -u], [0, 0, 0, x, y, 1, -v * x, -v * y, -v]]
    _, _, vt = np.linalg.svd(np.array(A, dtype=float))
    return vt[-1].reshape(3, 3)


def aplicar(H, x, y):
    p = H @ np.array([x, y, 1.0])
    return p[0] / p[2], p[1] / p[2]


def oscuridad(g, H, x, y, r_cm, papel):
    """Oscuridad media (0 = papel, 1 = negro) del disco interior (70 % del radio) del círculo."""
    cx, cy = aplicar(H, x, y)
    px_cm = np.hypot(*(np.array(aplicar(H, x + 1, y)) - np.array([cx, cy])))
    r = max(2.0, 0.70 * r_cm * px_cm)
    y0, y1, x0, x1 = int(cy - r - 1), int(cy + r + 2), int(cx - r - 1), int(cx + r + 2)
    if y0 < 0 or x0 < 0 or y1 > g.shape[0] or x1 > g.shape[1]:
        return float("nan")
    yy, xx = np.mgrid[y0:y1, x0:x1]
    m = (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r
    return float(np.clip(1 - g[y0:y1, x0:x1][m].mean() / papel, 0, 1))


# ------------------------------------------------------------------ calificación de una hoja
def leer_hoja(g):
    res = {"incidencias": [], "version": None, "respuestas": "", "detalle": {}}
    fid = hallar_fiduciales(g)
    if fid is None:
        res["incidencias"].append("No se hallaron las 4 marcas de registro (hoja incompleta, recortada o muy borrosa)")
        return res, None, None
    f = LAYOUT["fiduciales"]
    destino = [f["TL"][:2], f["TR"][:2], f["BR"][:2], f["BL"][:2]]
    H = homografia(destino, fid)                                  # cm de la hoja ideal -> píxeles del escaneo
    papel = float(np.percentile(g, 90))
    r_cm = LAYOUT["radio_cm"]

    vers = {k: oscuridad(g, H, v["x"], v["y"], r_cm, papel) for k, v in LAYOUT["version"].items()}
    marc = [k for k, s in vers.items() if s >= UMBRAL_MARCA]
    if len(marc) == 1:
        res["version"] = marc[0]
    else:
        res["incidencias"].append("Versión sin marcar" if not marc else "Versión con marca doble (" + "".join(marc) + ")")
    res["detalle"]["version_oscuridad"] = vers

    por_q = {}
    for p in LAYOUT["preguntas"]:
        por_q.setdefault(p["q"], {})[p["letra"]] = oscuridad(g, H, p["x"], p["y"], r_cm, papel)
    letras, estados = "", {}
    for q in range(1, N + 1):
        s = por_q[q]
        orden = sorted(s, key=lambda k: -s[k])
        top, seg = s[orden[0]], s[orden[1]]
        if np.isnan(top):
            letras += "?"; estados[q] = "blanco"
        elif top >= UMBRAL_MARCA and seg >= UMBRAL_MARCA and top - seg < MARGEN:
            letras += "*"; estados[q] = "doble"
        elif top >= UMBRAL_MARCA:
            letras += orden[0]; estados[q] = "ok"
        elif top >= UMBRAL_TENUE and top - seg >= 0.05:
            letras += orden[0]; estados[q] = "tenue"
        else:
            letras += "-"; estados[q] = "blanco"
    res["respuestas"] = letras
    res["detalle"]["estados"] = estados
    res["detalle"]["oscuridad"] = por_q
    for q, e in estados.items():
        if e == "blanco":
            res["incidencias"].append(f"{q}: en blanco")
        elif e == "doble":
            res["incidencias"].append(f"{q}: marca doble")
        elif e == "tenue":
            res["incidencias"].append(f"{q}: marca tenue (leída como {letras[q - 1]})")
    return res, H, papel


def calificar(res):
    v = res["version"]
    if v is None:
        return None, None
    clave = CLAVES[v]
    ac = sum(1 for a, c in zip(res["respuestas"], clave) if a == c)
    return ac, round(10 * ac / N, 2)


# ------------------------------------------------------------------ salidas gráficas
def recorte_nombre(g, H, ruta, dpi_salida=110):
    x0, y0, x1, y1 = LAYOUT["campos_nombre_cm"]
    cm = 2.54
    w, h = int((x1 - x0) / cm * dpi_salida), int((y1 - y0) / cm * dpi_salida)
    # remuestreo por homografía inversa (vecino más cercano)
    xs = x0 + (np.arange(w) + 0.5) / w * (x1 - x0)
    ys = y0 + (np.arange(h) + 0.5) / h * (y1 - y0)
    X, Y = np.meshgrid(xs, ys)
    P = H @ np.stack([X.ravel(), Y.ravel(), np.ones(X.size)])
    u = np.clip((P[0] / P[2]).round().astype(int), 0, g.shape[1] - 1)
    v = np.clip((P[1] / P[2]).round().astype(int), 0, g.shape[0] - 1)
    Image.fromarray(g[v, u].reshape(h, w).astype(np.uint8)).save(ruta)


def imagen_revision(g, H, res, ruta, escala_dpi=100):
    cm = 2.54
    W, Hh = LAYOUT["pagina_cm"]
    w, h = int(W / cm * escala_dpi), int(Hh / cm * escala_dpi)
    xs = (np.arange(w) + 0.5) / w * W
    ys = (np.arange(h) + 0.5) / h * Hh
    X, Y = np.meshgrid(xs, ys)
    P = H @ np.stack([X.ravel(), Y.ravel(), np.ones(X.size)])
    u = np.clip((P[0] / P[2]).round().astype(int), 0, g.shape[1] - 1)
    v = np.clip((P[1] / P[2]).round().astype(int), 0, g.shape[0] - 1)
    img = Image.fromarray(g[v, u].reshape(h, w).astype(np.uint8)).convert("RGB")
    d = ImageDraw.Draw(img)
    clave = CLAVES.get(res["version"], "")
    est = res["detalle"].get("estados", {})
    rad = LAYOUT["radio_cm"] / cm * escala_dpi
    for p in LAYOUT["preguntas"]:
        q, L = p["q"], p["letra"]
        cx, cy = p["x"] / cm * escala_dpi, p["y"] / cm * escala_dpi
        marcada = res["respuestas"][q - 1] == L
        correcta = bool(clave) and clave[q - 1] == L
        e = est.get(q)
        if e == "doble" and res["detalle"]["oscuridad"][q][L] >= UMBRAL_MARCA:
            col = (255, 140, 0)
        elif marcada:
            col = (0, 160, 0) if correcta else (220, 0, 0)
        elif correcta and e in ("blanco",):
            col = (0, 90, 220)
        else:
            continue
        d.ellipse([cx - rad * 1.45, cy - rad * 1.45, cx + rad * 1.45, cy + rad * 1.45], outline=col, width=3)
    img.save(ruta)


# ------------------------------------------------------------------ programa principal
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ruta", help="PDF/imagen o carpeta con los escaneos")
    ap.add_argument("--salida", default="resultados", help="carpeta de salida (default: resultados)")
    ap.add_argument("--dpi", type=int, default=150, help="resolución al leer PDFs (default 150)")
    ap.add_argument("--todas", action="store_true", help="guardar imagen de revisión de TODAS las hojas")
    a = ap.parse_args()
    salida = Path(a.salida); (salida / "recortes_nombre").mkdir(parents=True, exist_ok=True); (salida / "revision").mkdir(exist_ok=True)

    filas = []
    for k, (nombre, g) in enumerate(paginas(a.ruta, a.dpi), 1):
        res, H, papel = leer_hoja(g)
        ac, cal = calificar(res)
        base = f"hoja_{k:03d}"
        if H is not None:
            recorte_nombre(g, H, salida / "recortes_nombre" / f"{base}.png")
            if res["incidencias"] or a.todas:
                imagen_revision(g, H, res, salida / "revision" / f"{base}.png")
        filas.append({"hoja": base, "archivo": nombre, "versión": res["version"] or "", "aciertos": ac if ac is not None else "",
                      "calificación": cal if cal is not None else "", "respuestas": res["respuestas"],
                      "incidencias": "; ".join(res["incidencias"]), "nombre": "", "grupo": "", "matrícula": ""})
        print(f"{base}  {nombre}: versión {res['version'] or '?'}  aciertos {ac if ac is not None else '?'}  "
              f"{'⚠ ' + str(len(res['incidencias'])) + ' incidencia(s)' if res['incidencias'] else 'sin incidencias'}")
    if not filas:
        sys.exit("No se encontraron páginas para leer.")
    import pandas as pd
    df = pd.DataFrame(filas)
    df.to_csv(salida / "resultados.csv", index=False, encoding="utf-8-sig")
    df.to_excel(salida / "resultados.xlsx", index=False)
    print(f"\n{len(df)} hoja(s). Resultados: {salida / 'resultados.csv'} y .xlsx · nombres en {salida / 'recortes_nombre'}")
    con = (df["incidencias"] != "").sum()
    if con:
        print(f"⚠ {con} hoja(s) con incidencias: revisar las imágenes de {salida / 'revision'} antes de dar la calificación final.")


if __name__ == "__main__":
    main()
