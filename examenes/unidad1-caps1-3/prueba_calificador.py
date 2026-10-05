# -*- coding: utf-8 -*-
"""Prueba del calificador con escaneos SIMULADOS: dibuja respuestas sobre hoja_respuestas.pdf,
las degrada como un escáner (giro, desplazamiento, ruido, desenfoque, hoja al revés) y comprueba que
calificar_hojas.py recupera versión, respuestas y calificación, y que señala las incidencias.
Uso: conda run -n research python prueba_calificador.py"""
import json, random, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

AQUI = Path(__file__).resolve().parent
LAY = json.loads((AQUI / "hoja_layout.json").read_text()); CL = json.loads((AQUI / "claves.json").read_text())
DPI = 150; PX = DPI / 2.54
tmp = Path(tempfile.mkdtemp())
subprocess.run(["pdftoppm", "-r", str(DPI), "-gray", "-png", str(AQUI / "hoja_respuestas.pdf"), str(tmp / "base")], check=True)
base = Image.open(next(tmp.glob("base*.png"))).convert("L")
rng = random.Random(7)


def hoja(version, resp, extra_marcas=(), girar=0.0, desp=(0, 0), al_reves=False, sin_version=False, tenue=False):
    im = base.copy(); d = ImageDraw.Draw(im)
    tono = 90 if tenue else 20
    def rell(x, y, r=0.27):
        d.ellipse([x * PX - r * PX, y * PX - r * PX, x * PX + r * PX, y * PX + r * PX], fill=tono)
    if not sin_version:
        v = LAY["version"][version]; rell(v["x"], v["y"])
    pos = {(p["q"], p["letra"]): p for p in LAY["preguntas"]}
    for q, L in enumerate(resp, 1):
        if L in "abc":
            rell(pos[(q, L)]["x"], pos[(q, L)]["y"])
    for q, L in extra_marcas:
        rell(pos[(q, L)]["x"], pos[(q, L)]["y"])
    a = np.array(im, dtype=np.float32)
    im = Image.fromarray(a.astype(np.uint8)).rotate(girar, resample=Image.BICUBIC, fillcolor=255, translate=desp)
    if al_reves: im = im.rotate(180)
    im = im.filter(ImageFilter.GaussianBlur(0.8))
    a = np.array(im, dtype=np.float32) + np.random.RandomState(rng.randint(0, 99999)).normal(0, 6, im.size[::-1])
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


casos, esperado = [], []
def alumno(version, fallos, **kw):
    clave = CL[version]; resp = list(clave); malas = rng.sample(range(30), fallos)
    for q in malas: resp[q] = rng.choice([x for x in "abc" if x != clave[q]])
    return resp, kw
spec = [("A", 3, dict(girar=0.6, desp=(10, -8))), ("B", 0, dict(girar=-0.8, desp=(-14, 6))), ("C", 12, dict(girar=1.2, desp=(8, 12))),
        ("A", 6, dict(al_reves=True, girar=0.4)), ("B", 30, dict(girar=0.2)), ("C", 5, dict(tenue=True, girar=-0.5))]
for v, f, kw in spec:
    resp, kw = alumno(v, f, **kw); casos.append(hoja(v, resp, **kw))
    esperado.append((v, "".join(resp), sum(a == b for a, b in zip(resp, CL[v]))))
# casos con incidencias: blanco, doble marca, versión sin marcar
resp, kw = alumno("A", 2); resp[4] = "-"; resp[10] = "-"; casos.append(hoja("A", resp, extra_marcas=[(20, "a"), (20, "b")], girar=0.3))
esp_blanco = sum(a == b for i, (a, b) in enumerate(zip(resp, CL["A"])) if i != 19); esperado.append(("A", None, esp_blanco))
resp, kw = alumno("B", 1); casos.append(hoja("B", resp, sin_version=True)); esperado.append((None, None, None))
carp = tmp / "escaneos"; carp.mkdir(); casos[0].save(carp / "lote.pdf", save_all=True, append_images=casos[1:], resolution=DPI)
out = tmp / "salida"
r = subprocess.run([sys.executable, str(AQUI / "calificar_hojas.py"), str(carp), "--salida", str(out)], capture_output=True, text=True)
print(r.stdout[-1800:], r.stderr[-800:]); import shutil; shutil.copytree(out, Path("/tmp/prueba_salida"), dirs_exist_ok=True)
import pandas as pd
df = pd.read_csv(out / "resultados.csv", dtype=str).fillna("")
fallas = 0
for i, (v, resp, ac) in enumerate(esperado):
    f = df.iloc[i]
    if v is None:
        ok = f["versión"] == "" and "Versión sin marcar" in f["incidencias"]
    else:
        ok = f["versión"] == v and f["aciertos"] == str(ac) and (resp is None or f["respuestas"] == resp)
    fallas += not ok
    print(("[OK]    " if ok else "[FALLO] ") + f"hoja {i+1}: esperado versión {v} aciertos {ac} · leído {f['versión']!r} {f['aciertos']!r} · {f['incidencias'][:70]}")
print("incidencia doble marca detectada:", "20: marca doble" in df.iloc[6]["incidencias"], "| blancos:", "5: en blanco" in df.iloc[6]["incidencias"])
print(f"\n{len(esperado) - fallas} de {len(esperado)} hojas correctas")
