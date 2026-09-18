# CLAUDE.md — libro-consumidor-digital

Reglas condensadas del prompt de proyecto (`../prompt-libro-consumidor-digital-claude-code.md`,
fuente completa y autoritativa; este archivo es un resumen operativo).

## Qué es esto
Libro de texto y manual de laboratorio en LaTeX: *Comportamiento del Consumidor
Digital: Datos, Perfiles y Modelos*, para la unidad **Laboratorio: Gestión de
datos, comportamiento y perfiles del consumidor digital** (Lic. en Mercadotecnia
Digital, 3.er semestre, ESCA Unidad Santo Tomás, IPN). 18 capítulos = 18 semanas,
en 5 Partes. Servirá luego de insumo para slides Beamer IPN (no construir aún).

## No negociable
1. **Fidelidad al programa oficial** (Anexo A del prompt) — cobertura 100 %,
   verificada en `docs/cobertura.md` vía `\label{prog:X.Y.Z}`.
2. **Rigor académico**: cero cifras/citas "de memoria". Todo dato verificado
   en `docs/verificacion-datos.md` o marcado `\datoPendiente{}`.
3. **Laboratorio MATLAB ejecutado y verificado** (`matlab -batch`, nunca
   inventar salidas).

## Entorno verificado en Fase 0
- MATLAB: `matlab -batch` funciona. Versión instalada **R2026a** (el CLAUDE.md
  raíz del workspace dice R2025b — discrepancia de entorno, no de este proyecto;
  ver `docs/informes/fase0.md`). Toolboxes confirmadas: Statistics and Machine
  Learning, Fuzzy Logic, Signal Processing, Text Analytics.
- El MCP de MATLAB (`mcp__matlab__*`) no logra adjuntarse a una sesión en este
  entorno («failed to attach to MATLAB session»); se usa el fallback de CLI
  `matlab -batch "run('...')"` indicado en §9 del prompt. Reintentar el MCP en
  cada fase por si la sesión de escritorio queda disponible.
- **biblatex-apa NO está instalado** (`kpsewhich biblatex-apa.sty` vacío).
  Se usa `natbib` + estilo `apalike` (alternativa indicada en §5.4). Migrar si
  se instala `tlmgr install biblatex-apa` más adelante.
- Gráficas MATLAB con `Interpreter,'latex'` y texto en español acentuado emiten
  warnings benignos de `SceneNode` en modo `-batch` (sin hardware de
  aceleración gráfica) pero **renderizan correctamente**; no son errores.
  **No** escapar acentos manualmente con comandos LaTeX (`\'e`); escribir el
  carácter UTF-8 directo (é, á, í, ó, ú, ñ) — verificado en Fase 0.
- `run_all.m` lanza cada script de capítulo como **subproceso MATLAB
  independiente** (`system('matlab -batch ...')`), nunca con `run()` en el
  mismo proceso: cada script de capítulo empieza con `clear`, que borraría las
  variables del propio orquestador si compartieran workspace (hallazgo de
  Fase 0, corregido).

## Estructura
Ver §11 del prompt. `main.tex` ensambla `frontmatter/` → `partes/parteN/` →
`backmatter`. El capítulo de prueba (`frontmatter/capitulo-prueba.tex`) es
solo de andamiaje de Fase 0; se retira cuando entre el Cap. 1 real (Fase 2).

## Convenciones de cita
`\citep{clave}` (natbib). Claves de fuentes verificadas en `bib/referencias.bib`
con comentario de dónde se verificó cada una.

## Flujo de fases y checkpoints
Ver §12 del prompt. Fase 0 (este commit) es un checkpoint: **no avanzar a
Fase 1 sin autorización explícita**, y el detalle está en
`docs/informes/fase0.md`.

## Comandos
```bash
make libro       # compila main.tex con latexmk
make matlab      # corre matlab/run_all.m (todos los scripts, subprocesos)
make figuras     # alias de matlab (regenera figuras/matlab/)
make cobertura   # (pendiente de implementar; ver docs/cobertura.md)
make clean       # limpia auxiliares de LaTeX y glosario
```
