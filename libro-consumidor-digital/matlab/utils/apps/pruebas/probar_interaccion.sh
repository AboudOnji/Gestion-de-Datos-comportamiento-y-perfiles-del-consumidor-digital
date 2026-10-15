#!/usr/bin/env bash
# probar_interaccion.sh — prueba de humo de una app HTML en Chrome sin interfaz: carga la página, pulsa
# «Caso B» y «Caso C» guardando cada corrida, y revisa que (a) no haya errores de JavaScript, (b) la consola
# de resultados cambie con cada caso y (c) el cuadro de comparación tenga dos filas.
# Uso: bash probar_interaccion.sh ruta/al/app.html
f="$(realpath "$1")"; tmp="$(mktemp -d)"; copia="$tmp/app.html"
python3 - "$f" "$copia" <<'P'
import sys
s=open(sys.argv[1],encoding='utf-8').read()
js='''<script>
window.addEventListener('load',function(){
  var cons=function(){return document.getElementById('consola').textContent;};
  var r=[];
  setTimeout(function(){
    r.push(cons().length);
    var b=document.querySelectorAll('[data-preset]');
    function paso(i){
      if(i>=2){ setTimeout(fin,600); return; }
      b[i+1].click();
      setTimeout(function(){ r.push(cons().length); document.getElementById('btnGuardarCaso').click(); setTimeout(function(){paso(i+1);},500); },700);
    }
    function fin(){
      var filas=document.querySelectorAll('#tablaCasos tbody tr').length;
      var div=document.createElement('div'); div.id='resultadoPrueba';
      div.textContent=JSON.stringify({longitudes:r,filasCuadro:filas,errores:document.getElementById('erroresParam').textContent.trim()});
      document.body.appendChild(div);
    }
    paso(0);
  },2500);
});
window.addEventListener('error',function(e){console.error('ERRORJS '+e.message);});
</script></body>'''
i=s.rindex('</body>')   # la última: SheetJS trae la cadena «</body>» dentro de su código
open(sys.argv[2],'w',encoding='utf-8').write(s[:i]+js+s[i+len('</body>'):])
P
google-chrome --headless=new --no-sandbox --disable-gpu --enable-logging=stderr --v=0 --virtual-time-budget=15000 --dump-dom "file://$copia" > "$tmp/dom.html" 2> "$tmp/err.txt"
grep -i "ERRORJS\|Uncaught" "$tmp/err.txt" | head -5
python3 - "$tmp/dom.html" <<'P'
import re,sys,html
d=open(sys.argv[1],encoding='utf-8').read()
m=re.search(r'<div id="resultadoPrueba">(.*?)</div>',d,re.S)
print(html.unescape(m.group(1)) if m else 'SIN RESULTADO (la página no terminó la prueba)')
P
rm -rf "$tmp"
