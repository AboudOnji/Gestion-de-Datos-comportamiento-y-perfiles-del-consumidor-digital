# Informe Fase 1 — Investigación por Parte

**Proyecto:** *Comportamiento del Consumidor Digital: Datos, Perfiles y Modelos*
**Fecha:** 2026-09-18
**Estado:** cerrada — checkpoint ligero (§12: "continúa salvo que haya dudas
bloqueantes"). Hay dudas abiertas (§9 de este informe) pero no bloquean el
inicio de Fase 2 salvo que el Dr. Barsekh-Onji decida lo contrario.

---

## 1. Resumen del método

Se lanzaron 5 agentes de investigación en paralelo, uno por Parte del libro,
cada uno con instrucciones específicas de alcance (capítulos y subtemas
oficiales que cubre, temas de Frontera aprobados que le aplican) y las mismas
reglas de rigor del prompt de proyecto (§5: jerarquía de fuentes, verificación
de datos, precisión conceptual, derechos de autor, citación APA vía
`biblatex`). Cada agente trabajó de forma aislada, escribiendo únicamente su
propio dossier (`docs/investigacion/parteN.md`) para evitar condiciones de
carrera sobre los archivos compartidos. Al cerrar los 5, el coordinador leyó
los cinco dossiers completos y consolidó manualmente sus hallazgos en
`bib/referencias.bib` y `docs/verificacion-datos.md`, resolviendo duplicados
de fuentes encontradas independientemente por más de un agente.

## 2. Texto generado

Ninguno — Fase 1 es investigación documental, no redacción. Los 18 capítulos
siguen sin contenido (el único texto del libro es el capítulo de prueba de
Fase 0). Cada dossier sí incluye, además de fuentes y datos, una sección de
"Hallazgos clave por capítulo" con recomendaciones de tratamiento editorial
para cuando se escriba cada capítulo en la Fase 2/3.

## 3. Figuras

Ninguna nueva. Siguen las 2 de Fase 0 (1 TikZ + 1 MATLAB de prueba).

## 4. Scripts corridos

Ninguno nuevo (no correspondía en esta fase).

## 5. Fuentes nuevas y datos verificados

- **64 referencias bibliográficas nuevas** consolidadas en `bib/referencias.bib`
  (más la `solomon2017` ya existente de Fase 0) — organizadas por Parte, con
  notas de trazabilidad. Incluyen fuentes primarias de dominio público
  (Marshall 1890, Veblen 1899, Pavlov/Anrep 1927), artículos fundacionales
  arbitrados (Maslow 1943; Fishbein y Ajzen 1975; Ajzen 1991; Tversky y
  Kahneman 1974; Kozinets 2002; Reichheld 2003; Kano et al. 1984, entre
  otros), meta-análisis recientes de alto rigor (Leung et al. 2022, *Journal
  of Marketing*; Barari et al. 2025, *JAMS*), y fuentes institucionales
  mexicanas verificadas (INEGI/ENDUTIH 2024 y 2025, ENIF 2024, DOF/LFPDPPP,
  AMVO, PROFECO).
- **46 filas de datos empíricos verificados** con fuente, URL/DOI y fecha de
  consulta en `docs/verificacion-datos.md`, organizadas por Parte.
- Validación técnica: `biber --tool --validate-datamodel bib/referencias.bib`
  sin advertencias; recompilación exitosa de `main.tex` (9 páginas, sin
  errores) con la bibliografía ampliada.

### 5.1 Hallazgos de mayor relevancia editorial

- **Correcciones de atribución en los 9 modelos de la Parte III** (más allá de
  la ya conocida "Howarth-Sheth"): el "modelo psicoanalítico de Freud" es en
  realidad la investigación motivacional de Ernest Dichter (años 1950); la
  pirámide de Maslow no existe en su artículo original de 1943 (es una
  simplificación posterior de consultores, atribuida a Charles McDermid,
  1960) y la jerarquía no era estrictamente secuencial en el planteamiento
  original; Pavlov (1927) es el año de la traducción académica, no del
  descubrimiento; la tesis de "burbuja de filtro" de Pariser (2011) está
  matizada por evidencia empírica posterior (Bakshy et al. 2015, *Science*).
- **AIDA (Cap. 6):** la atribución tradicional a E. St. Elmo Lewis (1898) es,
  según la investigación histórica más reciente (Iwamoto, 2024, *Japan
  Marketing History Review*), débilmente sustentada — el acrónimo lo acuñó
  C. P. Russell en 1921, y Sheldon/Dukesmith son mejores candidatos como
  formuladores del modelo.
- **NPS (Cap. 18):** la evidencia académica revisada por pares (Keiningham
  2007; van Doorn 2013; de Haan 2015 — las tres en revistas arbitradas) es
  consistentemente escéptica sobre la superioridad predictiva del NPS frente
  a la satisfacción simple. Requiere decisión editorial (duda #6, ver §9).
- **Neuromarketing (Cap. 15):** confirmado como campo con fundamentos
  neurocientíficos reales pero estructuralmente limitado por el "problema de
  la inferencia inversa" (Poldrack, 2006) y con autocrítica seria desde la
  propia disciplina (Plassmann et al., 2015). La mayoría de las "revisiones
  sistemáticas" de neuromarketing encontradas resultaron ser bibliométricas,
  no evaluaciones de rigor — hallazgo en sí mismo relevante para el capítulo.
- **LFPDPPP/INAI (Cap. 3):** cronología completa verificada (extinción
  constitucional del INAI, 20-dic-2024 → nueva LFPDPPP, 20-mar-2025 →
  transferencia de atribuciones a la Secretaría Anticorrupción y Buen
  Gobierno, formalizada 9-may-2025 → reforma adicional, 14-nov-2025), con una
  tensión normativa sin resolver entre consentimiento tácito y consentimiento
  informado que requiere revisión jurídica (duda #5, ver §9).
- **Etiquetas generacionales (Cap. 13):** confirmadas como constructos de
  mercado sin el mismo estatus científico que sugiere su uso extendido; el
  libro debe presentarlas explícitamente como convención de la industria, no
  como categoría demográfica validada.
- **Corrección de las cookies de terceros (Cap. 3):** Google revirtió su plan
  de depreciación en Chrome; en septiembre de 2026 las cookies de terceros
  siguen activas por defecto — corrige una narrativa muy extendida en
  material de marketing digital.

## 6. Pendientes abiertos

**28 datos/atribuciones pendientes de verificación adicional** antes del
cierre editorial de cada capítulo, consolidados en `docs/pendientes.md`
(sección "Pendientes de investigación — Fase 1"). Ninguno es bloqueante para
iniciar la redacción, pero cada uno debe resolverse o quedar como
`\datoPendiente{}` explícito antes de imprimir la cifra correspondiente.

## 7. Decisiones editoriales

- **D1.3** (`docs/decisiones-editoriales.md`): consolidación de `bib/referencias.bib`
  y `docs/verificacion-datos.md` desde los 5 dossiers, con 3 discrepancias
  menores entre agentes documentadas y sin resolver (orden de autoría de
  *El Cubo NORISO*; año de la 8.ª ed. de Hoyer/MacInnis/Pieters; orden de
  autoría del artículo de CES).

## 8. Cobertura del programa oficial

Sin cambios — sigue en 0/69 subtemas (`docs/cobertura.md`), como corresponde
antes de escribir contenido real de capítulo. La investigación de Fase 1
cubre conceptualmente los 69 subtemas (cada dossier mapea sus hallazgos a los
capítulos correspondientes), pero la matriz solo se actualiza cuando aparezcan
las etiquetas `\label{prog:X.Y.Z}` en el `.tex` de cada capítulo (Fase 2+).

## 9. Dudas para el Dr. Barsekh-Onji

4 preguntas nuevas en `docs/dudas.md` (sección "Abiertas al cierre de
Fase 1"), además de las ya resueltas de Fase 0:

5. Si prefiere una revisión jurídica independiente del Cap. 3
   (LFPDPPP/consentimiento) y del recuadro de patrones oscuros antes de
   redactar, o avanzar con lenguaje cauteloso y ajustar después.
6. Postura editorial ante el NPS: crítica académica firme vs. tratamiento más
   equilibrado con la práctica dominante de la industria.
7. Si citar las ediciones más recientes de la bibliografía oficial (Solomon
   14.ª ed., Hoyer 8.ª ed., Kotler/Keller/Chernev 17.ª ed.) como referencia
   principal, o mantenerse alineado a las ediciones exactas del programa
   oficial.
8. **Autorización para iniciar Fase 2** (piloto de la Parte I completa —
   Cap. 1–4, con laboratorio, prácticas oficiales y autoevaluación).

## 10. Próximos pasos

Con la investigación de las 5 Partes completa y consolidada, el proyecto está
listo para la Fase 2 (§12 del prompt): redactar la Parte I completa como
piloto de calidad y estilo, con el material de respaldo ya verificado en
`bib/referencias.bib` y `docs/verificacion-datos.md`. Se espera la respuesta a
las dudas 5–7 (o autorización explícita de avanzar sin resolverlas primero,
duda #8) antes de comenzar.
