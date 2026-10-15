# Informe Fase 3 — Parte II: Proceso de decisión de compra digital (Cap. 6–9)

> Numeración vigente desde 2026-10-15 (D3.1 revisada): el capítulo de Google Analytics 4 es el Cap. 5 y la Parte II ocupa los Cap. 6–9.

**Proyecto:** *Comportamiento del Consumidor Digital: Datos, Perfiles y Modelos*
**Fecha:** 2026-10-15
**Estado:** Parte II completa (libro, laboratorios, apps HTML y presentaciones). Checkpoint ligero (§12): se continúa con la Parte III salvo dudas.

## 1. Texto generado

| Capítulo | Páginas (PDF) | Subtemas del programa | Referencias únicas |
|---|---|---|---|
| Intro de la Parte II | 2 | — | — |
| 6 — El proceso de decisión de compra | 12 | 2.1.1–2.1.5 | 15 |
| 7 — *Customer journey* | 12 | 2.2.1–2.2.6 | 12 |
| 8 — Figuras participantes | 12 | 2.3.1–2.3.5 | 13 |
| 9 — Base tecnológica para el análisis del recorrido | 10 | 2.4.1 | 12 |
| Prácticas oficiales — Parte II | 2 | (práctica única, 15 h) | — |

El libro pasa de unas 62 a 124 páginas. Cobertura: **31 de 66** subtemas (`make cobertura`).
La densidad (10–12 páginas por capítulo) sigue el criterio de la Parte I; el §8 del
prompt sugiere 20–35 y sigue pendiente de decisión del Dr. Barsekh-Onji (ver fase2.md, §7).

## 2. Figuras

| Tipo | Cantidad | Verificación |
|---|---|---|
| TikZ | 9 (Cap. 6: 3; Cap. 7: 2; Cap. 8: 2; Cap. 9: 2) | compiladas y revisadas visualmente; 3 correcciones (etiquetas de fila del mapa de recorrido, rótulos del puente, figura flotante dentro de recuadro) |
| MATLAB | 8 (2 por capítulo) | ejecutadas, PDF vectorial + PNG 300 dpi, revisadas una por una |
| Tablas comparativas | ≥ 2 por capítulo | con fuente en el pie |

Piezas de Parte (§10): **mapa del *customer journey*** (Cap. 7, `cap07-mapa-journey`) y
**diagrama de las figuras participantes** (Cap. 8, `cap08-figuras-participantes`); el diagrama del
proceso de decisión es `cap06-proceso-decision`.

## 3. Scripts MATLAB y apps

| Script | Técnica | `run_all.m` | App HTML | Verificación app↔MATLAB |
|---|---|---|---|---|
| `cap06_alternativas.m` | reglas aditiva / conjuntiva / lexicográfica | OK | sí + datos propios | 4 corridas, 28 comprobaciones (+49) |
| `cap07_journey_markov.m` | cadena de Markov absorbente; atribución (último clic, primer clic, remoción) | OK | sí + datos propios | 4 corridas, 68 (+77) |
| `cap08_red_influencia.m` | red con comunidades, centralidad, cascada por umbral | OK | sí + datos propios | 6 corridas, 90 (+67) |
| `cap09_seleccion_plataforma.m` | AHP + TOPSIS | OK | sí + datos propios | 5 corridas, 55 (+43) |

Total **241 de 241** comprobaciones coinciden (`pruebas/verificar_parte2.js`) y **236 de 236** las de las cuatro apps «datos propios» (`verificar_cap06_datos.js` … `verificar_cap09_datos.js`: 49 + 77 + 67 + 43); las 76 + 121 + 74 + 57
de las apps de la Parte I siguen en verde tras tocar `numerico.js`. Cada app se abrió además en
Chrome sin interfaz (`pruebas/probar_app.sh`): sin errores de consola, gráficas dibujadas.

## 4. Presentaciones Beamer (IPN)

`presentaciones/sesion06-cap06` … `sesion09-cap09` (PDF compilado, 40–44 láminas cada una),
con el preámbulo y los ajustes manuales de `sesion04` (horario 3/2/1, lámina de evidencias del
portafolio con la carpeta de Drive, tarea autónoma con la app HTML, rangos de parámetros en el
glosario, sin «(en equipos)»). Reutilizan las figuras TikZ y MATLAB del libro sin copiarlas.

## 5. Fuentes nuevas y datos

12 entradas nuevas en `bib/referencias.bib`, todas verificadas el 2026-10-15
(Simon 1955; Payne et al. 1988; Webster y Wind 1972; Lemon y Verhoef 2016; Anderl et al. 2016;
Granovetter 1978; Barabási y Albert 1999; Brandes 2001; Saaty 1977; Hwang y Yoon 1981; Argyle
et al. 2023; Bisbee et al. 2024). Barabási y Albert quedó en el `.bib` pero **no se cita** (la red
final usa comunidades, D3.2). Webster y Wind y Saaty se citan sin DOI (no confirmado).
Detalle y URL en `docs/verificacion-datos.md` (sección «Parte II»).

## 6. Pendientes abiertos

Ver `docs/pendientes.md`, #31–#35: Cap. 9 con 4 de 5 fuentes primarias; cifras de comercio social y
engagement sin informe primario; fechas de entrega de los decks; vigencia de Gartner y comercio
agéntico. Las apps «datos propios» de los Cap. 6–9 quedaron construidas (D3.6).

## 7. Decisiones y dudas

Decisiones D3.1–D3.6 en `docs/decisiones-editoriales.md`. Dudas para el Dr. Barsekh-Onji:

1. Resuelta: GA4 es el Cap. 5 y la Parte II va del 6 al 9 (D3.1).
2. Fechas de entrega de los decks 6–9 (D3.4).
