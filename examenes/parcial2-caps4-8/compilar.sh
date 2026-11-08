#!/bin/sh
# Genera y compila las tres versiones, sus claves comentadas y la rúbrica. Uso: ./compilar.sh
cd "$(dirname "$0")"
/home/aboudonji/miniforge3/envs/research/bin/python generar_versiones.py || exit 1
for f in examen_A examen_B examen_C clave_comentada_A clave_comentada_B clave_comentada_C rubrica_y_claves; do
  pdflatex -interaction=nonstopmode "$f.tex" >/dev/null && pdflatex -interaction=nonstopmode "$f.tex" >/dev/null \
    && echo "OK $f.pdf ($(pdfinfo $f.pdf | awk '/Pages/{print $2}') pág.)" || echo "ERROR en $f"
done
rm -f *.aux *.log *.out
