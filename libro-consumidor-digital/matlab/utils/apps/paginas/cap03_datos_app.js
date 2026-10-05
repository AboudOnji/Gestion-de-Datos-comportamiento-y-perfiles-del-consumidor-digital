/* cap03_datos_app.js — RFM, CLV y prueba A/B con datos propios (Excel/CSV),
   como recorrido guiado en 5 pasos: calidad de datos, segmentación RFM, CLV,
   prueba A/B y lectura de negocio. Cálculo: Cap03Datos (modelos/cap03_datos.js)
   y Cap03.pruebaAB (modelos/cap03.js). */
(function () {
  'use strict';
  const S = Numerico.sprintf;
  const DP = DatosPropios;
  const C3 = Cap03Datos;
  const COLOR_SEG = { 'Campeón': '#2E7D4F', 'Leal': '#297D82', 'En riesgo': '#E3A33B', 'Perdido': '#A4461F' };
  const ACCION = {
    'Campeón': 'Recompensar y proteger: acceso anticipado, referidos. No regalarles descuentos que no necesitan.',
    'Leal': 'Subir su frecuencia o su ticket: venta cruzada, membresía, recordatorios.',
    'En riesgo': 'Reactivar antes de perderlos: mensaje personalizado (con base legal para contactarlos).',
    'Perdido': 'Decidir si vale el costo de recuperarlos: campaña barata o dejar de invertir.'
  };
  const money = v => Number.isFinite(v) ? '$' + Math.round(v).toLocaleString('es-MX') : '—';
  const pct = (v, d) => Number.isFinite(v) ? v.toFixed(d === undefined ? 1 : d) + ' %' : '—';

  const specs = [
    { id: 'horizonteAnios', tipo: 'entero', min: 1, deslizMin: 1, deslizMax: 10, paso: 1, ayuda: 'Horizonte de vida esperado para el CLV (años). Entero.' },
    { id: 'mesesPeriodo', tipo: 'numero', min: 0, minExclusivo: true, deslizMin: 1, deslizMax: 36, paso: 1,
      ayuda: 'Meses que cubre su columna de frecuencia. <b>12</b> = ya es anual (como el script); si son compras en 6 meses, pongan 6 y la app la anualiza.' },
    { id: 'tasaDescuento', tipo: 'numero', min: 0, max: 1, maxExclusivo: true, deslizMin: 0, deslizMax: 0.3, paso: 0.01,
      ayuda: 'Tasa de descuento anual del CLV (0.10 = 10 %). <b>0</b> = CLV simple, como el script.' },
    { id: 'alfa', tipo: 'numero', min: 0, max: 1, minExclusivo: true, maxExclusivo: true, deslizMin: 0.01, deslizMax: 0.20, paso: 0.01,
      ayuda: '«Umbral de duda» (α) de la prueba A/B: cuánta suerte aceptan antes de creerle a la diferencia. 0.05 = 5 de cada 100. Válido: 0 &lt; α &lt; 1; usuales 0.01, 0.05, 0.10.' },
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

  // Estado
  let tabla = null, origen = '', hoja = '', experimento = null;
  let disponibles = [];
  let cols = { r: null, f: null, m: null };
  let recalcular = function () {};
  let analisis = null, ultimo = null;

  /* ---------- carga de datos ---------- */
  function cargarFilas(filas, nombre, nombreHoja, filasExperimento) {
    tabla = DP.procesarTabla(filas);
    origen = nombre; hoja = nombreHoja || '';
    disponibles = tabla.columnas.filter(c => c.tipo === 'numerica').map(c => c.nombre);
    if (!tabla.errores.length && disponibles.length < 3) {
      tabla.errores.push('Se necesitan al menos 3 columnas numéricas (recencia, frecuencia y monto); se encontraron ' + disponibles.length +
        '. Revisen que los números no estén escritos como texto con símbolos (p. ej. «916 pesos»).');
    }
    cols = tabla.errores.length ? { r: null, f: null, m: null } : C3.sugerirColumnas(tabla);
    experimento = null;
    if (filasExperimento) {
      experimento = C3.leerExperimento(filasExperimento);
      if (!experimento.errores.length) fijarAB(experimento);
    }
    dibujarSelectores();
    dibujarResumenDatos();
    dibujarTextoAB();
    recalcular();
  }

  function fijarAB(ex) {
    const actual = UI.leerCampos(specs).valores;
    UI.fijarCampos(specs, Object.assign({}, actual, { nA: ex.nA, conversionesA: ex.conversionesA, nB: ex.nB, conversionesB: ex.conversionesB }));
  }

  function leerArchivo(archivo) {
    const lector = new FileReader();
    UI.$('#estadoArchivo').textContent = 'Leyendo «' + archivo.name + '»…';
    lector.onload = function (e) {
      try {
        const bytes = new Uint8Array(e.target.result);
        let wb;
        if (/\.(csv|txt)$/i.test(archivo.name)) {
          let texto;
          try { texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
          catch (_) { texto = new TextDecoder('windows-1252').decode(bytes); }
          wb = XLSX.read(texto.replace(/^﻿/, ''), { type: 'string' });
        } else wb = XLSX.read(bytes, { type: 'array' });
        const esExp = n => /^(experimento|abtest|ab|pruebaab|prueba)$/i.test(n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, ''));
        const hojaExp = wb.SheetNames.find(esExp);
        const hojaDatos = wb.SheetNames.find(n => n.trim().toLowerCase() === 'datos') || wb.SheetNames.find(n => n !== hojaExp) || wb.SheetNames[0];
        const aFilas = nombre => XLSX.utils.sheet_to_json(wb.Sheets[nombre], { header: 1, raw: true, defval: null, blankrows: false });
        cargarFilas(aFilas(hojaDatos), archivo.name, hojaDatos, hojaExp && hojaExp !== hojaDatos ? aFilas(hojaExp) : null);
      } catch (err) {
        tabla = null;
        UI.$('#estadoArchivo').innerHTML = '⚠ No se pudo leer «' + UI.esc(archivo.name) + '». ¿Es un Excel (.xlsx/.xls), .ods o .csv? (' + UI.esc(err.message) + ')';
        recalcular();
      }
    };
    lector.readAsArrayBuffer(archivo);
  }

  function cargarEjemplo() {
    const E = window.EJEMPLO_CAP03;
    cargarFilas([E.datos.encabezados].concat(E.datos.filas), 'Datos de ejemplo (sintéticos)', 'Datos', [E.experimento.encabezados].concat(E.experimento.filas));
  }

  function dibujarResumenDatos() {
    const est = UI.$('#estadoArchivo'), res = UI.$('#resumenDatos'), vista = UI.$('#vistaDatos');
    if (!tabla) { est.textContent = 'Aún no hay datos.'; res.textContent = ''; vista.innerHTML = ''; return; }
    const tipos = { id: 'identificador', numerica: 'numérica', texto: 'texto', vacia: 'vacía' };
    est.innerHTML = (tabla.errores.length ? '⚠ ' : '✔ ') + '<b>' + UI.esc(origen) + '</b>' + (hoja ? ' · hoja «' + UI.esc(hoja) + '»' : '') +
      ' · ' + tabla.filasDatos.length + ' filas · ' + disponibles.length + ' columnas numéricas' +
      (tabla.errores.length ? '<br>' + tabla.errores.map(UI.esc).join('<br>') : '');
    const usada = n => n === cols.r ? 'recencia' : n === cols.f ? 'frecuencia' : n === cols.m ? 'monto' : null;
    res.innerHTML = '<b>Columnas detectadas:</b> ' + tabla.columnas.map(c => UI.esc(c.nombre) + ' <i>(' +
      (usada(c.nombre) ? 'se usa como ' + usada(c.nombre) : c.tipo === 'id' ? 'identificador' : c.tipo === 'numerica' ? 'numérica, no se usa' : 'no se usa: ' + tipos[c.tipo]) +
      (c.nVacios ? ', ' + c.nVacios + ' vacías' : '') + (c.tipo === 'numerica' && c.nTexto ? ', ' + c.nTexto + ' con texto' : '') + ')</i>').join(' · ') +
      (tabla.avisos.length ? '<br>' + tabla.avisos.map(a => 'ℹ ' + UI.esc(a)).join('<br>') : '');
    let h = '<table class="tabla"><thead><tr><th>Fila</th>' + tabla.columnas.map(c => '<th>' + UI.esc(c.nombre) + '</th>').join('') + '</tr></thead><tbody>';
    tabla.filasDatos.slice(0, 8).forEach(r => {
      h += '<tr><td>' + r.filaExcel + '</td>' + r.celdas.map(v => '<td>' + (v === null || v === undefined ? '<i>vacía</i>' : UI.esc(v)) + '</td>').join('') + '</tr>';
    });
    h += '</tbody></table><div class="nota">Primeras ' + Math.min(8, tabla.filasDatos.length) + ' filas de ' + tabla.filasDatos.length + ' (número de fila como en Excel).</div>';
    vista.innerHTML = h;
  }

  function dibujarSelectores() {
    ['r', 'f', 'm'].forEach(function (k) {
      const sel = UI.$('#col' + k.toUpperCase());
      sel.innerHTML = disponibles.length ? disponibles.map(n => '<option>' + UI.esc(n) + '</option>').join('') : '<option value="">—</option>';
      if (cols[k]) sel.value = cols[k];
    });
  }

  function dibujarTextoAB() {
    const el = UI.$('#textoAB');
    if (experimento && !experimento.errores.length) {
      el.innerHTML = 'Se llenaron los cuatro números con la hoja «Experimento» de su archivo (' +
        (experimento.formato === 'resumen' ? 'resumen por versión' : 'una fila por visitante') + '); pueden corregirlos a mano.' +
        (experimento.avisos.length ? '<br>' + experimento.avisos.map(a => 'ℹ ' + UI.esc(a)).join('<br>') : '');
    } else if (experimento) {
      el.innerHTML = '⚠ La hoja «Experimento» no se pudo usar: ' + experimento.errores.map(UI.esc).join(' ') + ' Escriban los cuatro números a mano.';
    } else {
      el.innerHTML = 'Escriban a mano los visitantes y las conversiones de cada versión (o incluyan una hoja «Experimento» en su Excel; vean «¿Cómo ordenar mis datos?»).';
    }
  }

  /* ---------- validación y análisis ---------- */
  function leerExtra(v) {
    const e = [];
    if (v.conversionesA > v.nA) e.push('conversionesA no puede ser mayor que nA.');
    if (v.conversionesB > v.nB) e.push('conversionesB no puede ser mayor que nB.');
    if (v.conversionesA + v.conversionesB === 0) e.push('Debe haber al menos una conversión en total.');
    if (v.conversionesA + v.conversionesB === v.nA + v.nB) e.push('Con 100 % de conversión en ambas versiones no hay variación que probar.');
    if (!tabla) e.push('Suban el archivo de sus clientes o pulsen «Usar datos de ejemplo».');
    else if (tabla.errores.length) e.push('Corrijan el archivo y vuelvan a subirlo (vean «¿Cómo ordenar mis datos?» al final de la página).');
    else {
      analisis = C3.analizarClientes(tabla, cols, v);
      if (analisis.errores.length) analisis.errores.forEach(x => e.push(x));
    }
    return e;
  }

  function ejecutar(v) {
    const A = analisis, ab = Cap03.pruebaAB(v.nA, v.conversionesA, v.nB, v.conversionesB, v.alfa);
    const Q = A.calidad, n = A.n;
    const L = [];
    L.push(S('=== Resultados con %d clientes, horizonte=%d años, alfa=%.2f ===', n, v.horizonteAnios, v.alfa));
    L.push('Datos: ' + origen + (hoja ? ' (hoja «' + hoja + '»)' : ''));
    L.push(S('Columnas: recencia=%s, frecuencia=%s, monto=%s', cols.r, cols.f, cols.m));
    L.push('--- Bloque 1: calidad de datos ---');
    L.push(S('Filas leídas: %d · clientes usados: %d', A.totalLeidas, n));
    L.push(S('Valores faltantes en monto promedio: %d de %d (%.1f%%)', Q.nFalt, n, 100 * Q.nFalt / n));
    L.push(S('Atípicos detectados (regla 1.5xRIC, límite=%.0f): %d de %d (%.1f%%)', Q.limSup, Q.nAt, n, 100 * Q.nAt / n));
    L.push('');
    L.push('--- Bloque 2: RFM y CLV ---');
    L.push('Distribución de segmentos RFM:');
    L.push('  Segmento     Clientes   Porcentaje');
    A.resumen.forEach(x => L.push(S('  %-12s %8d   %9.2f%%', x.segmento, x.clientes, x.pctClientes)));
    L.push('');
    const extension = v.tasaDescuento > 0 || v.mesesPeriodo !== 12;
    L.push(S('CLV%s promedio por segmento (horizonte %d años%s, supuesto didáctico):', v.tasaDescuento > 0 ? ' descontado' : ' simple', v.horizonteAnios,
      extension ? S(', frecuencia de %s meses anualizada, descuento %.0f%%', String(v.mesesPeriodo), 100 * v.tasaDescuento) : ''));
    A.resumen.forEach(x => L.push(S('  %-10s: %s', x.segmento, Number.isNaN(x.clvProm) ? 'sin clientes' : money(x.clvProm))));
    L.push(S('El 20%% de clientes con mayor CLV concentra %.1f%% del CLV total.', A.pctTop20));
    L.push('');
    L.push('--- Bloque 3: prueba A/B (¿B es mejor o fue suerte?) ---');
    L.push(S('Conversión A = %.2f%% (n=%d), Conversión B = %.2f%% (n=%d)', 100 * ab.pA, v.nA, 100 * ab.pB, v.nB));
    L.push(S('Estadístico z = %.3f, valor p = %.4f (alfa = %.2f)', ab.z, ab.valorP, v.alfa));
    L.push(ab.rechaza ? 'Decisión: la diferencia es confiable (el azar solo rara vez la produce).'
      : 'Decisión: todavía no se puede saber -- la diferencia observada podría deberse al azar.');
    L.push(S('En lenguaje llano: si A y B fueran iguales, el azar solo daría una diferencia así de grande (o mayor) en %.1f de cada 100 experimentos.', 100 * ab.valorP));
    L.push(Number.isFinite(ab.nNecesario)
      ? S('Para estar seguros de una diferencia como la observada harían falta ~%d visitantes por versión (tienen %d y %d).', ab.nNecesario, v.nA, v.nB)
      : 'Las conversiones observadas son idénticas: no hay diferencia que detectar.');

    const avisos = A.avisos.slice();
    const pocas = Math.min(v.conversionesA, v.nA - v.conversionesA, v.conversionesB, v.nB - v.conversionesB);
    if (pocas < 10) avisos.push('Alguna cifra del experimento (conversiones o no conversiones) es menor a 10 casos: con tan pocos casos el resultado es poco confiable. Junten más datos.');
    if (Q.nFalt / n > 0.2) avisos.push(S('Más de 20%% de los montos estaba vacío (%.0f%%): imputar con la mediana a tantos clientes aplana el análisis. Revisen cómo se captura ese dato.', 100 * Q.nFalt / n));
    const sinClientes = A.resumen.filter(x => x.clientes === 0).map(x => x.segmento);
    if (sinClientes.length) avisos.push('Ningún cliente cayó en: ' + sinClientes.join(', ') + '. Con quintiles de sus propios clientes es posible si los puntajes están muy concentrados.');
    ultimo = { A, ab, v, n };
    const cam = A.resumen[0];
    return {
      consola: L.join('\n'), avisos, A, ab, v, n,
      metricas: {
        origen, n, pctFalt: 100 * Q.nFalt / n, atipicos: Q.nAt, pctCampeon: cam.pctClientes, pctClvCampeon: cam.pctClv,
        clvProm: A.clvTotal / n, nA: v.nA, cA: v.conversionesA, nB: v.nB, cB: v.conversionesB,
        convA: 100 * ab.pA, convB: 100 * ab.pB, z: ab.z, valorP: ab.valorP, alfa: v.alfa,
        decision: ab.rechaza ? 'Diferencia confiable' : 'Todavía no se sabe', nNecesario: Number.isFinite(ab.nNecesario) ? ab.nNecesario : NaN
      }
    };
  }

  /* ---------- figuras ---------- */
  function dibujar(r, v) {
    const A = r.A, ab = r.ab, Q = A.calidad, n = r.n;
    const tinta = UI.esOscuro() ? '#fff' : '#000';

    // Paso 1: calidad
    const descartadas = A.totalLeidas - n;
    UI.$('#kpisCalidad').innerHTML =
      '<div class="kpi"><div class="v">' + n + '</div><div class="t">Clientes usados de ' + A.totalLeidas + ' filas leídas</div></div>' +
      '<div class="kpi"><div class="v">' + pct(100 * Q.nFalt / n) + '</div><div class="t">Montos faltantes (' + Q.nFalt + '), imputados con la mediana</div></div>' +
      '<div class="kpi"><div class="v">' + pct(100 * Q.nAt / n) + '</div><div class="t">Montos atípicos (' + Q.nAt + '), acotados a ' + money(Q.limSup) + '</div></div>' +
      '<div class="kpi"><div class="v">' + descartadas + '</div><div class="t">Filas descartadas (sin recencia/frecuencia válida o ID repetido)</div></div>';
    const filasCal = [
      ['Montos faltantes', Q.nFalt, 'Se llenaron con la mediana (' + money(Q.medianaMonto) + '). Es una regla visible, no silenciosa.'],
      ['Montos atípicos (&gt; Q3 + 1.5×RIC)', Q.nAt, 'Se acotaron al límite superior (' + money(Q.limSup) + '); el cliente se conserva.'],
      ['Montos ≤ 0 o con texto', Q.montosNoPositivos + Q.montosTexto, 'Se trataron como faltantes (y luego se imputaron).'],
      ['Filas sin recencia o frecuencia válidas', A.descartadas.sinR + A.descartadas.sinF, 'Se descartaron: sin esos datos no hay RFM.'],
      ['IDs repetidos', A.descartadas.duplicadas, 'Se conservó la primera fila de cada cliente.']
    ];
    UI.$('#tablaCalidad').innerHTML = '<table class="tabla"><thead><tr><th>Hallazgo</th><th>Casos</th><th>Qué hizo la app</th></tr></thead><tbody>' +
      filasCal.map(f => '<tr><td class="izq">' + f[0] + '</td><td>' + f[1] + '</td><td class="izq">' + (f[1] ? f[2] : '<span style="opacity:.6">Nada que corregir.</span>') + '</td></tr>').join('') + '</tbody></table>';
    UI.graficar('figLimpieza', [
      { y: A.montoOriginal, type: 'box', name: 'Antes (con atípicos)', marker: { color: UI.color.gris }, boxpoints: 'outliers' },
      { y: A.montoLimpio, type: 'box', name: 'Después (acotado)', marker: { color: UI.color.teal }, boxpoints: 'outliers' }
    ], { title: S('Monto promedio: atípicos acotados a %.0f MXN', Q.limSup), yaxis: { title: { text: 'Monto promedio (MXN)' } }, showlegend: false,
      shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: Q.limSup, y1: Q.limSup, line: { dash: 'dot', color: UI.color.guinda, width: 2 } }] },
    { archivo: 'cap03_limpieza' });
    UI.graficar('figHistMonto', [{ x: A.montoLimpio, type: 'histogram', marker: { color: UI.color.teal }, nbinsx: 25,
      hovertemplate: 'monto: %{x}<br>clientes: %{y}<extra></extra>' }],
    { title: 'Distribución del monto limpio', xaxis: { title: { text: 'Monto promedio (MXN)' } }, yaxis: { title: { text: 'Clientes' } }, showlegend: false, bargap: 0.05,
      shapes: [{ type: 'line', yref: 'paper', y0: 0, y1: 1, x0: Q.limSup, x1: Q.limSup, line: { dash: 'dot', color: UI.color.guinda, width: 2 } }] },
    { archivo: 'cap03_hist_monto' });

    // Paso 2: RFM
    const orden = Cap03Datos.ORDEN;
    UI.graficar('figSegmentos', [{ x: orden, y: A.resumen.map(x => x.clientes), type: 'bar', marker: { color: orden.map(s => COLOR_SEG[s]) },
      text: A.resumen.map(x => x.clientes + ' (' + x.pctClientes.toFixed(0) + ' %)'), textposition: 'outside', cliponaxis: false }],
    { title: 'Distribución de segmentos RFM', yaxis: { title: { text: 'Número de clientes' } }, showlegend: false }, { archivo: 'cap03_rfm' });
    // pequeño desplazamiento vertical determinista para que no se encimen las frecuencias enteras
    const jit = i => ((i * 2654435761 % 1000) / 1000 - 0.5) * 0.35;
    const trazas = orden.map(function (s) {
      const idx = A.segmento.map((x, i) => x === s ? i : -1).filter(i => i >= 0);
      const mmax = Math.max.apply(null, A.montoLimpio);
      return { x: idx.map(i => A.recencia[i]), y: idx.map(i => A.frecuencia[i] + jit(i)), type: 'scatter', mode: 'markers', name: s,
        text: idx.map(i => A.filas[i].id), customdata: idx.map(i => [A.frecuencia[i], A.montoLimpio[i], A.rfm[i]]),
        marker: { color: COLOR_SEG[s], opacity: 0.75, size: idx.map(i => 5 + 11 * Math.sqrt(A.montoLimpio[i] / mmax)) },
        hovertemplate: '%{text}<br>recencia: %{x} días<br>frecuencia: %{customdata[0]}<br>monto: $%{customdata[1]:.0f}<br>puntaje RFM: %{customdata[2]}<extra>' + s + '</extra>' };
    });
    UI.graficar('figRF', trazas, { title: 'Clientes por recencia y frecuencia', xaxis: { title: { text: 'Recencia (días desde la última compra)' } },
      yaxis: { title: { text: 'Frecuencia (compras)' } }, legend: { orientation: 'h', y: -0.25 }, margin: { b: 100 } }, { archivo: 'cap03_rfm_recencia_frecuencia' });
    UI.$('#tablaSegmentos').innerHTML = '<table class="tabla"><thead><tr><th>Segmento</th><th>Clientes</th><th>% clientes</th><th>Recencia prom. (días)</th><th>Frecuencia prom.</th><th>Monto prom.</th><th>CLV prom.</th><th>% del CLV</th><th>¿Qué hacer?</th></tr></thead><tbody>' +
      A.resumen.map(x => '<tr><td class="izq"><span class="chip-color" style="background:' + COLOR_SEG[x.segmento] + '"></span>' + x.segmento + '</td><td>' + x.clientes + '</td><td>' + pct(x.pctClientes) +
        '</td><td>' + (x.clientes ? x.recProm.toFixed(0) : '—') + '</td><td>' + (x.clientes ? x.frecProm.toFixed(1) : '—') + '</td><td>' + (x.clientes ? money(x.montoProm) : '—') +
        '</td><td>' + money(x.clvProm) + '</td><td>' + (x.clientes ? pct(x.pctClv) : '—') + '</td><td class="izq" style="min-width:260px">' + ACCION[x.segmento] + '</td></tr>').join('') + '</tbody></table>' +
      '<div class="nota">Las acciones son puntos de partida de mercadotecnia, no recetas: cualquier contacto requiere base legal y propósito declarado.</div>';

    // Paso 3: CLV
    const nombreCLV = v.tasaDescuento > 0 ? 'CLV descontado' : 'CLV simple';
    UI.$('#kpisCLV').innerHTML =
      '<div class="kpi"><div class="v">' + money(A.clvTotal) + '</div><div class="t">' + nombreCLV + ' total de la base (' + v.horizonteAnios + ' años)</div></div>' +
      '<div class="kpi"><div class="v">' + money(A.clvTotal / n) + '</div><div class="t">' + nombreCLV + ' promedio por cliente</div></div>' +
      '<div class="kpi"><div class="v">' + pct(A.pctTop20) + '</div><div class="t">del CLV total lo aporta el 20 % de clientes de mayor valor</div></div>' +
      (v.tasaDescuento > 0 ? '<div class="kpi"><div class="v">' + pct(100 * A.fh / v.horizonteAnios) + '</div><div class="t">del CLV simple: lo que «vale hoy» el dinero futuro con ' + (100 * v.tasaDescuento).toFixed(0) + ' % de descuento</div></div>' : '');
    UI.graficar('figCLV', [{ x: orden, y: A.resumen.map(x => x.clvProm), type: 'bar', marker: { color: orden.map(s => COLOR_SEG[s]) },
      text: A.resumen.map(x => money(x.clvProm)), textposition: 'outside', cliponaxis: false }],
    { title: S('%s por segmento (horizonte de %d años)', nombreCLV, v.horizonteAnios), yaxis: { title: { text: nombreCLV + ' promedio (MXN)' } }, showlegend: false }, { archivo: 'cap03_clv' });
    UI.graficar('figPareto', [
      { x: orden, y: A.resumen.map(x => x.pctClientes), type: 'bar', name: '% de los clientes', marker: { color: UI.color.gris } },
      { x: orden, y: A.resumen.map(x => x.pctClv), type: 'bar', name: '% del CLV total', marker: { color: UI.color.guinda } }
    ], { title: 'Clientes contra valor, por segmento', barmode: 'group', yaxis: { title: { text: 'Porcentaje' }, rangemode: 'tozero' },
      legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap03_concentracion_clv' });

    // Paso 4: A/B explicado con simulación del azar
    const nec = ab.nNecesario;
    const veces = (v.nA + v.nB) > 20000 ? 2000 : 5000;
    const sim = Cap03Datos.simularAzar(v.nA, v.conversionesA, v.nB, v.conversionesB, veces, 2026);
    const color = ab.rechaza ? '#2E7D4F' : '#A4461F';
    UI.$('#kpisAB').innerHTML =
      '<div class="kpi"><div class="v">' + (ab.dif >= 0 ? '+' : '') + (100 * ab.dif).toFixed(2) + ' puntos</div><div class="t">Lo que midieron: B convierte ' + (100 * ab.pB).toFixed(2) + ' % y A ' + (100 * ab.pA).toFixed(2) + ' %</div></div>' +
      '<div class="kpi"><div class="v">' + (100 * ab.valorP).toFixed(1) + ' de cada 100</div><div class="t">experimentos de «solo azar» igualan o superan esa diferencia (umbral de duda: ' + (100 * v.alfa).toFixed(0) + ' de cada 100)</div></div>' +
      '<div class="kpi"><div class="v" style="color:' + color + '">' + (ab.rechaza ? 'Diferencia confiable' : 'Todavía no se sabe') + '</div><div class="t">' +
      (ab.rechaza ? 'el azar rara vez la produce solo' : 'el azar solo podría haberla producido') + '</div></div>' +
      '<div class="kpi"><div class="v">' + (Number.isFinite(nec) ? nec.toLocaleString('es-MX') : '—') + '</div><div class="t">visitantes por versión para estar seguros de una diferencia como esta (tienen ' + v.nA + ' y ' + v.nB + ')</div></div>';
    UI.graficar('figAB', [{
      x: ['A (control)', 'B (variante)'], y: [100 * ab.pA, 100 * ab.pB], type: 'bar', width: 0.5, marker: { color: [UI.color.guinda, UI.color.dorado] },
      text: [(100 * ab.pA).toFixed(1) + ' %', (100 * ab.pB).toFixed(1) + ' %'], textposition: 'inside', insidetextanchor: 'start', insidetextfont: { color: '#fff', size: 14 },
      error_y: { type: 'data', array: [100 * ab.icA, 100 * ab.icB], visible: true, thickness: 1.8, width: 12, color: tinta },
      hovertemplate: '%{x}: %{y:.2f} % (± margen de error)<extra></extra>'
    }], {
      title: 'Lo que midieron en el experimento', yaxis: { title: { text: 'Conversión (% de visitantes que compran)' }, rangemode: 'tozero' }, showlegend: false,
      annotations: [{ xref: 'paper', yref: 'paper', x: 0.5, y: -0.2, showarrow: false, text: '<b>' + (ab.rechaza ? 'Diferencia confiable' : 'Todavía no se puede saber') + '</b>', font: { color: color } }],
      margin: { b: 80 }
    }, { archivo: 'cap03_prueba_ab' });
    const obs = 100 * ab.dif, lim = Math.abs(obs);
    const colorBarra = sim.difs.map(d => Math.abs(d) >= lim - 1e-9 ? '#A4461F' : UI.color.gris);
    const ancho = Math.max(0.1, (Math.max.apply(null, sim.difs) - Math.min.apply(null, sim.difs)) / 40);
    const inicio = Math.floor(Math.min.apply(null, sim.difs.concat([-lim])) / ancho) * ancho;
    const nb = Math.ceil((Math.max.apply(null, sim.difs.concat([lim])) - inicio) / ancho) + 1;
    const cuentas = new Array(nb).fill(0);
    sim.difs.forEach(d => { cuentas[Math.min(nb - 1, Math.floor((d - inicio) / ancho))]++; });
    const centros = cuentas.map((_, i) => inicio + (i + 0.5) * ancho);
    UI.graficar('figDif', [{
      x: centros, y: cuentas, type: 'bar', width: ancho * 0.95,
      marker: { color: centros.map(c => Math.abs(c) >= lim - ancho / 2 + 1e-9 ? '#A4461F' : UI.color.gris) },
      hovertemplate: 'diferencia por azar ≈ %{x:.1f} puntos<br>experimentos: %{y}<extra></extra>'
    }], {
      title: S('¿Y si fuera solo azar? %d experimentos simulados', veces), showlegend: false, bargap: 0,
      xaxis: { title: { text: 'Diferencia B − A por puro azar (puntos porcentuales)' } }, yaxis: { title: { text: 'Número de experimentos' } },
      shapes: [{ type: 'line', yref: 'paper', y0: 0, y1: 1, x0: obs, x1: obs, line: { color: UI.color.dorado, width: 3 } },
        { type: 'line', yref: 'paper', y0: 0, y1: 1, x0: -obs, x1: -obs, line: { color: UI.color.dorado, width: 3, dash: 'dot' } }],
      annotations: [{ x: obs, yref: 'paper', y: 1.02, text: 'lo que midieron', showarrow: false, font: { color: UI.color.dorado } }],
      margin: { b: 60 }
    }, { archivo: 'cap03_simulacion_azar' });

    // Paso 5: conclusión
    UI.$('#conclusion').innerHTML = conclusion(r, v);
  }

  function conclusion(r, v) {
    const A = r.A, ab = r.ab, Q = A.calidad, n = r.n;
    const [cam, leal, riesgo, perdido] = A.resumen;
    const p = [];
    p.push('<p><b>1. Los datos.</b> Se usaron ' + n + ' de ' + A.totalLeidas + ' filas. ' + (Q.nFalt ? pct(100 * Q.nFalt / n, 1) + ' de los montos faltaba y se imputó con la mediana; ' : 'No faltaron montos; ') +
      (Q.nAt ? Q.nAt + ' montos atípicos se acotaron. ' : 'No hubo montos atípicos. ') +
      'Cada una de esas decisiones cambia las cifras de abajo: si no se documenta, el análisis no es reproducible.</p>');
    p.push('<p><b>2. Los clientes.</b> ' + (cam.clientes ? 'Los <b>Campeones</b> son ' + pct(cam.pctClientes, 0) + ' de la base y aportan ' + pct(cam.pctClv, 0) + ' del CLV. ' : 'No hay Campeones en esta base. ') +
      'Campeones y Leales juntos concentran ' + pct(cam.pctClv + leal.pctClv, 0) + ' del valor' +
      (riesgo.clientes ? '; los <b>En riesgo</b> (' + riesgo.clientes + ' clientes, ' + pct(riesgo.pctClv, 0) + ' del CLV) son la oportunidad de reactivación más clara' : '') + '. ' +
      'Recuerden que RFM compara a cada cliente con <i>el resto de su propia base</i>: no dice si el negocio va bien, dice quién destaca dentro de él.</p>');
    if (ab.rechaza) {
      p.push('<p><b>3. La prueba A/B.</b> B convierte ' + (100 * ab.dif).toFixed(2) + ' puntos ' + (ab.dif > 0 ? 'más' : 'menos') + ' que A, y si A y B fueran iguales el azar solo daría una diferencia así en ' + (100 * ab.valorP).toFixed(1) +
        ' de cada 100 experimentos (menos del umbral de ' + (100 * v.alfa).toFixed(0) + '). <b>La diferencia es confiable.</b> Aun así, «confiable» no es lo mismo que «importante»: comparen esa mejora con el costo de implementarla y con otras señales (ticket, devoluciones, quejas).</p>');
    } else {
      p.push('<p><b>3. La prueba A/B.</b> B convierte ' + (100 * ab.dif).toFixed(2) + ' puntos ' + (ab.dif > 0 ? 'más' : 'menos') + ' que A, pero si A y B fueran iguales el azar solo daría una diferencia así en ' + (100 * ab.valorP).toFixed(1) +
        ' de cada 100 experimentos (el umbral de duda es ' + (100 * v.alfa).toFixed(0) + '). <b>Todavía no se puede saber</b> si B es mejor. Eso <b>no</b> prueba que sean iguales: ' +
        (Number.isFinite(ab.nNecesario) ? 'para estar seguros de una diferencia de este tamaño harían falta ~' + ab.nNecesario.toLocaleString('es-MX') + ' visitantes por versión y tienen ' + v.nA + ' y ' + v.nB + '. ' : '') +
        'Lo disciplinado es seguir la prueba antes de elegir ganadora; adoptar B «porque se ve mejor» es dejarse engañar por el ojo (Tversky y Kahneman, 1974).</p>');
    }
    p.push('<p><b>4. Límites y ética.</b> El CLV de este laboratorio es didáctico (' + (v.tasaDescuento > 0 ? 'ya incorpora descuento, pero ' : 'sin tasa de descuento ni ') + 'probabilidad de retención). ' +
      'Segmentar y contactar clientes reales es tratamiento de datos personales: requiere base legal y propósito declarado. Verifiquen la LFPDPPP vigente al implementar.</p>');
    return p.join('');
  }

  /* ---------- descargas ---------- */
  function descargarResultados() {
    if (!ultimo) { alert('Primero carguen datos.'); return; }
    const { A, ab, v, n } = ultimo, Q = A.calidad;
    const idNombre = tabla.idCol || 'Fila';
    const filas = A.filas.map(function (x, i) {
      const f = {};
      f[idNombre] = x.id;
      f.Recencia = x.r; f.Frecuencia = x.f;
      f.Monto_original = Number.isNaN(x.m) ? '' : x.m;
      f.Monto_usado = +A.montoLimpio[i].toFixed(2);
      f.Monto_imputado = Number.isNaN(x.m) ? 'Sí' : 'No';
      f.Monto_acotado = A.esAtipico[i] ? 'Sí' : 'No';
      f.Puntaje_R = A.puntajeR[i]; f.Puntaje_F = A.puntajeF[i]; f.Puntaje_M = A.puntajeM[i];
      f.Puntaje_RFM = A.rfm[i]; f.Segmento = A.segmento[i];
      f.CLV = +A.clv[i].toFixed(2);
      return f;
    });
    const resumenSeg = A.resumen.map(x => ({ Segmento: x.segmento, Clientes: x.clientes, Pct_clientes: +x.pctClientes.toFixed(2), Recencia_prom: +x.recProm.toFixed(2),
      Frecuencia_prom: +x.frecProm.toFixed(2), Monto_prom: +x.montoProm.toFixed(2), CLV_prom: +x.clvProm.toFixed(2), CLV_total: +x.clvTotal.toFixed(2), Pct_CLV: +x.pctClv.toFixed(2) }));
    const hojaAB = [
      ['Prueba A/B', 'A (control)', 'B (variante)'],
      ['Visitantes', v.nA, v.nB], ['Conversiones', v.conversionesA, v.conversionesB],
      ['Conversión (%)', +(100 * ab.pA).toFixed(4), +(100 * ab.pB).toFixed(4)], [],
      ['Diferencia B − A (pp)', +(100 * ab.dif).toFixed(4)],
      ['Valor p (de cada 100 experimentos de solo azar, cuántos igualan la diferencia = p × 100)', +ab.valorP.toFixed(6)], ['Estadístico z (nombre técnico)', +ab.z.toFixed(4)], ['Umbral de duda α', v.alfa],
      ['Decisión', ab.rechaza ? 'Diferencia confiable' : 'Todavía no se sabe'],
      ['Visitantes por versión para estar seguros de la diferencia observada', Number.isFinite(ab.nNecesario) ? ab.nNecesario : 'n/d']
    ];
    const reglas = [
      ['Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji'],
      ['RFM, CLV y prueba A/B con datos propios (Cap. 3)'], [],
      ['Datos', origen + (hoja ? ' (hoja ' + hoja + ')' : '')], ['Fecha del análisis', new Date().toLocaleString('es-MX')],
      ['Filas leídas', A.totalLeidas], ['Clientes usados', n],
      ['Columnas', 'recencia=' + cols.r + ', frecuencia=' + cols.f + ', monto=' + cols.m], [],
      ['Montos faltantes imputados con la mediana', Q.nFalt, 'mediana = ' + Q.medianaMonto.toFixed(2)],
      ['Montos atípicos acotados (> Q3 + 1.5×RIC)', Q.nAt, 'límite = ' + Q.limSup.toFixed(2)],
      ['Filas descartadas', A.totalLeidas - n], [],
      ['Puntajes', 'Quintiles 1–5 (recencia invertida). Con valores muy repetidos se usa rango promedio.'],
      ['Segmentos', 'RFM ≥ 12 Campeón; 9–11 Leal; 6–8 En riesgo; < 6 Perdido'],
      ['CLV', 'monto × frecuencia × (12 / ' + v.mesesPeriodo + ') × ' + (v.tasaDescuento > 0 ? 'Σ 1/(1+' + v.tasaDescuento + ')^t, t = 1..' + v.horizonteAnios : v.horizonteAnios + ' años')]
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), 'Clientes');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenSeg), 'Segmentos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hojaAB), 'Prueba_AB');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(reglas), 'Resumen_y_reglas');
    XLSX.writeFile(wb, 'rfm_clv_ab_resultados.xlsx');
  }

  function descargarEjemplo() {
    const E = window.EJEMPLO_CAP03;
    const wb = XLSX.utils.book_new();
    const wsD = XLSX.utils.aoa_to_sheet([E.datos.encabezados].concat(E.datos.filas));
    wsD['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 19 }, { wch: 21 }];
    const wsE = XLSX.utils.aoa_to_sheet([E.experimento.encabezados].concat(E.experimento.filas));
    wsE['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 11 }];
    XLSX.utils.book_append_sheet(wb, wsD, 'Datos');
    XLSX.utils.book_append_sheet(wb, wsE, 'Experimento');
    XLSX.writeFile(wb, 'cap03_datos_ejemplo.xlsx');
  }

  /* ---------- comparación de corridas ---------- */
  const columnas = [
    { id: 'origen', titulo: 'Datos', izq: true }, { id: 'n', titulo: 'Clientes', dec: 0 },
    { id: 'pctFalt', titulo: '% montos faltantes', dec: 1 }, { id: 'atipicos', titulo: 'Atípicos', dec: 0 },
    { id: 'pctCampeon', titulo: '% Campeones', dec: 1 }, { id: 'pctClvCampeon', titulo: '% del CLV en Campeones', dec: 1 }, { id: 'clvProm', titulo: 'CLV prom. (MXN)', dec: 0 },
    { id: 'nA', titulo: 'nA', dec: 0 }, { id: 'cA', titulo: 'conv. A', dec: 0 }, { id: 'nB', titulo: 'nB', dec: 0 }, { id: 'cB', titulo: 'conv. B', dec: 0 },
    { id: 'convA', titulo: 'Conversión A (%)', dec: 2 }, { id: 'convB', titulo: 'Conversión B (%)', dec: 2 },
    { id: 'valorP', titulo: '¿Fue suerte? (valor p)', dec: 4 }, { id: 'alfa', titulo: 'Umbral de duda α', dec: 2 }, { id: 'decision', titulo: 'Decisión' },
    { id: 'nNecesario', titulo: 'Visitantes necesarios por versión', dec: 0 }
  ];
  function dibujarComparacion(lista) {
    const nombres = lista.map(c => c.etiqueta), colores = lista.map((_, i) => UI.colorCaso(i));
    UI.graficar('comp1', [
      { x: nombres, y: lista.map(c => c.valores.valorP), type: 'bar', name: 'valor p', marker: { color: colores },
        text: lista.map(c => c.valores.valorP.toFixed(4)), textposition: 'outside', cliponaxis: false },
      { x: nombres, y: lista.map(c => c.valores.alfa), type: 'scatter', mode: 'markers', name: 'α', marker: { symbol: 'diamond', size: 14, color: UI.esOscuro() ? '#fff' : '#000' } }
    ], { title: '¿Fue suerte? (valor p) contra el umbral de duda', yaxis: { title: { text: 'Probabilidad' }, rangemode: 'tozero' }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap03_comparacion_p' });
    UI.graficar('comp2', [
      { x: nombres, y: lista.map(c => c.valores.convA), type: 'bar', name: 'A (control)', marker: { color: UI.color.guinda }, error_y: { type: 'data', array: lista.map(c => c.extra ? c.extra.icA : 0), visible: true } },
      { x: nombres, y: lista.map(c => c.valores.convB), type: 'bar', name: 'B (variante)', marker: { color: UI.color.dorado }, error_y: { type: 'data', array: lista.map(c => c.extra ? c.extra.icB : 0), visible: true } }
    ], { title: 'Conversión A y B con margen de error por caso', barmode: 'group', yaxis: { title: { text: 'Tasa de conversión (%)' }, rangemode: 'tozero' }, legend: { orientation: 'h', y: -0.2 } },
    { archivo: 'cap03_comparacion_conversion' });
  }

  UI.iniciarApp({
    clave: 'cap03_datos_propios', specs, defecto: C3.DEFECTO, presets, columnas,
    ejecutar, dibujar, leerExtra, dibujarComparacion,
    caso: r => ({ valores: r.metricas, extra: { icA: 100 * r.ab.icA, icB: 100 * r.ab.icB } }),
    alIniciar: function (diferido) {
      recalcular = diferido;
      const zona = UI.$('#zonaArchivo'), campos = UI.$('#campos');
      campos.parentNode.insertBefore(zona, campos);
      const etiquetaAlfa = UI.$('#p_alfa').closest('label');
      etiquetaAlfa.parentNode.insertBefore(UI.$('#bloqueAB'), etiquetaAlfa);
      const col = document.querySelector('.columna');
      col.insertBefore(UI.$('#panelConceptos'), col.firstChild);
      UI.$('#btnRestablecer').textContent = 'Valores del libro';
      ['r', 'f', 'm'].forEach(k => UI.$('#col' + k.toUpperCase()).addEventListener('change', function () { cols[k] = this.value; dibujarResumenDatos(); diferido(); }));
      const input = UI.$('#archivo');
      input.addEventListener('change', () => { if (input.files[0]) leerArchivo(input.files[0]); input.value = ''; });
      const caja = zona.querySelector('.subir');
      ['dragenter', 'dragover'].forEach(ev => caja.addEventListener(ev, e => { e.preventDefault(); caja.classList.add('encima'); }));
      ['dragleave', 'drop'].forEach(ev => caja.addEventListener(ev, e => { e.preventDefault(); caja.classList.remove('encima'); }));
      caja.addEventListener('drop', e => { if (e.dataTransfer.files[0]) leerArchivo(e.dataTransfer.files[0]); });
      UI.$('#btnEjemplo').addEventListener('click', cargarEjemplo);
      UI.$('#btnDescargarEjemplo').addEventListener('click', descargarEjemplo);
      UI.$('#btnDescargarResultados').addEventListener('click', descargarResultados);
      cargarEjemplo();
    }
  });
})();
