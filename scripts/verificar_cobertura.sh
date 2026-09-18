#!/usr/bin/env bash
# scripts/verificar_cobertura.sh — Verifica cobertura del programa oficial
# Compara los \progtag{X.Y.Z} presentes en partes/**/*.tex contra la lista
# completa de 69 subtemas oficiales (docs/cobertura.md). Uso: make cobertura
set -euo pipefail
cd "$(dirname "$0")/.."

SUBTEMAS_OFICIALES=(
  1.1.1 1.1.2 1.1.3 1.2.1 1.2.2 1.2.3 1.2.4 1.2.5 1.3.1 1.3.2 1.3.3 1.3.4 1.3.5 1.4.1
  2.1.1 2.1.2 2.1.3 2.1.4 2.1.5 2.2.1 2.2.2 2.2.3 2.2.4 2.2.5 2.2.6
  2.3.1 2.3.2 2.3.3 2.3.4 2.3.5 2.4.1
  3.1.1 3.1.2 3.1.3 3.1.4 3.2.1 3.2.2 3.2.3 3.2.4 3.2.5 3.2.6 3.2.7 3.2.8 3.2.9 3.3.1 3.3.2
  4.1.1 4.1.2 4.1.3 4.1.4 4.1.5 4.1.6 4.1.7 4.1.8 4.1.9 4.2.1 4.2.2 4.2.3 4.2.5 4.2.6 4.3.1 4.4.1
  5.1.1 5.1.2 5.1.3 5.1.4
)

PRESENTES=$(grep -rhoE '\\progtag\{[0-9.]+\}' partes --include="*.tex" 2>/dev/null | grep -oE '[0-9.]+' | sort -uV || true)

total=${#SUBTEMAS_OFICIALES[@]}
cubiertos=0
faltantes=()

for st in "${SUBTEMAS_OFICIALES[@]}"; do
  if grep -qx "$st" <<< "$PRESENTES"; then
    cubiertos=$((cubiertos+1))
  else
    faltantes+=("$st")
  fi
done

echo "Cobertura: $cubiertos/$total subtemas oficiales con \\progtag{} presente."
if [ ${#faltantes[@]} -gt 0 ]; then
  echo "Faltantes (${#faltantes[@]}):"
  printf '  %s\n' "${faltantes[@]}"
else
  echo "Cobertura completa (100%)."
fi
