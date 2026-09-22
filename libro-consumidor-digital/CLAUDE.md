# CLAUDE.md — libro-consumidor-digital

Reglas condensadas del prompt de proyecto (`../prompt-libro-consumidor-digital-claude-code.md`,
fuente completa y autoritativa; este archivo es un resumen operativo).

## Qué es esto
Libro de texto y manual de laboratorio en LaTeX: *Comportamiento del Consumidor
Digital: Datos, Perfiles y Modelos*, para la unidad **Laboratorio: Gestión de
datos, comportamiento y perfiles del consumidor digital** (Lic. en Mercadotecnia
Digital, 3.er semestre, ESCA Unidad Santo Tomás, IPN). 18 capítulos = 18 semanas,
en 5 Partes. Servirá luego de insumo para slides Beamer IPN (no construir aún).

Estado: Parte I completa (Cap. 1–4, Fase 2). Partes II–V pendientes (Fase 3).

## No negociable
1. **Fidelidad al programa oficial** (Anexo A del prompt) — cobertura 100 %,
   verificada en `docs/cobertura.md` vía `\progtag{X.Y.Z}` (`make cobertura`).
2. **Rigor académico**: cero cifras/citas "de memoria". Todo dato verificado
   en `docs/verificacion-datos.md` o marcado `\datoPendiente{}`.
3. **Laboratorio MATLAB ejecutado y verificado** (`matlab -batch`, nunca
   inventar salidas).

## Entorno verificado
- MATLAB: `matlab -batch` funciona. Versión instalada **R2026a**. Toolboxes
  confirmadas: Statistics and Machine Learning, Fuzzy Logic, Signal
  Processing, Text Analytics.
- El MCP de MATLAB (`mcp__matlab__*`) no logra adjuntarse a una sesión en
  este entorno; se usa el fallback de CLI `matlab -batch "run('...')"`.
- `run_all.m` lanza cada script de capítulo como **subproceso MATLAB
  independiente** (`system('matlab -batch ...')`), nunca con `run()` en el
  mismo proceso (cada script hace `clear`, que borraría las variables del
  orquestador si compartieran workspace).

## LaTeX — bugs de `babel[spanish]` descubiertos (aplican a todo el libro)
- **Comillas rectas (`"`)**: el atajo activo de babel-spanish las rompe
  (genera basura tipográfica). Usar siempre `\enquote{...}` (paquete
  `csquotes`, ya cargado), nunca comillas rectas sueltas en el texto.
- **`%` dentro de modo matemático**: incompatible con `\,` (error "Incompatible
  glue units"). Nunca escribir `\%` dentro de `$...$`; sacar el signo de
  porcentaje del modo matemático (p. ej. `$-$25\,\%`, no `$-25\,\%$`).
- **Acentos dentro de `lstlisting`**: el cuerpo (no el `caption`) de un
  entorno `lstlisting` no soporta UTF-8 multibyte — rompe con "Invalid UTF-8
  byte sequence". Los comentarios de código en los extractos que aparecen en
  el libro van **sin acentos** (los archivos `.m` reales, fuera de
  `lstlisting`, sí pueden llevar acentos sin problema).
- Figuras dentro de recuadros `tcolorbox` (Laboratorio, etc.): no usar
  `figure` flotante — usar `\begin{center}...\captionof{figure}{...}\end{center}`
  (paquete `capt-of`, ya cargado).
- Gráficas MATLAB con `Interpreter,'latex'` y texto en español acentuado
  emiten warnings benignos de `SceneNode` en modo `-batch` (sin hardware de
  aceleración gráfica) pero **renderizan correctamente**; no son errores.
  Escribir el carácter UTF-8 directo (é, á, í, ó, ú, ñ) en el código MATLAB,
  nunca comandos de acento LaTeX (`\'e`).

## Citación
`biblatex` + `biber`, estilo `apa`. Usar **siempre** `\parencite{clave}` o
`\textcite{clave}` — nunca `\citep{}`/`\citet{}` (eso es natbib, no está
cargado). Claves en `bib/referencias.bib`, con nota de trazabilidad en cada
entrada.

## Paleta institucional
`config/colores.tex` usa el HEX oficial IPN del skill `beamer-ipn` (guinda
`#6F1D46` Pantone 222C, dorado `#B8975A` solo como acento/borde, nunca fondo
de bloque). Misma paleta que usará Beamer en la Fase 5 — reutilizable sin
retrabajo. Los recuadros de contenido usan un color cada uno (Definición=
guinda, Ejemplo=bronce, Atención=terracota, Frontera=dorado, Ética=guinda
oscuro, Laboratorio=teal no institucional). La **ficha del capítulo** va en
el recuadro `cajaFicha` (gris neutro, D2.3) — nunca como texto suelto.

## Patrón del laboratorio MATLAB (D2.4 — obligatorio para Partes II–V)
Los estudiantes de la unidad no tienen base sólida de programación. Por eso,
en cada capítulo:
- **Un solo script**, el mismo que aparece en el libro y el que el
  estudiante entrega en su práctica — nunca dos versiones distintas.
- Todos los valores editables van en **un único bloque de parámetros**,
  delimitado al inicio del archivo con el comentario "ESTA ES LA ÚNICA
  SECCIÓN QUE EL ESTUDIANTE DEBE EDITAR". El resto del script no se toca.
- El script debe ser **robusto a los cambios de parámetros** razonables que
  se le vayan a pedir al estudiante (p. ej., si el parámetro es "número de
  segmentos", todo lo que dependa de ese número —colores, leyendas, tamaño
  de arreglos— debe derivarse automáticamente, no estar hardcodeado).
- El "Ejercicio propuesto" de cada laboratorio se formula como **2–3 casos**
  con valores de parámetro específicos que el estudiante corre uno por uno,
  seguidos de preguntas de comparación entre los resultados y una conclusión
  propia. El libro **no** muestra de antemano una comparación ya resuelta
  entre esos casos (eso es lo que el estudiante debe producir corriendo el
  script varias veces).
- **App interactiva sin MATLAB** (pedido del Dr. Barsekh-Onji, 2026-09-22):
  junto a cada script va `capNN_*_interactivo.html`, un único HTML
  autocontenido (funciona sin conexión) con los mismos parámetros, salidas
  impresas y figuras, botones de los casos del ejercicio y cuadro de
  comparación. Encabezado obligatorio en todas las ventanas: «Instituto
  Politécnico Nacional - Dr. Aboud Barsekh Onji». Fuente, construcción y
  verificación contra MATLAB en `matlab/utils/apps/README.md`; nunca editar
  el HTML generado a mano. Todo script nuevo debe tener su app y sus casos en
  `pruebas/referencias_matlab.m` (verificación N de N antes de entregar).
- La carpeta real del proyecto termina en un **espacio**
  (`…consumidor digital /`); las rutas absolutas deben incluirlo.

## Estructura
Ver §11 del prompt. `main.tex` ensambla `frontmatter/` → `partes/parteN/` →
`backmatter`.

## Flujo de fases y checkpoints
Ver §12 del prompt. Fase 2 (Parte I) cerrada y revisada por el Dr.
Barsekh-Onji. Antes de reproducir el patrón en Partes II–V, releer
`docs/informes/fase2.md` y este archivo completo.

## Comandos
```bash
make libro       # compila main.tex con latexmk
make matlab      # corre matlab/run_all.m (todos los scripts, subprocesos)
make figuras     # alias de matlab (regenera figuras/matlab/)
make cobertura   # scripts/verificar_cobertura.sh — progtag vs. 66 subtemas oficiales
make clean       # limpia auxiliares de LaTeX y glosario
```
