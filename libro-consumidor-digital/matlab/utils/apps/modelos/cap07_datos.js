/* modelos/cap07_datos.js — atribución con recorridos PROPIOS (Cap. 7): a partir de una tabla de
   recorridos (canales en orden y si terminó en compra) estima la cadena de Markov de primer orden
   entre canales y calcula los mismos tres modelos de cap07_journey_markov.m (último clic, primer
   clic y efecto de remoción), más el reparto lineal. Con recorridos simulados de la cadena del
   libro, la cadena estimada se parece a la del script. No depende del navegador: se prueba en Node
   (pruebas/verificar_cap07_datos.js). */
(function (raiz) {
  'use strict';
  const esNode = typeof module === 'object' && module.exports;
  const N = esNode ? require('../numerico.js') : raiz.Numerico;
  const DP = esNode ? require('./cap02_datos.js') : raiz.DatosPropios;

  const LIMITES = { minRutas: 20, maxRutas: 20000, minCanales: 2, maxCanales: 12, maxPasos: 60 };
  const DEFECTO = { nTopRutas: 8, longitudMinima: 1, colapsar: 0 };
  const normalizar = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const SEPARADOR = /\s*(?:->|→|>|\||;|,)\s*/;

  function aBooleano(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v > 0;
    const t = normalizar(v);
    if (/^(1|si|s|yes|y|true|verdadero|compro|convirtio|venta|comprado)$/.test(t)) return true;
    if (/^(0|no|n|false|falso|nocompro|noconvirtio|sinventa)$/.test(t)) return false;
    return null;
  }

  // tabla: salida de DP.procesarTabla. Admite una columna «Canales» con la ruta separada por >,
  // o varias columnas Paso1, Paso2… ; una columna de conversión y, opcionalmente, «Cantidad».
  function leerRecorridos(tabla) {
    const errores = tabla.errores.slice(), avisos = [];
    if (errores.length) return { errores, avisos };
    const col = re => tabla.columnas.find(c => re.test(normalizar(c.nombre)));
    const cConv = col(/^(convir|compr|conversion|exito|venta)/);
    const cCant = col(/^(cant|veces|frecuencia|recorridos|n$|conteo)/);
    const pasos = tabla.columnas.filter(c => /^(paso|punto|toque|touch|canal)\d+$/.test(normalizar(c.nombre)));
    let cRuta = col(/^(canales|ruta|recorrido|camino|path|secuencia)$/);
    if (!cConv) errores.push('No encontré la columna que dice si el recorrido terminó en compra (por ejemplo «Convirtio» con 1/0 o Sí/No).');
    if (!cRuta && !pasos.length) cRuta = tabla.columnas.find(c => c.tipo === 'texto' && c !== cConv);
    if (!cRuta && !pasos.length) errores.push('No encontré la columna con la ruta de canales (por ejemplo «Canales» con valores como Redes>Búsqueda>Directo) ni columnas Paso1, Paso2…');
    if (errores.length) return { errores, avisos };
    const rutas = [];
    tabla.filasDatos.forEach(function (r) {
      const celdas = i => r.celdas[i];
      let canales;
      if (pasos.length && !(cRuta && celdas(cRuta.indice))) canales = pasos.map(c => celdas(c.indice)).filter(v => v !== null && v !== undefined && String(v).trim() !== '').map(v => String(v).trim());
      else canales = String(celdas(cRuta.indice) === null ? '' : celdas(cRuta.indice)).split(SEPARADOR).map(s => s.trim()).filter(Boolean);
      const conv = aBooleano(celdas(cConv.indice));
      let w = 1;
      if (cCant) { const v = DP.aNumero(celdas(cCant.indice)); if (v === null || Number.isNaN(v) || v < 0) { errores.push('Cantidad no válida en la fila ' + r.filaExcel + '.'); return; } w = v; }
      if (!canales.length) { avisos.push('La fila ' + r.filaExcel + ' no tiene canales y se ignoró.'); return; }
      if (conv === null) { errores.push('No entiendo si el recorrido de la fila ' + r.filaExcel + ' terminó en compra (usen 1/0 o Sí/No).'); return; }
      if (canales.length > LIMITES.maxPasos) { avisos.push('La fila ' + r.filaExcel + ' tiene ' + canales.length + ' pasos; se recortó a los primeros ' + LIMITES.maxPasos + '.'); canales = canales.slice(0, LIMITES.maxPasos); }
      if (w > 0) rutas.push({ canales, conv, w, fila: r.filaExcel });
    });
    if (errores.length) return { errores: errores.slice(0, 6), avisos };
    const nRutas = rutas.reduce((s, r) => s + r.w, 0), nConv = rutas.reduce((s, r) => s + (r.conv ? r.w : 0), 0);
    if (rutas.length < 1 || nRutas < LIMITES.minRutas) errores.push('Se necesitan al menos ' + LIMITES.minRutas + ' recorridos; se encontraron ' + nRutas + '.');
    if (nRutas > LIMITES.maxRutas) errores.push('Hay ' + nRutas + ' recorridos; el máximo es ' + LIMITES.maxRutas + '. Agrupen rutas iguales con la columna «Cantidad».');
    if (nConv === 0) errores.push('Ningún recorrido terminó en compra: no hay nada que atribuir.');
    if (nConv === nRutas && nRutas > 0) avisos.push('Todos los recorridos terminaron en compra: sin recorridos que fracasan, el efecto de remoción pierde sentido.');
    if (nConv > 0 && nConv < 5) avisos.push('Hay solo ' + nConv + ' compras: los porcentajes de atribución son muy inestables.');
    return { errores, avisos, rutas, nRutas, nConv, formato: pasos.length && !cRuta ? 'pasos' : 'ruta' };
  }

  const clave = s => s.trim().toLowerCase();

  function colapsarRepetidos(canales) { return canales.filter((c, i) => i === 0 || clave(c) !== clave(canales[i - 1])); }

  function inv(A) { return N.inv(A); }

  // datos: salida de leerRecorridos; P: {nTopRutas, longitudMinima, colapsar}
  function analizar(datos, P) {
    let rutas = datos.rutas.map(r => ({ canales: P.colapsar ? colapsarRepetidos(r.canales) : r.canales, conv: r.conv, w: r.w }));
    rutas = rutas.filter(r => r.canales.length >= P.longitudMinima);
    const nRutas = rutas.reduce((s, r) => s + r.w, 0), nConv = rutas.reduce((s, r) => s + (r.conv ? r.w : 0), 0);
    if (nRutas === 0 || nConv === 0) return { error: 'Con estas opciones no queda ningún recorrido que termine en compra: bajen la longitud mínima.' };

    const nombres = [], idx = {};
    rutas.forEach(r => r.canales.forEach(function (c) { const k = clave(c); if (!(k in idx)) { idx[k] = nombres.length; nombres.push(c.trim()); } }));
    const K = nombres.length;
    if (K < LIMITES.minCanales) return { error: 'Se necesitan al menos ' + LIMITES.minCanales + ' canales distintos; hay ' + K + '.' };
    if (K > LIMITES.maxCanales) return { error: 'Hay ' + K + ' canales distintos; el máximo es ' + LIMITES.maxCanales + '. Agrupen los canales parecidos.' };

    const ini = new Array(K).fill(0), Qc = Array.from({ length: K }, () => new Array(K).fill(0)), conv = new Array(K).fill(0), nulo = new Array(K).fill(0);
    const ultimo = new Array(K).fill(0), primero = new Array(K).fill(0), lineal = new Array(K).fill(0), apariciones = new Array(K).fill(0), recorridosCon = new Array(K).fill(0);
    rutas.forEach(function (r) {
      const ids = r.canales.map(c => idx[clave(c)]), L = ids.length;
      ini[ids[0]] += r.w;
      for (let i = 0; i + 1 < L; i++) Qc[ids[i]][ids[i + 1]] += r.w;
      if (r.conv) { conv[ids[L - 1]] += r.w; ultimo[ids[L - 1]] += r.w; primero[ids[0]] += r.w; ids.forEach(c => { lineal[c] += r.w / L; }); }
      else nulo[ids[L - 1]] += r.w;
      ids.forEach(c => { apariciones[c] += r.w; });
      new Set(ids).forEach(c => { recorridosCon[c] += r.w; });
    });
    // probabilidades de transición estimadas
    const salidas = Qc.map((f, i) => N.suma(f) + conv[i] + nulo[i]);
    const pi0 = ini.map(x => x / nRutas);
    const Q = Qc.map((f, i) => f.map(x => x / salidas[i]));
    const r = conv.map((x, i) => x / salidas[i]);
    function convDesde(mantener) {
      const k = mantener.map((m, i) => (m ? i : -1)).filter(i => i >= 0);
      const Qk = k.map(i => k.map(j => Q[i][j]));
      const Nk = inv(N.identidad(k.length).map((f, a) => f.map((x, b) => x - Qk[a][b])));
      const w = N.vecmat(k.map(i => pi0[i]), Nk);
      return w.reduce((s, x, i) => s + x * r[k[i]], 0);
    }
    const pModelo = convDesde(new Array(K).fill(true));
    const efecto = nombres.map((_, c) => 1 - convDesde(new Array(K).fill(true).map((v, j) => j !== c)) / pModelo);
    const sEf = N.suma(efecto);
    const remocion = efecto.map(e => (sEf > 0 ? e / sEf : 0));
    const compartir = a => a.map(x => x / nConv);

    // rutas más frecuentes
    const frec = {};
    rutas.forEach(function (ru) { const k = ru.canales.map(c => c.trim()).join(' > ') + '|' + (ru.conv ? 1 : 0); frec[k] = (frec[k] || 0) + ru.w; });
    const top = Object.keys(frec).map(k => ({ ruta: k.split('|')[0], conv: k.endsWith('|1'), n: frec[k] })).sort((a, b) => b.n - a.n || (a.ruta < b.ruta ? -1 : 1)).slice(0, P.nTopRutas);
    const largo = N.suma(rutas.map(ru => ru.canales.length * ru.w)) / nRutas;

    const shares = { ultimo: compartir(ultimo), primero: compartir(primero), lineal: compartir(lineal), remocion };
    let masSub = 0, mejor = -Infinity;
    remocion.forEach((x, i) => { const d = x - shares.ultimo[i]; if (d > mejor) { mejor = d; masSub = i; } });

    const L = [];
    L.push(N.sprintf('=== Resultados con %d recorridos (%d con compra), %d canales, longitud mínima=%d, colapsar repetidos=%s ===', nRutas, nConv, K, P.longitudMinima, P.colapsar ? 'sí' : 'no'));
    L.push(N.sprintf('Tasa de conversión observada: %.1f%% · modelo de Markov estimado: %.1f%% · pasos por recorrido: %.2f', 100 * nConv / nRutas, 100 * pModelo, largo));
    L.push('');
    L.push(N.sprintf('  %-18s %8s %10s %10s %10s %10s', 'Canal', 'Toques', 'Ultimo clic', 'Primer clic', 'Lineal', 'Remocion'));
    nombres.forEach((c, i) => L.push(N.sprintf('  %-18s %8d %9.1f%% %9.1f%% %9.1f%% %9.1f%%', c, apariciones[i], 100 * shares.ultimo[i], 100 * shares.primero[i], 100 * shares.lineal[i], 100 * remocion[i])));
    L.push(N.sprintf('  El canal más subestimado por el último clic es: %s', nombres[masSub]));
    L.push('');
    L.push(N.sprintf('Las %d rutas más frecuentes:', top.length));
    top.forEach((t, i) => L.push(N.sprintf('  %d. %s  [%s]  %d', i + 1, t.ruta, t.conv ? 'compra' : 'sin compra', t.n)));

    const avisos = datos.avisos.slice();
    if (K > 0 && Math.abs(pModelo - nConv / nRutas) > 0.1 * Math.max(0.01, nConv / nRutas)) avisos.push('El modelo de Markov estima ' + (100 * pModelo).toFixed(1) + ' % de conversión frente a ' + (100 * nConv / nRutas).toFixed(1) + ' % observado: la memoria de un solo paso no captura bien estos recorridos.');
    return { nombres, K, nRutas, nConv, tasa: nConv / nRutas, pModelo, largo, pi0, Q, r, nulo: nulo.map((x, i) => x / salidas[i]), apariciones, recorridosCon, shares, efecto, top, masSub, consola: L.join('\n'), avisos,
      metricas: Object.assign({ nRutas, nConv, tasa: 100 * nConv / nRutas, pModelo: 100 * pModelo, largo, canalSubestimado: nombres[masSub] },
        ...nombres.map((c, i) => ({ ['ultimo_' + c]: 100 * shares.ultimo[i], ['primero_' + c]: 100 * shares.primero[i], ['lineal_' + c]: 100 * shares.lineal[i], ['remocion_' + c]: 100 * remocion[i] }))) };
  }

  const M = { LIMITES, DEFECTO, leerRecorridos, analizar, colapsarRepetidos, aBooleano };
  if (esNode) module.exports = M; else raiz.Cap07Datos = M;
})(this);
