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

### D1.3 — Consolidación de `bib/referencias.bib` y `docs/verificacion-datos.md` desde los 5 dossiers de Fase 1
**Qué cambió:** los 5 agentes de investigación (uno por Parte) entregaron sus
hallazgos aislados en `docs/investigacion/parteN.md`, sin tocar los archivos
compartidos (para evitar condiciones de carrera al correr en paralelo). El
coordinador (este documento) leyó los 5 dossiers completos y fusionó ~65
entradas BibTeX y 46 filas de datos verificados en los archivos canónicos,
unificando claves cuando la misma fuente fue encontrada de forma independiente
por más de un agente (p. ej. `tverskykahneman1974`, `maslow1943`, `ajzen1991`,
`mathur2019`, `profeco2023influencers`, `inegi2026endutih`, `amvo2026`).
**Por qué:** evitar entradas BibTeX duplicadas con claves distintas para la
misma fuente, y mantener `docs/verificacion-datos.md` como fuente única de
verdad para cifras citables.
**Evidencia:** `biber --tool --validate-datamodel bib/referencias.bib` sin
advertencias tras la consolidación; recompilación exitosa de `main.tex`.
**Discrepancias detectadas entre agentes durante la fusión (no resueltas,
marcadas con `note` en el `.bib` y en `docs/pendientes.md` #27–28):** (a) el
orden de autoría de Delgado Soriano et al. (2015, *El Cubo NORISO*) difiere
entre lo reportado por los agentes de las Partes I y II; (b) el año de la 8.ª
ed. de Hoyer/MacInnis/Pieters se reportó como 2023 (Parte II) y 2024 (Partes I
y IV) para el mismo ISBN; (c) el orden de autoría del artículo de HBR 2010
sobre CES (Dixon/Freeman/Toman vs. Freeman/Toman/Dixon) también difiere entre
fuentes secundarias citadas por el mismo agente (Parte V). Ninguna de las tres
afecta el contenido conceptual del libro, solo la ficha bibliográfica exacta.
**Impacto en horas:** ninguno.

### D1.4–D1.7 — Respuestas del Dr. Barsekh-Onji a las dudas de cierre de Fase 1
Registradas en `docs/dudas.md`; se aplican así a partir de la Fase 2:
- **D1.4 (duda 5, LFPDPPP/patrones oscuros):** no se contrata revisión jurídica
  independiente. El Cap. 3 presenta la cronología verificada de la LFPDPPP/INAI
  y la tensión tácito-vs-informado con lenguaje explícitamente atribuido a sus
  fuentes ("la ley establece X, según Y"), sin que el libro tome postura legal
  propia no verificada.
- **D1.5 (duda 6, NPS):** el Cap. 18 da tratamiento equilibrado — presenta la
  evidencia académica escéptica (Keiningham 2007, van Doorn 2013, de Haan
  2015) junto con la explicación de por qué la industria lo sigue usando
  (simplicidad operativa, comunicación ejecutiva de un solo número), sin
  descartar el NPS como herramienta útil.
- **D1.6 (duda 7, ediciones bibliográficas):** libertad editorial para citar
  la edición (oficial del programa o más reciente localizada en Fase 1) que
  mejor sirva al desarrollo de cada tema, capítulo por capítulo.
- **D1.7 (duda 8):** autorizada la Fase 2 — piloto de la Parte I completa
  (Cap. 1–4, laboratorio, prácticas oficiales, autoevaluación).

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

## Fase 2

### D2.1 — Corrección del total de subtemas oficiales: 66, no 69
**Qué cambió:** `docs/cobertura.md` corrige el total declarado de subtemas
oficiales de 69 a **66**, y el script `scripts/verificar_cobertura.sh`
(nuevo, conectado a `make cobertura`) usa la cifra correcta.
**Por qué:** al implementar el script de verificación en Fase 2 (prometido
desde Fase 0 pero no ejecutado hasta ahora) se contó el número real de filas
de la propia tabla de cobertura: 66, no 69. La cifra de 69 nunca se verificó
contra la tabla que la acompañaba — un error de conteo de Fase 0 que pasó
inadvertido hasta que hubo un script real corriendo contra ella.
**Evidencia:** `grep -oE '^\| [0-9]\.[0-9]\.[0-9]' docs/cobertura.md | wc -l`
devuelve 66; `make cobertura` corre limpio con esa cifra.
**Impacto en horas:** ninguno; es una corrección de conteo administrativo,
no de contenido del programa oficial.

### D2.2 — Fortalecimiento de referencias en Cap. 2 y Cap. 4 por debajo del mínimo
**Qué cambió:** al cerrar la Parte I se verificó el conteo de citas únicas
por capítulo contra el mínimo del §5.4 del prompt (≥12 referencias, ≥5
primarias/revisadas por pares). Cap. 1 y Cap. 3 cumplen (12 cada uno). Cap. 2
y Cap. 4 partían de 5 y 2 respectivamente; se reforzaron con citas
genuinamente pertinentes (no de relleno) hasta 9 y 7.
**Por qué:** los temas de Cap. 2 (tipos de perfil del consumidor digital) y
Cap. 4 (temas selectos de base tecnológica, deliberadamente abiertos por el
programa) tienen, según la propia investigación de Fase 1, una base
académica más delgada que los demás capítulos de la Parte —no se forzaron
citas irrelevantes solo para completar la cuota, siguiendo la prioridad de
rigor sobre métrica.
**Evidencia:** conteo de claves únicas de cita por capítulo, ver
`docs/informes/fase2.md`.
**Impacto en horas:** ninguno. Queda como pendiente abierto (no bloqueante)
una siguiente ronda de investigación dirigida específicamente a Cap. 2 y
Cap. 4 antes del cierre editorial final del libro.
