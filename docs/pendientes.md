# Pendientes (`\pendiente{}` y `\datoPendiente{}`)

Lista de todos los marcadores visibles en el PDF que aún requieren resolución.
Se actualiza al cerrar cada capítulo/Parte.

| Ubicación | Tipo | Descripción |
|---|---|---|
| `frontmatter/capitulo-prueba.tex` | `\pendiente` | Sustituir el capítulo de prueba por el contenido real del Cap. 1 en la Fase 2. |
| `config/colores.tex` | TODO (comentario) | Confirmar HEX oficial del guinda IPN en el manual de identidad institucional; la paleta actual (`#6E1E3A`) es una aproximación provisional. |
| `preamble.tex` | Nota | `biblatex-apa` no está instalado en este entorno; se usa `natbib`+`apalike`. Revisar si se instala `biblatex-apa` vía `tlmgr` antes de la Fase 1. |
| `main.tex` | Estructural | Glosario (`glossaries`) configurado pero sin entradas — no genera `main.gls`/`main.acr` hasta que haya términos definidos (Fase 1+). |

## Pendientes de ejecución MATLAB
Ninguno: el único script existente (`matlab/fase0_prueba/script_prueba.m`) se
ejecutó y verificó en Fase 0 (ver `docs/registro-matlab.md`).
