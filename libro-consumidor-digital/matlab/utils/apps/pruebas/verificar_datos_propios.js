/* verificar_datos_propios.js — pruebas de la app de datos propios (Cap. 2):
   (1) el Excel de ejemplo, con varios juegos de arquetipos, da los mismos
       resultados que MATLAB (referencias_datos_propios.json, generado por
       referencias_datos_propios.m): arquetipos fijos y ajustados;
   (2) las reglas de formato detectan los errores típicos de los alumnos.
   Uso:  node pruebas/verificar_datos_propios.js   (desde matlab/utils/apps) */
'use strict';
const path = require('path');
const raiz = path.join(__dirname, '..');
const XLSX = require(path.join(raiz, 'vendor', 'xlsx.full.min.js'));
const Cap02 = require(path.join(raiz, 'modelos', 'cap02.js'));
const DP = require(path.join(raiz, 'modelos', 'cap02_datos.js'));
const refs = require(path.join(__dirname, 'referencias_datos_propios.json'));

let total = 0, fallas = 0;
function comprobar(nombre, ok, detalle) {
  total++; if (!ok) fallas++;
  console.log((ok ? '[OK]    ' : '[FALLO] ') + nombre + (detalle ? ' · ' + detalle : ''));
}
const leer = (wb, hoja) => XLSX.utils.sheet_to_json(wb.Sheets[hoja], { header: 1, raw: true, defval: null, blankrows: false });

/* (1) Excel de ejemplo + arquetipos contra MATLAB */
// como en el navegador: se leen los bytes del archivo y se pasan a XLSX.read
const wb = XLSX.read(require('fs').readFileSync(path.join(raiz, '..', '..', 'cap02', 'cap02_datos_ejemplo.xlsx')), { type: 'buffer' });
comprobar('El ejemplo tiene una sola hoja: Datos', wb.SheetNames.join() === 'Datos', wb.SheetNames.join());
const tabla = DP.procesarTabla(leer(wb, 'Datos'));
const mapa = DP.mapearColumnas(tabla);
comprobar('Ejemplo sin errores de formato', tabla.errores.length === 0 && mapa.errores.length === 0, tabla.errores.concat(mapa.errores).join(' '));
comprobar('Ejemplo: ID_cliente detectado como identificador', tabla.idCol === 'ID_cliente');
comprobar('Ejemplo: las 3 columnas del libro', mapa.nombres.join() === 'Frecuencia_mensual,Ticket_promedio_MXN,Engagement_digital', mapa.nombres.join(', '));

const cerca = (a, b, tol) => Math.abs(a - b) <= tol;
// todas las permutaciones de 0..k-1 (k <= 4 en las pruebas)
const permutaciones = k => k === 1 ? [[0]] : permutaciones(k - 1).flatMap(p => Array.from({ length: k }, (_, i) => p.slice(0, i).concat([k - 1], p.slice(i))));
refs.forEach(function (r) {
  const k = r.arquetipos.length, nom = r.juego;
  const M = DP.construirMatriz(tabla, mapa.nombres, k);
  const R = Cap02.analizarConArquetipos(M.datos, r.arquetipos);
  comprobar(nom + ' · fijos: silueta', cerca(R.fijo.silProm, r.silFijo, 1e-6), R.fijo.silProm.toFixed(6) + ' vs MATLAB ' + r.silFijo.toFixed(6));
  comprobar(nom + ' · fijos: % ambiguos', cerca(100 * R.fijo.ambiguos, r.ambFijo, 1e-6), (100 * R.fijo.ambiguos).toFixed(2) + ' vs MATLAB ' + r.ambFijo.toFixed(2));
  comprobar(nom + ' · fijos: clientes por arquetipo', R.fijo.tam.join() === [].concat(r.tamFijo).join(), R.fijo.tam.join() + ' vs MATLAB ' + r.tamFijo);
  comprobar(nom + ' · ajustados k-means: silueta', cerca(R.ajustado.silProm, r.silAj, 1e-6), R.ajustado.silProm.toFixed(6) + ' vs MATLAB ' + r.silAj.toFixed(6));
  comprobar(nom + ' · ajustados k-means: clientes por segmento', R.ajustado.tam.join() === [].concat(r.tamAj).join(), R.ajustado.tam.join() + ' vs MATLAB ' + r.tamAj);
  comprobar(nom + ' · clientes que cambian', R.cambian === r.cambian, R.cambian + ' vs MATLAB ' + r.cambian);
  // FCM: MATLAB no permite fijar el inicio (ver referencias_datos_propios.m);
  // se emparejan los centros y se toleran diferencias de convergencia.
  const Cm = r.centrosFCM, Ca = R.ajustado.centrosFCM;
  const distZ = p => Math.max.apply(null, p.map((q, s) => Math.max.apply(null, Ca[s].map((v, j) => Math.abs(v - Cm[q][j]) / R.sd[j]))));
  const mejor = Math.min.apply(null, permutaciones(k).map(distZ));
  comprobar(nom + ' · ajustados FCM: centros (máx. diferencia en desv. est.)', mejor < 0.05, mejor.toFixed(4) + ' < 0.05');
  comprobar(nom + ' · ajustados FCM: % ambiguos (±0.5 pp = 1 cliente)', cerca(100 * R.ajustado.ambiguos, r.ambAj, 0.5), (100 * R.ajustado.ambiguos).toFixed(2) + ' vs MATLAB ' + r.ambAj.toFixed(2));
});

/* (2) Reglas de formato con archivos «de alumno» */
const cab = ['ID_cliente', 'Frecuencia_mensual', 'Ticket_promedio_MXN', 'Engagement_digital', 'Canal'];
const base = Array.from({ length: 30 }, (_, i) => ['C' + i, 1 + (i % 5), 300 + 20 * i, 10 + 3 * i, i % 2 ? 'web' : 'app']);
const tres = ['Frecuencia_mensual', 'Ticket_promedio_MXN', 'Engagement_digital'];

let t = DP.procesarTabla([cab].concat(base));
let mp = DP.mapearColumnas(t);
comprobar('Columna extra (Canal) se ignora con aviso', mp.errores.length === 0 && mp.avisos.some(a => a.includes('Canal')));

t = DP.procesarTabla([['id', 'frecuencia mensual', 'Ticket promedio (MXN)', 'ENGAGEMENT DIGITAL']].concat(base.map(f => f.slice(0, 4))));
mp = DP.mapearColumnas(t);
comprobar('Encabezados con espacios/mayúsculas/paréntesis se reconocen', mp.errores.length === 0 && mp.nombres.length === 3, mp.nombres.join(' | '));

t = DP.procesarTabla([['ID_cliente', 'Frecuencia_mensual', 'Engagement_digital']].concat(base.map(f => [f[0], f[1], f[3]])));
mp = DP.mapearColumnas(t);
comprobar('Falta una columna: error que dice cuál', mp.errores.some(e => e.includes('Ticket_promedio_MXN')), mp.errores[0]);

t = DP.procesarTabla([cab].concat(base.map((f, i) => i === 3 ? [f[0], f[1], '$1,250.00', f[3], f[4]] : f)));
comprobar('Texto con $ y comas se convierte a número', t.columnas[2].valores[3] === 1250);

t = DP.procesarTabla([cab].concat(base.map((f, i) => i === 5 ? [f[0], null, f[2], f[3], f[4]] : (i === 7 ? [f[0], f[1], '916 pesos', f[3], f[4]] : f))));
let m = DP.construirMatriz(t, tres, 3);
comprobar('Filas con vacío o texto se descartan y se reportan', m.datos.length === 28 && m.descartadas.map(d => d.fila).join() === '7,9', JSON.stringify(m.descartadas));

t = DP.procesarTabla(base);
comprobar('Sin encabezados: error claro', t.errores.some(e => e.includes('encabezados')), t.errores[0]);

t = DP.procesarTabla([[null, null], [null, null], cab].concat(base));
comprobar('Filas vacías arriba: aviso y encabezados encontrados', t.avisos.some(a => a.includes('fila(s) vacía(s)')) && t.errores.length === 0);

t = DP.procesarTabla([cab].concat(base.map(f => [f[0], f[1], 500, f[3], f[4]])));
mp = DP.mapearColumnas(t);
comprobar('Columna requerida constante: error', mp.errores.some(e => e.includes('mismo valor')));

t = DP.procesarTabla([cab].concat(base.map(f => [f[0], f[1], 'alto', f[3], f[4]])));
mp = DP.mapearColumnas(t);
comprobar('Columna requerida con texto: error', mp.errores.some(e => e.includes('debe tener números')));

m = DP.construirMatriz(DP.procesarTabla([cab].concat(base.slice(0, 15))), tres, 3);
comprobar('Menos de 20 clientes: error', m.errores.some(e => e.includes('al menos 20')));

m = DP.construirMatriz(DP.procesarTabla([cab].concat(base)), tres, 4);
comprobar('Pocos clientes por arquetipo: error con k sugerido', m.errores.some(e => e.includes('k = 3')), m.errores[0]);

const csv = 'ID_cliente,Frecuencia_mensual,Ticket_promedio_MXN,Engagement_digital\n' + base.map(f => f.slice(0, 4).join(',')).join('\n');
const wbCsv = XLSX.read(csv, { type: 'string' });
t = DP.procesarTabla(leer(wbCsv, wbCsv.SheetNames[0]));
comprobar('CSV se lee igual que Excel', t.errores.length === 0 && DP.mapearColumnas(t).errores.length === 0 && t.filasDatos.length === 30);

console.log('\n' + (total - fallas) + ' de ' + total + ' comprobaciones correctas.');
process.exit(fallas ? 1 : 0);
