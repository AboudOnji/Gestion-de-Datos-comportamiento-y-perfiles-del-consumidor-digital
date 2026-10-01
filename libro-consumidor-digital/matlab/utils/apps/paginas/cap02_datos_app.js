/* cap02_datos_app.js — segmentación con datos propios (Excel/CSV) y
   arquetipos definidos en la página, como recorrido guiado en 5 pasos:
   punto de partida, rígido (k-means + silueta), difuso (fuzzy c-means +
   pertenencia), rígido contra difuso, y qué tanto corrigieron los datos a
   los arquetipos. Cálculo: Cap02.analizarConArquetipos; piezas visuales:
   Didactico (cap02_didactico.js). */
(function () {
  'use strict';
  const S = Numerico.sprintf;
  const DP = DatosPropios;
  const K_MIN = 2, K_MAX = 8;

  // Un arquetipo = { nombre, valores: { nombreDeColumna: valor } }. Los
  // valores se guardan por nombre de columna, así sobreviven si el alumno
  // marca o desmarca variables.
  function fmt(v) { return Math.abs(v) >= 100 ? v.toFixed(0) : (+v.toFixed(2)).toString(); }
  const copiaArq = a => a.map(x => ({ nombre: x.nombre, valores: Object.assign({}, x.valores) }));
  const ARQ_LIBRO_VACIOS = DP.ARQUETIPOS_LIBRO.map(a => ({ nombre: a.nombre, valores: {} }));
  const esDelLibro = (a, i) => DP.ARQUETIPOS_LIBRO[i] && a.nombre === DP.ARQUETIPOS_LIBRO[i].nombre;

  // Estado
  let tabla = null, origen = '', hoja = '';
  let disponibles = [];      // columnas numéricas utilizables del archivo
  let vars = [];             // columnas elegidas para segmentar (en orden)
  let arquetipos = copiaArq(ARQ_LIBRO_VACIOS);
  let recalcular = function () {};
  let matriz = null, ultimo = null;

  /* ---------- carga de datos ---------- */
  function cargarFilas(filas, nombre, nombreHoja) {
    tabla = DP.procesarTabla(filas);
    origen = nombre; hoja = nombreHoja || '';
    const v = tabla.errores.length ? { errores: [], nombres: [] } : DP.variablesDisponibles(tabla);
    tabla.errores = tabla.errores.concat(v.errores);
    disponibles = v.nombres;
    vars = disponibles.slice(0, DP.LIMITES.maxVars);
    if (disponibles.length > DP.LIMITES.maxVars) tabla.avisos.push('El archivo tiene ' + disponibles.length + ' columnas numéricas; se marcaron las primeras ' + DP.LIMITES.maxVars + '.');
    // Si los arquetipos siguen siendo los del libro pero las columnas no son las del libro, se proponen desde los datos.
    const arqSonLibro = arquetipos.length === DP.ARQUETIPOS_LIBRO.length && arquetipos.every(esDelLibro);
    if (arqSonLibro && !DP.sonVariablesDelLibro(vars)) proponerDesdeDatos(true);
    else completarArquetipos();
    dibujarVariables();
    dibujarArquetipos();
    dibujarResumenDatos();
    recalcular();
  }

  function leerArchivo(archivo) {
    const lector = new FileReader();
    UI.$('#estadoArchivo').textContent = 'Leyendo «' + archivo.name + '»…';
    lector.onload = function (e) {
      try {
        const bytes = new Uint8Array(e.target.result);
        let wb;
        if (/\.(csv|txt)$/i.test(archivo.name)) {
          // CSV: decodificar el texto nosotros (UTF-8; si no es válido, Windows-1252,
          // como lo guarda Excel en español) para que los acentos de los
          // encabezados («Antigüedad», «Región») no se lean mal.
          let texto;
          try { texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
          catch (_) { texto = new TextDecoder('windows-1252').decode(bytes); }
          wb = XLSX.read(texto.replace(/^\uFEFF/, ''), { type: 'string' });
        } else wb = XLSX.read(bytes, { type: 'array' });
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
    arquetipos = copiaArq(ARQ_LIBRO_VACIOS);
    cargarFilas([E.encabezados].concat(E.filas), 'Datos de ejemplo (sintéticos)', 'Datos');
  }

  function dibujarResumenDatos() {
    const est = UI.$('#estadoArchivo'), res = UI.$('#resumenDatos'), vista = UI.$('#vistaDatos');
    if (!tabla) { est.textContent = 'Aún no hay datos.'; res.textContent = ''; vista.innerHTML = ''; return; }
    const tipos = { id: 'identificador', numerica: 'numérica', texto: 'texto', vacia: 'vacía' };
    est.innerHTML = (tabla.errores.length ? '⚠ ' : '✔ ') + '<b>' + UI.esc(origen) + '</b>' + (hoja ? ' · hoja «' + UI.esc(hoja) + '»' : '') +
      ' · ' + tabla.filasDatos.length + ' clientes · ' + disponibles.length + ' variables numéricas' +
      (tabla.errores.length ? '<br>' + tabla.errores.map(UI.esc).join('<br>') : '');
    res.innerHTML = '<b>Columnas detectadas:</b> ' + tabla.columnas.map(c => UI.esc(c.nombre) + ' <i>(' +
      (vars.includes(c.nombre) ? 'se usa' : c.tipo === 'id' ? 'identificador' : c.constante ? 'no se usa: constante' :
        c.tipo === 'numerica' ? 'numérica, no marcada' : 'no se usa: ' + tipos[c.tipo]) +
      (c.nVacios ? ', ' + c.nVacios + ' vacías' : '') + (c.tipo === 'numerica' && c.nTexto ? ', ' + c.nTexto + ' con texto' : '') + ')</i>').join(' · ') +
      (tabla.avisos.length ? '<br>' + tabla.avisos.map(a => 'ℹ ' + UI.esc(a)).join('<br>') : '');
    let h = '<table class="tabla"><thead><tr><th>Fila</th>' + tabla.columnas.map(c => '<th>' + UI.esc(c.nombre) + '</th>').join('') + '</tr></thead><tbody>';
    tabla.filasDatos.slice(0, 8).forEach(r => {
      h += '<tr><td>' + r.filaExcel + '</td>' + r.celdas.map(v => '<td>' + (v === null || v === undefined ? '<i>vacía</i>' : UI.esc(v)) + '</td>').join('') + '</tr>';
    });
    h += '</tbody></table><div class="nota">Primeras ' + Math.min(8, tabla.filasDatos.length) + ' filas de ' + tabla.filasDatos.length + ' (número de fila como en Excel).</div>';
    vista.innerHTML = h;
  }

  /* ---------- variables (columnas) ---------- */
  function dibujarVariables() {
    const cont = UI.$('#listaVariables');
    if (!tabla || !disponibles.length) { cont.textContent = '—'; llenarEjes(); return; }
    cont.innerHTML = disponibles.map(function (n) {
      const vals = DP.valoresColumna(tabla, n);
      const mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      return '<label style="display:block;margin:3px 0"><input type="checkbox" data-var="' + UI.esc(n) + '"' + (vars.includes(n) ? ' checked' : '') + '> ' +
        UI.esc(n) + ' <span style="opacity:.7">[' + fmt(mn) + ' – ' + fmt(mx) + ']</span></label>';
    }).join('');
    cont.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', function () {
      vars = disponibles.filter(n => { const el = cont.querySelector('input[data-var="' + CSS.escape(n) + '"]'); return el && el.checked; });
      completarArquetipos();
      dibujarArquetipos(); llenarEjes(); dibujarResumenDatos(); recalcular();
    }));
    llenarEjes();
  }

  function llenarEjes() {
    ['#ejeX', '#ejeY'].forEach(function (id, i) {
      const sel = UI.$(id), previo = sel.value;
      sel.innerHTML = vars.map(n => '<option>' + UI.esc(n) + '</option>').join('');
      if (vars.includes(previo)) sel.value = previo;
      else if (vars.length) sel.value = vars[i === 0 ? 0 : vars.length - 1];
    });
  }

  /* ---------- arquetipos ---------- */
  // Llena los valores que falten: los del libro si el arquetipo y la columna
  // son del libro; si no, la propuesta por percentiles de los datos.
  function completarArquetipos() {
    if (!tabla || !vars.length) return;
    const k = arquetipos.length;
    const propuesta = DP.proponerArquetipos(tabla, vars, k);
    arquetipos.forEach(function (a, i) {
      vars.forEach(function (n) {
        if (Number.isFinite(a.valores[n])) return;
        const libro = esDelLibro(a, i) ? DP.valorDelLibro(i, n) : null;
        a.valores[n] = libro !== null ? libro : propuesta[i][n];
      });
    });
  }

  // Reemplaza los valores (y, si se pide, los nombres) por la propuesta bajo/medio/alto.
  function proponerDesdeDatos(cambiarNombres) {
    if (!tabla || !vars.length) return;
    const k = arquetipos.length;
    const propuesta = DP.proponerArquetipos(tabla, vars, k);
    arquetipos = arquetipos.map((a, i) => ({ nombre: cambiarNombres ? DP.nombrePropuesto(i, k) : a.nombre, valores: propuesta[i] }));
  }

  function dibujarArquetipos() {
    let h = '';
    arquetipos.forEach(function (a, i) {
      h += '<div class="arq" style="border-left-color:' + UI.lineas[i % UI.lineas.length] + '"><div class="arq-cab">' +
        '<input type="text" data-f="' + i + '" data-c="" value="' + UI.esc(a.nombre) + '" aria-label="Nombre del arquetipo ' + (i + 1) + '">' +
        '<button class="btn sec peq" type="button" data-quitar="' + i + '" title="Quitar este arquetipo"' + (arquetipos.length <= K_MIN ? ' disabled' : '') + '>✕</button></div>' +
        '<div class="arq-vals">' + vars.map(n => '<label title="' + UI.esc(n) + '"><span>' + UI.esc(n) + '</span>' +
          '<input type="number" step="any" data-f="' + i + '" data-c="' + UI.esc(n) + '" value="' + (Number.isFinite(a.valores[n]) ? a.valores[n] : '') +
          '" aria-label="' + UI.esc(n) + ' de ' + UI.esc(a.nombre) + '"></label>').join('') + '</div></div>';
    });
    const cont = UI.$('#matrizArquetipos');
    cont.innerHTML = h;
    cont.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        const a = arquetipos[+inp.dataset.f];
        if (inp.dataset.c === '') a.nombre = inp.value;
        else a.valores[inp.dataset.c] = inp.value === '' ? NaN : Number(inp.value);
        recalcular();
      });
    });
    cont.querySelectorAll('[data-quitar]').forEach(b => b.addEventListener('click', function () {
      arquetipos.splice(+b.dataset.quitar, 1); dibujarArquetipos(); recalcular();
    }));
    UI.$('#btnAgregarArquetipo').disabled = arquetipos.length >= K_MAX;
    UI.$('#btnArquetiposLibro').style.display = DP.sonVariablesDelLibro(vars) ? '' : 'none';
  }

  /* ---------- validación y análisis ---------- */
  function leerExtra(v) {
    v.vars = vars.slice();
    v.arquetipos = arquetipos.map(a => ({ nombre: a.nombre, vector: vars.map(n => a.valores[n]) }));
    const e = [];
    const k = arquetipos.length;
    if (!tabla) e.push('Suban el archivo de sus clientes o pulsen «Usar datos de ejemplo».');
    else if (tabla.errores.length) e.push('Corrijan el archivo y vuelvan a subirlo (vean «¿Cómo ordenar mis datos?» al final de la página).');
    if (e.length) return e;
    if (vars.length < DP.LIMITES.minVars) e.push('Marquen al menos ' + DP.LIMITES.minVars + ' variables en «2. Variables».');
    if (vars.length > DP.LIMITES.maxVars) e.push('Marquen como máximo ' + DP.LIMITES.maxVars + ' variables.');
    if (k < K_MIN || k > K_MAX) e.push('Definan entre ' + K_MIN + ' y ' + K_MAX + ' arquetipos.');
    v.arquetipos.forEach(function (a, i) {
      if (!a.nombre.trim()) e.push('El arquetipo ' + (i + 1) + ' no tiene nombre.');
      const faltan = vars.filter((n, j) => !Number.isFinite(a.vector[j]));
      if (faltan.length) e.push('Al arquetipo «' + (a.nombre || i + 1) + '» le falta el valor de ' + faltan.join(', ') + '.');
    });
    const nombres = v.arquetipos.map(a => a.nombre.trim().toLowerCase());
    if (new Set(nombres).size < nombres.length) e.push('Hay arquetipos con el mismo nombre; usen nombres distintos.');
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      if (v.arquetipos[i].vector.every((x, t) => x === v.arquetipos[j].vector[t])) e.push('Los arquetipos «' + v.arquetipos[i].nombre + '» y «' + v.arquetipos[j].nombre + '» tienen los mismos valores.');
    }
    if (e.length) return e;
    matriz = DP.construirMatriz(tabla, vars, k);
    return matriz.errores;
  }

  function ejecutar(v) {
    const arq = v.arquetipos, k = arq.length, M = matriz, vs = v.vars;
    const R = Cap02.analizarConArquetipos(M.datos, arq.map(a => a.vector));
    const n = M.datos.length;
    const nom = arq.map(a => a.nombre.trim());
    const sil = Numerico.silhouette(R.X, R.ajustado.etiqueta);
    const comp = Cap02.compararRigidoDifuso(R.ajustado.etiqueta, R.ajustado.U);
    const niv = Cap02.nivelSilueta(R.ajustado.silProm);
    const cambioMedio = Numerico.media(R.desplazamiento);
    const L = [];
    L.push(S('=== Resultados: %d segmentos, %d clientes ===', k, n));
    L.push('Datos: ' + origen + (hoja ? ' (hoja «' + hoja + '»)' : ''));
    L.push('Variables: ' + vs.join(', '));
    L.push('Arquetipos de partida: ' + nom.join(', '));
    if (M.descartadas.length) L.push(S('Filas descartadas por datos faltantes o no numéricos: %d', M.descartadas.length));
    L.push('');
    L.push('RÍGIDA (k-means) — cada cliente en UN solo segmento');
    L.push(S('  Silueta promedio = %.3f  → estructura %s', R.ajustado.silProm, niv.nivel));
    L.push('  Clientes por segmento: ' + nom.map((x, s) => x + '=' + R.ajustado.tam[s]).join(', '));
    L.push('');
    L.push('DIFUSA (fuzzy c-means) — cada cliente con un % de pertenencia a cada segmento');
    L.push(S('  %.1f%% de los clientes tiene pertenencia ambigua (ningún segmento llega a 60%%)', 100 * comp.ambiguos / n));
    L.push('');
    L.push('RÍGIDA contra DIFUSA');
    L.push(S('  Coinciden en el segmento principal de %.1f%% de los clientes.', comp.pctCoinciden));
    L.push(S('  %d clientes que el rígido asigna a un solo segmento son, en realidad, una mezcla.', comp.ambiguos));
    L.push('');
    L.push('ARQUETIPOS: cuánto los corrigieron los datos (desv. estándar)');
    L.push('  ' + nom.map((x, s) => x + '=' + R.desplazamiento[s].toFixed(2) + ' (' + veredictoCambio(R.desplazamiento[s]).t + ')').join(', '));

    const avisos = M.avisos.slice();
    R.ajustado.tam.forEach((t, s) => { if (t === 0) avisos.push('El segmento «' + nom[s] + '» quedó vacío: otro arquetipo describe mejor a esos clientes. Consideren quitarlo o cambiar sus valores.'); });
    arq.forEach(function (a) {
      const fuera = a.vector.map((x, j) => (x < R.mu[j] - 3 * R.sd[j] || x > R.mu[j] + 3 * R.sd[j]) ? vs[j] : null).filter(Boolean);
      if (fuera.length) avisos.push('El arquetipo «' + a.nombre + '» está muy lejos de sus datos en ' + fuera.join(' y ') + ' (más de 3 desviaciones estándar del promedio).');
    });
    ultimo = { R, M, nom, k, n, arq, sil, comp, vars: vs };
    return {
      consola: L.join('\n'), avisos, R, M, nom, k, n, arq, sil, comp, vars: vs,
      metricas: {
        origen, variables: vs.join(', '), arquetipos: nom.join(', '), n, k,
        silAj: R.ajustado.silProm, nivel: niv.nivel, ambAj: 100 * comp.ambiguos / n,
        coinciden: comp.pctCoinciden, cambioMedio
      }
    };
  }

  function veredictoCambio(d) {
    if (d < 0.25) return { t: 'casi igual', c: 'igual' };
    if (d <= 0.75) return { t: 'cambió algo', c: 'algo' };
    return { t: 'cambió mucho', c: 'mucho' };
  }

  /* ---------- figuras ---------- */

  function dibujar(r) {
    const R = r.R, k = r.k, nom = r.nom, VARS = r.vars;
    const jx = Math.max(0, VARS.indexOf(UI.$('#ejeX').value)), jy = Math.max(0, VARS.indexOf(UI.$('#ejeY').value));
    const x = R.X.map(f => f[jx]), y = R.X.map(f => f[jy]);
    const tinta = UI.esOscuro() ? '#fff' : '#000';
    const ejes = {
      xaxis: { title: { text: VARS[jx] + ' (estandarizada)' } },
      yaxis: { title: { text: VARS[jy] + ' (estandarizada)' } },
      legend: { orientation: 'h', y: -0.3 }, margin: { b: 110 }
    };
    const estrellas = (C, abiertas, nombre) => ({ x: C.map(c => c[jx]), y: C.map(c => c[jy]), type: 'scatter', mode: 'markers+text', name: nombre,
      text: nom, textposition: 'top center', textfont: { color: tinta, size: 12 },
      marker: { symbol: abiertas ? 'star-open' : 'star', size: 18, color: abiertas ? tinta : nom.map((_, s) => UI.lineas[s % UI.lineas.length]), line: { color: tinta, width: 1.5 } } });
    const porSegmento = function (etiqueta, estilo) {
      const t = [];
      for (let s = 1; s <= k; s++) {
        const idx = etiqueta.map((e, i) => e === s ? i : -1).filter(i => i >= 0);
        t.push(Object.assign({ x: idx.map(i => x[i]), y: idx.map(i => y[i]), type: 'scatter', mode: 'markers', name: nom[s - 1],
          text: idx.map(i => r.M.ids[i]), hovertemplate: '%{text}<extra>' + UI.esc(nom[s - 1]) + '</extra>' }, estilo(s - 1, idx)));
      }
      return t;
    };

    // Paso 1: datos + arquetipos (sin colores de segmento todavía)
    UI.graficar('figInicio', [
      { x, y, type: 'scatter', mode: 'markers', name: 'clientes', text: r.M.ids, hovertemplate: '%{text}<extra></extra>',
        marker: { color: UI.esOscuro() ? '#888' : '#9A9A9A', size: 6, symbol: 'circle-open', line: { width: 1.2 } } },
      estrellas(R.Cz, false, 'arquetipos propuestos')
    ], Object.assign({ title: S('%d clientes y %d arquetipos propuestos', r.n, k) }, ejes), { archivo: 'paso1_punto_de_partida' });

    // Paso 2: rígido + silueta
    Didactico.medidorSilueta(UI.$('#medidorSilueta'), R.ajustado.silProm);
    const Ckz = R.ajustado.centrosKmeans.map(c => c.map((v, j) => (v - R.mu[j]) / R.sd[j]));
    const t2 = porSegmento(R.ajustado.etiqueta, s => ({ marker: { color: UI.lineas[s % UI.lineas.length], size: 6, symbol: 'circle' } }));
    t2.push({ x: Ckz.map(c => c[jx]), y: Ckz.map(c => c[jy]), type: 'scatter', mode: 'markers', name: 'centros',
      marker: { symbol: 'x-thin', size: 14, line: { width: 3, color: tinta } } });
    UI.graficar('figRigido', t2, Object.assign({ title: S('Rígido: k-means (silueta = %.2f)', R.ajustado.silProm) }, ejes), { archivo: 'paso2_rigido' });
    Didactico.graficaSilueta('figSilueta', r.sil, R.ajustado.etiqueta, nom, 'paso2_silueta');

    // Paso 3: difuso
    UI.graficar('figDifuso', [{
      x, y, type: 'scatter', mode: 'markers', text: r.M.ids,
      marker: { size: r.comp.umax.map(u => Math.sqrt(60 * (1 - u) + 15) * 1.6), color: r.comp.umax, colorscale: 'Viridis',
        cmin: 1 / k, cmax: 1, colorbar: { title: { text: '% de su<br>segmento<br>principal', side: 'right' }, thickness: 14, tickformat: '.0%' } },
      hovertemplate: '%{text}<br>pertenencia máxima = %{marker.color:.0%}<extra></extra>'
    }], Object.assign({ title: S('Difuso: fuzzy c-means (%.0f%% ambiguos)', 100 * r.comp.ambiguos / r.n), showlegend: false }, ejes),
    { archivo: 'paso3_difuso' });
    Didactico.graficaEjemplos('figEjemplos', R.ajustado.U, R.ajustado.etiqueta, r.M.ids, nom, r.comp, 'paso3_ejemplos');

    // Paso 4: rígido contra difuso
    UI.$('#kpisComparacion').innerHTML =
      '<div class="kpi"><div class="v">' + R.ajustado.silProm.toFixed(2) + '</div><div class="t">Silueta del rígido (' + Cap02.nivelSilueta(R.ajustado.silProm).nivel + ')</div></div>' +
      '<div class="kpi"><div class="v">' + r.comp.pctCoinciden.toFixed(1) + '%</div><div class="t">Clientes en el mismo segmento principal con ambos métodos</div></div>' +
      '<div class="kpi"><div class="v">' + r.comp.ambiguos + '</div><div class="t">Clientes ambiguos (' + (100 * r.comp.ambiguos / r.n).toFixed(1) + '%) que el rígido asigna sin avisar</div></div>';
    UI.$('#conclusionComparacion').innerHTML = '<p><b>¿Qué dicen sus datos?</b></p>' + Didactico.conclusion(r.comp, R.ajustado.silProm, nom);
    Didactico.graficaSegurosAmbiguos('figSeguros', r.comp, nom, 'paso4_seguros_ambiguos');
    const t4 = porSegmento(R.ajustado.etiqueta, (s, idx) => ({
      marker: { color: idx.map(i => r.comp.umax[i] < 0.6 ? 'rgba(0,0,0,0)' : UI.lineas[s % UI.lineas.length]), size: idx.map(i => r.comp.umax[i] < 0.6 ? 9 : 6),
        line: { color: idx.map(i => r.comp.umax[i] < 0.6 ? UI.color.dorado : UI.lineas[s % UI.lineas.length]), width: idx.map(i => r.comp.umax[i] < 0.6 ? 2.5 : 1) } }
    }));
    UI.graficar('figLadoALado', t4, Object.assign({ title: 'Segmento rígido de cada cliente, marcando los ambiguos' }, ejes), { archivo: 'paso4_ambiguos' });

    // Paso 5: arquetipos propuestos contra ajustados
    dibujarTablaArquetipos(r);
    const cats = VARS.concat([VARS[0]]);
    const t5 = [];
    if (VARS.length < 3) {
      // con 2 variables el radar no forma figura: barras propuesto/real por variable
      nom.forEach(function (n, s) {
        const col = UI.lineas[s % UI.lineas.length];
        t5.push({ x: VARS.map(v => n + '<br>' + v), y: R.perfilesDefinidos[s], type: 'bar', name: n + ' (propuesto)', marker: { color: col, opacity: 0.4 } });
        t5.push({ x: VARS.map(v => n + '<br>' + v), y: R.perfilesAjustados[s], type: 'bar', name: n + ' (en sus datos)', marker: { color: col } });
      });
      UI.graficar('figRadar', t5, { title: 'Perfil propuesto (claro) contra perfil real (oscuro)', barmode: 'group',
        yaxis: { title: { text: 'Escala 0–1 (mín.–máx. de sus datos)' }, range: [0, 1.05] }, legend: { orientation: 'h', y: -0.3, font: { size: 10 } },
        margin: { b: 110 } }, { archivo: 'paso5_perfiles' });
    } else nom.forEach(function (n, s) {
      const col = UI.lineas[s % UI.lineas.length];
      const pd = R.perfilesDefinidos[s], pa = R.perfilesAjustados[s];
      t5.push({ type: 'scatterpolar', r: pd.concat([pd[0]]), theta: cats, mode: 'lines', name: n + ' (propuesto)', legendgroup: 'a' + s,
        line: { color: col, width: 2, dash: 'dot' }, hovertemplate: '%{theta}: %{r:.2f}<extra>' + UI.esc(n) + ' propuesto</extra>' });
      t5.push({ type: 'scatterpolar', r: pa.concat([pa[0]]), theta: cats, mode: 'lines+markers', name: n + ' (en sus datos)', legendgroup: 'a' + s,
        line: { color: col, width: 2.5 }, marker: { size: 6 }, hovertemplate: '%{theta}: %{r:.2f}<extra>' + UI.esc(n) + ' en sus datos</extra>' });
    });
    if (VARS.length >= 3) UI.graficar('figRadar', t5, { title: 'Perfil propuesto (···) contra perfil real (—)', polar: { radialaxis: { range: [0, 1.05] } },
      legend: { orientation: 'h', y: -0.12, font: { size: 10 } }, margin: { l: 110, r: 110, b: 90 } }, { archivo: 'paso5_radar' });
    const flechas = R.Cz.map((c, s) => ({ x: Ckz[s][jx], y: Ckz[s][jy], ax: c[jx], ay: c[jy], xref: 'x', yref: 'y', axref: 'x', ayref: 'y',
      showarrow: true, arrowhead: 3, arrowsize: 1.2, arrowwidth: 2.5, arrowcolor: UI.lineas[s % UI.lineas.length], text: '' }));
    const t6 = porSegmento(R.ajustado.etiqueta, s => ({ marker: { color: UI.lineas[s % UI.lineas.length], size: 5, opacity: 0.35 }, hoverinfo: 'skip' }));
    t6.push(estrellas(R.Cz, true, 'propuestos'));
    t6.push({ x: Ckz.map(c => c[jx]), y: Ckz.map(c => c[jy]), type: 'scatter', mode: 'markers', name: 'ajustados',
      marker: { symbol: 'x-thin', size: 14, line: { width: 3, color: tinta } } });
    UI.graficar('figMovimiento', t6, Object.assign({ title: 'Cómo corrigieron los datos a sus arquetipos', annotations: flechas }, ejes),
      { archivo: 'paso5_movimiento' });
  }

  function dibujarTablaArquetipos(r) {
    const R = r.R, VARS = r.vars;
    let h = '<table class="tabla"><thead><tr><th>Arquetipo</th><th>Clientes</th>' +
      VARS.map(n => '<th>' + UI.esc(n) + '<br><span style="text-transform:none">propuesto → real</span></th>').join('') +
      '<th>Cambio</th><th>Veredicto</th></tr></thead><tbody>';
    r.nom.forEach(function (n, s) {
      const v = veredictoCambio(R.desplazamiento[s]);
      h += '<tr><td><span class="chip-color" style="background:' + UI.lineas[s % UI.lineas.length] + '"></span>' + UI.esc(n) + '</td><td>' +
        R.ajustado.tam[s] + '</td>' +
        r.arq[s].vector.map((x, j) => '<td>' + fmt(x) + ' → <b>' + fmt(R.ajustado.centrosFCM[s][j]) + '</b></td>').join('') +
        '<td>' + R.desplazamiento[s].toFixed(2) + '</td><td class="izq"><span class="veredicto-arq ' + v.c + '">' + v.t + '</span></td></tr>';
    });
    h += '<tr><td><i>Promedio de sus clientes</i></td><td>' + r.n + '</td>' + R.mu.map(x => '<td><i>' + fmt(x) + '</i></td>').join('') + '<td></td><td></td></tr>';
    h += '</tbody></table>';
    UI.$('#tablaPerfiles').innerHTML = h;
  }

  /* ---------- descargas ---------- */
  function descargarResultados() {
    if (!ultimo) { alert('Primero carguen datos y definan sus arquetipos.'); return; }
    const { R, M, nom, k, n, sil, comp } = ultimo, VARS = ultimo.vars;
    const idNombre = tabla.idCol || 'Fila';
    const nombreDifuso = s => { const c = comp.mapa.indexOf(s); return nom[c >= 0 ? c : s]; };
    const filas = M.datos.map(function (d, i) {
      const f = {};
      f[idNombre] = M.ids[i];
      VARS.forEach((nm, j) => { f[nm] = d[j]; });
      f.Segmento_rigido = nom[R.ajustado.etiqueta[i] - 1];
      f.Silueta = +sil[i].toFixed(4);
      for (let s = 0; s < k; s++) f['Pertenencia_' + nombreDifuso(s)] = +R.ajustado.U[s][i].toFixed(4);
      f.Segmento_difuso_principal = nombreDifuso(comp.principal[i]);
      f.Pertenencia_maxima = +comp.umax[i].toFixed(4);
      f.Ambiguo = comp.umax[i] < 0.6 ? 'Sí' : 'No';
      f.Arquetipo_propuesto_mas_cercano = nom[R.fijo.etiqueta[i] - 1];
      return f;
    });
    const arquetiposHoja = nom.map(function (a, s) {
      const f = { Arquetipo: a, Clientes_rigido: R.ajustado.tam[s] };
      VARS.forEach((nm, j) => { f[nm + '_propuesto'] = ultimo.arq[s].vector[j]; f[nm + '_real'] = +R.ajustado.centrosFCM[s][j].toFixed(4); });
      f.Cambio_desv_est = +R.desplazamiento[s].toFixed(4);
      f.Veredicto = veredictoCambio(R.desplazamiento[s]).t;
      return f;
    });
    const resumen = [
      ['Instituto Politécnico Nacional - Dr. Aboud Barsekh Onji'],
      ['Segmentación rígida contra difusa con datos propios (Cap. 2)'],
      [],
      ['Datos', origen + (hoja ? ' (hoja ' + hoja + ')' : '')],
      ['Fecha del análisis', new Date().toLocaleString('es-MX')],
      ['Clientes analizados', n],
      ['Filas descartadas', M.descartadas.length],
      ['Variables', VARS.join(', ')],
      ['Segmentos (arquetipos)', k + ': ' + nom.join(', ')],
      [],
      ['Silueta promedio (rígido, k-means)', +R.ajustado.silProm.toFixed(4), 'estructura ' + Cap02.nivelSilueta(R.ajustado.silProm).nivel + ' (Kaufman y Rousseeuw, 1990)'],
      ['% clientes ambiguos (difuso, pertenencia máxima < 60 %)', +(100 * comp.ambiguos / n).toFixed(2)],
      ['% clientes en el mismo segmento con ambos métodos', +comp.pctCoinciden.toFixed(2)],
      [],
      ['Método', 'Variables estandarizadas (z-score). k-means y fuzzy c-means (m = 2, 100 iteraciones, tolerancia 1e-5) que parten de los arquetipos propuestos.']
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), 'Resultados');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arquetiposHoja), 'Arquetipos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');
    if (M.descartadas.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(M.descartadas.map(d => ({ Fila_Excel: d.fila, Motivo: d.motivo }))), 'Filas_descartadas');
    XLSX.writeFile(wb, 'segmentacion_rigida_vs_difusa_resultados.xlsx');
  }

  function descargarEjemplo() {
    const E = window.EJEMPLO_CAP02;
    const wb = XLSX.utils.book_new();
    const wsD = XLSX.utils.aoa_to_sheet([E.encabezados].concat(E.filas));
    wsD['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 21 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsD, 'Datos');
    XLSX.writeFile(wb, 'cap02_datos_ejemplo.xlsx');
  }

  /* ---------- comparación de corridas ---------- */
  const columnas = [
    { id: 'origen', titulo: 'Datos', izq: true }, { id: 'variables', titulo: 'Variables', izq: true }, { id: 'arquetipos', titulo: 'Arquetipos', izq: true },
    { id: 'n', titulo: 'Clientes', dec: 0 }, { id: 'k', titulo: 'k', dec: 0 },
    { id: 'silAj', titulo: 'Silueta (rígido)', dec: 3 }, { id: 'nivel', titulo: 'Estructura' },
    { id: 'ambAj', titulo: '% ambiguos (difuso)', dec: 1 },
    { id: 'coinciden', titulo: '% coinciden rígido/difuso', dec: 1 },
    { id: 'cambioMedio', titulo: 'Cambio medio de arquetipos', dec: 2 }
  ];
  function dibujarComparacion(lista) {
    const nombres = lista.map(c => c.etiqueta), colores = lista.map((_, i) => UI.colorCaso(i));
    const zonas = [[-1, 0.25, 'rgba(201,194,197,0.35)'], [0.25, 0.5, 'rgba(227,178,107,0.30)'], [0.5, 0.7, 'rgba(156,197,154,0.30)'], [0.7, 1, 'rgba(78,159,98,0.30)']];
    UI.graficar('comp1', [{ x: nombres, y: lista.map(c => c.valores.silAj), type: 'bar', marker: { color: colores },
      text: lista.map(c => c.valores.silAj.toFixed(2) + ' (' + c.valores.nivel + ')'), textposition: 'outside', cliponaxis: false }],
    { title: 'Silueta del rígido por caso', yaxis: { title: { text: 'Silueta promedio' }, range: [0, 1] }, showlegend: false,
      shapes: zonas.map(z => ({ type: 'rect', xref: 'paper', x0: 0, x1: 1, y0: Math.max(0, z[0]), y1: z[1], fillcolor: z[2], line: { width: 0 }, layer: 'below' })) },
    { archivo: 'comparacion_silueta' });
    UI.graficar('comp2', [{ x: nombres, y: lista.map(c => c.valores.ambAj), type: 'bar', marker: { color: colores },
      text: lista.map(c => c.valores.ambAj.toFixed(1) + ' %'), textposition: 'outside', cliponaxis: false }],
    { title: '% de clientes ambiguos (difuso) por caso', yaxis: { title: { text: '% de clientes' }, rangemode: 'tozero' }, showlegend: false },
    { archivo: 'comparacion_ambiguos' });
  }

  UI.iniciarApp({
    clave: 'cap02_datos_variables_libres', specs: [], defecto: { arquetipos: ARQ_LIBRO_VACIOS }, presets: [], columnas,
    ejecutar, dibujar, leerExtra, dibujarComparacion,
    fijarExtra: function (v) { arquetipos = copiaArq(v.arquetipos); completarArquetipos(); dibujarArquetipos(); },
    caso: r => ({ valores: r.metricas }),
    alIniciar: function (diferido) {
      recalcular = diferido;
      const zona = UI.$('#zonaArchivo'), campos = UI.$('#campos');
      campos.parentNode.insertBefore(zona, campos);
      // «Conceptos clave» va hasta arriba de la columna de resultados
      const col = document.querySelector('.columna');
      col.insertBefore(UI.$('#panelConceptos'), col.firstChild);
      UI.$('#btnRestablecer').textContent = 'Arquetipos del libro';
      UI.$('#btnRestablecer').style.display = 'none'; // ya hay un botón igual junto a la tabla
      ['#ejeX', '#ejeY'].forEach(id => UI.$(id).addEventListener('change', diferido));
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
        // nuevo arquetipo propuesto en el promedio de los datos de cada variable
        const base = {};
        vars.forEach(n => { const x = DP.valoresColumna(tabla, n); base[n] = x.length ? +Numerico.media(x).toPrecision(3) : NaN; });
        arquetipos.push({ nombre: 'Arquetipo ' + (arquetipos.length + 1), valores: base });
        dibujarArquetipos(); recalcular();
      });
      UI.$('#btnArquetiposLibro').addEventListener('click', function () {
        arquetipos = copiaArq(ARQ_LIBRO_VACIOS); completarArquetipos(); dibujarArquetipos(); recalcular();
      });
      UI.$('#btnProponer').addEventListener('click', function () {
        proponerDesdeDatos(false); dibujarArquetipos(); recalcular();
      });
      dibujarArquetipos();
      cargarEjemplo(); // arranca mostrando el ejemplo, claramente rotulado
    }
  });
})();
