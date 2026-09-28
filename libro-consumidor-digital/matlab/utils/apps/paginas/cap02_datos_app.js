/* cap02_datos_app.js — segmentación con datos propios (Excel/CSV) y
   arquetipos definidos en la página. Compara arquetipos FIJOS contra
   segmentos AJUSTADOS a los datos (Cap02.analizarConArquetipos). */
(function () {
  'use strict';
  const S = Numerico.sprintf;
  const VARS = DatosPropios.REQUERIDAS.map(r => r.nombre);
  const ETIQ = ['Frecuencia', 'Ticket', 'Engagement'];
  const K_MIN = 2, K_MAX = 8;

  const ARQUETIPOS_LIBRO = [
    { nombre: 'Ocasional', valores: [1.5, 350, 25] },
    { nombre: 'Leal', valores: [4.0, 900, 78] },
    { nombre: 'Intermedio', valores: [2.6, 600, 52] }
  ];
  const copiaArq = a => a.map(x => ({ nombre: x.nombre, valores: x.valores.slice() }));

  // Estado
  let tabla = null, origen = '', hoja = '', columnasArchivo = null;
  let arquetipos = copiaArq(ARQUETIPOS_LIBRO);
  let recalcular = function () {};
  let matriz = null, ultimo = null;

  /* ---------- carga de datos ---------- */
  function cargarFilas(filas, nombre, nombreHoja) {
    tabla = DatosPropios.procesarTabla(filas);
    origen = nombre; hoja = nombreHoja || '';
    const mapa = tabla.errores.length ? { errores: [], avisos: [], nombres: [] } : DatosPropios.mapearColumnas(tabla);
    tabla.errores = tabla.errores.concat(mapa.errores);
    tabla.avisos = tabla.avisos.concat(mapa.avisos);
    columnasArchivo = mapa.nombres;
    dibujarResumenDatos();
    recalcular();
  }

  function leerArchivo(archivo) {
    const lector = new FileReader();
    UI.$('#estadoArchivo').textContent = 'Leyendo «' + archivo.name + '»…';
    lector.onload = function (e) {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const nombreHoja = wb.SheetNames.find(n => n.trim().toLowerCase() === 'datos') || wb.SheetNames[0];
        const filas = XLSX.utils.sheet_to_json(wb.Sheets[nombreHoja], { header: 1, raw: true, defval: null, blankrows: false });
        cargarFilas(filas, archivo.name, nombreHoja);
      } catch (err) {
        tabla = null;
        UI.$('#estadoArchivo').innerHTML = '⚠ No se pudo leer «' + UI.esc(archivo.name) + '». ¿Es un Excel (.xlsx/.xls), .ods o .csv? (' + UI.esc(err.message) + ')';
        recalcular();
      }
    };
    lector.readAsArrayBuffer(archivo);
  }

  function cargarEjemplo() {
    const E = window.EJEMPLO_CAP02;
    cargarFilas([E.encabezados].concat(E.filas), 'Datos de ejemplo (sintéticos)', 'Datos');
  }

  function dibujarResumenDatos() {
    const est = UI.$('#estadoArchivo'), res = UI.$('#resumenDatos'), vista = UI.$('#vistaDatos');
    if (!tabla) { est.textContent = 'Aún no hay datos.'; res.textContent = ''; vista.innerHTML = ''; return; }
    const tipos = { id: 'identificador', numerica: 'numérica', texto: 'texto', vacia: 'vacía' };
    est.innerHTML = (tabla.errores.length ? '⚠ ' : '✔ ') + '<b>' + UI.esc(origen) + '</b>' + (hoja ? ' · hoja «' + UI.esc(hoja) + '»' : '') +
      ' · ' + tabla.filasDatos.length + ' clientes' + (tabla.errores.length ? '<br>' + tabla.errores.map(UI.esc).join('<br>') : '');
    res.innerHTML = '<b>Columnas detectadas:</b> ' + tabla.columnas.map(c => UI.esc(c.nombre) + ' <i>(' +
      ((columnasArchivo || []).includes(c.nombre) ? 'se usa' : (c.tipo === 'id' ? 'identificador' : 'no se usa: ' + tipos[c.tipo])) +
      (c.nVacios ? ', ' + c.nVacios + ' vacías' : '') + (c.tipo === 'numerica' && c.nTexto ? ', ' + c.nTexto + ' con texto' : '') + ')</i>').join(' · ') +
      (tabla.avisos.length ? '<br>' + tabla.avisos.map(a => 'ℹ ' + UI.esc(a)).join('<br>') : '');
    let h = '<table class="tabla"><thead><tr><th>Fila</th>' + tabla.columnas.map(c => '<th>' + UI.esc(c.nombre) + '</th>').join('') + '</tr></thead><tbody>';
    tabla.filasDatos.slice(0, 8).forEach(r => {
      h += '<tr><td>' + r.filaExcel + '</td>' + r.celdas.map(v => '<td>' + (v === null || v === undefined ? '<i>vacía</i>' : UI.esc(v)) + '</td>').join('') + '</tr>';
    });
    h += '</tbody></table><div class="nota">Primeras ' + Math.min(8, tabla.filasDatos.length) + ' filas de ' + tabla.filasDatos.length + ' (número de fila como en Excel).</div>';
    vista.innerHTML = h;
  }

  /* ---------- arquetipos editables ---------- */
  function dibujarArquetipos() {
    // una tarjeta por arquetipo: nombre arriba y los 3 valores con su unidad
    const etiquetas = ['Frecuencia', 'Ticket (MXN)', 'Engagement'];
    let h = '';
    arquetipos.forEach(function (a, i) {
      h += '<div class="arq" style="border-left-color:' + UI.lineas[i % UI.lineas.length] + '"><div class="arq-cab">' +
        '<input type="text" data-f="' + i + '" data-c="n" value="' + UI.esc(a.nombre) + '" aria-label="Nombre del arquetipo ' + (i + 1) + '">' +
        '<button class="btn sec peq" type="button" data-quitar="' + i + '" title="Quitar este arquetipo"' + (arquetipos.length <= K_MIN ? ' disabled' : '') + '>✕</button></div>' +
        '<div class="arq-vals">' + a.valores.map((v, j) => '<label><span>' + etiquetas[j] + '</span>' +
          '<input type="number" step="any" data-f="' + i + '" data-c="' + j + '" value="' + v + '" aria-label="' + etiquetas[j] + ' de ' + UI.esc(a.nombre) + '"></label>').join('') + '</div></div>';
    });
    const cont = UI.$('#matrizArquetipos');
    cont.innerHTML = h;
    cont.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        const a = arquetipos[+inp.dataset.f];
        if (inp.dataset.c === 'n') a.nombre = inp.value;
        else a.valores[+inp.dataset.c] = inp.value === '' ? NaN : Number(inp.value);
        recalcular();
      });
    });
    cont.querySelectorAll('[data-quitar]').forEach(b => b.addEventListener('click', function () {
      arquetipos.splice(+b.dataset.quitar, 1); dibujarArquetipos(); recalcular();
    }));
    UI.$('#btnAgregarArquetipo').disabled = arquetipos.length >= K_MAX;
  }

  /* ---------- validación y análisis ---------- */
  function leerExtra(v) {
    v.arquetipos = copiaArq(arquetipos);
    const e = [];
    const k = arquetipos.length;
    if (k < K_MIN || k > K_MAX) e.push('Definan entre ' + K_MIN + ' y ' + K_MAX + ' arquetipos.');
    arquetipos.forEach(function (a, i) {
      if (!a.nombre.trim()) e.push('El arquetipo ' + (i + 1) + ' no tiene nombre.');
      if (!a.valores.every(Number.isFinite)) e.push('Al arquetipo «' + (a.nombre || i + 1) + '» le faltan valores.');
    });
    const nombres = arquetipos.map(a => a.nombre.trim().toLowerCase());
    if (new Set(nombres).size < nombres.length) e.push('Hay arquetipos con el mismo nombre; usen nombres distintos.');
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      if (arquetipos[i].valores.every((x, t) => x === arquetipos[j].valores[t])) e.push('Los arquetipos «' + arquetipos[i].nombre + '» y «' + arquetipos[j].nombre + '» tienen los mismos valores.');
    }
    if (!tabla) e.push('Suban el archivo de sus clientes o pulsen «Usar datos de ejemplo».');
    else if (tabla.errores.length) e.push('Corrijan el archivo y vuelvan a subirlo (vean «¿Cómo ordenar mis datos?» al final de la página).');
    if (e.length) return e;
    matriz = DatosPropios.construirMatriz(tabla, columnasArchivo, k);
    return matriz.errores;
  }

  function ejecutar(v) {
    const arq = v.arquetipos, k = arq.length, M = matriz;
    const R = Cap02.analizarConArquetipos(M.datos, arq.map(a => a.valores));
    const n = M.datos.length;
    const nom = arq.map(a => a.nombre.trim());
    const L = [];
    L.push(S('=== Resultados con %d arquetipos, n=%d clientes ===', k, n));
    L.push('Datos: ' + origen + (hoja ? ' (hoja «' + hoja + '»)' : ''));
    L.push('Arquetipos: ' + nom.join(', '));
    if (M.descartadas.length) L.push(S('Filas descartadas por datos faltantes o no numéricos: %d', M.descartadas.length));
    L.push('');
    L.push('--- (1) Arquetipos FIJOS (tal como ustedes los definieron) ---');
    L.push(S('Asignación al arquetipo más cercano: silueta promedio = %.3f', R.fijo.silProm));
    L.push(S('Pertenencia difusa: %.1f%% de los clientes no pertenece claramente (<60%%) a ningún arquetipo', 100 * R.fijo.ambiguos));
    L.push('Clientes por arquetipo: ' + nom.map((x, s) => x + '=' + R.fijo.tam[s]).join(', '));
    L.push('');
    L.push('--- (2) Segmentos AJUSTADOS a los datos (k-means y fuzzy c-means que parten de sus arquetipos) ---');
    L.push(S('k-means: silueta promedio = %.3f', R.ajustado.silProm));
    L.push(S('Fuzzy c-means: %.1f%% de los consumidores no tiene pertenencia dominante (<60%%) a ningún segmento', 100 * R.ajustado.ambiguos));
    L.push('Clientes por segmento: ' + nom.map((x, s) => x + '=' + R.ajustado.tam[s]).join(', '));
    L.push(S('Clientes que cambian de segmento al ajustar: %d (%.1f%%)', R.cambian, 100 * R.cambian / n));
    L.push('Desplazamiento de cada arquetipo (desv. estándar): ' + nom.map((x, s) => x + '=' + R.desplazamiento[s].toFixed(2)).join(', '));

    const avisos = M.avisos.slice();
    R.fijo.tam.forEach((t, s) => { if (t === 0) avisos.push('Ningún cliente tiene a «' + nom[s] + '» como su arquetipo más cercano: a todos se les parece más otro arquetipo.'); });
    R.ajustado.tam.forEach((t, s) => { if (t === 0) avisos.push('Al ajustar, el segmento «' + nom[s] + '» quedó vacío: otro arquetipo describe mejor a esos clientes. Consideren quitarlo o cambiar sus valores.'); });
    arq.forEach(function (a, s) {
      const fuera = a.valores.map((x, j) => (x < R.mu[j] - 3 * R.sd[j] || x > R.mu[j] + 3 * R.sd[j]) ? ETIQ[j] : null).filter(Boolean);
      if (fuera.length) avisos.push('El arquetipo «' + a.nombre + '» está muy lejos de sus datos en ' + fuera.join(' y ') + ' (más de 3 desviaciones estándar del promedio).');
    });
    ultimo = { R, M, nom, k, n, arq };
    return {
      consola: L.join('\n'), avisos, R, M, nom, k, n, arq,
      metricas: {
        origen, arquetipos: nom.join(', '), n, k,
        silFijo: R.fijo.silProm, ambFijo: 100 * R.fijo.ambiguos,
        silAj: R.ajustado.silProm, ambAj: 100 * R.ajustado.ambiguos, pctCambian: 100 * R.cambian / n
      }
    };
  }

  /* ---------- figuras ---------- */
  function fmt(v) { return Math.abs(v) >= 100 ? v.toFixed(0) : (+v.toFixed(2)).toString(); }

  function dibujar(r) {
    const R = r.R, k = r.k, nom = r.nom;
    const jx = Math.max(0, VARS.indexOf(UI.$('#ejeX').value)), jy = Math.max(0, VARS.indexOf(UI.$('#ejeY').value));
    const x = R.X.map(f => f[jx]), y = R.X.map(f => f[jy]);
    const oscuro = UI.esOscuro(), tinta = oscuro ? '#fff' : '#000';
    const ejes = {
      xaxis: { title: { text: VARS[jx] + ' (estandarizada)' } },
      yaxis: { title: { text: VARS[jy] + ' (estandarizada)' } },
      legend: { orientation: 'h', y: -0.34 }, margin: { b: 110 }
    };
    const puntos = function (etiqueta) {
      const t = [];
      for (let s = 1; s <= k; s++) {
        const idx = etiqueta.map((e, i) => e === s ? i : -1).filter(i => i >= 0);
        t.push({ x: idx.map(i => x[i]), y: idx.map(i => y[i]), type: 'scatter', mode: 'markers', name: nom[s - 1],
          text: idx.map(i => r.M.ids[i]), hovertemplate: '%{text}<extra>' + UI.esc(nom[s - 1]) + '</extra>',
          marker: { color: UI.lineas[(s - 1) % UI.lineas.length], size: 6, symbol: 'circle-open', line: { width: 1.5 } } });
      }
      return t;
    };
    // (1) fijos
    const t1 = puntos(R.fijo.etiqueta);
    t1.push({ x: R.Cz.map(c => c[jx]), y: R.Cz.map(c => c[jy]), type: 'scatter', mode: 'markers+text', name: 'arquetipos definidos',
      text: nom, textposition: 'top center', textfont: { color: tinta, size: 12 },
      marker: { symbol: 'star', size: 18, color: nom.map((_, s) => UI.lineas[s % UI.lineas.length]), line: { color: tinta, width: 1.5 } } });
    UI.graficar('fig1a', t1, Object.assign({ title: S('Arquetipos fijos (silueta = %.2f, %.0f%% ambiguos)', R.fijo.silProm, 100 * R.fijo.ambiguos) }, ejes),
      { archivo: 'arquetipos_fijos' });

    // (2) ajustados, con flechas definido -> ajustado (centros k-means)
    const t2 = puntos(R.ajustado.etiqueta);
    const Ckz = R.ajustado.centrosKmeans.map(c => c.map((v, j) => (v - R.mu[j]) / R.sd[j]));
    t2.push({ x: R.Cz.map(c => c[jx]), y: R.Cz.map(c => c[jy]), type: 'scatter', mode: 'markers', name: 'definidos',
      marker: { symbol: 'star-open', size: 16, color: tinta, line: { width: 1.5 } }, hoverinfo: 'skip' });
    t2.push({ x: Ckz.map(c => c[jx]), y: Ckz.map(c => c[jy]), type: 'scatter', mode: 'markers+text', name: 'ajustados',
      text: nom, textposition: 'top center', textfont: { color: tinta, size: 12 },
      marker: { symbol: 'x-thin', size: 14, line: { width: 3, color: tinta } } });
    const flechas = R.Cz.map((c, s) => ({ x: Ckz[s][jx], y: Ckz[s][jy], ax: c[jx], ay: c[jy], xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
      showarrow: true, arrowhead: 3, arrowsize: 1.2, arrowwidth: 2, arrowcolor: UI.lineas[s % UI.lineas.length], text: '' }));
    UI.graficar('fig1b', t2, Object.assign({ title: S('Ajustados a los datos (silueta = %.2f, %.0f%% ambiguos)', R.ajustado.silProm, 100 * R.ajustado.ambiguos),
      annotations: flechas }, ejes), { archivo: 'arquetipos_ajustados' });

    // radar definido vs ajustado
    const cats = VARS.concat([VARS[0]]);
    const t3 = [];
    nom.forEach(function (n, s) {
      const col = UI.lineas[s % UI.lineas.length];
      const pd = R.perfilesDefinidos[s], pa = R.perfilesAjustados[s];
      t3.push({ type: 'scatterpolar', r: pd.concat([pd[0]]), theta: cats, mode: 'lines', name: n + ' (definido)', legendgroup: 'a' + s,
        line: { color: col, width: 2, dash: 'dot' }, hovertemplate: '%{theta}: %{r:.2f}<extra>' + UI.esc(n) + ' definido</extra>' });
      t3.push({ type: 'scatterpolar', r: pa.concat([pa[0]]), theta: cats, mode: 'lines+markers', name: n + ' (ajustado)', legendgroup: 'a' + s,
        line: { color: col, width: 2.5 }, marker: { size: 6 }, hovertemplate: '%{theta}: %{r:.2f}<extra>' + UI.esc(n) + ' ajustado</extra>' });
    });
    UI.graficar('fig2', t3, { title: 'Perfil definido (···) contra ajustado (—)', polar: { radialaxis: { range: [0, 1.05] } },
      legend: { orientation: 'h', y: -0.12, font: { size: 10 } }, margin: { l: 110, r: 110, b: 90 } }, { archivo: 'arquetipos_radar' });

    // clientes por arquetipo
    UI.graficar('fig3', [
      { x: nom, y: R.fijo.tam, type: 'bar', name: 'Fijos', marker: { color: UI.color.gris }, text: R.fijo.tam.map(String), textposition: 'outside', cliponaxis: false },
      { x: nom, y: R.ajustado.tam, type: 'bar', name: 'Ajustados', marker: { color: UI.color.guinda }, text: R.ajustado.tam.map(String), textposition: 'outside', cliponaxis: false }
    ], { title: 'Clientes por arquetipo', barmode: 'group', yaxis: { title: { text: 'Número de clientes' }, rangemode: 'tozero' },
      legend: { orientation: 'h', y: -0.15 } }, { archivo: 'arquetipos_clientes' });

    // distribución de u_max
    const bins = { start: 1 / k - 1e-9, end: 1.0001, size: (1 - 1 / k) / 20 };
    UI.graficar('fig4', [
      { x: R.fijo.umax, type: 'histogram', name: 'Fijos', xbins: bins, marker: { color: UI.color.gris }, opacity: 0.75 },
      { x: R.ajustado.umax, type: 'histogram', name: 'Ajustados', xbins: bins, marker: { color: UI.color.guinda }, opacity: 0.65 }
    ], { title: 'Pertenencia máxima de cada cliente', barmode: 'overlay',
      xaxis: { title: { text: 'u_max (1 = pertenece por completo a un arquetipo)' }, range: [1 / k, 1] },
      yaxis: { title: { text: 'Clientes' } },
      shapes: [{ type: 'line', x0: 0.6, x1: 0.6, yref: 'paper', y0: 0, y1: 1, line: { dash: 'dot', color: UI.color.dorado, width: 2 } }],
      annotations: [{ x: 0.6, yref: 'paper', y: 1, text: 'ambiguos ←', showarrow: false, xanchor: 'right', yanchor: 'top' }] },
    { archivo: 'arquetipos_pertenencia' });

    dibujarTablaArquetipos(r);
  }

  function dibujarTablaArquetipos(r) {
    const R = r.R;
    let h = '<table class="tabla"><thead><tr><th>Arquetipo</th><th>Clientes (fijo)</th><th>Clientes (ajustado)</th>' +
      VARS.map(n => '<th>' + UI.esc(n) + '<br><span style="text-transform:none">definido → ajustado</span></th>').join('') +
      '<th>Desplazamiento</th></tr></thead><tbody>';
    r.nom.forEach(function (n, s) {
      h += '<tr><td><span class="chip-color" style="background:' + UI.lineas[s % UI.lineas.length] + '"></span>' + UI.esc(n) + '</td><td>' +
        R.fijo.tam[s] + '</td><td>' + R.ajustado.tam[s] + '</td>' +
        r.arq[s].valores.map((v, j) => '<td>' + fmt(v) + ' → <b>' + fmt(R.ajustado.centrosFCM[s][j]) + '</b></td>').join('') +
        '<td>' + R.desplazamiento[s].toFixed(2) + '</td></tr>';
    });
    h += '<tr><td><i>Promedio de sus datos</i></td><td>' + r.n + '</td><td>' + r.n + '</td>' + R.mu.map(v => '<td><i>' + fmt(v) + '</i></td>').join('') + '<td></td></tr>';
    h += '</tbody></table>';
    UI.$('#tablaPerfiles').innerHTML = h;
  }

  /* ---------- descargas ---------- */
  function descargarResultados() {
    if (!ultimo) { alert('Primero carguen datos y definan sus arquetipos.'); return; }
    const { R, M, nom, k, n, arq } = ultimo;
    const idNombre = tabla.idCol || 'Fila';
    const filas = M.datos.map(function (d, i) {
      const f = {};
      f[idNombre] = M.ids[i];
      VARS.forEach((nm, j) => { f[nm] = d[j]; });
      f.Arquetipo_fijo = nom[R.fijo.etiqueta[i] - 1];
      nom.forEach((a, s) => { f['Pertenencia_fija_' + a] = +R.fijo.U[s][i].toFixed(4); });
      f.Ambiguo_fijo = R.fijo.umax[i] < 0.6 ? 'Sí' : 'No';
      f.Segmento_ajustado = nom[R.ajustado.etiqueta[i] - 1];
      nom.forEach((a, s) => { f['Pertenencia_ajustada_' + a] = +R.ajustado.U[s][i].toFixed(4); });
      f.Ambiguo_ajustado = R.ajustado.umax[i] < 0.6 ? 'Sí' : 'No';
      f.Cambio_de_segmento = R.fijo.etiqueta[i] !== R.ajustado.etiqueta[i] ? 'Sí' : 'No';
      return f;
    });
    const arquetiposHoja = nom.map(function (a, s) {
      const f = { Arquetipo: a, Clientes_fijo: R.fijo.tam[s], Clientes_ajustado: R.ajustado.tam[s] };
      VARS.forEach((nm, j) => { f[nm + '_definido'] = arq[s].valores[j]; f[nm + '_ajustado'] = +R.ajustado.centrosFCM[s][j].toFixed(4); });
      f.Desplazamiento_desv_est = +R.desplazamiento[s].toFixed(4);
      return f;
    });
    const resumen = [
      ['Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji'],
      ['Segmentación con datos propios y arquetipos definidos (Cap. 2)'],
      [],
      ['Datos', origen + (hoja ? ' (hoja ' + hoja + ')' : '')],
      ['Fecha del análisis', new Date().toLocaleString('es-MX')],
      ['Clientes analizados', n],
      ['Filas descartadas', M.descartadas.length],
      ['Arquetipos (k)', k + ': ' + nom.join(', ')],
      [],
      ['', 'Arquetipos fijos', 'Ajustados a los datos'],
      ['Silueta promedio', +R.fijo.silProm.toFixed(4), +R.ajustado.silProm.toFixed(4)],
      ['% pertenencia ambigua (u_max < 0.6)', +(100 * R.fijo.ambiguos).toFixed(2), +(100 * R.ajustado.ambiguos).toFixed(2)],
      ['Clientes que cambian de segmento al ajustar', R.cambian],
      [],
      ['Método', 'Variables estandarizadas (z-score con la media y desviación de los datos). Fijos: arquetipo más cercano y pertenencia difusa (m = 2) a los arquetipos definidos. Ajustados: k-means y fuzzy c-means (m = 2, 100 iteraciones, tolerancia 1e-5) que parten de los arquetipos definidos.']
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), 'Resultados');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arquetiposHoja), 'Arquetipos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');
    if (M.descartadas.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(M.descartadas.map(d => ({ Fila_Excel: d.fila, Motivo: d.motivo }))), 'Filas_descartadas');
    XLSX.writeFile(wb, 'segmentacion_arquetipos_resultados.xlsx');
  }

  function descargarEjemplo() {
    const E = window.EJEMPLO_CAP02;
    const wb = XLSX.utils.book_new();
    const wsD = XLSX.utils.aoa_to_sheet([E.encabezados].concat(E.filas));
    wsD['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 21 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsD, 'Datos');
    XLSX.writeFile(wb, 'cap02_datos_ejemplo.xlsx');
  }

  /* ---------- comparación ---------- */
  const columnas = [
    { id: 'origen', titulo: 'Datos', izq: true }, { id: 'arquetipos', titulo: 'Arquetipos', izq: true },
    { id: 'n', titulo: 'Clientes', dec: 0 }, { id: 'k', titulo: 'k', dec: 0 },
    { id: 'silFijo', titulo: 'Silueta fijos', dec: 3 }, { id: 'ambFijo', titulo: '% ambiguos fijos', dec: 1 },
    { id: 'silAj', titulo: 'Silueta ajustados', dec: 3 }, { id: 'ambAj', titulo: '% ambiguos ajustados', dec: 1 },
    { id: 'pctCambian', titulo: '% cambian de segmento', dec: 1 }
  ];
  function dibujarComparacion(lista) {
    const nombres = lista.map(c => c.etiqueta);
    const par = (a, b, titulo, eje, archivo, dec, suf) => UI.graficar(archivo, [
      { x: nombres, y: lista.map(c => c.valores[a]), type: 'bar', name: 'Fijos', marker: { color: UI.color.gris },
        text: lista.map(c => c.valores[a].toFixed(dec) + suf), textposition: 'outside', cliponaxis: false },
      { x: nombres, y: lista.map(c => c.valores[b]), type: 'bar', name: 'Ajustados', marker: { color: UI.color.guinda },
        text: lista.map(c => c.valores[b].toFixed(dec) + suf), textposition: 'outside', cliponaxis: false }
    ], { title: titulo, barmode: 'group', yaxis: { title: { text: eje }, rangemode: 'tozero' }, legend: { orientation: 'h', y: -0.2 } },
    { archivo: 'comparacion_' + archivo });
    par('silFijo', 'silAj', 'Silueta promedio por caso', 'Silueta (−1 a 1)', 'comp1', 3, '');
    par('ambFijo', 'ambAj', '% de pertenencia ambigua por caso', '% de clientes', 'comp2', 1, ' %');
  }

  UI.iniciarApp({
    clave: 'cap02_datos_arquetipos', specs: [], defecto: { arquetipos: ARQUETIPOS_LIBRO }, presets: [], columnas,
    ejecutar, dibujar, leerExtra, dibujarComparacion,
    fijarExtra: function (v) { arquetipos = copiaArq(v.arquetipos); dibujarArquetipos(); },
    caso: r => ({ valores: r.metricas }),
    alIniciar: function (diferido) {
      recalcular = diferido;
      const zona = UI.$('#zonaArchivo'), campos = UI.$('#campos');
      campos.parentNode.insertBefore(zona, campos);
      UI.$('#btnRestablecer').textContent = 'Arquetipos del libro';
      UI.$('#btnRestablecer').style.display = 'none'; // ya hay un botón igual junto a la tabla
      ['#ejeX', '#ejeY'].forEach((id, i) => {
        UI.$(id).innerHTML = VARS.map(n => '<option>' + n + '</option>').join('');
        UI.$(id).value = VARS[i === 0 ? 0 : 2];
        UI.$(id).addEventListener('change', diferido);
      });
      const input = UI.$('#archivo');
      input.addEventListener('change', () => { if (input.files[0]) leerArchivo(input.files[0]); input.value = ''; });
      const caja = zona.querySelector('.subir');
      ['dragenter', 'dragover'].forEach(ev => caja.addEventListener(ev, e => { e.preventDefault(); caja.classList.add('encima'); }));
      ['dragleave', 'drop'].forEach(ev => caja.addEventListener(ev, e => { e.preventDefault(); caja.classList.remove('encima'); }));
      caja.addEventListener('drop', e => { if (e.dataTransfer.files[0]) leerArchivo(e.dataTransfer.files[0]); });
      UI.$('#btnEjemplo').addEventListener('click', cargarEjemplo);
      UI.$('#btnDescargarEjemplo').addEventListener('click', descargarEjemplo);
      UI.$('#btnDescargarResultados').addEventListener('click', descargarResultados);
      UI.$('#btnAgregarArquetipo').addEventListener('click', function () {
        if (arquetipos.length >= K_MAX) return;
        // nuevo arquetipo propuesto en el promedio de los datos (o el último + algo)
        const base = ultimo ? ultimo.R.mu.map(v => +v.toFixed(2)) : arquetipos[arquetipos.length - 1].valores.slice();
        arquetipos.push({ nombre: 'Arquetipo ' + (arquetipos.length + 1), valores: base });
        dibujarArquetipos(); recalcular();
      });
      UI.$('#btnArquetiposLibro').addEventListener('click', function () {
        arquetipos = copiaArq(ARQUETIPOS_LIBRO); dibujarArquetipos(); recalcular();
      });
      dibujarArquetipos();
      cargarEjemplo(); // arranca mostrando el ejemplo, claramente rotulado
    }
  });
})();
