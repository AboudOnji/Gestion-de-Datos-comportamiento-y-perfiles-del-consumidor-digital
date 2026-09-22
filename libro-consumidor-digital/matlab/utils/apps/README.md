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
