/* cap09_datos_app.js — selección multicriterio con datos propios (Excel/CSV): AHP + TOPSIS
   como recorrido guiado en 5 pasos. Cálculo: Cap09Datos (modelos/cap09_datos.js). */
(function () {
  'use strict';
  const S = Numerico.sprintf, DP = DatosPropios, C9 = Cap09Datos;

  const presets = [
    { nombre: 'Caso A', descripcion: 'Juicios del archivo', valores: { escenario: 'archivo' } },
    { nombre: 'Caso B', descripcion: 'Todos los criterios igual de importantes (todos los juicios = 1)', valores: { escenario: 'iguales' } },
    { nombre: 'Caso C', descripcion: 'El primer criterio es extremadamente más importante (9) que los demás', valores: { escenario: 'primero' } }
  ];

  let datos = null, tabla = null, origen = '', hojaNombre = '', erroresCarga = [], avisosCarga = [];
  let tipos = null, juiciosArchivo = null, cfg = { esCosto: [], J: [], barrido: 1 };
  let recalcular = function () {}, ultimo = null;
  const g3 = x => String(parseFloat(Number(x).toPrecision(3)));

  function cargarLibro(libro, nombre) {
    const hA = libro.buscar('altern', 'decis') || libro.nombres[0], hC = libro.buscar('criter'), hJ = libro.buscar('juicio');
    tabla = DP.procesarTabla(libro.hoja(hA)); origen = nombre; hojaNombre = hA;
    datos = C9.leerDecision(tabla); erroresCarga = datos.errores || []; avisosCarga = datos.avisos || [];
    if (erroresCarga.length) { datos = null; tipos = null; juiciosArchivo = null; }
    else {
      tipos = C9.leerTipos(hC && hC !== hA ? DP.procesarTabla(libro.hoja(hC)) : null, datos.criterios);
      juiciosArchivo = C9.leerJuicios(hJ && hJ !== hA ? DP.procesarTabla(libro.hoja(hJ)) : null, datos.criterios);
      avisosCarga = avisosCarga.concat(tipos.avisos, juiciosArchivo.avisos);
      cfg = { esCosto: tipos.esCosto.slice(), J: juiciosArchivo.J.map(f => f.slice()), barrido: Math.min(datos.criterios.length, datos.criterios.length) };
    }
    dibujarEstado(); dibujarControles(); recalcular();
  }
  function leerArchivo(archivo) {
    UI.$('#estadoArchivo').textContent = 'Leyendo «' + archivo.name + '»…';
    DatosUI.leerLibro(archivo, libro => cargarLibro(libro, archivo.name), function (err) {
      datos = null; tabla = null; erroresCarga = ['No se pudo leer «' + archivo.name + '» (' + err.message + '). ¿Es un Excel (.xlsx/.xls), .ods o .csv?']; UI.$('#estadoArchivo').innerHTML = '⚠ ' + UI.esc(erroresCarga[0]); dibujarControles(); recalcular();
    });
  }
  function cargarEjemplo(clave, nombre) { cargarLibro(DatosUI.libroDeObjeto(window.EJEMPLO_CAP09[clave]), nombre); }

  function dibujarEstado() {
    const res = UI.$('#resumenDatos'), vista = UI.$('#vistaDatos');
    if (!tabla) { UI.$('#estadoArchivo').textContent = 'Aún no hay datos.'; res.textContent = ''; vista.innerHTML = ''; return; }
    DatosUI.cajaEstado('#estadoArchivo', { errores: erroresCarga, avisos: avisosCarga, filasDatos: tabla.filasDatos }, origen + ' · hoja «' + hojaNombre + '»', datos ? ' · ' + datos.criterios.length + ' criterios' + (juiciosArchivo && juiciosArchivo.leido ? ', juicios leídos del archivo' : ', sin hoja de juicios') : '');
    res.innerHTML = '<b>Columnas detectadas:</b> ' + tabla.columnas.map(c => UI.esc(c.nombre) + ' <i>(' + (c.tipo === 'numerica' ? 'criterio' : 'nombres') + ')</i>').join(' · ');
    vista.innerHTML = DatosUI.vistaTabla(tabla, 8);
  }

  function dibujarControles() {
    const tt = UI.$('#tablaTipos'), mj = UI.$('#matrizJuicios'), sb = UI.$('#selBarrido');
    if (!datos) { tt.innerHTML = ''; mj.innerHTML = ''; sb.innerHTML = ''; return; }
    const C = datos.criterios, n = C.length;
    let h = '<table class="tabla"><thead><tr><th>Criterio</th><th>Tipo</th></tr></thead><tbody>';
    C.forEach((c, j) => { h += '<tr><td class="izq">' + UI.esc(c) + '</td><td><select data-tipo="' + j + '"><option value="b"' + (cfg.esCosto[j] ? '' : ' selected') + '>beneficio</option><option value="c"' + (cfg.esCosto[j] ? ' selected' : '') + '>costo</option></select></td></tr>'; });
    tt.innerHTML = h + '</tbody></table>';
    tt.querySelectorAll('[data-tipo]').forEach(s => s.addEventListener('change', () => { cfg.esCosto[+s.dataset.tipo] = s.value === 'c'; recalcular(); }));
    h = '<table class="tabla"><thead><tr><th></th>' + C.map((c, j) => '<th title="' + UI.esc(c) + '">' + (j + 1) + '</th>').join('') + '</tr></thead><tbody>';
    C.forEach(function (c, i) {
      h += '<tr><td class="izq" title="' + UI.esc(c) + '"><b>' + (i + 1) + '</b> ' + UI.esc(c.length > 14 ? c.slice(0, 13) + '…' : c) + '</td>';
      C.forEach(function (_, j) {
        if (j < i) h += '<td id="rec_' + i + '_' + j + '" style="opacity:.6">' + g3(cfg.J[i][j]) + '</td>';
        else if (j === i) h += '<td>1</td>';
        else h += '<td><input type="number" min="0.1111" max="9" step="0.001" data-i="' + i + '" data-j="' + j + '" value="' + g3(cfg.J[i][j]) + '" style="width:4.6em"></td>';
      });
      h += '</tr>';
    });
    mj.innerHTML = h + '</tbody></table>';
    mj.querySelectorAll('[data-i]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        const i = +inp.dataset.i, j = +inp.dataset.j, v = Number(inp.value);
        if (inp.value !== '' && v >= 1 / 9 - 1e-9 && v <= 9 + 1e-9) { cfg.J[i][j] = v; cfg.J[j][i] = 1 / v; const rec = UI.$('#rec_' + j + '_' + i); if (rec) rec.textContent = g3(1 / v); inp.style.outline = ''; recalcular(); }
        else inp.style.outline = '2px solid var(--alerta)';
      });
    });
    sb.innerHTML = C.map((c, j) => '<option value="' + (j + 1) + '">' + UI.esc(c) + '</option>').join(''); sb.value = cfg.barrido;
  }

  function aplicarEscenario(v) {
    if (!datos) return;
    const n = datos.criterios.length;
    cfg.esCosto = tipos.esCosto.slice();
    if (v.escenario === 'iguales') cfg.J = C9.juiciosVacios(n);
    else if (v.escenario === 'primero') { cfg.J = C9.juiciosVacios(n); for (let j = 1; j < n; j++) { cfg.J[0][j] = 9; cfg.J[j][0] = 1 / 9; } }
    else cfg.J = juiciosArchivo.J.map(f => f.slice());
    dibujarControles();
  }
  function leerExtra() {
    if (!tabla) return ['Suban el archivo con su matriz de decisión o pulsen uno de los ejemplos.'];
    if (erroresCarga.length) return ['Corrijan el archivo y vuelvan a subirlo (vean «¿Cómo ordenar mis datos?» al final de la página).'];
    return [];
  }
  function ejecutar() {
    cfg.barrido = +UI.$('#selBarrido').value || 1;
    const R = C9.evaluar(datos, { esCosto: cfg.esCosto, J: cfg.J, barrido: cfg.barrido });
    ultimo = { R, cfg: JSON.parse(JSON.stringify(cfg)) };
    const avisos = avisosCarga.slice(); if (!R.consistente) avisos.push('La razón de consistencia es ≥ 0.10: los juicios se contradicen entre sí. Revisen las comparaciones antes de confiar en los pesos.');
    const pesoMax = datos.criterios[R.a.pesos.indexOf(Math.max.apply(null, R.a.pesos))];
    return { consola: R.consola, avisos, R, metricas: Object.assign({ origen, nCrit: datos.criterios.length, pesoMax, pesoMaxValor: Math.max.apply(null, R.a.pesos) }, R.metricas) };
  }

  function dibujar(r) {
    const R = r.R, A = datos.alternativas, C = datos.criterios, n = C.length, oscuro = UI.esOscuro();
    UI.$('#kpisDatos').innerHTML = '<div class="kpi"><div class="v">' + A.length + '</div><div class="t">Alternativas</div></div><div class="kpi"><div class="v">' + n + '</div><div class="t">Criterios (' + cfg.esCosto.filter(Boolean).length + ' de costo)</div></div>';
    UI.$('#avisosDatos').innerHTML = avisosCarga.map(a => '<div class="aviso">ℹ ' + UI.esc(a) + '</div>').join('');
    let h = '<table class="tabla"><thead><tr><th>Alternativa</th>' + C.map((c, j) => '<th>' + UI.esc(c) + (cfg.esCosto[j] ? ' <i>(costo)</i>' : '') + '</th>').join('') + '</tr></thead><tbody>';
    A.forEach((a, i) => { h += '<tr><td class="izq"><b>' + UI.esc(a) + '</b></td>' + datos.X[i].map(x => '<td>' + x + '</td>').join('') + '</tr>'; });
    UI.$('#tablaDecision').innerHTML = h + '</tbody></table>';

    const consist = R.consistente;
    UI.$('#kpisAHP').innerHTML = '<div class="kpi"><div class="v">' + R.a.cr.toFixed(3) + '</div><div class="t">Razón de consistencia (límite 0.10)</div></div><div class="kpi"><div class="v" style="color:' + (consist ? 'var(--ok)' : 'var(--alerta)') + '">' + (consist ? 'Consistentes' : 'Contradictorios') + '</div><div class="t">Estado de los juicios</div></div>' +
      '<div class="kpi"><div class="v">' + R.a.lambda.toFixed(3) + '</div><div class="t">λ máximo (ideal = ' + n + ')</div></div>';
    UI.$('#textoConsistencia').innerHTML = consist ? '<p>Los juicios son <b>consistentes</b>: los pesos se pueden usar.</p>' :
      '<p><b>Los juicios se contradicen.</b> ' + (R.a.peor ? 'El par más contradictorio es «<b>' + UI.esc(C[R.a.peor.i]) + '</b>» frente a «<b>' + UI.esc(C[R.a.peor.j]) + '</b>»: ustedes escribieron <b>' + g3(R.a.peor.dado) + '</b>, pero el resto de sus juicios sugiere algo cercano a <b>' + g3(R.a.peor.sugerido) + '</b>. ' : '') +
      'Cambien ese juicio (o los que lo rodean) en la matriz de la izquierda y observen cómo baja la razón de consistencia.</p>';
    UI.graficar('figPesos', [{ x: C, y: R.a.pesos, type: 'bar', marker: { color: UI.color.teal }, text: R.a.pesos.map(w => w.toFixed(2)), textposition: 'outside', cliponaxis: false }],
      { title: S('Pesos AHP (razón de consistencia = %.3f)', R.a.cr), yaxis: { title: { text: 'Peso (suma 1)' }, range: [0, Math.max.apply(null, R.a.pesos) * 1.2] }, showlegend: false }, { archivo: 'cap09_datos_pesos' });
    UI.graficar('figMatriz', [{ z: cfg.J.map(f => f.map(x => Math.log(x))), x: C, y: C, type: 'heatmap', colorscale: [[0, '#F4E9EF'], [0.5, '#FFFFFF'], [1, '#297D82']], zmid: 0, showscale: false,
      text: cfg.J.map(f => f.map(x => g3(x))), texttemplate: '%{text}', hovertemplate: '%{y} frente a %{x}: %{text}<extra></extra>' }],
    { title: 'Matriz de comparaciones por pares', yaxis: { autorange: 'reversed' }, margin: { l: 120 } }, { archivo: 'cap09_datos_matriz' });

    UI.graficar('figTopsis', [
      { x: A, y: R.t.cercania, type: 'bar', name: 'Pesos AHP', marker: { color: UI.color.guinda } },
      { x: A, y: R.ti.cercania, type: 'bar', name: 'Pesos iguales', marker: { color: oscuro ? '#8a8a8a' : '#B8B8B8' } }],
    { title: 'TOPSIS', barmode: 'group', yaxis: { title: { text: 'Cercanía a la solución ideal' }, range: [0, 1] }, legend: { orientation: 'h', y: -0.25 } }, { archivo: 'cap09_datos_topsis' });
    let t = '<table class="tabla"><thead><tr><th>#</th><th>Alternativa</th><th>Cercanía (AHP)</th><th>Posición con pesos iguales</th></tr></thead><tbody>';
    R.t.orden.forEach((g, i) => { t += '<tr><td>' + (i + 1) + '</td><td class="izq"><b>' + UI.esc(A[g]) + '</b></td><td>' + R.t.cercania[g].toFixed(3) + '</td><td>' + (R.ti.orden.indexOf(g) + 1) + '</td></tr>'; });
    UI.$('#tablaRanking').innerHTML = t + '</tbody></table>';

    UI.$('#nomBarrido').textContent = '«' + C[cfg.barrido - 1] + '»';
    UI.graficar('figBarrido', A.map((a, j) => ({ x: R.rejilla, y: R.cercaniaBarrido.map(c => c[j]), type: 'scatter', mode: 'lines', name: a, line: { color: UI.lineas[j % UI.lineas.length], width: 2 } })),
      { title: 'Sensibilidad al peso de «' + C[cfg.barrido - 1] + '»', hovermode: 'x unified', xaxis: { title: { text: 'Peso del criterio (los demás conservan sus proporciones)' } }, yaxis: { title: { text: 'Cercanía TOPSIS' } },
        shapes: [{ type: 'line', x0: R.a.pesos[cfg.barrido - 1], x1: R.a.pesos[cfg.barrido - 1], yref: 'paper', y0: 0, y1: 1, line: { dash: 'dot', color: oscuro ? '#ccc' : '#000', width: 1.2 } }] }, { archivo: 'cap09_datos_sensibilidad' });
    UI.$('#conclusion').innerHTML = conclusion(R);
  }

  function conclusion(R) {
    const A = datos.alternativas, C = datos.criterios, p = [], b = cfg.barrido - 1;
    const orden = C.map((_, i) => i).sort((x, y) => R.a.pesos[y] - R.a.pesos[x]);
    p.push('<p><b>1. Qué importa más.</b> Con sus juicios, los pesos son ' + orden.map(i => UI.esc(C[i]) + ' ' + R.a.pesos[i].toFixed(2)).join(' &gt; ') + '. ' + (R.consistente ? 'Los juicios son consistentes (razón ' + R.a.cr.toFixed(3) + ').' : 'Pero <b>se contradicen</b> (razón ' + R.a.cr.toFixed(3) + ' ≥ 0.10): conviene revisarlos antes de decidir.') + '</p>');
    p.push('<p><b>2. Qué se elige.</b> TOPSIS con esos pesos elige <b>' + UI.esc(A[R.gAHP]) + '</b> (cercanía ' + R.t.cercania[R.gAHP].toFixed(3) + '); con pesos iguales elegiría <b>' + UI.esc(A[R.gIg]) + '</b>. ' +
      (R.gAHP === R.gIg ? 'Coinciden: la elección no depende de los juicios.' : 'No coinciden: los juicios sobre qué importa más <b>cambian la elección</b>, y por eso conviene que cada integrante los haga por separado y se discutan.') + '</p>');
    p.push('<p><b>3. Fragilidad.</b> Al mover el peso de «' + UI.esc(C[b]) + '» de 0 a 1, el ganador cambia ' + R.nCambios + ' vez(veces): ' + R.segmentos.map(s => '<b>' + UI.esc(A[s.g]) + '</b> (' + s.desde.toFixed(2) + ' a ' + s.hasta.toFixed(2) + ')').join(', ') +
      '. Su peso AHP actual es ' + R.a.pesos[b].toFixed(2) + (R.nCambios ? '; si cae cerca de un cambio, la recomendación es frágil y hay que decirlo.' : '.') + '</p>');
    p.push('<p><b>4. Límites.</b> Las calificaciones de la matriz son tan buenas como la información que las respalda. TOPSIS depende de que las alternativas incluidas sean razonables: agregar o quitar una alternativa extrema puede reordenar a las demás.</p>');
    return p.join('');
  }

  function descargarResultados() {
    if (!ultimo) { alert('Primero carguen datos.'); return; }
    const { R, cfg: c } = ultimo, A = datos.alternativas, C = datos.criterios, f4 = x => +x.toFixed(4);
    DatosUI.descargarLibro('seleccion_resultados.xlsx', [
      { nombre: 'Pesos_AHP', filas: [['Criterio', 'Tipo', 'Peso']].concat(C.map((x, j) => [x, c.esCosto[j] ? 'costo' : 'beneficio', f4(R.a.pesos[j])]), [[], ['Razón de consistencia', f4(R.a.cr)], ['λ máximo', f4(R.a.lambda)], ['Juicios consistentes (CR < 0.10)', R.consistente ? 'sí' : 'no']]), anchos: [30, 14, 12] },
      { nombre: 'Juicios', filas: [['Fila frente a columna'].concat(C)].concat(C.map((x, i) => [x].concat(c.J[i].map(f4)))), anchos: [30] },
      { nombre: 'TOPSIS', filas: [['Posición', 'Alternativa', 'Cercanía (pesos AHP)', 'Cercanía (pesos iguales)']].concat(R.t.orden.map((g, i) => [i + 1, A[g], f4(R.t.cercania[g]), f4(R.ti.cercania[g])])), anchos: [10, 34, 22, 24] },
      { nombre: 'Barrido', filas: [['Peso de ' + C[c.barrido - 1]].concat(A)].concat(R.rejilla.map((w, i) => [+w.toFixed(2)].concat(R.cercaniaBarrido[i].map(f4)))) },
      { nombre: 'Resumen_y_reglas', filas: [['Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji'], ['Selección multicriterio con datos propios (Cap. 9)'], [], ['Datos', origen], ['Fecha del análisis', new Date().toLocaleString('es-MX')], ['Elige (AHP + TOPSIS)', A[R.gAHP]], ['Elige (pesos iguales)', A[R.gIg]], [],
        ['Método', 'AHP: pesos = vector propio principal de la matriz de juicios; CR = ((λmax − n)/(n − 1))/RI con el índice aleatorio de Saaty. TOPSIS: normalización por norma euclidiana, ponderación, solución ideal y peor (invertidas en costos), cercanía = d−/(d+ + d−).']], anchos: [30, 90] }
    ]);
  }
  function descargarEjemplo() {
    const E = window.EJEMPLO_CAP09.agencia;
    DatosUI.descargarLibro('cap09_datos_ejemplo.xlsx', [{ nombre: 'Alternativas', filas: E.Alternativas, anchos: [24, 18, 22, 20, 18, 16] }, { nombre: 'Criterios', filas: E.Criterios, anchos: [24, 12] }, { nombre: 'Juicios', filas: E.Juicios, anchos: [24, 18, 22, 20, 18, 16] }]);
  }

  const columnas = [
    { id: 'origen', titulo: 'Datos', izq: true }, { id: 'nCrit', titulo: 'Criterios', dec: 0 }, { id: 'pesoMax', titulo: 'Criterio con más peso', izq: true }, { id: 'pesoMaxValor', titulo: 'Su peso', dec: 3 },
    { id: 'cr', titulo: 'Razón de consistencia', dec: 3 }, { id: 'consistente', titulo: '¿Consistente?' }, { id: 'ganadorAHP', titulo: 'Elige (AHP + TOPSIS)', izq: true }, { id: 'cercaniaGanador', titulo: 'Cercanía', dec: 3 },
    { id: 'ganadorIguales', titulo: 'Elige (pesos iguales)', izq: true }, { id: 'nCambios', titulo: 'Cambios en el barrido', dec: 0 }
  ];
  function caso(r) { return { valores: r.metricas, extra: { crit: datos.criterios.slice(), pesos: r.R.a.pesos.map(w => +w.toFixed(4)), alt: datos.alternativas.slice(), cerc: r.R.t.cercania.map(c => +c.toFixed(4)) } }; }
  function dibujarComparacion(lista) {
    const L = lista.filter(c => c.extra);
    UI.graficar('comp1', L.map((c, i) => ({ x: c.extra.crit, y: c.extra.pesos, type: 'bar', name: c.etiqueta, marker: { color: UI.colorCaso(i) } })), { title: 'Pesos AHP — casos guardados', barmode: 'group', yaxis: { title: { text: 'Peso' } }, legend: { orientation: 'h', y: -0.25 } }, { archivo: 'cap09_datos_comparacion_pesos' });
    UI.graficar('comp2', L.map((c, i) => ({ x: c.extra.alt, y: c.extra.cerc, type: 'bar', name: c.etiqueta, marker: { color: UI.colorCaso(i) } })), { title: 'Cercanía TOPSIS — casos guardados', barmode: 'group', yaxis: { title: { text: 'Cercanía' }, range: [0, 1] }, legend: { orientation: 'h', y: -0.25 } }, { archivo: 'cap09_datos_comparacion_topsis' });
  }

  UI.iniciarApp({
    clave: 'cap09_datos_propios', specs: [], defecto: { escenario: 'archivo' }, presets, columnas, ejecutar, dibujar, leerExtra, caso, dibujarComparacion,
    fijarExtra: aplicarEscenario,
    alIniciar: function (diferido) {
      recalcular = diferido;
      const zona = UI.$('#zonaArchivo'), campos = UI.$('#campos');
      campos.parentNode.insertBefore(zona, campos);
      const col = document.querySelector('.columna');
      col.insertBefore(UI.$('#panelConceptos'), col.firstChild);
      UI.$('#btnRestablecer').textContent = 'Juicios del archivo';
      UI.$('#selBarrido').addEventListener('change', diferido);
      DatosUI.conectarSubida(UI.$('#archivo'), zona.querySelector('.subir'), leerArchivo);
      UI.$('#btnEjemplo1').addEventListener('click', () => cargarEjemplo('libro', 'Ejemplo 1: herramientas del libro'));
      UI.$('#btnEjemplo2').addEventListener('click', () => cargarEjemplo('agencia', 'Ejemplo 2: agencias de mercadotecnia'));
      UI.$('#btnDescargarEjemplo').addEventListener('click', descargarEjemplo);
      UI.$('#btnDescargarResultados').addEventListener('click', descargarResultados);
      cargarEjemplo('agencia', 'Ejemplo 2: agencias de mercadotecnia');
    }
  });
})();
