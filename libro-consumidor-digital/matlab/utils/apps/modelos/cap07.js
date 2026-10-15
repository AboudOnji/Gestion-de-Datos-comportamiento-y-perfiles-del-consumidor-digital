/* modelos/cap07.js — equivalente de cap07_journey_markov.m (recorrido como
   cadena de Markov: etapas + atribución entre canales). Determinista. */
(function (raiz) {
  'use strict';
  const N = (typeof module === 'object' && module.exports) ? require('../numerico.js') : raiz.Numerico;

  const DEFECTO = { pAvanzar: 0.30, pRetroceder: 0.10, pAbandonar: 0.15, inicioRedes: 0.40, convBusqueda: 0.30, convDirecto: 0.35 };
  const ETAPAS = ['Atención', 'Interés', 'Deseo'];
  const CANALES = ['Búsqueda', 'Redes sociales', 'Correo', 'Directo'];
  const QC = [[0.10, 0.05, 0.10, 0.15], [0.30, 0.15, 0.05, 0.05], [0.15, 0.05, 0.05, 0.25], [0.05, 0.00, 0.05, 0.10]];
  const BASE_INICIO = [0.35, 0.40, 0.10, 0.15];
  const K = 30;

  function cadenaEtapas(pa, pr, pb) {
    const Q = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], R = [[0, 0], [0, 0], [0, 0]];
    for (let i = 0; i < 3; i++) {
      if (i < 2) Q[i][i + 1] = pa; else R[i][0] = pa;
      if (i > 0) Q[i][i - 1] = pr;
      R[i][1] = pb;
      Q[i][i] = 1 - pa - pb - (i > 0 ? pr : 0);
    }
    const I = N.identidad(3);
    const Nf = N.inv(I.map((f, i) => f.map((x, j) => x - Q[i][j])));
    const r = R.map(f => f[0]);
    const Nr = N.matvec(Nf, r);
    const pConv = Nr[0];
    const pasos = Nf[0].reduce((s, x) => s + x, 0);
    const pasosConv = N.matvec(Nf, Nr)[0] / pConv;
    const cum = [0]; let v = [1, 0, 0];
    for (let k = 1; k <= K; k++) {
      cum.push(cum[k - 1] + v.reduce((s, x, i) => s + x * r[i], 0));
      v = N.vecmat(v, Q);
    }
    return { pConv, pasos, pasosConv, cum, Q, R };
  }

  function conversionDesde(pi0, rC, mantener) {
    const k = mantener.map((m, i) => (m ? i : -1)).filter(i => i >= 0);
    const Qk = k.map(i => k.map(j => QC[i][j]));
    const Nk = N.inv(N.identidad(k.length).map((f, i) => f.map((x, j) => x - Qk[i][j])));
    const w = N.vecmat(k.map(i => pi0[i]), Nk);
    return w.reduce((s, x, i) => s + x * rC[k[i]], 0);
  }

  function ejecutar(P) {
    const real = cadenaEtapas(P.pAvanzar, P.pRetroceder, P.pAbandonar);
    const lin = cadenaEtapas(P.pAvanzar, 0, P.pAbandonar);
    const kMediana = real.cum.findIndex(x => x >= 0.5 * real.pConv);
    const kMedianaLineal = lin.cum.findIndex(x => x >= 0.5 * lin.pConv);

    const rC = [P.convBusqueda, 0.02, 0.10, P.convDirecto];
    const restoBase = [BASE_INICIO[0], BASE_INICIO[2], BASE_INICIO[3]];
    const sr = N.suma(restoBase);
    const pi0 = [(1 - P.inicioRedes) * restoBase[0] / sr, P.inicioRedes, (1 - P.inicioRedes) * restoBase[1] / sr, (1 - P.inicioRedes) * restoBase[2] / sr];
    const pConvC = conversionDesde(pi0, rC, [true, true, true, true]);
    const Nc = N.inv(N.identidad(4).map((f, i) => f.map((x, j) => x - QC[i][j])));
    const visitas = N.vecmat(pi0, Nc);
    const ultimoClic = visitas.map((v, i) => v * rC[i] / pConvC);
    const valor = N.matvec(Nc, rC);
    const primerClic = pi0.map((p, i) => p * valor[i] / pConvC);
    const efecto = [0, 1, 2, 3].map(c => 1 - conversionDesde(pi0, rC, [0, 1, 2, 3].map(j => j !== c)) / pConvC);
    const se = N.suma(efecto);
    const remocion = efecto.map(e => e / se);
    let cMax = 0, mejor = -Infinity;
    remocion.forEach((r, i) => { const d = r - ultimoClic[i]; if (d > mejor) { mejor = d; cMax = i; } });

    const L = [];
    L.push(N.sprintf('=== Resultados con pAvanzar=%.2f, pRetroceder=%.2f, pAbandonar=%.2f, inicioRedes=%.2f, convBusqueda=%.2f, convDirecto=%.2f ===',
      P.pAvanzar, P.pRetroceder, P.pAbandonar, P.inicioRedes, P.convBusqueda, P.convDirecto));
    L.push('');
    L.push('Bloque 1 — Recorrido por etapas (empieza en Atención):');
    L.push(N.sprintf('  Probabilidad de convertir: %.1f%% (embudo lineal sin retrocesos: %.1f%%)', 100 * real.pConv, 100 * lin.pConv));
    L.push(N.sprintf('  Contactos esperados hasta salir del recorrido: %.2f (lineal: %.2f)', real.pasos, lin.pasos));
    L.push(N.sprintf('  Contactos esperados hasta convertir, entre quienes convierten: %.2f (lineal: %.2f)', real.pasosConv, lin.pasosConv));
    L.push(N.sprintf('  Contacto en que se alcanza la mitad de las conversiones: %d (lineal: %d)', kMediana, kMedianaLineal));
    L.push(N.sprintf('  Recorridos convertidos en 10 contactos o menos: %.1f%% (lineal: %.1f%%)', 100 * real.cum[10], 100 * lin.cum[10]));
    L.push('');
    L.push(N.sprintf('Bloque 2 — Atribución de las conversiones entre canales (probabilidad de convertir: %.1f%%):', 100 * pConvC));
    L.push(N.sprintf('  %-15s %10s %10s %12s', 'Canal', 'Ultimo clic', 'Primer clic', 'Remocion'));
    CANALES.forEach((c, i) => L.push(N.sprintf('  %-15s %9.1f%% %9.1f%% %11.1f%%', c, 100 * ultimoClic[i], 100 * primerClic[i], 100 * remocion[i])));
    L.push(N.sprintf('  El canal más subestimado por el último clic es: %s', CANALES[cMax]));

    const avisos = [];
    if (P.pRetroceder === 0) avisos.push('Con pRetroceder = 0 el recorrido es un embudo lineal: las dos curvas de la Figura 1 coinciden.');
    return {
      consola: L.join('\n'), avisos, real, lin, kMediana, kMedianaLineal, pi0, ultimoClic, primerClic, remocion, efecto, pConvC,
      metricas: {
        pAvanzar: P.pAvanzar, pRetroceder: P.pRetroceder, pAbandonar: P.pAbandonar, inicioRedes: P.inicioRedes,
        convBusqueda: P.convBusqueda, convDirecto: P.convDirecto,
        pConv: 100 * real.pConv, pConvLineal: 100 * lin.pConv, pasos: real.pasos, pasosConv: real.pasosConv,
        kMediana, pConv10: 100 * real.cum[10], pConv10Lineal: 100 * lin.cum[10], pConvCanales: 100 * pConvC,
        ultimoBusqueda: 100 * ultimoClic[0], ultimoRedes: 100 * ultimoClic[1], ultimoCorreo: 100 * ultimoClic[2], ultimoDirecto: 100 * ultimoClic[3],
        remocionBusqueda: 100 * remocion[0], remocionRedes: 100 * remocion[1], remocionCorreo: 100 * remocion[2], remocionDirecto: 100 * remocion[3],
        canalSubestimado: CANALES[cMax]
      }
    };
  }

  const M = { DEFECTO, ETAPAS, CANALES, QC, K, ejecutar, cadenaEtapas };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.Cap07 = M;
})(this);
