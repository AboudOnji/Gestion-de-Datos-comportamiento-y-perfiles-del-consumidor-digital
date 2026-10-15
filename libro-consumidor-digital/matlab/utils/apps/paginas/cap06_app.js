/* cap06_app.js — interfaz de la app del Capítulo 5 (reglas de decisión). */
(function () {
  'use strict';
  const S = Numerico.sprintf;
  const ALT = Cap06.ALTERNATIVAS, ATR = Cap06.ATRIBUTOS;

  const specs = [
    { id: 'pesoPrecio', tipo: 'numero', min: 0, deslizMin: 0, deslizMax: 1, paso: 0.05, ayuda: 'Importancia del precio (≥ 0). Los cuatro pesos se normalizan: no tienen que sumar 1.' },
    { id: 'pesoCalidad', tipo: 'numero', min: 0, deslizMin: 0, deslizMax: 1, paso: 0.05, ayuda: 'Importancia de la calidad percibida (≥ 0).' },
    { id: 'pesoEntrega', tipo: 'numero', min: 0, deslizMin: 0, deslizMax: 1, paso: 0.05, ayuda: 'Importancia de la rapidez de entrega (≥ 0).' },
    { id: 'pesoResenas', tipo: 'numero', min: 0, deslizMin: 0, deslizMax: 1, paso: 0.05, ayuda: 'Importancia de las reseñas (≥ 0).' },
    { id: 'umbralMinimo', tipo: 'numero', min: 0, max: 10, deslizMin: 0, deslizMax: 10, paso: 0.5, ayuda: 'Regla conjuntiva: puntaje mínimo (0 a 10) exigido en cada atributo.' },
    { id: 'atributoPrioritario', tipo: 'select', opciones: [1, 2, 3, 4], ayuda: 'Regla lexicográfica: 1 precio, 2 calidad, 3 entrega, 4 reseñas.' },
    { id: 'toleranciaLex', tipo: 'numero', min: 0, max: 10, deslizMin: 0, deslizMax: 3, paso: 0.1, ayuda: 'Regla lexicográfica: diferencia (en puntos) que se considera empate.' }
  ];

  const presets = [
    { nombre: 'Caso A', descripcion: 'Valores del script', valores: {} },
    { nombre: 'Caso B', descripcion: 'El precio domina: pesos 0.80 / 0.10 / 0.05 / 0.05', valores: { pesoPrecio: 0.80, pesoCalidad: 0.10, pesoEntrega: 0.05, pesoResenas: 0.05 } },
    { nombre: 'Caso C', descripcion: 'Mínimo exigente: umbralMinimo = 6, atributoPrioritario = 3', valores: { umbralMinimo: 6, atributoPrioritario: 3 } }
  ];

  const columnas = [
    { id: 'pesoPrecio', titulo: 'Peso precio', dec: 2 }, { id: 'pesoCalidad', titulo: 'Peso calidad', dec: 2 },
    { id: 'pesoEntrega', titulo: 'Peso entrega', dec: 2 }, { id: 'pesoResenas', titulo: 'Peso reseñas', dec: 2 },
    { id: 'umbralMinimo', titulo: 'Umbral', dec: 1 }, { id: 'atributoPrioritario', titulo: 'Prioritario' },
    { id: 'ganadorAditiva', titulo: 'Elige aditiva' }, { id: 'ganadorConj', titulo: 'Elige conjuntiva' },
    { id: 'ganadorLex', titulo: 'Elige lexicográfica' }, { id: 'coinciden', titulo: '¿Coinciden?' },
    { id: 'nCambios', titulo: 'Cambios en el barrido', dec: 0 }
  ];

  function leerExtra(v) {
    const suma = v.pesoPrecio + v.pesoCalidad + v.pesoEntrega + v.pesoResenas;
    return suma > 0 ? [] : ['Al menos un peso debe ser mayor que 0.'];
  }

  function dibujar(r, v) {
    const oscuro = UI.esOscuro();
    const marcas = [
      { g: r.ganadorAditiva, nombre: 'Aditiva', simbolo: 'circle', color: UI.color.guinda },
      { g: r.ganadorConj, nombre: 'Conjuntiva', simbolo: 'triangle-down', color: UI.color.teal },
      { g: r.ganadorLex, nombre: 'Lexicográfica', simbolo: 'square', color: UI.color.dorado }
    ];
    const nivel = ALT.map(() => 0);
    const trazas = [{ x: ALT, y: r.utilidad, type: 'bar', name: 'Utilidad aditiva',
      marker: { color: ALT.map((_, i) => i === r.ganadorAditiva ? UI.color.guinda : (oscuro ? '#6b6168' : '#D9D9D9')) },
      hovertemplate: '%{x}<br>utilidad=%{y:.3f}<extra></extra>' }];
    marcas.forEach(function (m) {
      if (m.g < 0) return;
      const y = r.utilidad[m.g] + 0.35 + 0.6 * nivel[m.g]; nivel[m.g]++;
      trazas.push({ x: [ALT[m.g]], y: [y], type: 'scatter', mode: 'markers+text', name: m.nombre, text: [m.nombre],
        textposition: 'middle right', cliponaxis: false,
        marker: { symbol: m.simbolo, size: 11, color: m.color }, textfont: { color: m.color },
        hovertemplate: m.nombre + ': ' + ALT[m.g] + '<extra></extra>' });
    });
    UI.graficar('fig1', trazas, { title: 'Utilidad aditiva y alternativa elegida por cada regla — datos sintéticos',
      yaxis: { title: { text: 'Utilidad aditiva (0 a 10)' }, range: [0, Math.max.apply(null, r.utilidad) * 1.3] }, showlegend: false },
    { archivo: 'cap06_reglas_decision' });

    const t2 = ALT.map((a, j) => ({ x: r.rejilla, y: r.utilBarrido.map(u => u[j]), type: 'scatter', mode: 'lines', name: a,
      line: { color: UI.lineas[j % UI.lineas.length], width: 2.2 } }));
    UI.graficar('fig2', t2, { title: '¿Cuándo cambia la elección? Sensibilidad al peso del precio — datos sintéticos',
      xaxis: { title: { text: 'Peso del precio (los demás pesos conservan sus proporciones)' } },
      yaxis: { title: { text: 'Utilidad aditiva (0 a 10)' }, range: [0, 10.5] }, hovermode: 'x unified',
      shapes: [{ type: 'line', x0: r.pesos[0], x1: r.pesos[0], yref: 'paper', y0: 0, y1: 1, line: { dash: 'dot', color: oscuro ? '#ccc' : '#000', width: 1.2 } }],
      annotations: [{ x: r.pesos[0], yref: 'paper', y: 0.02, text: 'peso actual', showarrow: false, xanchor: 'left', textangle: -90 }] },
    { archivo: 'cap06_sensibilidad_peso' });

    UI.graficar('fig3', [{ z: r.puntajes, x: ATR, y: ALT, type: 'heatmap', colorscale: [[0, '#F4E9EF'], [1, '#6F1D46']], zmin: 0, zmax: 10,
      text: r.puntajes.map(f => f.map(x => x.toFixed(2))), texttemplate: '%{text}', hovertemplate: '%{y} · %{x}: %{z:.2f}<extra></extra>',
      colorbar: { title: { text: 'Puntaje' } } }],
    { title: 'Puntajes normalizados (0 a 10)', yaxis: { autorange: 'reversed' } },
    { archivo: 'cap06_puntajes' });
  }

  function caso(r) { return { valores: r.metricas, extra: { utilidad: r.utilidad.map(u => +u.toFixed(4)) } }; }

  function dibujarComparacion(lista) {
    const trazas = lista.map((c, i) => ({ x: ALT, y: c.extra.utilidad, type: 'bar', name: c.etiqueta, marker: { color: UI.colorCaso(i) } }));
    UI.graficar('comp1', trazas, { title: 'Utilidad aditiva — casos guardados', barmode: 'group',
      yaxis: { title: { text: 'Utilidad aditiva (0 a 10)' } }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap06_comparacion' });
  }

  UI.iniciarApp({
    clave: 'cap06_alternativas', specs, defecto: Cap06.DEFECTO, presets, columnas, leerExtra,
    ejecutar: v => Cap06.ejecutar(v), dibujar, caso, dibujarComparacion,
    alIniciar: function () {
      let h = '<table class="tabla"><thead><tr><th>Alternativa</th><th>Precio (MXN)</th><th>Calidad (1–10)</th><th>Entrega (días)</th><th>Reseñas (1–5)</th></tr></thead><tbody>';
      Cap06.DATOS_CRUDOS.forEach((f, i) => { h += '<tr><td class="izq"><b>' + UI.esc(ALT[i]) + '</b></td>' + f.map(x => '<td>' + x + '</td>').join('') + '</tr>'; });
      UI.$('#tablaDatos').innerHTML = h + '</tbody></table><p class="nota">Precio y entrega son atributos de costo (menos es mejor); calidad y reseñas son de beneficio.</p>';
    }
  });
})();
