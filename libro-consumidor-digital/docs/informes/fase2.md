# Informe Fase 2 — Piloto: Parte I completa

**Proyecto:** *Comportamiento del Consumidor Digital: Datos, Perfiles y Modelos*
**Fecha:** 2026-09-18
**Estado:** ⏸ Checkpoint — se detiene aquí para revisión de calidad y estilo
del Dr. Barsekh-Onji antes de replicar el patrón en las Partes II–V (§12 del
prompt de proyecto).

---

## 1. Texto generado

Parte I completa: introducción de Parte + 4 capítulos + prácticas oficiales,
1,952 líneas de LaTeX fuente. Todos los capítulos siguen la plantilla
obligatoria del §8 del prompt (ficha, caso de apertura, desarrollo teórico,
evidencia, Frontera cuando aplica, Ética obligatorio, laboratorio MATLAB,
estudio de caso, actividades de portafolio, ruta de AA, síntesis+glosario+
autoevaluación, lecturas recomendadas).

| Capítulo | Páginas en el PDF compilado | Nota |
|---|---|---|
| 1 — El consumidor digital: evolución, impacto y ventajas | ~10 | incluye 1 página en blanco de cortesía (verso, libro a dos caras) |
| 2 — Perfil, segmentación y mercado meta digital | ~9 | ídem |
| 3 — Gestión de datos: valor, omnicanalidad, escucha y decisión | ~9 | ídem |
| 4 — Base tecnológica: buscadores, plataformas, redes y comercio electrónico | ~9 | ídem |
| Prácticas oficiales de la unidad — Parte I | ~2 | consolida Práctica 1 (7h) y Práctica 2 (8h) |

**Nota de honestidad editorial:** la extensión orientativa del §8 es de
20–35 páginas por capítulo; los cuatro capítulos de este piloto quedan por
debajo de ese rango (9–10 páginas cada uno). Es una decisión deliberada de
densidad, no un recorte de contenido: el estilo `onji-style` usado en toda la
prosa (§3 del prompt) prohíbe explícitamente la repetición de la misma idea
para alargar el texto, y los doce elementos obligatorios de la plantilla
están completos en cada capítulo. Se pide su criterio explícito en el
checkpoint (§7 de este informe): ¿la densidad actual es la deseada para el
libro final, o prefiere capítulos más extensos (más subsecciones teóricas,
más estudios de caso, glosarios más amplios) para acercarse al rango
orientativo?

## 2. Figuras — generadas y verificadas

**18 figuras nuevas** (4 capítulos × mínimo 4 c/u, más 1 infografía de Parte
cross-capítulo), todas generadas y verificadas visualmente:

| Tipo | Cantidad | Verificación |
|---|---|---|
| TikZ (diagramas conceptuales) | 10 (2–3 por capítulo) | Compilación exitosa, revisión visual de cada una tras corregir 2 bugs de sintaxis TikZ (nodo de arista sin `align`, ver §5) |
| MATLAB (figuras de laboratorio) | 8 (2 por capítulo) | Ejecutadas, exportadas a PDF vectorial + PNG 300 dpi, revisadas visualmente una por una |
| Tablas comparativas | 9 (2 por capítulo + 1 extra en Cap. 4) | Todas con fuente citada en el pie |

Pieza de Parte requerida por §10 del prompt: **infografía-modelo del perfil
del consumidor** (cierre del Cap. 2) y **mapa de gestión de datos
(recolección → decisión)** (apertura del Cap. 3) — ambas entregadas.

## 3. Scripts MATLAB corridos y su estado

| Script | Estado | Notas |
|---|---|---|
| `matlab/cap01/cap01_difusion_bass.m` | ✅ OK | Modelo de Bass, parámetros didácticos (duda 4 de Fase 0: se mantiene sin calibrar). 2 figuras. |
| `matlab/cap02/cap02_segmentacion.m` | ✅ OK | k-means vs. fuzzy c-means sobre datos sintéticos; requiere Statistics and Machine Learning Toolbox + Fuzzy Logic Toolbox. 2 figuras. |
| `matlab/cap03/cap03_rfm_clv_ab.m` | ✅ OK | Limpieza de datos, RFM, CLV simple, prueba A/B de dos proporciones. 2 figuras. |
| `matlab/cap04/cap04_series_texto.m` | ✅ OK | Descomposición tendencia/estacionalidad + bolsa de palabras (Text Analytics Toolbox). 2 figuras. Requirió 3 correcciones (ver §5). |

Los 5 scripts del proyecto (incluido el de Fase 0) se verificaron en
conjunto vía `matlab/run_all.m` → `[OK]` en los 5, registrado en
`docs/registro-matlab.md`.

## 4. Fuentes nuevas y datos verificados

No se investigaron fuentes nuevas en esta fase — Fase 2 es redacción, no
investigación; todas las citas de los 4 capítulos provienen de
`bib/referencias.bib`, ya consolidado en Fase 1. Se agregaron **2 entradas
bibliográficas nuevas** que Fase 1 había mencionado en prosa pero no
formalizado en BibTeX: `bass1969` (modelo de Bass, fuente primaria del
laboratorio del Cap. 1) y `profeco2025entornodigital` /
`onu2015ods12` (consumo sostenible, Cap. 1, §1.1.2). Ninguna cifra nueva se
imprimió sin verificación previa; todo dato empírico citado en los 4
capítulos ya estaba registrado en `docs/verificacion-datos.md` desde Fase 1.

### Conteo de referencias por capítulo (vs. mínimo del §5.4: ≥12, ≥5 primarias/revisadas por pares)

| Capítulo | Referencias únicas | Cumple ≥12 | Primarias/peer-reviewed (aprox.) |
|---|---|---|---|
| 1 | 12 | ✅ | 3 (Smith 1956, Tversky-Kahneman 1974, Bass 1969) |
| 2 | 9 | ❌ (faltan 3) | 2 (Smith 1956, Bezdek 1981) |
| 3 | 12 | ✅ | 7 (3 DOF, Verhoef 2015, Mathur 2019, Tversky-Kahneman 1974, SABG) |
| 4 | 7 | ❌ (faltan 5) | 2 (Mathur 2019, EPRS 2025) |

Cap. 2 y Cap. 4 quedan documentados como pendiente #29 (no bloqueante) — ver
§6.

## 5. Hallazgos técnicos y correcciones durante la redacción

- **Bug de comillas rectas bajo `babel[spanish]`:** el atajo activo `"` de
  babel-spanish rompía cualquier comilla recta seguida de letra (generaba
  basura tipográfica como «Ç» o «.es»). Corregido con
  `\shorthandoff{"}` + `csquotes`/`\enquote{}` en todo el texto ya escrito
  (Fase 0 y capítulos de Parte I). **Aplica a todo el libro en adelante.**
- **Bug de `%` dentro de modo matemático bajo `babel[spanish]`:** el atajo
  activo de `%` de babel-spanish es incompatible con `\,` dentro de `$...$`
  (error "Incompatible glue units"). Corregido evitando el `%` dentro de
  modo matemático (`$-$25\,\%` en vez de `$-25\,\%$`). **Aplica a todo el
  libro en adelante — evitar `\%` dentro de `$...$`.**
- **Figuras dentro de recuadros `tcolorbox` (Laboratorio):** el entorno
  `figure` flotante no es válido dentro de un `tcolorbox`. Se usa
  `\begin{center}...\captionof{figure}{...}\end{center}` con el paquete
  `capt-of`, ya agregado a `preamble.tex`.
- **Nodo de arista TikZ con salto de línea:** un `node` sobre un `\draw` con
  `\\` sin `align=center` produce «Something's wrong—perhaps a missing
  \item». Corregido en `cap04-comercio-agentico.tex`; **norma para figuras
  nuevas: todo nodo con `\\` debe declarar `align=`.**
- **`tokenizedDocument` no soporta español como idioma explícito** en esta
  versión de Text Analytics Toolbox (solo 'en','de','ja','ko'); se usa
  tokenización genérica + lista propia de palabras vacías en español.
- Dos figuras TikZ que se habían creado en fases previas nunca se habían
  insertado en el texto (`cap01-doble-naturaleza.tex`,
  `cap02-rigida-vs-difusa.tex`) — detectado por referencias `\ref{}`
  indefinidas al compilar; ambas insertadas en su lugar correcto.
- `scripts/verificar_cobertura.sh` implementado y conectado a `make
  cobertura` (prometido desde Fase 0, pendiente hasta ahora).
- **Corrección de conteo:** el total de subtemas oficiales del programa es
  **66**, no 69 como se declaró por error en Fase 0 (nunca se había
  verificado contra el número real de filas de la tabla). Ver D2.1.

## 6. Cobertura del programa oficial

**14/66 (21.2 %)** — Unidad I completa (1.1.1 a 1.4.1, los 14 subtemas con
`\progtag{}` verificado por `make cobertura`). Partes II–V pendientes.

## 7. Decisiones editoriales

D2.1 (corrección de conteo 66 vs. 69) y D2.2 (referencias de Cap. 2/4 por
debajo del mínimo, reforzadas sin relleno artificial) — ambas en
`docs/decisiones-editoriales.md`.

## 8. Dudas y checkpoint

Este es el checkpoint de Fase 2 (§12 del prompt: *"Detente para mi revisión
de calidad y estilo antes de replicar el patrón"*). Antes de avanzar a la
Fase 3 (Partes II–V), pido su revisión de:

1. **Densidad de los capítulos** (§1 de este informe): ¿mantener esta
   densidad concisa o expandir hacia el rango orientativo de 20–35 páginas?
2. **Estilo y voz:** ¿la prosa en `onji-style` de estos 4 capítulos —tono,
   ritmo, uso de preguntas retóricas, tratamiento crítico de la serie
   Marketing X.0, del Cubo NORISO, de la LFPDPPP— es la que quiere replicar
   en las 4 Partes restantes, o hay ajustes de tono antes de fijar el
   patrón?
3. **Tratamiento de la LFPDPPP (Cap. 3):** conforme a D1.4, se presentó la
   tensión tácito-vs-informado con lenguaje atribuido a fuentes, sin postura
   legal propia. ¿Es el nivel de cautela correcto, o prefiere un tratamiento
   distinto?
4. **Pendiente #29 (referencias Cap. 2/4):** ¿autoriza que quede abierto
   hasta el cierre editorial final, o prefiere una ronda de investigación
   dirigida a esos dos capítulos antes de continuar con la Parte II?

No se avanza a la Fase 3 hasta recibir esta revisión.
