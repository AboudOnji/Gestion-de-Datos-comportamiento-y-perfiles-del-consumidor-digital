/* modelos/cap04_datos.js — análisis del Cap. 4 (tendencia, estacionalidad y
   frecuencia de términos) sobre datos PROPIOS del estudiante. Recibe tablas ya
   leídas del Excel (DatosPropios.procesarTabla, de cap02_datos.js) y aplica la
   misma lógica que cap04_series_texto.m: tendencia = media móvil centrada de un
   ciclo completo (52 semanas en el script; aquí «periodos por ciclo»),
   estacionalidad = serie − tendencia, y bolsa de palabras con palabras vacías.
   Extensiones respecto al script (con valores por defecto que lo reproducen):
   ciclo configurable (semanal, mensual, diario…), relleno por interpolación de
   faltantes interiores, perfil estacional por mes y comparación «últimos k
   periodos contra la misma época del año anterior» (caso de estudio del libro).
   No depende del navegador: se prueba en Node (pruebas/verificar_cap04_datos.js). */
(function (raiz) {
  'use strict';
  const esNode = typeof module === 'object' && module.exports;
  const N = esNode ? require('../numerico.js') : raiz.Numerico;
  const DP = esNode ? require('./cap02_datos.js') : raiz.DatosPropios;
  const Cap04 = esNode ? require('./cap04.js') : raiz.Cap04;

  const LIMITES = { minPuntos: 8, maxPuntos: 5000, minComentarios: 5, maxComentarios: 20000 };
  const DEFECTO = { periodosCiclo: 52, ventanaReciente: 4, nTop: 10 };
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const CICLOS = { 52: 'semanal', 12: 'mensual', 365: 'diaria', 4: 'trimestral' };

  const normalizar = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

  /* ---------- columnas y fechas ---------- */
  function sugerirColumnas(tabla) {
    const colFecha = tabla.columnas.find(c => /^(fecha|date|dia|semana|periodo|mes)/.test(normalizar(c.nombre)) && c.tipo !== 'vacia');
    const nums = tabla.columnas.filter(c => c.tipo === 'numerica' && c !== colFecha);
    const pref = nums.find(c => /^(interes|indice|valor|busqueda|ventas|visitas|consultas|menciones|trafico|demanda)/.test(normalizar(c.nombre)));
    const colValor = pref || nums[0];
    const colTexto = tabla.columnas.find(c => c.tipo === 'texto' && /^(coment|texto|opinion|resena|mensaje|tweet|post)/.test(normalizar(c.nombre)));
    return { fecha: colFecha ? colFecha.nombre : null, valor: colValor ? colValor.nombre : null, texto: colTexto ? colTexto.nombre : null };
  }

  // Convierte una celda de fecha (serie de Excel, objeto Date, ISO o dd/mm/aaaa) a milisegundos UTC; NaN si no se puede.
  function aFecha(v) {
    if (v === null || v === undefined || v === '') return NaN;
    if (v instanceof Date) return Date.UTC(v.getFullYear(), v.getMonth(), v.getDate());
    if (typeof v === 'number') return (v > 20000 && v < 80000) ? Date.UTC(1899, 11, 30) + Math.round(v) * 86400000 : NaN;
    const t = String(v).trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
    return NaN;
  }
  const iso = ms => new Date(ms).toISOString().slice(0, 10);

  // Frecuencia detectada por la mediana del paso entre fechas: devuelve periodos por ciclo anual.
  function detectarCiclo(ms) {
    if (ms.length < 3) return null;
    const pasos = ms.slice(1).map((x, i) => (x - ms[i]) / 86400000).sort((a, b) => a - b);
    const med = pasos[Math.floor(pasos.length / 2)];
    if (med >= 0.9 && med <= 1.1) return 365;
    if (med >= 6 && med <= 8) return 52;
    if (med >= 27 && med <= 32) return 12;
    if (med >= 88 && med <= 93) return 4;
    return null;
  }

  /* ---------- construcción de la serie ---------- */
  function construirSerie(tabla, nombreFecha, nombreValor) {
    const errores = [], avisos = [];
    const cV = tabla.columnas.find(c => c.nombre === nombreValor);
    const cF = nombreFecha ? tabla.columnas.find(c => c.nombre === nombreFecha) : null;
    if (!cV) return { errores: ['Elijan la columna con los valores de la serie.'], avisos };
    if (cF && cF === cV) return { errores: ['La columna de fecha y la de valores deben ser distintas.'], avisos };
    let filas = tabla.filasDatos.map((r, i) => ({
      fila: r.filaExcel, ms: cF ? aFecha(r.celdas[tabla.columnas.indexOf(cF)]) : i, y: cV.valores[i]
    }));
    let sinFecha = 0;
    if (cF) { const antes = filas.length; filas = filas.filter(f => !Number.isNaN(f.ms)); sinFecha = antes - filas.length; }
    if (sinFecha) avisos.push(sinFecha + ' fila(s) con fecha ilegible o vacía se descartaron.');
    // ordenar y quitar fechas repetidas
    filas.sort((a, b) => a.ms - b.ms);
    const unicas = filas.filter((f, i) => i === 0 || f.ms !== filas[i - 1].ms);
    if (unicas.length < filas.length) avisos.push((filas.length - unicas.length) + ' fecha(s) repetida(s): se conservó la primera de cada una.');
    filas = unicas;
    // recortar vacíos al inicio y al final; interpolar los interiores
    const bueno = f => f.y !== null && !Number.isNaN(f.y);
    let i0 = 0, i1 = filas.length - 1;
    while (i0 <= i1 && !bueno(filas[i0])) i0++;
    while (i1 >= i0 && !bueno(filas[i1])) i1--;
    const recortadas = filas.length - (i1 - i0 + 1);
    if (recortadas > 0) avisos.push(recortadas + ' fila(s) vacías al inicio o al final se descartaron.');
    filas = filas.slice(i0, i1 + 1);
    let rellenados = 0;
    for (let i = 0; i < filas.length; i++) {
      if (bueno(filas[i])) continue;
      let a = i - 1, b = i + 1;
      while (!bueno(filas[b])) b++;
      const t = (i - a) / (b - a);
      filas[i].y = filas[a].y + t * (filas[b].y - filas[a].y); filas[i].interpolado = true; rellenados++;
    }
    if (rellenados) avisos.push(rellenados + ' valor(es) faltante(s) o con texto en medio de la serie se rellenaron por interpolación lineal (regla documentada).');
    const n = filas.length;
    if (n < LIMITES.minPuntos) errores.push('Quedan ' + n + ' puntos válidos; se necesitan al menos ' + LIMITES.minPuntos + '.');
    if (n > LIMITES.maxPuntos) errores.push('La serie tiene ' + n + ' puntos; el máximo es ' + LIMITES.maxPuntos + ' (agrúpenla por semana o por mes).');
    if (errores.length) return { errores, avisos };
    const ms = filas.map(f => f.ms), y = filas.map(f => f.y);
    let cicloDetectado = null, irregular = false;
    if (cF) {
      cicloDetectado = detectarCiclo(ms);
      const pasos = ms.slice(1).map((x, i) => x - ms[i]);
      const med = pasos.slice().sort((a, b) => a - b)[Math.floor(pasos.length / 2)];
      irregular = pasos.some(p => Math.abs(p - med) > 0.25 * med && !(med > 27 * 86400000 && Math.abs(p - med) <= 4 * 86400000));
      if (irregular) avisos.push('Los intervalos entre fechas no son parejos (faltan periodos o hay periodos repetidos): la media móvil supone datos a intervalos regulares.');
    }
    if (y.every(v => v === y[0])) errores.push('Todos los valores de la serie son iguales: no hay nada que descomponer.');
    return { errores, avisos, ms, fechas: cF ? ms.map(iso) : ms.map((_, i) => i + 1), y, n, tieneFechas: !!cF, cicloDetectado,
      interpolados: filas.map(f => !!f.interpolado), rellenados, irregular };
  }

  /* ---------- descomposición ---------- */
  function descomponer(S, P) {
    const w = P.periodosCiclo, n = S.n;
    const tendencia = N.movmean(S.y, Math.floor(w / 2), Math.ceil(w / 2) - 1);   // como movmean(x, w) de MATLAB
    const estacional = S.y.map((v, i) => v - tendencia[i]);
    const mn = Math.min.apply(null, S.y), mx = Math.max.apply(null, S.y);
    const prom = N.media(S.y);
    const ampEst = Math.max.apply(null, estacional) - Math.min.apply(null, estacional);
    // los extremos usan ventanas incompletas (como en el script): la tendencia y la estacionalidad ahí son poco confiables
    const bordes = Math.min(Math.floor(w / 2), Math.floor(n / 2));
    const a = bordes, b = n - 1 - bordes;
    const central = b - a >= 2;
    // pendiente y amplitud «de la zona central» (sin los extremos con ventana incompleta)
    const pendiente = central ? (tendencia[b] - tendencia[a]) / (b - a) : (tendencia[n - 1] - tendencia[0]) / (n - 1);
    const estCentral = central ? estacional.slice(a, b + 1) : estacional;
    const ampCentral = Math.max.apply(null, estCentral) - Math.min.apply(null, estCentral);
    // perfil estacional por mes calendario (solo con fechas), usando el centro de la serie
    let perfilMes = null, mesPico = null, mesValle = null;
    if (S.tieneFechas) {
      const suma = new Array(12).fill(0), cuenta = new Array(12).fill(0);
      S.ms.forEach((m, i) => { if (i >= bordes && i < n - bordes) { const k = new Date(m).getUTCMonth(); suma[k] += estacional[i]; cuenta[k]++; } });
      if (cuenta.some(c => c > 0)) {
        perfilMes = suma.map((s, k) => cuenta[k] ? s / cuenta[k] : NaN);
        const validos = perfilMes.map((v, k) => [v, k]).filter(x => !Number.isNaN(x[0]));
        mesPico = validos.reduce((a, b) => b[0] > a[0] ? b : a)[1]; mesValle = validos.reduce((a, b) => b[0] < a[0] ? b : a)[1];
      }
    }
    return { tendencia, estacional, minimo: mn, maximo: mx, promedio: prom, ampEst, ampCentral, pendiente, bordes, perfilMes, mesPico, mesValle,
      cicloCompleto: n >= w, dosCiclos: n >= 2 * w };
  }

  // «¿Salto de campaña o de temporada?»: cambio de los últimos k periodos contra los k anteriores,
  // y el mismo cambio un ciclo (año) antes.
  function compararAnioAnterior(S, P) {
    const k = P.ventanaReciente, w = P.periodosCiclo, n = S.n;
    if (n < w + 2 * k) return null;
    const prom = (a, b) => N.media(S.y.slice(a, b));
    const recienteNuevo = prom(n - k, n), recienteAnt = prom(n - 2 * k, n - k);
    const antNuevo = prom(n - k - w, n - w), antAnt = prom(n - 2 * k - w, n - k - w);
    const cambioReciente = recienteNuevo - recienteAnt, cambioAnterior = antNuevo - antAnt;
    let veredicto;
    const grande = Math.abs(cambioReciente) > 1e-9;
    if (!grande) veredicto = 'sin cambio';
    else if (Math.sign(cambioAnterior) === Math.sign(cambioReciente) && Math.abs(cambioAnterior) >= 0.6 * Math.abs(cambioReciente)) veredicto = 'estacional';
    else if (Math.abs(cambioAnterior) <= 0.25 * Math.abs(cambioReciente)) veredicto = 'inusual';
    else veredicto = 'mixto';
    return { k, cambioReciente, cambioAnterior, veredicto, recienteNuevo, recienteAnt, antNuevo, antAnt,
      fechaInicioReciente: S.fechas[n - k], fechaInicioAnterior: S.fechas[n - k - w] };
  }

  /* ---------- texto ---------- */
  function listaComentarios(tabla, nombreTexto) {
    const c = tabla.columnas.find(x => x.nombre === nombreTexto);
    if (!c) return [];
    const j = tabla.columnas.indexOf(c);
    return tabla.filasDatos.map(r => r.celdas[j]).filter(v => v !== null && v !== undefined && String(v).trim() !== '').map(String);
  }
  function limpiarPalabrasVacias(texto) {
    return String(texto).split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
  }
  // Mismo flujo del script: quitar puntuación, separar por espacios, quitar palabras vacías, contar.
  // Opciones propias: minúsculas (por defecto sí) y quitar acentos (por defecto no).
  function terminos(comentarios, vacias, opc) {
    const o = Object.assign({ minusculas: true, sinAcentos: false }, opc || {});
    const norm = t => { let x = t; if (o.minusculas) x = x.toLowerCase(); if (o.sinAcentos) x = x.normalize('NFD').replace(/[̀-ͯ]/g, ''); return x; };
    const v = vacias.map(norm);
    const lista = Cap04.frecuenciaTerminos(comentarios.map(norm), v);
    const totalTokens = comentarios.reduce((s, c) => s + norm(c).replace(/[\p{P}]/gu, '').split(/\s+/).filter(Boolean).length, 0);
    const usados = lista.reduce((s, t) => s + t.n, 0);
    return { lista, totalTokens, usados, distintos: lista.length };
  }

  const M = { LIMITES, DEFECTO, MESES, CICLOS, sugerirColumnas, aFecha, detectarCiclo, construirSerie, descomponer, compararAnioAnterior,
    listaComentarios, limpiarPalabrasVacias, terminos, PALABRAS_VACIAS: Cap04.PALABRAS_VACIAS, COMENTARIOS: Cap04.COMENTARIOS };
  if (esNode) module.exports = M;
  else raiz.Cap04Datos = M;
})(this);
