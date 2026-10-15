/* cap07_datos_app.js — atribución con recorridos propios (Excel/CSV), como recorrido guiado en
   5 pasos. Cálculo: Cap07Datos (modelos/cap07_datos.js). */
(function () {
  'use strict';
  const S = Numerico.sprintf, DP = DatosPropios, C7 = Cap07Datos;

  const specs = [
    { id: 'nTopRutas', tipo: 'entero', min: 1, max: 20, deslizMin: 3, deslizMax: 15, paso: 1, ayuda: '<b>Rutas a mostrar</b>: cuántas de las rutas más frecuentes se listan.' },
    { id: 'longitudMinima', tipo: 'entero', min: 1, max: 10, deslizMin: 1, deslizMax: 6, paso: 1, ayuda: '<b>Toques mínimos</b> de un recorrido para incluirlo (1 = todos; 2 = solo recorridos con al menos dos contactos).' }
  ];
  const presets = [
    { nombre: 'Caso A', descripcion: 'Recorridos tal como vienen', valores: { nTopRutas: 8, longitudMinima: 1, colapsar: 0 } },
    { nombre: 'Caso B', descripcion: 'Juntando toques consecutivos del mismo canal', valores: { nTopRutas: 8, longitudMinima: 1, colapsar: 1 } },
    { nombre: 'Caso C', descripcion: 'Solo recorridos de al menos 2 toques', valores: { nTopRutas: 8, longitudMinima: 2, colapsar: 0 } }
  ];

  let datos = null, tabla = null, origen = '', hojaNombre = '', erroresCarga = [], avisosCarga = [];
  let recalcular = function () {}, ultimo = null;

  function cargarFilas(filas, nombre, nombreHoja) {
    tabla = DP.procesarTabla(filas); origen = nombre; hojaNombre = nombreHoja || '';
    datos = C7.leerRecorridos(tabla);
    erroresCarga = datos.errores || []; avisosCarga = datos.avisos || [];
    if (erroresCarga.length) datos = null;
    dibujarEstado(); recalcular();
  }
  function cargarLibro(libro, nombre) { const h = libro.buscar('recorr', 'ruta') || libro.nombres[0]; cargarFilas(libro.hoja(h), nombre, h); }
  function leerArchivo(archivo) {
    UI.$('#estadoArchivo').textContent = 'Leyendo «' + archivo.name + '»…';
    DatosUI.leerLibro(archivo, libro => cargarLibro(libro, archivo.name), function (err) {
      datos = null; tabla = null; erroresCarga = ['No se pudo leer «' + archivo.name + '» (' + err.message + '). ¿Es un Excel (.xlsx/.xls), .ods o .csv?']; UI.$('#estadoArchivo').innerHTML = '⚠ ' + UI.esc(erroresCarga[0]); recalcular();
    });
  }
  function cargarEjemplo(clave, nombre) { const p = window.EJEMPLO_CAP07[clave]; cargarFilas([p.encabezados].concat(p.filas), nombre, 'Recorridos'); }

  function dibujarEstado() {
    const res = UI.$('#resumenDatos'), vista = UI.$('#vistaDatos');
    if (!tabla) { UI.$('#estadoArchivo').textContent = 'Aún no hay datos.'; res.textContent = ''; vista.innerHTML = ''; return; }
    DatosUI.cajaEstado('#estadoArchivo', { errores: erroresCarga, avisos: avisosCarga, filasDatos: tabla.filasDatos }, origen + (hojaNombre ? ' · hoja «' + hojaNombre + '»' : ''), datos ? ' · ' + datos.nRutas + ' recorridos, ' + datos.nConv + ' con compra' : '');
    res.innerHTML = '<b>Columnas detectadas:</b> ' + tabla.columnas.map(c => UI.esc(c.nombre)).join(' · ');
    vista.innerHTML = DatosUI.vistaTabla(tabla, 8);
  }

  function leerExtra() {
    if (!tabla) return ['Suban el archivo con sus recorridos o pulsen uno de los ejemplos.'];
    if (erroresCarga.length) return ['Corrijan el archivo y vuelvan a subirlo (vean «¿Cómo ordenar mis datos?» al final de la página).'];
    return [];
  }

  let errorAnalisis = null;
  function ejecutar(v) {
    const colapsar = UI.$('#opColapsar').checked ? 1 : 0;
    const R = C7.analizar(datos, { nTopRutas: v.nTopRutas, longitudMinima: v.longitudMinima, colapsar });
    if (R.error) throw new Error(R.error);
    ultimo = { R, v, colapsar };
    return { consola: R.consola, avisos: R.avisos, R, v, colapsar, metricas: Object.assign({ origen, colapsar: colapsar ? 'sí' : 'no', longitudMinima: v.longitudMinima }, R.metricas) };
  }

  function dibujar(r, v) {
    const R = r.R, oscuro = UI.esOscuro(), K = R.K, nom = R.nombres;
    UI.$('#kpisRutas').innerHTML =
      '<div class="kpi"><div class="v">' + R.nRutas.toLocaleString('es-MX') + '</div><div class="t">Recorridos analizados</div></div>' +
      '<div class="kpi"><div class="v">' + R.nConv.toLocaleString('es-MX') + ' (' + (100 * R.tasa).toFixed(1) + ' %)</div><div class="t">Terminaron en compra</div></div>' +
      '<div class="kpi"><div class="v">' + K + '</div><div class="t">Canales distintos</div></div>' +
      '<div class="kpi"><div class="v">' + R.largo.toFixed(2) + '</div><div class="t">Toques por recorrido (promedio)</div></div>';
    UI.$('#avisosRutas').innerHTML = R.avisos.map(a => '<div class="aviso">ℹ ' + UI.esc(a) + '</div>').join('');
    let h = '<table class="tabla"><thead><tr><th>#</th><th>Ruta</th><th>¿Compra?</th><th>Recorridos</th></tr></thead><tbody>';
    R.top.forEach((t, i) => { h += '<tr><td>' + (i + 1) + '</td><td class="izq">' + UI.esc(t.ruta) + '</td><td>' + (t.conv ? 'sí' : 'no') + '</td><td>' + t.n.toLocaleString('es-MX') + '</td></tr>'; });
    UI.$('#tablaTop').innerHTML = h + '</tbody></table>';

    const destinos = nom.concat(['Compra', 'Sin compra']);
    const M = R.Q.map((f, i) => f.concat([R.r[i], R.nulo[i]]));
    UI.graficar('figMatriz', [{ z: M, x: destinos, y: nom, type: 'heatmap', zmin: 0, zmax: Math.max(0.5, Math.max.apply(null, M.map(f => Math.max.apply(null, f)))), colorscale: [[0, '#FBF3F7'], [1, '#6F1D46']],
      text: M.map(f => f.map(x => (x > 0 ? x.toFixed(2) : ''))), texttemplate: '%{text}', hovertemplate: 'de %{y} a %{x}: %{z:.3f}<extra></extra>', showscale: false }],
    { title: 'Matriz de transición estimada', yaxis: { autorange: 'reversed', title: { text: 'Desde' } }, xaxis: { title: { text: 'Hacia' } }, margin: { l: 110 } }, { archivo: 'cap07_datos_matriz' });
    UI.graficar('figInicio', [
      { x: nom, y: R.pi0.map(x => 100 * x), type: 'bar', name: '% de recorridos que empiezan aquí', marker: { color: UI.color.guinda } },
      { x: nom, y: R.apariciones.map(x => 100 * x / R.nRutas), type: 'bar', name: 'Toques por cada 100 recorridos', marker: { color: UI.color.dorado } }],
    { title: 'Dónde empiezan y cuánto aparece cada canal', barmode: 'group', yaxis: { title: { text: '%' } }, legend: { orientation: 'h', y: -0.25 } }, { archivo: 'cap07_datos_inicio' });

    UI.graficar('figAtrib', [
      { x: nom, y: R.shares.ultimo.map(x => 100 * x), type: 'bar', name: 'Último clic', marker: { color: oscuro ? '#8a8a8a' : '#B8B8B8' } },
      { x: nom, y: R.shares.primero.map(x => 100 * x), type: 'bar', name: 'Primer clic', marker: { color: UI.color.dorado } },
      { x: nom, y: R.shares.lineal.map(x => 100 * x), type: 'bar', name: 'Lineal', marker: { color: UI.color.teal } },
      { x: nom, y: R.shares.remocion.map(x => 100 * x), type: 'bar', name: 'Efecto de remoción (Markov)', marker: { color: UI.color.guinda } }],
    { title: '¿Qué canal se lleva el crédito? Cuatro modelos', barmode: 'group', yaxis: { title: { text: '% de las compras atribuido' } }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap07_datos_atribucion' });
    let t = '<table class="tabla"><thead><tr><th>Canal</th><th>Toques</th><th>Último clic</th><th>Primer clic</th><th>Lineal</th><th>Remoción</th></tr></thead><tbody>';
    nom.forEach((c, i) => { t += '<tr><td class="izq"><b>' + UI.esc(c) + '</b></td><td>' + Math.round(R.apariciones[i]) + '</td>' + ['ultimo', 'primero', 'lineal', 'remocion'].map(m => '<td>' + (100 * R.shares[m][i]).toFixed(1) + ' %</td>').join('') + '</tr>'; });
    UI.$('#tablaAtrib').innerHTML = t + '</tbody></table>';
    const sub = R.masSub, dif = 100 * (R.shares.remocion[sub] - R.shares.ultimo[sub]);
    UI.$('#conclusionCanal').innerHTML = '<p>El canal más <b>subestimado por el último clic</b> es <b>' + UI.esc(nom[sub]) + '</b>: recibe ' + (100 * R.shares.ultimo[sub]).toFixed(1) + ' % con el último clic y ' + (100 * R.shares.remocion[sub]).toFixed(1) + ' % con el efecto de remoción (' + (dif >= 0 ? '+' : '−') + Math.abs(dif).toFixed(1) + ' puntos).</p>';

    UI.graficar('figRemocion', [{ x: ['Todos los canales'].concat(nom.map(c => 'Sin ' + c)), y: [100 * R.pModelo].concat(R.efecto.map(e => 100 * R.pModelo * (1 - e))), type: 'bar',
      marker: { color: [UI.color.guinda].concat(nom.map(() => UI.color.teal)) }, text: [100 * R.pModelo].concat(R.efecto.map(e => 100 * R.pModelo * (1 - e))).map(a => a.toFixed(1) + ' %'), textposition: 'outside', cliponaxis: false }],
    { title: 'Probabilidad de convertir sin cada canal (modelo)', yaxis: { title: { text: '% que convierte' }, rangemode: 'tozero' }, showlegend: false }, { archivo: 'cap07_datos_remocion' });

    UI.$('#conclusion').innerHTML = conclusion(R, v, r.colapsar);
  }

  function conclusion(R, v, colapsar) {
    const nom = R.nombres, p = [];
    const orden = nom.map((_, i) => i).sort((a, b) => R.shares.remocion[b] - R.shares.remocion[a]);
    p.push('<p><b>1. Los datos.</b> ' + R.nRutas.toLocaleString('es-MX') + ' recorridos, ' + R.nConv.toLocaleString('es-MX') + ' con compra (' + (100 * R.tasa).toFixed(1) + ' %), en ' + R.K + ' canales y ' + R.largo.toFixed(1) + ' toques en promedio' +
      (v.longitudMinima > 1 ? ' (solo recorridos de al menos ' + v.longitudMinima + ' toques)' : '') + (colapsar ? ', juntando toques consecutivos iguales' : '') + '. Con muy pocas compras, los porcentajes son poco confiables.</p>');
    p.push('<p><b>2. Quién cierra y quién ayuda.</b> Con el último clic, <b>' + UI.esc(nom[R.shares.ultimo.indexOf(Math.max.apply(null, R.shares.ultimo))]) + '</b> se lleva más crédito; con el efecto de remoción, el orden es ' +
      orden.map(i => UI.esc(nom[i]) + ' (' + (100 * R.shares.remocion[i]).toFixed(0) + ' %)').join(' &gt; ') + '. El canal más subestimado por el último clic es <b>' + UI.esc(nom[R.masSub]) + '</b>.</p>');
    p.push('<p><b>3. Decisión.</b> Antes de recortar el presupuesto de un canal porque «casi no cierra ventas», verifiquen cuánto cae la probabilidad de convertir sin él (paso 4) y confírmenlo con una prueba controlada: apagar el canal en una parte de la audiencia.</p>');
    p.push('<p><b>4. Límites.</b> La cadena de Markov de primer orden supone que el siguiente canal depende solo del actual; ignora cuánto tiempo pasó, la campaña y el dispositivo. Los recorridos que no se pudieron unir a una misma persona se parten en pedazos, y los recorridos que no terminan en compra suelen estar incompletos. La atribución <b>no prueba causalidad</b>.</p>');
    p.push('<p><b>5. Ética.</b> Unir los rastros de una persona reduce su anonimato. Trabajen con recorridos agregados y sin identificadores, y verifiquen la base legal de cada fuente (LFPDPPP).</p>');
    return p.join('');
  }

  function descargarResultados() {
    if (!ultimo) { alert('Primero carguen datos.'); return; }
    const { R, v, colapsar } = ultimo, nom = R.nombres, f4 = x => +x.toFixed(4);
    DatosUI.descargarLibro('atribucion_resultados.xlsx', [
      { nombre: 'Atribucion', filas: [['Canal', 'Toques', 'Último clic (%)', 'Primer clic (%)', 'Lineal (%)', 'Remoción (%)', 'Prob. de convertir sin el canal (%)']].concat(nom.map((c, i) => [c, Math.round(R.apariciones[i]), f4(100 * R.shares.ultimo[i]), f4(100 * R.shares.primero[i]), f4(100 * R.shares.lineal[i]), f4(100 * R.shares.remocion[i]), f4(100 * R.pModelo * (1 - R.efecto[i]))])), anchos: [22, 10, 16, 16, 12, 14, 30] },
      { nombre: 'Matriz_transicion', filas: [['Desde \\ Hacia'].concat(nom, ['Compra', 'Sin compra'])].concat(nom.map((c, i) => [c].concat(R.Q[i].map(f4), [f4(R.r[i]), f4(R.nulo[i])]))), anchos: [22] },
      { nombre: 'Rutas_frecuentes', filas: [['Ruta', 'Compra', 'Recorridos']].concat(R.top.map(t => [t.ruta, t.conv ? 'sí' : 'no', t.n])), anchos: [50, 10, 12] },
      { nombre: 'Resumen_y_reglas', filas: [['Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji'], ['Atribución con recorridos propios (Cap. 7)'], [], ['Datos', origen], ['Fecha del análisis', new Date().toLocaleString('es-MX')],
        ['Recorridos', R.nRutas], ['Con compra', R.nConv], ['Conversión observada (%)', f4(100 * R.tasa)], ['Conversión del modelo de Markov (%)', f4(100 * R.pModelo)], ['Toques mínimos', v.longitudMinima], ['Juntar toques consecutivos iguales', colapsar ? 'sí' : 'no'], [],
        ['Método', 'Cadena de Markov de primer orden estimada por conteo (inicio, transiciones, compra y sin compra). Último/primer clic: crédito al último/primer toque de los recorridos con compra. Lineal: 1/longitud a cada toque. Remoción: 1 − P(convertir sin el canal)/P(convertir), normalizada para sumar 100 %.']], anchos: [34, 90] }
    ]);
  }
  function descargarEjemplo() {
    const E = window.EJEMPLO_CAP07.tienda;
    DatosUI.descargarLibro('cap07_datos_ejemplo.xlsx', [{ nombre: 'Recorridos', filas: [E.encabezados].concat(E.filas), anchos: [40, 12, 10] }]);
  }

  const columnas = [
    { id: 'origen', titulo: 'Datos', izq: true }, { id: 'colapsar', titulo: 'Juntar repetidos' }, { id: 'longitudMinima', titulo: 'Toques mín.', dec: 0 },
    { id: 'nRutas', titulo: 'Recorridos', dec: 0 }, { id: 'tasa', titulo: '% compra', dec: 1 }, { id: 'pModelo', titulo: '% compra (modelo)', dec: 1 }, { id: 'canalSubestimado', titulo: 'Canal más subestimado', izq: true }
  ];
  function caso(r) {
    const o = {}; r.R.nombres.forEach((c, i) => { o[c] = +(100 * r.R.shares.remocion[i]).toFixed(2); });
    const u = {}; r.R.nombres.forEach((c, i) => { u[c] = +(100 * r.R.shares.ultimo[i]).toFixed(2); });
    return { valores: r.metricas, extra: { rem: o, ult: u } };
  }
  function dibujarComparacion(lista) {
    const todos = []; lista.forEach(c => { if (c.extra) Object.keys(c.extra.rem).forEach(k => { if (todos.indexOf(k) < 0) todos.push(k); }); });
    UI.graficar('comp1', lista.filter(c => c.extra).map((c, i) => ({ x: todos, y: todos.map(k => c.extra.rem[k] || 0), type: 'bar', name: c.etiqueta + ' (remoción)', marker: { color: UI.colorCaso(i) } })),
      { title: 'Efecto de remoción por canal — casos guardados', barmode: 'group', yaxis: { title: { text: '% de las compras' } }, legend: { orientation: 'h', y: -0.25 } }, { archivo: 'cap07_datos_comparacion' });
  }

  UI.iniciarApp({
    clave: 'cap07_datos_propios', specs, defecto: Object.assign({}, C7.DEFECTO), presets, columnas, ejecutar, dibujar, leerExtra, caso, dibujarComparacion,
    fijarExtra: function (v) { UI.$('#opColapsar').checked = !!v.colapsar; },
    alIniciar: function (diferido) {
      recalcular = diferido;
      const zona = UI.$('#zonaArchivo'), campos = UI.$('#campos');
      campos.parentNode.insertBefore(zona, campos);
      const col = document.querySelector('.columna');
      col.insertBefore(UI.$('#panelConceptos'), col.firstChild);
      UI.$('#btnRestablecer').textContent = 'Valores del libro';
      UI.$('#opColapsar').addEventListener('change', diferido);
      DatosUI.conectarSubida(UI.$('#archivo'), zona.querySelector('.subir'), leerArchivo);
      UI.$('#btnEjemplo1').addEventListener('click', () => cargarEjemplo('libro', 'Ejemplo 1: 3 000 recorridos simulados (libro)'));
      UI.$('#btnEjemplo2').addEventListener('click', () => cargarEjemplo('tienda', 'Ejemplo 2: tienda de ropa (ficticia)'));
      UI.$('#btnDescargarEjemplo').addEventListener('click', descargarEjemplo);
      UI.$('#btnDescargarResultados').addEventListener('click', descargarResultados);
      cargarEjemplo('libro', 'Ejemplo 1: 3 000 recorridos simulados (libro)');
    }
  });
})();
