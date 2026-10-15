/* cap08_app.js — interfaz de la app del Capítulo 7 (red social, centralidad y cascada). */
(function () {
  'use strict';
  const MED = Cap08.MEDIDAS;

  const specs = [
    { id: 'nNodos', tipo: 'entero', min: 30, max: 100, deslizMin: 30, deslizMax: 100, paso: 1, ayuda: 'Número de personas en la red (30 a 100).' },
    { id: 'nComunidades', tipo: 'entero', min: 2, max: 5, deslizMin: 2, deslizMax: 5, paso: 1, ayuda: 'Grupos en que se reparte la gente (2 a 5). Cada grupo necesita al menos 6 personas.' },
    { id: 'pDentro', tipo: 'numero', min: 0.05, max: 0.5, deslizMin: 0.05, deslizMax: 0.5, paso: 0.01, ayuda: 'Prob. de que dos personas del mismo grupo se conozcan (0.05 a 0.50).' },
    { id: 'pEntre', tipo: 'numero', min: 0, max: 0.1, deslizMin: 0, deslizMax: 0.1, paso: 0.005, ayuda: 'Prob. de que dos personas de grupos distintos se conozcan (0 a 0.10).' },
    { id: 'nSemillas', tipo: 'entero', min: 1, max: 10, deslizMin: 1, deslizMax: 10, paso: 1, ayuda: 'Personas a las que se regala o muestra el producto (1 a 10).' },
    { id: 'umbral', tipo: 'numero', min: 0.05, max: 0.9, deslizMin: 0.05, deslizMax: 0.9, paso: 0.01, ayuda: 'Fracción de contactos que deben haber adoptado (0.05 a 0.90).' },
    { id: 'criterio', tipo: 'select', opciones: [1, 2, 3], ayuda: 'Medida para elegir semillas: 1 grado, 2 intermediación, 3 cercanía.' }
  ];
  const presets = [
    { nombre: 'Caso A', descripcion: 'Valores del script', valores: {} },
    { nombre: 'Caso B', descripcion: 'Más puentes entre grupos: pEntre = 0.06', valores: { pEntre: 0.06 } },
    { nombre: 'Caso C', descripcion: 'Grupos más densos: pDentro = 0.35', valores: { pDentro: 0.35 } }
  ];
  const columnas = [
    { id: 'pDentro', titulo: 'pDentro', dec: 2 }, { id: 'pEntre', titulo: 'pEntre', dec: 3 }, { id: 'umbral', titulo: 'Umbral', dec: 2 },
    { id: 'nConexiones', titulo: 'Conexiones', dec: 0 }, { id: 'coinciden', titulo: 'Coinciden (de 5)', dec: 0 },
    { id: 'adopGrado', titulo: '% adopta (grado)', dec: 1 }, { id: 'adopInter', titulo: '% adopta (interm.)', dec: 1 },
    { id: 'adopCerc', titulo: '% adopta (cercanía)', dec: 1 }, { id: 'promedioAzar', titulo: '% adopta (azar)', dec: 1 }
  ];
  function leerExtra(v) {
    const e = [];
    if (v.nNodos < 6 * v.nComunidades) e.push('Cada grupo necesita al menos 6 personas: reduzcan nComunidades o aumenten nNodos.');
    if (v.nSemillas > v.nNodos) e.push('nSemillas no puede pasar de nNodos.');
    return e;
  }

  // posiciones: cada grupo en un círculo grande; dentro del grupo, en un círculo propio
  function posiciones(r) {
    const n = r.grado.length, k = Math.max.apply(null, r.grupo);
    const pos = new Array(n);
    for (let g = 1; g <= k; g++) {
      const miembros = []; r.grupo.forEach((x, i) => { if (x === g) miembros.push(i); });
      const ang = 2 * Math.PI * (g - 1) / k + Math.PI / 2;
      const cx = 4 * Math.cos(ang), cy = 4 * Math.sin(ang);
      const rad = 0.55 + 0.16 * Math.sqrt(miembros.length);
      miembros.forEach((i, m) => {
        const a = 2 * Math.PI * m / miembros.length;
        const rr = rad * (m % 2 ? 0.62 : 1);
        pos[i] = [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
      });
    }
    return pos;
  }

  function dibujar(r, v) {
    const oscuro = UI.esOscuro();
    const pos = posiciones(r), n = r.grado.length;
    const ex = [], ey = [];
    r.adj.forEach((l, i) => l.forEach(j => { if (j > i) { ex.push(pos[i][0], pos[j][0], null); ey.push(pos[i][1], pos[j][1], null); } }));
    const crit = v.criterio - 1;
    const semilla = new Set(r.semillasC[crit]);
    const maxI = Math.max.apply(null, r.inter) || 1;
    const tam = r.inter.map(x => 8 + 20 * x / maxI);
    const estado = r.elegida.adopt.map((a, i) => (semilla.has(i) ? 0 : (a ? 1 : 2)));
    const colores = [UI.color.guinda, UI.color.teal, oscuro ? '#7d7d7d' : '#B8B8B8'];
    const nombres = ['Semilla', 'Adoptó', 'No adoptó'];
    const trazas = [{ x: ex, y: ey, type: 'scatter', mode: 'lines', hoverinfo: 'skip', line: { color: oscuro ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)', width: 1 }, showlegend: false }];
    [0, 1, 2].forEach(function (e) {
      const idx = estado.map((s, i) => (s === e ? i : -1)).filter(i => i >= 0);
      trazas.push({ x: idx.map(i => pos[i][0]), y: idx.map(i => pos[i][1]), type: 'scatter', mode: 'markers', name: nombres[e],
        marker: { size: idx.map(i => tam[i]), color: colores[e], line: { color: oscuro ? '#222' : '#fff', width: 1 } },
        text: idx.map(i => 'Persona ' + (i + 1) + '<br>grado ' + r.grado[i] + '<br>intermediación ' + r.inter[i].toFixed(1) + '<br>cercanía ' + r.cerc[i].toFixed(3)),
        hovertemplate: '%{text}<extra></extra>' });
    });
    UI.graficar('fig1', trazas, { title: 'Red sintética — semillas elegidas por ' + MED[crit],
      xaxis: { visible: false, showgrid: false, zeroline: false, scaleanchor: 'y' }, yaxis: { visible: false, showgrid: false, zeroline: false },
      legend: { orientation: 'h', y: -0.02 }, hovermode: 'closest' }, { archivo: 'cap08_red' });

    const es = new Set(r.semillasC[crit]);
    UI.graficar('fig2a', [
      { x: r.grado.filter((_, i) => !es.has(i)), y: r.inter.filter((_, i) => !es.has(i)), type: 'scatter', mode: 'markers', name: 'Personas', marker: { size: 9, color: oscuro ? '#9a9a9a' : '#B8B8B8', line: { color: '#555', width: 1 } } },
      { x: r.semillasC[crit].map(i => r.grado[i]), y: r.semillasC[crit].map(i => r.inter[i]), type: 'scatter', mode: 'markers', name: 'Semillas elegidas', marker: { size: 13, color: UI.color.guinda } }],
    { title: 'Conexiones frente a intermediación', xaxis: { title: { text: 'Conexiones (grado)' } }, yaxis: { title: { text: 'Intermediación' } }, legend: { x: 0.02, y: 0.98 } }, { archivo: 'cap08_grado_vs_interm' });

    UI.graficar('fig2b', [
      { x: MED.concat(['al azar']), y: r.adopCentral.concat([r.promAzar]), type: 'bar', name: 'Centrales (y azar)',
        marker: { color: [UI.color.guinda, UI.color.guinda, UI.color.guinda, oscuro ? '#7d7d7d' : '#B8B8B8'] }, text: r.adopCentral.concat([r.promAzar]).map(a => a.toFixed(1) + ' %'), textposition: 'outside', cliponaxis: false },
      { x: MED, y: r.adopPerif, type: 'bar', name: 'Periféricas', marker: { color: UI.color.dorado } }],
    { title: 'Adopción final con ' + v.nSemillas + ' semillas', barmode: 'group', yaxis: { title: { text: '% de la red que adopta' }, range: [0, 112] }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap08_adopcion' });

    const rondas = r.elegida.porRonda;
    UI.graficar('fig3', [{ x: rondas.map((_, i) => i), y: rondas.map(a => 100 * a), type: 'scatter', mode: 'lines+markers', line: { color: UI.color.teal, width: 2.4 }, marker: { size: 7 } }],
      { title: 'Adopción por ronda (criterio: ' + MED[crit] + ')', xaxis: { title: { text: 'Ronda' }, dtick: 1 }, yaxis: { title: { text: '% de la red' }, range: [0, 105] }, showlegend: false }, { archivo: 'cap08_rondas' });
    UI.graficar('fig4', [{ x: r.azar, type: 'histogram', nbinsx: 12, marker: { color: oscuro ? '#7d7d7d' : '#B8B8B8', line: { color: '#555', width: 1 } } }],
      { title: 'Adopción con semillas al azar (100 sorteos)', xaxis: { title: { text: '% de la red que adopta' } }, yaxis: { title: { text: 'Sorteos' } }, showlegend: false,
        shapes: [{ type: 'line', x0: r.promAzar, x1: r.promAzar, yref: 'paper', y0: 0, y1: 1, line: { color: UI.color.guinda, width: 2, dash: 'dot' } }] }, { archivo: 'cap08_sorteos_azar' });
  }

  function caso(r) { return { valores: r.metricas, extra: { adop: r.adopCentral.map(a => +a.toFixed(2)).concat([+r.promAzar.toFixed(2)]) } }; }
  function dibujarComparacion(lista) {
    const x = MED.concat(['al azar']);
    UI.graficar('comp1', lista.map((c, i) => ({ x, y: c.extra.adop, type: 'bar', name: c.etiqueta, marker: { color: UI.colorCaso(i) } })),
      { title: 'Adopción final por criterio — casos guardados', barmode: 'group', yaxis: { title: { text: '% de la red que adopta' }, range: [0, 105] }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap08_comparacion' });
  }

  UI.iniciarApp({
    clave: 'cap08_red_influencia', specs, defecto: Cap08.DEFECTO, presets, columnas, leerExtra,
    ejecutar: v => Cap08.ejecutar(v, window.RAND42), dibujar, caso, dibujarComparacion
  });
})();
