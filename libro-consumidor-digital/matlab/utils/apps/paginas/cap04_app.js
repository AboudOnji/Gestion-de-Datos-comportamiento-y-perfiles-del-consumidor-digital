/* cap04_app.js — interfaz de la app del Capítulo 4 (serie de búsqueda y texto). */
(function () {
  'use strict';
  const S = Numerico.sprintf;

  const specs = [
    { id: 'nSemanas', tipo: 'entero', min: 2, max: 1000, deslizMin: 52, deslizMax: 260, paso: 1,
      ayuda: 'Duración de la serie a simular (semanas).' },
    { id: 'fechaInicio', tipo: 'fecha', ayuda: 'Fecha del primer dato.' },
    { id: 'crecimientoSemanal', tipo: 'numero', deslizMin: -0.5, deslizMax: 1, paso: 0.05,
      ayuda: 'Puntos de índice que crece la tendencia cada semana (negativo = decreciente, 0 = plana).' },
    { id: 'amplitudEstacional', tipo: 'numero', min: 0, deslizMin: 0, deslizMax: 30, paso: 0.5,
      ayuda: 'Qué tan marcado es el pico anual (puntos de índice). Válido: ≥ 0; el libro usa 3–12.' },
    { id: 'desviacionRuido', tipo: 'numero', min: 0, deslizMin: 0, deslizMax: 30, paso: 0.5,
      ayuda: 'Ruido aleatorio semana a semana (puntos de índice). Válido: ≥ 0; el libro usa 4–15.' }
  ];

  const presets = [
    { nombre: 'Caso A', descripcion: 'Valores del script', valores: {} },
    { nombre: 'Caso B', descripcion: 'Estacionalidad débil: amplitudEstacional = 3', valores: { amplitudEstacional: 3 } },
    { nombre: 'Caso C', descripcion: 'Más ruido: amplitudEstacional = 12, desviacionRuido = 15', valores: { amplitudEstacional: 12, desviacionRuido: 15 } }
  ];

  const columnas = [
    { id: 'nSemanas', titulo: 'Semanas', dec: 0 }, { id: 'crecimiento', titulo: 'Crecimiento', dec: 2 },
    { id: 'amplitud', titulo: 'Amplitud', dec: 1 }, { id: 'ruido', titulo: 'Ruido', dec: 1 },
    { id: 'ampEst', titulo: 'Amplitud estacional estimada', dec: 1 },
    { id: 'maximo', titulo: 'Máximo de la serie', dec: 1 },
    { id: 'minimo', titulo: 'Mínimo', dec: 1 }, { id: 'promedio', titulo: 'Promedio', dec: 1 }
  ];

  /* ---------- nube de palabras (canvas) ---------- */
  let ultimosTerminos = [];
  function dibujarNube(terminos) {
    ultimosTerminos = terminos;
    const canvas = document.getElementById('nube');
    const caja = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(200, caja.width), H = Math.max(200, caja.height);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const colorTexto = getComputedStyle(document.documentElement).getPropertyValue('--texto').trim();
    ctx.fillStyle = colorTexto; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText('Frecuencia de términos en comentarios de escucha social (sintético)', W / 2, 8);
    const lista = terminos.slice(0, 100);
    if (!lista.length) return;
    const nMax = lista[0].n, nMin = lista[lista.length - 1].n;
    const escala = Math.min(W, H) / 380;
    const tam = n => (nMax === nMin ? 30 : 13 + (n - nMin) / (nMax - nMin) * 42) * escala;
    const colores = ['#0072BD', '#D95319', '#7E2F8E', '#77AC30', '#A2142F', '#297D82', '#6B1F3B'];
    const puestas = [];
    const choca = r => puestas.some(p => r.x < p.x + p.w && r.x + r.w > p.x && r.y < p.y + p.h && r.y + r.h > p.y);
    const cx = W / 2, cy = (H + 30) / 2;
    ctx.textBaseline = 'middle';
    lista.forEach(function (t, i) {
      const fs = tam(t.n);
      ctx.font = '600 ' + fs.toFixed(1) + 'px system-ui, sans-serif';
      const w = ctx.measureText(t.palabra).width + 4, h = fs * 1.05;
      for (let a = 0; a < 2400; a++) { // espiral de Arquímedes
        const ang = a * 0.21, rad = 1.6 * ang;
        const x = cx + rad * Math.cos(ang) * 1.5 - w / 2, y = cy + rad * Math.sin(ang) - h / 2;
        const rect = { x, y, w, h };
        if (x < 2 || y < 30 || x + w > W - 2 || y + h > H - 2 || choca(rect)) continue;
        puestas.push(rect);
        ctx.fillStyle = colores[i % colores.length];
        ctx.fillText(t.palabra, x + w / 2, y + h / 2);
        break;
      }
    });
  }

  /* ---------- clasificación manual de los 10 términos ---------- */
  const CATEGORIAS = ['— sin clasificar —', 'Experiencia positiva', 'Fricción operativa', 'Neutro / descriptivo'];
  const CLAVE_CLASIF = 'cap04_clasificacion';
  function dibujarClasificacion(terminos) {
    const top = terminos.slice(0, 10);
    const guardado = UI.leer(CLAVE_CLASIF, {});
    let h = '<table class="tabla"><thead><tr><th>#</th><th>Término</th><th>Frecuencia</th><th>Clasificación</th></tr></thead><tbody>';
    top.forEach(function (t, i) {
      h += '<tr><td>' + (i + 1) + '</td><td class="izq"><b>' + UI.esc(t.palabra) + '</b></td><td>' + t.n + '</td><td class="izq"><select data-termino="' +
        UI.esc(t.palabra) + '" aria-label="Clasificación de ' + UI.esc(t.palabra) + '">' +
        CATEGORIAS.map(c => '<option' + (guardado[t.palabra] === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></td></tr>';
    });
    h += '</tbody></table>';
    const cont = UI.$('#tablaClasificar');
    cont.innerHTML = h;
    cont.querySelectorAll('select').forEach(function (s) {
      s.addEventListener('change', function () {
        const g = UI.leer(CLAVE_CLASIF, {});
        g[s.dataset.termino] = s.value;
        UI.guardar(CLAVE_CLASIF, g);
      });
    });
  }

  let clasificacionLista = false;
  function dibujar(r) {
    const S1 = r.serie;
    const oscuro = UI.esOscuro();
    UI.graficar('fig1a', [
      { x: S1.fechas, y: S1.observada, type: 'scatter', mode: 'lines', name: 'Serie observada', line: { color: oscuro ? '#8a8a8a' : UI.color.gris, width: 1.2 } },
      { x: S1.fechas, y: S1.tendencia, type: 'scatter', mode: 'lines', name: 'Tendencia', line: { color: UI.color.guinda, width: 2.6 } }
    ], { title: 'Serie observada y tendencia (media móvil de 52 semanas)', yaxis: { title: { text: 'Índice de interés' } },
      xaxis: { type: 'date' }, legend: { x: 0.01, y: 0.99 }, hovermode: 'x unified' }, { archivo: 'cap04_serie_tendencia' });
    UI.graficar('fig1b', [
      { x: S1.fechas, y: S1.estacional, type: 'scatter', mode: 'lines', name: 'Componente estacional', line: { color: UI.color.teal, width: 1.8 } }
    ], { title: 'Componente estacional (serie menos tendencia)', yaxis: { title: { text: 'Componente estacional' } },
      xaxis: { type: 'date', title: { text: 'Fecha' } }, showlegend: false, hovermode: 'x unified',
      shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 0, y1: 0, line: { dash: 'dot', color: oscuro ? '#ccc' : '#000', width: 1 } }] },
    { archivo: 'cap04_estacional' });

    dibujarNube(r.terminos);
    const top = r.terminos.slice(0, 10).reverse();
    UI.graficar('fig3', [{ y: top.map(t => t.palabra), x: top.map(t => t.n), type: 'bar', orientation: 'h',
      marker: { color: UI.color.guinda }, text: top.map(t => String(t.n)), textposition: 'outside', cliponaxis: false }],
    { title: 'Top 10 términos', xaxis: { title: { text: 'Frecuencia en el corpus' }, dtick: 1 }, showlegend: false, margin: { l: 90 } },
    { archivo: 'cap04_top_terminos' });

    if (!clasificacionLista) { dibujarClasificacion(r.terminos); clasificacionLista = true; }
  }

  function caso(r) {
    // se guarda la serie redondeada para superponer casos
    const red = a => a.map(v => +v.toFixed(2));
    return { valores: r.metricas, extra: { fechas: r.serie.fechas, obs: red(r.serie.observada), tend: red(r.serie.tendencia), est: red(r.serie.estacional) } };
  }

  function dibujarComparacion(lista) {
    const t1 = [], t2 = [];
    lista.forEach(function (c, i) {
      const col = UI.colorCaso(i), e = c.extra;
      if (!e) return;
      t1.push({ x: e.fechas, y: e.obs, type: 'scatter', mode: 'lines', name: c.etiqueta + ' observada', legendgroup: 'c' + i,
        line: { color: col, width: 1 }, opacity: 0.55 });
      t1.push({ x: e.fechas, y: e.tend, type: 'scatter', mode: 'lines', name: c.etiqueta + ' tendencia', legendgroup: 'c' + i,
        line: { color: col, width: 3 } });
      t2.push({ x: e.fechas, y: e.est, type: 'scatter', mode: 'lines', name: c.etiqueta, line: { color: col, width: 1.8 } });
    });
    UI.graficar('comp1', t1, { title: 'Serie observada y tendencia — casos guardados', yaxis: { title: { text: 'Índice de interés' } },
      xaxis: { type: 'date' }, legend: { orientation: 'h', y: -0.18 } }, { archivo: 'cap04_comparacion_series' });
    UI.graficar('comp2', t2, { title: 'Componente estacional — casos guardados', yaxis: { title: { text: 'Componente estacional' } },
      xaxis: { type: 'date' }, legend: { orientation: 'h', y: -0.22 } }, { archivo: 'cap04_comparacion_estacional' });
  }

  UI.iniciarApp({
    clave: 'cap04_series_texto', specs, defecto: Cap04.DEFECTO, presets, columnas,
    ejecutar: v => Cap04.ejecutar(v, window.RANDN42),
    dibujar, caso, dibujarComparacion,
    alIniciar: function () {
      UI.$('#listaCorpus').innerHTML = Cap04.COMENTARIOS.map(c => '<li>' + UI.esc(c) + '</li>').join('');
      UI.$('#listaVacias').innerHTML = '<b>Palabras vacías (stopwords) eliminadas:</b> ' + Cap04.PALABRAS_VACIAS.join(', ');
      UI.$('#btnNubePNG').addEventListener('click', function () {
        const c = document.getElementById('nube');
        // fondo sólido para que el PNG se lea fuera de la página
        const tmp = document.createElement('canvas'); tmp.width = c.width; tmp.height = c.height;
        const ctx = tmp.getContext('2d');
        ctx.fillStyle = getComputedStyle(document.body).backgroundColor; ctx.fillRect(0, 0, tmp.width, tmp.height);
        ctx.drawImage(c, 0, 0);
        const a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'cap04_nube_palabras.png';
        document.body.appendChild(a); a.click(); a.remove();
      });
      UI.$('#btnCSVClasif').addEventListener('click', function () {
        const g = UI.leer(CLAVE_CLASIF, {});
        const filas = [['#', 'Término', 'Frecuencia', 'Clasificación']];
        ultimosTerminos.slice(0, 10).forEach((t, i) => filas.push([i + 1, t.palabra, t.n, g[t.palabra] || CATEGORIAS[0]]));
        UI.descargar('cap04_clasificacion_terminos.csv', UI.aCSV(filas), 'text/csv;charset=utf-8');
      });
      let t = null;
      window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(() => dibujarNube(ultimosTerminos), 150); });
      const btnTema = UI.$('#btnTema');
      if (btnTema) btnTema.addEventListener('click', () => dibujarNube(ultimosTerminos));
    }
  });
})();
