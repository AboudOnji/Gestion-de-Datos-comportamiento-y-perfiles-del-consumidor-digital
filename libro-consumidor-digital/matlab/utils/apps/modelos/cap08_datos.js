/* modelos/cap08_datos.js — red social PROPIA (Cap. 8): a partir de una lista de conexiones
   (quién conoce a quién) calcula las mismas medidas de cap08_red_influencia.m (grado,
   intermediación, cercanía) y simula la misma cascada por umbral, con semillas centrales,
   periféricas y 100 sorteos al azar (flujo de rand de MATLAB tras rng(42)). Con la red del libro
   exportada a Excel reproduce exactamente cap08.js. No depende del navegador: se prueba en Node
   (pruebas/verificar_cap08_datos.js). */
(function (raiz) {
  'use strict';
  const esNode = typeof module === 'object' && module.exports;
  const N = esNode ? require('../numerico.js') : raiz.Numerico;
  const DP = esNode ? require('./cap02_datos.js') : raiz.DatosPropios;

  const LIMITES = { minNodos: 10, maxNodos: 150, minConexiones: 10 };
  const DEFECTO = { nSemillas: 3, umbral: 0.25, criterio: 1 };
  const MEDIDAS = ['grado', 'intermediación', 'cercanía'];
  const N_SORTEOS = 100;
  const normalizar = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const redondear9 = x => Math.round(x * 1e9) / 1e9;

  // tablaCon: hoja «Conexiones» (dos columnas); tablaPer: hoja «Personas» opcional (Persona, Grupo)
  function leerRed(tablaCon, tablaPer) {
    const errores = tablaCon.errores.slice(), avisos = [];
    if (errores.length) return { errores, avisos };
    const cols = tablaCon.columnas.filter(c => c.tipo !== 'vacia');
    const cA = cols.find(c => /^(persona_?a|origen|de|a$|desde|nodo_?a|fuente|source)/.test(normalizar(c.nombre))) || cols[0];
    const cB = cols.find(c => c !== cA && /^(persona_?b|destino|con|b$|hacia|nodo_?b|objetivo|target)/.test(normalizar(c.nombre))) || cols.find(c => c !== cA);
    if (!cA || !cB) { errores.push('Se necesitan dos columnas: la persona A y la persona B de cada conexión.'); return { errores, avisos }; }
    const clave = v => (v === null || v === undefined ? '' : String(v).trim());
    const nombres = [], idx = {}, grupoDe = {};
    const poner = n => { if (!(n in idx)) { idx[n] = nombres.length; nombres.push(n); } return idx[n]; };
    let hayPersonas = false;
    if (tablaPer && !tablaPer.errores.length && tablaPer.columnas.length) {
      const cP = tablaPer.columnas[0], cG = tablaPer.columnas.find(c => /^(grupo|comunidad|equipo|segmento)/.test(normalizar(c.nombre)));
      tablaPer.filasDatos.forEach(r => { const n = clave(r.celdas[cP.indice]); if (n) { poner(n); if (cG) grupoDe[n] = clave(r.celdas[cG.indice]); } });
      hayPersonas = nombres.length > 0;
    }
    const aristas = new Set(), lista = []; let propias = 0, repetidas = 0;
    tablaCon.filasDatos.forEach(function (r) {
      const a = clave(r.celdas[cA.indice]), b = clave(r.celdas[cB.indice]);
      if (!a || !b) { avisos.push('La fila ' + r.filaExcel + ' tiene una persona vacía y se ignoró.'); return; }
      if (a === b) { propias++; return; }
      if (hayPersonas && (!(a in idx) || !(b in idx))) { errores.push('La fila ' + r.filaExcel + ' menciona a «' + (!(a in idx) ? a : b) + '», que no está en la hoja «Personas».'); return; }
      const i = poner(a), j = poner(b), k = Math.min(i, j) + '-' + Math.max(i, j);
      if (aristas.has(k)) { repetidas++; return; }
      aristas.add(k); lista.push([Math.min(i, j), Math.max(i, j)]);
    });
    if (errores.length) return { errores: errores.slice(0, 6), avisos };
    if (propias) avisos.push(propias + ' conexión(es) de una persona consigo misma se ignoraron.');
    if (repetidas) avisos.push(repetidas + ' conexión(es) repetida(s) (o en sentido inverso) se contaron una sola vez: la red no es dirigida.');
    const n = nombres.length;
    if (n < LIMITES.minNodos) errores.push('Se necesitan al menos ' + LIMITES.minNodos + ' personas; se encontraron ' + n + '.');
    if (n > LIMITES.maxNodos) errores.push('Hay ' + n + ' personas; el máximo es ' + LIMITES.maxNodos + ' (los 100 sorteos al azar usan los números aleatorios exportados de MATLAB).');
    if (lista.length < LIMITES.minConexiones) errores.push('Se necesitan al menos ' + LIMITES.minConexiones + ' conexiones; se encontraron ' + lista.length + '.');
    if (errores.length) return { errores, avisos };
    const A = Array.from({ length: n }, () => new Array(n).fill(false));
    lista.forEach(([i, j]) => { A[i][j] = A[j][i] = true; });
    const grado = A.map(f => f.filter(Boolean).length);
    const aisl = grado.filter(g => g === 0).length;
    if (aisl) avisos.push(aisl + ' persona(s) de la hoja «Personas» no tiene(n) ninguna conexión y no pueden adoptar por contagio.');
    const grupos = nombres.map(nm => grupoDe[nm] || '');
    return { errores, avisos, nombres, A, lista, grado, grupos, hayGrupos: grupos.some(Boolean) };
  }

  function listaAdyacencia(A) { return A.map(f => f.map((v, j) => (v ? j : -1)).filter(j => j >= 0)); }
  function intermediacion(adj) {
    const n = adj.length, C = new Array(n).fill(0);
    for (let s = 0; s < n; s++) {
      const pila = [], pred = Array.from({ length: n }, () => []), sigma = new Array(n).fill(0), dist = new Array(n).fill(-1);
      sigma[s] = 1; dist[s] = 0; const cola = [s];
      for (let h = 0; h < cola.length; h++) {
        const v = cola[h]; pila.push(v);
        adj[v].forEach(function (w) { if (dist[w] < 0) { dist[w] = dist[v] + 1; cola.push(w); } if (dist[w] === dist[v] + 1) { sigma[w] += sigma[v]; pred[w].push(v); } });
      }
      const delta = new Array(n).fill(0);
      while (pila.length) { const w = pila.pop(); pred[w].forEach(v => { delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]); }); if (w !== s) C[w] += delta[w]; }
    }
    return C.map(x => x / 2);
  }
  function distanciasDesde(adj, s) {
    const dist = new Array(adj.length).fill(-1); dist[s] = 0; const cola = [s];
    for (let h = 0; h < cola.length; h++) { const v = cola[h]; adj[v].forEach(w => { if (dist[w] < 0) { dist[w] = dist[v] + 1; cola.push(w); } }); }
    return dist;
  }
  function simularCascada(A, grado, semillas, umbral) {
    const n = A.length, adopt = new Array(n).fill(false);
    semillas.forEach(i => { adopt[i] = true; });
    let rondas = 0; const porRonda = [adopt.filter(Boolean).length / n];
    for (let ronda = 1; ronda <= 200; ronda++) {
      const nuevos = [];
      for (let i = 0; i < n; i++) { if (adopt[i]) continue; let c = 0; for (let j = 0; j < n; j++) if (A[i][j] && adopt[j]) c++; if (c / grado[i] >= umbral) nuevos.push(i); }
      if (!nuevos.length) break;
      nuevos.forEach(i => { adopt[i] = true; }); rondas = ronda; porRonda.push(adopt.filter(Boolean).length / n);
    }
    return { adopt, rondas, porRonda };
  }
  const ordenDescendente = v => v.map((x, i) => i).sort((a, b) => v[b] - v[a] || a - b);
  const pct = a => 100 * a.filter(Boolean).length / a.length;

  // Disposición de Fruchterman–Reingold determinista (para dibujar; no afecta a los resultados)
  function disposicion(adj, iteraciones) {
    const n = adj.length, pos = Array.from({ length: n }, (_, i) => [Math.cos(2 * Math.PI * i / n), Math.sin(2 * Math.PI * i / n)]);
    const k = Math.sqrt(4 / n);
    for (let it = 0; it < (iteraciones || 200); it++) {
      const t = 0.1 * (1 - it / (iteraciones || 200)) + 0.002, d = pos.map(() => [0, 0]);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        let dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1]; const r = Math.max(Math.hypot(dx, dy), 1e-3), f = k * k / r;
        dx /= r; dy /= r; d[i][0] += dx * f; d[i][1] += dy * f; d[j][0] -= dx * f; d[j][1] -= dy * f;
      }
      for (let i = 0; i < n; i++) adj[i].forEach(j => { if (j > i) {
        let dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1]; const r = Math.max(Math.hypot(dx, dy), 1e-3), f = r * r / k;
        dx /= r; dy /= r; d[i][0] -= dx * f; d[i][1] -= dy * f; d[j][0] += dx * f; d[j][1] += dy * f;
      } });
      for (let i = 0; i < n; i++) { const m = Math.max(Math.hypot(d[i][0], d[i][1]), 1e-9), s = Math.min(m, t) / m; pos[i][0] += d[i][0] * s; pos[i][1] += d[i][1] * s; }
    }
    return pos;
  }

  function analizar(red, P, rand42) {
    const { A, nombres, grado } = red, n = nombres.length, adj = listaAdyacencia(A);
    const completo = N_SORTEOS * n <= rand42.length;
    const u = rand42.slice();
    if (!completo) { const g = N.crearRng(4242); while (u.length < N_SORTEOS * n) u.push(g()); }
    const inter = intermediacion(adj).map(redondear9);
    const cerc = adj.map(function (_, s) {
      const d = distanciasDesde(adj, s); const alc = d.filter((x, i) => x > 0);
      return redondear9(alc.length ? alc.length / N.suma(alc) : 0);
    });
    const medidas = [grado, inter, cerc];
    const adopCentral = [], adopPerif = [], semillasC = [];
    for (let c = 0; c < 3; c++) {
      const orden = ordenDescendente(medidas[c]);
      semillasC.push(orden.slice(0, P.nSemillas));
      adopCentral.push(pct(simularCascada(A, grado, semillasC[c], P.umbral).adopt));
      adopPerif.push(pct(simularCascada(A, grado, orden.slice(n - P.nSemillas), P.umbral).adopt));
    }
    const azar = [];
    for (let s = 0; s < N_SORTEOS; s++) {
      const v = u.slice(s * n, (s + 1) * n);
      const ord = v.map((x, i) => i).sort((a, b) => v[a] - v[b] || a - b);
      azar.push(pct(simularCascada(A, grado, ord.slice(0, P.nSemillas), P.umbral).adopt));
    }
    const promAzar = N.media(azar), crit = P.criterio - 1;
    const elegida = simularCascada(A, grado, semillasC[crit], P.umbral);
    let mejor = 0; adopCentral.forEach((a, i) => { if (a > adopCentral[mejor]) mejor = i; });
    const ordG = ordenDescendente(grado), ordI = ordenDescendente(inter);
    const m5 = Math.min(5, n), top5g = ordG.slice(0, m5), top5i = ordI.slice(0, m5);
    const coinciden = top5g.filter(x => top5i.indexOf(x) >= 0).length;
    // componentes conexas
    const comp = new Array(n).fill(-1); let nComp = 0, mayor = 0;
    for (let s = 0; s < n; s++) { if (comp[s] >= 0) continue; const d = distanciasDesde(adj, s); let tam = 0; d.forEach((x, i) => { if (x >= 0) { comp[i] = nComp; tam++; } }); mayor = Math.max(mayor, tam); nComp++; }
    const nom = i => nombres[i];
    const L = [];
    L.push(N.sprintf('=== Resultados con %d personas, %d conexiones, nSemillas=%d, umbral=%.2f, criterio=%s ===', n, red.lista.length, P.nSemillas, P.umbral, MEDIDAS[crit]));
    L.push(N.sprintf('Grado: máximo=%d, promedio=%.2f · componentes conexas: %d (la mayor, %d personas)', Math.max.apply(null, grado), N.media(grado), nComp, mayor));
    L.push('Las 5 personas con más conexiones (grado):   ' + top5g.map(nom).join(', '));
    L.push('Las 5 personas con más intermediación:       ' + top5i.map(nom).join(', '));
    L.push(N.sprintf('Coinciden en las dos listas: %d de %d', coinciden, m5));
    L.push('');
    L.push(N.sprintf('Cascada por umbral (%.0f%% de los contactos), %d semillas:', 100 * P.umbral, P.nSemillas));
    L.push(N.sprintf('  %-20s %12s %12s', 'Criterio de semillas', 'Centrales', 'Periféricas'));
    for (let c = 0; c < 3; c++) L.push(N.sprintf('  %-20s %11.1f%% %11.1f%%', MEDIDAS[c], adopCentral[c], adopPerif[c]));
    L.push(N.sprintf('  %-20s %11.1f%% (promedio de %d sorteos)', 'Al azar', promAzar, N_SORTEOS));
    L.push('');
    L.push(N.sprintf('Con el criterio elegido (%s): adopción final %.1f%% en %d rondas', MEDIDAS[crit], pct(elegida.adopt), elegida.rondas));
    L.push('Semillas elegidas: ' + semillasC[crit].map(nom).join(', '));
    L.push(N.sprintf('Mejor criterio de los tres: %s', MEDIDAS[mejor]));
    const avisos = red.avisos.slice();
    if (!completo) avisos.push('Esta red necesita más números aleatorios de los exportados de MATLAB: los 100 sorteos ya no son idénticos a los del script.');
    if (nComp > 1) avisos.push('La red tiene ' + nComp + ' componentes conexas: una cascada no puede cruzar de una a otra, y la cercanía se calcula solo dentro de cada componente.');
    return { n, nConexiones: red.lista.length, grado, inter, cerc, semillasC, elegida, adopCentral, adopPerif, promAzar, azar, mejor, top5g, top5i, coinciden, nComp, mayor, consola: L.join('\n'), avisos,
      metricas: { nPersonas: n, nConexiones: red.lista.length, gradoMax: Math.max.apply(null, grado), gradoProm: N.media(grado), nComp, mayorComp: mayor, coinciden,
        adopGrado: adopCentral[0], adopInter: adopCentral[1], adopCerc: adopCentral[2], perifGrado: adopPerif[0], perifInter: adopPerif[1], perifCerc: adopPerif[2],
        promedioAzar: promAzar, adopFinal: pct(elegida.adopt), rondas: elegida.rondas, mejorCriterio: MEDIDAS[mejor], maxInter: Math.max.apply(null, inter) } };
  }

  const M = { LIMITES, DEFECTO, MEDIDAS, leerRed, analizar, disposicion, listaAdyacencia };
  if (esNode) module.exports = M; else raiz.Cap08Datos = M;
})(this);
