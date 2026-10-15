/* cap09_app.js — interfaz de la app del Capítulo 8 (AHP + TOPSIS). */
(function () {
  'use strict';
  const ALT = Cap09.ALTERNATIVAS, COR = Cap09.CORTAS, CRI = Cap09.CRITERIOS;

  const juicio = (id, ayuda) => ({ id, tipo: 'numero', min: 1 / 9, max: 9, deslizMin: 0.111, deslizMax: 9, paso: 0.001, ayuda: ayuda + ' Escala de Saaty: 1 = igual, 3, 5, 7, 9 = extremadamente más; 0.333 = 1/3.' });
  const specs = [
    juicio('cobVsPriv', 'Cobertura frente a privacidad.'),
    juicio('cobVsInterop', 'Cobertura frente a interoperabilidad.'),
    juicio('cobVsCosto', 'Cobertura frente a costo.'),
    juicio('privVsInterop', 'Privacidad frente a interoperabilidad.'),
    juicio('privVsCosto', 'Privacidad frente a costo.'),
    juicio('interopVsCosto', 'Interoperabilidad frente a costo.')
  ];
  const presets = [
    { nombre: 'Caso A', descripcion: 'Valores del script', valores: {} },
    { nombre: 'Caso B', descripcion: 'El costo manda: 0.333 / 0.5 / 0.2 / 1 / 0.5 / 0.333',
      valores: { cobVsPriv: 0.333, cobVsInterop: 0.5, cobVsCosto: 0.2, privVsInterop: 1, privVsCosto: 0.5, interopVsCosto: 0.333 } },
    { nombre: 'Caso C', descripcion: 'Juicios contradictorios: 5 / 0.333 / 3 / 0.2 / 3 / 7',
      valores: { cobVsPriv: 5, cobVsInterop: 0.333, cobVsCosto: 3, privVsInterop: 0.2, privVsCosto: 3, interopVsCosto: 7 } }
  ];
  const columnas = [
    { id: 'pesoCobertura', titulo: 'Peso cobertura', dec: 3 }, { id: 'pesoPrivacidad', titulo: 'Peso privacidad', dec: 3 },
    { id: 'pesoInterop', titulo: 'Peso interop.', dec: 3 }, { id: 'pesoCosto', titulo: 'Peso costo', dec: 3 },
    { id: 'cr', titulo: 'Razón de consistencia', dec: 3 }, { id: 'consistente', titulo: '¿Consistente?' },
    { id: 'ganadorAHP', titulo: 'Elige (AHP + TOPSIS)', izq: true }, { id: 'cercaniaGanador', titulo: 'Cercanía', dec: 3 },
    { id: 'ganadorIguales', titulo: 'Elige (pesos iguales)', izq: true }, { id: 'nCambios', titulo: 'Cambios en el barrido', dec: 0 }
  ];

  function dibujar(r, v) {
    const oscuro = UI.esOscuro();
    UI.graficar('fig1a', [{ x: CRI, y: r.ahp.pesos, type: 'bar', marker: { color: UI.color.teal }, text: r.ahp.pesos.map(w => w.toFixed(2)), textposition: 'outside', cliponaxis: false }],
      { title: S('Pesos AHP (razón de consistencia = %.3f)', r.ahp.cr), yaxis: { title: { text: 'Peso (suma 1)' }, range: [0, Math.max.apply(null, r.ahp.pesos) * 1.2] }, showlegend: false }, { archivo: 'cap09_pesos_ahp' });
    UI.graficar('fig1b', [
      { x: COR, y: r.t.cercania, type: 'bar', name: 'Pesos AHP', marker: { color: UI.color.guinda } },
      { x: COR, y: r.ti.cercania, type: 'bar', name: 'Pesos iguales', marker: { color: oscuro ? '#8a8a8a' : '#B8B8B8' } }],
    { title: 'TOPSIS', barmode: 'group', yaxis: { title: { text: 'Cercanía a la solución ideal' }, range: [0, 1] }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap09_topsis' });
    const t2 = ALT.map((a, j) => ({ x: r.rejilla, y: r.cercaniaBarrido.map(c => c[j]), type: 'scatter', mode: 'lines', name: COR[j], line: { color: UI.lineas[j % UI.lineas.length], width: 2.2 } }));
    UI.graficar('fig2', t2, { title: '¿Cuándo cambia la herramienta elegida? — datos sintéticos', hovermode: 'x unified',
      xaxis: { title: { text: 'Peso del costo (los demás pesos conservan sus proporciones)' } }, yaxis: { title: { text: 'Cercanía TOPSIS' } },
      shapes: [{ type: 'line', x0: r.ahp.pesos[3], x1: r.ahp.pesos[3], yref: 'paper', y0: 0, y1: 1, line: { dash: 'dot', color: oscuro ? '#ccc' : '#000', width: 1.2 } }] }, { archivo: 'cap09_sensibilidad_costo' });
    const A = r.ahp.A;
    UI.graficar('fig3', [{ z: A.map(f => f.map(x => Math.log(x))), x: CRI, y: CRI, type: 'heatmap', colorscale: [[0, '#F4E9EF'], [0.5, '#FFFFFF'], [1, '#297D82']], zmid: 0, showscale: false,
      text: A.map(f => f.map(x => x.toFixed(2))), texttemplate: '%{text}', hovertemplate: '%{y} frente a %{x}: %{text}<extra></extra>' }],
    { title: 'Matriz de comparaciones por pares', yaxis: { autorange: 'reversed' } }, { archivo: 'cap09_matriz_pares' });
  }
  const S = Numerico.sprintf;

  function caso(r) { return { valores: r.metricas, extra: { pesos: r.ahp.pesos.map(w => +w.toFixed(4)), cerc: r.t.cercania.map(c => +c.toFixed(4)) } }; }
  function dibujarComparacion(lista) {
    UI.graficar('comp1', lista.map((c, i) => ({ x: CRI, y: c.extra.pesos, type: 'bar', name: c.etiqueta, marker: { color: UI.colorCaso(i) } })),
      { title: 'Pesos AHP — casos guardados', barmode: 'group', yaxis: { title: { text: 'Peso' } }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap09_comparacion_pesos' });
    UI.graficar('comp2', lista.map((c, i) => ({ x: COR, y: c.extra.cerc, type: 'bar', name: c.etiqueta, marker: { color: UI.colorCaso(i) } })),
      { title: 'Cercanía TOPSIS — casos guardados', barmode: 'group', yaxis: { title: { text: 'Cercanía' }, range: [0, 1] }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap09_comparacion_topsis' });
  }

  UI.iniciarApp({
    clave: 'cap09_seleccion_plataforma', specs, defecto: Cap09.DEFECTO, presets, columnas,
    ejecutar: v => Cap09.ejecutar(v), dibujar, caso, dibujarComparacion,
    alIniciar: function () {
      let h = '<table class="tabla"><thead><tr><th>Herramienta (tipo)</th><th>Cobertura (1–10)</th><th>Privacidad (1–10)</th><th>Interoperabilidad (1–10)</th><th>Costo (miles de MXN/año)</th></tr></thead><tbody>';
      Cap09.X.forEach((f, i) => { h += '<tr><td class="izq"><b>' + UI.esc(ALT[i]) + '</b></td>' + f.map(x => '<td>' + x + '</td>').join('') + '</tr>'; });
      UI.$('#tablaDatos').innerHTML = h + '</tbody></table><p class="nota">Cobertura, privacidad e interoperabilidad son criterios de beneficio (más es mejor); el costo es de costo (menos es mejor).</p>';
    }
  });
})();
