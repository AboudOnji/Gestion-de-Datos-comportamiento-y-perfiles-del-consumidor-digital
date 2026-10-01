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
const mapa = DP.variablesDisponibles(tabla);
comprobar('Ejemplo sin errores de formato', tabla.errores.length === 0 && mapa.errores.length === 0, tabla.errores.concat(mapa.errores).join(' '));
comprobar('Ejemplo: ID_cliente detectado como identificador', tabla.idCol === 'ID_cliente');
// los nombres se toman tal cual vienen en el Excel (el usuario puede renombrarlos)
comprobar('Ejemplo: 3 variables numéricas, con los nombres del archivo', mapa.nombres.length === 3, mapa.nombres.join(', '));
comprobar('Ejemplo: se reconocen como variables del libro', DP.sonVariablesDelLibro(mapa.nombres));

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

/* (1b) Comparación rígido/difuso e interpretación de la silueta */
{
  const M = DP.construirMatriz(tabla, mapa.nombres, 3);
  const R = Cap02.analizarConArquetipos(M.datos, refs[0].arquetipos);
  const c = Cap02.compararRigidoDifuso(R.ajustado.etiqueta, R.ajustado.U);
  comprobar('Rígido/difuso: ambiguos = los del FCM ajustado', c.ambiguos === Math.round(R.ajustado.ambiguos * M.datos.length), c.ambiguos + ' clientes');
  comprobar('Rígido/difuso: seguros + ambiguos = tamaño de cada segmento', c.porSegmento.every(p => p.seguros + p.ambiguos === p.tam));
  comprobar('Rígido/difuso: los segmentos se emparejan con su arquetipo', c.mapa.join() === '0,1,2', c.mapa.join());
  comprobar('Rígido/difuso: % de coincidencia', c.pctCoinciden > 95 && c.pctCoinciden <= 100, c.pctCoinciden.toFixed(1) + ' %');
  comprobar('Silueta: zonas de Kaufman y Rousseeuw', [0.2, 0.25, 0.3, 0.5, 0.6, 0.7, 0.8].map(v => Cap02.nivelSilueta(v).nivel).join('|') ===
    'sin estructura clara|sin estructura clara|débil|débil|razonable|razonable|fuerte');
}

/* (2) Reglas de formato con archivos «de alumno» */
const cab = ['ID_cliente', 'Frecuencia_mensual', 'Ticket_promedio_MXN', 'Engagement_digital', 'Canal'];
const base = Array.from({ length: 30 }, (_, i) => ['C' + i, 1 + (i % 5), 300 + 20 * i, 10 + 3 * i, i % 2 ? 'web' : 'app']);
const tres = ['Frecuencia_mensual', 'Ticket_promedio_MXN', 'Engagement_digital'];

let t = DP.procesarTabla([cab].concat(base));
let mp = DP.variablesDisponibles(t);
comprobar('Columna de texto (Canal) no es variable', mp.errores.length === 0 && !mp.nombres.includes('Canal') && mp.nombres.length === 3);

const libres = ['Folio', 'Visitas_web', 'Gasto promedio ($)', 'Antigüedad (meses)', 'Región'];
t = DP.procesarTabla([libres].concat(base.map((f, i) => ['F' + i, f[1], f[2], 2 + (i * 7) % 30, i % 2 ? 'Norte' : 'Sur'])));
mp = DP.variablesDisponibles(t);
// «Folio» es texto (F0, F1…) y «Región» también: solo quedan las 3 numéricas, con su nombre original
comprobar('Nombres de columna libres se detectan tal cual', mp.errores.length === 0 &&
  mp.nombres.join('|') === 'Visitas_web|Gasto promedio ($)|Antigüedad (meses)', mp.nombres.join(' | '));
comprobar('Columnas libres no se confunden con las del libro', !DP.sonVariablesDelLibro(mp.nombres));
const prop = DP.proponerArquetipos(t, mp.nombres, 3);
comprobar('Propuesta automática: 3 arquetipos ordenados bajo < medio < alto en cada variable',
  prop.length === 3 && mp.nombres.every(n => prop[0][n] <= prop[1][n] && prop[1][n] <= prop[2][n]), JSON.stringify(prop));
{
  const Mx = DP.construirMatriz(t, mp.nombres, 3);
  const Rx = Cap02.analizarConArquetipos(Mx.datos, prop.map(a => mp.nombres.map(n => a[n])));
  comprobar('Análisis completo con columnas de nombre libre', Mx.errores.length === 0 && Rx.ajustado.tam.reduce((a, b) => a + b, 0) === 30 && Number.isFinite(Rx.ajustado.silProm),
    'silueta ' + Rx.ajustado.silProm.toFixed(3));
}
comprobar('Valores del libro con encabezado renombrado (Frecuencia_men)', DP.valorDelLibro(1, 'Frecuencia_men') === 4 && DP.valorDelLibro(0, 'ticket promedio (MXN)') === 350 && DP.valorDelLibro(0, 'Visitas') === null);

t = DP.procesarTabla([['ID', 'Gasto', 'Canal']].concat(base.map(f => [f[0], f[2], f[4]])));
comprobar('Una sola columna numérica: error claro', DP.variablesDisponibles(t).errores.some(e => e.includes('al menos 2 columnas numéricas')));

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
comprobar('Columna constante: no se ofrece como variable', !DP.variablesDisponibles(t).nombres.includes('Ticket_promedio_MXN'));

m = DP.construirMatriz(DP.procesarTabla([cab].concat(base.slice(0, 15))), tres, 3);
comprobar('Menos de 20 clientes: error', m.errores.some(e => e.includes('al menos 20')));

m = DP.construirMatriz(DP.procesarTabla([cab].concat(base)), tres, 4);
comprobar('Pocos clientes por arquetipo: error con k sugerido', m.errores.some(e => e.includes('k = 3')), m.errores[0]);

const csv = 'ID_cliente,Frecuencia_mensual,Ticket_promedio_MXN,Engagement_digital\n' + base.map(f => f.slice(0, 4).join(',')).join('\n');
const wbCsv = XLSX.read(csv, { type: 'string' });
t = DP.procesarTabla(leer(wbCsv, wbCsv.SheetNames[0]));
comprobar('CSV se lee igual que Excel', t.errores.length === 0 && DP.variablesDisponibles(t).nombres.length === 3 && t.filasDatos.length === 30);

console.log('\n' + (total - fallas) + ' de ' + total + ' comprobaciones correctas.');
process.exit(fallas ? 1 : 0);
