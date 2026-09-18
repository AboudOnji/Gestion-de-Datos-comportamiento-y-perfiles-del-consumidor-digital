# Informe Fase 0 — Auditoría y andamiaje

**Proyecto:** *Comportamiento del Consumidor Digital: Datos, Perfiles y Modelos*
**Fecha:** 2026-09-18
**Estado:** ⏸ Checkpoint — no se avanza a Fase 1 sin autorización.

---

## 1. Verificación del Anexo A contra el PDF escaneado

Se leyeron visualmente las 14 páginas de
`Laboratorio Gestión de datos, comportamiento y perfiles.pdf` (escaneo NAPS2,
sin capa de texto; se verificó imagen por imagen, no OCR). El Anexo A del
prompt es **fiel al programa oficial** en todos sus contenidos, subtemas,
horas por unidad, bibliografía, cibergrafía y recursos digitales. Tres
hallazgos adicionales, ya incorporados a `docs/decisiones-editoriales.md`:

1. **Horas de 2.3 y 2.4 NO son ambiguas** (corrige el supuesto del Anexo B.4
   del prompt): el escaneo (hoja 5/14) separa con claridad
   2.3 = (T2.0/P3.0/AA1.0) y 2.4 = (T2.0/P3.0/AA2.0); la suma cuadra
   exactamente con el subtotal impreso (8.0/15.0/7.0). Se retiran las marcas
   «(≈)» de la tabla arquitectónica del §7 para los Cap. 7 y 8 (ver §3 abajo).
2. **La numeración de hoja "de 12" / "de 14" se explica**: el escaneo une dos
   subdocumentos con paginación propia (portada "Programa Sintético" + hoja 2,
   numeradas "de 12"; hojas 3–14, "Programa de Estudios", numeradas "de 14").
   No falta información; es un artefacto de encuadernado/escaneo.
3. Confirmadas sin cambios: salto 4.2.3→4.2.5 (Anexo B.1), "Howarth-Sheth"
   (Anexo B.2), bibliografía/cibergrafía 2015–2021 (Anexo B.3), Unidad II con
   una sola práctica de 15 h (Anexo B.5).

Todos los totales de horas por Unidad (T/P/AA) y el gran total (108 h con
docente + 32 h AA = 140 h) cuadran exactamente contra los subtotales impresos
en el escaneo.

## 2. Andamiaje creado

Estructura completa según §11 del prompt bajo
`libro-consumidor-digital/` (dentro de esta misma carpeta, aún sin repositorio
Git remoto — ver §7 "Pendientes de este checkpoint"):

```
libro-consumidor-digital/
├── CLAUDE.md · main.tex · preamble.tex · Makefile · .gitignore
├── config/            colores.tex, macros.tex, listings-matlab.tex
├── frontmatter/       portada.tex, mapa-cobertura.tex, capitulo-prueba.tex
├── partes/parte{1..5}/            (vacíos, listos para Fase 2–3)
├── figuras/{tikz,matlab}/         (1 TikZ + 2 MATLAB de prueba)
├── matlab/{cap01..cap18,utils}/   (vacíos) · fase0_prueba/ · run_all.m
├── datos/{sinteticos,reales}/README.md
├── apendices/ · bib/referencias.bib
└── docs/{cobertura.md, decisiones-editoriales.md, verificacion-datos.md,
         pendientes.md, dudas.md, registro-matlab.md, investigacion/,
         beamer/, informes/fase0.md}
```

## 3. Texto generado

Solo el **capítulo de prueba de andamiaje**
(`frontmatter/capitulo-prueba.tex`, ~1 página) y el **mapa de cobertura**
(`frontmatter/mapa-cobertura.tex`). Ningún capítulo real (1–18) tiene
contenido todavía — corresponde a la Fase 2 (piloto Parte I).

## 4. Figuras — generadas y verificadas

| Figura | Tipo | Estado |
|---|---|---|
| `figuras/tikz/fase0-diagrama-prueba.tex` | TikZ (3 cajas + flechas) | Compila y se ve correctamente en el PDF |
| `figuras/matlab/fase0_bass_prueba.pdf` / `.png` | MATLAB (modelo de Bass, datos sintéticos ilustrativos) | Ejecutado, exportado, verificado visualmente |

2/2 figuras generadas y verificadas visualmente (mínimo del checkpoint de
Fase 0 cumplido: 1 recuadro + 1 TikZ + 1 MATLAB + 1 cita, todo en el mismo
capítulo de prueba).

## 5. Scripts MATLAB corridos y su estado

| Script | Estado | Notas |
|---|---|---|
| `matlab/fase0_prueba/script_prueba.m` | ✅ OK | Ver `docs/registro-matlab.md`. Corregido un bug propio de escape de acentos (`\'e` manual → se usa UTF-8 directo) y confirmado que los warnings de `SceneNode` con `Interpreter,'latex'` + acentos en modo `-batch` son benignos (la figura renderiza bien). |
| `matlab/run_all.m` | ✅ OK | Corregido: cada script se ejecuta como subproceso `matlab -batch` independiente, no con `run()` en el mismo workspace (evita que el `clear` de cada script de capítulo borre las variables del orquestador). |

**MCP de MATLAB** (`mcp__matlab__*`): no logra adjuntarse a una sesión en este
entorno («failed to attach to MATLAB session»); se usó el fallback documentado
en §9 del prompt (`matlab -batch`). MATLAB instalado: **R2026a** (nota: el
`CLAUDE.md` raíz del workspace indica R2025b; es una discrepancia de entorno
del sistema, no de este proyecto — aviso, sin acción tomada). Toolboxes
confirmadas relevantes para el catálogo §9.2: Statistics and Machine Learning,
Fuzzy Logic, Signal Processing, Text Analytics — todas presentes.

## 6. Fuentes nuevas y datos verificados

Una sola referencia bibliográfica cargada (para probar la cadena de citación):
Solomon, M. (2017), *Comportamiento del consumidor*, 11.ª ed., Pearson —
tomada directamente de la bibliografía básica oficial (verificada contra el
escaneo, hoja 12/14). Sin cifras empíricas nuevas incorporadas todavía
(`docs/verificacion-datos.md` está vacío a propósito; el capítulo de prueba
solo usa datos sintéticos rotulados).

## 7. Pendientes abiertos (`\pendiente` / `\datoPendiente`)

Ver `docs/pendientes.md` — 4 pendientes, ninguno bloqueante:
sustitución del capítulo de prueba, confirmación del HEX guinda/dorado IPN,
posible migración a `biblatex-apa`, y glosario sin entradas todavía.

## 8. Decisiones editoriales

6 decisiones registradas en `docs/decisiones-editoriales.md` (D0.1–D0.6):
renumeración 4.2, corrección Howard-Sheth, aclaración de horas 2.3/2.4,
explicación de la numeración de hoja, uso de `natbib`+`apalike`, y diseño de
`run_all.m` como orquestador de subprocesos.

## 9. Dudas para el Dr. Barsekh-Onji

Ver `docs/dudas.md` — 4 preguntas abiertas: instalación de `biblatex-apa`,
visto bueno a la priorización de temas de Frontera (§10 abajo), confirmación
del HEX institucional IPN, y el criterio para calibrar (o no) el ejemplo del
modelo de Bass del Cap. 1 con datos reales citables.

## 10. Ajustes propuestos a la arquitectura (§7 del prompt)

- **Cap. 7 y 8:** se elimina la marca «(≈)» de incertidumbre en horas; quedan
  fijas en (2/3/1) y (2/3/2) respectivamente, según D0.3.
- **Resto de la arquitectura de 18 capítulos / 5 Partes se valida sin
  cambios**: los subtotales de horas de las Unidades III, IV y V cuadran
  exactamente contra el reparto propuesto en el §7 del prompt.
- Sugerencia menor (no ejecutada, pendiente de su visto bueno): dado que la
  Unidad II tiene una sola práctica integradora de 15 h (D_prompt Anexo B.5,
  ya contemplado en el prompt), conviene que el capítulo de cierre de la
  Parte II (Cap. 8) incluya explícitamente el entregable final de esa
  práctica de cuatro sesiones, para que quede visualmente distinto de los
  demás cierres de Parte (que consolidan 2 prácticas, no 1 con 4 sesiones).

## 11. Plan de investigación propuesto para la Fase 1

- Un dossier por Parte (`docs/investigacion/parteN.md`), paralelizable con
  subagentes como sugiere el prompt.
- Prioridad de fuentes estadísticas a verificar primero (por su uso
  transversal en varios capítulos): ENDUTIH (INEGI, edición más reciente),
  Asociación de Internet MX (estudio de hábitos más reciente, reemplaza la
  edición 2021 citada en el programa oficial), estado vigente de la LFPDPPP
  tras las reformas de 2025 y la reasignación de atribuciones del antiguo
  INAI (crítico para el Cap. 3 y el tema de Frontera #3).
- Verificar en Fase 1, no asumir ahora: vigencia y URL activa de los tres
  recursos digitales del programa (García 2020, Fernández 2019, Ideapuerto
  2020) — es probable que al menos alguno ya no esté disponible; si es así,
  se documenta como cibergrafía histórica y se reemplaza por un recurso
  vigente equivalente.

## 12. Priorización de temas de Frontera (§6 del prompt)

Evaluados con los tres criterios del prompt (relevancia / madurez de
evidencia / cabida en horas). **Pendiente de su visto bueno** (duda #2 en
`docs/dudas.md`) antes de comprometerla en la Fase 1.

**Prioridad alta** (evidencia madura, alta relevancia curricular, cabida clara):
1. Datos de primera/cero parte, consentimiento y fin de cookies de terceros +
   marco mexicano de protección de datos (Cap. 3).
2. Economía conductual aplicada: heurísticas, sesgos, *nudges* (Cap. 5, 10–11, 14).
3. Patrones oscuros y autonomía del consumidor, con PROFECO/LFPC vs.
   GDPR/DSA (Cap. 3, 14; ética transversal).
4. Recorrido no lineal / crítica al embudo lineal / *messy middle* (Cap. 6).
5. Segmentación difusa como alternativa a la segmentación rígida (Cap. 2,
   laboratorio) — conecta directamente con la línea de investigación del
   Dr. Barsekh-Onji; ya está en el catálogo de laboratorio §9.2 (fuzzy c-means).
6. Brecha digital en México con datos ENDUTIH (Cap. 3, 13).

**Prioridad media** (relevantes pero con evidencia más cambiante o más
técnica; requieren marco "Vigente a [mes año]" explícito):
7. IA generativa y agentes de compra / comercio agéntico (Cap. 1, 6, 12).
8. Sistemas de recomendación y burbujas de filtro (Cap. 12).
9. Comercio social, *live commerce* y economía de creadores (Cap. 7, 13, 17).
10. Consumo sostenible: brecha actitud-conducta y *greenwashing* (Cap. 1, 14).

**Prioridad baja / mayor riesgo** (evidencia joven o el tema ya es contenido
oficial obligatorio, no adicional):
11. Personas sintéticas con LLM ("muestras de silicio") (Cap. 2, 7) —
    validez todavía en debate activo en la literatura; tratar con marco
    crítico explícito, no como herramienta ya validada.
12. Neuromarketing con criterio científico (Cap. 15) — **no es en rigor un
    tema de Frontera**: el neuromarketing ya es contenido oficial (4.3); lo
    que aporta este punto (problema de la inferencia inversa, reproducibilidad)
    se integra directamente al capítulo, no como recuadro adicional.

## 13. Próximos pasos (requieren autorización para Fase 1)

1. Confirmar o ajustar la priorización de temas de Frontera (§12 arriba).
2. Decidir sobre `biblatex-apa` (duda #1).
3. `git init` + commit de este checkpoint (ver nota abajo).
4. Iniciar Fase 1: dossiers de investigación por Parte.

**Nota sobre control de versiones:** el directorio del proyecto no era un
repositorio Git al iniciar Fase 0. Se preparó `.gitignore` y toda la
estructura queda lista para `git init` + primer commit, pero **no se ha
ejecutado** — se deja pendiente de confirmación explícita en el checkpoint,
dado que crear un repositorio y su primer commit es una acción que conviene
confirmar contigo antes de fijarla como línea base del proyecto.
