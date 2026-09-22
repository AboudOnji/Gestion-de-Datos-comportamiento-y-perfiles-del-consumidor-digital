/* interfaz.js — utilidades de interfaz compartidas por las apps del libro:
   tema claro/oscuro, gráficas Plotly con los colores del tema, registro de
   corridas guardadas ("casos") para comparar, y exportación a CSV. */
(function (raiz) {
  'use strict';
  const UI = {};

  // Colores de las figuras MATLAB del libro (mismos RGB que los scripts .m)
  UI.color = {
    guinda: '#6B1F3B',   // [0.42 0.12 0.23]
    teal: '#297D82',     // [0.16 0.49 0.51]
    dorado: '#B89659',   // [0.72 0.59 0.35]
    gris: '#B8B8B8'      // [0.72 0.72 0.72]
  };
  // colormap lines() de MATLAB
  UI.lineas = ['#0072BD', '#D95319', '#EDB120', '#7E2F8E', '#77AC30', '#4DBEEE', '#A2142F'];
  UI.colorCaso = i => UI.lineas[i % UI.lineas.length];

  const guardar = function (clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento */ }
  };
  const leer = function (clave, defecto) {
    try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : defecto; } catch (e) { return defecto; }
  };
  UI.guardar = guardar;
  UI.leer = leer;

  UI.$ = sel => document.querySelector(sel);
  UI.esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  UI.retrasar = function (fn, ms) {
    let t = null;
    return function () { clearTimeout(t); t = setTimeout(fn, ms || 250); };
  };

  /* ---------- tema ---------- */
  UI.iniciarTema = function (boton) {
    const aplicar = function (t) {
      if (t) document.documentElement.setAttribute('data-theme', t);
      else document.documentElement.removeAttribute('data-theme');
      UI.redibujarTodo();
    };
    aplicar(leer('tema-libro-consumidor', null));
    if (boton) boton.addEventListener('click', function () {
      const oscuro = UI.esOscuro();
      const nuevo = oscuro ? 'light' : 'dark';
      guardar('tema-libro-consumidor', nuevo);
      aplicar(nuevo);
    });
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => UI.redibujarTodo());
    }
  };
  UI.esOscuro = function () {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  };

  /* ---------- gráficas ---------- */
  const registro = new Map();
  UI.graficar = function (id, trazas, layout, opciones) {
    registro.set(id, { trazas, layout, opciones: opciones || {} });
    UI.dibujar(id);
  };
  UI.dibujar = function (id) {
    const r = registro.get(id);
    const el = document.getElementById(id);
    if (!r || !el || typeof Plotly === 'undefined') return;
    const css = getComputedStyle(document.documentElement);
    const texto = css.getPropertyValue('--texto').trim() || '#222';
    const rejilla = UI.esOscuro() ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
    const base = {
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', size: 12, color: texto },
      margin: { l: 60, r: 20, t: 72, b: 52 },
      legend: { bgcolor: 'rgba(0,0,0,0)' },
      hovermode: 'closest'
    };
    const lay = Object.assign({}, base, r.layout);
    Object.keys(lay).forEach(function (k) {
      if (/^[xy]axis\d*$/.test(k)) {
        lay[k] = Object.assign({ gridcolor: rejilla, zerolinecolor: rejilla, linecolor: rejilla, showgrid: true, automargin: true }, lay[k]);
      }
    });
    if (lay.polar) {
      lay.polar = JSON.parse(JSON.stringify(lay.polar));
      lay.polar.bgcolor = 'rgba(0,0,0,0)';
      lay.polar.radialaxis = Object.assign({ gridcolor: rejilla, linecolor: rejilla }, lay.polar.radialaxis);
      lay.polar.angularaxis = Object.assign({ gridcolor: rejilla, linecolor: rejilla }, lay.polar.angularaxis);
    }
    // título bajo la barra de herramientas de Plotly (que ocupa la franja superior)
    if (lay.title && typeof lay.title === 'string') lay.title = { text: lay.title, font: { size: 14 }, y: 1, yref: 'container', yanchor: 'top', pad: { t: 34 } };
    const config = {
      responsive: true, displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
      toImageButtonOptions: { format: 'png', filename: r.opciones.archivo || id, scale: 3 }
    };
    Plotly.react(el, r.trazas, lay, config);
  };
  UI.redibujarTodo = function () { registro.forEach((_, id) => UI.dibujar(id)); };

  /* ---------- descargas ---------- */
  UI.descargar = function (nombre, contenido, tipo) {
    const blob = new Blob([contenido], { type: tipo || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  UI.aCSV = function (filas) {
    const celda = v => {
      const t = v === null || v === undefined ? '' : String(v);
      return /[",\n;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    };
    // BOM para que Excel abra bien los acentos
    return '﻿' + filas.map(f => f.map(celda).join(',')).join('\n');
  };

  /* ---------- campos de parámetros ---------- */
  // spec: {id, ayuda, tipo: 'numero'|'entero'|'select'|'fecha', min, max,
  //        deslizMin, deslizMax, paso, opciones, minExclusivo}
  // min/max = rango válido (glosario del libro); deslizMin/deslizMax = rango
  // didáctico del deslizador (en la casilla numérica se puede salir de él).
  UI.crearCampos = function (contenedor, specs, alCambiar) {
    let h = '';
    specs.forEach(function (s) {
      h += '<label class="campo"><span class="nombre">' + UI.esc(s.id) + '</span>';
      if (s.ayuda) h += '<span class="ayuda">' + s.ayuda + '</span>';
      h += '<div class="entrada-fila">';
      if (s.tipo === 'select') {
        h += '<select id="p_' + s.id + '">' + s.opciones.map(o => '<option value="' + o + '">' + o + '</option>').join('') + '</select>';
      } else if (s.tipo === 'fecha') {
        h += '<input type="date" id="p_' + s.id + '">';
      } else {
        const dmin = s.deslizMin !== undefined ? s.deslizMin : s.min;
        const dmax = s.deslizMax !== undefined ? s.deslizMax : s.max;
        h += '<input type="range" id="r_' + s.id + '" min="' + dmin + '" max="' + dmax + '" step="' + s.paso + '" aria-label="' + UI.esc(s.id) + '">';
        h += '<input type="number" id="p_' + s.id + '" step="' + s.paso + '"' +
          (s.min !== undefined ? ' min="' + s.min + '"' : '') + (s.max !== undefined ? ' max="' + s.max + '"' : '') + '>';
      }
      h += '</div></label>';
    });
    contenedor.innerHTML = h;
    specs.forEach(function (s) {
      const num = document.getElementById('p_' + s.id);
      const rango = document.getElementById('r_' + s.id);
      if (rango) {
        rango.addEventListener('input', function () { num.value = rango.value; alCambiar(); });
        num.addEventListener('input', function () { rango.value = num.value; alCambiar(); });
      } else {
        num.addEventListener('change', alCambiar);
      }
    });
  };
  UI.fijarCampos = function (specs, valores) {
    specs.forEach(function (s) {
      const v = valores[s.id];
      const num = document.getElementById('p_' + s.id);
      num.value = v;
      const rango = document.getElementById('r_' + s.id);
      if (rango) rango.value = v;
    });
  };
  // Devuelve {valores, errores}
  UI.leerCampos = function (specs) {
    const valores = {}, errores = [];
    specs.forEach(function (s) {
      const el = document.getElementById('p_' + s.id);
      if (s.tipo === 'select') { valores[s.id] = isNaN(+el.value) ? el.value : +el.value; return; }
      if (s.tipo === 'fecha') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(el.value)) errores.push(s.id + ': fecha no válida.');
        valores[s.id] = el.value; return;
      }
      const v = el.value === '' ? NaN : Number(el.value);
      valores[s.id] = v;
      if (!Number.isFinite(v)) { errores.push(s.id + ': escriban un número.'); return; }
      if (s.tipo === 'entero' && !Number.isInteger(v)) errores.push(s.id + ' debe ser un número entero.');
      if (s.min !== undefined && (s.minExclusivo ? v <= s.min : v < s.min)) errores.push(s.id + ' debe ser ' + (s.minExclusivo ? 'mayor que ' : 'mayor o igual que ') + s.min + '.');
      if (s.max !== undefined && (s.maxExclusivo ? v >= s.max : v > s.max)) errores.push(s.id + ' debe ser ' + (s.maxExclusivo ? 'menor que ' : 'menor o igual que ') + s.max + '.');
    });
    return { valores, errores };
  };
  UI.mostrarAvisos = function (contenedor, errores, avisos) {
    let h = '';
    (errores || []).forEach(e => { h += '<div class="aviso">⚠ ' + UI.esc(e) + '</div>'; });
    (avisos || []).forEach(a => { h += '<div class="aviso">ℹ ' + UI.esc(a) + '</div>'; });
    contenedor.innerHTML = h;
  };

  // Botones de "Cargar Caso X" (parámetros del ejercicio propuesto del libro)
  UI.crearPresets = function (contenedor, presets, alElegir) {
    if (!presets || !presets.length) return;
    let h = '<h3>Casos del ejercicio propuesto</h3><div class="botones" style="margin-top:4px">';
    presets.forEach((p, i) => { h += '<button class="btn sec peq" data-preset="' + i + '" title="' + UI.esc(p.descripcion || '') + '">' + UI.esc(p.nombre) + '</button>'; });
    h += '</div><p class="nota" style="margin-top:6px">Cargan los valores que pide el libro; luego pulsen <b>Guardar corrida como caso</b>.</p>';
    contenedor.innerHTML = h;
    contenedor.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => alElegir(presets[+b.dataset.preset])));
  };

  /* ---------- casos guardados para comparar ---------- */
  // columnas: [{id, titulo, dec}]  (dec = decimales; omitido = texto)
  UI.Casos = function (opc) {
    this.clave = 'casos-' + opc.clave;
    this.columnas = opc.columnas;
    this.tabla = opc.tabla;
    this.alCambiar = opc.alCambiar || function () {};
    this.lista = leer(this.clave, []);
  };
  UI.Casos.prototype.siguienteEtiqueta = function () {
    return 'Caso ' + String.fromCharCode(65 + (this.lista.length % 26));
  };
  UI.Casos.prototype.agregar = function (etiqueta, valores, extra) {
    this.lista.push({ etiqueta: etiqueta || this.siguienteEtiqueta(), valores, extra: extra || null });
    this.persistir();
  };
  UI.Casos.prototype.eliminar = function (i) { this.lista.splice(i, 1); this.persistir(); };
  UI.Casos.prototype.limpiar = function () { this.lista = []; this.persistir(); };
  UI.Casos.prototype.persistir = function () {
    guardar(this.clave, this.lista);
    this.render();
    this.alCambiar(this.lista);
  };
  UI.Casos.prototype.formato = function (col, v) {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'number') return Number.isNaN(v) ? 'NaN' : (col.dec === undefined ? String(v) : v.toFixed(col.dec));
    return String(v);
  };
  UI.Casos.prototype.render = function () {
    const self = this;
    if (!this.tabla) return;
    if (!this.lista.length) {
      this.tabla.innerHTML = '<div class="vacio">Aún no hay corridas guardadas. Ajusten los parámetros, ' +
        'pulsen <b>Guardar corrida como caso</b> y repitan para cada caso del ejercicio.</div>';
      return;
    }
    let h = '<div class="tabla-scroll"><table class="tabla"><thead><tr><th>Caso</th>';
    this.columnas.forEach(c => { h += '<th>' + UI.esc(c.titulo) + '</th>'; });
    h += '<th class="no-imprimir"></th></tr></thead><tbody>';
    this.lista.forEach(function (caso, i) {
      h += '<tr><td><span class="chip-color" style="background:' + UI.colorCaso(i) + '"></span>' + UI.esc(caso.etiqueta) + '</td>';
      self.columnas.forEach(c => { h += '<td' + (c.izq ? ' class="izq"' : '') + '>' + UI.esc(self.formato(c, caso.valores[c.id])) + '</td>'; });
      h += '<td class="no-imprimir"><button class="btn sec peq" data-borrar="' + i + '" title="Eliminar este caso">✕</button></td></tr>';
    });
    h += '</tbody></table></div>';
    this.tabla.innerHTML = h;
    this.tabla.querySelectorAll('[data-borrar]').forEach(b => b.addEventListener('click', () => self.eliminar(+b.dataset.borrar)));
  };
  UI.Casos.prototype.csv = function () {
    const filas = [['Caso'].concat(this.columnas.map(c => c.titulo))];
    this.lista.forEach(caso => filas.push([caso.etiqueta].concat(this.columnas.map(c => this.formato(c, caso.valores[c.id])))));
    return UI.aCSV(filas);
  };

  // Conecta los botones estándar del panel de comparación.
  UI.conectarCasos = function (casos, obtenerActual, nombreCSV) {
    const inEtiqueta = UI.$('#etiquetaCaso');
    const refrescarEtiqueta = () => { if (inEtiqueta) inEtiqueta.placeholder = casos.siguienteEtiqueta(); };
    UI.$('#btnGuardarCaso').addEventListener('click', function () {
      const actual = obtenerActual();
      if (!actual) return;
      casos.agregar(inEtiqueta && inEtiqueta.value.trim(), actual.valores, actual.extra);
      if (inEtiqueta) inEtiqueta.value = '';
      refrescarEtiqueta();
    });
    UI.$('#btnLimpiarCasos').addEventListener('click', function () {
      if (casos.lista.length && confirm('¿Borrar todas las corridas guardadas?')) { casos.limpiar(); refrescarEtiqueta(); }
    });
    UI.$('#btnCSVCasos').addEventListener('click', function () {
      if (!casos.lista.length) { alert('No hay corridas guardadas todavía.'); return; }
      UI.descargar(nombreCSV, casos.csv(), 'text/csv;charset=utf-8');
    });
    const imp = UI.$('#btnImprimir');
    if (imp) imp.addEventListener('click', () => window.print());
    casos.render();
    casos.alCambiar(casos.lista);
    refrescarEtiqueta();
  };

  /* ---------- arranque común de cada app ---------- */
  // cfg: {clave, specs, defecto, presets, columnas,
  //       ejecutar(valores) -> resultado del modelo,
  //       dibujar(resultado, valores), caso(resultado) -> {valores, extra},
  //       dibujarComparacion(lista), leerExtra(valores) -> errores[],
  //       fijarExtra(valores), alIniciar(recalcular)}
  UI.iniciarApp = function (cfg) {
    UI.iniciarTema(UI.$('#btnTema'));
    let ultimo = null;
    const correr = function () {
      const leido = UI.leerCampos(cfg.specs);
      const errores = leido.errores.concat(cfg.leerExtra ? cfg.leerExtra(leido.valores) : []);
      UI.mostrarAvisos(UI.$('#erroresParam'), errores, []);
      if (errores.length) return;
      try {
        ultimo = cfg.ejecutar(leido.valores);
      } catch (e) {
        UI.mostrarAvisos(UI.$('#erroresParam'), ['No se pudo calcular con estos parámetros: ' + e.message], []);
        return;
      }
      UI.$('#consola').textContent = ultimo.consola;
      UI.mostrarAvisos(UI.$('#avisos'), [], ultimo.avisos);
      cfg.dibujar(ultimo, leido.valores);
    };
    const diferido = UI.retrasar(correr, 200);
    UI.crearCampos(UI.$('#campos'), cfg.specs, diferido);
    const fijar = function (v) {
      UI.fijarCampos(cfg.specs, v);
      if (cfg.fijarExtra) cfg.fijarExtra(v);
      correr();
    };
    UI.$('#btnEjecutar').addEventListener('click', correr);
    UI.$('#btnRestablecer').addEventListener('click', () => fijar(cfg.defecto));
    UI.crearPresets(UI.$('#presets'), cfg.presets, function (p) {
      fijar(Object.assign({}, cfg.defecto, p.valores));
      const e = UI.$('#etiquetaCaso');
      if (e) e.value = p.nombre;
    });
    const casos = new UI.Casos({
      clave: cfg.clave, columnas: cfg.columnas, tabla: UI.$('#tablaCasos'),
      // las gráficas de comparación solo se muestran cuando hay casos guardados
      alCambiar: function (lista) {
        const cont = document.querySelector('#panelComparar .figuras');
        if (cont) cont.style.display = lista.length ? '' : 'none';
        if (lista.length && cfg.dibujarComparacion) cfg.dibujarComparacion(lista);
      }
    });
    UI.conectarCasos(casos, () => ultimo ? cfg.caso(ultimo) : null, cfg.clave + '_casos.csv');
    if (cfg.alIniciar) cfg.alIniciar(diferido);
    fijar(cfg.defecto);
    return { correr, diferido };
  };

  raiz.UI = UI;
})(this);
