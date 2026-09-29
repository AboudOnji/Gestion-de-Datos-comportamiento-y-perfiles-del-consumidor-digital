/* cap02_didactico.js — piezas visuales para EXPLICAR la segmentación rígida
   (k-means) contra la difusa (fuzzy c-means) en las dos apps del Cap. 2:
   medidor de silueta, gráfica de silueta cliente por cliente, clientes de
   ejemplo con su % de pertenencia, seguros/ambiguos por segmento y una
   conclusión en palabras. Usa Cap02.nivelSilueta y Cap02.compararRigidoDifuso. */
(function (raiz) {
  'use strict';
  const S = Numerico.sprintf;
  const D = {};
  const color = s => UI.lineas[s % UI.lineas.length];

  /* Medidor horizontal de -1 a 1 con las zonas de Kaufman y Rousseeuw (1990). */
  D.medidorSilueta = function (contenedor, s) {
    const niv = Cap02.nivelSilueta(s);
    const pos = v => (100 * (v + 1) / 2).toFixed(2) + '%';
    const zonas = [
      { a: -1, b: 0.25, c: '#C9C2C5', t: 'sin estructura' },
      { a: 0.25, b: 0.50, c: '#E3B26B', t: 'débil' },
      { a: 0.50, b: 0.70, c: '#9CC59A', t: 'razonable' },
      { a: 0.70, b: 1, c: '#4E9F62', t: 'fuerte' }
    ];
    let h = '<div class="medidor"><div class="medidor-barra">';
    zonas.forEach(z => { h += '<div class="medidor-zona" style="left:' + pos(z.a) + ';width:' + (100 * (z.b - z.a) / 2) + '%;background:' + z.c + '"><span>' + z.t + '</span></div>'; });
    if (Number.isFinite(s)) h += '<div class="medidor-aguja" style="left:' + pos(Math.max(-1, Math.min(1, s))) + '"><b>' + s.toFixed(2) + '</b></div>';
    h += '</div><div class="medidor-escala"><span>−1</span><span>0</span><span>0.25</span><span>0.5</span><span>0.7</span><span>1</span></div></div>';
    h += '<p class="veredicto">Silueta promedio = <b>' + (Number.isFinite(s) ? s.toFixed(3) : '—') + '</b> → estructura <b>' + niv.nivel + '</b>: ' + niv.frase + '.</p>';
    contenedor.innerHTML = h;
  };

  /* Gráfica de silueta: una barra por cliente, agrupadas por segmento y
     ordenadas de mayor a menor. Barra larga = bien ubicado; cerca de 0 = en
     la frontera; negativa = se parece más a otro segmento. */
  D.graficaSilueta = function (id, sil, etiqueta, nombres, archivo) {
    const k = nombres.length;
    const trazas = [];
    let pos = 0;
    const marcas = [];
    for (let s = 1; s <= k; s++) {
      const vals = sil.filter((_, i) => etiqueta[i] === s).sort((a, b) => b - a);
      if (!vals.length) continue;
      const ys = vals.map((_, j) => pos + j);
      marcas.push({ y: pos + vals.length / 2, t: nombres[s - 1] });
      trazas.push({ x: vals, y: ys, type: 'bar', orientation: 'h', name: nombres[s - 1], marker: { color: color(s - 1) },
        width: 1, hovertemplate: 'silueta = %{x:.2f}<extra>' + UI.esc(nombres[s - 1]) + '</extra>' });
      pos += vals.length + Math.max(3, Math.round(sil.length / 40));
    }
    const prom = Numerico.media(sil);
    UI.graficar(id, trazas, {
      title: 'Silueta de cada cliente', bargap: 0, showlegend: false,
      xaxis: { title: { text: 'Silueta (−1 a 1): ¿qué tan bien ubicado está cada cliente?' }, range: [Math.min(-0.2, Math.min.apply(null, sil) - 0.05), 1] },
      yaxis: { showticklabels: false, showgrid: false, zeroline: false, title: { text: 'Clientes (una barra = un cliente)' } },
      shapes: [{ type: 'line', x0: prom, x1: prom, yref: 'paper', y0: 0, y1: 1, line: { dash: 'dot', color: UI.color.dorado, width: 2 } },
        { type: 'line', x0: 0, x1: 0, yref: 'paper', y0: 0, y1: 1, line: { color: UI.esOscuro() ? '#aaa' : '#555', width: 1 } }],
      annotations: [{ x: prom, yref: 'paper', y: 1.02, text: 'promedio ' + prom.toFixed(2), showarrow: false, font: { color: UI.color.dorado } }]
        .concat(marcas.map(m => ({ x: 0.98, y: m.y, text: '<b>' + UI.esc(m.t) + '</b>', showarrow: false, xanchor: 'right', font: { size: 12 } })))
    }, { archivo: archivo || 'silueta_por_cliente' });
  };

  /* Clientes de ejemplo: el más típico de cada segmento y los más ambiguos,
     con su % de pertenencia a cada segmento (barra apilada al 100 %). */
  D.graficaEjemplos = function (id, U, etiqueta, ids, nombres, comp, archivo) {
    const k = nombres.length, n = etiqueta.length;
    const filas = [];
    for (let s = 0; s < k; s++) {
      const c = comp.mapa.indexOf(s); // segmento difuso s ↔ segmento rígido c
      let mejor = -1;
      for (let i = 0; i < n; i++) if (comp.principal[i] === s && (mejor < 0 || U[s][i] > U[s][mejor])) mejor = i;
      if (mejor >= 0) filas.push({ i: mejor, tipo: 'típico de ' + nombres[c >= 0 ? c : s] });
    }
    const orden = Array.from({ length: n }, (_, i) => i).sort((a, b) => comp.umax[a] - comp.umax[b]);
    orden.slice(0, 3).forEach(i => filas.push({ i, tipo: 'ambiguo' }));
    // dos renglones: quién es y dónde lo puso el método rígido
    const etiquetasY = filas.map(f => '<b>' + UI.esc(ids[f.i]) + '</b> (' + UI.esc(f.tipo) + ')<br>rígido: ' + UI.esc(nombres[etiqueta[f.i] - 1]));
    // nombre de cada segmento difuso = nombre del segmento rígido emparejado
    const nombreDifuso = s => { const c = comp.mapa.indexOf(s); return nombres[c >= 0 ? c : s]; };
    const colorDifuso = s => { const c = comp.mapa.indexOf(s); return color(c >= 0 ? c : s); };
    const trazas = [];
    for (let s = 0; s < k; s++) {
      trazas.push({ y: etiquetasY, x: filas.map(f => 100 * U[s][f.i]), type: 'bar', orientation: 'h', name: nombreDifuso(s),
        marker: { color: colorDifuso(s) }, text: filas.map(f => (100 * U[s][f.i] >= 8 ? (100 * U[s][f.i]).toFixed(0) + '%' : '')),
        textposition: 'inside', insidetextanchor: 'middle', hovertemplate: '%{y}<br>' + UI.esc(nombreDifuso(s)) + ': %{x:.1f}%<extra></extra>' });
    }
    UI.graficar(id, trazas, {
      title: 'Ejemplos: ¿a qué segmento pertenece cada cliente?', barmode: 'stack',
      xaxis: { title: { text: '% de pertenencia a cada segmento (difuso)' }, range: [0, 100], ticksuffix: '%' },
      yaxis: { autorange: 'reversed', automargin: true },
      shapes: [{ type: 'line', x0: 60, x1: 60, yref: 'paper', y0: 0, y1: 1, line: { dash: 'dot', color: UI.esOscuro() ? '#fff' : '#000', width: 1.5 } }],
      annotations: [{ x: 60, yref: 'paper', y: 1, yanchor: 'bottom', text: 'umbral 60 %', showarrow: false, font: { size: 11 } }],
      legend: { orientation: 'h', y: -0.22 }, margin: { r: 20, b: 90 }
    }, { archivo: archivo || 'pertenencia_ejemplos' });
  };

  /* Dentro de cada segmento rígido: cuántos clientes son seguros y cuántos ambiguos. */
  D.graficaSegurosAmbiguos = function (id, comp, nombres, archivo) {
    const P = comp.porSegmento;
    UI.graficar(id, [
      { x: nombres, y: P.map(p => p.seguros), type: 'bar', name: 'Seguros (pertenencia ≥ 60 %)', marker: { color: UI.color.teal },
        text: P.map(p => String(p.seguros)), textposition: 'inside' },
      { x: nombres, y: P.map(p => p.ambiguos), type: 'bar', name: 'Ambiguos (ningún segmento llega a 60 %)', marker: { color: UI.color.dorado },
        text: P.map(p => p.ambiguos ? String(p.ambiguos) : ''), textposition: 'inside' }
    ], {
      title: 'Lo que el rígido no dice: ¿qué tan seguros son sus segmentos?', barmode: 'stack',
      yaxis: { title: { text: 'Clientes (según k-means)' } }, legend: { orientation: 'h', y: -0.2 },
      annotations: P.map((p, s) => ({ x: nombres[s], y: p.tam, yanchor: 'bottom', showarrow: false,
        text: p.tam ? (100 * p.ambiguos / p.tam).toFixed(0) + '% ambiguos' : '', font: { size: 11 } }))
    }, { archivo: archivo || 'seguros_ambiguos' });
  };

  /* Conclusión en palabras a partir de los números de la corrida. */
  D.conclusion = function (comp, silProm, nombres) {
    const n = comp.principal.length;
    const niv = Cap02.nivelSilueta(silProm);
    let peor = 0;
    comp.porSegmento.forEach((p, s) => { if (p.tam && p.ambiguos / p.tam > (comp.porSegmento[peor].ambiguos / (comp.porSegmento[peor].tam || 1))) peor = s; });
    const P = comp.porSegmento[peor];
    return '<ul class="conclusion">' +
      '<li><b>Rígido (k-means):</b> reparte a los ' + n + ' clientes en ' + nombres.length + ' segmentos, cada cliente en uno solo. ' +
        'Su silueta de ' + silProm.toFixed(2) + ' indica una estructura <b>' + niv.nivel + '</b>.</li>' +
      '<li><b>Difuso (fuzzy c-means):</b> coincide con el rígido en el segmento principal del <b>' + comp.pctCoinciden.toFixed(1) + '%</b> de los clientes, ' +
        'pero revela que <b>' + comp.ambiguos + ' clientes (' + (100 * comp.ambiguos / n).toFixed(1) + '%)</b> no pertenecen claramente a ninguno: ' +
        'el rígido los obliga a elegir un solo segmento.</li>' +
      (P.ambiguos ? '<li>El segmento con más dudas es <b>' + UI.esc(nombres[peor]) + '</b>: ' + P.ambiguos + ' de sus ' + P.tam +
        ' clientes (' + (100 * P.ambiguos / P.tam).toFixed(0) + '%) están a medio camino con otro segmento. Una campaña dirigida solo a «' +
        UI.esc(nombres[peor]) + '» los trataría como si fueran típicos, y no lo son.</li>' : '') +
      '</ul>';
  };

  raiz.Didactico = D;
})(this);
