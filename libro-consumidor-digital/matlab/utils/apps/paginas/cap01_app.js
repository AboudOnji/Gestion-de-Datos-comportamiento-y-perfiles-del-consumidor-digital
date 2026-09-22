/* cap01_app.js — interfaz de la app del Capítulo 1 (modelo de Bass). */
(function () {
  'use strict';
  const S = Numerico.sprintf;

  const specs = [
    { id: 'p', tipo: 'numero', min: 0, minExclusivo: true, deslizMin: 0.005, deslizMax: 0.15, paso: 0.005,
      ayuda: 'Coeficiente de innovación (adopción «espontánea»). Válido: p &gt; 0; el libro usa 0.01–0.08.' },
    { id: 'q', tipo: 'numero', min: 0, deslizMin: 0, deslizMax: 0.8, paso: 0.01,
      ayuda: 'Coeficiente de imitación (adopción por contagio social). Válido: q ≥ 0; el libro usa 0.10–0.55.' },
    { id: 'm', tipo: 'numero', min: 0, minExclusivo: true, deslizMin: 0.1, deslizMax: 2, paso: 0.05,
      ayuda: 'Mercado potencial, normalizado a 1 (100 % del mercado objetivo). Válido: m &gt; 0.' },
    { id: 'tFinal', tipo: 'entero', min: 1, max: 400, deslizMin: 5, deslizMax: 60, paso: 1,
      ayuda: 'Periodos a simular (p. ej., trimestres desde el lanzamiento).' }
  ];

  const presets = [
    { nombre: 'Caso A', descripcion: 'Innovación dominante: p = 0.08, q = 0.10', valores: { p: 0.08, q: 0.10 } },
    { nombre: 'Caso B', descripcion: 'Balance: p = 0.03, q = 0.38 (valores del script)', valores: { p: 0.03, q: 0.38 } },
    { nombre: 'Caso C', descripcion: 'Imitación dominante: p = 0.01, q = 0.55', valores: { p: 0.01, q: 0.55 } }
  ];

  const columnas = [
    { id: 'p', titulo: 'p', dec: 3 }, { id: 'q', titulo: 'q', dec: 3 },
    { id: 'm', titulo: 'm', dec: 2 }, { id: 'tFinal', titulo: 'tFinal', dec: 0 },
    { id: 'tPico', titulo: 'Pico t*', dec: 2 },
    { id: 'pctPico', titulo: '% adoptado en el pico', dec: 1 },
    { id: 'pct20', titulo: '% adoptado en t = 20', dec: 1 },
    { id: 'pctFinal', titulo: '% adoptado al final', dec: 1 },
    { id: 'tasaMax', titulo: 'Tasa máxima', dec: 4 }
  ];

  const ejes = { xaxis: { title: { text: 'Periodo (trimestre)' } } };

  function dibujar(r, v) {
    const trazas1 = [{ x: r.t, y: r.acum, type: 'scatter', mode: 'lines', name: 'F(t)',
      line: { color: UI.color.guinda, width: 2.5 }, hovertemplate: 't=%{x:.2f}<br>F=%{y:.4f}<extra></extra>' }];
    if (!Number.isNaN(r.enPico)) {
      trazas1.push({ x: [r.tPico], y: [r.enPico], type: 'scatter', mode: 'markers', name: 'pico de adopción',
        marker: { size: 11, color: UI.color.dorado, line: { color: '#000', width: 1 } },
        hovertemplate: 't*=%{x:.2f}<br>F=%{y:.4f}<extra></extra>' });
    }
    UI.graficar('fig1', trazas1, Object.assign({
      title: S('Adopción acumulada (p=%.2f, q=%.2f)', v.p, v.q),
      yaxis: { title: { text: 'Adopción acumulada (fracción de m)' } },
      legend: { x: 1, xanchor: 'right', y: 0.05 }
    }, ejes), { archivo: 'cap01_bass_acumulada' });

    const shapes = [], anotaciones = [];
    if (r.tPico >= 0 && r.tPico <= v.tFinal) {
      shapes.push({ type: 'line', x0: r.tPico, x1: r.tPico, yref: 'paper', y0: 0, y1: 1, line: { dash: 'dot', color: '#555', width: 1.5 } });
      anotaciones.push({ x: r.tPico, yref: 'paper', y: 1, text: 'pico', showarrow: false, xanchor: 'left', yanchor: 'top' });
    }
    UI.graficar('fig2', [{ x: r.t, y: r.tasa, type: 'scatter', mode: 'lines', name: 'dF/dt',
      line: { color: UI.color.teal, width: 2.5 }, hovertemplate: 't=%{x:.2f}<br>dF/dt=%{y:.4f}<extra></extra>' }],
    Object.assign({
      title: S('Tasa de adopción (p=%.2f, q=%.2f)', v.p, v.q),
      yaxis: { title: { text: 'Tasa de adopción (dF/dt)' } }, shapes, annotations: anotaciones, showlegend: false
    }, ejes), { archivo: 'cap01_bass_tasa' });
  }

  // Para comparar se guarda la curva submuestreada (1 de cada 5 puntos).
  function caso(r) {
    const idx = r.t.map((_, i) => i).filter(i => i % 5 === 0 || i === r.t.length - 1);
    return {
      valores: r.metricas,
      extra: { t: idx.map(i => +r.t[i].toFixed(3)), acum: idx.map(i => +r.acum[i].toFixed(6)),
        tasa: idx.map(i => +r.tasa[i].toFixed(6)), tPico: r.tPico, enPico: r.enPico }
    };
  }

  function dibujarComparacion(lista) {
    const t1 = [], t2 = [];
    lista.forEach(function (c, i) {
      const col = UI.colorCaso(i), e = c.extra;
      const nombre = c.etiqueta + S(' (p=%.2f, q=%.2f)', c.valores.p, c.valores.q);
      t1.push({ x: e.t, y: e.acum, type: 'scatter', mode: 'lines', name: nombre, legendgroup: 'c' + i, line: { color: col, width: 2.2 } });
      if (e.enPico !== null && !Number.isNaN(e.enPico)) {
        t1.push({ x: [e.tPico], y: [e.enPico], type: 'scatter', mode: 'markers', showlegend: false, legendgroup: 'c' + i,
          marker: { size: 10, color: col, line: { color: '#000', width: 1 } }, hovertemplate: c.etiqueta + '<br>t*=%{x:.2f}<br>F=%{y:.4f}<extra></extra>' });
      }
      t2.push({ x: e.t, y: e.tasa, type: 'scatter', mode: 'lines', name: nombre, line: { color: col, width: 2.2 } });
    });
    const ley = { orientation: 'h', y: -0.25 };
    UI.graficar('comp1', t1, Object.assign({ title: 'Adopción acumulada — casos guardados',
      yaxis: { title: { text: 'Fracción de m' } }, legend: ley, margin: { b: 90 } }, ejes), { archivo: 'cap01_comparacion_acumulada' });
    UI.graficar('comp2', t2, Object.assign({ title: 'Tasa de adopción — casos guardados',
      yaxis: { title: { text: 'dF/dt' } }, legend: ley, margin: { b: 90 } }, ejes), { archivo: 'cap01_comparacion_tasa' });
  }

  UI.iniciarApp({
    clave: 'cap01_bass', specs, defecto: Cap01.DEFECTO, presets, columnas,
    ejecutar: v => Cap01.ejecutar(v), dibujar, caso, dibujarComparacion
  });
})();
