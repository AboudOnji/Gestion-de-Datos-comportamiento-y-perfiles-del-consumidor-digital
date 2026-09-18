# Prompt para Claude Code — Libro de texto y manual de laboratorio

## *Comportamiento del Consumidor Digital: Datos, Perfiles y Modelos*
### Unidad de aprendizaje: Laboratorio: Gestión de datos, comportamiento y perfiles del consumidor digital
### Licenciatura en Mercadotecnia Digital · ESCA Unidad Santo Tomás · IPN

> la carpeta que contiene el PDF del programa de la unidad de aprendizaje (probablemente `Laboratorio_Gestio_n_de_datos__comportamiento_y_perfiles.pdf`) y pega todo lo que sigue. La primera acción es la **Fase 0**; no avances más allá de cada *checkpoint* sin mi autorización.

---

## 1. MISIÓN Y ROL

Actúa como asistente de redacción académica, investigación y desarrollo de material didáctico para el **Dr. Aboud Barsekh-Onji**, quien impartirá esta unidad de aprendizaje en la Escuela Superior de Comercio y Administración - Unidad Santo Tomás del Instituto Politécnico Nacional.

Tu misión es desarrollar, **en LaTeX**, el contenido completo de la unidad como un **libro de texto y manual de laboratorio** (mismo enfoque que el libro de *Relaciones Intergubernamentales* que ya elaboramos: texto de autor, con argumento propio, figuras y diagramas integrados, y estructura por semanas). Después usaré el formato Beamer estilo IPN para construir, semana por semana, las presentaciones de clase **a partir de este libro**; por eso el libro debe estar modularizado y sus figuras deben poder reutilizarse (ver §14).

Tres compromisos no negociables:

1. **Fidelidad al programa oficial.** Todo tema del programa se cubre; nada oficial se elimina (ver §4).
2. **Rigor académico verificable.** Investiga de verdad, cita fuentes reales y no inventes datos (ver §5).
3. **Ejemplos y laboratorio en MATLAB**, ejecutados y verificados (ver §9).

Tienes **libertad de cátedra delegada**: puedes proponer, integrar o reordenar temas novedosos siempre que dejes trazabilidad (ver §6).

---

## 2. CONTEXTO DE LA UNIDAD (datos duros del programa)

| Campo | Valor |
|---|---|
| Institución | Instituto Politécnico Nacional · Secretaría Académica · Dirección de Educación Superior |
| Unidad académica | Escuela Superior de Comercio y Administración (ESCA), Unidad Santo Tomás |
| Programa | Licenciatura en Mercadotecnia Digital |
| Semestre / área | 3.º semestre · Formación Profesional |
| Tipo / modalidad | Teórico-práctica, obligatoria · Escolarizada |
| Vigente a partir de | Agosto 2022 (aprobado por la Comisión de Programas Académicos del H. Consejo General Consultivo del IPN, 22/11/2021) |
| Créditos | TEPIC 8.0 · SATCA 8.35 |
| Horas | Teoría 2.0 h/sem (36 h) · Práctica 4.0 h/sem (72 h) · **Total con docente 108 h = 18 semanas** · Aprendizaje autónomo 32 h |
| Propósito | *Analiza el comportamiento del consumidor digital a partir de sus modelos, factores socioculturales y psicológicos.* |
| Método / estrategia | Métodos deductivo y activo · Estrategia de aprendizaje: **estudio de casos** |

**Relación curricular** (define los límites de alcance; no invadas el terreno de las materias consecuentes, pero prepara los cimientos):
- Antecedente: *Mercadotecnia e innovación empresarial*; *Laboratorio: Sistemas de información en los negocios*.
- Lateral: *Mercadotecnia Digital*; *Investigación y Análisis de Mercados Digitales*; *Dirección y Liderazgo Global*.
- Consecuente: *Lab.: Administración de redes sociales para la mercadotecnia digital*; *Lab.: Analítica de datos en la mercadotecnia digital*; *Lab.: Herramientas y aplicaciones de e-commerce*.

**Intención educativa** (el libro debe reflejarla): habilidades de análisis del comportamiento del consumidor digital para generar estrategias de posicionamiento con valor agregado; trabajo en equipo, liderazgo, comunicación asertiva, responsabilidad y **uso de la información con un alto sentido ético** (por eso la ética de datos es transversal, no un capítulo aislado).

---

## 3. AUDIENCIA Y VOZ

- **Audiencia:** estudiantes de licenciatura de 3.er semestre, con formación en mercadotecnia y sistemas de información de negocios. **No se asume programación previa ni estadística avanzada.** El libro incluye un apéndice de *estadística mínima para el laboratorio* (media, desviación, correlación, regresión simple, prueba de hipótesis básica) y un *primer de MATLAB* (§9).
- **Idioma:** español de México. Términos técnicos en inglés en cursivas (`\textit{customer journey}`), con su equivalente en español la primera vez.
- **Estilo:** usa el skill **`onji-style`** (ya dado de alta en este entorno) para toda la prosa: introducciones, desarrollo conceptual, transiciones y síntesis. Calibra la densidad al nivel de licenciatura: definiciones nítidas, primero el porqué y luego el cómo, ejemplos cotidianos y del mercado mexicano, cero jerga gratuita, cero relleno retórico. Es un texto de autor con tesis, no un compendio.
- **Educación 4.0 y Modelo Educativo Institucional:** el libro está centrado en el aprendizaje. Cada capítulo declara resultados de aprendizaje observables y actividades activas (estudio de casos, trabajo colaborativo, debate).

---

## 4. FUENTE DE VERDAD: PROGRAMA OFICIAL Y REGLAS DE FIDELIDAD

1. Lee el PDF del programa (es un escaneo; verifica visualmente cada página). En el **Anexo A** al final de este prompt está mi transcripción estructurada; **contrástala contra el PDF** y corrige discrepancias, reportándolas en el informe de la Fase 0.
2. Construye una **matriz de cobertura** (`docs/cobertura.md` y `frontmatter/mapa-cobertura.tex`) que mapee **cada subtema oficial** (1.1.1, 1.1.2, …, 5.1.4) al capítulo y sección del libro donde se desarrolla. Cobertura objetivo: **100 %**. La matriz se verifica automáticamente al final de cada Parte (script que compare la lista oficial contra las etiquetas `\label{prog:X.Y.Z}` presentes en el `.tex`).
3. **Libertad de cátedra con trazabilidad:** puedes (a) añadir contenido novedoso, (b) reordenar o fusionar temas, (c) corregir errores evidentes del programa. Cada decisión se registra en `docs/decisiones-editoriales.md` con: qué cambió, por qué, qué evidencia lo respalda y su impacto en horas. **Lo añadido se marca visualmente** (recuadro «Frontera», §6) y lo oficial nunca se elimina.
4. Las **anomalías detectadas** en el programa (Anexo B) se resuelven con el criterio indicado allí y se documentan.
5. Respeta los **nombres oficiales** de las prácticas, evidencias del portafolio y estrategias de aprendizaje; el libro debe servir como insumo directo para ellas.

---

## 5. RIGOR ACADÉMICO E INVESTIGACIÓN

**Investiga con las herramientas de búsqueda y lectura web disponibles.** No escribas cifras, fechas, autorías ni afirmaciones empíricas «de memoria».

### 5.1 Jerarquía de fuentes
1. **Fuentes primarias u originales** de cada modelo (p. ej., Marshall, Pavlov, Veblen, Maslow, Howard y Sheth, Fishbein y Ajzen, Ajzen, O'Shaughnessy) — consulta la obra original o una edición académica confiable.
2. **Artículos revisados por pares** (p. ej., *Journal of Consumer Research*, *Journal of Marketing*, *Journal of Consumer Psychology*, *Journal of Interactive Marketing*, *Marketing Science*, *Journal of Retailing*, *Computers in Human Behavior*) y revisiones sistemáticas recientes.
3. **Libros de texto** de la bibliografía oficial (Solomon; Hoyer, Macinnis y Pieters; Kotler; Delgado et al.; Diamantstein) y complementaria (Palmer, Sheridan, Mejía y Gómez). Verifica en su edición vigente.
4. **Fuentes estadísticas e institucionales:** INEGI (ENDUTIH), IFT, Asociación de Internet MX, PROFECO, ONU/PNUMA, OCDE, UIT, CONDUSEF/Banxico donde aplique, y reportes de la industria con metodología pública (indica siempre la metodología y el año).
5. **Prensa especializada y blogs:** solo como complemento y contexto; **nunca como única fuente de un dato**.

### 5.2 Verificación de datos (obligatoria)
- Todo dato empírico con cifra se registra en `docs/verificacion-datos.md`: *dato · cifra · año · fuente · URL/DOI · fecha de consulta · ubicación en el libro*.
- Si no puedes verificarlo en fuente primaria, **no lo incluyas**; deja `\datoPendiente{descripción de lo que falta}` (macro visible en el PDF y listada en `docs/pendientes.md`).
- Los datos del programa oficial (Asociación de Internet MX 2021, Merca 2.0 2021, etc.) son de 2021: **actualízalos** con la edición más reciente disponible y conserva la referencia histórica solo si aporta comparación.

### 5.3 Atribuciones y precisión conceptual
- **Verifica la autoría y el sentido original** de cada tipología y modelo antes de atribuirlo. Ejemplos a verificar: quién formuló los cuatro tipos de comportamiento de compra (complejo, reductor de disonancia, habitual, variado) y cómo lo presentan Kotler y Solomon; la formulación original de Howard–Sheth (1969); cómo se incorpora «Freud» al análisis del consumidor (vía investigación motivacional); la relación entre acción razonada y conducta planeada.
- Distingue siempre **el modelo original** de **su lectura moderna en marketing digital**.
- Incluye por cada modelo: supuestos, variables, aportes, **críticas y límites** (validez empírica, reproducibilidad, sesgos).
- **Contrasta críticamente el discurso popular del marketing** (p. ej., «consumidor 1.0 → 5.0», etiquetas generacionales como categorías científicas, *buyer persona*, promesas del neuromarketing): separa evidencia de narrativa comercial.

### 5.4 Citación
- **APA 7.ª edición** con `biblatex` + `biber` (`biblatex-apa`). Si no está instalado, usa `natbib` con estilo `apalike` y avísame.
- `bib/referencias.bib` con DOI/URL y fecha de consulta para web. Cita con página cuando haya cita textual.
- Mínimo por capítulo: **≥ 12 referencias**, de las cuales **≥ 5** primarias o revisadas por pares.

### 5.5 Derechos de autor
- No reproduzcas párrafos, tablas ni figuras de libros o artículos. **Parafrasea, sintetiza y cita.** Citas textuales ≤ 40 palabras y con página.
- Redibuja las figuras conceptuales con TikZ/MATLAB y rotula «Adaptado de …» cuando el esquema derive de una fuente. No incluyas capturas de pantalla de plataformas de terceros (son efímeras y con derechos): descríbelas o esquematízalas.

### 5.6 Casos
- **Casos reales**: con fuente y fecha verificables. **Casos didácticos**: rotulados explícitamente *«Caso ilustrativo (ficticio)»*. **Nunca inventes cifras atribuidas a empresas reales.**

### 5.7 Vigencia de «Temas selectos»
- El programa deja abiertos los «Temas selectos de buscadores y plataformas de gestión integral, redes sociales y comercio electrónico» (§1.4.1, 2.4.1, 3.3.2, 4.4.1). Investiga el panorama **vigente hoy** (usa la fecha del sistema), rotula cada recuadro *«Vigente a [mes año]»* y prioriza criterios de análisis duraderos sobre listas de herramientas que envejecen.

### 5.8 Datos sintéticos (para el laboratorio)
- Están **permitidos** en los ejemplos MATLAB siempre que: (a) se generen con un script reproducible (`rng(42)`), (b) se rotulen «Datos sintéticos» en el texto, en el script y en la leyenda de la figura, y (c) **nunca** se presenten como evidencia empírica ni se usen para afirmar hechos del mercado.
- Los datos reales solo se incluyen si su licencia lo permite; si no, guarda la URL y las instrucciones de descarga en `datos/reales/README.md` en lugar del archivo.

---

## 6. LIBERTAD DE CÁTEDRA: TEMAS DE FRONTERA (sugerencias, no lista cerrada)

Evalúa cada tema con tres criterios: **(a)** relevancia para la competencia de la unidad, **(b)** madurez de la evidencia, **(c)** cabida en las horas. Intégralo como recuadro «Frontera» o subsección de **≤ 3 páginas**; registra la decisión (también las que descartes). Verifica todo lo normativo y tecnológico al día de hoy.

1. **IA generativa y agentes de compra:** buscadores generativos, asistentes de compra, comercio «agéntico»; efecto en el *customer journey* y en el papel del influenciador y del evaluador *(Cap. 1, 6, 12)*.
2. **Personas sintéticas con LLM** («muestras de silicio»): promesas y límites de validez frente al *buyer persona* tradicional *(Cap. 2, 7)*.
3. **Datos de primera y de cero parte, consentimiento y fin/reconfiguración de las *cookies* de terceros:** estado actual; marco mexicano de protección de datos personales (verifica el estado vigente de la LFPDPPP tras las reformas de 2025 y la reasignación de atribuciones del antiguo INAI) *(Cap. 3)*.
4. **Patrones oscuros (*dark patterns*) y autonomía del consumidor**, con referencia a PROFECO/LFPC y comparación con GDPR/DSA *(Cap. 3, 14; ética transversal)*.
5. **Economía conductual aplicada:** heurísticas, sesgos, *nudges* (Kahneman–Tversky; Thaler–Sunstein; Palmer 2021 de la bibliografía complementaria) *(Cap. 5, 10–11, 14)*.
6. **Recorrido no lineal:** crítica al embudo lineal; *consumer decision journey*, «*messy middle*» y modelos de bucle *(Cap. 6)*.
7. **Comercio social, *live commerce* y economía de creadores:** micro/nano-influencers, transparencia publicitaria *(Cap. 7, 13, 17)*.
8. **Consumo sostenible:** brecha actitud–conducta y *greenwashing*; ONU/PROFECO *(Cap. 1, 14)*.
9. **Sistemas de recomendación y burbujas de filtro** *(Cap. 12)*.
10. **Neuromarketing con criterio científico:** problema de la inferencia inversa, reproducibilidad y ética *(Cap. 15)*.
11. **Brecha digital en México** con datos ENDUTIH; *mobile-first*, pagos digitales y fintech *(Cap. 13, 3)*.
12. **Segmentación difusa (pertenencia parcial a varios perfiles)** como alternativa a la segmentación rígida; conecta con mi línea de investigación en clustering difuso *(Cap. 2, laboratorio)*.

---

## 7. ARQUITECTURA DEL LIBRO

**Cinco Partes = cinco unidades temáticas; 18 capítulos ≈ 18 semanas** (cada capítulo = una semana de 2 h de teoría + 4 h de laboratorio; el §3.2 ocupa dos semanas). **Valida esta arquitectura en la Fase 0** y propón ajustes justificados si el programa lo exige.

| Cap. | Sem. | Programa | T / P / AA (h) | Título tentativo | Práctica oficial asociada |
|---|---|---|---|---|---|
| **PARTE I — Comportamiento, perfil y gestión de datos** | | | | | |
| 1 | 1 | 1.1 | 2 / 4 / 2 | El consumidor digital: evolución, impacto y ventajas de su análisis | P1 «El consumidor digital y su perfil» (7 h) = Cap. 1–2 |
| 2 | 2 | 1.2 | 2 / 3 / 2 | Perfil, segmentación y mercado meta digital | P1 (cont.) |
| 3 | 3 | 1.3 | 2 / 5 / 2 | Gestión de datos del consumidor: valor, omnicanalidad, escucha y decisión | P2 «Buscadores y plataformas en la gestión de datos del consumidor digital» (8 h) = Cap. 3–4 |
| 4 | 4 | 1.4 | 2 / 3 / 1 | Base tecnológica: buscadores, plataformas, redes y comercio electrónico | P2 (cont.) |
| **PARTE II — Proceso de decisión de compra digital** | | | | | |
| 5 | 5 | 2.1 | 2 / 4 / 2 | El proceso de decisión de compra | P única «Recorrido del consumidor digital» (15 h) = Cap. 5–8 |
| 6 | 6 | 2.2 | 2 / 5 / 2 | *Customer journey*: del interés a la satisfacción y su mapeo | P (cont.) |
| 7 | 7 | 2.3 | 2 / 3 / 1 (≈) | Figuras participantes en la decisión digital | P (cont.) |
| 8 | 8 | 2.4 | 2 / 3 / 2 (≈) | Base tecnológica para el análisis del recorrido | P (cont.) |
| **PARTE III — Modelos de comportamiento del consumidor digital** | | | | | |
| 9 | 9 | 3.1 | 2 / 4 / 2 | Tipos de comportamiento de compra | P1 «Análisis del comportamiento del consumidor» (5 h) ≈ Cap. 9 + 1 h |
| 10 | 10 | 3.2.1–3.2.4 | 2 / 4 / 1.5 | Modelos clásicos: Marshall, Pavlov, Veblen, Freud | P2 «Análisis de modelos de estudio del comportamiento del consumidor digital» (10 h) ≈ Cap. 10–12 |
| 11 | 11 | 3.2.5–3.2.9 | 2 / 4 / 1.5 | Modelos cognitivos e integradores: Fishbein–Ajzen, O'Shaughnessy, Maslow, Howard–Sheth, etnográfico | P2 (cont.) |
| 12 | 12 | 3.3 | 2 / 3 / 1 | Digitalización y tecnología en el proceso de compra | P2 (cont.) |
| **PARTE IV — Factores socioculturales y psicológicos** | | | | | |
| 13 | 13 | 4.1 | 2 / 4 / 2 | Factores socioculturales | P1 «Factores socioculturales» (7 h) |
| 14 | 14 | 4.2 | 2 / 5 / 2 | Factores psicológicos | P2 «Factores psicológicos» (8 h) = Cap. 14–15 |
| 15 | 15 | 4.3 | 2 / 3 / 1 | Neuromarketing | P2 (cont.) |
| 16 | 16 | 4.4 | 2 / 3 / 1 | Base tecnológica para el análisis de factores | P1/P2 (según distribución) |
| **PARTE V — Análisis integral** | | | | | |
| 17 | 17 | 5.1.1–5.1.2 | 2 / 6 / 3 | Análisis integral en internet, medios digitales y redes sociales | P1 «El comportamiento del consumidor digital y su interacción con la tecnología» (6 h) |
| 18 | 18 | 5.1.3–5.1.4 | 2 / 6 / 3 | Experiencia, satisfacción y relación con clientes en medios digitales | P2 «Uso de las redes sociales: comportamiento de compra» (6 h) |

Notas: (≈) el escaneo no permite fijar con certeza cuál fila de horas corresponde a 2.3 y a 2.4; el reparto por capítulo en las Partes III–IV es aproximado. Cada Parte termina con una sección **«Prácticas oficiales de la unidad»** (guía formal con nombre y horas oficiales) que consolida los segmentos de laboratorio de los capítulos.

**Material de cierre del libro:** glosario; apéndice de estadística mínima; primer de MATLAB e instalación; catálogo de datasets sintéticos; banco de reactivos para evaluación escrita; bibliografía integrada; índice analítico.

---

## 8. PLANTILLA DE CAPÍTULO (obligatoria)

1. **Ficha del capítulo:** unidad, temas del programa (con `\label{prog:X.Y.Z}`), horas T/P/AA, competencia de la unidad, **resultados de aprendizaje observables**, prerrequisitos.
2. **Caso de apertura / pregunta detonadora** (real y breve, o ficticio rotulado).
3. **Desarrollo teórico:** definiciones, autores, modelos, con diagramas TikZ.
4. **Evidencia de México y del mundo** (datos verificados, año y fuente en cada cifra).
5. **Recuadro «Frontera»** (cuando aplique, §6).
6. **Recuadro «Ética y responsabilidad con los datos»** (obligatorio en todos los capítulos).
7. **Laboratorio MATLAB:** objetivo, concepto detrás del código, script comentado, salida esperada (figura), interpretación de negocio, **«Ejercicio propuesto»** y extensión opcional.
8. **Estudio de caso** con preguntas guía (estrategia oficial de la unidad).
9. **Actividades y evidencias del portafolio** alineadas con los nombres oficiales de la unidad (reporte de indagación, exposición, infografía, organizador gráfico, wiki, ensayo, reporte de práctica…), con criterios de evaluación breves.
10. **Ruta de aprendizaje autónomo** (horas AA oficiales del capítulo → tareas concretas).
11. **Síntesis (ideas clave), glosario del capítulo y autoevaluación** (opción múltiple + preguntas abiertas con clave y justificación).
12. **Lecturas recomendadas** (anotadas, 3–5 líneas cada una) y referencias.

Extensión orientativa: 20–35 páginas por capítulo incluyendo laboratorio; 2–4 páginas de introducción por Parte.

---

## 9. LABORATORIO EN MATLAB

**Entorno:** MATLAB R2026a está instalado en el ThinkPad (Ubuntu 24.04). Verifica con `which matlab` y lista toolboxes con `matlab -batch "ver"`. Ejecuta con `matlab -batch "run('ruta/script.m')"`. **Si MATLAB no está disponible en esta sesión** (p. ej., estás en el servidor): escribe el código, márcalo `PENDIENTE DE EJECUCIÓN` en `docs/pendientes.md` y **no inventes salidas ni figuras**.

### 9.1 Convenciones (modo docencia)
- Encabezado estándar (título, autor «Prof. D.Sc. Barsekh-Onji Aboud», institución «IPN — ESCA Unidad Santo Tomás», fecha, descripción) y secciones `%%` numeradas: Parámetros → Datos → Procesamiento → Resultados y visualización.
- `clc; clear; close all; rng(42);` al inicio. Comentarios **en español** que expliquen el *porqué*. Nombres de variable significativos. Preasigna arreglos; vectoriza.
- Imprime resultados intermedios y grafica en cada paso clave. Figuras: `figure('Color','w')`, etiquetas, título, leyenda, `grid on`, intérprete LaTeX. Exporta con `exportgraphics(gcf,'figuras/matlab/capNN_nombre.pdf','ContentType','vector')` (y PNG a 300 dpi para Beamer).
- Cada script declara al inicio: **toolboxes requeridas** (prefiere MATLAB base; marca las dependencias de *Statistics and Machine Learning*, *Fuzzy Logic*, *Text Analytics*, *Signal Processing*, etc.) y **tiempo de ejecución** (meta: < 60 s).
- Formato `.m` con secciones (publicable con `publish`), **no** `.mlx`. Estructura: `matlab/capNN/`, funciones reutilizables en `matlab/utils/`, y `matlab/run_all.m` que ejecuta todo y registra fallos en `docs/registro-matlab.md`.
- Generadores de datos sintéticos en `matlab/utils/generar*.m`; CSV resultantes en `datos/sinteticos/` con `datos/README.md` (semilla, variables, propósito, rótulo «sintético»).
- Las prácticas del programa sobre «buscadores y plataformas» requieren **herramientas reales**: diséñalas con opciones gratuitas o de demostración cuyo acceso y términos hayas verificado hoy (sin depender de credenciales de pago), y usa MATLAB para **analizar los datos exportados**.

### 9.2 Catálogo sugerido de ejemplos (sustituye lo que no funcione mejor)

| Cap. | Ejemplo de laboratorio | Técnica |
|---|---|---|
| 1 | Difusión de la adopción de un canal digital (modelo de Bass) con parámetros ilustrativos | ODE / simulación |
| 2 | Segmentación con *k-means* y con **fuzzy c-means** (pertenencia parcial); perfiles en radar | Clustering, silueta |
| 3 | Limpieza y calidad de datos, RFM, CLV simple y prueba A/B para decidir | `table`, estadística |
| 4 | Serie de interés de búsqueda (CSV exportado): tendencia y estacionalidad; frecuencia de términos de escucha social | Series de tiempo, texto |
| 5 | Evaluación de alternativas: reglas compensatorias vs. no compensatorias (aditiva ponderada, conjuntiva, lexicográfica) | Decisión multicriterio |
| 6 | *Customer journey* como **cadena de Markov**: matriz de transición, tiempo esperado a conversión y atribución por «efecto de remoción» | Álgebra matricial |
| 7 | Red social simulada: centralidad para identificar influenciadores; cascada de información por umbral | `graph`, ABM sencillo |
| 8 | Selección de plataforma con AHP o TOPSIS | Multicriterio |
| 9 | Clasificación en cuadrantes involucramiento × diferencias entre marcas; árbol de decisión | `fitctree` |
| 10 | Marshall: utilidad y elasticidad; Pavlov: aprendizaje asociativo (Rescorla–Wagner); Veblen: efecto ostentación en la demanda | Optimización, simulación |
| 11 | Fishbein–Ajzen: actitud multiatributo y regresión intención–conducta; Howard–Sheth como diagrama de bloques (Simulink opcional) | `fitlm`, sistemas |
| 12 | Sistema de recomendación por filtrado colaborativo y discusión de burbuja de filtro | Similitud, SVD |
| 13 | Pirámide demográfica, curva de Lorenz/Gini de la brecha digital; dinámica de opinión con líderes (DeGroot / confianza acotada) | Visualización, ABM |
| 14 | Personalidad (Big Five) con PCA; ley de Weber–Fechner en percepción de precio; olvido y *adstock* publicitario | PCA, modelos dinámicos |
| 15 | Señales sintéticas tipo EEG (bandas con FFT) y mapas de calor de mirada; discusión crítica de inferencia inversa | `fft`, densidad |
| 16 | Análisis de cohortes y mapas de calor de retención | Tablas dinámicas |
| 17 | Modelo integral de intención de compra: regresión logística, ROC y validación cruzada | `fitglm`, `perfcurve` |
| 18 | NPS/CSAT/CES con intervalos *bootstrap*; modelo de Kano; sentimiento con léxico; compromiso en redes | Bootstrap, texto |

---

## 10. MATERIAL GRÁFICO (OBLIGATORIO, NO OPCIONAL)

La generación de figuras y diagramas es parte integral del flujo, **no un marcador de posición**.

- **Mínimos por capítulo:** ≥ 4 figuras (≥ 2 diagramas conceptuales en TikZ y ≥ 2 figuras generadas con MATLAB) y ≥ 2 tablas comparativas.
- **Piezas por Parte** (además de los mínimos), alineadas con las evidencias oficiales:
  - Parte I: infografía-modelo del perfil del consumidor; mapa de gestión de datos (recolección → decisión).
  - Parte II: **mapa del *customer journey*** completo con puntos de contacto, emociones y datos; diagrama del proceso de decisión y de las figuras participantes.
  - Parte III: **matriz integradora de los nueve modelos** completa (autor/año · disciplina base · supuesto central · variables · aplicación digital · críticas · ejemplo de analítica) y organizadores gráficos por modelo.
  - Parte IV: infografía de factores socioculturales y psicológicos; mapa del sistema de influencia.
  - Parte V: **organizador gráfico integrador** de elementos de análisis para la toma de decisiones; infografía de interacciones tecnológicas del consumidor.
- **Técnica:** diagramas conceptuales en `figuras/tikz/*.tex` (clase `standalone`, compilables solos y también incluibles con `\input`, para reutilizarlos en Beamer). Figuras MATLAB en PDF vectorial. Paleta en `config/colores.tex` (define el guinda institucional del IPN; **deja `% TODO confirmar HEX oficial en el manual de identidad`**), legible en escala de grises y amigable con daltonismo.
- **Toda figura** lleva pie con `\caption`, fuente (`Fuente: elaboración propia con datos sintéticos, rng(42)` o la cita real), `\label` y referencia en el texto.
- **Regla contra la fabricación:** una figura con datos reales exige fuente verificada en `docs/verificacion-datos.md`; si no la hay, usa `\datoPendiente{}` y no dibujes valores inventados.

---

## 11. LATEX: CONVENCIONES Y ESTRUCTURA DEL PROYECTO

Usa el skill **`latex-academic`** y, si están disponibles, los agentes `latex-compiler` (compilación y depuración) y `academic-assistant` (investigación bibliográfica).

**Convenciones:** `book`, 11 pt, `letterpaper`, márgenes 2.5 cm, `babel[spanish]`, `booktabs` (sin líneas verticales), `amsmath`/`amssymb`, `hyperref`, `fancyhdr`, `tcolorbox` (recuadros: definición, ejemplo, atención, **Frontera**, **Ética**, **Laboratorio**), `listings` con estilo MATLAB (`MATLABStyle`: azul/verde/violeta, fondo `0.97,0.97,0.99`, números de línea), `tikz`/`pgfplots`, `microtype`, `todonotes` o macro propia para `\pendiente{}` y `\datoPendiente{}`, glosario e índice.

**Estructura:**
```
libro-consumidor-digital/
├── CLAUDE.md                  # reglas condensadas de este prompt (crear en Fase 0)
├── main.tex · preamble.tex · Makefile
├── config/                    # colores.tex, macros.tex, listings-matlab.tex
├── frontmatter/               # portada, presentación, cómo usar el libro, mapa de cobertura
├── partes/parte1/ … parte5/   # intro.tex, cap01.tex …, practicas-oficiales.tex
├── figuras/{tikz,matlab}/
├── matlab/{cap01…cap18,utils}/ · run_all.m
├── datos/{sinteticos,reales}/ · README.md
├── apendices/ · bib/referencias.bib
├── docs/                      # cobertura, decisiones-editoriales, verificacion-datos,
│                              # pendientes, dudas, registro-matlab, investigacion/, beamer/, informes/
└── build/
```
Compilación: `latexmk -pdf -interaction=nonstopmode -halt-on-error` (con `biber`). El `Makefile` incluye objetivos `libro`, `matlab`, `figuras`, `cobertura`.

**Portada:** «Instituto Politécnico Nacional · Escuela Superior de Comercio y Administración, Unidad Santo Tomás · Licenciatura en Mercadotecnia Digital». Autor: Dr. Aboud Barsekh-Onji, D.Sc., M.EEng., M.C.M. No incluyas otros cargos.

---

## 12. FLUJO DE TRABAJO POR FASES Y CHECKPOINTS

Al terminar **cada fase** entrega un informe en `docs/informes/faseN.md` y en tu respuesta: (a) texto generado (páginas por capítulo), (b) figuras (TikZ y MATLAB, con cuántas se ejecutaron y verificaron), (c) scripts corridos y su estado, (d) fuentes nuevas y datos verificados, (e) `\pendiente`/`\datoPendiente` abiertos, (f) decisiones editoriales y dudas. Haz *commit* por fase (remotos por SSH, nunca HTTPS). Si necesitas Python auxiliar: `conda activate research` y luego `pip install`; **nunca `venv`/`virtualenv`**.

- **FASE 0 — Auditoría y andamiaje** *(⏸ checkpoint)*: lee y valida el programa contra el Anexo A; crea estructura, `CLAUDE.md`, preámbulo, macros y `Makefile`; compila un capítulo de prueba con un recuadro, una figura TikZ, una figura MATLAB exportada y una cita; verifica `matlab -batch`; genera la matriz de cobertura vacía; propone ajustes a la arquitectura (§7), el plan de investigación y la lista priorizada de temas de frontera. **Detente y reporta dudas.**
- **FASE 1 — Investigación por Parte:** dossier `docs/investigacion/parteN.md` (fuentes leídas, hallazgos clave, datos verificados, controversias) y `referencias.bib`. Puedes paralelizar con subagentes por Parte.
- **FASE 2 — Piloto: Parte I completa** *(⏸ checkpoint)*: texto, figuras, laboratorio ejecutado, prácticas oficiales, autoevaluación. **Detente para mi revisión de calidad y estilo antes de replicar el patrón.**
- **FASE 3 — Partes II a V:** una Parte a la vez, aplicando los ajustes del piloto. Informe al cerrar cada Parte (⏸ ligero: continúa salvo que haya dudas bloqueantes).
- **FASE 4 — Integración:** portada, presentación, glosario, apéndices, banco de reactivos, bibliografía integrada, índice, verificación de cobertura 100 %, revisión de consistencia terminológica y pase editorial completo.
- **FASE 5 — Insumos para Beamer** (§14).

**Manejo de dudas:** si algo cambia el alcance, no lo resuelvas por tu cuenta: regístralo en `docs/dudas.md` y pregúntame en el siguiente checkpoint. Para decisiones menores, decide con criterio, documéntalo en `decisiones-editoriales.md` y continúa. No me preguntes por cada detalle.

---

## 13. DEFINICIÓN DE «TERMINADO» (criterios de calidad)

- [ ] Compila sin errores; sin referencias ni citas sin resolver; sin `Overfull` graves.
- [ ] Cobertura del programa oficial = 100 % (script de verificación en verde).
- [ ] Cada cifra empírica está en `verificacion-datos.md`; cero datos «de memoria».
- [ ] Todo script MATLAB corre en modo *batch* sin error, es reproducible (`rng`), y sus figuras se regeneran desde `run_all.m`.
- [ ] Mínimos gráficos y de referencias cumplidos por capítulo.
- [ ] Recuadros de ética presentes en los 18 capítulos; anomalías del programa resueltas y documentadas.
- [ ] Sin párrafos, tablas ni figuras copiadas de fuentes con derechos.
- [ ] Datos sintéticos rotulados como tales en texto, código y figuras.
- [ ] Tildes, ñ, ¿ y ¡ correctas; terminología consistente con el glosario.
- [ ] Se entregan `.tex` fuente **y** PDF.

---

## 14. PREPARACIÓN PARA BEAMER (Fase 5)

Para que las presentaciones semanales salgan casi directas del libro:
- Por capítulo, genera `docs/beamer/capNN-esquema.md` con: objetivos, secuencia sugerida de láminas (título, definición, figura, ecuación, código, caso, actividad), lista de figuras reutilizables (rutas), fragmentos de código MATLAB para mostrar y 3 preguntas de discusión.
- Mantén las figuras TikZ como archivos independientes (`\input`) y las de MATLAB en PDF vectorial para reutilizarlas sin retrabajo.
- **No construyas aún las presentaciones**: el estilo Beamer IPN se definirá después. Deja la paleta parametrizada en `config/colores.tex`.

---

## 15. REGLAS DE OPERACIÓN

- Trabaja capítulo por capítulo; guarda y haz *commit* con frecuencia.
- Reporta con honestidad: qué está hecho, qué está verificado, qué está pendiente. Si algo no pudo ejecutarse o verificarse, dilo.
- Antes de cada fase larga, recuerda las reglas de §4, §5 y §10 (releer `CLAUDE.md` tras compactar contexto).
- Si una fuente se contradice con otra, presenta ambas y explica la discrepancia; no elijas en silencio.

---

# ANEXO A — PROGRAMA OFICIAL TRANSCRITO (contrastar contra el PDF)

**Propósito:** Analiza el comportamiento del consumidor digital a partir de sus modelos, factores socioculturales y psicológicos.

**Evaluación y acreditación:** diagnóstica; saberes previamente adquiridos; solución de casos; organizadores gráficos; exposiciones; reportes de indagación; reportes de prácticas; evaluaciones escritas. Otras evidencias: reporte de debate, reporte de investigación, reporte de wiki, infografías, matriz integradora de modelos, ensayos.

### Unidad I — Comportamiento, perfil y gestión de datos del consumidor digital (T 8 · P 15 · AA 7)
*Competencia:* Identifica el comportamiento del consumidor digital y su evolución a partir de sus tipos de perfil y gestión de datos.
- **1.1 Comportamiento del consumidor** (2/4/2): 1.1.1 Evolución del consumidor 1.0 al 5.0 y tendencias a futuro · 1.1.2 Impacto del consumo digital inteligente y sostenible – PROFECO / ONU – · 1.1.3 Ventajas del análisis del comportamiento del consumidor digital
- **1.2 Perfil del consumidor digital** (2/3/2): 1.2.1 Segmentación del mercado digital y variables · 1.2.2 Mercado meta o target digital · 1.2.3 Tipos de perfil del consumidor digital · 1.2.4 Radiografía del consumidor digital en México y el mundo · 1.2.5 Diversidad de perfiles de consumidor digital por modelo de negocios-industria
- **1.3 Gestión de datos de los consumidores digitales** (2/5/2): 1.3.1 Creación de valor para el consumidor-usuario (CX-UX) · 1.3.2 Experiencias omnicanal consumidor-usuario (CX-UX) · 1.3.3 Momentos de escucha a los consumidores digitales · 1.3.4 Importancia de la recolección y gestión de datos · 1.3.5 Toma de decisiones basadas en la gestión de datos digitales
- **1.4 Base tecnológica para la gestión de datos de los consumidores digitales** (2/3/1): 1.4.1 Temas selectos de buscadores y plataformas de gestión integral, redes sociales y comercio electrónico
- *Estrategia (estudio de casos):* indagación documental con apoyo de TIC; trabajo colaborativo para preparar y presentar un tema; análisis de casos; sesión plenaria de conceptos clave; prácticas.
- *Portafolio:* reporte de indagación documental · exposición · solución de casos · reporte de debate · reporte de prácticas · evaluación escrita.
- *Prácticas (15 h, aula/laboratorio):* 1. El consumidor digital y su perfil (7 h) · 2. Buscadores y plataformas en la gestión de datos del consumidor digital (8 h).

### Unidad II — Proceso de toma de decisión de compra digital (T 8 · P 15 · AA 7)
*Competencia:* Examina el proceso de toma de decisiones de compra del consumidor digital a partir de su recorrido y figuras participantes.
- **2.1 Proceso de toma de decisiones de compra**: 2.1.1 Reconocimiento de necesidades y/o deseos · 2.1.2 Búsqueda de información · 2.1.3 Evaluación de alternativas · 2.1.4 Decisión de compra–consumo · 2.1.5 Evaluación post-compra–satisfacción
- **2.2 Customer journey – Recorrido del consumidor digital**: 2.2.1 Atención · 2.2.2 Interés · 2.2.3 Deseo · 2.2.4 Acción · 2.2.5 Satisfacción · 2.2.6 Mapeo del customer journey
- **2.3 Figuras participantes en la toma de decisiones digitales**: 2.3.1 Consumidor / Usuario / *Buyer persona* / Prosumidor · 2.3.2 Influenciador / *Influencer* · 2.3.3 Decisor · 2.3.4 Comprador · 2.3.5 Evaluador
- **2.4 Base tecnológica para el análisis del proceso de compra digital y customer journey**: 2.4.1 Temas selectos de buscadores y plataformas de gestión integral, redes sociales y comercio electrónico
- *Filas de horas en el programa:* (2/4/2), (2/5/2), (2/3/1), (2/3/2) — asignación exacta a subsecciones ambigua en el escaneo.
- *Estrategia:* investigación digital para socialización grupal; infografías colaborativas (proceso de decisión, customer journey, figuras participantes); participación en wiki de mapeo de customer journey; análisis de casos; práctica.
- *Portafolio:* reporte de investigación · infografías · reporte de wiki · solución de casos · reporte de práctica · evaluación escrita.
- *Práctica (15 h):* 1. Recorrido del consumidor digital.

### Unidad III — Modelos de comportamiento del consumidor digital (T 8 · P 15 · AA 6)
*Competencia:* Distingue los modelos de estudio del comportamiento del consumidor digital con base en sus tipos y el análisis de los modelos de decisión de compra.
- **3.1 Tipos de comportamiento del consumidor** (2/4/2): 3.1.1 Complejo · 3.1.2 Reductor de disonancia · 3.1.3 Habitual · 3.1.4 Variado
- **3.2 Modelos de estudio del comportamiento del consumidor digital** (4/8/3): 3.2.1 Económico de Marshall · 3.2.2 Estímulo-respuesta de Pavlov · 3.2.3 Sociológico de Veblen · 3.2.4 Psicoanalítico de Freud · 3.2.5 Acción razonada de Fishbein y Ajzen · 3.2.6 Funcional de O'Shaughnessy · 3.2.7 Motivacional – Pirámide de necesidades de Maslow · 3.2.8 Integrador entrada-proceso-salida de Howard-Sheth *(el programa escribe «Howarth-Sheth»)* · 3.2.9 Antropológico–etnográfico de consumo digital
- **3.3 Base tecnológica para el análisis de los modelos de decisión de compra del consumidor digital** (2/3/1): 3.3.1 Digitalización y tecnología en el proceso de compra · 3.3.2 Temas selectos de buscadores y plataformas de gestión integral, redes sociales y comercio electrónico
- *Estrategia:* organizadores gráficos con TIC; **matriz integradora** de los modelos; socialización en plenaria; análisis y solución de casos sobre tipos, modelos y teorías; prácticas.
- *Portafolio:* organizadores gráficos · matriz integradora de modelos · reporte de socialización · solución de casos · reporte de prácticas · evaluación escrita.
- *Prácticas (15 h):* 1. Análisis del comportamiento del consumidor (5 h) · 2. Análisis de modelos de estudio del comportamiento del consumidor digital (10 h).

### Unidad IV — Factores socioculturales y psicológicos en el comportamiento del consumidor digital (T 8 · P 15 · AA 6)
*Competencia:* Explica la conducta del consumidor digital a partir de los factores socioculturales y psicológicos.
- **4.1 Factores socioculturales** (2/4/2): 4.1.1 Cultura y subcultura · 4.1.2 Brechas generacionales y digitales · 4.1.3 Demografía · 4.1.4 Niveles socioeconómicos · 4.1.5 Familia · 4.1.6 Grupos de referencia · 4.1.7 Líderes de opinión · 4.1.8 *Influencer marketing* · 4.1.9 Ciclo de vida del consumidor
- **4.2 Factores psicológicos** (2/5/2): 4.2.1 Personalidad · 4.2.2 Percepción · 4.2.3 Motivación · *(4.2.4 no existe en el programa)* · 4.2.5 Aprendizaje y memoria · 4.2.6 Actitudes
- **4.3 Neuromarketing** (2/3/1): 4.3.1 Aplicaciones en el análisis de la conducta del consumidor digital
- **4.4 Base tecnológica para el análisis de los factores socioculturales y psicológicos de los consumidores digitales** (2/3/1): 4.4.1 Temas selectos de buscadores y plataformas de gestión integral, redes sociales y comercio electrónico
- *Estrategia:* investigación en equipo de temas clave; infografía; ensayo; análisis y estudio de caso; prácticas.
- *Portafolio:* exposición · infografía · ensayo · solución de casos · reporte de prácticas · evaluación escrita.
- *Prácticas (15 h):* 1. El comportamiento del consumidor: factores socioculturales (7 h) · 2. El comportamiento del consumidor: factores psicológicos (8 h).

### Unidad V — Análisis integral del comportamiento del consumidor digital (T 4 · P 12 · AA 6)
*Competencia:* Analiza el comportamiento del consumidor digital con base en su interacción con la tecnología.
- **5.1 Análisis integrales del comportamiento del consumidor con base tecnológica** (4/12/6): 5.1.1 En internet y medios digitales · 5.1.2 En redes sociales · 5.1.3 Experiencia y satisfacción del cliente digital – medición de satisfacción · 5.1.4 Relación con clientes en medios digitales
- *Estrategia:* ensayo de análisis integral; infografía colaborativa de interacciones tecnológicas del consumidor; organizador gráfico de elementos de análisis para la toma de decisiones; estudio de casos; prácticas.
- *Portafolio:* ensayo · infografía · organizador gráfico · solución de casos · reporte de práctica · evaluación escrita.
- *Prácticas (12 h):* 1. El comportamiento del consumidor digital y su interacción con la tecnología (6 h) · 2. Uso de las redes sociales: comportamiento de compra (6 h).

### Bibliografía del programa
**Básica:** *Delgado, J., Bonet, A., Deza, M. y Fernández, R. (2015). *El nuevo consumidor digital: El Cubo NORISO*. Círculo Rojo (bibliografía clásica) · Diamantstein, M. (2020). *The age of digital consumer behavior*. Shakespeare and Co. · Hoyer, W., Macinnis, D. y Pieters, R. (2018). *Comportamiento del consumidor*. Cengage · Kotler, P. (2021). *Marketing 5.0*. Wiley · Solomon, M. (2017). *Comportamiento del consumidor* (11.ª ed.). Pearson.
**Complementaria:** Mejía, A. y Gómez, A. (2019). *¿Por qué no lo vi antes?* · Sheridan, M. (2019). *They Ask, You Answer*. Wiley · Palmer, M. (2021). *What Your Customer Wants and Can't Tell You*. Mango.
**Cibergrafía y recursos digitales (consultados en 2021):** Asociación Mexicana de Internet (2021) estudios; Merca 2.0 (2021) radiografía del consumidor mexicano; Santos Millán, I. (2019) ESIC; García, G. (2020) «Del consumidor 1.0 al 4.0»; videos de Fernández (2019) y Ideapuerto (2020).
**Perfil docente / actitudes:** empatía, honestidad, responsabilidad, tolerancia, compromiso social e institucional, creatividad, entre otras.

---

# ANEXO B — ANOMALÍAS DETECTADAS EN EL PROGRAMA (y criterio de resolución)

1. **Numeración 4.2:** salta de 4.2.3 a 4.2.5 (no existe 4.2.4). *Criterio:* renumera de forma consecutiva en el libro (4.2.4 Aprendizaje y memoria, 4.2.5 Actitudes) conservando en la matriz de cobertura la equivalencia con la numeración oficial; documenta en `decisiones-editoriales.md`. No inventes un tema «faltante» a menos que lo justifiques y lo marques como Frontera.
2. **«Howarth-Sheth»** en el 3.2.8: la referencia clásica es **Howard y Sheth**. *Criterio:* corrige en el libro y anota el error del programa.
3. **Bibliografía y cibergrafía de 2015–2021**, con recuperaciones de 2021. *Criterio:* conserva la oficial como núcleo, verifica ediciones vigentes (p. ej., la edición actual de Solomon) y añade una **bibliografía complementaria actualizada** claramente rotulada.
4. **Numeración de hojas inconsistente** («de 12» y «de 14») y **asignación ambigua de horas** en la Unidad II (cuatro filas de horas para 2.1–2.4). *Criterio:* trátalo como ambigüedad de escaneo, usa la asignación tentativa del §7 y márcala con (≈).
5. **Unidad II tiene una sola práctica de 15 h** (las demás tienen dos). *Criterio:* diséñala como práctica integradora en cuatro sesiones (una por capítulo de la Parte II) con un solo entregable final.
