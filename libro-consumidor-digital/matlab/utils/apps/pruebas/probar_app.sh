#!/usr/bin/env bash
# probar_app.sh — abre una app HTML en Chrome sin interfaz y revisa que cargue:
# imprime errores de consola de JavaScript y las primeras líneas del cuadro «Resultados».
# Uso: bash probar_app.sh ruta/al/app.html
f="$(realpath "$1")"
google-chrome --headless=new --no-sandbox --disable-gpu --enable-logging=stderr --v=0 \
  --virtual-time-budget=8000 --dump-dom "file://$f" > /tmp/probar_app_dom.html 2> /tmp/probar_app_err.txt
echo "--- errores de consola (CONSOLE) ---"
grep -i "CONSOLE" /tmp/probar_app_err.txt | grep -iv "dbus\|gpu\|vulkan" | head -10
echo "--- consola de resultados ---"
python3 - <<'P'
import re,html
d=open('/tmp/probar_app_dom.html',encoding='utf-8').read()
m=re.search(r'<pre class="consola" id="consola">(.*?)</pre>',d,re.S)
print(html.unescape(m.group(1))[:900] if m else 'SIN CONSOLA')
av=re.search(r'id="erroresParam">(.*?)</div>\s*<div class="botones',d,re.S)
print('errores de parámetros:',re.sub('<[^>]+>','',av.group(1)).strip() if av else '-')
print('gráficas dibujadas (svg.main-svg):',len(re.findall('class="main-svg"',d)))
P
