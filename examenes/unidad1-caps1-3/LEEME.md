# Examen de la Unidad I (Caps. 1 a 3) — Dr. Aboud Barsekh-Onji

| Archivo | Para qué |
|---|---|
| `examen_A.pdf`, `examen_B.pdf`, `examen_C.pdf` | Examen (2 páginas, una hoja por ambos lados). Mismo examen, distinto orden de reactivos y opciones. 30 reactivos (22 conceptuales + 8 de análisis de figuras/resultados de laboratorio) |
| `hoja_respuestas.pdf` | Hoja independiente: datos del alumno, casilla de **versión**, 30 reactivos. Se escanea |
| `calificar_hojas.py` | Lee los escaneos y califica (ver abajo) |
| `clave_profesor.pdf` | Clave irregular de A/B/C, correspondencia de reactivos y justificaciones |
| `plantilla_A/B/C.pdf` | Respaldo manual: acetato impreso al 100 % sobre la hoja del alumno |
| `generar_examenes.py`, `banco_reactivos.py`, `compilar.sh` | Fuente: editar el banco y regenerar |
| `prueba_calificador.py` | Prueba del calificador con escaneos simulados (8 de 8) |

## Aplicar y calificar
1. Imprimir examen A/B/C (a doble cara) y una `hoja_respuestas.pdf` por alumno (a **tamaño real, Carta, 100 %**).
2. El alumno contesta **solo** en la hoja (pluma o lápiz oscuro, círculo relleno) y marca la versión.
3. Escanear las hojas (PDF o imágenes, 150–300 dpi, **incluyendo los 4 cuadros negros de las esquinas**).
4. `conda run -n research python calificar_hojas.py RUTA_DE_ESCANEOS --salida resultados`
   → `resultados.csv/.xlsx`, `recortes_nombre/` (nombre y matrícula para capturar) y `revision/` (hojas con incidencias).
5. Revisar las hojas con incidencias (versión sin marcar, reactivo en blanco, doble marca, marca tenue) antes de publicar calificaciones.

Regenerar tras cambiar el banco: `conda run -n research python generar_examenes.py && ./compilar.sh`
