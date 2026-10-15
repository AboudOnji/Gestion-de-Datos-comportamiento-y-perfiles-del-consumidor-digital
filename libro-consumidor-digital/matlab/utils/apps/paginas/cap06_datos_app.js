/* cap06_datos_app.js — evaluación de alternativas propias (Excel/CSV) con las reglas del
   Cap. 6, como recorrido guiado en 5 pasos. Cálculo: Cap06Datos (modelos/cap06_datos.js). */
(function () {
  'use strict';
  const S = Numerico.sprintf, DP = DatosPropios, C6 = Cap06Datos;

  const specs = [
    { id: 'umbralMinimo', tipo: 'numero', min: 0, max: 10, deslizMin: 0, deslizMax: 10, paso: 0.5, ayuda: '<b>Umbral mínimo</b> de la regla conjuntiva: puntaje (0 a 10) exigido en cada atributo.' },
    { id: 'toleranciaLex', tipo: 'numero', min: 0, max: 10, deslizMin: 0, deslizMax: 3, paso: 0.1, ayuda: '<b>Tolerancia</b> de la regla lexicográfica: diferencia (en puntos) que se considera empate.' }
  ];
  const presets = [
    { nombre: 'Caso A', descripcion: 'Pesos y tipos del archivo; umbral 3.5, tolerancia 0.5', valores: { umbralMinimo: 3.5, toleranciaLex: 0.5, escenario: 'archivo' } },
    { nombre: 'Caso B', descripcion: 'Pesos iguales en todos los atributos', valores: { umbralMinimo: 3.5, toleranciaLex: 0.5, escenario: 'iguales' } },
    { nombre: 'Caso C', descripcion: 'Umbral mínimo exigente: 6 puntos', valores: { umbralMinimo: 6, toleranciaLex: 0.5, escenario: 'archivo' } }
  ];

  let datos = null, criterios = null, origen = '', tabla = null, hojaNombre = '', erroresCarga = [], avisosCarga = [];
  let cfg = { esCosto: [], pesos: [], prioritario: 1, barrido: 1 };
  let recalcular = function () {}, ultimo = null;

  /* ---------- carga ---------- */
  function cargarLibro(libro, nombre) {
    const hAlt = libro.buscar('altern') || libro.nombres[0];
    const hCri = libro.buscar('criter');
    tabla = DP.procesarTabla(libro.hoja(hAlt));
    origen = nombre; hojaNombre = hAlt;
    datos = C6.leerAlternativas(tabla);
    erroresCarga = datos.errores || []; avisosCarga = datos.avisos || [];
    if (!erroresCarga.length) {
      criterios = C6.leerCriterios(hCri ? DP.procesarTabla(libro.hoja(hCri)) : null, datos.atributos);
      avisosCarga = avisosCarga.concat(criterios.avisos);
      cfg = { esCosto: criterios.esCosto.slice(), pesos: criterios.pesos.slice(), prioritario: Math.min(2, datos.atributos.length), barrido: 1 };
    } else { criterios = null; datos = null; }
    dibujarEstado(); dibujarCriterios(); recalcular();
  }
  function leerArchivo(archivo) {
    UI.$('#estadoArchivo').textContent = 'Leyendo «' + archivo.name + '»…';
    DatosUI.leerLibro(archivo, libro => cargarLibro(libro, archivo.name), function (err) {
      datos = null; erroresCarga = ['No se pudo leer «' + archivo.name + '» (' + err.message + '). ¿Es un Excel (.xlsx/.xls), .ods o .csv?']; dibujarEstado(); recalcular();
    });
  }
  function cargarEjemplo(clave, nombre) { cargarLibro(DatosUI.libroDeObjeto(window.EJEMPLO_CAP06[clave]), nombre); }

  function dibujarEstado() {
    const est = UI.$('#estadoArchivo'), res = UI.$('#resumenDatos'), vista = UI.$('#vistaDatos');
    if (!tabla) { est.textContent = 'Aún no hay datos.'; res.textContent = ''; vista.innerHTML = ''; return; }
    est.innerHTML = (erroresCarga.length ? '⚠ ' : '✔ ') + '<b>' + UI.esc(origen) + '</b> · hoja «' + UI.esc(hojaNombre) + '» · ' + tabla.filasDatos.length + ' filas' +
      (datos ? ' · ' + datos.atributos.length + ' atributos' : '') + (erroresCarga.length ? '<br>' + erroresCarga.map(UI.esc).join('<br>') : '') +
      (avisosCarga.length ? '<br>' + avisosCarga.map(a => 'ℹ ' + UI.esc(a)).join('<br>') : '');
    res.innerHTML = '<b>Columnas detectadas:</b> ' + tabla.columnas.map(c => UI.esc(c.nombre) + ' <i>(' + (c.tipo === 'numerica' ? 'atributo' : 'nombres') + ')</i>').join(' · ');
    vista.innerHTML = DatosUI.vistaTabla(tabla, 8);
  }

  function dibujarCriterios() {
    const cont = UI.$('#tablaCriterios');
    if (!datos) { cont.innerHTML = ''; ['#selPrioritario', '#selBarrido'].forEach(s => { UI.$(s).innerHTML = ''; }); return; }
    let h = '<table class="tabla"><thead><tr><th>Atributo</th><th>Tipo</th><th>Peso</th></tr></thead><tbody>';
    datos.atributos.forEach(function (a, j) {
      h += '<tr><td class="izq">' + UI.esc(a) + '</td><td><select data-tipo="' + j + '"><option value="b"' + (cfg.esCosto[j] ? '' : ' selected') + '>beneficio</option><option value="c"' + (cfg.esCosto[j] ? ' selected' : '') + '>costo</option></select></td>' +
        '<td><input type="number" min="0" step="0.05" data-peso="' + j + '" value="' + cfg.pesos[j] + '" style="width:5em"></td></tr>';
    });
    cont.innerHTML = h + '</tbody></table>';
    cont.querySelectorAll('[data-tipo]').forEach(s => s.addEventListener('change', () => { cfg.esCosto[+s.dataset.tipo] = s.value === 'c'; recalcular(); }));
    cont.querySelectorAll('[data-peso]').forEach(i => i.addEventListener('input', () => { cfg.pesos[+i.dataset.peso] = i.value === '' ? NaN : Number(i.value); recalcular(); }));
    ['#selPrioritario', '#selBarrido'].forEach(function (sel) {
      UI.$(sel).innerHTML = datos.atributos.map((a, j) => '<option value="' + (j + 1) + '">' + UI.esc(a) + '</option>').join('');
    });
    UI.$('#selPrioritario').value = cfg.prioritario; UI.$('#selBarrido').value = cfg.barrido;
  }

  function aplicarEscenario(v) {
    if (!datos || !criterios) return;
    cfg.esCosto = criterios.esCosto.slice();
    cfg.pesos = v.escenario === 'iguales' ? datos.atributos.map(() => 1) : criterios.pesos.slice();
    dibujarCriterios();
  }

  function leerExtra() {
    if (!tabla) return ['Suban el archivo con sus alternativas o pulsen uno de los ejemplos.'];
    if (erroresCarga.length) return ['Corrijan el archivo y vuelvan a subirlo (vean «¿Cómo ordenar mis datos?» al final de la página).'];
    const e = [];
    if (cfg.pesos.some(w => !Number.isFinite(w) || w < 0)) e.push('Los pesos deben ser números mayores o iguales que 0.');
    else if (!(N_(cfg.pesos) > 0)) e.push('Al menos un peso debe ser mayor que 0.');
    return e;
  }
  const N_ = a => a.reduce((s, x) => s + x, 0);

  function ejecutar(v) {
    cfg.prioritario = +UI.$('#selPrioritario').value || 1; cfg.barrido = +UI.$('#selBarrido').value || 1;
    const R = C6.evaluar(datos, { esCosto: cfg.esCosto, pesos: cfg.pesos, umbralMinimo: v.umbralMinimo, prioritario: cfg.prioritario, toleranciaLex: v.toleranciaLex, barrido: cfg.barrido });
    ultimo = { R, v, cfg: JSON.parse(JSON.stringify(cfg)) };
    const avisos = avisosCarga.slice();
    if (R.nAceptables === 0) avisos.push('Ninguna alternativa cumple el mínimo en todos los atributos: la regla conjuntiva no elige. Bajen el umbral.');
    return { consola: R.consola, avisos, R, v, metricas: Object.assign({ origen, nAlt: datos.alternativas.length, nAtr: datos.atributos.length, umbral: v.umbralMinimo,
      pesoMax: datos.atributos[R.pesos.indexOf(Math.max.apply(null, R.pesos))] }, R.metricas) };
  }

  /* ---------- figuras ---------- */
  function dibujar(r, v) {
    const R = r.R, A = datos.alternativas, T = datos.atributos, oscuro = UI.esOscuro();
    UI.$('#kpisDatos').innerHTML =
      '<div class="kpi"><div class="v">' + A.length + '</div><div class="t">Alternativas</div></div><div class="kpi"><div class="v">' + T.length + '</div><div class="t">Atributos (' + cfg.esCosto.filter(Boolean).length + ' de costo)</div></div>' +
      '<div class="kpi"><div class="v">' + UI.esc(A[R.ganadorAditiva]) + '</div><div class="t">Elige la regla aditiva</div></div>';
    UI.graficar('figPuntajes', [{ z: R.puntajes, x: T, y: A, type: 'heatmap', colorscale: [[0, '#F4E9EF'], [1, '#6F1D46']], zmin: 0, zmax: 10,
      text: R.puntajes.map(f => f.map(x => x.toFixed(1))), texttemplate: '%{text}', hovertemplate: '%{y} · %{x}: %{z:.2f}<extra></extra>', colorbar: { title: { text: 'Puntaje' } } }],
    { title: 'Puntajes normalizados (0 a 10)', yaxis: { autorange: 'reversed' }, margin: { l: 130 } }, { archivo: 'cap06_datos_puntajes' });

    const marcas = [{ g: R.ganadorAditiva, n: 'Aditiva', s: 'circle', c: UI.color.guinda }, { g: R.ganadorConj, n: 'Conjuntiva', s: 'triangle-down', c: UI.color.teal }, { g: R.ganadorLex, n: 'Lexicográfica', s: 'square', c: UI.color.dorado }];
    const nivel = A.map(() => 0), maxU = Math.max.apply(null, R.utilidad);
    const tr = [{ x: A, y: R.utilidad, type: 'bar', marker: { color: A.map((_, i) => (i === R.ganadorAditiva ? UI.color.guinda : (oscuro ? '#6b6168' : '#D9D9D9'))) }, hovertemplate: '%{x}<br>utilidad=%{y:.3f}<extra></extra>' }];
    marcas.forEach(function (m) {
      if (m.g < 0) return;
      const y = R.utilidad[m.g] + 0.04 * maxU + 0.07 * maxU * nivel[m.g]; nivel[m.g]++;
      tr.push({ x: [A[m.g]], y: [y], type: 'scatter', mode: 'markers+text', text: [m.n], textposition: 'middle right', cliponaxis: false, marker: { symbol: m.s, size: 11, color: m.c }, textfont: { color: m.c }, hovertemplate: m.n + ': ' + A[m.g] + '<extra></extra>' });
    });
    UI.graficar('figUtilidad', tr, { title: 'Utilidad aditiva y alternativa elegida por cada regla', yaxis: { title: { text: 'Utilidad aditiva (0 a 10)' }, range: [0, maxU * 1.3] }, showlegend: false }, { archivo: 'cap06_datos_utilidad' });

    UI.$('#kpisReglas').innerHTML =
      '<div class="kpi"><div class="v">' + R.nAceptables + ' de ' + A.length + '</div><div class="t">Alternativas que cumplen el mínimo (' + v.umbralMinimo + ') en todos los atributos</div></div>' +
      '<div class="kpi"><div class="v">' + UI.esc(R.ganadorConj < 0 ? 'ninguna' : A[R.ganadorConj]) + '</div><div class="t">Elige la regla conjuntiva</div></div>' +
      '<div class="kpi"><div class="v">' + UI.esc(A[R.ganadorLex]) + '</div><div class="t">Elige la lexicográfica (primero «' + UI.esc(T[ultimo.cfg.prioritario - 1]) + '»)</div></div>';
    UI.$('#textoReglas').innerHTML = '<p>' + (R.coinciden ? '<b>Las tres reglas coinciden</b>: la elección es robusta frente a la regla de decisión.' :
      '<b>Las reglas no coinciden</b>: con los mismos datos, la regla de decisión cambia la alternativa elegida. Conviene saber cuál usa realmente su cliente.') +
      (R.nAceptables ? ' Aceptables: ' + A.filter((_, i) => R.aceptables[i]).map(UI.esc).join(', ') + '.' : '') + '</p>';

    UI.$('#nomBarrido').textContent = '«' + T[ultimo.cfg.barrido - 1] + '»';
    UI.graficar('figBarrido', A.map((a, j) => ({ x: R.rejilla, y: R.utilBarrido.map(u => u[j]), type: 'scatter', mode: 'lines', name: a, line: { color: UI.lineas[j % UI.lineas.length], width: 2 } })),
      { title: 'Sensibilidad al peso de «' + T[ultimo.cfg.barrido - 1] + '»', hovermode: 'x unified', xaxis: { title: { text: 'Peso del atributo (los demás conservan sus proporciones)' } }, yaxis: { title: { text: 'Utilidad aditiva (0 a 10)' }, range: [0, 10.5] },
        shapes: [{ type: 'line', x0: R.pesos[ultimo.cfg.barrido - 1], x1: R.pesos[ultimo.cfg.barrido - 1], yref: 'paper', y0: 0, y1: 1, line: { dash: 'dot', color: oscuro ? '#ccc' : '#000', width: 1.2 } }] }, { archivo: 'cap06_datos_sensibilidad' });

    UI.$('#conclusion').innerHTML = conclusion(r, v);
  }

  function conclusion(r, v) {
    const R = r.R, A = datos.alternativas, T = datos.atributos, p = [], cf = ultimo.cfg;
    p.push('<p><b>1. Lo que se comparó.</b> ' + A.length + ' alternativas en ' + T.length + ' atributos (' + T.map(UI.esc).join(', ') + '), con los pesos ' + R.pesos.map(w => w.toFixed(2)).join(' / ') + '.</p>');
    p.push('<p><b>2. Qué elige cada regla.</b> La aditiva elige <b>' + UI.esc(A[R.ganadorAditiva]) + '</b>; la conjuntiva, <b>' + UI.esc(R.ganadorConj < 0 ? 'ninguna' : A[R.ganadorConj]) + '</b>; la lexicográfica, <b>' + UI.esc(A[R.ganadorLex]) + '</b>. ' +
      (R.coinciden ? 'Coinciden: la elección es sólida.' : 'No coinciden: la <b>regla de decisión</b> cambia el resultado.') + '</p>');
    const seg = R.segmentos.map(s => '<b>' + UI.esc(A[s.g]) + '</b> (' + s.desde.toFixed(2) + ' a ' + s.hasta.toFixed(2) + ')').join(', ');
    p.push('<p><b>3. Fragilidad.</b> Al mover el peso de «' + UI.esc(T[cf.barrido - 1]) + '» de 0 a 1 el ganador cambia ' + R.nCambios + ' vez(veces): ' + seg + '. Su peso actual es ' + R.pesos[cf.barrido - 1].toFixed(2) + '; ' +
      (R.nCambios === 0 ? 'la elección no depende de ese peso.' : 'si está cerca de un cambio, la recomendación es frágil y hay que decirlo.') + '</p>');
    p.push('<p><b>4. Límite.</b> Los puntajes dependen del mínimo y del máximo de <i>sus</i> alternativas: agregar o quitar una alternativa extrema los reescala. Los pesos son juicios de quien decide, no hechos del mercado.</p>');
    return p.join('');
  }

  /* ---------- descargas ---------- */
  function descargarResultados() {
    if (!ultimo) { alert('Primero carguen datos.'); return; }
    const { R, v, cfg: c } = ultimo, A = datos.alternativas, T = datos.atributos;
    DatosUI.descargarLibro('alternativas_resultados.xlsx', [
      { nombre: 'Puntajes', filas: [['Alternativa'].concat(T)].concat(A.map((a, i) => [a].concat(R.puntajes[i].map(x => +x.toFixed(4))))), anchos: [24] },
      { nombre: 'Utilidad_y_reglas', filas: [['Alternativa', 'Utilidad aditiva', 'Posición', 'Cumple el mínimo'], ...A.map((a, i) => [a, +R.utilidad[i].toFixed(4), R.ordenAditiva.indexOf(i) + 1, R.aceptables[i] ? 'sí' : 'no'])], anchos: [24, 16, 10, 16] },
      { nombre: 'Barrido', filas: [['Peso de ' + T[c.barrido - 1]].concat(A)].concat(R.rejilla.map((w, i) => [+w.toFixed(2)].concat(R.utilBarrido[i].map(x => +x.toFixed(4))))) },
      { nombre: 'Resumen_y_reglas', filas: [['Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji'], ['Evaluación de alternativas con datos propios (Cap. 6)'], [], ['Datos', origen], ['Fecha del análisis', new Date().toLocaleString('es-MX')],
        ['Pesos', T.map((t, j) => t + '=' + R.pesos[j].toFixed(3) + (c.esCosto[j] ? ' (costo)' : '')).join('; ')], ['Umbral mínimo', v.umbralMinimo], ['Atributo prioritario', T[c.prioritario - 1]], ['Tolerancia lexicográfica', v.toleranciaLex],
        ['Elige la regla aditiva', A[R.ganadorAditiva]], ['Elige la regla conjuntiva', R.ganadorConj < 0 ? 'ninguna' : A[R.ganadorConj]], ['Elige la regla lexicográfica', A[R.ganadorLex]], [],
        ['Método', 'Normalización min-max a 0-10 (invertida en costos; atributo constante = 5); utilidad = suma ponderada; conjuntiva: mínimo en todos los atributos; lexicográfica: atributo prioritario con tolerancia y desempate por peso.']], anchos: [34, 90] }
    ]);
  }
  function descargarEjemplo() {
    const E = window.EJEMPLO_CAP06.libro;
    DatosUI.descargarLibro('cap06_datos_ejemplo.xlsx', [{ nombre: 'Alternativas', filas: E.Alternativas, anchos: [22, 16, 16, 16, 16] }, { nombre: 'Criterios', filas: E.Criterios, anchos: [20, 12, 8] }]);
  }

  /* ---------- comparación ---------- */
  const columnas = [
    { id: 'origen', titulo: 'Datos', izq: true }, { id: 'umbral', titulo: 'Umbral', dec: 1 }, { id: 'pesoMax', titulo: 'Atributo con más peso', izq: true },
    { id: 'ganadorAditiva', titulo: 'Elige aditiva', izq: true }, { id: 'ganadorConj', titulo: 'Elige conjuntiva', izq: true }, { id: 'ganadorLex', titulo: 'Elige lexicográfica', izq: true },
    { id: 'coinciden', titulo: '¿Coinciden?' }, { id: 'nCambios', titulo: 'Cambios en el barrido', dec: 0 }
  ];
  function caso(r) { return { valores: r.metricas, extra: { alt: datos.alternativas.slice(), u: r.R.utilidad.map(x => +x.toFixed(4)) } }; }
  function dibujarComparacion(lista) {
    UI.graficar('comp1', lista.filter(c => c.extra).map((c, i) => ({ x: c.extra.alt, y: c.extra.u, type: 'bar', name: c.etiqueta, marker: { color: UI.colorCaso(i) } })),
      { title: 'Utilidad aditiva — casos guardados', barmode: 'group', yaxis: { title: { text: 'Utilidad aditiva (0 a 10)' } }, legend: { orientation: 'h', y: -0.25 } }, { archivo: 'cap06_datos_comparacion' });
  }

  UI.iniciarApp({
    clave: 'cap06_datos_propios', specs, defecto: Object.assign({}, C6.DEFECTO, { escenario: 'archivo' }), presets, columnas, ejecutar, dibujar, leerExtra, caso, dibujarComparacion,
    fijarExtra: aplicarEscenario,
    alIniciar: function (diferido) {
      recalcular = diferido;
      const zona = UI.$('#zonaArchivo'), campos = UI.$('#campos');
      campos.parentNode.insertBefore(zona, campos);
      const col = document.querySelector('.columna');
      col.insertBefore(UI.$('#panelConceptos'), col.firstChild);
      UI.$('#btnRestablecer').textContent = 'Valores del libro';
      ['#selPrioritario', '#selBarrido'].forEach(s => UI.$(s).addEventListener('change', diferido));
      DatosUI.conectarSubida(UI.$('#archivo'), zona.querySelector('.subir'), leerArchivo);
      UI.$('#btnEjemplo1').addEventListener('click', () => cargarEjemplo('libro', 'Ejemplo 1: alternativas del libro'));
      UI.$('#btnEjemplo2').addEventListener('click', () => cargarEjemplo('servicio', 'Ejemplo 2: servicios de entrega'));
      UI.$('#btnDescargarEjemplo').addEventListener('click', descargarEjemplo);
      UI.$('#btnDescargarResultados').addEventListener('click', descargarResultados);
      cargarEjemplo('libro', 'Ejemplo 1: alternativas del libro');
    }
  });
})();
