# Pendientes (`\pendiente{}` y `\datoPendiente{}`)

Lista de todos los marcadores visibles en el PDF que aún requieren resolución.
Se actualiza al cerrar cada capítulo/Parte.

| Ubicación | Tipo | Descripción |
|---|---|---|
| ~~`frontmatter/capitulo-prueba.tex`~~ | ~~`\pendiente`~~ | Resuelto en Fase 2: capítulo de prueba retirado de `main.tex`, sustituido por Cap. 1 real. |
| ~~`config/colores.tex`~~ | ~~TODO~~ | Resuelto en Fase 1 (D1.2): paleta oficial tomada del skill `beamer-ipn` (`#6F1D46` guinda Pantone 222C, `#B8975A` dorado), confirmada por el Dr. Barsekh-Onji. |
| ~~`preamble.tex`~~ | ~~Nota~~ | Resuelto en Fase 1 (D1.1): `biblatex-apa` sí estaba disponible; el libro ya usa `biblatex`+`biber`+`style=apa`. |
| `main.tex` | Estructural | Glosario (`glossaries`) configurado pero sin entradas — no genera `main.gls`/`main.acr` hasta que haya términos definidos (Fase 1+). |

## Pendientes de ejecución MATLAB
Ninguno: los 5 scripts existentes (`fase0_prueba` + `cap01`–`cap04`) se
ejecutaron y verificaron en Fase 0/2 vía `matlab/run_all.m` (ver
`docs/registro-matlab.md`).

## Pendientes de Fase 2

| # | Descripción | Bloqueante |
|---|---|---|
| 29 | Cap. 2 (9 referencias) y Cap. 4 (7 referencias) quedan por debajo del mínimo de 12 referencias del §5.4 del prompt (D2.2, `docs/decisiones-editoriales.md`). Se reforzaron con citas genuinamente pertinentes, no de relleno; falta una ronda de investigación dirigida a esos dos capítulos específicamente antes del cierre editorial final. | No — no bloquea el checkpoint de Fase 2, sí el cierre final del libro (§13). |
| 30 | El glosario global (`glossaries`) sigue sin entradas indexadas con `\newglossaryentry`; los glosarios de capítulo actuales son listas `description` manuales, no conectadas al sistema de glosario de LaTeX. Decidir en Fase 3 si se migra a `\newglossaryentry`/`\gls{}` o se mantiene como lista manual por capítulo. | No. |

## Datos de Fase 1 — verificados por el Dr. Barsekh-Onji (2026-09-18)

Los 28 ítems que salieron de las secciones "Datos pendientes de verificar"
de `docs/investigacion/parteN.md` fueron revisados y confirmados
directamente por el Dr. Barsekh-Onji. Ya no son pendientes: se pueden citar
en el libro con el valor reportado por el dossier de Fase 1 correspondiente.
Se conserva la lista, archivada, para trazabilidad editorial (qué se verificó,
cuándo y por quién) — ver también las notas actualizadas en
`bib/referencias.bib` para las entradas bibliográficas afectadas (Bezdek
1981, Delgado Soriano et al. 2015, DOF simplificación orgánica 2024, Hoyer
et al. 2024, AIMX 2026, Zhuo et al. 2022/AUT University, Dichter 1960,
Assael 1987, Dixon/Freeman/Toman 2010).

| # | Dato/atribución (ya verificado) | Parte |
|---|---|---|
| 1 | Cifra del PNUMA de que el modelo de producción-consumo genera ~60 % de las emisiones globales de GEI | I |
| 2 | Cifras regionales de brecha digital ENDUTIH 2025 por entidad (Chiapas, Oaxaca, etc.) y brecha rural-urbana en pagos en línea (~20 pp) | I |
| 3 | Cifras del 21.º Estudio AIMX 2026 (horas de conexión, % uso de IA generativa) | I, IV |
| 4 | "795 fintechs activas a finales de 2025" y "85.2 % usa efectivo para compras <$500" | I |
| 5 | Ficha bibliográfica completa de Bezdek (1981) y de Zadeh (1965), "Fuzzy Sets" | I |
| 6 | Tipificación expresa de "patrones oscuros" en la LFPC mexicana o su reglamento | I, V |
| 7 | Lanzamiento efectivo del "peso digital" (CBDC de Banxico) | I |
| 8 | Traducción al español de Hoyer/MacInnis/Pieters 8.ª ed. (Cengage, 2024) | I |
| 9 | Crecimiento del comercio social global (~81 a ~688 mil millones USD, 2018-2024) | II |
| 10 | Tasas de engagement por tamaño de influenciador (nano ~2.7 %, macro <1 %) | II |
| 11 | Adopción de IA generativa en compras (cifras 45 % / 73 % atribuidas a IBM IBV) | II |
| 12 | Estudio de AIMX específico sobre embudo/customer journey 2025-2026 | II |
| 13 | Cifras de adopción/tamaño de mercado del "comercio agéntico" a 2026 | III |
| 14 | Texto íntegro de Assael (1987), 3.ª ed., contra la matriz 2×2 reconstruida | III |
| 15 | Tratamiento exacto de la tipología de Assael en la 11.ª ed. física de Solomon (2017) | III |
| 16 | Año exacto de la primera formulación de "netnografía" por Kozinets (1997 vs. 1998) | III |
| 17 | Cita completa y paginación exacta de Dichter, *The Strategy of Desire* (1960) | III |
| 18 | Autoría y año exactos de la revisión sistemática de AUT University sobre attitude-behaviour gap | IV |
| 19 | Desglose de brecha digital ENDUTIH 2024 por nivel socioeconómico | IV |
| 20 | Metodología muestral exacta del 21.º Estudio AIMX (2026) | IV |
| 21 | Verificación de ediciones exactas de Delgado et al. (2015) y Diamantstein (2020) | IV |
| 22 | Penetración específica de comercio social/live commerce como % del e-commerce total en México | V |
| 23 | Regulación mexicana equivalente a la regla "click-to-cancel" de la FTC (patrones oscuros de cancelación) | V |
| 24 | Cifras de Fiserova et al. (2018) y Mecredy et al. (2018) sobre correlación NPS-ingresos | V |
| 25 | Reconciliación metodológica ENDUTIH 2024 vs. 2025 para la cifra de acceso a redes sociales (90.4 % vs. 80.4 %, bases distintas) | V |
| 26 | Orden exacto de autoría del artículo de HBR 2010 sobre CES: Dixon, Freeman y Toman | V |
| 27 | Orden de autoría de Delgado Soriano et al. (2015), *El Cubo NORISO*: Delgado Soriano primero | I, II |
| 28 | Año exacto de la 8.ª ed. de Hoyer/MacInnis/Pieters: 2024 | I, II, IV |
