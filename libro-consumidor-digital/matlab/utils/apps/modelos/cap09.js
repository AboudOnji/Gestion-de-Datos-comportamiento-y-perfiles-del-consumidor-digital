/* modelos/cap09.js — equivalente de cap09_seleccion_plataforma.m (AHP + TOPSIS).
   Determinista. El vector propio principal se obtiene por iteración de
   potencias (equivale a eig de MATLAB en matrices positivas recíprocas). */
(function (raiz) {
  'use strict';
  const N = (typeof module === 'object' && module.exports) ? require('../numerico.js') : raiz.Numerico;

  const DEFECTO = { cobVsPriv: 2, cobVsInterop: 3, cobVsCosto: 3, privVsInterop: 2, privVsCosto: 2, interopVsCosto: 1 };
  const ALTERNATIVAS = ['Analítica web básica', 'Mapas de calor y sesiones', 'Analítica de embudo', 'Plataforma de datos de clientes', 'Suite todo en uno'];
  const CORTAS = ['Web básica', 'Mapas calor', 'Embudo', 'CDP', 'Suite'];
  const CRITERIOS = ['Cobertura', 'Privacidad', 'Interoperabilidad', 'Costo'];
  const X = [[6, 5, 8, 20], [5, 4, 5, 60], [8, 6, 7, 180], [9, 8, 9, 600], [7, 7, 4, 350]];
  const ES_COSTO = [false, false, false, true];
  const RI4 = 0.90;

  // equivalente de %.3g para valores entre 0.1 y 999
  const g3 = x => String(parseFloat(Number(x).toPrecision(3)));

  function ahp(j) {
    const n = 4;
    const A = N.identidad(n);
    A[0][1] = j[0]; A[0][2] = j[1]; A[0][3] = j[2]; A[1][2] = j[3]; A[1][3] = j[4]; A[2][3] = j[5];
    for (let i = 0; i < n; i++) for (let k = i + 1; k < n; k++) A[k][i] = 1 / A[i][k];
    let v = new Array(n).fill(1 / n), lambda = n;
    for (let it = 0; it < 20000; it++) {
      const Av = N.matvec(A, v);
      const s = N.suma(Av);
      const nv = Av.map(x => x / s);
      const dif = Math.max.apply(null, nv.map((x, i) => Math.abs(x - v[i])));
      v = nv;
      if (dif < 1e-15) break;
    }
    const Av = N.matvec(A, v);
    lambda = N.media(Av.map((x, i) => x / v[i]));
    const ci = (lambda - n) / (n - 1);
    return { A, pesos: v, lambda, ci, cr: ci / RI4 };
  }

  function topsis(w) {
    const nA = X.length, nC = 4;
    const norma = [0, 1, 2, 3].map(c => Math.sqrt(N.suma(X.map(f => f[c] * f[c]))));
    const Vp = X.map(f => f.map((x, c) => (x / norma[c]) * w[c]));
    const mejor = [], peor = [];
    for (let c = 0; c < nC; c++) {
      const col = Vp.map(f => f[c]);
      const mx = Math.max.apply(null, col), mn = Math.min.apply(null, col);
      mejor.push(ES_COSTO[c] ? mn : mx); peor.push(ES_COSTO[c] ? mx : mn);
    }
    const cercania = Vp.map(function (f) {
      const dM = Math.sqrt(N.suma(f.map((x, c) => (x - mejor[c]) * (x - mejor[c]))));
      const dP = Math.sqrt(N.suma(f.map((x, c) => (x - peor[c]) * (x - peor[c]))));
      return dP / (dM + dP);
    });
    const orden = cercania.map((_, i) => i).sort((a, b) => cercania[b] - cercania[a] || a - b);
    return { cercania, orden };
  }

  function ejecutar(P) {
    const j = [P.cobVsPriv, P.cobVsInterop, P.cobVsCosto, P.privVsInterop, P.privVsCosto, P.interopVsCosto];
    const a = ahp(j);
    const t = topsis(a.pesos);
    const ti = topsis([0.25, 0.25, 0.25, 0.25]);
    const ganadorAHP = t.orden[0], ganadorIguales = ti.orden[0];
    const consistente = a.cr < 0.10;

    const rejilla = [], ganadorBarrido = [], cercaniaBarrido = [];
    const sr = N.suma(a.pesos.slice(0, 3));
    const resto = a.pesos.slice(0, 3).map(x => x / sr);
    for (let i = 0; i <= 100; i++) {
      const wc = i / 100;
      const w = resto.map(x => (1 - wc) * x).concat([wc]);
      const r = topsis(w);
      let g = 0; r.cercania.forEach((v, k) => { if (v > r.cercania[g]) g = k; });
      rejilla.push(wc); ganadorBarrido.push(g); cercaniaBarrido.push(r.cercania);
    }
    let nCambios = 0;
    for (let i = 1; i < ganadorBarrido.length; i++) if (ganadorBarrido[i] !== ganadorBarrido[i - 1]) nCambios++;

    const L = [];
    L.push('=== Resultados con juicios [' + j.map(g3).join(' ') + '] ===');
    L.push('');
    L.push('AHP — pesos de los criterios:');
    CRITERIOS.forEach((c, i) => L.push(N.sprintf('  %-18s %.3f', c, a.pesos[i])));
    L.push(N.sprintf('  lambda máximo = %.3f, índice de consistencia = %.4f, razón de consistencia = %.3f', a.lambda, a.ci, a.cr));
    L.push(consistente ? '  Los juicios son consistentes (razón < 0.10).'
      : '  Los juicios NO son consistentes (razón >= 0.10): revisen las comparaciones antes de confiar en los pesos.');
    L.push('');
    L.push('TOPSIS con los pesos de AHP (más cerca de 1 = mejor):');
    t.orden.forEach((g, i) => L.push(N.sprintf('  %d. %-32s %.3f', i + 1, ALTERNATIVAS[g], t.cercania[g])));
    L.push(N.sprintf('  Elige: %s', ALTERNATIVAS[ganadorAHP]));
    L.push('');
    L.push('TOPSIS con pesos iguales (ignora los juicios):');
    L.push(N.sprintf('  Elige: %s', ALTERNATIVAS[ganadorIguales]));
    L.push(ganadorAHP === ganadorIguales ? '  Coincide con la elección con pesos AHP.'
      : '  NO coincide: los juicios sobre la importancia de los criterios cambian la elección.');
    L.push('');
    L.push(N.sprintf('Barrido del peso del costo (0 a 1): el ganador cambia %d vez(veces)', nCambios));
    let inicio = 0;
    for (let i = 1; i <= rejilla.length; i++) {
      if (i === rejilla.length || ganadorBarrido[i] !== ganadorBarrido[inicio]) {
        L.push(N.sprintf('  %-32s de %.2f a %.2f', ALTERNATIVAS[ganadorBarrido[inicio]], rejilla[inicio], rejilla[i - 1]));
        inicio = i;
      }
    }
    const avisos = [];
    if (!consistente) avisos.push('La razón de consistencia es ≥ 0.10: los juicios se contradicen entre sí. Revisen las comparaciones antes de confiar en los pesos.');
    return {
      consola: L.join('\n'), avisos, ahp: a, t, ti, rejilla, ganadorBarrido, cercaniaBarrido, ganadorAHP, ganadorIguales,
      metricas: {
        cobVsPriv: P.cobVsPriv, cobVsInterop: P.cobVsInterop, cobVsCosto: P.cobVsCosto, privVsInterop: P.privVsInterop,
        privVsCosto: P.privVsCosto, interopVsCosto: P.interopVsCosto,
        pesoCobertura: a.pesos[0], pesoPrivacidad: a.pesos[1], pesoInterop: a.pesos[2], pesoCosto: a.pesos[3],
        lambdaMax: a.lambda, cr: a.cr, consistente: consistente ? 'sí' : 'no',
        ganadorAHP: ALTERNATIVAS[ganadorAHP], cercaniaGanador: t.cercania[ganadorAHP], ganadorIguales: ALTERNATIVAS[ganadorIguales], nCambios
      }
    };
  }

  const M = { DEFECTO, ALTERNATIVAS, CORTAS, CRITERIOS, X, ES_COSTO, ejecutar, ahp, topsis };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.Cap09 = M;
})(this);
