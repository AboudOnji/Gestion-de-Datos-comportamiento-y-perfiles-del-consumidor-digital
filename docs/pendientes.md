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
