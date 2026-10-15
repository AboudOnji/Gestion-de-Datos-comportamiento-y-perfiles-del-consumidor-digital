/* verificar_cap07_datos.js — pruebas de la app de datos propios (Cap. 7):
   (1) los Excel de ejemplo, con cuatro escenarios cada uno, dan los mismos resultados que MATLAB
       (referencias_cap07_datos.json): conversión observada y del modelo, toques por canal, último
       clic, primer clic, reparto lineal y efecto de remoción;
   (2) con los 3 000 recorridos simulados de la cadena del libro, la atribución estimada se parece a
       la del script (cap07.js): la remoción de Redes sociales ≈ 18 % y su último clic ≈ 3 %;
   (3) las reglas de formato detectan los errores típicos.
   Uso:  node pruebas/verificar_cap07_datos.js   (desde matlab/utils/apps) */
'use strict';
const path = require('path'), fs = require('fs');
const raiz = path.join(__dirname, '..');
const XLSX = require(path.join(raiz, 'vendor', 'xlsx.full.min.js'));
const DP = require(path.join(raiz, 'modelos', 'cap02_datos.js'));
const Cap07 = require(path.join(raiz, 'modelos', 'cap07.js'));
const C7 = require(path.join(raiz, 'modelos', 'cap07_datos.js'));
const refs = require(path.join(__dirname, 'referencias_cap07_datos.json'));

let total = 0, fallas = 0;
function comprobar(n, ok, d) { total++; if (!ok) fallas++; console.log((ok ? '[OK]    ' : '[FALLO] ') + n + (d ? ' · ' + d : '')); }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const leer = (wb, h) => XLSX.utils.sheet_to_json(wb.Sheets[h], { header: 1, raw: true, defval: null, blankrows: false });
const carpeta = path.join(raiz, '..', '..', 'cap07');
const cargar = f => XLSX.read(fs.readFileSync(path.join(carpeta, f)), { type: 'buffer' });
const lista = v => (Array.isArray(v) ? v : [v]);

/* (1) contra MATLAB */
const cache = {};
refs.forEach(function (r) {
  const wb = cache[r.archivo] || (cache[r.archivo] = cargar(r.archivo));
  const D = C7.leerRecorridos(DP.procesarTabla(leer(wb, 'Recorridos')));
  const tag = r.archivo.replace('cap07_datos_ejemplo', 'ej').replace('.xlsx', '') + ' colapsar=' + r.colapsar + ' long>=' + r.longMin;
  const R = C7.analizar(D, { nTopRutas: 5, longitudMinima: r.longMin, colapsar: r.colapsar });
  comprobar(tag + ': leído sin errores', D.errores.length === 0 && !R.error);
  comprobar(tag + ': recorridos y compras', cerca(R.nRutas, r.nRutas, 1e-12) && cerca(R.nConv, r.nConv, 1e-12), R.nRutas + '/' + R.nConv);
  comprobar(tag + ': conversión observada, del modelo y largo medio', cerca(100 * R.tasa, r.tasa, 1e-9) && cerca(100 * R.pModelo, r.pModelo, 1e-9) && cerca(R.largo, r.largo, 1e-9),
    (100 * R.pModelo).toFixed(3) + ' vs ' + r.pModelo.toFixed(3));
  comprobar(tag + ': mismos canales en el mismo orden', JSON.stringify(R.nombres) === JSON.stringify(lista(r.nombres)));
  ['ultimo', 'primero', 'lineal'].forEach(m => comprobar(tag + ': reparto ' + m, R.shares[m].every((x, i) => cerca(100 * x, lista(r[m])[i], 1e-9))));
  comprobar(tag + ': efecto de remoción normalizado', R.shares.remocion.every((x, i) => cerca(100 * x, lista(r.remocion)[i], 1e-8)), R.shares.remocion.map(x => (100 * x).toFixed(2)).join('/') + ' vs ' + lista(r.remocion).map(x => x.toFixed(2)).join('/'));
});

/* (2) la cadena estimada se parece a la del libro */
{
  const D = C7.leerRecorridos(DP.procesarTabla(leer(cargar('cap07_datos_ejemplo.xlsx'), 'Recorridos')));
  const R = C7.analizar(D, { nTopRutas: 5, longitudMinima: 1, colapsar: 0 });
  const libro = Cap07.ejecutar(Cap07.DEFECTO);
  const orden = Cap07.CANALES.map(c => R.nombres.indexOf(c));
  comprobar('Libro: los 4 canales del script aparecen', orden.every(i => i >= 0));
  const dQ = Math.max.apply(null, Cap07.QC.map((f, i) => Math.max.apply(null, f.map((x, j) => Math.abs(x - R.Q[orden[i]][orden[j]])))));
  comprobar('Libro: matriz de transición estimada ≈ la del script (diferencia máxima < 0.04)', dQ < 0.04, dQ.toFixed(4));
  comprobar('Libro: conversión observada ≈ analítica (34.3 %) con 3 000 recorridos', Math.abs(100 * R.tasa - 100 * libro.pConvC) < 2.5, (100 * R.tasa).toFixed(2));
  const dRem = Math.abs(100 * R.shares.remocion[orden[1]] - 100 * libro.remocion[1]), dUlt = Math.abs(100 * R.shares.ultimo[orden[1]] - 100 * libro.ultimoClic[1]);
  comprobar('Libro: remoción y último clic de Redes sociales ≈ los del script (±3 puntos)', dRem < 3 && dUlt < 3, dRem.toFixed(2) + ' / ' + dUlt.toFixed(2));
  comprobar('Libro: redes sociales es el canal más subestimado por el último clic', R.nombres[R.masSub] === 'Redes sociales');
}

/* (3) reglas de formato */
const base = (n, f) => [['Canales', 'Convirtio']].concat(Array.from({ length: n }, (_, i) => f(i)));
const leerF = f => C7.leerRecorridos(DP.procesarTabla(f));
comprobar('Formato: tabla correcta sin errores', leerF(base(30, i => (i % 3 ? ['A>B', 1] : ['B>A>A', 0]))).errores.length === 0);
comprobar('Formato: menos de 20 recorridos', leerF(base(10, i => ['A>B', i % 2])).errores.some(e => /al menos 20 recorridos/.test(e)));
comprobar('Formato: sin ninguna compra', leerF(base(30, i => ['A>B', 0])).errores.some(e => /Ningún recorrido terminó en compra/.test(e)));
comprobar('Formato: columna de conversión ilegible', leerF(base(30, i => ['A>B', i === 3 ? 'tal vez' : 1])).errores.some(e => /No entiendo si el recorrido/.test(e)));
comprobar('Formato: falta la columna de conversión', leerF([['Canales', 'Otra'], ['A>B', 1]]).errores.some(e => /terminó en compra/.test(e)));
comprobar('Formato: Sí/No y separador «->» se entienden', (function () {
  const D = leerF([['Ruta', 'Convirtio']].concat(Array.from({ length: 30 }, (_, i) => [i % 2 ? 'Redes -> Directo' : 'Correo->Directo', i % 3 ? 'Sí' : 'No'])));
  return D.errores.length === 0 && D.rutas[0].canales.length === 2 && D.rutas[1].canales[0] === 'Redes';
})());
comprobar('Formato: columnas Paso1, Paso2… como ruta', (function () {
  const D = leerF([['ID', 'Paso1', 'Paso2', 'Paso3', 'Convirtio']].concat(Array.from({ length: 30 }, (_, i) => [i, 'A', 'B', i % 2 ? 'C' : null, i % 2])));
  return D.errores.length === 0 && D.rutas[0].canales.length === 2 && D.rutas[1].canales.length === 3;
})());
comprobar('Análisis: demasiados canales', C7.analizar({ rutas: Array.from({ length: 30 }, (_, i) => ({ canales: ['c' + i, 'c' + (i + 1)], conv: i % 2 === 0, w: 1 })), avisos: [] }, { nTopRutas: 5, longitudMinima: 1, colapsar: 0 }).error !== undefined);

console.log('\n' + (total - fallas) + ' de ' + total + ' comprobaciones correctas.');
process.exit(fallas ? 1 : 0);
