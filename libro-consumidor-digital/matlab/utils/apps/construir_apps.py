"""construir_apps.py — Empaqueta las apps interactivas de laboratorio del libro.

Autor:       Dr. Aboud Barsekh-Onji · IPN — ESCA Unidad Santo Tomás
Descripción: Genera, junto a cada script de laboratorio, un único archivo HTML
             autocontenido (capNN_<nombre>_interactivo.html) que funciona en
             cualquier navegador, sin conexión y sin MATLAB. Inserta en línea
             la plantilla, el CSS, Plotly.js, los datos exportados de MATLAB,
             las funciones numéricas, el modelo del capítulo y su interfaz.

Uso (conda env research):
    conda run -n research python matlab/utils/apps/construir_apps.py
    # opcionales: --solo cap01 cap02_datos   (construir solo esas apps)
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
        "ui": ["cap02_didactico"],
    },
    {
        # App para segmentar datos propios (Excel/CSV) con el análisis del Cap. 2
        "id": "cap02_datos",
        "modelos": ["cap02", "cap02_datos"],
        "script": "cap02/cap02_segmentacion.m",
        "salida": "cap02_segmentacion_datos_propios.html",
        "titulo": "Segmentación con datos propios y arquetipos definidos",
        "titulo_corto": "Datos propios · Cap. 2",
        "subtitulo": "Extensión del laboratorio del Capítulo 2 · k-means vs. fuzzy c-means",
        "insignia": "Datos propios",
        "pie": ("Esta página funciona en cualquier navegador, sin conexión y sin MATLAB. Aplica a sus datos el mismo "
                "análisis de <code>cap02_segmentacion.m</code> (z-score, k-means y fuzzy c-means con m = 2), partiendo de los arquetipos que ustedes definen. "
                "<b>Sus datos no salen de esta computadora</b>: se procesan en el navegador y no se envían a ningún lado. "
                "Lectura de Excel con SheetJS (Apache-2.0)."),
        "nota_parametros": ("Suban el Excel con los datos de sus clientes y definan aquí sus arquetipos. "
                            "Al cambiar cualquier valor, los resultados se recalculan solos."),
        "vendor": ["xlsx.full.min.js"],
        "datos": [("EJEMPLO_CAP02", "cap02_ejemplo.json")],
        "ui": ["cap02_didactico"],
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
        # App para analizar datos propios (Excel/CSV) con RFM, CLV y prueba A/B del Cap. 3
        "id": "cap03_datos",
        "modelos": ["cap02_datos", "cap03", "cap03_datos"],
        "script": "cap03/cap03_rfm_clv_ab.m",
        "salida": "cap03_rfm_datos_propios.html",
        "titulo": "RFM, CLV y prueba A/B con datos propios",
        "titulo_corto": "Datos propios · Cap. 3",
        "subtitulo": "Extensión del laboratorio del Capítulo 3 · calidad de datos, RFM, CLV y prueba A/B",
        "insignia": "Datos propios",
        "pie": ("Esta página funciona en cualquier navegador, sin conexión y sin MATLAB. Aplica a sus datos el mismo "
                "análisis de <code>cap03_rfm_clv_ab.m</code> (imputación por mediana, atípicos 1.5×RIC, quintiles RFM, CLV y test z de dos proporciones). "
                "<b>Sus datos no salen de esta computadora</b>: se procesan en el navegador y no se envían a ningún lado. "
                "Lectura de Excel con SheetJS (Apache-2.0)."),
        "nota_parametros": ("Suban el Excel con los datos de sus clientes (y, si lo tienen, su experimento A/B) y ajusten los supuestos. "
                            "Al cambiar cualquier valor, los resultados se recalculan solos."),
        "vendor": ["xlsx.full.min.js"],
        "datos": [("EJEMPLO_CAP03", "cap03_ejemplo.json")],
    },
    {
        "id": "cap04",
        "script": "cap04/cap04_series_texto.m",
        "titulo": "Tendencia, estacionalidad y frecuencia de términos",
        "titulo_corto": "Series y texto · Cap. 4",
        "subtitulo": "Laboratorio del Capítulo 4 · Práctica 2 de la Unidad I",
        "datos": [("RANDN42", "randn42.json")],
    },
    {
        # App para analizar series de tiempo y comentarios propios (Excel/CSV) con el análisis del Cap. 4
        "id": "cap04_datos",
        "modelos": ["cap02_datos", "cap04", "cap04_datos"],
        "script": "cap04/cap04_series_texto.m",
        "salida": "cap04_series_datos_propios.html",
        "titulo": "Serie de tiempo y escucha social con datos propios",
        "titulo_corto": "Datos propios · Cap. 4",
        "subtitulo": "Extensión del laboratorio del Capítulo 4 · tendencia, estacionalidad y frecuencia de términos",
        "insignia": "Datos propios",
        "pie": ("Esta página funciona en cualquier navegador, sin conexión y sin MATLAB. Aplica a sus datos el mismo "
                "análisis de <code>cap04_series_texto.m</code> (tendencia con promedio móvil de un ciclo completo, estacionalidad = serie − tendencia y bolsa de palabras). "
                "<b>Sus datos no salen de esta computadora</b>: se procesan en el navegador y no se envían a ningún lado. "
                "Lectura de Excel con SheetJS (Apache-2.0)."),
        "nota_parametros": ("Suban el Excel con su serie de tiempo (y, si los tienen, comentarios de escucha social) o prueben los ejemplos. "
                            "Al cambiar cualquier valor, los resultados se recalculan solos."),
        "vendor": ["xlsx.full.min.js"],
        "datos": [("EJEMPLO_CAP04", "cap04_ejemplo.json")],
    },
    {
        "id": "cap06",
        "script": "cap06/cap06_alternativas.m",
        "titulo": "Evaluación de alternativas: tres reglas de decisión",
        "titulo_corto": "Alternativas · Cap. 5",
        "subtitulo": "Laboratorio del Capítulo 5 · Práctica «Recorrido del consumidor digital»",
        "datos": [],
    },
    {
        "id": "cap07",
        "script": "cap07/cap07_journey_markov.m",
        "titulo": "El recorrido del consumidor como cadena de Markov",
        "titulo_corto": "Journey de Markov · Cap. 6",
        "subtitulo": "Laboratorio del Capítulo 6 · Práctica «Recorrido del consumidor digital»",
        "datos": [],
    },
    {
        "id": "cap08",
        "script": "cap08/cap08_red_influencia.m",
        "titulo": "Influenciadores en una red social simulada",
        "titulo_corto": "Red social · Cap. 7",
        "subtitulo": "Laboratorio del Capítulo 7 · Práctica «Recorrido del consumidor digital»",
        "datos": [("RAND42", "rand42.json")],
    },
    {
        "id": "cap09",
        "script": "cap09/cap09_seleccion_plataforma.m",
        "titulo": "Selección de una herramienta de análisis: AHP y TOPSIS",
        "titulo_corto": "AHP y TOPSIS · Cap. 8",
        "subtitulo": "Laboratorio del Capítulo 8 · Práctica «Recorrido del consumidor digital»",
        "datos": [],
    },
    {
        # App para evaluar alternativas propias (Excel/CSV) con las reglas del Cap. 6
        "id": "cap06_datos",
        "modelos": ["cap02_datos", "cap06", "cap06_datos"],
        "script": "cap06/cap06_alternativas.m",
        "salida": "cap06_alternativas_datos_propios.html",
        "titulo": "Evaluación de alternativas propias: tres reglas de decisión",
        "titulo_corto": "Datos propios · Cap. 6",
        "subtitulo": "Extensión del laboratorio del Capítulo 6 · reglas aditiva, conjuntiva y lexicográfica",
        "insignia": "Datos propios",
        "pie": ("Esta página funciona en cualquier navegador, sin conexión y sin MATLAB. Aplica a sus alternativas el mismo "
                "análisis de <code>cap06_alternativas.m</code> (normalización 0-10, regla aditiva, conjuntiva y lexicográfica, y barrido de pesos). "
                "<b>Sus datos no salen de esta computadora</b>: se procesan en el navegador y no se envían a ningún lado. "
                "Lectura de Excel con SheetJS (Apache-2.0)."),
        "nota_parametros": ("Suban el Excel con sus alternativas y atributos (o prueben los ejemplos), definan el tipo y el peso de cada atributo y ajusten las reglas. "
                            "Al cambiar cualquier valor, los resultados se recalculan solos."),
        "vendor": ["xlsx.full.min.js"],
        "datos": [("EJEMPLO_CAP06", "cap06_ejemplo.json")],
        "ui": ["datos_comun"],
    },
    {
        # App para atribuir con recorridos propios (Excel/CSV): cadena de Markov estimada del Cap. 7
        "id": "cap07_datos",
        "modelos": ["cap02_datos", "cap07", "cap07_datos"],
        "script": "cap07/cap07_journey_markov.m",
        "salida": "cap07_journey_datos_propios.html",
        "titulo": "Atribución con recorridos propios: cadena de Markov estimada",
        "titulo_corto": "Datos propios · Cap. 7",
        "subtitulo": "Extensión del laboratorio del Capítulo 7 · último clic, primer clic, lineal y efecto de remoción",
        "insignia": "Datos propios",
        "pie": ("Esta página funciona en cualquier navegador, sin conexión y sin MATLAB. Estima a partir de sus recorridos la cadena de Markov de "
                "<code>cap07_journey_markov.m</code> y reparte las compras con cuatro modelos de atribución. "
                "<b>Sus datos no salen de esta computadora</b>: se procesan en el navegador y no se envían a ningún lado. "
                "Lectura de Excel con SheetJS (Apache-2.0)."),
        "nota_parametros": ("Suban el Excel con sus recorridos (o prueben los ejemplos) y ajusten cómo se tratan. "
                            "Al cambiar cualquier valor, los resultados se recalculan solos."),
        "vendor": ["xlsx.full.min.js"],
        "datos": [("EJEMPLO_CAP07", "cap07_ejemplo.json")],
        "ui": ["datos_comun"],
    },
    {
        # App para analizar una red propia (lista de conexiones en Excel/CSV): centralidad y cascada del Cap. 8
        "id": "cap08_datos",
        "modelos": ["cap02_datos", "cap08", "cap08_datos"],
        "script": "cap08/cap08_red_influencia.m",
        "salida": "cap08_red_datos_propios.html",
        "titulo": "Red social propia: centralidad y cascada de adopción",
        "titulo_corto": "Datos propios · Cap. 8",
        "subtitulo": "Extensión del laboratorio del Capítulo 8 · grado, intermediación, cercanía y cascada por umbral",
        "insignia": "Datos propios",
        "pie": ("Esta página funciona en cualquier navegador, sin conexión y sin MATLAB. Aplica a su red las mismas medidas y la misma cascada de "
                "<code>cap08_red_influencia.m</code>. "
                "<b>Sus datos no salen de esta computadora</b>: se procesan en el navegador y no se envían a ningún lado. "
                "Lectura de Excel con SheetJS (Apache-2.0)."),
        "nota_parametros": ("Suban el Excel con las conexiones de su red (o prueben los ejemplos) y ajusten la cascada. "
                            "Al cambiar cualquier valor, los resultados se recalculan solos."),
        "vendor": ["xlsx.full.min.js"],
        "datos": [("RAND42", "rand42.json"), ("EJEMPLO_CAP08", "cap08_ejemplo.json")],
        "ui": ["datos_comun"],
    },
    {
        # App para decidir con una matriz propia (Excel/CSV): AHP + TOPSIS del Cap. 9
        "id": "cap09_datos",
        "modelos": ["cap02_datos", "cap09", "cap09_datos"],
        "script": "cap09/cap09_seleccion_plataforma.m",
        "salida": "cap09_seleccion_datos_propios.html",
        "titulo": "Selección multicriterio con datos propios: AHP y TOPSIS",
        "titulo_corto": "Datos propios · Cap. 9",
        "subtitulo": "Extensión del laboratorio del Capítulo 9 · pesos con AHP, ranking con TOPSIS y sensibilidad",
        "insignia": "Datos propios",
        "pie": ("Esta página funciona en cualquier navegador, sin conexión y sin MATLAB. Aplica a su matriz de decisión el mismo "
                "análisis de <code>cap09_seleccion_plataforma.m</code> (AHP con razón de consistencia, TOPSIS y barrido del peso de un criterio). "
                "<b>Sus datos no salen de esta computadora</b>: se procesan en el navegador y no se envían a ningún lado. "
                "Lectura de Excel con SheetJS (Apache-2.0)."),
        "nota_parametros": ("Suban el Excel con sus alternativas y criterios (o prueben los ejemplos), definan el tipo de cada criterio y escriban sus juicios por pares. "
                            "Al cambiar cualquier valor, los resultados se recalculan solos."),
        "vendor": ["xlsx.full.min.js"],
        "datos": [("EJEMPLO_CAP09", "cap09_ejemplo.json")],
        "ui": ["datos_comun"],
    },
]

NOTA_PARAMETROS_POR_DEFECTO = (
    "Son los mismos valores del bloque <em>«ESTA ES LA ÚNICA SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR»</em> "
    "del script. Al cambiar cualquier valor, los resultados y las figuras se recalculan solos."
)

PIE_POR_DEFECTO = (
    "Esta página funciona en cualquier navegador, sin conexión y sin MATLAB. Replica el cálculo de "
    "<code>{script}</code> con los mismos datos sintéticos (rng(42)); sus resultados fueron verificados "
    "contra la ejecución real del script en MATLAB. Las corridas guardadas se conservan solo en este navegador."
)

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
        vendor = "\n".join(
            (APPS / "vendor" / archivo).read_text(encoding="utf-8").replace("</script>", "<\\/script>")
            for archivo in cap.get("vendor", [])
        )
        valores.update({
            "INSIGNIA": cap.get("insignia", "Datos sintéticos"),
            "NOTA_PARAMETROS": cap.get("nota_parametros", NOTA_PARAMETROS_POR_DEFECTO),
            "PIE": cap.get("pie", PIE_POR_DEFECTO.format(script=script.name)),
            "VENDOR": vendor,
            "TITULO": cap["titulo"],
            "TITULO_CORTO": cap["titulo_corto"],
            "SUBTITULO": cap["subtitulo"],
            "SCRIPT": script.name,
            "DATOS": datos,
            "MODELO": "\n".join((APPS / "modelos" / f"{m}.js").read_text(encoding="utf-8")
                                for m in cap.get("modelos", [cap["id"]])),
            # módulos de interfaz compartidos (p. ej. cap02_didactico) + la interfaz de la app
            "APP": "\n".join((APPS / "paginas" / f"{m}.js").read_text(encoding="utf-8")
                             for m in cap.get("ui", []) + [f"{cap['id']}_app"]),
        })
        # reemplazo en una sola pasada: el contenido insertado no se vuelve a procesar
        html = re.sub(r"\{\{([A-Z_]+)\}\}", lambda m: valores[m.group(1)], plantilla)
        destino = script.with_name(cap.get("salida", script.stem + "_interactivo.html"))
        destino.write_text(html, encoding="utf-8")
        print(f"[OK] {destino.relative_to(MATLAB.parent)}  ({destino.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
