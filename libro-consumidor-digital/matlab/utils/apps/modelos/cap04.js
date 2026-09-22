/* modelos/cap04.js — equivalente de cap04_series_texto.m (tendencia y
   estacionalidad de una serie de búsqueda + frecuencia de términos). El ruido
   usa el MISMO flujo de randn que MATLAB tras rng(42). */
(function (raiz) {
  'use strict';
  const N = (typeof module === 'object' && module.exports) ? require('../numerico.js') : raiz.Numerico;

  const DEFECTO = { nSemanas: 104, fechaInicio: '2024-09-16', crecimientoSemanal: 0.35, amplitudEstacional: 12, desviacionRuido: 4 };

  const COMENTARIOS = [
    'el envio llego muy rapido y el empaque excelente',
    'buen precio pero el soporte al cliente tardo mucho en responder',
    'la app se traba al pagar, tuve que reiniciar dos veces',
    'excelente calidad del producto, superó mis expectativas',
    'el envio se retraso una semana sin aviso previo',
    'precio justo, entrega rapida, todo bien',
    'el soporte al cliente resolvio mi duda en minutos, muy bien',
    'la app es lenta pero el producto llego a tiempo',
    'mal empaque, llego dañado el producto',
    'buen servicio, precio competitivo, volveria a comprar',
    'la entrega fue rapida pero el producto no coincide con la foto',
    'excelente soporte al cliente, resolvieron todo por chat',
    'el precio subio mucho respecto al mes pasado',
    'app facil de usar, pago sin problemas, envio rapido',
    'calidad regular, esperaba mas por el precio pagado',
    'el empaque llego roto pero el producto estaba bien',
    'muy buena atencion del soporte al cliente por telefono',
    'envio rapido y calidad excelente, totalmente recomendado',
    'la app fallo durante el pago y perdi el descuento',
    'precio alto pero la calidad lo justifica'
  ];
  const PALABRAS_VACIAS = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o',
    'de', 'del', 'al', 'a', 'en', 'que', 'se', 'con', 'por', 'para', 'mi', 'muy',
    'lo', 'su', 'fue', 'es', 'fui', 'tuve', 'fallo', 'esta', 'estaba', 'pero', 'no'];

  function serie(P, randnExportado) {
    const n = P.nSemanas;
    const flujo = N.flujoRandn(randnExportado, n);
    const [a, m, d] = P.fechaInicio.split('-').map(Number);
    const fechas = [], observada = [];
    for (let i = 0; i < n; i++) {
      const s = i + 1;
      const f = new Date(Date.UTC(a, m - 1, d + 7 * i));
      fechas.push(f.toISOString().slice(0, 10));
      const tend = 30 + P.crecimientoSemanal * s;
      const est = P.amplitudEstacional * Math.sin(2 * Math.PI * s / 52 - Math.PI / 2) + 6;
      observada.push(Math.max(tend + est + flujo.valores[i] * P.desviacionRuido, 0));
    }
    const tendencia = N.movmean(observada, 26, 25);
    const estacional = observada.map((v, i) => v - tendencia[i]);
    return { fechas, observada, tendencia, estacional, completo: flujo.completo };
  }

  // Tokenización equivalente a erasePunctuation + tokenizedDocument (separa
  // por espacios, conserva mayúsculas/acentos) + removeWords + bagOfWords.
  function frecuenciaTerminos(comentarios, palabrasVacias) {
    const vacias = new Set(palabrasVacias);
    const conteo = new Map(); // Map conserva el orden de primera aparición (vocabulario)
    comentarios.forEach(c => {
      c.replace(/[\p{P}]/gu, '').split(/\s+/).filter(Boolean).forEach(w => {
        if (vacias.has(w)) return;
        conteo.set(w, (conteo.get(w) || 0) + 1);
      });
    });
    const lista = Array.from(conteo, ([palabra, n], i) => ({ palabra, n, i }));
    lista.sort((x, y) => y.n - x.n || x.i - y.i); // sort 'descend' estable, como MATLAB
    return lista;
  }

  function ejecutar(P, randnExportado, comentarios) {
    const S = serie(P, randnExportado);
    const mn = Math.min.apply(null, S.observada), mx = Math.max.apply(null, S.observada);
    const prom = N.media(S.observada);
    const ampEst = Math.max.apply(null, S.estacional) - Math.min.apply(null, S.estacional);
    const terminos = frecuenciaTerminos(comentarios || COMENTARIOS, PALABRAS_VACIAS);

    const L = [];
    L.push(N.sprintf('=== Resultados con crecimiento=%.2f/semana, amplitud estacional=%.0f, ruido=%.0f ===',
      P.crecimientoSemanal, P.amplitudEstacional, P.desviacionRuido));
    L.push(N.sprintf('Interés de búsqueda: mínimo=%.1f, máximo=%.1f, promedio=%.1f', mn, mx, prom));
    L.push(N.sprintf('Amplitud estimada del componente estacional: %.1f puntos', ampEst));
    L.push('');
    const nTop = Math.min(10, terminos.length);
    L.push(N.sprintf('Top %d términos en el corpus sintético de escucha social:', nTop));
    for (let i = 0; i < nTop; i++) L.push(N.sprintf('  %-15s %d', terminos[i].palabra, terminos[i].n));

    const avisos = [];
    if (!S.completo) avisos.push('Serie más larga que los números aleatorios exportados de MATLAB: el ruido ya no es idéntico al del script.');
    if (P.nSemanas < 52) avisos.push('Con menos de 52 semanas la media móvil de 52 semanas no alcanza a cubrir un ciclo anual completo: la tendencia estimada es poco confiable.');

    return {
      consola: L.join('\n'), avisos, serie: S, terminos, minimo: mn, maximo: mx, promedio: prom, ampEst,
      metricas: {
        nSemanas: P.nSemanas, crecimiento: P.crecimientoSemanal, amplitud: P.amplitudEstacional, ruido: P.desviacionRuido,
        minimo: mn, maximo: mx, promedio: prom, ampEst
      }
    };
  }

  const M = { DEFECTO, COMENTARIOS, PALABRAS_VACIAS, ejecutar, frecuenciaTerminos };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.Cap04 = M;
})(this);
