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
