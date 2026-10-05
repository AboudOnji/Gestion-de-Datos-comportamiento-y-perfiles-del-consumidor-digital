/* modelos/cap03_datos.js — análisis del Cap. 3 (calidad de datos, RFM, CLV y
   prueba A/B) sobre datos PROPIOS del estudiante. Recibe tablas ya leídas del
   Excel (DatosPropios.procesarTabla, de cap02_datos.js) y aplica la misma lógica
   que cap03_rfm_clv_ab.m: imputación por mediana y acotado 1.5×RIC del monto,
   puntajes por quintil (1–5), segmentos por suma RFM (≥12 Campeón, ≥9 Leal,
   ≥6 En riesgo, resto Perdido) y CLV = monto × frecuencia × horizonte.
   Diferencias deliberadas respecto al script (todas con valor por defecto que
   reproduce el script): periodo de observación de la frecuencia (meses →
   anualiza), tasa de descuento anual (CLV descontado, «extensión opcional» del
   libro) y manejo de empates en los quintiles (ver puntajeQuintil).
   No depende del navegador: se prueba en Node (pruebas/verificar_cap03_datos.js). */
(function (raiz) {
  'use strict';
  const esNode = typeof module === 'object' && module.exports;
  const N = esNode ? require('../numerico.js') : raiz.Numerico;
  const DP = esNode ? require('./cap02_datos.js') : raiz.DatosPropios;
  const Cap03 = esNode ? require('./cap03.js') : raiz.Cap03;

  const LIMITES = { minClientes: 30, maxClientes: 20000 };
  const ORDEN = Cap03.ORDEN;
  const DEFECTO = { horizonteAnios: 3, alfa: 0.05, mesesPeriodo: 12, tasaDescuento: 0, nA: 1200, conversionesA: 132, nB: 1180, conversionesB: 159 };

  const normalizar = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

  /* ---------- columnas ---------- */
  // Adivina qué columna es la recencia, la frecuencia y el monto por su nombre.
  const PATRONES = {
    r: /^(recencia|recency|dias|diasdesde|ultimacompra|diasultima|days)/,
    f: /^(frecuencia|frequency|compras|numcompras|pedidos|ordenes|transacciones|visitas)/,
    m: /^(monto|ticket|gasto|importe|valor|ingreso|revenue|monetary|total)/
  };
  function sugerirColumnas(tabla) {
    const nums = tabla.columnas.filter(c => c.tipo === 'numerica');
    const usadas = new Set(), sug = { r: null, f: null, m: null };
    ['r', 'f', 'm'].forEach(function (k) {
      const c = nums.find(x => !usadas.has(x.nombre) && PATRONES[k].test(normalizar(x.nombre)));
      if (c) { sug[k] = c.nombre; usadas.add(c.nombre); }
    });
    // las que no se reconocen por nombre: siguientes numéricas en orden de aparición
    const libres = nums.filter(x => !usadas.has(x.nombre));
    ['r', 'f', 'm'].forEach(k => { if (!sug[k] && libres.length) { sug[k] = libres.shift().nombre; } });
    return sug;
  }

  /* ---------- quintiles ---------- */
  // Puntaje 1–5 por quintil. Si los bordes de prctile son estrictamente
  // crecientes se usa discretize exactamente como el script (MATLAB falla con
  // bordes repetidos). Con muchos valores repetidos (p. ej. frecuencia 1, 2 o 3
  // compras) se asigna por rango promedio: los clientes con el mismo valor
  // comparten puntaje y los quintiles ya no quedan del mismo tamaño.
  function puntajeQuintil(valores) {
    const bordes = N.prctile(valores, [0, 20, 40, 60, 80, 100]);
    const estricto = bordes.every((b, i) => i === 0 || b > bordes[i - 1]);
    if (estricto) return { puntaje: N.discretizeDerecha(valores, bordes), exacto: true };
    const n = valores.length;
    const orden = valores.map((v, i) => i).sort((a, b) => valores[a] - valores[b]);
    const rango = new Array(n);
    for (let i = 0; i < n;) {
      let j = i;
      while (j + 1 < n && valores[orden[j + 1]] === valores[orden[i]]) j++;
      const prom = (i + j) / 2 + 1; // rango promedio (base 1)
      for (let t = i; t <= j; t++) rango[orden[t]] = prom;
      i = j + 1;
    }
    return { puntaje: rango.map(r => Math.min(5, Math.max(1, Math.ceil(5 * r / n)))), exacto: false };
  }

  /* ---------- análisis de clientes ---------- */
  function factorHorizonte(H, d) {
    if (!d) return H;
    let s = 0;
    for (let t = 1; t <= H; t++) s += Math.pow(1 + d, -t);
    return s;
  }

  // col = {r, f, m}: nombres de columna. P = {horizonteAnios, mesesPeriodo, tasaDescuento}
  function analizarClientes(tabla, col, P) {
    const errores = [], avisos = [];
    const idxCol = nombre => tabla.columnas.findIndex(c => c.nombre === nombre);
    const cR = tabla.columnas[idxCol(col.r)], cF = tabla.columnas[idxCol(col.f)], cM = tabla.columnas[idxCol(col.m)];
    if (!cR || !cF || !cM) errores.push('Elijan una columna para recencia, frecuencia y monto.');
    else if (new Set([col.r, col.f, col.m]).size < 3) errores.push('Recencia, frecuencia y monto deben ser tres columnas distintas.');
    if (errores.length) return { errores, avisos };
    const iId = tabla.idCol ? idxCol(tabla.idCol) : -1;

    // 1) filas válidas
    const filas = [];
    const descartadas = { sinR: 0, sinF: 0, duplicadas: 0 };
    let montosNoPositivos = 0, montosTexto = 0;
    const vistos = new Set();
    tabla.filasDatos.forEach(function (r, i) {
      const rr = cR.valores[i], ff = cF.valores[i];
      let mm = cM.valores[i];
      if (rr === null || Number.isNaN(rr) || rr < 0) { descartadas.sinR++; return; }
      if (ff === null || Number.isNaN(ff) || ff <= 0) { descartadas.sinF++; return; }
      if (iId >= 0) {
        const id = r.celdas[iId] === null || r.celdas[iId] === undefined ? null : String(r.celdas[iId]).trim();
        if (id) { if (vistos.has(id)) { descartadas.duplicadas++; return; } vistos.add(id); }
      }
      if (mm !== null && Number.isNaN(mm)) { montosTexto++; mm = null; }
      else if (mm !== null && mm <= 0) { montosNoPositivos++; mm = null; }
      filas.push({ id: iId >= 0 && r.celdas[iId] !== null && r.celdas[iId] !== undefined ? String(r.celdas[iId]) : 'Fila ' + r.filaExcel,
        filaExcel: r.filaExcel, r: rr, f: ff, m: mm === null ? NaN : mm });
    });
    const totalLeidas = tabla.filasDatos.length;
    if (descartadas.sinR) avisos.push(descartadas.sinR + ' fila(s) sin recencia válida (vacía, texto o negativa) se descartaron.');
    if (descartadas.sinF) avisos.push(descartadas.sinF + ' fila(s) sin frecuencia válida (vacía, texto o menor o igual a 0) se descartaron: sin compras no hay RFM.');
    if (descartadas.duplicadas) avisos.push(descartadas.duplicadas + ' fila(s) con un ID repetido se descartaron (se conservó la primera aparición de cada cliente).');
    if (montosTexto) avisos.push(montosTexto + ' monto(s) con texto se trataron como faltantes.');
    if (montosNoPositivos) avisos.push(montosNoPositivos + ' monto(s) menores o iguales a 0 (¿devoluciones?) se trataron como faltantes.');
    const n = filas.length;
    if (n < LIMITES.minClientes) errores.push('Quedan ' + n + ' clientes válidos; se necesitan al menos ' + LIMITES.minClientes + '.');
    if (n > LIMITES.maxClientes) errores.push('El archivo tiene ' + n + ' clientes válidos; el máximo es ' + LIMITES.maxClientes + ' (tomen una muestra).');
    if (errores.length) return { errores, avisos };

    // 2) Bloque 1: calidad (monto)
    const recencia = filas.map(x => x.r), frecuencia = filas.map(x => x.f);
    const monto = filas.map(x => x.m);
    const nFalt = monto.filter(Number.isNaN).length;
    if (nFalt === n) return { errores: ['Ningún cliente tiene monto válido.'], avisos };
    const med = N.mediana(monto);
    const imputado = monto.map(v => Number.isNaN(v) ? med : v);
    const q1 = N.prctile(imputado, 25), q3 = N.prctile(imputado, 75);
    const limSup = q3 + 1.5 * (q3 - q1);
    const esAtipico = imputado.map(v => v > limSup);
    const nAt = esAtipico.filter(Boolean).length;
    const montoLimpio = imputado.map((v, i) => esAtipico[i] ? limSup : v);
    const limInf = q1 - 1.5 * (q3 - q1);
    const nAtInf = imputado.filter(v => v < limInf).length;
    if (nAtInf) avisos.push(nAtInf + ' monto(s) están por debajo de Q1 − 1.5×RIC (' + limInf.toFixed(0) + '). Como en el script, solo se acotan los atípicos superiores; revisen si son errores de captura.');

    // 3) Bloque 2: RFM
    const pr = puntajeQuintil(recencia), pf = puntajeQuintil(frecuencia), pm = puntajeQuintil(montoLimpio);
    const puntajeR = pr.puntaje.map(v => 6 - v), puntajeF = pf.puntaje, puntajeM = pm.puntaje;
    const fix = v => Number.isNaN(v) ? 3 : v;
    const rfm = puntajeR.map((_, i) => fix(puntajeR[i]) + fix(puntajeF[i]) + fix(puntajeM[i]));
    const segmento = rfm.map(r => r >= 12 ? 'Campeón' : r >= 9 ? 'Leal' : r >= 6 ? 'En riesgo' : 'Perdido');
    const empates = [];
    if (!pr.exacto) empates.push('recencia');
    if (!pf.exacto) empates.push('frecuencia');
    if (!pm.exacto) empates.push('monto');
    if (empates.length) avisos.push('En ' + empates.join(', ') + ' hay tantos valores repetidos que los quintiles no se pueden cortar limpiamente: los clientes con el mismo valor comparten puntaje y los grupos de 1 a 5 no quedan del mismo tamaño. Es normal con frecuencias de 1, 2 o 3 compras.');

    // 4) CLV
    const anualiza = 12 / P.mesesPeriodo;
    const fh = factorHorizonte(P.horizonteAnios, P.tasaDescuento);
    const frecAnual = frecuencia.map(f => f * anualiza);
    const clv = montoLimpio.map((m, i) => m * frecAnual[i] * fh);
    const clvSimple = montoLimpio.map((m, i) => m * frecAnual[i] * P.horizonteAnios);
    const clvTotal = N.suma(clv);
    const resumen = ORDEN.map(function (s) {
      const idx = segmento.map((x, i) => x === s ? i : -1).filter(i => i >= 0);
      const prom = a => idx.length ? N.media(idx.map(i => a[i])) : NaN;
      const total = N.suma(idx.map(i => clv[i]));
      return { segmento: s, clientes: idx.length, pctClientes: 100 * idx.length / n, clvProm: prom(clv), clvTotal: total, pctClv: 100 * total / clvTotal,
        recProm: prom(recencia), frecProm: prom(frecuencia), montoProm: prom(montoLimpio) };
    });
    // concentración: parte del CLV total que aporta el 20 % de clientes con mayor CLV
    const ordenClv = clv.slice().sort((a, b) => b - a);
    const top = Math.max(1, Math.round(0.2 * n));
    const pctTop20 = 100 * N.suma(ordenClv.slice(0, top)) / clvTotal;

    return {
      errores, avisos, n, totalLeidas, descartadas, filas,
      calidad: { nFalt, medianaMonto: med, q1, q3, limSup, limInf, nAt, nAtInf, montosTexto, montosNoPositivos },
      exactos: { r: pr.exacto, f: pf.exacto, m: pm.exacto },
      recencia, frecuencia, montoOriginal: imputado, montoLimpio, esAtipico, puntajeR, puntajeF, puntajeM, rfm, segmento,
      clv, clvSimple, clvTotal, fh, anualiza, resumen, pctTop20,
      clvDescontadoMenor: P.tasaDescuento > 0
    };
  }

  /* ---------- experimento A/B desde la hoja «Experimento» ---------- */
  const esSi = v => /^(1|si|sí|s|yes|y|true|verdadero|convirtio|convirtió|compro|compró)$/i.test(String(v).trim());
  const esNo = v => /^(0|no|n|false|falso)$/i.test(String(v).trim());
  // filas: [[encabezados], ...]. Acepta dos formatos:
  //  (a) una fila por visitante: columnas «Version» (A/B) y «Convirtio» (0/1 o Sí/No);
  //  (b) resumen: columnas «Version», «Visitantes» y «Conversiones» (dos filas).
  function leerExperimento(filas) {
    const errores = [], avisos = [];
    const t = DP.procesarTabla(filas);
    if (t.errores.length) return { errores: t.errores, avisos };
    const col = patron => t.columnas.find(c => patron.test(normalizar(c.nombre)));
    const cV = col(/^(version|variante|grupo|brazo|rama)/);
    if (!cV) return { errores: ['No encuentro la columna «Version» (valores A y B).'], avisos };
    const iV = t.columnas.indexOf(cV);
    const versiones = t.filasDatos.map(r => (r.celdas[iV] === null || r.celdas[iV] === undefined) ? '' : String(r.celdas[iV]).trim());
    let nombres = Array.from(new Set(versiones.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
    if (nombres.length !== 2) return { errores: ['La columna «' + cV.nombre + '» debe tener exactamente dos versiones (A y B); encontré ' + nombres.length + '.'], avisos };
    if (!(/^a$/i.test(nombres[0]) && /^b$/i.test(nombres[1]))) avisos.push('Las versiones se llaman «' + nombres[0] + '» y «' + nombres[1] + '»: se tomó «' + nombres[0] + '» como A (control) y «' + nombres[1] + '» como B (variante).');
    const cVis = col(/^(visitantes|usuarios|sesiones|muestra|n$|tamano)/), cConv = col(/^(conversiones|convertidos|exitos|compras)/);
    if (cVis && cConv) {
      const iVis = t.columnas.indexOf(cVis), iConv = t.columnas.indexOf(cConv);
      const sumar = (nombre, i) => N.suma(t.filasDatos.filter((r, k) => versiones[k] === nombre).map(r => DP.aNumero(r.celdas[i]) || 0));
      return { errores, avisos, nA: sumar(nombres[0], iVis), conversionesA: sumar(nombres[0], iConv), nB: sumar(nombres[1], iVis), conversionesB: sumar(nombres[1], iConv), formato: 'resumen' };
    }
    const cC = col(/^(convirtio|conversion|compro|exito|resultado)/);
    if (!cC) return { errores: ['Encuentro «Version» pero no la columna de resultado: «Convirtio» (0/1 o Sí/No), o bien «Visitantes» y «Conversiones».'], avisos };
    const iC = t.columnas.indexOf(cC);
    let nA = 0, cA = 0, nB = 0, cB = 0, invalidos = 0;
    t.filasDatos.forEach(function (r, k) {
      const v = r.celdas[iC];
      const si = v !== null && v !== undefined && esSi(v), no = v !== null && v !== undefined && esNo(v);
      if (!versiones[k] || (!si && !no)) { invalidos++; return; }
      if (versiones[k] === nombres[0]) { nA++; if (si) cA++; } else { nB++; if (si) cB++; }
    });
    if (invalidos) avisos.push(invalidos + ' fila(s) sin versión o con resultado que no es 0/1 (o Sí/No) se descartaron.');
    return { errores, avisos, nA, conversionesA: cA, nB, conversionesB: cB, formato: 'visitantes' };
  }

  const M = { LIMITES, ORDEN, DEFECTO, sugerirColumnas, puntajeQuintil, factorHorizonte, analizarClientes, leerExperimento,
    pruebaAB: Cap03.pruebaAB, simularAzar: Cap03.simularAzar };
  if (esNode) module.exports = M;
  else raiz.Cap03Datos = M;
})(this);
