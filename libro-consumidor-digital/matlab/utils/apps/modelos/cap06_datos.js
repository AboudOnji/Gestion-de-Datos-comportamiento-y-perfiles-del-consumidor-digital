/* modelos/cap06_datos.js — evaluación de alternativas del Cap. 6 con datos PROPIOS del
   estudiante: las mismas tres reglas de cap06_alternativas.m (aditiva ponderada,
   conjuntiva y lexicográfica) y el mismo barrido de pesos, pero con las alternativas y los
   atributos que traiga el Excel. Con los datos del libro reproduce exactamente
   cap06.js. No depende del navegador: se prueba en Node (pruebas/verificar_cap06_datos.js). */
(function (raiz) {
  'use strict';
  const esNode = typeof module === 'object' && module.exports;
  const N = esNode ? require('../numerico.js') : raiz.Numerico;
  const DP = esNode ? require('./cap02_datos.js') : raiz.DatosPropios;

  const LIMITES = { minAlt: 3, maxAlt: 50, minAtr: 2, maxAtr: 10 };
  const DEFECTO = { umbralMinimo: 3.5, toleranciaLex: 0.5 };
  const normalizar = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // tabla: salida de DP.procesarTabla. La primera columna de texto son los nombres
  // de las alternativas; las columnas numéricas son los atributos.
  function leerAlternativas(tabla) {
    const errores = tabla.errores.slice(), avisos = [];
    if (errores.length) return { errores, avisos };
    const colNombre = tabla.columnas.find(c => c.tipo === 'texto' || c.tipo === 'id');
    const colsAtr = tabla.columnas.filter(c => c.tipo === 'numerica');
    if (colsAtr.length < LIMITES.minAtr) errores.push('Se necesitan al menos ' + LIMITES.minAtr + ' columnas numéricas (los atributos); se encontraron ' + colsAtr.length + '.');
    if (colsAtr.length > LIMITES.maxAtr) errores.push('Hay ' + colsAtr.length + ' atributos; el máximo es ' + LIMITES.maxAtr + '. Dejen solo los que importan.');
    const nAlt = tabla.filasDatos.length;
    if (nAlt < LIMITES.minAlt) errores.push('Se necesitan al menos ' + LIMITES.minAlt + ' alternativas; se encontraron ' + nAlt + '.');
    if (nAlt > LIMITES.maxAlt) errores.push('Hay ' + nAlt + ' alternativas; el máximo es ' + LIMITES.maxAlt + '.');
    if (errores.length) return { errores, avisos };
    const X = [], alternativas = [];
    tabla.filasDatos.forEach(function (r, i) {
      const fila = colsAtr.map(c => c.valores[i]);
      alternativas.push(colNombre && r.celdas[colNombre.indice] !== null && r.celdas[colNombre.indice] !== undefined ? String(r.celdas[colNombre.indice]).trim() : 'Alternativa ' + (i + 1));
      fila.forEach((v, j) => { if (v === null || Number.isNaN(v)) errores.push('Falta un número válido en la fila ' + r.filaExcel + ', columna «' + colsAtr[j].nombre + '».'); });
      X.push(fila);
    });
    if (errores.length) return { errores: errores.slice(0, 6), avisos };
    if (!colNombre) avisos.push('No encontré una columna de texto con los nombres: las alternativas se llamarán «Alternativa 1», «Alternativa 2»…');
    const repetidos = alternativas.filter((a, i) => alternativas.indexOf(a) !== i);
    if (repetidos.length) avisos.push('Hay nombres de alternativa repetidos (' + repetidos.slice(0, 3).join(', ') + '): usen nombres distintos para distinguirlas.');
    const atributos = colsAtr.map(c => c.nombre);
    colsAtr.forEach(c => { if (c.constante) avisos.push('«' + c.nombre + '» tiene el mismo valor en todas las alternativas: no discrimina y recibe 5 en todas.'); });
    return { errores, avisos, alternativas, atributos, X };
  }

  // tablaCrit: tabla procesada de la hoja «Criterios» (Criterio, Tipo, Peso)
  function leerCriterios(tablaCrit, atributos) {
    const avisos = [], esCosto = atributos.map(() => false), pesos = atributos.map(() => 1);
    if (!tablaCrit || tablaCrit.errores.length) return { esCosto, pesos, avisos, leido: false };
    const cNombre = tablaCrit.columnas[0];
    const cTipo = tablaCrit.columnas.find(c => /^tipo/.test(normalizar(c.nombre)));
    const cPeso = tablaCrit.columnas.find(c => /^peso|^import/.test(normalizar(c.nombre)));
    let nCoinc = 0;
    tablaCrit.filasDatos.forEach(function (r) {
      const nom = normalizar(r.celdas[cNombre.indice] === null ? '' : r.celdas[cNombre.indice]);
      const j = atributos.findIndex(a => normalizar(a) === nom);
      if (j < 0) { avisos.push('La hoja «Criterios» menciona «' + r.celdas[cNombre.indice] + '», que no es un atributo de la hoja de alternativas.'); return; }
      nCoinc++;
      if (cTipo) { const t = normalizar(r.celdas[cTipo.indice] === null ? '' : r.celdas[cTipo.indice]); esCosto[j] = /^(costo|cost|menos|min)/.test(t); }
      if (cPeso) { const p = DP.aNumero(r.celdas[cPeso.indice]); if (p !== null && !Number.isNaN(p) && p >= 0) pesos[j] = p; }
    });
    if (nCoinc < atributos.length) avisos.push('La hoja «Criterios» no cubre todos los atributos (' + nCoinc + ' de ' + atributos.length + '): los demás quedan como «beneficio» con peso 1.');
    return { esCosto, pesos, avisos, leido: true };
  }

  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

  function puntajes(X, esCosto) {
    const nAtr = X[0].length;
    const mn = [], mx = [];
    for (let j = 0; j < nAtr; j++) { const col = X.map(f => f[j]); mn.push(Math.min.apply(null, col)); mx.push(Math.max.apply(null, col)); }
    return X.map(fila => fila.map(function (x, j) {
      if (mx[j] === mn[j]) return 5;
      let p = 10 * (x - mn[j]) / (mx[j] - mn[j]);
      if (esCosto[j]) p = 10 - p;
      return p;
    }));
  }

  // datos: {alternativas, atributos, X}; cfg: {esCosto, pesos, umbralMinimo, prioritario (1..nAtr), toleranciaLex, barrido (1..nAtr)}
  function evaluar(datos, cfg) {
    const { alternativas, atributos, X } = datos;
    const nAlt = alternativas.length, nAtr = atributos.length;
    const S = puntajes(X, cfg.esCosto);
    const suma = N.suma(cfg.pesos);
    const pesos = cfg.pesos.map(w => w / suma);

    const utilidad = S.map(f => dot(f, pesos));
    const ordenAditiva = utilidad.map((_, i) => i).sort((a, b) => utilidad[b] - utilidad[a] || a - b);
    const ganadorAditiva = ordenAditiva[0];

    const aceptables = S.map(f => f.every(v => v >= cfg.umbralMinimo));
    const nAceptables = aceptables.filter(Boolean).length;
    let ganadorConj = -1;
    if (nAceptables > 0) { let mejor = -Infinity; utilidad.forEach((u, i) => { if (aceptables[i] && u > mejor) { mejor = u; ganadorConj = i; } }); }

    const prio = cfg.prioritario - 1;
    const ordenPesos = pesos.map((_, i) => i).sort((a, b) => pesos[b] - pesos[a] || a - b);
    const ordenAtributos = [prio].concat(ordenPesos.filter(i => i !== prio));
    let cand = alternativas.map((_, i) => i);
    for (const k of ordenAtributos) {
      const mejor = Math.max.apply(null, cand.map(i => S[i][k]));
      cand = cand.filter(i => S[i][k] >= mejor - cfg.toleranciaLex);
      if (cand.length === 1) break;
    }
    const ganadorLex = cand[0];

    const b = cfg.barrido - 1;
    const resto = pesos.filter((_, j) => j !== b), sr = N.suma(resto);
    const rejilla = [], ganadorBarrido = [], utilBarrido = [];
    for (let i = 0; i <= 100; i++) {
      const wb = i / 100;
      let w; if (sr > 0) { let q = 0; w = pesos.map((_, j) => (j === b ? wb : (1 - wb) * resto[q++] / sr)); } else w = pesos.map((_, j) => (j === b ? 1 : 0));
      const u = S.map(f => dot(f, w));
      let g = 0; u.forEach((v, j) => { if (v > u[g]) g = j; });
      rejilla.push(wb); ganadorBarrido.push(g); utilBarrido.push(u);
    }
    let nCambios = 0;
    for (let i = 1; i < ganadorBarrido.length; i++) if (ganadorBarrido[i] !== ganadorBarrido[i - 1]) nCambios++;
    const segmentos = []; let ini = 0;
    for (let i = 1; i <= rejilla.length; i++) if (i === rejilla.length || ganadorBarrido[i] !== ganadorBarrido[ini]) { segmentos.push({ g: ganadorBarrido[ini], desde: rejilla[ini], hasta: rejilla[i - 1] }); ini = i; }

    const nom = g => (g < 0 ? 'ninguna' : alternativas[g]);
    const coinciden = nAceptables > 0 && ganadorAditiva === ganadorConj && ganadorConj === ganadorLex;
    const w2 = a => a.map(x => N.sprintf('%.2f', x)).join(' ');
    const L = [];
    L.push(N.sprintf('=== Resultados con %d alternativas y %d atributos; pesos=[%s], umbral=%.1f, prioritario=%s, tolerancia=%.1f ===',
      nAlt, nAtr, w2(cfg.pesos), cfg.umbralMinimo, atributos[prio], cfg.toleranciaLex));
    L.push('Atributos de costo (menos es mejor): ' + (atributos.filter((_, j) => cfg.esCosto[j]).join(', ') || 'ninguno'));
    L.push('');
    L.push('Regla aditiva ponderada (compensatoria):');
    ordenAditiva.slice(0, Math.min(nAlt, 10)).forEach((g, i) => L.push(N.sprintf('  %d. %-24s utilidad = %.3f', i + 1, alternativas[g], utilidad[g])));
    L.push('  Elige: ' + nom(ganadorAditiva));
    L.push('');
    L.push(N.sprintf('Regla conjuntiva (mínimo %.1f en cada atributo): %d alternativa(s) aceptable(s)', cfg.umbralMinimo, nAceptables));
    if (nAceptables === 0) L.push('  Ninguna alternativa cumple el mínimo: la regla no elige.');
    else { L.push('  Aceptables: ' + alternativas.filter((_, i) => aceptables[i]).join(', ')); L.push('  Elige: ' + nom(ganadorConj)); }
    L.push('');
    L.push(N.sprintf('Regla lexicográfica (primero %s, tolerancia %.1f):', atributos[prio], cfg.toleranciaLex));
    L.push('  Elige: ' + nom(ganadorLex));
    L.push('');
    L.push(coinciden ? 'Las tres reglas coinciden.' : 'Las reglas NO coinciden: la regla de decisión cambia la alternativa elegida.');
    L.push('');
    L.push(N.sprintf('Barrido del peso de «%s» (0 a 1, regla aditiva): el ganador cambia %d vez(veces)', atributos[b], nCambios));
    segmentos.forEach(s => L.push(N.sprintf('  %-24s de %.2f a %.2f', alternativas[s.g], s.desde, s.hasta)));

    return {
      consola: L.join('\n'), puntajes: S, pesos, utilidad, ordenAditiva, aceptables, nAceptables, ganadorAditiva, ganadorConj, ganadorLex,
      rejilla, utilBarrido, ganadorBarrido, segmentos, nCambios, coinciden, ordenAtributos,
      metricas: { ganadorAditiva: nom(ganadorAditiva), utilGanador: utilidad[ganadorAditiva], nAceptables, ganadorConj: nom(ganadorConj), ganadorLex: nom(ganadorLex),
        coinciden: coinciden ? 'sí' : 'no', nCambios }
    };
  }

  const M = { LIMITES, DEFECTO, leerAlternativas, leerCriterios, evaluar, puntajes };
  if (esNode) module.exports = M; else raiz.Cap06Datos = M;
})(this);
