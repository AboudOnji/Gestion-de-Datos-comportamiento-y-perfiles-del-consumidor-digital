/* cap03_app.js — interfaz de la app del Capítulo 3 (RFM, CLV y prueba A/B). */
(function () {
  'use strict';
  const S = Numerico.sprintf;

  const tamanos = Object.keys(window.BASE_CAP03).map(Number).sort((a, b) => a - b);
  const specs = [
    { id: 'nClientes', tipo: 'select', opciones: tamanos,
      ayuda: 'Tamaño de la base de clientes sintética (Bloques 1–2). Bases generadas por MATLAB con rng(42) para 100 a 1000 clientes.' },
    { id: 'horizonteAnios', tipo: 'numero', min: 0, minExclusivo: true, deslizMin: 1, deslizMax: 10, paso: 1,
      ayuda: 'Horizonte de vida esperado para el CLV simple (años).' },
    { id: 'alfa', tipo: 'numero', min: 0, max: 1, minExclusivo: true, maxExclusivo: true, deslizMin: 0.01, deslizMax: 0.20, paso: 0.01,
      ayuda: '«Umbral de duda» (α) de la prueba A/B (Bloque 3): cuánta suerte aceptan antes de creerle a la diferencia. 0.05 = 5 de cada 100. Válido: 0 &lt; α &lt; 1; usuales 0.01, 0.05, 0.10.' },
    { id: 'nA', tipo: 'entero', min: 1, deslizMin: 100, deslizMax: 10000, paso: 10, ayuda: 'Visitantes de la versión A (control).' },
    { id: 'conversionesA', tipo: 'entero', min: 0, deslizMin: 0, deslizMax: 2000, paso: 1, ayuda: 'Conversiones de la versión A.' },
    { id: 'nB', tipo: 'entero', min: 1, deslizMin: 100, deslizMax: 10000, paso: 10, ayuda: 'Visitantes de la versión B (variante).' },
    { id: 'conversionesB', tipo: 'entero', min: 0, deslizMin: 0, deslizMax: 2000, paso: 1, ayuda: 'Conversiones de la versión B.' }
  ];

  const presets = [
    { nombre: 'Caso A', descripcion: 'Valores del script: nA=1200, 132 conv.; nB=1180, 159 conv.; α=0.05', valores: {} },
    { nombre: 'Caso B', descripcion: 'Mismas tasas, 5 veces más muestra: nA=6000, 660; nB=5900, 795',
      valores: { nA: 6000, conversionesA: 660, nB: 5900, conversionesB: 795 } },
    { nombre: 'Caso C', descripcion: 'Datos del Caso A con α = 0.10', valores: { alfa: 0.10 } }
  ];

  const columnas = [
    { id: 'nA', titulo: 'nA', dec: 0 }, { id: 'cA', titulo: 'conv. A', dec: 0 },
    { id: 'nB', titulo: 'nB', dec: 0 }, { id: 'cB', titulo: 'conv. B', dec: 0 },
    { id: 'convA', titulo: 'Conversión A (%)', dec: 2 }, { id: 'convB', titulo: 'Conversión B (%)', dec: 2 },
    { id: 'valorP', titulo: '¿Fue suerte? (valor p)', dec: 4 },
    { id: 'alfa', titulo: 'Umbral de duda α', dec: 2 }, { id: 'decision', titulo: 'Decisión' },
    { id: 'clvCampeon', titulo: 'CLV Campeón', dec: 0 }, { id: 'clvPerdido', titulo: 'CLV Perdido', dec: 0 }
  ];

  function leerExtra(v) {
    const e = [];
    if (v.conversionesA > v.nA) e.push('conversionesA no puede ser mayor que nA.');
    if (v.conversionesB > v.nB) e.push('conversionesB no puede ser mayor que nB.');
    if (v.conversionesA + v.conversionesB === 0) e.push('Debe haber al menos una conversión en total.');
    if (v.conversionesA + v.conversionesB === v.nA + v.nB) e.push('Con 100 % de conversión en ambas versiones no hay variación que probar.');
    return e;
  }

  function dibujar(r, v) {
    const orden = Cap03.ORDEN;
    UI.graficar('fig1a', [{ x: orden, y: r.conteos, type: 'bar', marker: { color: UI.color.guinda },
      text: r.conteos.map(String), textposition: 'outside', cliponaxis: false }],
    { title: 'Distribución de segmentos RFM', yaxis: { title: { text: 'Número de clientes' } }, showlegend: false },
    { archivo: 'cap03_rfm' });
    UI.graficar('fig1b', [{ x: orden, y: r.clvProm, type: 'bar', marker: { color: UI.color.teal },
      text: r.clvProm.map(c => Number.isNaN(c) ? '' : '$' + Math.round(c).toLocaleString('es-MX')), textposition: 'outside', cliponaxis: false }],
    { title: S('CLV por segmento (horizonte de %d años)', v.horizonteAnios), yaxis: { title: { text: 'CLV simple promedio (MXN)' } }, showlegend: false },
    { archivo: 'cap03_clv' });

    const titulo = S('Prueba A/B de checkout (¿fue suerte? p = %.4f)', r.valorP);
    UI.graficar('fig2', [{
      x: ['A (control)', 'B (variante)'], y: [100 * r.pA, 100 * r.pB], type: 'bar', width: 0.5,
      marker: { color: [UI.color.guinda, UI.color.dorado] },
      error_y: { type: 'data', array: [100 * r.icA, 100 * r.icB], visible: true, thickness: 1.8, width: 12, color: UI.esOscuro() ? '#ddd' : '#000' },
      hovertemplate: '%{x}: %{y:.2f} %<extra></extra>'
    }], {
      title: titulo, yaxis: { title: { text: 'Tasa de conversión (%)' }, rangemode: 'tozero' }, showlegend: false,
      annotations: [{ xref: 'paper', yref: 'paper', x: 0.5, y: -0.2, showarrow: false,
        text: r.rechaza ? '<b>Diferencia confiable</b> (p &lt; α = ' + v.alfa + ')' : '<b>Todavía no se puede saber</b> (p ≥ α = ' + v.alfa + ')',
        font: { color: r.rechaza ? '#2E7D4F' : '#A4461F' } }],
      margin: { b: 80 }
    }, { archivo: 'cap03_prueba_ab' });

    // Complemento de la app: ¿y si fuera solo azar? (simulación con A y B iguales)
    const veces = (v.nA + v.nB) > 20000 ? 2000 : 5000;
    const sim = Cap03.simularAzar(v.nA, v.conversionesA, v.nB, v.conversionesB, veces, 2026);
    const obs = 100 * (r.pB - r.pA), lim = Math.abs(obs);
    const mn = Math.min.apply(null, sim.difs.concat([-lim])), mx = Math.max.apply(null, sim.difs.concat([lim]));
    const ancho = Math.max(0.05, (mx - mn) / 40), ini = Math.floor(mn / ancho) * ancho;
    const cuentas = new Array(Math.ceil((mx - ini) / ancho) + 1).fill(0);
    sim.difs.forEach(d => { cuentas[Math.floor((d - ini) / ancho)]++; });
    const centros = cuentas.map((_, i) => ini + (i + 0.5) * ancho);
    UI.graficar('fig4', [{ x: centros, y: cuentas, type: 'bar', width: ancho * 0.95,
      marker: { color: centros.map(c => Math.abs(c) >= lim - ancho / 2 + 1e-9 ? '#A4461F' : UI.color.gris) },
      hovertemplate: 'diferencia por azar ≈ %{x:.1f} puntos<br>experimentos: %{y}<extra></extra>' }],
    { title: S('¿Y si fuera solo azar? %d experimentos simulados', veces), showlegend: false, bargap: 0,
      xaxis: { title: { text: 'Diferencia B − A por puro azar (puntos porcentuales)' } }, yaxis: { title: { text: 'Número de experimentos' } },
      shapes: [{ type: 'line', yref: 'paper', y0: 0, y1: 1, x0: obs, x1: obs, line: { color: UI.color.dorado, width: 3 } },
        { type: 'line', yref: 'paper', y0: 0, y1: 1, x0: -obs, x1: -obs, line: { color: UI.color.dorado, width: 3, dash: 'dot' } }],
      annotations: [{ x: obs, yref: 'paper', y: 1.02, text: 'lo que midieron', showarrow: false, font: { color: UI.color.dorado } }], margin: { b: 60 } },
    { archivo: 'cap03_simulacion_azar' });

    UI.graficar('fig3', [
      { y: r.montoOriginal, type: 'box', name: 'Antes (con atípicos)', marker: { color: UI.color.gris }, boxpoints: 'outliers' },
      { y: r.montoLimpio, type: 'box', name: 'Después (acotado)', marker: { color: UI.color.teal }, boxpoints: 'outliers' }
    ], { title: S('Monto promedio: atípicos acotados a %.0f MXN', r.limSup), yaxis: { title: { text: 'Monto promedio (MXN)' } }, showlegend: false,
      shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: r.limSup, y1: r.limSup, line: { dash: 'dot', color: UI.color.guinda, width: 2 } }] },
    { archivo: 'cap03_limpieza' });
  }

  function caso(r) {
    return { valores: r.metricas, extra: { icA: 100 * r.icA, icB: 100 * r.icB } };
  }

  function dibujarComparacion(lista) {
    const nombres = lista.map(c => c.etiqueta);
    const colores = lista.map((_, i) => UI.colorCaso(i));
    UI.graficar('comp1', [
      { x: nombres, y: lista.map(c => c.valores.valorP), type: 'bar', name: 'valor p', marker: { color: colores },
        text: lista.map(c => c.valores.valorP.toFixed(4)), textposition: 'outside', cliponaxis: false },
      { x: nombres, y: lista.map(c => c.valores.alfa), type: 'scatter', mode: 'markers', name: 'α',
        marker: { symbol: 'diamond', size: 14, color: UI.esOscuro() ? '#fff' : '#000' } }
    ], { title: '¿Fue suerte? (valor p) contra el umbral de duda', yaxis: { title: { text: 'Probabilidad' }, rangemode: 'tozero' },
      legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap03_comparacion_p' });
    UI.graficar('comp2', [
      { x: nombres, y: lista.map(c => c.valores.convA), type: 'bar', name: 'A (control)', marker: { color: UI.color.guinda },
        error_y: { type: 'data', array: lista.map(c => c.extra ? c.extra.icA : 0), visible: true } },
      { x: nombres, y: lista.map(c => c.valores.convB), type: 'bar', name: 'B (variante)', marker: { color: UI.color.dorado },
        error_y: { type: 'data', array: lista.map(c => c.extra ? c.extra.icB : 0), visible: true } }
    ], { title: 'Conversión A y B con margen de error por caso', barmode: 'group', yaxis: { title: { text: 'Tasa de conversión (%)' }, rangemode: 'tozero' },
      legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap03_comparacion_conversion' });
  }

  UI.iniciarApp({
    clave: 'cap03_rfm_ab', specs, defecto: Cap03.DEFECTO, presets, columnas,
    ejecutar: v => Cap03.ejecutar(v, window.BASE_CAP03),
    dibujar, caso, dibujarComparacion, leerExtra
  });
})();
