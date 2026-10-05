#!/bin/bash
# Compila exámenes, clave, hoja de respuestas y plantillas de acetato (la hoja y las plantillas usan TikZ: 2 pasadas).
cd "$(dirname "$0")" || exit 1
for f in examen_A examen_B examen_C clave_profesor; do
  pdflatex -interaction=nonstopmode "$f.tex" >/dev/null 2>&1 || echo "ERROR en $f"
done
for f in hoja_respuestas plantilla_A plantilla_B plantilla_C; do
  pdflatex -interaction=nonstopmode "$f.tex" >/dev/null 2>&1; pdflatex -interaction=nonstopmode "$f.tex" >/dev/null 2>&1 || echo "ERROR en $f"
done
rm -f *.aux *.log; rm -rf __pycache__
for f in examen_A examen_B examen_C clave_profesor hoja_respuestas plantilla_A plantilla_B plantilla_C; do echo "$f: $(pdfinfo "$f.pdf" 2>/dev/null | grep Pages)"; done
