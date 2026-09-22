/* modelos/cap01.js — equivalente de cap01_difusion_bass.m (modelo de Bass).
   Misma fórmula cerrada, misma rejilla de tiempo y mismas salidas impresas. */
(function (raiz) {
  'use strict';
  const N = (typeof module === 'object' && module.exports) ? require('../numerico.js') : raiz.Numerico;

  const DEFECTO = { p: 0.03, q: 0.38, m: 1, tFinal: 20 };

  function ejecutar(P) {
    const p = P.p, q = P.q, m = P.m, tFinal = P.tFinal;
    // t = (0:0.05:tFinal)'
    const nT = Math.floor(tFinal / 0.05 + 1e-10) + 1;
    const t = Array.from({ length: nT }, (_, i) => i * 0.05);
    const F = t.map(ti => (1 - Math.exp(-(p + q) * ti)) / (1 + (q / p) * Math.exp(-(p + q) * ti)));
    const acum = F.map(f => m * f);
    const tasa = acum.map((a, i) => i === 0 ? 0 : (a - acum[i - 1]) / (t[i] - t[i - 1]));
    const tPico = Math.log(q / p) / (p + q);
    const enPico = (tPico >= 0 && tPico <= t[nT - 1]) ? N.interp1(t, acum, tPico) : NaN;
    const tasaMax = Math.max.apply(null, tasa);

    const L = [];
    L.push(N.sprintf('=== Resultados con p=%.3f, q=%.3f, m=%.2f, tFinal=%d ===', p, q, m, tFinal));
    L.push(N.sprintf('Pico de adopción en t* = %.2f periodos (%.1f%% del mercado adoptado)', tPico, 100 * enPico));
    L.push(N.sprintf('Adopción acumulada al final del periodo simulado: %.1f%% del mercado potencial', 100 * acum[nT - 1]));
    L.push(N.sprintf('Tasa de adopción máxima: %.4f (fracción del mercado por periodo)', tasaMax));

    const avisos = [];
    if (!(q > p)) avisos.push('Con q ≤ p el modelo no tiene pico interior (t* ≤ 0): la tasa de adopción es máxima desde el lanzamiento. MATLAB imprime NaN en este caso.');
    else if (tPico > tFinal) avisos.push('El pico ocurre después de tFinal: amplíen tFinal para verlo (MATLAB imprime NaN).');

    return {
      consola: L.join('\n'), avisos, t, acum, tasa, tPico, enPico,
      // pct20: % adoptado al periodo 20 (lo pide el cuadro del ejercicio propuesto)
      metricas: { p, q, m, tFinal, tPico, pctPico: 100 * enPico, pct20: tFinal >= 20 ? 100 * N.interp1(t, acum, 20) : NaN,
        pctFinal: 100 * acum[nT - 1], tasaMax }
    };
  }

  const M = { DEFECTO, ejecutar };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.Cap01 = M;
})(this);
