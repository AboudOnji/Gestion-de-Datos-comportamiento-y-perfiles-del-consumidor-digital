/* cap04_datos_app.js — serie de tiempo y escucha social con datos propios
   (Excel/CSV), como recorrido guiado en 5 pasos: su serie, tendencia y
   estacionalidad, ¿campaña o temporada?, escucha social (bolsa de palabras) y
   lectura de negocio. Cálculo: Cap04Datos (modelos/cap04_datos.js). */
(function () {
  'use strict';
  const S = Numerico.sprintf;
  const DP = DatosPropios;
  const C4 = Cap04Datos;
  const CATEGORIAS = ['— sin clasificar —', 'Experiencia positiva', 'Fricción operativa', 'Neutro / descriptivo'];
  const CLAVE_CLASIF = 'cap04_datos_clasificacion';
  const SIN_FECHA = '(sin fecha: usar 1, 2, 3…)', SIN_TEXTO = '(ninguna)';
  const fmt1 = v => Number.isFinite(v) ? (+v.toFixed(1)).toString() : '—';
  const signo = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1);

  const specs = [
    { id: 'periodosCiclo', tipo: 'entero', min: 2, deslizMin: 4, deslizMax: 104, paso: 1,
      ayuda: '<b>Periodos por ciclo anual</b>: 52 si sus datos son semanales, 12 si son mensuales, 4 trimestrales, 365 diarios. Es también el largo del promedio móvil que estima la tendencia (un ciclo completo).' },
    { id: 'ventanaReciente', tipo: 'entero', min: 1, deslizMin: 1, deslizMax: 13, paso: 1,
      ayuda: '<b>Periodos recientes (k)</b> que se comparan contra los k anteriores y contra la misma época del año pasado (paso 3).' },
    { id: 'nTop', tipo: 'entero', min: 3, max: 50, deslizMin: 5, deslizMax: 30, paso: 1,
      ayuda: '<b>Términos a mostrar</b> en la lista y en la clasificación (el script usa 10).' }
  ];
  const presets = [
    { nombre: 'Caso A', descripcion: 'Un ciclo completo: promedio móvil de 52 periodos (como el script)', valores: { periodosCiclo: 52 } },
    { nombre: 'Caso B', descripcion: 'Promedio móvil de 13 periodos (un trimestre): menos de un ciclo', valores: { periodosCiclo: 13 } },
    { nombre: 'Caso C', descripcion: 'Promedio móvil de 4 periodos (un mes)', valores: { periodosCiclo: 4 } }
  ];

  // Estado
  let tabla = null, origen = '', hoja = '', comentariosHoja = [], serieOK = null;
  let cols = { fecha: null, valor: null, texto: null };
  let recalcular = function () {};
  let ultimo = null, ultimosTerminos = [], textoCache = null;

  /* ---------- carga de datos ---------- */
  function cargarFilas(filas, nombre, nombreHoja, filasComentarios) {
    tabla = DP.procesarTabla(filas);
    origen = nombre; hoja = nombreHoja || '';
    const numericas = tabla.columnas.filter(c => c.tipo === 'numerica');
    if (!tabla.errores.length && !numericas.length) tabla.errores.push('No encontré ninguna columna numérica con los valores de la serie.');
    const sug = tabla.errores.length ? { fecha: null, valor: null, texto: null } : C4.sugerirColumnas(tabla);
    cols = { fecha: sug.fecha, valor: sug.valor, texto: sug.texto };
    comentariosHoja = [];
    if (filasComentarios) {
      const t = DP.procesarTabla(filasComentarios);
      const ct = t.columnas.find(c => c.tipo === 'texto') || t.columnas[0];
      if (ct) comentariosHoja = C4.listaComentarios(t, ct.nombre);
    }
    dibujarSelectores();
    dibujarResumenDatos();
    sugerirCiclo();
    UI.$('#txtComentarios').value = '';
    recalcular();
  }

  function sugerirCiclo() {
    const nota = UI.$('#notaCiclo');
    if (!tabla || tabla.errores.length || !cols.valor) { nota.textContent = ''; return; }
    const s = C4.construirSerie(tabla, cols.fecha === SIN_FECHA ? null : cols.fecha, cols.valor);
    if (s.errores && s.errores.length) { nota.textContent = ''; return; }
    if (s.cicloDetectado) {
      const actual = UI.leerCampos(specs).valores;
      UI.fijarCampos(specs, Object.assign({}, actual, { periodosCiclo: s.cicloDetectado }));
      nota.innerHTML = 'La app detectó datos <b>' + C4.CICLOS[s.cicloDetectado] + 'es</b> y puso <b>' + s.cicloDetectado + '</b> periodos por ciclo. Cámbienlo si no es correcto.';
    } else {
      nota.innerHTML = 'No pude detectar la frecuencia de sus fechas: escriban a mano los <b>periodos por ciclo anual</b> (52 semanal, 12 mensual…).';
    }
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
        const esCom = n => /^(coment|texto|escucha|social|opinion|resena)/.test(n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, ''));
        const hojaCom = wb.SheetNames.find(esCom);
        const hojaSerie = wb.SheetNames.find(n => n.trim().toLowerCase() === 'serie') || wb.SheetNames.find(n => n !== hojaCom) || wb.SheetNames[0];
        const aFilas = nombre => XLSX.utils.sheet_to_json(wb.Sheets[nombre], { header: 1, raw: true, defval: null, blankrows: false });
        cargarFilas(aFilas(hojaSerie), archivo.name, hojaSerie, hojaCom && hojaCom !== hojaSerie ? aFilas(hojaCom) : null);
      } catch (err) {
        tabla = null;
        UI.$('#estadoArchivo').innerHTML = '⚠ No se pudo leer «' + UI.esc(archivo.name) + '». ¿Es un Excel (.xlsx/.xls), .ods o .csv? (' + UI.esc(err.message) + ')';
        recalcular();
      }
    };
    lector.readAsArrayBuffer(archivo);
  }

  function cargarEjemplo(clave, nombre) {
    const E = window.EJEMPLO_CAP04, p = E[clave];
    cargarFilas([p.encabezados].concat(p.filas), nombre, 'Serie', [['Comentario']].concat(E.comentarios.map(c => [c])));
  }

  function dibujarResumenDatos() {
    const est = UI.$('#estadoArchivo'), res = UI.$('#resumenDatos'), vista = UI.$('#vistaDatos');
    if (!tabla) { est.textContent = 'Aún no hay datos.'; res.textContent = ''; vista.innerHTML = ''; return; }
    est.innerHTML = (tabla.errores.length ? '⚠ ' : '✔ ') + '<b>' + UI.esc(origen) + '</b>' + (hoja ? ' · hoja «' + UI.esc(hoja) + '»' : '') +
      ' · ' + tabla.filasDatos.length + ' filas' + (comentariosHoja.length ? ' · ' + comentariosHoja.length + ' comentarios en la hoja' : '') +
      (tabla.errores.length ? '<br>' + tabla.errores.map(UI.esc).join('<br>') : '');
    const uso = n => n === cols.fecha ? 'fecha' : n === cols.valor ? 'valor de la serie' : n === cols.texto ? 'comentarios' : null;
    res.innerHTML = '<b>Columnas detectadas:</b> ' + tabla.columnas.map(c => UI.esc(c.nombre) + ' <i>(' + (uso(c.nombre) ? 'se usa como ' + uso(c.nombre) : 'no se usa') +
      (c.nVacios ? ', ' + c.nVacios + ' vacías' : '') + ')</i>').join(' · ') + (tabla.avisos.length ? '<br>' + tabla.avisos.map(a => 'ℹ ' + UI.esc(a)).join('<br>') : '');
    let h = '<table class="tabla"><thead><tr><th>Fila</th>' + tabla.columnas.map(c => '<th>' + UI.esc(c.nombre) + '</th>').join('') + '</tr></thead><tbody>';
    tabla.filasDatos.slice(0, 8).forEach(r => {
      h += '<tr><td>' + r.filaExcel + '</td>' + r.celdas.map((v, j) => '<td>' + (v === null || v === undefined ? '<i>vacía</i>' :
        (tabla.columnas[j].nombre === cols.fecha && typeof v === 'number' && Number.isFinite(C4.aFecha(v)) ? new Date(C4.aFecha(v)).toISOString().slice(0, 10) : UI.esc(v))) + '</td>').join('') + '</tr>';
    });
    h += '</tbody></table><div class="nota">Primeras ' + Math.min(8, tabla.filasDatos.length) + ' filas de ' + tabla.filasDatos.length + ' (número de fila como en Excel).</div>';
    vista.innerHTML = h;
  }

  function dibujarSelectores() {
    const llenar = (id, opciones, valor) => { const s = UI.$(id); s.innerHTML = opciones.map(o => '<option>' + UI.esc(o) + '</option>').join(''); if (valor && opciones.includes(valor)) s.value = valor; };
    if (!tabla) return;
    const todas = tabla.columnas.map(c => c.nombre);
    llenar('#colFecha', [SIN_FECHA].concat(todas), cols.fecha || SIN_FECHA);
    llenar('#colValor', tabla.columnas.filter(c => c.tipo === 'numerica').map(c => c.nombre), cols.valor);
    llenar('#colTexto', [SIN_TEXTO].concat(tabla.columnas.filter(c => c.tipo === 'texto').map(c => c.nombre)), cols.texto || SIN_TEXTO);
    if (!cols.fecha) cols.fecha = SIN_FECHA;
    if (!cols.texto) cols.texto = SIN_TEXTO;
  }

  /* ---------- validación y análisis ---------- */
  function comentariosActuales() {
    const pegados = UI.$('#txtComentarios').value.split(/\n/).map(s => s.trim()).filter(Boolean);
    if (pegados.length) return { lista: pegados, origen: 'comentarios pegados' };
    if (comentariosHoja.length) return { lista: comentariosHoja, origen: 'hoja «Comentarios»' };
    if (tabla && cols.texto && cols.texto !== SIN_TEXTO) return { lista: C4.listaComentarios(tabla, cols.texto), origen: 'columna «' + cols.texto + '»' };
    return { lista: [], origen: '' };
  }

  function leerExtra(v) {
    const e = [];
    if (!tabla) { e.push('Suban el archivo con su serie o pulsen uno de los ejemplos.'); return e; }
    if (tabla.errores.length) { e.push('Corrijan el archivo y vuelvan a subirlo (vean «¿Cómo ordenar mis datos?» al final de la página).'); return e; }
    serieOK = C4.construirSerie(tabla, cols.fecha === SIN_FECHA ? null : cols.fecha, cols.valor);
    if (serieOK.errores.length) return serieOK.errores;
    if (v.periodosCiclo > serieOK.n) e.push('El ciclo (' + v.periodosCiclo + ' periodos) es más largo que la serie (' + serieOK.n + ' puntos): el promedio móvil no cabe. Reduzcan los periodos por ciclo.');
    if (2 * v.ventanaReciente > serieOK.n) e.push('Con k = ' + v.ventanaReciente + ' se necesitan al menos ' + (2 * v.ventanaReciente) + ' puntos; la serie tiene ' + serieOK.n + '.');
    return e;
  }

  function ejecutar(v) {
    const Sx = serieOK, D = C4.descomponer(Sx, v), A = C4.compararAnioAnterior(Sx, v);
    const com = comentariosActuales();
    const vacias = C4.limpiarPalabrasVacias(UI.$('#txtVacias').value);
    const opc = { minusculas: UI.$('#opMinusculas').checked, sinAcentos: UI.$('#opAcentos').checked };
    const T = com.lista.length ? C4.terminos(com.lista, vacias, opc) : null;
    ultimosTerminos = T ? T.lista : [];
    const L = [];
    L.push(S('=== Resultados con %d periodos, ciclo=%d periodos, k=%d ===', Sx.n, v.periodosCiclo, v.ventanaReciente));
    L.push('Datos: ' + origen + (hoja ? ' (hoja «' + hoja + '»)' : ''));
    L.push('Columnas: fecha=' + (cols.fecha === SIN_FECHA ? '(1, 2, 3…)' : cols.fecha) + ', valor=' + cols.valor);
    L.push(S('Serie: %s a %s', Sx.fechas[0], Sx.fechas[Sx.n - 1]));
    L.push(S('Interés de búsqueda: mínimo=%.1f, máximo=%.1f, promedio=%.1f', D.minimo, D.maximo, D.promedio));
    L.push(S('Amplitud estimada del componente estacional: %.1f puntos', D.ampEst));
    L.push(S('Amplitud del componente estacional sin los extremos: %.1f puntos', D.ampCentral));
    L.push(S('Tendencia (zona central): %s%.2f puntos por periodo', D.pendiente >= 0 ? '+' : '−', Math.abs(D.pendiente)));
    if (D.mesPico !== null) L.push(S('Mes con mayor componente estacional: %s · mes con menor: %s', C4.MESES[D.mesPico], C4.MESES[D.mesValle]));
    L.push('');
    if (A) {
      L.push(S('Últimos %d periodos (desde %s): cambio de %s puntos respecto a los %d anteriores', A.k, A.fechaInicioReciente, signo(A.cambioReciente), A.k));
      L.push(S('Misma época del año anterior (desde %s): cambio de %s puntos', A.fechaInicioAnterior, signo(A.cambioAnterior)));
      L.push('Lectura: ' + ({ estacional: 'el salto es compatible con la TEMPORADA (ocurrió igual el año pasado).', inusual: 'el salto es INUSUAL para esta época del año.', mixto: 'el salto es parcialmente estacional.', 'sin cambio': 'no hubo cambio reciente.' })[A.veredicto]);
    } else L.push(S('Comparación con el año anterior: se necesitan al menos %d periodos (un ciclo + 2k).', v.periodosCiclo + 2 * v.ventanaReciente));
    L.push('');
    if (T) {
      const nTop = Math.min(v.nTop, T.lista.length);
      L.push(S('Top %d términos en %d comentarios (%s):', nTop, com.lista.length, com.origen));
      for (let i = 0; i < nTop; i++) L.push(S('  %-15s %d', T.lista[i].palabra, T.lista[i].n));
    } else L.push('Escucha social: no hay comentarios cargados (hoja «Comentarios», columna de texto o pegados a la izquierda).');

    const avisos = Sx.avisos.slice();
    if (!D.cicloCompleto) avisos.push('La serie tiene menos de un ciclo completo: no hay forma de distinguir estacionalidad de tendencia.');
    else if (!D.dosCiclos) avisos.push('Con menos de dos ciclos no se puede confirmar que el patrón estacional se repite.');
    if (T && com.lista.length < C4.LIMITES.minComentarios) avisos.push('Hay solo ' + com.lista.length + ' comentarios: la frecuencia de términos con tan pocos textos es muy inestable.');
    ultimo = { Sx, D, A, T, com, v };
    return {
      consola: L.join('\n'), avisos, Sx, D, A, T, com, v,
      metricas: {
        origen, n: Sx.n, ciclo: v.periodosCiclo, k: v.ventanaReciente, ampEst: D.ampEst, pendiente: D.pendiente,
        mesPico: D.mesPico !== null ? C4.MESES[D.mesPico] : '—', cambioReciente: A ? A.cambioReciente : NaN, cambioAnterior: A ? A.cambioAnterior : NaN,
        veredicto: A ? ({ estacional: 'Temporada', inusual: 'Inusual', mixto: 'Mixto', 'sin cambio': 'Sin cambio' })[A.veredicto] : '—',
        top1: T && T.lista.length ? T.lista[0].palabra : '—'
      }
    };
  }

  /* ---------- figuras ---------- */
  function dibujarNube(terminos, nTop) {
    const canvas = document.getElementById('nube');
    if (!canvas) return;
    const caja = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(200, caja.width), H = Math.max(200, caja.height);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--texto').trim(); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText('Frecuencia de términos en sus comentarios', W / 2, 8);
    const lista = terminos.slice(0, Math.max(nTop, 40));
    if (!lista.length) return;
    const nMax = lista[0].n, nMin = lista[lista.length - 1].n;
    const escala = Math.min(W, H) / 380;
    const tam = n => (nMax === nMin ? 30 : 13 + (n - nMin) / (nMax - nMin) * 42) * escala;
    const colores = ['#0072BD', '#D95319', '#7E2F8E', '#77AC30', '#A2142F', '#297D82', '#6B1F3B'];
    const puestas = [];
    const choca = r => puestas.some(p => r.x < p.x + p.w && r.x + r.w > p.x && r.y < p.y + p.h && r.y + r.h > p.y);
    const cx = W / 2, cy = (H + 30) / 2;
    ctx.textBaseline = 'middle';
    lista.forEach(function (t, i) {
      const fs = tam(t.n);
      ctx.font = '600 ' + fs.toFixed(1) + 'px system-ui, sans-serif';
      const w = ctx.measureText(t.palabra).width + 4, h = fs * 1.05;
      for (let a = 0; a < 2400; a++) {
        const ang = a * 0.21, rad = 1.6 * ang;
        const x = cx + rad * Math.cos(ang) * 1.5 - w / 2, y = cy + rad * Math.sin(ang) - h / 2;
        const rect = { x, y, w, h };
        if (x < 2 || y < 30 || x + w > W - 2 || y + h > H - 2 || choca(rect)) continue;
        puestas.push(rect); ctx.fillStyle = colores[i % colores.length]; ctx.fillText(t.palabra, x + w / 2, y + h / 2);
        break;
      }
    });
  }

  function dibujarClasificacion(terminos, nTop) {
    const top = terminos.slice(0, nTop);
    const guardado = UI.leer(CLAVE_CLASIF, {});
    let h = '<table class="tabla"><thead><tr><th>#</th><th>Término</th><th>Frecuencia</th><th>Clasificación</th></tr></thead><tbody>';
    top.forEach(function (t, i) {
      h += '<tr><td>' + (i + 1) + '</td><td class="izq"><b>' + UI.esc(t.palabra) + '</b></td><td>' + t.n + '</td><td class="izq"><select data-termino="' + UI.esc(t.palabra) +
        '" aria-label="Clasificación de ' + UI.esc(t.palabra) + '">' + CATEGORIAS.map(c => '<option' + (guardado[t.palabra] === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></td></tr>';
    });
    UI.$('#tablaClasificar').innerHTML = top.length ? h + '</tbody></table>' : '<div class="vacio">Sin términos que clasificar.</div>';
    UI.$('#tablaClasificar').querySelectorAll('select').forEach(s => s.addEventListener('change', function () {
      const g = UI.leer(CLAVE_CLASIF, {}); g[s.dataset.termino] = s.value; UI.guardar(CLAVE_CLASIF, g); resumenClasificacion(top);
    }));
    resumenClasificacion(top);
  }
  function resumenClasificacion(top) {
    const g = UI.leer(CLAVE_CLASIF, {});
    const tot = {}; CATEGORIAS.forEach(c => { tot[c] = 0; });
    top.forEach(t => { tot[g[t.palabra] || CATEGORIAS[0]] += t.n; });
    const suma = top.reduce((s, t) => s + t.n, 0) || 1;
    UI.$('#resumenClasif').innerHTML = '<b>Menciones de estos términos por categoría:</b> ' + CATEGORIAS.map(c => UI.esc(c) + ' = ' + tot[c] + ' (' + (100 * tot[c] / suma).toFixed(0) + ' %)').join(' · ') +
      '<br><span style="opacity:.8">Esta clasificación es un trabajo humano: la nube de palabras solo cuenta, no interpreta.</span>';
  }

  function dibujar(r, v) {
    const Sx = r.Sx, D = r.D, A = r.A, T = r.T, oscuro = UI.esOscuro();
    const tinta = oscuro ? '#fff' : '#000';
    const fx = Sx.tieneFechas ? Sx.fechas : Sx.fechas.map(String);
    const tipoX = Sx.tieneFechas ? 'date' : 'linear';

    // Paso 1
    const nInt = Sx.interpolados.filter(Boolean).length;
    UI.$('#kpisSerie').innerHTML =
      '<div class="kpi"><div class="v">' + Sx.n + '</div><div class="t">Periodos en la serie (' + Sx.fechas[0] + ' a ' + Sx.fechas[Sx.n - 1] + ')</div></div>' +
      '<div class="kpi"><div class="v">' + (Sx.cicloDetectado ? C4.CICLOS[Sx.cicloDetectado] : '—') + '</div><div class="t">Frecuencia detectada' + (Sx.cicloDetectado ? ' (' + Sx.cicloDetectado + ' periodos por año)' : '') + '</div></div>' +
      '<div class="kpi"><div class="v">' + nInt + '</div><div class="t">Valores faltantes rellenados por interpolación</div></div>' +
      '<div class="kpi"><div class="v">' + fmt1(D.minimo) + ' – ' + fmt1(D.maximo) + '</div><div class="t">Rango de la serie (promedio ' + fmt1(D.promedio) + ')</div></div>';
    const tr1 = [{ x: fx, y: Sx.y, type: 'scatter', mode: 'lines', name: 'Serie', line: { color: oscuro ? '#9a9a9a' : '#6f6f6f', width: 1.6 } }];
    if (nInt) { const idx = Sx.interpolados.map((b, i) => b ? i : -1).filter(i => i >= 0);
      tr1.push({ x: idx.map(i => fx[i]), y: idx.map(i => Sx.y[i]), type: 'scatter', mode: 'markers', name: 'Rellenados', marker: { symbol: 'x', size: 10, color: '#A4461F', line: { width: 2 } } }); }
    UI.graficar('figSerie', tr1, { title: 'Su serie de tiempo', yaxis: { title: { text: 'Valor' } }, xaxis: { type: tipoX }, legend: { orientation: 'h', y: -0.2 }, hovermode: 'x unified' }, { archivo: 'cap04_serie' });

    // Paso 2
    UI.$('#kpisDesc').innerHTML =
      '<div class="kpi"><div class="v">' + D.ampEst.toFixed(1) + '</div><div class="t">Amplitud estacional estimada (como el script): del punto más alto al más bajo del componente estacional</div></div>' +
      '<div class="kpi"><div class="v">' + D.ampCentral.toFixed(1) + '</div><div class="t">Amplitud estacional sin los extremos de la serie (más confiable)</div></div>' +
      '<div class="kpi"><div class="v">' + (D.pendiente >= 0 ? '+' : '−') + Math.abs(D.pendiente).toFixed(2) + '</div><div class="t">Pendiente de la tendencia en la zona central (puntos por periodo)</div></div>' +
      '<div class="kpi"><div class="v">' + (D.mesPico !== null ? C4.MESES[D.mesPico] : '—') + '</div><div class="t">Mes de mayor componente estacional' + (D.mesValle !== null ? ' (menor: ' + C4.MESES[D.mesValle] + ')' : '') + '</div></div>';
    const av = [];
    if (D.bordes > 0) av.push('Los primeros y últimos ' + D.bordes + ' periodos usan un promedio móvil <b>incompleto</b> (como en el script): ahí la tendencia y la estacionalidad son menos confiables, y la amplitud estimada puede inflarse.');
    if (v.periodosCiclo < 52 && Sx.cicloDetectado === 52) av.push('Con un promedio móvil de <b>' + v.periodosCiclo + '</b> periodos (menos de un ciclo anual) la tendencia absorbe parte de la temporada: el componente estacional se «encoge». Comparen con 52.');
    UI.$('#avisosDesc').innerHTML = av.map(a => '<div class="aviso">ℹ ' + a + '</div>').join('');
    UI.graficar('figTend', [
      { x: fx, y: Sx.y, type: 'scatter', mode: 'lines', name: 'Serie observada', line: { color: oscuro ? '#8a8a8a' : UI.color.gris, width: 1.2 } },
      { x: fx, y: D.tendencia, type: 'scatter', mode: 'lines', name: 'Tendencia', line: { color: UI.color.guinda, width: 2.6 } }
    ], { title: S('Serie observada y tendencia (promedio móvil de %d periodos)', v.periodosCiclo), yaxis: { title: { text: 'Valor' } }, xaxis: { type: tipoX }, legend: { x: 0.01, y: 0.99 }, hovermode: 'x unified' }, { archivo: 'cap04_datos_tendencia' });
    UI.graficar('figEst', [{ x: fx, y: D.estacional, type: 'scatter', mode: 'lines', name: 'Componente estacional', line: { color: UI.color.teal, width: 1.8 } }],
      { title: 'Componente estacional (serie menos tendencia)', yaxis: { title: { text: 'Componente estacional' } }, xaxis: { type: tipoX }, showlegend: false, hovermode: 'x unified',
        shapes: [{ type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 0, y1: 0, line: { dash: 'dot', color: tinta, width: 1 } }] }, { archivo: 'cap04_datos_estacional' });
    if (D.perfilMes) {
      UI.graficar('figMes', [{ x: C4.MESES, y: D.perfilMes.map(x => Number.isNaN(x) ? null : +x.toFixed(2)), type: 'bar',
        marker: { color: D.perfilMes.map((x, k) => k === D.mesPico ? UI.color.guinda : UI.color.gris) }, hovertemplate: '%{x}: %{y:.1f}<extra></extra>' }],
      { title: 'Estacionalidad promedio por mes', yaxis: { title: { text: 'Componente estacional promedio' } }, showlegend: false }, { archivo: 'cap04_perfil_mes' });
    } else UI.graficar('figMes', [], { title: 'Estacionalidad por mes: requiere una columna de fechas', xaxis: { visible: false }, yaxis: { visible: false } }, { archivo: 'cap04_perfil_mes' });

    // Paso 3
    const w = v.periodosCiclo;
    if (A) {
      const col = { estacional: '#2E7D4F', inusual: '#A4461F', mixto: '#B07A1F', 'sin cambio': '#666' }[A.veredicto];
      const nombre = { estacional: 'Compatible con la temporada', inusual: 'Inusual para la época', mixto: 'Parcialmente estacional', 'sin cambio': 'Sin cambio reciente' }[A.veredicto];
      UI.$('#kpisAnio').innerHTML =
        '<div class="kpi"><div class="v">' + signo(A.cambioReciente) + '</div><div class="t">Cambio de los últimos ' + A.k + ' periodos (desde ' + A.fechaInicioReciente + ') frente a los ' + A.k + ' anteriores</div></div>' +
        '<div class="kpi"><div class="v">' + signo(A.cambioAnterior) + '</div><div class="t">Cambio en la misma época del año anterior (desde ' + A.fechaInicioAnterior + ')</div></div>' +
        '<div class="kpi"><div class="v" style="color:' + col + '">' + nombre + '</div><div class="t">Veredicto de la comparación</div></div>';
      UI.$('#conclusionAnio').innerHTML = '<p>' + ({
        estacional: '<b>Es muy probable que sea temporada, no campaña.</b> Hace un año, en esta misma época, el cambio fue de ' + signo(A.cambioAnterior) + ' puntos, parecido al actual (' + signo(A.cambioReciente) + '). Duplicar el presupuesto por este salto sería atribuirle a la campaña lo que el calendario ya explica. Solo si el cambio de este año <i>supera</i> al del año pasado hay indicio de un efecto adicional.',
        inusual: '<b>Este cambio es inusual para la época.</b> Hace un año, en esta misma época, el cambio fue de solo ' + signo(A.cambioAnterior) + ' puntos, frente a ' + signo(A.cambioReciente) + ' ahora. La campaña es una explicación posible, pero no la única (competencia, noticias, otros canales): aíslen su efecto antes de invertir más.',
        mixto: '<b>El cambio es solo en parte estacional.</b> Hace un año fue de ' + signo(A.cambioAnterior) + ' y ahora de ' + signo(A.cambioReciente) + ': una parte del salto es temporada y el resto podría deberse a otra causa, como la campaña.',
        'sin cambio': 'No hubo cambio reciente: no hay salto que explicar.' })[A.veredicto] + '</p>';
      const n = Sx.n, desde = Math.max(0, n - w), prev0 = Math.max(0, n - 2 * w);
      const xEste = fx.slice(desde), yEste = Sx.y.slice(desde);
      const yPrev = Sx.y.slice(prev0, prev0 + (n - desde));           // mismas posiciones, un ciclo antes
      const xPrev = xEste.slice(xEste.length - yPrev.length);
      UI.graficar('figAnio', [
        { x: xPrev, y: yPrev, type: 'scatter', mode: 'lines', name: 'Año anterior (alineado por fecha)', line: { color: oscuro ? '#9a9a9a' : '#8a8a8a', width: 2.2, dash: 'dot' } },
        { x: xEste, y: yEste, type: 'scatter', mode: 'lines', name: 'Último año', line: { color: UI.color.guinda, width: 2.6 } }
      ], { title: 'Último año contra el año anterior', yaxis: { title: { text: 'Valor' } }, xaxis: { type: tipoX }, legend: { orientation: 'h', y: -0.2 }, hovermode: 'x unified',
        shapes: [{ type: 'rect', xref: 'x', yref: 'paper', x0: fx[n - A.k], x1: fx[n - 1], y0: 0, y1: 1, fillcolor: 'rgba(184,150,89,0.25)', line: { width: 0 }, layer: 'below' }] }, { archivo: 'cap04_anio_contra_anio' });
    } else {
      UI.$('#kpisAnio').innerHTML = '';
      UI.$('#conclusionAnio').innerHTML = '<p>Para comparar con el año anterior se necesitan al menos <b>un ciclo completo más 2k periodos</b> (' + (w + 2 * v.ventanaReciente) + '); la serie tiene ' + Sx.n + '. Carguen más datos o reduzcan k.</p>';
      UI.graficar('figAnio', [], { title: 'Comparación no disponible: serie demasiado corta', xaxis: { visible: false }, yaxis: { visible: false } }, { archivo: 'cap04_anio_contra_anio' });
    }

    // Paso 4
    if (T) {
      const nTop = Math.min(v.nTop, T.lista.length);
      UI.$('#kpisTexto').innerHTML =
        '<div class="kpi"><div class="v">' + r.com.lista.length + '</div><div class="t">Comentarios analizados (' + UI.esc(r.com.origen) + ')</div></div>' +
        '<div class="kpi"><div class="v">' + T.distintos + '</div><div class="t">Términos distintos tras quitar palabras vacías</div></div>' +
        '<div class="kpi"><div class="v">' + (100 * (1 - T.usados / Math.max(1, T.totalTokens))).toFixed(0) + ' %</div><div class="t">de las palabras eran vacías y se descartaron</div></div>' +
        '<div class="kpi"><div class="v">' + (T.lista.length ? UI.esc(T.lista[0].palabra) : '—') + '</div><div class="t">Término más frecuente (' + (T.lista.length ? T.lista[0].n : 0) + ' veces)</div></div>';
      UI.$('#avisosTexto').innerHTML = '';
      dibujarNube(T.lista, nTop);
      const top = T.lista.slice(0, nTop).reverse();
      UI.graficar('figTop', [{ y: top.map(t => t.palabra), x: top.map(t => t.n), type: 'bar', orientation: 'h', marker: { color: UI.color.guinda },
        text: top.map(t => String(t.n)), textposition: 'outside', cliponaxis: false }],
      { title: 'Top ' + nTop + ' términos', xaxis: { title: { text: 'Frecuencia en el corpus' }, dtick: 1 }, showlegend: false, margin: { l: 100 } }, { archivo: 'cap04_datos_top_terminos' });
      dibujarClasificacion(T.lista, nTop);
    } else {
      UI.$('#kpisTexto').innerHTML = '';
      UI.$('#avisosTexto').innerHTML = '<div class="aviso">ℹ No hay comentarios: agreguen una hoja «Comentarios» a su Excel, una columna de texto, o péguenlos a la izquierda (sección 4).</div>';
      dibujarNube([], 10);
      UI.graficar('figTop', [], { title: 'Sin comentarios', xaxis: { visible: false }, yaxis: { visible: false } }, { archivo: 'cap04_datos_top_terminos' });
      UI.$('#tablaClasificar').innerHTML = ''; UI.$('#resumenClasif').innerHTML = '';
    }

    // Paso 5
    UI.$('#conclusion').innerHTML = conclusion(r, v);
  }

  function conclusion(r, v) {
    const Sx = r.Sx, D = r.D, A = r.A, T = r.T, p = [];
    p.push('<p><b>1. La serie.</b> ' + Sx.n + ' periodos (' + Sx.fechas[0] + ' a ' + Sx.fechas[Sx.n - 1] + ')' + (Sx.rellenados ? ', con ' + Sx.rellenados + ' valor(es) rellenado(s) por interpolación' : ', sin faltantes') +
      '. ' + (D.dosCiclos ? 'Cubre al menos dos ciclos, así que se puede comprobar si el patrón estacional se repite.' : D.cicloCompleto ? 'Cubre solo un ciclo: no se puede confirmar que el patrón se repita.' : 'Cubre menos de un ciclo: no es posible separar estacionalidad de tendencia.') + '</p>');
    p.push('<p><b>2. Tendencia y temporada.</b> La tendencia ' + (Math.abs(D.pendiente) < 0.02 ? 'es prácticamente plana' : (D.pendiente > 0 ? 'sube' : 'baja') + ' unos ' + Math.abs(D.pendiente).toFixed(2) + ' puntos por periodo') +
      ' y el componente estacional tiene una amplitud de ' + D.ampEst.toFixed(1) + ' puntos' + (D.mesPico !== null ? ', con su temporada alta hacia <b>' + C4.MESES[D.mesPico] + '</b> y la baja hacia <b>' + C4.MESES[D.mesValle] + '</b>' : '') +
      '. Planear inventario, personal o presupuesto sin separar ambos componentes lleva a leer como «tendencia acelerada» lo que es la fase ascendente, predecible, del ciclo.</p>');
    if (A) p.push('<p><b>3. ¿Campaña o temporada?</b> ' + ({ estacional: 'El cambio reciente (' + signo(A.cambioReciente) + ') se parece al de hace un año (' + signo(A.cambioAnterior) + '): es muy probable que sea <b>temporada</b>; no justifica por sí solo aumentar la inversión.',
      inusual: 'El cambio reciente (' + signo(A.cambioReciente) + ') es mucho mayor que el de hace un año (' + signo(A.cambioAnterior) + '): es <b>inusual</b> para la época, y la campaña es una explicación posible que falta aislar.',
      mixto: 'El cambio reciente (' + signo(A.cambioReciente) + ') es solo <b>parcialmente</b> estacional (hace un año fue ' + signo(A.cambioAnterior) + ').', 'sin cambio': 'No hay cambio reciente que atribuir.' })[A.veredicto] + '</p>');
    if (T && T.lista.length) {
      const top3 = T.lista.slice(0, 3).map(t => '«' + UI.esc(t.palabra) + '»').join(', ');
      p.push('<p><b>4. Escucha social.</b> Los términos más frecuentes son ' + top3 + '. Una palabra frecuente no dice si la gente está contenta o molesta: eso depende de su clasificación manual. Con comentarios reales, recuerden que analizarlos implica tratamiento de datos personales y requiere base legal aunque los comentarios sean públicos (LFPDPPP).</p>');
    }
    p.push('<p><b>5. Límite.</b> Un promedio móvil de un ciclo completo es una descomposición sencilla, útil para explorar; sus extremos son poco confiables. Para decisiones de inversión conviene confirmar con más de dos ciclos o con métodos más finos.</p>');
    return p.join('');
  }

  /* ---------- descargas ---------- */
  function descargarResultados() {
    if (!ultimo) { alert('Primero carguen datos.'); return; }
    const { Sx, D, A, T, v } = ultimo;
    const g = UI.leer(CLAVE_CLASIF, {});
    const serie = Sx.fechas.map((f, i) => ({ Fecha: f, Valor: +Sx.y[i].toFixed(4), Tendencia: +D.tendencia[i].toFixed(4), Componente_estacional: +D.estacional[i].toFixed(4), Rellenado: Sx.interpolados[i] ? 'Sí' : 'No' }));
    const perfil = D.perfilMes ? C4.MESES.map((m, k) => ({ Mes: m, Componente_estacional_promedio: Number.isNaN(D.perfilMes[k]) ? '' : +D.perfilMes[k].toFixed(4) })) : [{ Aviso: 'Sin columna de fechas' }];
    const anio = A ? [{ Concepto: 'Cambio de los últimos k periodos', Valor: +A.cambioReciente.toFixed(4) }, { Concepto: 'Cambio en la misma época del año anterior', Valor: +A.cambioAnterior.toFixed(4) },
      { Concepto: 'k', Valor: A.k }, { Concepto: 'Veredicto', Valor: A.veredicto }] : [{ Concepto: 'No disponible', Valor: 'serie demasiado corta' }];
    const terminos = T ? T.lista.slice(0, Math.max(v.nTop, 10)).map((t, i) => ({ Numero: i + 1, Termino: t.palabra, Frecuencia: t.n, Clasificacion: g[t.palabra] || '' })) : [{ Aviso: 'Sin comentarios' }];
    const resumen = [['Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji'], ['Serie de tiempo y escucha social con datos propios (Cap. 4)'], [],
      ['Datos', origen + (hoja ? ' (hoja ' + hoja + ')' : '')], ['Fecha del análisis', new Date().toLocaleString('es-MX')], ['Periodos', Sx.n], ['Periodos por ciclo (promedio móvil)', v.periodosCiclo],
      ['Amplitud estacional estimada', +D.ampEst.toFixed(4)], ['Amplitud estacional sin los extremos', +D.ampCentral.toFixed(4)], ['Pendiente de la tendencia (puntos/periodo)', +D.pendiente.toFixed(4)], [],
      ['Método', 'Tendencia = promedio móvil centrado de un ciclo completo (extremos con ventana incompleta); estacionalidad = serie − tendencia. Faltantes interiores: interpolación lineal.'],
      ['Texto', 'Se quita la puntuación, se separa por espacios, se descartan palabras vacías y se cuenta cada término.']];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(serie), 'Serie_descompuesta');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perfil), 'Perfil_por_mes');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(anio), 'Contra_anio_anterior');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(terminos), 'Terminos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen_y_reglas');
    XLSX.writeFile(wb, 'serie_y_texto_resultados.xlsx');
  }

  function descargarEjemplo() {
    const E = window.EJEMPLO_CAP04, wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([E.libro.encabezados].concat(E.libro.filas)); ws['!cols'] = [{ wch: 13 }, { wch: 18 }];
    const wc = XLSX.utils.aoa_to_sheet([['Comentario']].concat(E.comentarios.map(c => [c]))); wc['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Serie'); XLSX.utils.book_append_sheet(wb, wc, 'Comentarios');
    XLSX.writeFile(wb, 'cap04_datos_ejemplo.xlsx');
  }

  /* ---------- comparación de corridas ---------- */
  const columnas = [
    { id: 'origen', titulo: 'Datos', izq: true }, { id: 'n', titulo: 'Periodos', dec: 0 }, { id: 'ciclo', titulo: 'Promedio móvil (periodos)', dec: 0 },
    { id: 'ampEst', titulo: 'Amplitud estacional', dec: 1 }, { id: 'pendiente', titulo: 'Pendiente (pts/periodo)', dec: 2 }, { id: 'mesPico', titulo: 'Mes pico' },
    { id: 'cambioReciente', titulo: 'Cambio reciente', dec: 1 }, { id: 'cambioAnterior', titulo: 'Cambio año anterior', dec: 1 }, { id: 'veredicto', titulo: 'Veredicto' }, { id: 'top1', titulo: 'Término #1' }
  ];
  function caso(r) {
    const red = a => a.map(x => +x.toFixed(2));
    return { valores: r.metricas, extra: { fechas: r.Sx.fechas, obs: red(r.Sx.y), tend: red(r.D.tendencia), est: red(r.D.estacional) } };
  }
  function dibujarComparacion(lista) {
    const t1 = [], t2 = [];
    lista.forEach(function (c, i) {
      const col = UI.colorCaso(i), e = c.extra;
      if (!e) return;
      t1.push({ x: e.fechas, y: e.obs, type: 'scatter', mode: 'lines', name: c.etiqueta + ' serie', legendgroup: 'c' + i, line: { color: col, width: 1 }, opacity: 0.5 });
      t1.push({ x: e.fechas, y: e.tend, type: 'scatter', mode: 'lines', name: c.etiqueta + ' tendencia (' + c.valores.ciclo + ')', legendgroup: 'c' + i, line: { color: col, width: 3 } });
      t2.push({ x: e.fechas, y: e.est, type: 'scatter', mode: 'lines', name: c.etiqueta + ' (ventana ' + c.valores.ciclo + ')', line: { color: col, width: 1.8 } });
    });
    UI.graficar('comp1', t1, { title: 'Serie y tendencia — casos guardados', yaxis: { title: { text: 'Valor' } }, legend: { orientation: 'h', y: -0.2 } }, { archivo: 'cap04_datos_comparacion_series' });
    UI.graficar('comp2', t2, { title: 'Componente estacional — casos guardados', yaxis: { title: { text: 'Componente estacional' } }, legend: { orientation: 'h', y: -0.25 } }, { archivo: 'cap04_datos_comparacion_estacional' });
  }

  UI.iniciarApp({
    clave: 'cap04_datos_propios', specs, defecto: C4.DEFECTO, presets, columnas, ejecutar, dibujar, leerExtra, caso, dibujarComparacion,
    alIniciar: function (diferido) {
      recalcular = diferido;
      const zona = UI.$('#zonaArchivo'), campos = UI.$('#campos');
      campos.parentNode.insertBefore(zona, campos);
      campos.parentNode.insertBefore(UI.$('#zonaTexto'), campos.nextSibling);
      const col = document.querySelector('.columna');
      col.insertBefore(UI.$('#panelConceptos'), col.firstChild);
      UI.$('#btnRestablecer').textContent = 'Valores del libro';
      UI.$('#txtVacias').value = C4.PALABRAS_VACIAS.join(' ');
      UI.$('#colFecha').addEventListener('change', function () { cols.fecha = this.value; dibujarResumenDatos(); sugerirCiclo(); diferido(); });
      UI.$('#colValor').addEventListener('change', function () { cols.valor = this.value; dibujarResumenDatos(); sugerirCiclo(); diferido(); });
      UI.$('#colTexto').addEventListener('change', function () { cols.texto = this.value; dibujarResumenDatos(); diferido(); });
      ['#opMinusculas', '#opAcentos'].forEach(id => UI.$(id).addEventListener('change', diferido));
      ['#txtVacias', '#txtComentarios'].forEach(id => UI.$(id).addEventListener('input', diferido));
      const input = UI.$('#archivo');
      input.addEventListener('change', () => { if (input.files[0]) leerArchivo(input.files[0]); input.value = ''; });
      const caja = zona.querySelector('.subir');
      ['dragenter', 'dragover'].forEach(ev => caja.addEventListener(ev, e => { e.preventDefault(); caja.classList.add('encima'); }));
      ['dragleave', 'drop'].forEach(ev => caja.addEventListener(ev, e => { e.preventDefault(); caja.classList.remove('encima'); }));
      caja.addEventListener('drop', e => { if (e.dataTransfer.files[0]) leerArchivo(e.dataTransfer.files[0]); });
      UI.$('#btnEjemplo1').addEventListener('click', () => cargarEjemplo('libro', 'Ejemplo 1: serie sintética del libro'));
      UI.$('#btnEjemplo2').addEventListener('click', () => cargarEjemplo('caso', 'Ejemplo 2: marca de electrodomésticos (caso de estudio)'));
      UI.$('#btnDescargarEjemplo').addEventListener('click', descargarEjemplo);
      UI.$('#btnDescargarResultados').addEventListener('click', descargarResultados);
      UI.$('#btnNubePNG').addEventListener('click', function () {
        const c = document.getElementById('nube'), tmp = document.createElement('canvas'); tmp.width = c.width; tmp.height = c.height;
        const ctx = tmp.getContext('2d'); ctx.fillStyle = getComputedStyle(document.body).backgroundColor; ctx.fillRect(0, 0, tmp.width, tmp.height); ctx.drawImage(c, 0, 0);
        const a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'cap04_nube_palabras.png'; document.body.appendChild(a); a.click(); a.remove();
      });
      UI.$('#btnCSVClasif').addEventListener('click', function () {
        const g = UI.leer(CLAVE_CLASIF, {}), n = UI.leerCampos(specs).valores.nTop;
        const filas = [['#', 'Término', 'Frecuencia', 'Clasificación']];
        ultimosTerminos.slice(0, n).forEach((t, i) => filas.push([i + 1, t.palabra, t.n, g[t.palabra] || CATEGORIAS[0]]));
        UI.descargar('cap04_clasificacion_terminos.csv', UI.aCSV(filas), 'text/csv;charset=utf-8');
      });
      let t = null;
      window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(() => dibujarNube(ultimosTerminos, UI.leerCampos(specs).valores.nTop || 10), 150); });
      const btnTema = UI.$('#btnTema');
      if (btnTema) btnTema.addEventListener('click', () => dibujarNube(ultimosTerminos, UI.leerCampos(specs).valores.nTop || 10));
      cargarEjemplo('caso', 'Ejemplo 2: marca de electrodomésticos (caso de estudio)');
    }
  });
})();
