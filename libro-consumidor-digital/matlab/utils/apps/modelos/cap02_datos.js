/* modelos/cap02_datos.js — lectura y validación de datos propios para la app
   de segmentación del Cap. 2. Recibe la hoja ya convertida en una tabla
   (arreglo de filas; la fila 0 son los encabezados) y aplica las reglas de
   la sección «¿Cómo deben venir sus datos?» de la app. No depende del
   navegador: se prueba en Node (pruebas/verificar_datos_propios.js). */
(function (raiz) {
  'use strict';

  const LIMITES = { minFilas: 20, maxFilas: 5000, minVars: 2, maxVars: 10, minPorSegmento: 10, fraccionNumerica: 0.9 };

  // Convierte una celda a número. Acepta números y texto numérico simple
  // ("915.5", "$1,250.00", " 42 "). Devuelve null si está vacía y NaN si es texto.
  function aNumero(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
    if (typeof v === 'boolean') return NaN;
    const t = String(v).trim();
    if (t === '') return null;
    const limpio = t.replace(/[$\s]/g, '').replace(/,(?=\d{3}(\D|$))/g, '');
    return /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(limpio) ? Number(limpio) : NaN;
  }

  // filas: [[encabezado1, ...], [v11, ...], ...]
  function procesarTabla(filas) {
    const errores = [], avisos = [];
    // quitar filas completamente vacías al inicio (títulos en blanco)
    let inicio = 0;
    while (inicio < filas.length && (filas[inicio] || []).every(v => v === null || v === undefined || String(v).trim() === '')) inicio++;
    if (inicio > 0) avisos.push('Se ignoraron ' + inicio + ' fila(s) vacía(s) antes de los encabezados: los encabezados deben estar en la fila 1.');
    if (inicio >= filas.length) return { errores: ['El archivo o la hoja están vacíos.'], avisos, columnas: [], filasDatos: [] };

    const cab = filas[inicio];
    const nCols = Math.max.apply(null, filas.map(f => (f || []).length));
    const numericosEnCab = cab.filter(v => typeof v === 'number').length;
    if (numericosEnCab > 0 && numericosEnCab >= cab.filter(v => v !== null && v !== undefined && v !== '').length / 2) {
      errores.push('La primera fila parece contener datos, no nombres de columnas. La fila 1 debe tener los encabezados (p. ej. ID_cliente, Frecuencia_mensual…).');
    }

    const vistos = {};
    const columnas = [];
    for (let j = 0; j < nCols; j++) {
      let nombre = cab[j] === null || cab[j] === undefined ? '' : String(cab[j]).trim();
      if (!nombre) nombre = 'Columna_' + (j + 1);
      if (vistos[nombre]) { avisos.push('El encabezado «' + nombre + '» está repetido; se renombró como «' + nombre + '_' + (vistos[nombre] + 1) + '».'); vistos[nombre]++; nombre = nombre + '_' + vistos[nombre]; }
      else vistos[nombre] = 1;
      columnas.push({ nombre, indice: j });
    }

    const filasDatos = [];
    for (let i = inicio + 1; i < filas.length; i++) {
      const f = filas[i] || [];
      if (f.every(v => v === null || v === undefined || String(v).trim() === '')) continue; // fila en blanco
      filasDatos.push({ filaExcel: i + 1, celdas: columnas.map(c => f[c.indice]) });
    }
    if (!filasDatos.length) errores.push('No hay datos debajo de los encabezados (deben empezar en la fila 2).');

    columnas.forEach(function (c, j) {
      const valores = filasDatos.map(r => aNumero(r.celdas[j]));
      const noVacios = valores.filter(v => v !== null);
      const numericos = noVacios.filter(v => !Number.isNaN(v));
      c.nVacios = valores.length - noVacios.length;
      c.nTexto = noVacios.length - numericos.length;
      if (/^id/i.test(c.nombre)) c.tipo = 'id';
      else if (!noVacios.length) c.tipo = 'vacia';
      else if (numericos.length / noVacios.length >= LIMITES.fraccionNumerica) c.tipo = 'numerica';
      else c.tipo = 'texto';
      c.valores = valores;
      if (c.tipo === 'numerica' && numericos.length > 1) {
        const m = numericos.reduce((s, x) => s + x, 0) / numericos.length;
        c.constante = numericos.every(x => Math.abs(x - m) < 1e-12);
        c.min = Math.min.apply(null, numericos); c.max = Math.max.apply(null, numericos);
      }
    });
    const idCol = columnas.find(c => c.tipo === 'id');
    return { errores, avisos, columnas, filasDatos, idCol: idCol ? idCol.nombre : null };
  }

  // Las 3 variables del libro, en este orden. Se reconocen sin importar
  // mayúsculas, acentos, espacios o guiones (p. ej. «Ticket promedio (MXN)»).
  const REQUERIDAS = [
    { nombre: 'Frecuencia_mensual', prefijo: 'frecuencia', unidad: 'compras al mes' },
    { nombre: 'Ticket_promedio_MXN', prefijo: 'ticket', unidad: 'MXN por compra' },
    { nombre: 'Engagement_digital', prefijo: 'engagement', unidad: 'índice 0–100' }
  ];
  const normalizar = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Encuentra en la tabla las 3 columnas requeridas. Devuelve {errores,
  // avisos, nombres} con el nombre real de cada columna en el archivo.
  function mapearColumnas(tabla) {
    const errores = [], avisos = [], nombres = [];
    REQUERIDAS.forEach(function (r) {
      const candidatas = tabla.columnas.filter(c => normalizar(c.nombre).startsWith(r.prefijo));
      if (!candidatas.length) {
        errores.push('Falta la columna «' + r.nombre + '» (' + r.unidad + '). El archivo debe tener exactamente estas columnas: ' +
          REQUERIDAS.map(q => q.nombre).join(', ') + ' (más ID_cliente, opcional).');
        return;
      }
      if (candidatas.length > 1) avisos.push('Hay varias columnas que parecen «' + r.nombre + '»; se usa «' + candidatas[0].nombre + '».');
      const c = candidatas[0];
      if (c.tipo !== 'numerica') errores.push('La columna «' + c.nombre + '» debe tener números (' + r.unidad + '), pero casi todas sus celdas son texto o están vacías.');
      else if (c.constante) errores.push('La columna «' + c.nombre + '» tiene el mismo valor en todas las filas: así no se puede segmentar.');
      nombres.push(c.nombre);
    });
    const usadas = new Set(nombres);
    const extra = tabla.columnas.filter(c => c.tipo !== 'id' && !usadas.has(c.nombre)).map(c => c.nombre);
    if (extra.length) avisos.push('Columnas que no se usan (el análisis solo usa las 3 variables del libro): ' + extra.join(', ') + '.');
    return { errores, avisos, nombres };
  }

  // Construye la matriz de análisis con las variables elegidas; descarta las
  // filas con celdas vacías o con texto en esas variables.
  function construirMatriz(tabla, nombresVars, k) {
    const errores = [], avisos = [];
    const cols = nombresVars.map(n => tabla.columnas.find(c => c.nombre === n));
    const idCol = tabla.columnas.find(c => c.tipo === 'id');
    if (cols.length < LIMITES.minVars) errores.push('Elijan al menos ' + LIMITES.minVars + ' variables.');
    if (cols.length > LIMITES.maxVars) errores.push('Elijan como máximo ' + LIMITES.maxVars + ' variables.');
    const datos = [], ids = [], filasExcel = [], descartadas = [];
    tabla.filasDatos.forEach(function (r, i) {
      const v = cols.map(c => c.valores[i]);
      const vacia = cols.filter((c, j) => v[j] === null).map(c => c.nombre);
      const txt = cols.filter((c, j) => v[j] !== null && Number.isNaN(v[j])).map(c => c.nombre);
      if (vacia.length || txt.length) {
        descartadas.push({ fila: r.filaExcel, motivo: (vacia.length ? 'vacía en ' + vacia.join(', ') : '') + (vacia.length && txt.length ? '; ' : '') + (txt.length ? 'texto en ' + txt.join(', ') : '') });
        return;
      }
      datos.push(v);
      ids.push(idCol && r.celdas[tabla.columnas.indexOf(idCol)] !== null && r.celdas[tabla.columnas.indexOf(idCol)] !== undefined
        ? String(r.celdas[tabla.columnas.indexOf(idCol)]) : 'Fila ' + r.filaExcel);
      filasExcel.push(r.filaExcel);
    });
    if (descartadas.length) {
      avisos.push('Se descartaron ' + descartadas.length + ' fila(s) con datos faltantes o no numéricos (p. ej. fila ' +
        descartadas.slice(0, 3).map(d => d.fila + ': ' + d.motivo).join('; fila ') + (descartadas.length > 3 ? '…' : '') + ').');
    }
    const n = datos.length;
    if (!errores.length) {
      if (n < LIMITES.minFilas) errores.push('Quedan ' + n + ' clientes válidos; se necesitan al menos ' + LIMITES.minFilas + '.');
      else if (n > LIMITES.maxFilas) errores.push('El archivo tiene ' + n + ' clientes válidos; el máximo es ' + LIMITES.maxFilas + ' (tomen una muestra).');
      else if (n < LIMITES.minPorSegmento * k) errores.push('Con ' + n + ' clientes se recomiendan como máximo k = ' + Math.floor(n / LIMITES.minPorSegmento) + ' arquetipos (al menos ' + LIMITES.minPorSegmento + ' clientes por arquetipo).');
    }
    // variables que quedaron constantes tras descartar filas
    if (!errores.length) cols.forEach(function (c, j) {
      const x = datos.map(f => f[j]);
      if (x.every(v => v === x[0])) errores.push('La variable «' + c.nombre + '» tiene el mismo valor en todas las filas válidas; quítenla.');
    });
    return { errores, avisos, datos, ids, filasExcel, descartadas, nombres: nombresVars };
  }

  const M = { LIMITES, REQUERIDAS, aNumero, procesarTabla, mapearColumnas, construirMatriz };
  if (typeof module === 'object' && module.exports) module.exports = M;
  else raiz.DatosPropios = M;
})(this);
