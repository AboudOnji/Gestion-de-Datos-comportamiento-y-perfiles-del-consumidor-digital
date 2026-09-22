"""construir_apps.py — Empaqueta las apps interactivas de laboratorio del libro.

Autor:       Dr. Aboud Barsekh-Onji · IPN — ESCA Unidad Santo Tomás
Descripción: Genera, junto a cada script de laboratorio, un único archivo HTML
             autocontenido (capNN_<nombre>_interactivo.html) que funciona en
             cualquier navegador, sin conexión y sin MATLAB. Inserta en línea
             la plantilla, el CSS, Plotly.js, los datos exportados de MATLAB,
             las funciones numéricas, el modelo del capítulo y su interfaz.

Uso (conda env research):
    conda run -n research python matlab/utils/apps/construir_apps.py
    # opcionales: --solo cap01 cap03   (construir solo esos capítulos)
    #             --plotly /ruta/plotly.min.js (si no se encuentra el del paquete plotly)

Para agregar un capítulo nuevo: crear modelos/capNN.js, paginas/capNN.html,
paginas/capNN_app.js y una entrada en CAPITULOS.
"""
import argparse
import re
from pathlib import Path

APPS = Path(__file__).resolve().parent
MATLAB = APPS.parent.parent

CAPITULOS = [
    {
        "id": "cap01",
        "script": "cap01/cap01_difusion_bass.m",
        "titulo": "Modelo de Bass: adopción de un canal digital",
        "titulo_corto": "Bass · Cap. 1",
        "subtitulo": "Laboratorio del Capítulo 1 · Práctica 1 de la Unidad I",
        "datos": [],
    },
    {
        "id": "cap02",
        "script": "cap02/cap02_segmentacion.m",
        "titulo": "Segmentación rígida vs. difusa del consumidor digital",
        "titulo_corto": "Segmentación · Cap. 2",
        "subtitulo": "Laboratorio del Capítulo 2 · k-means vs. fuzzy c-means",
        "datos": [("RANDN42", "randn42.json")],
    },
    {
        "id": "cap03",
        "script": "cap03/cap03_rfm_clv_ab.m",
        "titulo": "Calidad de datos, RFM, CLV y prueba A/B",
        "titulo_corto": "RFM y A/B · Cap. 3",
        "subtitulo": "Laboratorio del Capítulo 3 · Práctica 2 de la Unidad I",
        "datos": [("BASE_CAP03", "cap03_datos.json")],
    },
    {
        "id": "cap04",
        "script": "cap04/cap04_series_texto.m",
        "titulo": "Tendencia, estacionalidad y frecuencia de términos",
        "titulo_corto": "Series y texto · Cap. 4",
        "subtitulo": "Laboratorio del Capítulo 4 · Práctica 2 de la Unidad I",
        "datos": [("RANDN42", "randn42.json")],
    },
]

BLOQUES = ["PARAMETROS_EXTRA", "FIGURAS", "NOTA_COMPARAR", "FIGURAS_COMPARACION", "SECCIONES_EXTRA"]


def buscar_plotly(ruta):
    if ruta:
        return Path(ruta)
    try:
        import plotly  # noqa: F401
        return Path(plotly.__file__).parent / "package_data" / "plotly.min.js"
    except ImportError as exc:
        raise SystemExit("No se encontró plotly.min.js: instalen plotly o usen --plotly") from exc


def leer_bloques(texto):
    """Separa paginas/capNN.html en bloques '<!-- BLOQUE:NOMBRE -->'."""
    partes = re.split(r"<!-- BLOQUE:([A-Z_]+) -->", texto)
    bloques = {nombre: "" for nombre in BLOQUES}
    for nombre, contenido in zip(partes[1::2], partes[2::2]):
        if nombre not in bloques:
            raise SystemExit(f"Bloque desconocido: {nombre}")
        bloques[nombre] = contenido.strip("\n")
    return bloques


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--plotly", help="ruta a plotly.min.js")
    ap.add_argument("--solo", nargs="+", metavar="capNN", help="construir solo estos capítulos")
    args = ap.parse_args()

    plotly_js = buscar_plotly(args.plotly).read_text(encoding="utf-8")
    plantilla = (APPS / "paginas" / "plantilla.html").read_text(encoding="utf-8")
    comunes = {
        "CSS": (APPS / "comun.css").read_text(encoding="utf-8"),
        "NUMERICO": (APPS / "numerico.js").read_text(encoding="utf-8"),
        "INTERFAZ": (APPS / "interfaz.js").read_text(encoding="utf-8"),
        # evita que un "</script>" dentro de la librería cierre la etiqueta
        "PLOTLY": plotly_js.replace("</script>", "<\\/script>"),
    }

    for cap in CAPITULOS:
        if args.solo and cap["id"] not in args.solo:
            continue
        script = MATLAB / cap["script"]
        if not script.exists():
            raise SystemExit(f"No existe el script {script}")
        bloques = leer_bloques((APPS / "paginas" / f"{cap['id']}.html").read_text(encoding="utf-8"))
        datos = "\n".join(
            f"window.{var} = {(APPS / 'datos' / archivo).read_text(encoding='utf-8')};"
            for var, archivo in cap["datos"]
        )
        valores = dict(comunes)
        valores.update(bloques)
        valores.update({
            "TITULO": cap["titulo"],
            "TITULO_CORTO": cap["titulo_corto"],
            "SUBTITULO": cap["subtitulo"],
            "SCRIPT": script.name,
            "DATOS": datos,
            "MODELO": (APPS / "modelos" / f"{cap['id']}.js").read_text(encoding="utf-8"),
            "APP": (APPS / "paginas" / f"{cap['id']}_app.js").read_text(encoding="utf-8"),
        })
        # reemplazo en una sola pasada: el contenido insertado no se vuelve a procesar
        html = re.sub(r"\{\{([A-Z_]+)\}\}", lambda m: valores[m.group(1)], plantilla)
        destino = script.with_name(script.stem + "_interactivo.html")
        destino.write_text(html, encoding="utf-8")
        print(f"[OK] {destino.relative_to(MATLAB.parent)}  ({destino.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
