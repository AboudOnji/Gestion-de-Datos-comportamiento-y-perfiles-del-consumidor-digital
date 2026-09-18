# Dudas abiertas para el Dr. Barsekh-Onji

Preguntas que cambian el alcance y requieren su decisión (§12 del prompt:
"si algo cambia el alcance, no lo resuelvas por tu cuenta").

## Abiertas al cierre de Fase 0

1. **¿Instalar `biblatex-apa`?** No está disponible en este TeXLive. Puedo
   intentar `tlmgr install biblatex-apa` (requiere red y puede tardar) o
   seguir con `natbib`+`apalike` (ya funcional, ver D0.5). ¿Autoriza el
   intento de instalación, o seguimos con `apalike` para todo el libro?
   Respuesta: Si instala.
2. **Priorización de temas de Frontera (§6):** propongo una priorización en
   `docs/informes/fase0.md` (sección "Temas de frontera"); pido su visto bueno
   o ajustes antes de comprometerla en la Fase 1 (afecta el plan de
   investigación por Parte).
   Respuesta: Aprobado.
3. **Confirmación del HEX guinda/dorado IPN:** la paleta en
   `config/colores.tex` es una aproximación (`#6E1E3A` guinda, `#B08D57`
   dorado). ¿Tiene acceso al manual de identidad gráfica del IPN con el HEX
   oficial, o seguimos con la aproximación hasta el Fase 5 (Beamer IPN)?
   Respuesta: Hay un estilo (skill) dado de alta que es: bemaer-ipn usalo.
4. **Cita de la figura MATLAB del catálogo (§9.2, fila 1):** implementé un
   modelo de Bass con parámetros puramente ilustrativos para la prueba de
   andamiaje. Para el Cap. 1 real, ¿prefiere que los parámetros $p,q$ se
   calibren con algún dataset de adopción tecnológica real y citable (p. ej.
   ENDUTIH, series de adopción de algún canal digital mexicano), o que el
   ejemplo siga siendo puramente ilustrativo/didáctico rotulado como tal?
   Respuesta: Que siga didáctico.

## Abiertas al cierre de Fase 1 (investigación)

Los 5 dossiers de investigación (`docs/investigacion/parte1.md` … `parte5.md`)
levantaron preguntas de fondo que no son solo "datos por verificar"
(esas están en `docs/pendientes.md`), sino decisiones editoriales que cambian
cómo se redacta el contenido. Pido su criterio antes de la Fase 2:

5. **Revisión jurídica del Cap. 3 (LFPDPPP/INAI) y del recuadro de patrones
   oscuros (Cap. 3/14/18).** El agente de la Parte I encontró una tensión sin
   resolver en fuentes de despacho entre "consentimiento tácito como regla
   general" y "consentimiento libre, específico e informado" en la nueva
   LFPDPPP (2025), y no pudo confirmar si la LFPC mexicana tipifica
   expresamente los "patrones oscuros" (a diferencia de la DSA europea, que sí
   lo hace). ¿Prefiere que consiga una revisión jurídica independiente antes
   de redactar estas secciones, o que avance con lenguaje explícitamente
   cauteloso ("la ley establece X según Y fuente; se recomienda verificación
   profesional") y lo ajustemos si surge esa revisión más adelante?
6. **Postura editorial ante el NPS (Net Promoter Score) en el Cap. 18.** La
   evidencia revisada por pares que encontró el agente de la Parte V
   (Keiningham 2007, van Doorn 2013, de Haan 2015 — las tres en revistas
   arbitradas) es consistentemente escéptica: NPS no predice mejor que la
   satisfacción simple "top-2-box". Pero NPS sigue siendo, por mucho, la
   métrica más usada en la industria mexicana y es probable que los
   estudiantes la encuentren como estándar de facto en su vida profesional.
   ¿El libro debe presentar esa crítica académica con firmeza (aun sabiendo
   que contradice la práctica dominante de la industria), o dar un tratamiento
   más equilibrado que reconozca por qué la industria la sigue usando pese a
   la evidencia?
7. **Ediciones a citar de la bibliografía oficial.** El programa oficial cita
   Solomon (2017), Hoyer/MacInnis/Pieters (2018 vía Cengage) y Kotler (2021).
   La investigación de Fase 1 localizó ediciones más recientes: Solomon &
   Russell, 14.ª ed. (2023); Hoyer/MacInnis/Pieters, 8.ª ed. (2023 o 2024,
   fecha inconsistente entre agentes — ver `docs/pendientes.md` #28);
   Kotler, Keller & Chernev, *Marketing Management*, 17.ª ed. (2024/2025, con
   nueva coautoría). ¿El libro debe citar las ediciones más recientes como
   referencia principal (con nota de que el programa oficial cita la edición
   anterior), o mantenerse estrictamente alineado a las ediciones que dice el
   programa oficial para no generar fricción con la lista de compra de libros
   de la unidad de aprendizaje?
8. **Autorización para iniciar Fase 2 (piloto Parte I).** La investigación de
   las 5 Partes está completa y consolidada (`bib/referencias.bib`,
   `docs/verificacion-datos.md`). Conforme al flujo del prompt (§12), Fase 2
   es "Piloto: Parte I completa" y es un checkpoint — ¿autoriza que empiece a
   redactar el contenido real de los capítulos 1–4 con este material de
   respaldo, o prefiere resolver primero las dudas 5–7?
