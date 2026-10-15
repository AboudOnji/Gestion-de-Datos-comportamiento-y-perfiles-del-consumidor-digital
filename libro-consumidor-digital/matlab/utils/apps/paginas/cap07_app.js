/* cap07_app.js — interfaz de la app del Capítulo 6 (recorrido como cadena de Markov). */
(function () {
  'use strict';
  const S = Numerico.sprintf;
  const CAN = Cap07.CANALES, ET = Cap07.ETAPAS;

  const specs = [
    { id: 'pAvanzar', tipo: 'numero', min: 0, minExclusivo: true, max: 1, deslizMin: 0.05, deslizMax: 0.6, paso: 0.01, ayuda: 'Probabilidad por contacto de pasar a la etapa siguiente (&gt; 0).' },
    { id: 'pRetroceder', tipo: 'numero', min: 0, max: 1, deslizMin: 0, deslizMax: 0.4, paso: 0.01, ayuda: 'Probabilidad por contacto de volver a la etapa anterior («messy middle»). 0 = embudo lineal.' },
    { id: 'pAbandonar', tipo: 'numero', min: 0, max: 1, deslizMin: 0, deslizMax: 0.4, paso: 0.01, ayuda: 'Probabilidad por contacto de abandonar el recorrido.' },
    { id: 'inicioRedes', tipo: 'numero', min: 0, max: 1, deslizMin: 0, deslizMax: 1, paso: 0.05, ayuda: 'Fracción de recorridos que empiezan en redes sociales (0 a 1).' },
    { id: 'convBusqueda', tipo: 'numero', min: 0, max: 0.6, deslizMin: 0, deslizMax: 0.6, paso: 0.01, ayuda: 'Probabilidad de convertir en un contacto de búsqueda (0 a 0.60).' },
    { id: 'convDirecto', tipo: 'numero', min: 0, max: 0.8, deslizMin: 0, deslizMax: 0.8, paso: 0.01, ayuda: 'Probabilidad de convertir en un contacto directo (0 a 0.80).' }
  ];
  const presets = [
    { nombre: 'Caso A', descripcion: 'Valores del script', valores: {} },
    { nombre: 'Caso B', descripcion: 'Recorrido desordenado: pRetroceder = 0.25', valores: { pRetroceder: 0.25 } },
    { nombre: 'Caso C', descripcion: 'Más inicio en redes y mejor tráfico directo: inicioRedes = 0.70, convDirecto = 0.60', valores: { inicioRedes: 0.70, convDirecto: 0.60 } }
  ];
  const columnas = [
    { id: 'pAvanzar', titulo: 'pAvanzar', dec: 2 }, { id: 'pRetroceder', titulo: 'pRetroceder', dec: 2 }, { id: 'pAbandonar', titulo: 'pAbandonar', dec: 2 },
    { id: 'inicioRedes', titulo: 'inicioRedes', dec: 2 }, { id: 'convDirecto', titulo: 'convDirecto', dec: 2 },
    { id: 'pConv', titulo: '% convierte', dec: 1 }, { id: 'pConvLineal', titulo: '% convierte (lineal)', dec: 1 },
    { id: 'pasosConv', titulo: 'Contactos hasta convertir', dec: 2 },
    { id: 'ultimoRedes', titulo: 'Redes: % último clic', dec: 1 }, { id: 'remocionRedes', titulo: 'Redes: % remoción', dec: 1 }
  ];
  function leerExtra(v) {
    return v.pAvanzar + v.pRetroceder + v.pAbandonar <= 1 + 1e-12 ? [] : ['pAvanzar + pRetroceder + pAbandonar no puede pasar de 1.'];
  }

  function dibujar(r, v) {
    const oscuro = UI.esOscuro();
    const nombres = ET.concat(['Conversión', 'Abandono']);
    const P = [];
    for (let i = 0; i < 3; i++) P.push(r.real.Q[i].concat(r.real.R[i]));
    P.push([0, 0, 0, 1, 0]); P.push([0, 0, 0, 0, 1]);
    UI.graficar('fig1a', [{ z: P, x: nombres, y: nombres, type: 'heatmap', zmin: 0, zmax: 1, colorscale: [[0, '#FBF3F7'], [1, '#6F1D46']],
      text: P.map(f => f.map(x => (x > 0 ? x.toFixed(2) : ''))), texttemplate: '%{text}', hovertemplate: 'de %{y} a %{x}: %{z:.3f}<extra></extra>', showscale: false }],
    { title: 'Matriz de transición por contacto', yaxis: { autorange: 'reversed', title: { text: 'Desde' } }, xaxis: { title: { text: 'Hacia' } } },
    { archivo: 'cap07_matriz_transicion' });

    const x = Array.from({ length: Cap07.K + 1 }, (_, i) => i);
    UI.graficar('fig1b', [
      { x, y: r.real.cum.map(c => 100 * c), type: 'scatter', mode: 'lines', name: 'Con retrocesos', line: { color: UI.color.guinda, width: 2.6 } },
      { x, y: r.lin.cum.map(c => 100 * c), type: 'scatter', mode: 'lines', name: 'Embudo lineal', line: { color: UI.color.teal, width: 2.2, dash: 'dash' } }],
    { title: 'Tiempo a conversión', xaxis: { title: { text: 'Contactos' } }, yaxis: { title: { text: '% acumulado de recorridos convertidos' } },
      legend: { x: 0.98, xanchor: 'right', y: 0.05 } }, { archivo: 'cap07_tiempo_conversion' });

    UI.graficar('fig2', [
      { x: CAN, y: r.ultimoClic.map(a => 100 * a), type: 'bar', name: 'Último clic', marker: { color: oscuro ? '#8a8a8a' : '#B8B8B8' } },
      { x: CAN, y: r.primerClic.map(a => 100 * a), type: 'bar', name: 'Primer clic', marker: { color: UI.color.dorado } },
      { x: CAN, y: r.remocion.map(a => 100 * a), type: 'bar', name: 'Efecto de remoción (Markov)', marker: { color: UI.color.guinda } }],
    { title: '¿Qué canal se lleva el crédito? Tres modelos de atribución — datos sintéticos', barmode: 'group',
      yaxis: { title: { text: '% de las conversiones atribuido' } }, legend: { orientation: 'h', y: -0.15 } }, { archivo: 'cap07_atribucion' });

    // complemento: sensibilidad a pRetroceder
    const maxR = Math.max(0, 1 - v.pAvanzar - v.pAbandonar);
    const xs = [], ys = [];
    for (let i = 0; i <= 40; i++) { const pr = maxR * i / 40; xs.push(pr); ys.push(100 * Cap07.cadenaEtapas(v.pAvanzar, pr, v.pAbandonar).pConv); }
    UI.graficar('fig3', [
      { x: xs, y: ys, type: 'scatter', mode: 'lines', name: 'P(convertir)', line: { color: UI.color.guinda, width: 2.4 } },
      { x: [v.pRetroceder], y: [100 * r.real.pConv], type: 'scatter', mode: 'markers', name: 'valor actual', marker: { size: 11, color: UI.color.dorado, line: { color: '#000', width: 1 } } }],
    { title: 'Probabilidad de convertir según pRetroceder', xaxis: { title: { text: 'pRetroceder' } }, yaxis: { title: { text: '% que convierte' } }, showlegend: false },
    { archivo: 'cap07_sensibilidad_retroceso' });

    // complemento: probabilidad de convertir sin cada canal
    const base = 100 * r.pConvC;
    const sin = r.efecto.map(e => base * (1 - e));
    UI.graficar('fig4', [
      { x: ['Todos'].concat(CAN.map(c => 'Sin ' + c)), y: [base].concat(sin), type: 'bar',
        marker: { color: [UI.color.guinda].concat(CAN.map(() => UI.color.teal)) }, text: [base].concat(sin).map(a => a.toFixed(1) + ' %'), textposition: 'outside', cliponaxis: false }],
    { title: 'Probabilidad de convertir al quitar cada canal', yaxis: { title: { text: '% que convierte' }, rangemode: 'tozero' }, showlegend: false },
    { archivo: 'cap07_remocion' });
  }

  function caso(r) {
    return { valores: r.metricas, extra: { cum: r.real.cum.map(c => +(100 * c).toFixed(3)), cumLin: r.lin.cum.map(c => +(100 * c).toFixed(3)),
      redes: [r.ultimoClic[1] * 100, r.primerClic[1] * 100, r.remocion[1] * 100].map(a => +a.toFixed(2)) } };
  }
  function dibujarComparacion(lista) {
    const x = Array.from({ length: Cap07.K + 1 }, (_, i) => i);
    const t1 = [];
    lista.forEach(function (c, i) {
      const col = UI.colorCaso(i);
      t1.push({ x, y: c.extra.cum, type: 'scatter', mode: 'lines', name: c.etiqueta, line: { color: col, width: 2.4 } });
    });
    UI.graficar('comp1', t1, { title: 'Tiempo a conversión — casos guardados', xaxis: { title: { text: 'Contactos' } },
      yaxis: { title: { text: '% acumulado convertido' } }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap07_comparacion_tiempo' });
    const modelos = ['Último clic', 'Primer clic', 'Remoción'];
    const t2 = lista.map((c, i) => ({ x: modelos, y: c.extra.redes, type: 'bar', name: c.etiqueta, marker: { color: UI.colorCaso(i) } }));
    UI.graficar('comp2', t2, { title: 'Crédito de Redes sociales por modelo', barmode: 'group', yaxis: { title: { text: '% de las conversiones' } },
      legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap07_comparacion_redes' });
  }

  UI.iniciarApp({
    clave: 'cap07_journey_markov', specs, defecto: Cap07.DEFECTO, presets, columnas, leerExtra,
    ejecutar: v => Cap07.ejecutar(v), dibujar, caso, dibujarComparacion
  });
})();
