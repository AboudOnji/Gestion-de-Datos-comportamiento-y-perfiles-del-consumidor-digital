/* modelos/cap08.js — equivalente de cap08_red_influencia.m (red social con
   comunidades, centralidad y cascada por umbral). Usa el MISMO flujo de rand
   que MATLAB tras rng(42) (datos/rand42.json). */
(function (raiz) {
  'use strict';
  const N = (typeof module === 'object' && module.exports) ? require('../numerico.js') : raiz.Numerico;

  const DEFECTO = { nNodos: 60, nComunidades: 3, pDentro: 0.20, pEntre: 0.01, nSemillas: 3, umbral: 0.25, criterio: 1 };
  const MEDIDAS = ['grado', 'intermediación', 'cercanía'];
  const N_SORTEOS = 100;

  const redondear9 = x => Math.round(x * 1e9) / 1e9;

  function construirRed(P, u) {
    const n = P.nNodos;
    const grupo = Array.from({ length: n }, (_, i) => Math.ceil((i + 1) * P.nComunidades / n));
    const A = Array.from({ length: n }, () => new Array(n).fill(false));
    for (let i = 0; i < n - 1; i++) if (grupo[i] === grupo[i + 1]) A[i][i + 1] = true;
    for (let g = 1; g < P.nComunidades; g++) {
      let ultimo = -1; grupo.forEach((x, i) => { if (x === g) ultimo = i; });
      A[ultimo][ultimo + 1] = true;
    }
    let k = 0;
    for (let j = 1; j < n; j++) {
      for (let i = 0; i < j; i++) {
        const p = grupo[i] === grupo[j] ? P.pDentro : P.pEntre;
        if (u[k++] < p) A[i][j] = true;
      }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (A[i][j]) A[j][i] = true;
    return { A, grupo, consumidos: k };
  }

  function listaAdyacencia(A) { return A.map(f => f.map((v, j) => (v ? j : -1)).filter(j => j >= 0)); }

  // Brandes (2001), no dirigida y sin normalizar; cada par se cuenta una vez.
  function intermediacion(adj) {
    const n = adj.length, C = new Array(n).fill(0);
    for (let s = 0; s < n; s++) {
      const pila = [], pred = Array.from({ length: n }, () => []);
      const sigma = new Array(n).fill(0), dist = new Array(n).fill(-1);
      sigma[s] = 1; dist[s] = 0;
      const cola = [s];
      for (let h = 0; h < cola.length; h++) {
        const v = cola[h]; pila.push(v);
        adj[v].forEach(function (w) {
          if (dist[w] < 0) { dist[w] = dist[v] + 1; cola.push(w); }
          if (dist[w] === dist[v] + 1) { sigma[w] += sigma[v]; pred[w].push(v); }
        });
      }
      const delta = new Array(n).fill(0);
      while (pila.length) {
        const w = pila.pop();
        pred[w].forEach(v => { delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]); });
        if (w !== s) C[w] += delta[w];
      }
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
      for (let i = 0; i < n; i++) {
        if (adopt[i]) continue;
        let c = 0; for (let j = 0; j < n; j++) if (A[i][j] && adopt[j]) c++;
        if (c / grado[i] >= umbral) nuevos.push(i);
      }
      if (!nuevos.length) break;
      nuevos.forEach(i => { adopt[i] = true; });
      rondas = ronda; porRonda.push(adopt.filter(Boolean).length / n);
    }
    return { adopt, rondas, porRonda };
  }

  // sort 'descend' estable de MATLAB: devuelve los índices (0-based)
  const ordenDescendente = v => v.map((x, i) => i).sort((a, b) => v[b] - v[a] || a - b);
  const pct = a => 100 * a.filter(Boolean).length / a.length;

  function ejecutar(P, rand42) {
    const n = P.nNodos;
    const necesarios = n * (n - 1) / 2 + N_SORTEOS * n;
    const completo = necesarios <= rand42.length;
    // si faltan números exportados se completa con un generador propio (y se avisa)
    const u = rand42.slice();
    if (!completo) { const g = N.crearRng(4242); while (u.length < necesarios) u.push(g()); }
    const red = construirRed(P, u);
    const A = red.A, adj = listaAdyacencia(A);
    const grado = adj.map(l => l.length);
    const inter = intermediacion(adj).map(redondear9);
    const cerc = adj.map((_, s) => { const d = distanciasDesde(adj, s); return redondear9((n - 1) / N.suma(d)); });
    const medidas = [grado, inter, cerc];

    const adopCentral = [], adopPerif = [], rondasC = [], semillasC = [];
    for (let c = 0; c < 3; c++) {
      const orden = ordenDescendente(medidas[c]);
      semillasC.push(orden.slice(0, P.nSemillas));
      const r = simularCascada(A, grado, semillasC[c], P.umbral);
      adopCentral.push(pct(r.adopt)); rondasC.push(r.rondas);
      adopPerif.push(pct(simularCascada(A, grado, orden.slice(n - P.nSemillas), P.umbral).adopt));
    }
    const azar = []; let pos = red.consumidos;
    for (let s = 0; s < N_SORTEOS; s++) {
      const v = u.slice(pos, pos + n); pos += n;
      const ord = v.map((x, i) => i).sort((a, b) => v[a] - v[b] || a - b); // sort ascendente
      azar.push(pct(simularCascada(A, grado, ord.slice(0, P.nSemillas), P.umbral).adopt));
    }
    const promAzar = N.media(azar);
    const crit = P.criterio - 1;
    const elegida = simularCascada(A, grado, semillasC[crit], P.umbral);
    const adopFinal = pct(elegida.adopt);
    let mejor = 0; adopCentral.forEach((a, i) => { if (a > adopCentral[mejor]) mejor = i; });

    const ordGrado = ordenDescendente(grado), ordInter = ordenDescendente(inter);
    const top5g = ordGrado.slice(0, Math.min(5, n)), top5i = ordInter.slice(0, Math.min(5, n));
    const coinciden = top5g.filter(x => top5i.indexOf(x) >= 0).length;
    const nAristas = N.suma(grado) / 2;
    // num2str de un vector de enteros: columnas de ancho (dígitos máximos + 2), sin espacios iniciales
    const f1 = a => { const t = a.map(x => String(x + 1)); const w = Math.max.apply(null, t.map(x => x.length)) + 2; return t.map(x => x.padStart(w)).join('').trim(); };

    const L = [];
    L.push(N.sprintf('=== Resultados con nNodos=%d, nComunidades=%d, pDentro=%.2f, pEntre=%.2f, nSemillas=%d, umbral=%.2f, criterio=%s ===',
      P.nNodos, P.nComunidades, P.pDentro, P.pEntre, P.nSemillas, P.umbral, MEDIDAS[crit]));
    L.push('');
    L.push(N.sprintf('Red: %d personas, %d conexiones. Grado: máximo=%d, promedio=%.2f', n, nAristas, Math.max.apply(null, grado), N.media(grado)));
    L.push('Las 5 personas con más conexiones (grado):         ' + f1(top5g));
    L.push('Las 5 personas con más intermediación:             ' + f1(top5i));
    L.push(N.sprintf('Coinciden en las dos listas: %d de 5', coinciden));
    L.push('');
    L.push(N.sprintf('Cascada por umbral (%.0f%% de los contactos), %d semillas:', 100 * P.umbral, P.nSemillas));
    L.push(N.sprintf('  %-20s %12s %12s', 'Criterio de semillas', 'Centrales', 'Periféricas'));
    for (let c = 0; c < 3; c++) L.push(N.sprintf('  %-20s %11.1f%% %11.1f%%', MEDIDAS[c], adopCentral[c], adopPerif[c]));
    L.push(N.sprintf('  %-20s %11.1f%% (promedio de %d sorteos)', 'Al azar', promAzar, N_SORTEOS));
    L.push('');
    L.push(N.sprintf('Con el criterio elegido (%s): adopción final %.1f%% en %d rondas', MEDIDAS[crit], adopFinal, elegida.rondas));
    L.push(N.sprintf('Mejor criterio de los tres: %s', MEDIDAS[mejor]));

    const avisos = [];
    if (!completo) avisos.push('Esta combinación necesita más números aleatorios de los exportados de MATLAB: la red y los sorteos ya no son idénticos a los del script.');
    return {
      consola: L.join('\n'), avisos, A, adj, grupo: red.grupo, grado, inter, cerc, semillasC, elegida, adopCentral, adopPerif, promAzar, azar,
      metricas: {
        nNodos: n, nComunidades: P.nComunidades, pDentro: P.pDentro, pEntre: P.pEntre, nSemillas: P.nSemillas, umbral: P.umbral, criterio: P.criterio,
        nConexiones: nAristas, gradoMax: Math.max.apply(null, grado), gradoProm: N.media(grado), coinciden,
        adopGrado: adopCentral[0], adopInter: adopCentral[1], adopCerc: adopCentral[2],
        perifGrado: adopPerif[0], perifInter: adopPerif[1], perifCerc: adopPerif[2],
        promedioAzar: promAzar, adopFinal, rondas: elegida.rondas, mejorCriterio: MEDIDAS[mejor], maxInter: Math.max.apply(null, inter)
      }
    };
  }

  const M = { DEFECTO, MEDIDAS, ejecutar };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.Cap08 = M;
})(this);
