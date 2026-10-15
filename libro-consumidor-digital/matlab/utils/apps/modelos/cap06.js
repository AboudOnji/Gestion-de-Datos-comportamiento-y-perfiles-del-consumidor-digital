/* modelos/cap06.js — equivalente de cap06_alternativas.m (tres reglas de
   decisión sobre las mismas alternativas). Es determinista: no usa números
   aleatorios, así que coincide con MATLAB sin datos exportados. */
(function (raiz) {
  'use strict';
  const N = (typeof module === 'object' && module.exports) ? require('../numerico.js') : raiz.Numerico;

  const DEFECTO = { pesoPrecio: 0.40, pesoCalidad: 0.30, pesoEntrega: 0.15, pesoResenas: 0.15,
    umbralMinimo: 3.5, atributoPrioritario: 2, toleranciaLex: 0.5 };

  const ALTERNATIVAS = ['Alfa', 'Beta', 'Gama', 'Delta', 'Épsilon', 'Zeta'];
  const ATRIBUTOS = ['Precio', 'Calidad', 'Entrega', 'Reseñas'];
  const DATOS_CRUDOS = [[899, 6.0, 2, 4.1], [1499, 8.5, 5, 4.6], [1199, 7.5, 3, 4.3],
    [699, 4.5, 7, 3.6], [1799, 9.0, 4, 4.8], [1049, 7.0, 2, 3.9]];
  const ES_COSTO = [true, false, true, false];

  function puntajesNormalizados() {
    const nAlt = DATOS_CRUDOS.length, nAtr = ATRIBUTOS.length;
    const mn = [], mx = [];
    for (let j = 0; j < nAtr; j++) {
      const col = DATOS_CRUDOS.map(f => f[j]);
      mn.push(Math.min.apply(null, col)); mx.push(Math.max.apply(null, col));
    }
    return DATOS_CRUDOS.map(function (fila) {
      return fila.map(function (x, j) {
        let p = 10 * (x - mn[j]) / (mx[j] - mn[j]);
        if (ES_COSTO[j]) p = 10 - p;
        return p;
      });
    });
  }

  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

  function ejecutar(P) {
    const nAlt = ALTERNATIVAS.length;
    const puntajes = puntajesNormalizados();
    const brutos = [P.pesoPrecio, P.pesoCalidad, P.pesoEntrega, P.pesoResenas];
    const sumaPesos = N.suma(brutos);
    const pesos = brutos.map(w => w / sumaPesos);

    // regla 1: aditiva ponderada
    const utilidad = puntajes.map(f => dot(f, pesos));
    const ordenAditiva = utilidad.map((u, i) => i).sort((a, b) => utilidad[b] - utilidad[a]);
    const ganadorAditiva = ordenAditiva[0];

    // regla 2: conjuntiva
    const aceptables = puntajes.map(f => f.every(v => v >= P.umbralMinimo));
    const nAceptables = aceptables.filter(Boolean).length;
    let ganadorConj = -1;
    if (nAceptables > 0) {
      let mejor = -Infinity;
      utilidad.forEach(function (u, i) { if (aceptables[i] && u > mejor) { mejor = u; ganadorConj = i; } });
    }

    // regla 3: lexicográfica con tolerancia
    const ordenPesos = pesos.map((w, i) => i).sort((a, b) => pesos[b] - pesos[a]);
    const prio = P.atributoPrioritario - 1;
    const ordenAtributos = [prio].concat(ordenPesos.filter(i => i !== prio));
    let candidatas = ALTERNATIVAS.map((_, i) => i);
    for (const k of ordenAtributos) {
      const mejor = Math.max.apply(null, candidatas.map(i => puntajes[i][k]));
      candidatas = candidatas.filter(i => puntajes[i][k] >= mejor - P.toleranciaLex);
      if (candidatas.length === 1) break;
    }
    const ganadorLex = candidatas[0];

    // barrido del peso del precio
    const resto = pesos.slice(1); const sr = N.suma(resto);
    const restoN = resto.map(w => w / sr);
    const rejilla = [], ganadorBarrido = [], utilBarrido = [];
    for (let i = 0; i <= 100; i++) {
      const wp = i / 100;
      const w = [wp].concat(restoN.map(x => (1 - wp) * x));
      const u = puntajes.map(f => dot(f, w));
      let g = 0; u.forEach((v, j) => { if (v > u[g]) g = j; });
      rejilla.push(wp); ganadorBarrido.push(g); utilBarrido.push(u);
    }
    let nCambios = 0;
    for (let i = 1; i < ganadorBarrido.length; i++) if (ganadorBarrido[i] !== ganadorBarrido[i - 1]) nCambios++;

    const nom = g => (g < 0 ? 'ninguna' : ALTERNATIVAS[g]);
    const coinciden = nAceptables > 0 && ganadorAditiva === ganadorConj && ganadorConj === ganadorLex;

    const L = [];
    L.push(N.sprintf('=== Resultados con pesos=[%.2f %.2f %.2f %.2f], umbral=%.1f, prioritario=%s, tolerancia=%.1f ===',
      brutos[0], brutos[1], brutos[2], brutos[3], P.umbralMinimo, ATRIBUTOS[prio], P.toleranciaLex));
    L.push('');
    L.push('Puntajes normalizados (0 a 10):');
    L.push(N.sprintf('  %-9s %7s %8s %8s %8s', 'Alternativa', ATRIBUTOS[0], ATRIBUTOS[1], ATRIBUTOS[2], ATRIBUTOS[3]));
    puntajes.forEach((f, i) => L.push(N.sprintf('  %-9s %7.2f %8.2f %8.2f %8.2f', ALTERNATIVAS[i], f[0], f[1], f[2], f[3])));
    L.push('');
    L.push('Regla aditiva ponderada (compensatoria):');
    ordenAditiva.forEach((g, i) => L.push(N.sprintf('  %d. %-9s utilidad = %.3f', i + 1, ALTERNATIVAS[g], utilidad[g])));
    L.push(N.sprintf('  Elige: %s', nom(ganadorAditiva)));
    L.push('');
    L.push(N.sprintf('Regla conjuntiva (mínimo %.1f en cada atributo): %d alternativa(s) aceptable(s)', P.umbralMinimo, nAceptables));
    if (nAceptables === 0) L.push('  Ninguna alternativa cumple el mínimo: la regla no elige.');
    else {
      L.push('  Aceptables: ' + ALTERNATIVAS.filter((_, i) => aceptables[i]).join(', '));
      L.push(N.sprintf('  Elige: %s', nom(ganadorConj)));
    }
    L.push('');
    L.push(N.sprintf('Regla lexicográfica (primero %s, tolerancia %.1f):', ATRIBUTOS[prio], P.toleranciaLex));
    L.push(N.sprintf('  Elige: %s', nom(ganadorLex)));
    L.push('');
    L.push(coinciden ? 'Las tres reglas coinciden.' : 'Las reglas NO coinciden: la regla de decisión cambia la alternativa elegida.');
    L.push('');
    L.push(N.sprintf('Barrido del peso del precio (0 a 1, regla aditiva): el ganador cambia %d vez(veces)', nCambios));
    let inicio = 0;
    for (let i = 1; i <= rejilla.length; i++) {
      if (i === rejilla.length || ganadorBarrido[i] !== ganadorBarrido[inicio]) {
        L.push(N.sprintf('  %-9s de %.2f a %.2f', ALTERNATIVAS[ganadorBarrido[inicio]], rejilla[inicio], rejilla[i - 1]));
        inicio = i;
      }
    }

    const avisos = [];
    if (nAceptables === 0) avisos.push('Ninguna alternativa cumple el mínimo en todos los atributos: la regla conjuntiva no elige. Bajen el umbral o cambien de alternativas.');
    return {
      consola: L.join('\n'), avisos, puntajes, utilidad, pesos, aceptables, rejilla, utilBarrido, ganadorBarrido,
      ganadorAditiva, ganadorConj, ganadorLex, ordenAditiva,
      metricas: {
        pesoPrecio: P.pesoPrecio, pesoCalidad: P.pesoCalidad, pesoEntrega: P.pesoEntrega, pesoResenas: P.pesoResenas,
        umbralMinimo: P.umbralMinimo, atributoPrioritario: ATRIBUTOS[prio], toleranciaLex: P.toleranciaLex,
        ganadorAditiva: nom(ganadorAditiva), utilGanador: utilidad[ganadorAditiva], nAceptables,
        ganadorConj: nom(ganadorConj), ganadorLex: nom(ganadorLex), coinciden: coinciden ? 'sí' : 'no', nCambios
      }
    };
  }

  const M = { DEFECTO, ALTERNATIVAS, ATRIBUTOS, DATOS_CRUDOS, ES_COSTO, ejecutar };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.Cap06 = M;
})(this);
