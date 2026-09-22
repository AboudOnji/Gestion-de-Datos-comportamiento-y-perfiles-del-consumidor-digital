/* numerico.js — funciones numéricas equivalentes a las de MATLAB que usan los
   scripts del libro. Cada función documenta a qué función de MATLAB replica y
   con qué convención (p. ej. prctile, discretize, movmean, silhouette).
   Se usa tanto en el navegador como en las pruebas de Node (pruebas/). */
(function (raiz) {
  'use strict';
  const N = {};

  /* ---------- aleatorios ---------- */

  // Generador uniforme reproducible (mulberry32). Solo se usa para
  // inicializaciones internas (k-means++, fcm), no para generar datos.
  N.crearRng = function (semilla) {
    let a = semilla >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Flujo de randn de MATLAB tras rng(42) (exportado desde MATLAB). Si se
  // piden más valores de los exportados, se completa con Box-Muller propio
  // (y se avisa, porque a partir de ahí los datos ya no coinciden con MATLAB).
  N.flujoRandn = function (exportado, cuantos) {
    const salida = new Array(cuantos);
    const n = Math.min(cuantos, exportado.length);
    for (let i = 0; i < n; i++) salida[i] = exportado[i];
    if (cuantos > exportado.length) {
      const u = N.crearRng(4242);
      for (let i = n; i < cuantos; i++) {
        const r = Math.sqrt(-2 * Math.log(1 - u()));
        salida[i] = r * Math.cos(2 * Math.PI * u());
      }
    }
    return { valores: salida, completo: cuantos <= exportado.length };
  };

  /* ---------- estadística básica ---------- */

  N.suma = a => a.reduce((s, x) => s + x, 0);
  N.media = a => N.suma(a) / a.length;
  N.desvest = function (a) { // std de MATLAB (normalización n-1)
    const m = N.media(a);
    return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1));
  };
  N.mediana = function (a) {
    const s = a.filter(x => !Number.isNaN(x)).slice().sort((x, y) => x - y);
    const n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  };

  // prctile de MATLAB (método por defecto): el dato ordenado i corresponde
  // al percentil 100*(i-0.5)/n; interpolación lineal entre ellos y valor
  // mínimo/máximo fuera de ese rango.
  N.prctile = function (a, p) {
    const s = a.slice().sort((x, y) => x - y);
    const n = s.length;
    const uno = function (pp) {
      const pos = n * pp / 100 + 0.5; // posición (base 1)
      if (pos < 1) return s[0];
      if (pos >= n) return s[n - 1];
      const i = Math.floor(pos);
      const f = pos - i;
      return s[i - 1] + f * (s[i] - s[i - 1]);
    };
    return Array.isArray(p) ? p.map(uno) : uno(p);
  };

  // discretize(x, bordes, 'IncludedEdge', 'right'): bins (b_i, b_{i+1}],
  // el primero cerrado en ambos extremos; NaN fuera del rango.
  N.discretizeDerecha = function (x, b) {
    return x.map(function (v) {
      if (Number.isNaN(v) || v < b[0] || v > b[b.length - 1]) return NaN;
      if (v === b[0]) return 1;
      for (let i = 0; i < b.length - 1; i++) if (v <= b[i + 1]) return i + 1;
      return NaN;
    });
  };

  // movmean(x, [kAtras kAdelante]) con extremos 'shrink' (valor por defecto).
  N.movmean = function (x, atras, adelante) {
    const n = x.length, y = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - atras), b = Math.min(n - 1, i + adelante);
      let s = 0;
      for (let j = a; j <= b; j++) s += x[j];
      y[i] = s / (b - a + 1);
    }
    return y;
  };

  // normcdf estándar (algoritmo de Hart/West, precisión de doble precisión).
  N.normcdf = function (x) {
    const xa = Math.abs(x);
    let c;
    if (xa > 37) c = 0;
    else {
      const e = Math.exp(-xa * xa / 2);
      if (xa < 7.07106781186547) {
        let b = 3.52624965998911e-02 * xa + 0.700383064443688;
        b = b * xa + 6.37396220353165; b = b * xa + 33.912866078383;
        b = b * xa + 112.079291497871; b = b * xa + 221.213596169931;
        b = b * xa + 220.206867912376;
        c = e * b;
        b = 8.83883476483184e-02 * xa + 1.75566716318264;
        b = b * xa + 16.064177579207; b = b * xa + 86.7807322029461;
        b = b * xa + 296.564248779674; b = b * xa + 637.333633378831;
        b = b * xa + 793.826512519948; b = b * xa + 440.413735824752;
        c = c / b;
      } else {
        let b = xa + 0.65;
        b = xa + 4 / b; b = xa + 3 / b; b = xa + 2 / b; b = xa + 1 / b;
        c = e / b / 2.506628274631;
      }
    }
    return x > 0 ? 1 - c : c;
  };

  // Interpolación lineal (interp1 por defecto) para x dentro del rango.
  N.interp1 = function (xs, ys, x) {
    if (x <= xs[0]) return ys[0];
    for (let i = 1; i < xs.length; i++) {
      if (x <= xs[i]) {
        const f = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
        return ys[i - 1] + f * (ys[i] - ys[i - 1]);
      }
    }
    return NaN; // fuera de rango, igual que interp1 sin extrapolación
  };

  /* ---------- clustering ---------- */

  const dist2 = function (a, b) {
    let s = 0;
    for (let j = 0; j < a.length; j++) { const d = a[j] - b[j]; s += d * d; }
    return s;
  };

  // kmeans(X, k, 'Replicates', r) con inicio k-means++ ('plus', el de MATLAB)
  // y distancia euclidiana al cuadrado. Devuelve la réplica de menor suma de
  // distancias. Las etiquetas se renumeran por orden de primera aparición.
  N.kmeans = function (X, k, replicas, semilla) {
    const rng = N.crearRng(semilla || 42);
    const n = X.length, d = X[0].length;
    let mejor = null;
    for (let r = 0; r < replicas; r++) {
      // k-means++
      const C = [X[Math.floor(rng() * n)].slice()];
      const dmin = X.map(x => dist2(x, C[0]));
      while (C.length < k) {
        const tot = N.suma(dmin);
        let u = rng() * tot, idx = n - 1;
        for (let i = 0; i < n; i++) { u -= dmin[i]; if (u <= 0) { idx = i; break; } }
        C.push(X[idx].slice());
        for (let i = 0; i < n; i++) dmin[i] = Math.min(dmin[i], dist2(X[i], C[C.length - 1]));
      }
      let etiqueta = new Array(n).fill(-1);
      for (let it = 0; it < 200; it++) {
        let cambio = false;
        for (let i = 0; i < n; i++) {
          let best = 0, bd = Infinity;
          for (let c = 0; c < k; c++) { const dd = dist2(X[i], C[c]); if (dd < bd) { bd = dd; best = c; } }
          if (etiqueta[i] !== best) { etiqueta[i] = best; cambio = true; }
        }
        for (let c = 0; c < k; c++) {
          const s = new Array(d).fill(0); let m = 0;
          for (let i = 0; i < n; i++) if (etiqueta[i] === c) { m++; for (let j = 0; j < d; j++) s[j] += X[i][j]; }
          if (m > 0) C[c] = s.map(v => v / m);
        }
        if (!cambio) break;
      }
      let total = 0;
      for (let i = 0; i < n; i++) total += dist2(X[i], C[etiqueta[i]]);
      if (!mejor || total < mejor.total - 1e-12) mejor = { etiqueta, C, total };
    }
    // renumerar por orden de primera aparición (1..k)
    const mapa = new Map();
    mejor.etiqueta.forEach(e => { if (!mapa.has(e)) mapa.set(e, mapa.size); });
    for (let c = 0; c < k; c++) if (!mapa.has(c)) mapa.set(c, mapa.size);
    const etiqueta = mejor.etiqueta.map(e => mapa.get(e) + 1);
    const centros = new Array(k);
    for (let c = 0; c < k; c++) centros[mapa.get(c)] = mejor.C[c];
    return { etiqueta, centros, sumaDistancias: mejor.total };
  };

  // silhouette(X, etiqueta) de MATLAB: métrica por defecto 'sqEuclidean'.
  N.silhouette = function (X, etiqueta) {
    const n = X.length;
    const grupos = Array.from(new Set(etiqueta));
    const tam = new Map(grupos.map(g => [g, 0]));
    etiqueta.forEach(e => tam.set(e, tam.get(e) + 1));
    const s = new Array(n);
    for (let i = 0; i < n; i++) {
      const sumas = new Map(grupos.map(g => [g, 0]));
      for (let j = 0; j < n; j++) if (j !== i) sumas.set(etiqueta[j], sumas.get(etiqueta[j]) + dist2(X[i], X[j]));
      const propio = etiqueta[i];
      if (tam.get(propio) === 1) { s[i] = 0; continue; }
      const a = sumas.get(propio) / (tam.get(propio) - 1);
      let b = Infinity;
      grupos.forEach(g => { if (g !== propio) b = Math.min(b, sumas.get(g) / tam.get(g)); });
      s[i] = (b - a) / Math.max(a, b);
    }
    return s;
  };

  // fcm(X, c, [m, maxIter, tol, 0]) de Fuzzy Logic Toolbox: pertenencia
  // inicial aleatoria normalizada, criterio de paro |J(t)-J(t-1)| < tol.
  // Devuelve centros (c x d) y U (c x n).
  N.fcm = function (X, c, m, maxIter, tol, semilla) {
    const rng = N.crearRng(semilla || 42);
    const n = X.length, d = X[0].length;
    let U = [];
    for (let k = 0; k < c; k++) U.push(Array.from({ length: n }, () => rng()));
    for (let i = 0; i < n; i++) {
      let s = 0; for (let k = 0; k < c; k++) s += U[k][i];
      for (let k = 0; k < c; k++) U[k][i] /= s;
    }
    let Jprev = null, C = null;
    for (let it = 0; it < maxIter; it++) {
      const Um = U.map(fila => fila.map(u => Math.pow(u, m)));
      C = Um.map(function (fila) {
        const s = new Array(d).fill(0); let t = 0;
        for (let i = 0; i < n; i++) { t += fila[i]; for (let j = 0; j < d; j++) s[j] += fila[i] * X[i][j]; }
        return s.map(v => v / t);
      });
      const D = C.map(cc => X.map(x => Math.max(Math.sqrt(dist2(x, cc)), 1e-12)));
      let J = 0;
      for (let k = 0; k < c; k++) for (let i = 0; i < n; i++) J += D[k][i] * D[k][i] * Um[k][i];
      const expo = -2 / (m - 1);
      const nuevo = D.map(fila => fila.map(v => Math.pow(v, expo)));
      for (let i = 0; i < n; i++) {
        let s = 0; for (let k = 0; k < c; k++) s += nuevo[k][i];
        for (let k = 0; k < c; k++) nuevo[k][i] /= s;
      }
      U = nuevo;
      if (Jprev !== null && Math.abs(J - Jprev) < tol) break;
      Jprev = J;
    }
    // ordenar clusters por primera aparición de su pertenencia máxima
    const maxIdx = [];
    for (let i = 0; i < n; i++) { let b = 0; for (let k = 1; k < c; k++) if (U[k][i] > U[b][i]) b = k; maxIdx.push(b); }
    const orden = [];
    maxIdx.forEach(b => { if (!orden.includes(b)) orden.push(b); });
    for (let k = 0; k < c; k++) if (!orden.includes(k)) orden.push(k);
    return { centros: orden.map(k => C[k]), U: orden.map(k => U[k]) };
  };

  /* ---------- formato tipo fprintf ---------- */

  // sprintf mínimo: %d, %s, %-Ns, %Ns, %.Nf, %N.Nf, %%
  N.sprintf = function (fmt) {
    const args = Array.prototype.slice.call(arguments, 1);
    let k = 0;
    return fmt.replace(/%(-?)(\d*)(?:\.(\d+))?([dfs%])/g, function (_, izq, ancho, dec, tipo) {
      if (tipo === '%') return '%';
      const v = args[k++];
      let t;
      if (tipo === 'd') t = String(Math.round(v));
      else if (tipo === 'f') t = Number(v).toFixed(dec === undefined ? 6 : +dec);
      else t = String(v);
      const w = ancho ? +ancho : 0;
      if (t.length < w) t = izq ? t + ' '.repeat(w - t.length) : ' '.repeat(w - t.length) + t;
      return t;
    });
  };

  if (typeof module === 'object' && module.exports) module.exports = N;
  else raiz.Numerico = N;
})(this);
