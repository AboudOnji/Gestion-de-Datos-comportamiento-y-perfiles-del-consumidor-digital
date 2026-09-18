# Pendientes (`\pendiente{}` y `\datoPendiente{}`)

Lista de todos los marcadores visibles en el PDF que aún requieren resolución.
Se actualiza al cerrar cada capítulo/Parte.

| Ubicación | Tipo | Descripción |
|---|---|---|
| `frontmatter/capitulo-prueba.tex` | `\pendiente` | Sustituir el capítulo de prueba por el contenido real del Cap. 1 en la Fase 2. |
| ~~`config/colores.tex`~~ | ~~TODO~~ | Resuelto en Fase 1 (D1.2): paleta oficial tomada del skill `beamer-ipn` (`#6F1D46` guinda Pantone 222C, `#B8975A` dorado), confirmada por el Dr. Barsekh-Onji. |
| ~~`preamble.tex`~~ | ~~Nota~~ | Resuelto en Fase 1 (D1.1): `biblatex-apa` sí estaba disponible; el libro ya usa `biblatex`+`biber`+`style=apa`. |
| `main.tex` | Estructural | Glosario (`glossaries`) configurado pero sin entradas — no genera `main.gls`/`main.acr` hasta que haya términos definidos (Fase 1+). |

## Pendientes de ejecución MATLAB
Ninguno: el único script existente (`matlab/fase0_prueba/script_prueba.m`) se
ejecutó y verificó en Fase 0 (ver `docs/registro-matlab.md`).

## Pendientes de investigación (Fase 1 — datos NO verificados, no citar en el libro)

Consolidado de las 5 secciones "Datos pendientes de verificar" de
`docs/investigacion/parteN.md`. Cada fila debe resolverse (o quedar como
`\datoPendiente{}` explícito en el capítulo) antes del cierre editorial de esa
Parte.

| # | Dato/atribución pendiente | Parte | Por qué está pendiente |
|---|---|---|---|
| 1 | Cifra del PNUMA de que el modelo de producción-consumo genera ~60 % de las emisiones globales de GEI | I | No se ubicó el informe primario exacto del PNUMA (solo un resumen de divulgación) |
| 2 | Cifras regionales de brecha digital ENDUTIH 2025 por entidad (Chiapas, Oaxaca, etc.) y brecha rural-urbana en pagos en línea (~20 pp) | I | Provienen de un resumen periodístico (CIAPEM), no del PDF primario de INEGI |
| 3 | Cifras del 21.º Estudio AIMX 2026 (horas de conexión, % uso de IA generativa) | I, IV | El PDF fuente no pudo extraerse en texto legible |
| 4 | "795 fintechs activas a finales de 2025" y "85.2 % usa efectivo para compras <$500" | I | Fuentes secundarias de industria, no confirmadas contra CNBV/ENIF directamente |
| 5 | Ficha bibliográfica completa de Bezdek (1981) y de Zadeh (1965), "Fuzzy Sets" | I | Atribución por conocimiento general/referencia cruzada, no lectura directa de la fuente |
| 6 | Tipificación expresa de "patrones oscuros" en la LFPC mexicana o su reglamento | I, V | No se confirmó ni descartó — requiere revisión jurídica directa del texto vigente |
| 7 | Lanzamiento efectivo del "peso digital" (CBDC de Banxico) | I | Proyectado 2025-2026, no confirmado si ya operó |
| 8 | Traducción al español de Hoyer/MacInnis/Pieters 8.ª ed. (Cengage, 2024) | I | Solo se confirmó la edición en inglés |
| 9 | Crecimiento del comercio social global (~81 a ~688 mil millones USD, 2018-2024) | II | Repetido en fuentes de industria sin reporte primario localizado (posible eMarketer/Statista) |
| 10 | Tasas de engagement por tamaño de influenciador (nano ~2.7 %, macro <1 %) | II | Sin atribución consistente a un estudio primario único |
| 11 | Adopción de IA generativa en compras (cifras 45 % / 73 % atribuidas a IBM IBV) | II | No se accedió al reporte primario completo |
| 12 | Estudio de AIMX específico sobre embudo/customer journey 2025-2026 | II | No se encontró; se usó AMVO como sustituto (gremio distinto) |
| 13 | Cifras de adopción/tamaño de mercado del "comercio agéntico" a 2026 | III | Solo respaldadas por blogs de industria, sin fuente primaria institucional |
| 14 | Texto íntegro de Assael (1987), 3.ª ed., contra la matriz 2×2 reconstruida | III | Solo se verificaron metadatos bibliográficos, no el texto completo |
| 15 | Tratamiento exacto de la tipología de Assael en la 11.ª ed. física de Solomon (2017) | III | Solo se consultaron fuentes terciarias |
| 16 | Año exacto de la primera formulación de "netnografía" por Kozinets (1997 vs. 1998) | III | Fuentes consultadas difieren; el artículo de 2002 en JMR se usó como ancla principal |
| 17 | Cita completa y paginación exacta de Dichter, *The Strategy of Desire* (1960) | III | No se accedió al registro editorial primario (WorldCat/LoC) |
| 18 | Autoría y año exactos de la revisión sistemática de AUT University sobre attitude-behaviour gap | IV | PDF no extraíble en la sesión de investigación |
| 19 | Desglose de brecha digital ENDUTIH 2024 por nivel socioeconómico | IV | No está en los boletines de prensa consultados; requiere tabulados/microdatos completos |
| 20 | Metodología muestral exacta del 21.º Estudio AIMX (2026) | IV | Solo se confirmó su existencia, no el reporte completo |
| 21 | Verificación de ediciones exactas de Delgado et al. (2015) y Diamantstein (2020) | IV | No se investigó en la Parte IV (no surgió en las búsquedas centrales) |
| 22 | Penetración específica de comercio social/live commerce como % del e-commerce total en México | V | No hay cifra oficial desagregada; solo proyecciones editoriales de prensa |
| 23 | Regulación mexicana equivalente a la regla "click-to-cancel" de la FTC (patrones oscuros de cancelación) | V | No confirmada en LFPC ni normatividad PROFECO consultada |
| 24 | Cifras de Fiserova et al. (2018) y Mecredy et al. (2018) sobre correlación NPS-ingresos | V | Solo citadas de forma secundaria (vía MeasuringU), sin acceso a los artículos originales |
| 25 | Reconciliación metodológica ENDUTIH 2024 vs. 2025 para la cifra de acceso a redes sociales (90.4 % vs. 80.4 %, bases distintas) | V | Requiere el documento metodológico completo de INEGI, no solo los comunicados |
| 26 | Orden exacto de autoría del artículo de HBR 2010 sobre CES (Dixon/Freeman/Toman vs. Freeman/Toman/Dixon) | V | Fuentes secundarias difieren; ver nota en `bib/referencias.bib`, entrada `dixonfreemantoman2010` |
| 27 | Orden de autoría de Delgado Soriano et al. (2015), *El Cubo NORISO* | I, II | Los agentes de las Partes I y II reportan órdenes distintos — ver nota en `bib/referencias.bib`, entrada `delgado2015noriso` |
| 28 | Año exacto de la 8.ª ed. de Hoyer/MacInnis/Pieters (2023 vs. 2024, mismo ISBN) | I, II, IV | Los tres agentes reportan años distintos para el mismo ISBN |
