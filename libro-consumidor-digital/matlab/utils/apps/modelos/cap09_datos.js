/* modelos/cap09_datos.js — AHP + TOPSIS con datos PROPIOS (Cap. 9): la matriz de decisión
   (alternativas × criterios) viene del Excel y los juicios por pares se leen de la hoja «Juicios»
   o se editan en la app. Misma lógica que cap09_seleccion_plataforma.m, generalizada a de 2 a 8
   criterios (índice aleatorio de Saaty según el número de criterios) y con un diagnóstico del
   par de juicios más contradictorio. Con los datos del libro reproduce exactamente cap09.js.
   No depende del navegador: se prueba en Node (pruebas/verificar_cap09_datos.js). */
(function (raiz) {
  'use strict';
  const esNode = typeof module === 'object' && module.exports;
  const N = esNode ? require('../numerico.js') : raiz.Numerico;
  const DP = esNode ? require('./cap02_datos.js') : raiz.DatosPropios;

  const LIMITES = { minAlt: 3, maxAlt: 30, minCrit: 2, maxCrit: 8 };
  const RI = { 1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41 };   // índice aleatorio de Saaty
  const normalizar = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

  function leerDecision(tabla) {
    const errores = tabla.errores.slice(), avisos = [];
    if (errores.length) return { errores, avisos };
    const colNombre = tabla.columnas.find(c => c.tipo === 'texto' || c.tipo === 'id');
    const colsCrit = tabla.columnas.filter(c => c.tipo === 'numerica');
    const nAlt = tabla.filasDatos.length;
    if (colsCrit.length < LIMITES.minCrit) errores.push('Se necesitan al menos ' + LIMITES.minCrit + ' columnas numéricas (los criterios); se encontraron ' + colsCrit.length + '.');
    if (colsCrit.length > LIMITES.maxCrit) errores.push('Hay ' + colsCrit.length + ' criterios; el máximo es ' + LIMITES.maxCrit + ' (con más, las comparaciones por pares se vuelven inmanejables).');
    if (nAlt < LIMITES.minAlt) errores.push('Se necesitan al menos ' + LIMITES.minAlt + ' alternativas; se encontraron ' + nAlt + '.');
    if (nAlt > LIMITES.maxAlt) errores.push('Hay ' + nAlt + ' alternativas; el máximo es ' + LIMITES.maxAlt + '.');
    if (errores.length) return { errores, avisos };
    const X = [], alternativas = [];
    tabla.filasDatos.forEach(function (r, i) {
      alternativas.push(colNombre && r.celdas[colNombre.indice] !== null && r.celdas[colNombre.indice] !== undefined ? String(r.celdas[colNombre.indice]).trim() : 'Alternativa ' + (i + 1));
      const fila = colsCrit.map(c => c.valores[i]);
      fila.forEach((v, j) => { if (v === null || Number.isNaN(v)) errores.push('Falta un número válido en la fila ' + r.filaExcel + ', columna «' + colsCrit[j].nombre + '».'); });
      X.push(fila);
    });
    if (errores.length) return { errores: errores.slice(0, 6), avisos };
    colsCrit.forEach((c, j) => { if (X.every(f => f[j] === 0)) errores.push('La columna «' + c.nombre + '» vale 0 en todas las alternativas: TOPSIS no puede normalizarla.'); });
    if (errores.length) return { errores, avisos };
    colsCrit.forEach(c => { if (c.constante) avisos.push('«' + c.nombre + '» tiene el mismo valor en todas las alternativas: no discrimina entre ellas.'); });
    if (X.some(f => f.some(v => v < 0))) avisos.push('Hay valores negativos: TOPSIS los acepta, pero revisen que no sean errores de captura.');
    return { errores, avisos, alternativas, criterios: colsCrit.map(c => c.nombre), X };
  }

  function leerTipos(tablaCrit, criterios) {
    const esCosto = criterios.map(() => false), avisos = [];
    if (!tablaCrit || tablaCrit.errores.length) return { esCosto, avisos, leido: false };
    const cTipo = tablaCrit.columnas.find(c => /^tipo/.test(normalizar(c.nombre)));
    let n = 0;
    tablaCrit.filasDatos.forEach(function (r) {
      const j = criterios.findIndex(c => normalizar(c) === normalizar(r.celdas[0] === null ? '' : r.celdas[0]));
      if (j < 0) { avisos.push('La hoja «Criterios» menciona «' + r.celdas[0] + '», que no es un criterio de la hoja de alternativas.'); return; }
      n++; if (cTipo) esCosto[j] = /^(costo|cost|menos|min)/.test(normalizar(r.celdas[cTipo.indice] === null ? '' : r.celdas[cTipo.indice]));
    });
    if (n < criterios.length) avisos.push('La hoja «Criterios» no cubre todos los criterios: los demás quedan como «beneficio».');
    return { esCosto, avisos, leido: true };
  }

  function juiciosVacios(n) { return Array.from({ length: n }, () => new Array(n).fill(1)); }

  // Hoja «Juicios»: formato lista (Criterio_A, Criterio_B, Juicio) o matriz (primera columna = criterio)
  function leerJuicios(tabla, criterios) {
    const n = criterios.length, J = juiciosVacios(n), avisos = [];
    if (!tabla || tabla.errores.length) return { J, avisos, leido: false };
    const idx = v => criterios.findIndex(c => normalizar(c) === normalizar(v === null || v === undefined ? '' : v));
    const nom = tabla.columnas.map(c => c.nombre);
    const esLista = tabla.columnas.length >= 3 && tabla.columnas[2].tipo === 'numerica' && idx(nom[2]) < 0;
    let cargados = 0;
    const poner = (i, j, v) => {
      if (!(v >= 1 / 9 - 1e-9 && v <= 9 + 1e-9)) { avisos.push('Un juicio fuera de la escala 1/9 a 9 se ignoró (' + v + ').'); return; }
      J[i][j] = v; J[j][i] = 1 / v; cargados++;
    };
    if (esLista) {
      tabla.filasDatos.forEach(function (r) {
        const i = idx(r.celdas[0]), j = idx(r.celdas[1]), v = DP.aNumero(r.celdas[2]);
        if (i < 0 || j < 0 || i === j || v === null || Number.isNaN(v)) { avisos.push('La fila ' + r.filaExcel + ' de «Juicios» no se pudo interpretar y se ignoró.'); return; }
        poner(i, j, v);
      });
    } else {
      tabla.filasDatos.forEach(function (r) {
        const i = idx(r.celdas[0]);
        if (i < 0) { avisos.push('La fila ' + r.filaExcel + ' de «Juicios» menciona un criterio desconocido y se ignoró.'); return; }
        tabla.columnas.forEach(function (c, k) {
          if (k === 0) return; const j = idx(c.nombre); const v = DP.aNumero(r.celdas[k]);
          if (j > i && v !== null && !Number.isNaN(v)) poner(i, j, v);
        });
      });
    }
    if (cargados < n * (n - 1) / 2) avisos.push('Se leyeron ' + cargados + ' de ' + (n * (n - 1) / 2) + ' juicios; los que faltan valen 1 (igual de importantes).');
    return { J, avisos, leido: cargados > 0 };
  }

  function ahp(J) {
    const n = J.length;
    let v = new Array(n).fill(1 / n);
    for (let it = 0; it < 20000; it++) {
      const Av = N.matvec(J, v), s = N.suma(Av), nv = Av.map(x => x / s);
      const dif = Math.max.apply(null, nv.map((x, i) => Math.abs(x - v[i]))); v = nv; if (dif < 1e-15) break;
    }
    const Av = N.matvec(J, v), lambda = N.media(Av.map((x, i) => x / v[i]));
    const ci = n > 1 ? (lambda - n) / (n - 1) : 0, ri = RI[n], cr = ri > 0 ? ci / ri : 0;
    // par de juicios más contradictorio: mayor |log(a_ij · w_j / w_i)|
    let peor = null, mejor = -1;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const d = Math.abs(Math.log(J[i][j] * v[j] / v[i])); if (d > mejor + 1e-12) { mejor = d; peor = { i, j, sugerido: v[i] / v[j], dado: J[i][j] }; } }
    return { pesos: v, lambda, ci, cr, ri, peor };
  }

  function topsis(X, w, esCosto) {
    const nC = X[0].length, norma = [];
    for (let c = 0; c < nC; c++) norma.push(Math.sqrt(N.suma(X.map(f => f[c] * f[c]))));
    const Vp = X.map(f => f.map((x, c) => (x / norma[c]) * w[c])), mejor = [], peor = [];
    for (let c = 0; c < nC; c++) {
      const col = Vp.map(f => f[c]), mx = Math.max.apply(null, col), mn = Math.min.apply(null, col);
      mejor.push(esCosto[c] ? mn : mx); peor.push(esCosto[c] ? mx : mn);
    }
    const cercania = Vp.map(function (f) {
      const dM = Math.sqrt(N.suma(f.map((x, c) => (x - mejor[c]) * (x - mejor[c])))), dP = Math.sqrt(N.suma(f.map((x, c) => (x - peor[c]) * (x - peor[c]))));
      return dP / (dM + dP);
    });
    return { cercania, orden: cercania.map((_, i) => i).sort((a, b) => cercania[b] - cercania[a] || a - b) };
  }

  // datos: {alternativas, criterios, X}; cfg: {esCosto, J (matriz n×n), barrido (1..n)}
  function evaluar(datos, cfg) {
    const { alternativas, criterios, X } = datos, nA = alternativas.length, n = criterios.length;
    const a = ahp(cfg.J), t = topsis(X, a.pesos, cfg.esCosto), ti = topsis(X, new Array(n).fill(1 / n), cfg.esCosto);
    const gAHP = t.orden[0], gIg = ti.orden[0], consistente = a.cr < 0.10;
    const b = cfg.barrido - 1, resto = a.pesos.filter((_, j) => j !== b), sr = N.suma(resto);
    const rejilla = [], ganadorBarrido = [], cercaniaBarrido = [];
    for (let i = 0; i <= 100; i++) {
      const wb = i / 100; let q = 0;
      const w = a.pesos.map((_, j) => (j === b ? wb : (1 - wb) * resto[q++] / sr));
      const r = topsis(X, w, cfg.esCosto); let g = 0; r.cercania.forEach((v, k) => { if (v > r.cercania[g]) g = k; });
      rejilla.push(wb); ganadorBarrido.push(g); cercaniaBarrido.push(r.cercania);
    }
    let nCambios = 0; for (let i = 1; i < ganadorBarrido.length; i++) if (ganadorBarrido[i] !== ganadorBarrido[i - 1]) nCambios++;
    const segmentos = []; let ini = 0;
    for (let i = 1; i <= rejilla.length; i++) if (i === rejilla.length || ganadorBarrido[i] !== ganadorBarrido[ini]) { segmentos.push({ g: ganadorBarrido[ini], desde: rejilla[ini], hasta: rejilla[i - 1] }); ini = i; }
    const g3 = x => String(parseFloat(Number(x).toPrecision(3)));
    const L = [];
    const par = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) par.push(g3(cfg.J[i][j]));
    L.push('=== Resultados con ' + nA + ' alternativas, ' + n + ' criterios y juicios [' + par.join(' ') + '] ===');
    L.push('Criterios de costo (menos es mejor): ' + (criterios.filter((_, j) => cfg.esCosto[j]).join(', ') || 'ninguno'));
    L.push('');
    L.push('AHP — pesos de los criterios:');
    criterios.forEach((c, i) => L.push(N.sprintf('  %-24s %.3f', c, a.pesos[i])));
    L.push(N.sprintf('  lambda máximo = %.3f, índice de consistencia = %.4f, razón de consistencia = %.3f', a.lambda, a.ci, a.cr));
    L.push(consistente ? '  Los juicios son consistentes (razón < 0.10).' : '  Los juicios NO son consistentes (razón >= 0.10): revisen las comparaciones antes de confiar en los pesos.');
    if (!consistente && a.peor) L.push(N.sprintf('  Par más contradictorio: «%s» frente a «%s» (usaron %s; los demás juicios sugieren %s).', criterios[a.peor.i], criterios[a.peor.j], g3(a.peor.dado), g3(a.peor.sugerido)));
    L.push('');
    L.push('TOPSIS con los pesos de AHP (más cerca de 1 = mejor):');
    t.orden.slice(0, Math.min(nA, 10)).forEach((g, i) => L.push(N.sprintf('  %d. %-30s %.3f', i + 1, alternativas[g], t.cercania[g])));
    L.push('  Elige: ' + alternativas[gAHP]);
    L.push('');
    L.push('TOPSIS con pesos iguales (ignora los juicios):');
    L.push('  Elige: ' + alternativas[gIg]);
    L.push(gAHP === gIg ? '  Coincide con la elección con pesos AHP.' : '  NO coincide: los juicios sobre la importancia de los criterios cambian la elección.');
    L.push('');
    L.push(N.sprintf('Barrido del peso de «%s» (0 a 1): el ganador cambia %d vez(veces)', criterios[b], nCambios));
    segmentos.forEach(s => L.push(N.sprintf('  %-30s de %.2f a %.2f', alternativas[s.g], s.desde, s.hasta)));
    return { consola: L.join('\n'), a, t, ti, gAHP, gIg, consistente, rejilla, ganadorBarrido, cercaniaBarrido, segmentos, nCambios,
      metricas: { lambdaMax: a.lambda, cr: a.cr, consistente: consistente ? 'sí' : 'no', ganadorAHP: alternativas[gAHP], cercaniaGanador: t.cercania[gAHP], ganadorIguales: alternativas[gIg], nCambios,
        peorPar: a.peor ? (a.peor.i + 1) + '-' + (a.peor.j + 1) : '' } };
  }

  const M = { LIMITES, RI, leerDecision, leerTipos, leerJuicios, juiciosVacios, ahp, topsis, evaluar };
  if (esNode) module.exports = M; else raiz.Cap09Datos = M;
})(this);
