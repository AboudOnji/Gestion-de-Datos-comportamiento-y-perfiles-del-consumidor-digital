/* modelos/cap03.js — equivalente de cap03_rfm_clv_ab.m (limpieza, RFM, CLV
   simple y prueba A/B). La base sintética es la que genera MATLAB con rng(42)
   para cada tamaño nClientes (exportada en datos/cap03_datos.json). */
(function (raiz) {
  'use strict';
  const N = (typeof module === 'object' && module.exports) ? require('../numerico.js') : raiz.Numerico;

  const DEFECTO = { nClientes: 300, horizonteAnios: 3, alfa: 0.05, nA: 1200, conversionesA: 132, nB: 1180, conversionesB: 159 };
  const ORDEN = ['Campeón', 'Leal', 'En riesgo', 'Perdido'];

  function ejecutar(P, baseExportada) {
    const base = baseExportada[String(P.nClientes)];
    const nClientes = P.nClientes, horizonte = P.horizonteAnios, alfa = P.alfa;
    const recencia = base.r, frecuencia = base.f;
    const monto = base.m.map(v => v === null ? NaN : v);
    const L = [];

    /* Bloque 1: calidad de datos */
    L.push(N.sprintf('=== Resultados con nClientes=%d, horizonte=%d años, alfa=%.2f ===', nClientes, horizonte, alfa));
    L.push('--- Bloque 1: calidad de datos ---');
    const nFalt = monto.filter(Number.isNaN).length;
    L.push(N.sprintf('Valores faltantes en monto promedio: %d de %d (%.1f%%)', nFalt, nClientes, 100 * nFalt / nClientes));
    const med = N.mediana(monto);
    const limpio = monto.map(v => Number.isNaN(v) ? med : v);
    const q1 = N.prctile(limpio, 25), q3 = N.prctile(limpio, 75);
    const limSup = q3 + 1.5 * (q3 - q1);
    const esAtipico = limpio.map(v => v > limSup);
    const nAt = esAtipico.filter(Boolean).length;
    L.push(N.sprintf('Atípicos detectados (regla 1.5xRIC, límite=%.0f): %d de %d (%.1f%%)', limSup, nAt, nClientes, 100 * nAt / nClientes));
    const montoOriginal = limpio.slice();
    const montoLimpio = limpio.map((v, i) => esAtipico[i] ? limSup : v);

    /* Bloque 2: RFM y CLV */
    L.push('');
    L.push('--- Bloque 2: RFM y CLV ---');
    const quintiles = [0, 20, 40, 60, 80, 100];
    const pR = N.discretizeDerecha(recencia, N.prctile(recencia, quintiles)).map(v => 6 - v);
    const pF = N.discretizeDerecha(frecuencia, N.prctile(frecuencia, quintiles));
    const pM = N.discretizeDerecha(montoLimpio, N.prctile(montoLimpio, quintiles));
    const fix = v => Number.isNaN(v) ? 3 : v;
    const rfm = pR.map((_, i) => fix(pR[i]) + fix(pF[i]) + fix(pM[i]));
    const segmento = rfm.map(r => r >= 12 ? 'Campeón' : r >= 9 ? 'Leal' : r >= 6 ? 'En riesgo' : 'Perdido');

    // tabulate: orden de primera aparición
    const vistos = [];
    segmento.forEach(s => { if (!vistos.includes(s)) vistos.push(s); });
    L.push('Distribución de segmentos RFM:');
    L.push('  Segmento     Clientes   Porcentaje');
    vistos.forEach(s => {
      const c = segmento.filter(x => x === s).length;
      L.push(N.sprintf('  %-12s %8d   %9.2f%%', s, c, 100 * c / nClientes));
    });
    L.push('');

    const clv = montoLimpio.map((m, i) => m * frecuencia[i] * horizonte);
    L.push(N.sprintf('CLV simple promedio por segmento (horizonte %d años, supuesto didáctico):', horizonte));
    const conteos = ORDEN.map(s => segmento.filter(x => x === s).length);
    const clvProm = ORDEN.map(s => {
      const v = clv.filter((_, i) => segmento[i] === s);
      return v.length ? N.media(v) : NaN;
    });
    ORDEN.forEach((s, i) => L.push(N.sprintf('  %-10s: $%.0f', s, clvProm[i])));

    /* Bloque 3: prueba A/B */
    L.push('');
    L.push('--- Bloque 3: prueba A/B ---');
    const nA = P.nA, nB = P.nB, cA = P.conversionesA, cB = P.conversionesB;
    const pA = cA / nA, pB = cB / nB;
    const pC = (cA + cB) / (nA + nB);
    const ee = Math.sqrt(pC * (1 - pC) * (1 / nA + 1 / nB));
    const z = (pB - pA) / ee;
    const valorP = 2 * (1 - N.normcdf(Math.abs(z)));
    L.push(N.sprintf('Conversión A = %.2f%% (n=%d), Conversión B = %.2f%% (n=%d)', 100 * pA, nA, 100 * pB, nB));
    L.push(N.sprintf('Estadístico z = %.3f, valor p = %.4f (alfa = %.2f)', z, valorP, alfa));
    const rechaza = valorP < alfa;
    L.push(rechaza
      ? 'Decisión: se rechaza H0 -- la diferencia es estadísticamente significativa.'
      : 'Decisión: no se rechaza H0 -- la diferencia observada podría deberse al azar.');
    const icA = 1.96 * Math.sqrt(pA * (1 - pA) / nA);
    const icB = 1.96 * Math.sqrt(pB * (1 - pB) / nB);

    const avisos = [];
    if (cA > nA || cB > nB) avisos.push('Las conversiones no pueden ser mayores que el tamaño de muestra.');

    return {
      consola: L.join('\n'), avisos, recencia, frecuencia, montoOriginal, montoLimpio, limSup, rfm, segmento,
      conteos, clvProm, pA, pB, z, valorP, rechaza, icA, icB,
      metricas: {
        nA, cA, nB, cB, alfa, convA: 100 * pA, convB: 100 * pB, z, valorP,
        decision: rechaza ? 'Se rechaza H0' : 'No se rechaza H0',
        nClientes, horizonte, clvCampeon: clvProm[0], clvLeal: clvProm[1], clvRiesgo: clvProm[2], clvPerdido: clvProm[3]
      }
    };
  }

  const M = { DEFECTO, ORDEN, ejecutar };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.Cap03 = M;
})(this);
