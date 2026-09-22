/* cap02_app.js — interfaz de la app del Capítulo 2 (k-means vs. fuzzy c-means). */
(function () {
  'use strict';
  const S = Numerico.sprintf;
  const copia = m => m.map(f => f.slice());
  const K_MAX_CODO = 8;

  // Matrices editables (estado de la interfaz)
  let centros = copia(Cap02.DEFECTO.centrosTipicos);
  let dispersion = copia(Cap02.DEFECTO.dispersionTipica);
  let recalcular = function () {};

  const specs = [
    { id: 'nClientesPorSegmento', tipo: 'entero', min: 5, max: 2000, deslizMin: 20, deslizMax: 300, paso: 5,
      ayuda: 'Tamaño de la muestra sintética por arquetipo.' }
  ];

  const encabezados = ['Frecuencia', 'Ticket', 'Engagement'];
  function dibujarMatriz(id, matriz, conBorrar) {
    let h = '<table class="tabla matriz"><thead><tr><th>#</th>' + encabezados.map(e => '<th>' + e + '</th>').join('') +
      (conBorrar ? '<th></th>' : '') + '</tr></thead><tbody>';
    matriz.forEach(function (fila, i) {
      h += '<tr><td><span class="chip-color" style="background:' + UI.lineas[i % UI.lineas.length] + '"></span>' + (i + 1) + '</td>';
      fila.forEach((v, j) => { h += '<td><input type="number" step="any" data-f="' + i + '" data-c="' + j + '" value="' + v + '" aria-label="' + encabezados[j] + ' arquetipo ' + (i + 1) + '"></td>'; });
      if (conBorrar) h += '<td><button class="btn sec peq" type="button" data-quitar="' + i + '" title="Quitar este arquetipo"' + (matriz.length <= 2 ? ' disabled' : '') + '>✕</button></td>';
      h += '</tr>';
    });
    h += '</tbody></table>';
    const cont = document.getElementById(id);
    cont.innerHTML = h;
    cont.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        matriz[+inp.dataset.f][+inp.dataset.c] = inp.value === '' ? NaN : Number(inp.value);
        recalcular();
      });
    });
    cont.querySelectorAll('[data-quitar]').forEach(function (b) {
      b.addEventListener('click', function () {
        const i = +b.dataset.quitar;
        centros.splice(i, 1); dispersion.splice(i, 1);
        dibujarMatrices(); recalcular();
      });
    });
  }
  function dibujarMatrices() {
    dibujarMatriz('matrizCentros', centros, true);
    dibujarMatriz('matrizDispersion', dispersion, false);
  }

  function leerExtra(v) {
    const errores = [];
    const ok = m => m.every(f => f.every(Number.isFinite));
    if (centros.length < 2) errores.push('Se necesitan al menos 2 arquetipos (k ≥ 2).');
    if (!ok(centros)) errores.push('centrosTipicos: todas las celdas deben tener un número.');
    if (!ok(dispersion)) errores.push('dispersionTipica: todas las celdas deben tener un número.');
    else if (dispersion.some(f => f.some(x => x < 0))) errores.push('dispersionTipica: las dispersiones no pueden ser negativas.');
    if (Number.isFinite(v.nClientesPorSegmento) && v.nClientesPorSegmento < centros.length) errores.push('nClientesPorSegmento debe ser mayor que el número de arquetipos.');
    v.centrosTipicos = copia(centros);
    v.dispersionTipica = copia(dispersion);
    return errores;
  }
  function fijarExtra(v) {
    centros = copia(v.centrosTipicos);
    dispersion = copia(v.dispersionTipica);
    dibujarMatrices();
  }

  // Caso B: cada centro a la mitad de su distancia al promedio de los centros
  function acercar(m) {
    const prom = [0, 1, 2].map(j => Numerico.media(m.map(f => f[j])));
    return m.map(f => f.map((x, j) => +(prom[j] + 0.5 * (x - prom[j])).toFixed(4)));
  }
  const D = Cap02.DEFECTO;
  const presets = [
    { nombre: 'Caso A', descripcion: 'Arquetipos por defecto del script', valores: {} },
    { nombre: 'Caso B', descripcion: 'Más traslape: centros a la mitad de distancia, mismas dispersiones',
      valores: { centrosTipicos: acercar(D.centrosTipicos) } },
    { nombre: 'Caso C', descripcion: 'Cuatro arquetipos: agrega un arquetipo de EJEMPLO («premium») que deben cambiar por el suyo',
      valores: { centrosTipicos: D.centrosTipicos.concat([[5.5, 1300, 90]]), dispersionTipica: D.dispersionTipica.concat([[0.7, 180, 8]]) } }
  ];

  const columnas = [
    { id: 'k', titulo: 'Arquetipos k', dec: 0 },
    { id: 'n', titulo: 'Clientes por segmento', dec: 0 },
    { id: 'nTot', titulo: 'n total', dec: 0 },
    { id: 'silProm', titulo: 'Silueta promedio (k-means)', dec: 3 },
    { id: 'pctAmbiguos', titulo: '% pertenencia ambigua (FCM)', dec: 1 },
    { id: 'centros', titulo: 'centrosTipicos', izq: true }
  ];

  function dibujar(r) {
    const k = r.k, X = r.X;
    const x = X.map(f => f[0]), y = X.map(f => f[2]);
    const ejes = {
      xaxis: { title: { text: 'Frecuencia mensual (estandarizada)' } },
      yaxis: { title: { text: 'Engagement digital (estandarizado)' } }
    };
    // k-means
    const t1 = [];
    for (let s = 1; s <= k; s++) {
      const idx = r.km.etiqueta.map((e, i) => e === s ? i : -1).filter(i => i >= 0);
      t1.push({ x: idx.map(i => x[i]), y: idx.map(i => y[i]), type: 'scatter', mode: 'markers', name: 'Segmento ' + s,
        marker: { color: UI.lineas[(s - 1) % UI.lineas.length], size: 6, symbol: 'circle-open', line: { width: 1.5 } } });
    }
    t1.push({ x: r.km.centros.map(c => c[0]), y: r.km.centros.map(c => c[2]), type: 'scatter', mode: 'markers', name: 'centros',
      marker: { symbol: 'x-thin', size: 14, line: { width: 3, color: UI.esOscuro() ? '#fff' : '#000' } } });
    UI.graficar('fig1a', t1, Object.assign({ title: S('k-means (silueta prom. = %.2f)', r.silProm),
      legend: { orientation: 'h', y: -0.28 }, margin: { b: 100 } }, ejes), { archivo: 'cap02_kmeans' });

    // fuzzy c-means
    UI.graficar('fig1b', [{
      x, y, type: 'scatter', mode: 'markers', name: 'clientes',
      marker: { size: r.umax.map(u => Math.sqrt(60 * (1 - u) + 15) * 1.6), color: r.umax, colorscale: 'Viridis', cmin: Math.min.apply(null, r.umax), cmax: 1,
        colorbar: { title: { text: 'u<sub>max</sub>', side: 'right' }, thickness: 14 } },
      hovertemplate: 'u<sub>max</sub> = %{marker.color:.3f}<extra></extra>'
    }], Object.assign({ title: S('Fuzzy c-means (%.0f%% con pertenencia ambigua)', 100 * r.ambiguos), showlegend: false }, ejes),
    { archivo: 'cap02_fcm' });

    // radar
    const cats = Cap02.NOMBRES_VARIABLES;
    const t2 = r.perfiles.map((p, s) => ({
      type: 'scatterpolar', r: p.concat([p[0]]), theta: cats.concat([cats[0]]), mode: 'lines+markers',
      name: 'Perfil ' + String.fromCharCode(65 + s), line: { color: UI.lineas[s % UI.lineas.length], width: 2.5 },
      marker: { size: 7 },
      customdata: r.centrosOriginales[s].concat([r.centrosOriginales[s][0]]),
      hovertemplate: '%{theta}: %{r:.2f} (valor original %{customdata:.1f})<extra>%{fullData.name}</extra>'
    }));
    UI.graficar('fig2', t2, { title: S('Perfil de los %d segmentos (centros FCM, normalizados)', k),
      polar: { radialaxis: { range: [0, 1] } }, legend: { orientation: 'h', y: -0.12 }, margin: { l: 110, r: 110, b: 70 } },
    { archivo: 'cap02_perfiles_radar' });

    // codo (complemento)
    const codo = Cap02.codo(X, K_MAX_CODO);
    r.codo = codo;
    UI.graficar('fig3', [{ x: codo.map(c => c.k), y: codo.map(c => c.suma), type: 'scatter', mode: 'lines+markers',
      line: { color: UI.color.guinda, width: 2.5 }, marker: { size: 8 }, name: 'suma de distancias',
      hovertemplate: 'k = %{x}<br>suma = %{y:.1f}<extra></extra>' }],
    { title: 'Criterio del codo (complemento)', showlegend: false,
      xaxis: { title: { text: 'Número de segmentos k' }, dtick: 1 }, yaxis: { title: { text: 'Suma de distancias intra-segmento' } },
      shapes: [{ type: 'line', x0: k, x1: k, yref: 'paper', y0: 0, y1: 1, line: { dash: 'dot', color: UI.color.dorado, width: 2 } }] },
    { archivo: 'cap02_codo' });
  }

  function caso(r) {
    const v = Object.assign({}, r.metricas, { centros: centros.map(f => '[' + f.join(', ') + ']').join('; ') });
    return { valores: v, extra: { codo: r.codo } };
  }

  function dibujarComparacion(lista) {
    const nombres = lista.map(c => c.etiqueta);
    const colores = lista.map((_, i) => UI.colorCaso(i));
    UI.graficar('comp1', [{ x: nombres, y: lista.map(c => c.valores.silProm), type: 'bar', marker: { color: colores },
      text: lista.map(c => c.valores.silProm.toFixed(3)), textposition: 'outside', cliponaxis: false }],
    { title: 'Silueta promedio por caso', yaxis: { title: { text: 'Silueta (−1 a 1)' }, rangemode: 'tozero' }, showlegend: false },
    { archivo: 'cap02_comparacion_silueta' });
    UI.graficar('comp2', [{ x: nombres, y: lista.map(c => c.valores.pctAmbiguos), type: 'bar', marker: { color: colores },
      text: lista.map(c => c.valores.pctAmbiguos.toFixed(1) + ' %'), textposition: 'outside', cliponaxis: false }],
    { title: '% de pertenencia ambigua por caso', yaxis: { title: { text: '% de consumidores' }, rangemode: 'tozero' }, showlegend: false },
    { archivo: 'cap02_comparacion_ambiguos' });
    const t3 = [];
    lista.forEach(function (c, i) {
      if (!c.extra || !c.extra.codo) return;
      const cd = c.extra.codo;
      t3.push({ x: cd.map(p => p.k), y: cd.map(p => p.suma), type: 'scatter', mode: 'lines', name: c.etiqueta + ' (k=' + c.valores.k + ')',
        legendgroup: 'c' + i, line: { color: colores[i], width: 2.2 } });
      const usado = cd.find(p => p.k === c.valores.k);
      if (usado) t3.push({ x: [usado.k], y: [usado.suma], type: 'scatter', mode: 'markers', showlegend: false, legendgroup: 'c' + i,
        marker: { color: colores[i], size: 11, line: { color: '#000', width: 1 } } });
    });
    UI.graficar('comp3', t3, { title: 'Criterio del codo — casos guardados',
      xaxis: { title: { text: 'Número de segmentos k' }, dtick: 1 }, yaxis: { title: { text: 'Suma de distancias intra-segmento' } } },
    { archivo: 'cap02_comparacion_codo' });
  }

  UI.iniciarApp({
    clave: 'cap02_segmentacion', specs, defecto: Cap02.DEFECTO, presets, columnas,
    ejecutar: v => Cap02.ejecutar(v, window.RANDN42),
    dibujar, caso, dibujarComparacion, leerExtra, fijarExtra,
    alIniciar: function (diferido) {
      recalcular = diferido;
      UI.$('#btnAgregarFila').addEventListener('click', function () {
        const u = centros[centros.length - 1] || [2, 500, 50];
        centros.push(u.slice());
        dispersion.push((dispersion[dispersion.length - 1] || [0.8, 120, 12]).slice());
        dibujarMatrices(); recalcular();
      });
      UI.$('#btnAcercar').addEventListener('click', function () {
        centros = acercar(centros); dibujarMatrices(); recalcular();
      });
    }
  });
})();
