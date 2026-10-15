#!/usr/bin/env bash
# probar_subida.sh — prueba de humo de la SUBIDA de un archivo a una app «datos propios»: abre la página en
# Chrome sin interfaz, entrega un Excel al campo de archivo (como si lo eligiera el estudiante) y muestra
# el estado y el principio de los resultados.
# Uso: bash probar_subida.sh ruta/al/app.html ruta/al/archivo.xlsx
f="$(realpath "$1")"; x="$(realpath "$2")"; tmp="$(mktemp -d)"
python3 - "$f" "$x" "$tmp/app.html" <<'P'
import sys,base64,os
s=open(sys.argv[1],encoding='utf-8').read()
b=base64.b64encode(open(sys.argv[2],'rb').read()).decode()
nombre=os.path.basename(sys.argv[2])
js='''<script>
window.addEventListener('load',function(){
  setTimeout(function(){
    var bin=atob("%s"),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    var file=new File([u],"%s"),dt=new DataTransfer();dt.items.add(file);
    var inp=document.getElementById('archivo');inp.files=dt.files;inp.dispatchEvent(new Event('change'));
    setTimeout(function(){
      var d=document.createElement('div');d.id='resultadoPrueba';
      d.textContent=JSON.stringify({estado:document.getElementById('estadoArchivo').textContent.slice(0,260),consola:document.getElementById('consola').textContent.slice(0,200),errores:document.getElementById('erroresParam').textContent.trim()});
      document.body.appendChild(d);
    },2500);
  },2000);
});
</script></body>''' % (b,nombre)
i=s.rindex('</body>')
open(sys.argv[3],'w',encoding='utf-8').write(s[:i]+js+s[i+len('</body>'):])
P
google-chrome --headless=new --no-sandbox --disable-gpu --enable-logging=stderr --v=0 --virtual-time-budget=15000 --dump-dom "file://$tmp/app.html" > "$tmp/dom.html" 2> "$tmp/err.txt"
grep -i "Uncaught" "$tmp/err.txt" | head -3
python3 - "$tmp/dom.html" <<'P'
import re,sys,html
d=open(sys.argv[1],encoding='utf-8').read()
m=re.search(r'<div id="resultadoPrueba">(.*?)</div>',d,re.S)
print(html.unescape(m.group(1)) if m else 'SIN RESULTADO')
P
rm -rf "$tmp"
