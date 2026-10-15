/* cap08_datos_app.js — red social propia (Excel/CSV): centralidad y cascada por umbral con las
   mismas medidas y reglas de cap08_red_influencia.m, en 4 pasos. Cálculo: Cap08Datos
   (modelos/cap08_datos.js). */
(function () {
  'use strict';
  const S = Numerico.sprintf, DP = DatosPropios, C8 = Cap08Datos, MED = C8.MEDIDAS;

  const specs = [
    { id: 'nSemillas', tipo: 'entero', min: 1, max: 10, deslizMin: 1, deslizMax: 10, paso: 1, ayuda: '<b>Semillas</b>: personas a las que se regala o muestra el producto (1 a 10).' },
    { id: 'umbral', tipo: 'numero', min: 0.05, max: 0.9, deslizMin: 0.05, deslizMax: 0.9, paso: 0.01, ayuda: '<b>Umbral</b>: fracción de contactos que deben haber adoptado (0.05 a 0.90).' },
    { id: 'criterio', tipo: 'select', opciones: [1, 2, 3], ayuda: '<b>Criterio</b> para elegir semillas: 1 grado, 2 intermediación, 3 cercanía.' }
  ];
  const presets = [
    { nombre: 'Caso A', descripcion: 'Valores del libro: 3 semillas, umbral 0.25, por grado', valores: { nSemillas: 3, umbral: 0.25, criterio: 1 } },
    { nombre: 'Caso B', descripcion: 'Más semillas: 6', valores: { nSemillas: 6, umbral: 0.25, criterio: 1 } },
    { nombre: 'Caso C', descripcion: 'Semillas por intermediación', valores: { nSemillas: 3, umbral: 0.25, criterio: 2 } }
  ];

  let red = null, tabla = null, origen = '', erroresCarga = [], avisosCarga = [], pos = null, recalcular = function () {}, ultimo = null;

  function cargarFilas(filas, filasPer, nombre) {
    tabla = DP.procesarTabla(filas); origen = nombre;
    const per = filasPer ? DP.procesarTabla(filasPer) : null;
    red = C8.leerRed(tabla, per);
    erroresCarga = red.errores || []; avisosCarga = red.avisos || [];
    if (erroresCarga.length) red = null; else pos = C8.disposicion(C8.listaAdyacencia(red.A), 250);
    dibujarEstado(); recalcular();
  }
  function cargarLibro(libro, nombre) {
    const hC = libro.buscar('conex', 'arist', 'enlace') || libro.nombres[0], hP = libro.buscar('person', 'nodo');
    cargarFilas(libro.hoja(hC), hP && hP !== hC ? libro.hoja(hP) : null, nombre);
  }
  function leerArchivo(archivo) {
    UI.$('#estadoArchivo').textContent = 'Leyendo «' + archivo.name + '»…';
    DatosUI.leerLibro(archivo, libro => cargarLibro(libro, archivo.name), function (err) {
      red = null; tabla = null; erroresCarga = ['No se pudo leer «' + archivo.name + '» (' + err.message + '). ¿Es un Excel (.xlsx/.xls), .ods o .csv?']; UI.$('#estadoArchivo').innerHTML = '⚠ ' + UI.esc(erroresCarga[0]); recalcular();
    });
  }
  function cargarEjemplo(clave, nombre) { cargarLibro(DatosUI.libroDeObjeto(window.EJEMPLO_CAP08[clave]), nombre); }

  function dibujarEstado() {
    const res = UI.$('#resumenDatos'), vista = UI.$('#vistaDatos');
    if (!tabla) { UI.$('#estadoArchivo').textContent = 'Aún no hay datos.'; res.textContent = ''; vista.innerHTML = ''; return; }
    DatosUI.cajaEstado('#estadoArchivo', { errores: erroresCarga, avisos: avisosCarga, filasDatos: tabla.filasDatos }, origen, red ? ' · ' + red.nombres.length + ' personas' + (red.hayGrupos ? ', con grupos' : '') : '');
    res.innerHTML = '<b>Columnas de la hoja de conexiones:</b> ' + tabla.columnas.map(c => UI.esc(c.nombre)).join(' · ');
    vista.innerHTML = DatosUI.vistaTabla(tabla, 8);
  }
  function leerExtra() {
    if (!tabla) return ['Suban el archivo con las conexiones de su red o pulsen uno de los ejemplos.'];
    if (erroresCarga.length) return ['Corrijan el archivo y vuelvan a subirlo (vean «¿Cómo ordenar mis datos?» al final de la página).'];
    return [];
  }
  function ejecutar(v) {
    const R = C8.analizar(red, { nSemillas: Math.min(v.nSemillas, red.nombres.length), umbral: v.umbral, criterio: v.criterio }, window.RAND42);
    ultimo = { R, v };
    return { consola: R.consola, avisos: R.avisos, R, v, metricas: Object.assign({ origen, nSemillas: v.nSemillas, umbral: v.umbral, criterio: MED[v.criterio - 1] }, R.metricas) };
  }

  const PALETA = ['#0072BD', '#D95319', '#EDB120', '#7E2F8E', '#77AC30', '#4DBEEE', '#A2142F'];
  function dibujar(r, v) {
    const R = r.R, oscuro = UI.esOscuro(), n = R.n, nom = red.nombres, crit = v.criterio - 1;
    UI.$('#kpisRed').innerHTML =
      '<div class="kpi"><div class="v">' + n + '</div><div class="t">Personas</div></div><div class="kpi"><div class="v">' + R.nConexiones + '</div><div class="t">Conexiones</div></div>' +
      '<div class="kpi"><div class="v">' + R.metricas.gradoProm.toFixed(1) + '</div><div class="t">Conexiones por persona (máx. ' + R.metricas.gradoMax + ')</div></div>' +
      '<div class="kpi"><div class="v">' + R.nComp + '</div><div class="t">Componente(s) conexa(s); la mayor tiene ' + R.mayor + ' personas</div></div>';
    UI.$('#avisosRed').innerHTML = R.avisos.map(a => '<div class="aviso">ℹ ' + UI.esc(a) + '</div>').join('');

    const adj = C8.listaAdyacencia(red.A), ex = [], ey = [];
    adj.forEach((l, i) => l.forEach(j => { if (j > i) { ex.push(pos[i][0], pos[j][0], null); ey.push(pos[i][1], pos[j][1], null); } }));
    const semilla = new Set(R.semillasC[crit]), maxI = Math.max.apply(null, R.inter) || 1, tam = R.inter.map(x => 8 + 20 * x / maxI);
    const grupos = red.hayGrupos ? Array.from(new Set(red.grupos)) : [];
    const trazas = [{ x: ex, y: ey, type: 'scatter', mode: 'lines', hoverinfo: 'skip', line: { color: oscuro ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)', width: 1 }, showlegend: false }];
    const estado = R.elegida.adopt.map((a, i) => (semilla.has(i) ? 0 : (a ? 1 : 2)));
    [['Semilla', UI.color.guinda, 0], ['Adoptó', UI.color.teal, 1], ['No adoptó', oscuro ? '#7d7d7d' : '#B8B8B8', 2]].forEach(function (e) {
      const idx = estado.map((s, i) => (s === e[2] ? i : -1)).filter(i => i >= 0);
      trazas.push({ x: idx.map(i => pos[i][0]), y: idx.map(i => pos[i][1]), type: 'scatter', mode: 'markers', name: e[0],
        marker: { size: idx.map(i => tam[i]), color: e[1], line: { color: idx.map(i => (red.hayGrupos ? PALETA[grupos.indexOf(red.grupos[i]) % PALETA.length] : (oscuro ? '#222' : '#fff'))), width: red.hayGrupos ? 3 : 1 } },
        text: idx.map(i => UI.esc(nom[i]) + (red.hayGrupos ? '<br>grupo ' + UI.esc(red.grupos[i]) : '') + '<br>conexiones ' + R.grado[i] + '<br>intermediación ' + R.inter[i].toFixed(1) + '<br>cercanía ' + R.cerc[i].toFixed(3)), hovertemplate: '%{text}<extra></extra>' });
    });
    UI.graficar('figRed', trazas, { title: 'Su red — semillas elegidas por ' + MED[crit] + (red.hayGrupos ? ' (borde = grupo)' : ''), xaxis: { visible: false, showgrid: false, zeroline: false, scaleanchor: 'y' }, yaxis: { visible: false, showgrid: false, zeroline: false }, legend: { orientation: 'h', y: -0.02 } }, { archivo: 'cap08_datos_red' });

    UI.$('#textoCoinciden').innerHTML = 'De las 5 personas con más conexiones y las 5 con más intermediación, <b>' + R.coinciden + ' coinciden</b>' + (R.coinciden < 3 ? ': en esta red, tener muchos contactos y ser puente son cosas distintas.' : ': en esta red los más conectados también son puente.');
    const ordenI = R.inter.map((_, i) => i).sort((a, b) => R.inter[b] - R.inter[a] || a - b).slice(0, 10);
    let h = '<table class="tabla"><thead><tr><th>#</th><th>Persona</th>' + (red.hayGrupos ? '<th>Grupo</th>' : '') + '<th>Conexiones</th><th>Intermediación</th><th>Cercanía</th></tr></thead><tbody>';
    ordenI.forEach((i, k) => { h += '<tr><td>' + (k + 1) + '</td><td class="izq"><b>' + UI.esc(nom[i]) + '</b></td>' + (red.hayGrupos ? '<td>' + UI.esc(red.grupos[i]) + '</td>' : '') + '<td>' + R.grado[i] + '</td><td>' + R.inter[i].toFixed(1) + '</td><td>' + R.cerc[i].toFixed(3) + '</td></tr>'; });
    UI.$('#tablaTop').innerHTML = h + '</tbody></table><div class="nota">Las 10 personas con más intermediación (ordenadas por esa medida).</div>';
    const es = new Set(R.semillasC[crit]);
    UI.graficar('figDispersion', [
      { x: R.grado.filter((_, i) => !es.has(i)), y: R.inter.filter((_, i) => !es.has(i)), text: nom.filter((_, i) => !es.has(i)), type: 'scatter', mode: 'markers', name: 'Personas', marker: { size: 9, color: oscuro ? '#9a9a9a' : '#B8B8B8', line: { color: '#555', width: 1 } }, hovertemplate: '%{text}<br>conexiones %{x}<br>intermediación %{y:.1f}<extra></extra>' },
      { x: R.semillasC[crit].map(i => R.grado[i]), y: R.semillasC[crit].map(i => R.inter[i]), text: R.semillasC[crit].map(i => nom[i]), type: 'scatter', mode: 'markers', name: 'Semillas elegidas', marker: { size: 13, color: UI.color.guinda }, hovertemplate: '%{text}<br>conexiones %{x}<br>intermediación %{y:.1f}<extra></extra>' }],
    { title: 'Conexiones frente a intermediación', xaxis: { title: { text: 'Conexiones (grado)' } }, yaxis: { title: { text: 'Intermediación' } }, legend: { x: 0.02, y: 0.98 } }, { archivo: 'cap08_datos_dispersion' });

    UI.graficar('figAdopcion', [
      { x: MED.concat(['al azar']), y: R.adopCentral.concat([R.promAzar]), type: 'bar', name: 'Centrales (y azar)', marker: { color: [UI.color.guinda, UI.color.guinda, UI.color.guinda, oscuro ? '#7d7d7d' : '#B8B8B8'] }, text: R.adopCentral.concat([R.promAzar]).map(a => a.toFixed(1) + ' %'), textposition: 'outside', cliponaxis: false },
      { x: MED, y: R.adopPerif, type: 'bar', name: 'Periféricas', marker: { color: UI.color.dorado } }],
    { title: 'Adopción final con ' + Math.min(v.nSemillas, n) + ' semillas', barmode: 'group', yaxis: { title: { text: '% de la red que adopta' }, range: [0, 112] }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap08_datos_adopcion' });
    const rondas = R.elegida.porRonda;
    UI.graficar('figRondas', [{ x: rondas.map((_, i) => i), y: rondas.map(a => 100 * a), type: 'scatter', mode: 'lines+markers', line: { color: UI.color.teal, width: 2.4 }, marker: { size: 7 } }],
      { title: 'Adopción por ronda (criterio: ' + MED[crit] + ')', xaxis: { title: { text: 'Ronda' }, dtick: 1 }, yaxis: { title: { text: '% de la red' }, range: [0, 105] }, showlegend: false }, { archivo: 'cap08_datos_rondas' });
    UI.graficar('figAzar', [{ x: R.azar, type: 'histogram', nbinsx: 12, marker: { color: oscuro ? '#7d7d7d' : '#B8B8B8', line: { color: '#555', width: 1 } } }],
      { title: 'Adopción con semillas al azar (100 sorteos)', xaxis: { title: { text: '% de la red que adopta' } }, yaxis: { title: { text: 'Sorteos' } }, showlegend: false,
        shapes: [{ type: 'line', x0: R.promAzar, x1: R.promAzar, yref: 'paper', y0: 0, y1: 1, line: { color: UI.color.guinda, width: 2, dash: 'dot' } }] }, { archivo: 'cap08_datos_sorteos_azar' });
    UI.$('#conclusion').innerHTML = conclusion(R, v);
  }

  function conclusion(R, v) {
    const nom = red.nombres, crit = v.criterio - 1, p = [], k = Math.min(v.nSemillas, R.n);
    p.push('<p><b>1. La red.</b> ' + R.n + ' personas y ' + R.nConexiones + ' conexiones (' + R.metricas.gradoProm.toFixed(1) + ' por persona), en ' + R.nComp + ' componente(s). Las personas con más conexiones son ' + R.top5g.slice(0, 3).map(i => '<b>' + UI.esc(nom[i]) + '</b>').join(', ') +
      '; las que más sirven de puente, ' + R.top5i.slice(0, 3).map(i => '<b>' + UI.esc(nom[i]) + '</b>').join(', ') + ' (coinciden ' + R.coinciden + ' de 5).</p>');
    p.push('<p><b>2. Semillas.</b> Con ' + k + ' semilla(s) y umbral ' + v.umbral.toFixed(2) + ', elegir por grado llega a ' + R.adopCentral[0].toFixed(1) + ' % de la red; por intermediación, ' + R.adopCentral[1].toFixed(1) + ' %; por cercanía, ' + R.adopCentral[2].toFixed(1) +
      ' %; al azar, ' + R.promAzar.toFixed(1) + ' % en promedio. El mejor criterio en esta red es <b>' + MED[R.mejor] + '</b>.</p>');
    p.push('<p><b>3. Cuidado.</b> ' + (R.adopCentral[R.mejor] <= R.promAzar + 3 ? 'Ningún criterio supera claramente al azar: la estructura de esta red no premia una elección «inteligente» de semillas con este umbral. ' : '') +
      'El resultado depende del <b>mecanismo de contagio</b> (umbral) y de la estructura de la red: cambien el umbral y las semillas antes de concluir. Una sola red no es una ley.</p>');
    p.push('<p><b>4. Ética.</b> Una red de relaciones expone a terceros que no consintieron ser analizados, y elegir «semillas» por su posición es tratar distinto a personas sin que lo sepan. Trabajen con seudónimos y datos agregados, y verifiquen la base legal (LFPDPPP).</p>');
    return p.join('');
  }

  function descargarResultados() {
    if (!ultimo) { alert('Primero carguen datos.'); return; }
    const { R, v } = ultimo, nom = red.nombres, f4 = x => +x.toFixed(4);
    DatosUI.descargarLibro('red_resultados.xlsx', [
      { nombre: 'Centralidad', filas: [['Persona', 'Grupo', 'Conexiones', 'Intermediación', 'Cercanía', 'Semilla (criterio elegido)']].concat(nom.map((n, i) => [n, red.grupos[i], R.grado[i], f4(R.inter[i]), f4(R.cerc[i]), R.semillasC[v.criterio - 1].indexOf(i) >= 0 ? 'sí' : 'no'])), anchos: [16, 10, 12, 16, 12, 24] },
      { nombre: 'Adopcion', filas: [['Criterio de semillas', 'Centrales (%)', 'Periféricas (%)']].concat(MED.map((m, c) => [m, f4(R.adopCentral[c]), f4(R.adopPerif[c])]), [['al azar (promedio de 100 sorteos)', f4(R.promAzar), '']]), anchos: [34, 16, 16] },
      { nombre: 'Rondas', filas: [['Ronda', '% de la red']].concat(R.elegida.porRonda.map((a, i) => [i, f4(100 * a)])) },
      { nombre: 'Resumen_y_reglas', filas: [['Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji'], ['Red social con datos propios (Cap. 8)'], [], ['Datos', origen], ['Fecha del análisis', new Date().toLocaleString('es-MX')],
        ['Personas', R.n], ['Conexiones', R.nConexiones], ['Componentes conexas', R.nComp], ['Semillas', Math.min(v.nSemillas, R.n)], ['Umbral', v.umbral], ['Criterio', MED[v.criterio - 1]], ['Coinciden en el top 5 (grado/intermediación)', R.coinciden], [],
        ['Método', 'Red no dirigida sin lazos ni repetidas. Intermediación: Brandes (2001), cada par una vez. Cercanía: personas alcanzables / suma de distancias. Cascada: adopta si la fracción de contactos que adoptó ≥ umbral; semillas por ranking estable; 100 sorteos al azar con el flujo de rand de MATLAB tras rng(42).']], anchos: [40, 90] }
    ]);
  }
  function descargarEjemplo() {
    const E = window.EJEMPLO_CAP08.club;
    DatosUI.descargarLibro('cap08_datos_ejemplo.xlsx', [{ nombre: 'Conexiones', filas: E.Conexiones, anchos: [14, 14] }, { nombre: 'Personas', filas: E.Personas, anchos: [14, 10] }]);
  }

  const columnas = [
    { id: 'origen', titulo: 'Datos', izq: true }, { id: 'nPersonas', titulo: 'Personas', dec: 0 }, { id: 'nConexiones', titulo: 'Conexiones', dec: 0 }, { id: 'nSemillas', titulo: 'Semillas', dec: 0 },
    { id: 'umbral', titulo: 'Umbral', dec: 2 }, { id: 'coinciden', titulo: 'Coinciden (de 5)', dec: 0 }, { id: 'adopGrado', titulo: '% (grado)', dec: 1 }, { id: 'adopInter', titulo: '% (interm.)', dec: 1 },
    { id: 'adopCerc', titulo: '% (cercanía)', dec: 1 }, { id: 'promedioAzar', titulo: '% (azar)', dec: 1 }
  ];
  function caso(r) { return { valores: r.metricas, extra: { adop: r.R.adopCentral.map(a => +a.toFixed(2)).concat([+r.R.promAzar.toFixed(2)]) } }; }
  function dibujarComparacion(lista) {
    UI.graficar('comp1', lista.filter(c => c.extra).map((c, i) => ({ x: MED.concat(['al azar']), y: c.extra.adop, type: 'bar', name: c.etiqueta, marker: { color: UI.colorCaso(i) } })),
      { title: 'Adopción final por criterio — casos guardados', barmode: 'group', yaxis: { title: { text: '% de la red que adopta' }, range: [0, 105] }, legend: { orientation: 'h', y: -0.25 } }, { archivo: 'cap08_datos_comparacion' });
  }

  UI.iniciarApp({
    clave: 'cap08_datos_propios', specs, defecto: Object.assign({}, C8.DEFECTO), presets, columnas, ejecutar, dibujar, leerExtra, caso, dibujarComparacion,
    alIniciar: function (diferido) {
      recalcular = diferido;
      const zona = UI.$('#zonaArchivo'), campos = UI.$('#campos');
      campos.parentNode.insertBefore(zona, campos);
      const col = document.querySelector('.columna');
      col.insertBefore(UI.$('#panelConceptos'), col.firstChild);
      UI.$('#btnRestablecer').textContent = 'Valores del libro';
      DatosUI.conectarSubida(UI.$('#archivo'), zona.querySelector('.subir'), leerArchivo);
      UI.$('#btnEjemplo1').addEventListener('click', () => cargarEjemplo('libro', 'Ejemplo 1: red sintética del libro (60 personas)'));
      UI.$('#btnEjemplo2').addEventListener('click', () => cargarEjemplo('club', 'Ejemplo 2: club de aficionados (36 personas)'));
      UI.$('#btnDescargarEjemplo').addEventListener('click', descargarEjemplo);
      UI.$('#btnDescargarResultados').addEventListener('click', descargarResultados);
      cargarEjemplo('libro', 'Ejemplo 1: red sintética del libro (60 personas)');
    }
  });
})();
