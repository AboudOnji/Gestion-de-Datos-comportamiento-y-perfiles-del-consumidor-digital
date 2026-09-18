# Decisiones editoriales

Registro de cambios con libertad de cátedra delegada (§4.3 y §6 del prompt):
qué cambió, por qué, qué evidencia lo respalda, impacto en horas.

## Fase 0

### D0.1 — Renumeración consecutiva de 4.2 (Aprendizaje y memoria)
**Qué cambió:** en el libro, 4.2.5 "Aprendizaje y memoria" se referencia también
como 4.2.4 para mantener numeración consecutiva de subsección, conservando la
equivalencia con la numeración oficial en `docs/cobertura.md`.
**Por qué:** el programa oficial salta de 4.2.3 (Motivación) a 4.2.5 (no existe
4.2.4); confirmado visualmente contra el PDF escaneado, hoja 9 de 14.
**Evidencia:** Anexo B.1 del prompt; verificado en Fase 0 contra el escaneo.
**Impacto en horas:** ninguno (no se agrega ni quita contenido, solo numeración).

### D0.2 — Corrección "Howarth-Sheth" → Howard y Sheth
**Qué cambió:** el modelo 3.2.8 se nombra en el libro "Modelo integrador de
Howard y Sheth (1969)"; se documenta el error tipográfico del programa oficial.
**Por qué:** la referencia académica real es Howard, J. A. y Sheth, J. N.
(1969), *The Theory of Buyer Behavior*; "Howarth-Sheth" no corresponde a
ningún autor identificable.
**Evidencia:** Anexo B.2 del prompt; confirmado en el escaneo, hoja 7 de 14
("Howarth- Sheth").
**Impacto en horas:** ninguno.

### D0.3 — Horas de 2.3 y 2.4 NO son ambiguas (corrección al Anexo B.4 del prompt)
**Qué cambió:** se retiran las marcas «(≈)» de incertidumbre en la fila de
horas de los capítulos 7 y 8 de la tabla arquitectónica (§7 del prompt): el
escaneo original (hoja 5 de 14) sí asigna con claridad T/P/AA por subsección:
2.1=(2/4/2), 2.2=(2/5/2), **2.3=(2/3/1), 2.4=(2/3/2)**. La suma cuadra
exactamente con el subtotal impreso (8.0/15.0/7.0).
**Por qué:** en la Fase 0 se inspeccionó visualmente cada hoja del PDF
(no solo el texto) y la tabla de horas por subsección es legible y consistente
con el subtotal, contrario a lo que asumía el Anexo B.4 del prompt original
(que suponía ambigüedad de escaneo en las 4 filas de horas de la Unidad II).
**Evidencia:** `docs/informes/fase0.md`, sección "Verificación del Anexo A".
**Impacto en horas:** ninguno sobre el total; se elimina la incertidumbre en
la distribución de horas T/P/AA de Cap. 7 (2/3/1) y Cap. 8 (2/3/2).

### D0.4 — Numeración de hoja "de 12" / "de 14": explicada, no es un error a resolver
**Qué cambió:** se documenta, sin intervención en el libro, que el documento
escaneado combina dos subdocumentos con paginación independiente: el
"Programa Sintético" (portada + hoja 2, numeradas "de 12") y el "Programa de
Estudios" detallado (hojas 3 a 14, numeradas "de 14"). No hay información
faltante; es un artefacto de cómo se encuadernaron/escanearon los documentos.
**Por qué:** confirmado visualmente: la hoja 1 lleva el encabezado "PROGRAMA
SINTÉTICO" (sin numerador "HOJA X DE Y" explícito) y la hoja 2 usa el
encabezado "PROGRAMA DE ESTUDIOS" con "HOJA 2 DE 12", mientras que desde la
hoja 3 el mismo encabezado "PROGRAMA DE ESTUDIOS" cambia a "HOJA 3 DE 14".
**Evidencia:** Anexo B.4 del prompt (fenómeno correctamente detectado, causa
ahora identificada); escaneo, hojas 1–3.
**Impacto en horas:** ninguno.

### D0.5 — Citación con `natbib`+`apalike` en vez de `biblatex-apa`
**Qué cambió:** el libro usa `\usepackage[longnamesfirst]{natbib}` con
`\bibliographystyle{apalike}` en vez de `biblatex`+`biblatex-apa`.
**Por qué:** `biblatex-apa` no está instalado en este entorno TeXLive
(`kpsewhich biblatex-apa.sty` no devuelve archivo); `natbib`+`apalike` sí están
disponibles y dan un formato APA-like razonable. Indicado como alternativa
válida en §5.4 del prompt, con aviso al usuario (este es el aviso).
**Evidencia:** `docs/informes/fase0.md`, verificación de paquetes LaTeX.
**Impacto en horas:** ninguno. Acción de seguimiento: si se instala
`biblatex-apa` (`tlmgr install biblatex-apa`), migrar `preamble.tex`.

### D0.6 — `run_all.m` ejecuta cada script como subproceso MATLAB independiente
**Qué cambió:** `matlab/run_all.m` invoca cada script de capítulo vía
`system('matlab -batch "run(''...'')"')` en vez de `run()` dentro del mismo
proceso MATLAB.
**Por qué:** cada script de capítulo inicia con `clc; clear; close all;`
(convención §9.1); si se ejecutara con `run()` en el mismo workspace que el
orquestador, ese `clear` borraría también las variables internas de
`run_all.m` (se reprodujo el fallo en Fase 0 y se corrigió).
**Evidencia:** `docs/registro-matlab.md` (ejecución exitosa tras la corrección).
**Impacto en horas:** ninguno; es una decisión de implementación del andamiaje.

## Fase 1

### D1.1 — Corrección de D0.5: `biblatex-apa` SÍ está disponible; se usa en vez de `natbib`+`apalike`
**Qué cambió:** `preamble.tex` usa
`\usepackage[backend=biber,style=apa,language=spanish]{biblatex}` +
`\addbibresource{bib/referencias.bib}`, y `main.tex` usa `\printbibliography`.
Las citas en el texto usan `\parencite{}`/`\textcite{}` (biblatex), no
`\citep{}` (natbib).
**Por qué:** la verificación de Fase 0 (`kpsewhich biblatex-apa.sty`) fue
defectuosa: ese nombre de archivo no existe para ningún paquete de estilo
biblatex — se activan con `style=<nombre>`, no con `\usepackage{<nombre>}`.
El Dr. Barsekh-Onji autorizó investigar instalación; al revisar con
`dpkg -L`/`kpsewhich apa.bbx` se confirmó que el paquete Debian
`texlive-bibtex-extra` (parte de `texlive-full`, ya instalado) sí trae
`biblatex-apa` completo (`apa.bbx`, `apa.cbx`, `apa.dbx`, `spanish-apa.lbx`).
No hizo falta instalar nada nuevo.
**Evidencia:** recompilación exitosa de `main.tex` con `biber`; bibliografía
final en la página de prueba renderiza en formato APA 7 real: "Solomon, M. R.
(2017). *Comportamiento del consumidor* (11.ª ed.). Pearson."
**Impacto en horas:** ninguno. Acción de seguimiento: al escribir capítulos
reales, usar `\parencite{}` (cita entre paréntesis) o `\textcite{}` (cita en
prosa) según corresponda — nunca `\citep{}`/`\citet{}` de natbib.

### D1.2 — Paleta institucional real: HEX del skill `beamer-ipn`, no la aproximación de Fase 0
**Qué cambió:** `config/colores.tex` reemplaza la aproximación provisional
(`#6E1E3A`/`#B08D57`) por la paleta oficial que ya usa el skill `beamer-ipn`
(Manual de Identidad Gráfica del IPN, Pantone 222C): `guindaIPN` `#6F1D46`,
`guindaIPNOsc` `#45102C`, `guindaIPNClara` `#F4E9EF`, `doradoIPN` `#B8975A`,
`terracotaIPN` `#9C5B44`, `bronceIPN` `#8C6B3F`, `grisIPN` `#58595B`. Los seis
recuadros del libro se remapean: Definición=guinda, Ejemplo=bronce,
Atención=terracota, Frontera=dorado (solo como borde/acento, nunca fondo de
bloque — regla del propio skill), Ética=guinda oscuro (para distinguirla de
Atención), Laboratorio=teal técnico (no institucional, fuera de la paleta IPN
a propósito: el laboratorio MATLAB no debe leerse como un bloque de identidad
gráfica).
**Por qué:** el Dr. Barsekh-Onji confirmó (duda #3, `docs/dudas.md`) usar el
skill `beamer-ipn` ya dado de alta como fuente del HEX oficial, en vez de
esperar al manual de identidad o seguir con la aproximación. Además reutilizar
la misma paleta entre libro y Beamer facilita la Fase 5 (§14 del prompt:
figuras reutilizables sin retrabajo).
**Evidencia:** recompilación exitosa; verificación visual de los recuadros
Definición y Ética en el capítulo de prueba (colores institucionales
correctos y distinguibles entre sí).
**Impacto en horas:** ninguno.
