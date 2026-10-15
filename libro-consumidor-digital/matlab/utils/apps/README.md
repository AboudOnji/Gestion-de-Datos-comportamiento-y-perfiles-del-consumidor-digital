# Apps interactivas de laboratorio (sin MATLAB)

Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji

Cada script de laboratorio `matlab/capNN/capNN_*.m` tiene junto a él una app
`capNN_*_interactivo.html`. Es **un solo archivo** que se abre con doble clic en
cualquier navegador (Windows, macOS, Linux, Chromebook, tableta). Funciona sin
conexión, sin instalar nada y sin MATLAB.

## Qué hace cada app
- **Parámetros**: los mismos del bloque «ESTA ES LA ÚNICA SECCIÓN QUE EL
  ESTUDIANTE DEBE EDITAR», con deslizador y casilla numérica, validados con los
  rangos del glosario del capítulo. Los resultados se recalculan solos.
- **Resultados**: el mismo texto que imprime MATLAB en la ventana de comandos.
- **Figuras**: las mismas del script (interactivas; PNG con el ícono 📷), más
  algún complemento marcado como tal (p. ej. el criterio del codo del Cap. 2).
- **Casos del ejercicio propuesto**: botones que cargan los parámetros de los
  Casos A/B/C del libro.
- **Comparar corridas**: «Guardar corrida como caso» llena el cuadro que pide
  el ejercicio y superpone las curvas de todos los casos. Se puede descargar el
  cuadro (CSV que abre Excel) o imprimir/guardar la página como PDF.

## App con datos propios (Cap. 2)
`matlab/cap02/cap02_segmentacion_datos_propios.html` aplica el análisis de
`cap02_segmentacion.m` a un Excel/CSV del estudiante (extensión opcional del
laboratorio). El Excel trae **solo los clientes**: una columna ID opcional y
**cualquier número de columnas numéricas con cualquier nombre** (la app las
detecta y el estudiante elige de 2 a 10). Los **arquetipos se definen en la
app**, con una tarjeta por arquetipo y un campo por variable elegida. Si las
columnas son las del libro (empiezan con frecuencia…, ticket…, engagement…),
se cargan los arquetipos del libro; si no, la app propone arquetipos
«bajo / medio / alto» con percentiles de los datos (botón «Proponer desde mis
datos»). Los CSV se decodifican como UTF-8 (o Windows-1252) para respetar los
acentos de los encabezados. La app compara (1) arquetipos fijos
(cliente al arquetipo más cercano + pertenencia difusa a los arquetipos tal
como se definieron) contra (2) segmentos ajustados (k-means y fuzzy c-means que
parten de los arquetipos) y muestra cuánto se movió cada arquetipo. Está
organizada como recorrido guiado en 5 pasos (punto de partida → rígido con
silueta → difuso con pertenencias → rígido contra difuso → qué tanto corrigieron
los datos a los arquetipos). Las piezas explicativas (medidor de silueta con las
zonas de Kaufman y Rousseeuw, 1990; silueta por cliente; clientes de ejemplo;
seguros/ambiguos por segmento; conclusión en palabras) están en
`paginas/cap02_didactico.js` y también se usan en la app principal del Cap. 2. El Excel de ejemplo `matlab/cap02/cap02_datos_ejemplo.xlsx` tiene una sola hoja
(«Datos»); las reglas de formato están en la app (sección «¿Cómo deben venir
sus datos?»), que también puede descargar ese Excel. Lectura/escritura de Excel con SheetJS 0.18.5
(`vendor/`, Apache-2.0), incluido dentro del HTML. Los datos no salen del
navegador.

```bash
conda run -n research python matlab/utils/apps/datos/crear_excel_ejemplo_cap02.py  # Excel + JSON de ejemplo
matlab -batch "run('pruebas/referencias_datos_propios.m')"                        # referencia MATLAB
node pruebas/verificar_datos_propios.js                                            # 57 comprobaciones
```
Arquetipos fijos y k-means ajustado coinciden exactamente con MATLAB
(`kmeans(...,'Start',C)`). En R2026a, `fcm` con `fcmOptions(ClusterCenters=C)`
devuelve C sin moverlo, así que el FCM ajustado se compara contra `fcm`
estándar emparejando centros (diferencia < 0.05 desv. est.; % de ambiguos
±0.5 pp, un cliente de frontera en el juego de 4 arquetipos).

## App con datos propios (Cap. 3)
`matlab/cap03/cap03_rfm_datos_propios.html` aplica el análisis de `cap03_rfm_clv_ab.m` a un Excel/CSV del estudiante:
hoja «Datos» (una fila por cliente: recencia, frecuencia y monto; la app reconoce las columnas por nombre y se pueden
reasignar) y hoja opcional «Experimento» (`Version`, `Convirtio`, o resumen `Version/Visitantes/Conversiones`) para la
prueba A/B. Recorrido en 5 pasos: calidad de datos (reglas de limpieza visibles), RFM, CLV (extensiones: periodo de la
frecuencia y tasa de descuento; con 12 meses y 0 % es el CLV del script), prueba A/B (IC de la diferencia y muestra por
versión para potencia 80 %) y lectura de negocio; descarga resultados en Excel. Con valores muy repetidos (p. ej.
frecuencia 1–3) los quintiles se asignan por rango promedio y la app avisa (MATLAB `discretize` fallaría).
Modelo: `modelos/cap03_datos.js`; la prueba A/B es `Cap03.pruebaAB` (compartida con la app principal).

```bash
conda run -n research python matlab/utils/apps/datos/crear_excel_ejemplo_cap03.py   # Excel + JSON de ejemplo
matlab -batch "run('pruebas/referencias_cap03_datos.m')"                           # referencia MATLAB
node pruebas/verificar_cap03_datos.js                                               # 118 comprobaciones
```

## App con datos propios (Cap. 4)
`matlab/cap04/cap04_series_datos_propios.html` aplica el análisis de `cap04_series_texto.m` a una serie de tiempo y a
comentarios de escucha social del estudiante. Excel: hoja «Serie» (columna de fecha y una columna de valor; la app detecta
la frecuencia semanal/mensual/diaria/trimestral y propone los «periodos por ciclo») y hoja opcional «Comentarios». Recorrido en
5 pasos: calidad de la serie (faltantes interiores por interpolación lineal, intervalos irregulares), tendencia (promedio móvil de un
ciclo completo, como `movmean(y, w)`) y estacionalidad (serie − tendencia) con perfil por mes, **¿campaña o temporada?** (cambio de los
últimos k periodos frente al mismo cambio un ciclo antes: el estudio de caso del libro), bolsa de palabras con palabras vacías editables
y clasificación manual de los términos, y lectura de negocio con descarga en Excel. Los «casos de práctica» A/B/C repiten el análisis con
promedio móvil de 52, 13 y 4 periodos. Los extremos de la serie usan ventana incompleta (como el script): la app lo avisa y reporta también la
amplitud y la pendiente de la zona central. Ejemplo 1 = serie del libro (`rng(42)`); Ejemplo 2 = caso de la marca de electrodomésticos.
Modelo: `modelos/cap04_datos.js`.

```bash
conda run -n research python matlab/utils/apps/datos/crear_excel_ejemplo_cap04.py   # Excel + JSON de ejemplo
matlab -batch "run('pruebas/referencias_cap04_datos.m')"                           # referencia MATLAB
node pruebas/verificar_cap04_datos.js                                               # 74 comprobaciones
```


## Apps de la Parte II (Cap. 6–9)
Mismo patrón que los Cap. 1–4 (script + app + casos A/B/C + verificación contra MATLAB). Los cuatro modelos son
**deterministas** salvo el Cap. 8, que usa el flujo de `rand` tras `rng(42)` (`datos/rand42.json`, 20 000 valores).

| App | Modelo | Qué calcula |
|---|---|---|
| `cap06/cap06_alternativas_interactivo.html` | `modelos/cap06.js` | reglas aditiva, conjuntiva y lexicográfica; barrido del peso del precio |
| `cap07/cap07_journey_markov_interactivo.html` | `modelos/cap07.js` | cadena de Markov por etapas (P(convertir), contactos hasta convertir) y atribución: último clic, primer clic y efecto de remoción |
| `cap08/cap08_red_influencia_interactivo.html` | `modelos/cap08.js` | red con comunidades; grado, intermediación (Brandes) y cercanía; cascada por umbral; 100 sorteos al azar |
| `cap09/cap09_seleccion_plataforma_interactivo.html` | `modelos/cap09.js` | AHP (vector propio por iteración de potencias, razón de consistencia) y TOPSIS; barrido del peso del costo |

```bash
cd matlab/utils/apps
matlab -batch "run('pruebas/referencias_parte2.m')"   # corre los scripts REALES con los casos A/B/C (+ extras)
node pruebas/verificar_parte2.js                       # debe decir: 241 de 241 comprobaciones coinciden
bash pruebas/probar_app.sh ../../cap06/cap06_alternativas_interactivo.html   # abre la app en Chrome sin interfaz y revisa errores de consola
```
`numerico.js` ganó `matmul`, `matvec`, `vecmat`, `transpuesta`, `identidad` e `inv` (Gauss-Jordan) para Cap. 7 y 8.
Para agregar un caso nuevo: una fila en `corridas` de `referencias_parte2.m`, las métricas en `metricas.capNN` y el
modelo en `verificar_parte2.js`.

## Apps «datos propios» de la Parte II (Cap. 6–9)
Como en los Cap. 2–4, cada laboratorio tiene una extensión que aplica el mismo análisis a un Excel/CSV del estudiante
(SheetJS dentro del HTML; los datos no salen del navegador). Cada una es un recorrido guiado de 4–5 pasos, con los
Casos A/B/C de práctica, comparación de corridas y descarga de resultados en Excel. Piezas comunes: `paginas/datos_comun.js`
(lectura de archivos, arrastrar y soltar, vista previa, descarga) y `modelos/cap02_datos.js` (`procesarTabla`).

| App | Hojas del Excel | Qué hace |
|---|---|---|
| `cap06/cap06_alternativas_datos_propios.html` | `Alternativas`; `Criterios` (Tipo, Peso) opcional | Tres reglas de decisión sobre N alternativas y 2–10 atributos; tipos y pesos editables; barrido del peso de un atributo |
| `cap07/cap07_journey_datos_propios.html` | `Recorridos` (`Canales` o `Paso1…`, `Convirtio`, `Cantidad` opcional) | Estima la cadena de Markov entre canales; último clic, primer clic, lineal y efecto de remoción; rutas frecuentes |
| `cap08/cap08_red_datos_propios.html` | `Conexiones` (Persona_A, Persona_B); `Personas` (Persona, Grupo) opcional | Grado, intermediación y cercanía; cascada por umbral con semillas centrales, periféricas y 100 sorteos al azar (rand de MATLAB tras `rng(42)`) |
| `cap09/cap09_seleccion_datos_propios.html` | `Alternativas`; `Criterios`; `Juicios` (lista o matriz) | AHP (razón de consistencia con el RI de Saaty según n, par más contradictorio) y TOPSIS; barrido del peso de un criterio |

```bash
cd matlab/utils/apps
conda run -n research python datos/crear_excel_ejemplo_cap06.py   # y cap07, cap08, cap09: Excel y JSON de ejemplo
matlab -batch "run('pruebas/referencias_cap06_datos.m')"          # referencia MATLAB (y cap07, cap08, cap09)
node pruebas/verificar_cap06_datos.js                              # 49 comprobaciones (cap07: 77; cap08: 67; cap09: 43)
bash pruebas/probar_interaccion.sh ../../cap06/cap06_alternativas_datos_propios.html   # Casos B y C + guardar corridas
bash pruebas/probar_subida.sh ../../cap06/cap06_alternativas_datos_propios.html ../../cap06/cap06_datos_ejemplo_servicio.xlsx   # sube un Excel
```
Con los datos del libro, cada app reproduce el resultado del laboratorio (excepto los 100 sorteos al azar del Cap. 8: usan el
inicio del flujo de `rand`, el script lo usa después de generar la red; los promedios son parecidos, no idénticos).
Los Excel de ejemplo están junto a cada script (`capNN_datos_ejemplo*.xlsx`).

## Fidelidad con MATLAB
Los datos sintéticos son **los mismos** que genera MATLAB con `rng(42)`: los
números aleatorios se exportan desde MATLAB (`datos/exportar_datos_matlab.m`)
y se incluyen en la app. `pruebas/referencias_matlab.m` corre los scripts
reales con los casos del ejercicio y `pruebas/verificar_modelos.js` compara:

```bash
cd matlab/utils/apps
matlab -batch "run('pruebas/referencias_matlab.m')"   # referencias desde MATLAB
node pruebas/verificar_modelos.js                     # debe decir: N de N coinciden
```

## Reconstruir las apps (tras cambiar un modelo, página o dato)
```bash
conda run -n research python matlab/utils/apps/construir_apps.py            # todas
conda run -n research python matlab/utils/apps/construir_apps.py --solo cap02
```

## Estructura
| Archivo | Función |
|---|---|
| `numerico.js` | equivalentes de funciones MATLAB (prctile, discretize, movmean, kmeans, silhouette, fcm, normcdf) |
| `modelos/capNN.js` | cálculo del script NN (misma lógica y mismas salidas impresas) |
| `paginas/plantilla.html` | estructura común (encabezado institucional, paneles) |
| `paginas/capNN.html`, `paginas/capNN_app.js` | figuras, textos e interfaz del capítulo |
| `interfaz.js`, `comun.css` | controles, gráficas, casos guardados, tema claro/oscuro |
| `datos/` | números aleatorios exportados de MATLAB |

**Capítulo nuevo**: crear `modelos/capNN.js`, `paginas/capNN.html`,
`paginas/capNN_app.js`, agregar la entrada en `CAPITULOS` de
`construir_apps.py` y sus casos en `pruebas/referencias_matlab.m`. Si el script
usa números aleatorios que no son el flujo de `randn` tras `rng(42)`,
exportarlos en `datos/exportar_datos_matlab.m`.

Limitaciones: en el Cap. 3 `nClientes` solo toma valores de 100 a 1000 de 50 en 50
(las bases que exportó MATLAB). En los Caps. 2 y 4, si se piden más de 15 000
números aleatorios la app sigue funcionando pero avisa que sus datos ya no son
idénticos a los de MATLAB.
