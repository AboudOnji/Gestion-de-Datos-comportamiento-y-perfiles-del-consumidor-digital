/* modelos/cap02.js — equivalente de cap02_segmentacion.m (k-means vs. fuzzy
   c-means). Los datos sintéticos se generan con el MISMO flujo de randn que
   MATLAB tras rng(42), así que son idénticos a los del script. */
(function (raiz) {
  'use strict';
  const N = (typeof module === 'object' && module.exports) ? require('../numerico.js') : raiz.Numerico;

  const DEFECTO = {
    centrosTipicos: [[1.5, 350, 25], [4.0, 900, 78], [2.6, 600, 52]],
    dispersionTipica: [[0.6, 90, 10], [0.9, 150, 12], [0.8, 120, 14]],
    nClientesPorSegmento: 80
  };
  const NOMBRES_VARIABLES = ['Frecuencia mensual', 'Ticket promedio', 'Engagement digital'];

  function ejecutar(P, randnExportado) {
    const C0 = P.centrosTipicos, D0 = P.dispersionTipica, n = P.nClientesPorSegmento;
    const k = C0.length;
    const flujo = N.flujoRandn(randnExportado, k * n * 3);
    const z = flujo.valores;

    // datos: cada bloque = centro + randn(n,3).*dispersion (orden por columnas)
    const datos = [];
    let off = 0;
    for (let s = 0; s < k; s++) {
      for (let i = 0; i < n; i++) {
        datos.push([0, 1, 2].map(j => C0[s][j] + z[off + j * n + i] * D0[s][j]));
      }
      off += 3 * n;
    }
    const nTot = datos.length;
    const col = j => datos.map(r => r[j]);
    const mu = [0, 1, 2].map(j => N.media(col(j)));
    const sd = [0, 1, 2].map(j => N.desvest(col(j)));
    const X = datos.map(r => r.map((v, j) => (v - mu[j]) / sd[j]));

    // k-means (Replicates 20) + silueta
    const km = N.kmeans(X, k, 20, 42);
    const sil = N.silhouette(X, km.etiqueta);
    const silProm = N.media(sil);

    // fuzzy c-means (m = 2, 100 iteraciones, tol 1e-5)
    const fc = N.fcm(X, k, 2.0, 100, 1e-5, 42);
    const umax = X.map((_, i) => Math.max.apply(null, fc.U.map(f => f[i])));
    const ambiguos = N.media(umax.map(u => u < 0.6 ? 1 : 0));

    // perfiles para el radar: centros fcm en unidades originales, normalizados min-max
    const minD = [0, 1, 2].map(j => Math.min.apply(null, col(j)));
    const maxD = [0, 1, 2].map(j => Math.max.apply(null, col(j)));
    const perfiles = fc.centros.map(c => c.map((v, j) => ((v * sd[j] + mu[j]) - minD[j]) / (maxD[j] - minD[j])));
    const centrosOriginales = fc.centros.map(c => c.map((v, j) => v * sd[j] + mu[j]));

    const L = [];
    L.push(N.sprintf('=== Resultados con %d arquetipos, %d clientes por segmento (n total=%d) ===', k, n, nTot));
    L.push(N.sprintf('k-means: silueta promedio = %.3f', silProm));
    L.push(N.sprintf('Fuzzy c-means: %.1f%% de los consumidores no tiene pertenencia dominante (<60%%) a ningún segmento', 100 * ambiguos));

    const avisos = [];
    if (!flujo.completo) avisos.push('Con este tamaño de muestra se agotaron los números aleatorios exportados de MATLAB: los datos ya no son idénticos a los del script (los resultados siguen siendo válidos para comparar).');

    return {
      consola: L.join('\n'), avisos, k, n, X, datos, km, sil, silProm, fc, umax, ambiguos, perfiles, centrosOriginales,
      metricas: { k, n, nTot, silProm, pctAmbiguos: 100 * ambiguos }
    };
  }

  // Complemento de la app (no está en el .m): suma de distancias intra-cluster
  // de k-means para k = 1..kMax, para discutir el criterio del codo.
  function codo(X, kMax) {
    const salida = [];
    for (let k = 1; k <= kMax; k++) salida.push({ k, suma: N.kmeans(X, k, 5, 7).sumaDistancias });
    return salida;
  }

  const M = { DEFECTO, NOMBRES_VARIABLES, ejecutar, codo };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.Cap02 = M;
})(this);
