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

  // Análisis común (script y datos propios): estandarización z-score,
  // k-means (Replicates 20) + silueta y fuzzy c-means (m = 2, 100 iter.,
  // tol 1e-5), como en cap02_segmentacion.m. datos = filas x variables.
  function analizar(datos, k) {
    const d = datos[0].length;
    const idxVar = Array.from({ length: d }, (_, j) => j);
    const col = j => datos.map(r => r[j]);
    const mu = idxVar.map(j => N.media(col(j)));
    const sd = idxVar.map(j => N.desvest(col(j)));
    const X = datos.map(r => r.map((v, j) => (v - mu[j]) / sd[j]));

    const km = N.kmeans(X, k, 20, 42);
    const sil = N.silhouette(X, km.etiqueta);
    const silProm = N.media(sil);

    const fc = N.fcm(X, k, 2.0, 100, 1e-5, 42);
    const umax = X.map((_, i) => Math.max.apply(null, fc.U.map(f => f[i])));
    const ambiguos = N.media(umax.map(u => u < 0.6 ? 1 : 0));

    // perfiles para el radar: centros fcm en unidades originales, normalizados min-max
    const minD = idxVar.map(j => Math.min.apply(null, col(j)));
    const maxD = idxVar.map(j => Math.max.apply(null, col(j)));
    const centrosOriginales = fc.centros.map(c => c.map((v, j) => v * sd[j] + mu[j]));
    const perfiles = centrosOriginales.map(c => c.map((v, j) => (v - minD[j]) / (maxD[j] - minD[j])));
    return { X, mu, sd, km, sil, silProm, fc, umax, ambiguos, minD, maxD, perfiles, centrosOriginales };
  }

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
    const A = analizar(datos, k);
    const silProm = A.silProm, ambiguos = A.ambiguos;
    const X = A.X, km = A.km, sil = A.sil, fc = A.fc, umax = A.umax, perfiles = A.perfiles, centrosOriginales = A.centrosOriginales;

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

  // App de datos propios: los arquetipos los define el usuario (unidades
  // originales, filas = arquetipos) y los datos vienen de su Excel. Compara
  // (1) arquetipos FIJOS: cada cliente al arquetipo más cercano + pertenencia
  //     difusa a los arquetipos tal como se definieron, contra
  // (2) segmentos AJUSTADOS: k-means (kmeans(...,'Start',C)) y fuzzy c-means
  //     que arrancan en los arquetipos y se ajustan a los datos.
  // Todo en variables estandarizadas con la media y desviación de los datos.
  function analizarConArquetipos(datos, arquetipos) {
    const k = arquetipos.length, d = datos[0].length;
    const idxVar = Array.from({ length: d }, (_, j) => j);
    const col = j => datos.map(r => r[j]);
    const mu = idxVar.map(j => N.media(col(j)));
    const sd = idxVar.map(j => N.desvest(col(j)));
    const z = r => r.map((v, j) => (v - mu[j]) / sd[j]);
    const original = r => r.map((v, j) => v * sd[j] + mu[j]);
    const X = datos.map(z);
    const Cz = arquetipos.map(z);
    const tam = et => Array.from({ length: k }, (_, s) => et.filter(e => e === s + 1).length);
    const siluetaSegura = et => (new Set(et)).size >= 2 ? N.media(N.silhouette(X, et)) : NaN;
    const umaxDe = U => X.map((_, i) => Math.max.apply(null, U.map(f => f[i])));
    const argmax = U => X.map((_, i) => { let b = 0; for (let s = 1; s < k; s++) if (U[s][i] > U[b][i]) b = s; return b + 1; });

    // (1) fijos
    const etFijo = N.masCercano(X, Cz);
    const Ufijo = N.pertenencia(X, Cz, 2.0);
    const umaxFijo = umaxDe(Ufijo);
    const fijo = {
      etiqueta: etFijo, tam: tam(etFijo), silProm: siluetaSegura(etFijo),
      U: Ufijo, umax: umaxFijo, ambiguos: N.media(umaxFijo.map(u => u < 0.6 ? 1 : 0))
    };

    // (2) ajustados
    const km = N.kmeans(X, k, 1, 42, Cz);
    const fc = N.fcm(X, k, 2.0, 100, 1e-5, 42, Cz);
    const umaxAj = umaxDe(fc.U);
    const ajustado = {
      etiqueta: km.etiqueta, tam: tam(km.etiqueta), silProm: siluetaSegura(km.etiqueta),
      centrosKmeans: km.centros.map(original), centrosFCM: fc.centros.map(original), centrosZ: fc.centros,
      U: fc.U, umax: umaxAj, perfil: argmax(fc.U), ambiguos: N.media(umaxAj.map(u => u < 0.6 ? 1 : 0))
    };
    // desplazamiento de cada arquetipo (distancia estandarizada, centro FCM)
    const desplazamiento = Cz.map((c, s) => Math.sqrt(c.reduce((t, v, j) => t + (v - fc.centros[s][j]) ** 2, 0)));
    const cambian = etFijo.filter((e, i) => e !== km.etiqueta[i]).length;

    const minD = idxVar.map(j => Math.min.apply(null, col(j)));
    const maxD = idxVar.map(j => Math.max.apply(null, col(j)));
    const norm = r => r.map((v, j) => (v - minD[j]) / (maxD[j] - minD[j]));
    return {
      X, Cz, mu, sd, fijo, ajustado, desplazamiento, cambian,
      perfilesDefinidos: arquetipos.map(norm), perfilesAjustados: ajustado.centrosFCM.map(norm)
    };
  }

  // Complemento de la app (no está en el .m): suma de distancias intra-cluster
  // de k-means para k = 1..kMax, para discutir el criterio del codo. Con
  // conSilueta, agrega la silueta promedio de cada k >= 2 (costo O(n^2)).
  function codo(X, kMax, conSilueta) {
    const salida = [];
    for (let k = 1; k <= kMax; k++) {
      const km = N.kmeans(X, k, 5, 7);
      const fila = { k, suma: km.sumaDistancias };
      if (conSilueta && k >= 2) fila.silueta = N.media(N.silhouette(X, km.etiqueta));
      salida.push(fila);
    }
    return salida;
  }

  const M = { DEFECTO, NOMBRES_VARIABLES, analizar, analizarConArquetipos, ejecutar, codo };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.Cap02 = M;
})(this);
