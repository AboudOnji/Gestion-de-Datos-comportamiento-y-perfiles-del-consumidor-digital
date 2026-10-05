/* verificar_cap03_datos.js — pruebas de la app de datos propios (Cap. 3):
   (1) el Excel de ejemplo, con varios juegos de parámetros, da los mismos
       resultados que MATLAB (referencias_cap03_datos.json, generado por
       referencias_cap03_datos.m): calidad, RFM, CLV (simple, anualizado y
       descontado), concentración del CLV y prueba A/B de la hoja «Experimento»;
   (2) el modelo reproduce el script del libro con su base interna;
   (3) las reglas de formato detectan los errores típicos de los alumnos.
   Uso:  node pruebas/verificar_cap03_datos.js   (desde matlab/utils/apps) */
'use strict';
const path = require('path');
const fs = require('fs');
const raiz = path.join(__dirname, '..');
const XLSX = require(path.join(raiz, 'vendor', 'xlsx.full.min.js'));
const DP = require(path.join(raiz, 'modelos', 'cap02_datos.js'));
const Cap03 = require(path.join(raiz, 'modelos', 'cap03.js'));
const C3 = require(path.join(raiz, 'modelos', 'cap03_datos.js'));
const refs = require(path.join(__dirname, 'referencias_cap03_datos.json'));

let total = 0, fallas = 0;
function comprobar(nombre, ok, detalle) {
  total++; if (!ok) fallas++;
  console.log((ok ? '[OK]    ' : '[FALLO] ') + nombre + (detalle ? ' · ' + detalle : ''));
}
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const leer = (wb, hoja) => XLSX.utils.sheet_to_json(wb.Sheets[hoja], { header: 1, raw: true, defval: null, blankrows: false });

/* (1) Excel de ejemplo contra MATLAB */
const wb = XLSX.read(fs.readFileSync(path.join(raiz, '..', '..', 'cap03', 'cap03_datos_ejemplo.xlsx')), { type: 'buffer' });
comprobar('El ejemplo tiene las hojas Datos y Experimento', wb.SheetNames.join() === 'Datos,Experimento', wb.SheetNames.join());
const tabla = DP.procesarTabla(leer(wb, 'Datos'));
comprobar('Ejemplo sin errores de formato', tabla.errores.length === 0, tabla.errores.join(' '));
comprobar('ID_cliente detectado como identificador', tabla.idCol === 'ID_cliente');
const sug = C3.sugerirColumnas(tabla);
comprobar('Columnas sugeridas por nombre', sug.r === 'Recencia_dias' && sug.f === 'Frecuencia_compras' && sug.m === 'Monto_promedio_MXN', JSON.stringify(sug));

const clave = s => ({ 'Campeón': 'Campeon', 'Leal': 'Leal', 'En riesgo': 'EnRiesgo', 'Perdido': 'Perdido' }[s]);
refs.filter(r => r.caso !== 'ab').forEach(function (r) {
  const R = C3.analizarClientes(tabla, sug, { horizonteAnios: r.horizonteAnios, mesesPeriodo: r.mesesPeriodo, tasaDescuento: r.tasaDescuento });
  comprobar(r.caso + ': sin errores', R.errores.length === 0, R.errores.join(' '));
  comprobar(r.caso + ': faltantes', R.calidad.nFalt === r.nFalt, R.calidad.nFalt + ' vs ' + r.nFalt);
  comprobar(r.caso + ': atípicos', R.calidad.nAt === r.nAtipicos, R.calidad.nAt + ' vs ' + r.nAtipicos);
  comprobar(r.caso + ': límite superior 1.5×RIC', cerca(R.calidad.limSup, r.limSup, 1e-9), R.calidad.limSup + ' vs ' + r.limSup);
  C3.ORDEN.forEach(function (s, i) {
    const k = clave(s);
    comprobar(r.caso + ': clientes ' + s, R.resumen[i].clientes === r['n_' + k], R.resumen[i].clientes + ' vs ' + r['n_' + k]);
    comprobar(r.caso + ': CLV promedio ' + s, cerca(R.resumen[i].clvProm, r['clv_' + k], 1e-9), R.resumen[i].clvProm.toFixed(2) + ' vs ' + r['clv_' + k].toFixed(2));
    comprobar(r.caso + ': % del CLV ' + s, cerca(R.resumen[i].pctClv, r['pctClv_' + k], 1e-9));
  });
  comprobar(r.caso + ': % del CLV del 20 % superior', cerca(R.pctTop20, r.pctTop20, 1e-9), R.pctTop20.toFixed(3) + ' vs ' + r.pctTop20.toFixed(3));
});

// Prueba A/B de la hoja Experimento
const ex = C3.leerExperimento(leer(wb, 'Experimento'));
const ab = refs.find(r => r.caso === 'ab').ab;
comprobar('Experimento: sin errores', ex.errores.length === 0, ex.errores.join(' '));
comprobar('Experimento: conteos como MATLAB', ex.nA === ab.nA && ex.conversionesA === ab.cA && ex.nB === ab.nB && ex.conversionesB === ab.cB,
  [ex.nA, ex.conversionesA, ex.nB, ex.conversionesB].join('/'));
[['a005', 0.05], ['a010', 0.10]].forEach(function ([k, alfa]) {
  const t = C3.pruebaAB(ex.nA, ex.conversionesA, ex.nB, ex.conversionesB, alfa), m = ab[k];
  comprobar('A/B α=' + alfa + ': z', cerca(t.z, m.z, 1e-9));
  comprobar('A/B α=' + alfa + ': valor p', cerca(t.valorP, m.valorP, 1e-7), t.valorP + ' vs ' + m.valorP);
  comprobar('A/B α=' + alfa + ': IC de la diferencia', cerca(t.icDif[0], m.difInf, 1e-7) && cerca(t.icDif[1], m.difSup, 1e-7));
  comprobar('A/B α=' + alfa + ': muestra por versión (potencia 80 %)', t.nNecesario === m.nNecesario, t.nNecesario + ' vs ' + m.nNecesario);
});

// Simulación «¿y si fuera solo azar?»: debe aproximar al valor p exacto
const sim = C3.simularAzar(ex.nA, ex.conversionesA, ex.nB, ex.conversionesB, 2000, 2026);
comprobar('Simulación del azar: ~ valor p exacto (±0.025)', Math.abs(sim.pSim - ab.a005.valorP) < 0.025, sim.pSim + ' vs ' + ab.a005.valorP);
comprobar('Simulación del azar: centrada en 0 (media de diferencias ±0.15 pp)', Math.abs(sim.difs.reduce((a, b) => a + b, 0) / sim.difs.length) < 0.15);
comprobar('Simulación reproducible con la misma semilla', C3.simularAzar(100, 10, 100, 20, 200, 5).extremos === C3.simularAzar(100, 10, 100, 20, 200, 5).extremos);

/* (2) El modelo reproduce el script del libro con su base interna (sin redondear a centavos) */
const base = require(path.join(raiz, 'datos', 'cap03_datos.json'));
const libro = Cap03.ejecutar(Object.assign({}, Cap03.DEFECTO), base);
const filasLibro = [['ID', 'R', 'F', 'M']].concat(base['300'].r.map((r, i) => ['C' + i, r, base['300'].f[i], base['300'].m[i]]));
const R0 = C3.analizarClientes(DP.procesarTabla(filasLibro), { r: 'R', f: 'F', m: 'M' }, { horizonteAnios: 3, mesesPeriodo: 12, tasaDescuento: 0 });
comprobar('Con la base del script: segmentos idénticos a Cap03.ejecutar', JSON.stringify(R0.resumen.map(x => x.clientes)) === JSON.stringify(libro.conteos), R0.resumen.map(x => x.clientes) + ' vs ' + libro.conteos);
comprobar('Con la base del script: CLV por segmento idéntico', R0.resumen.every((x, i) => cerca(x.clvProm, libro.clvProm[i], 1e-9)));

/* (3) Reglas de formato y casos límite */
const enc = ['ID_cliente', 'Recencia', 'Frecuencia', 'Monto'];
const gen = (n, f) => [enc].concat(Array.from({ length: n }, (_, i) => f(i)));
const analiza = (filas, P) => { const t = DP.procesarTabla(filas); return C3.analizarClientes(t, C3.sugerirColumnas(t), Object.assign({ horizonteAnios: 3, mesesPeriodo: 12, tasaDescuento: 0 }, P || {})); };
const lcg = s => () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
const u = lcg(7);
const bueno = gen(100, i => ['K' + i, Math.floor(u() * 120), 1 + Math.floor(u() * 9), 200 + Math.round(u() * 600)]);
comprobar('Datos sintéticos válidos: sin errores', analiza(bueno).errores.length === 0);
comprobar('Menos de 30 clientes: error', analiza(bueno.slice(0, 20)).errores.length === 1);
const dup = bueno.map(f => f.slice()); dup[5][0] = dup[4][0]; dup[9][0] = dup[8][0];
const rd = analiza(dup);
comprobar('IDs repetidos: se descartan y se avisa', rd.n === 98 && rd.avisos.some(a => /ID repetido/.test(a)), rd.n + ' clientes');
const sinMonto = bueno.map(f => f.slice()); for (let i = 1; i <= 100; i += 4) sinMonto[i][3] = null;
const rm = analiza(sinMonto);
comprobar('Montos vacíos: se imputan con la mediana', rm.calidad.nFalt === 25 && rm.montoLimpio.every(Number.isFinite), 'faltantes = ' + rm.calidad.nFalt);
const neg = bueno.map(f => f.slice()); neg[3][3] = -150; neg[4][3] = 0; neg[5][3] = '916 pesos';
const rn = analiza(neg);
comprobar('Montos negativos, cero o con texto: se tratan como faltantes y se avisa',
  rn.calidad.montosNoPositivos === 2 && rn.calidad.montosTexto === 1 && rn.calidad.nFalt === 3);
const sinF = bueno.map(f => f.slice()); sinF[2][2] = 0; sinF[3][2] = null; sinF[4][1] = -3;
comprobar('Frecuencia 0/vacía o recencia negativa: fila descartada', analiza(sinF).n === 97);
const empates = gen(200, i => ['E' + i, Math.floor(u() * 100), 1 + (i % 3), 300 + Math.round(u() * 500)]); // frecuencia solo 1, 2, 3
const re = analiza(empates);
comprobar('Frecuencia con muchos empates: usa rango promedio y avisa', re.errores.length === 0 && !re.exactos.f && re.avisos.some(a => /repetidos/.test(a)));
comprobar('Con empates los puntajes siguen en 1–5 y las filas con el mismo valor comparten puntaje',
  re.puntajeF.every(v => v >= 1 && v <= 5) && [1, 2, 3].every(f => new Set(re.puntajeF.filter((_, i) => re.frecuencia[i] === f)).size === 1));
const mismas = analiza(gen(60, i => ['M' + i, 10, 3, 500]));
comprobar('Todos iguales (sin variación): no truena', mismas.errores.length === 0 && mismas.resumen.reduce((s, x) => s + x.clientes, 0) === 60);
const fh = C3.factorHorizonte(3, 0.10);
comprobar('Factor de CLV descontado (3 años, 10 %) = 2.4869', cerca(fh, 1 / 1.1 + 1 / 1.21 + 1 / 1.331, 1e-12) && cerca(fh, 2.4869, 1e-4), String(fh));
comprobar('Con d = 0 el CLV descontado es el simple', C3.factorHorizonte(4, 0) === 4);
comprobar('Tres columnas iguales: error', DP.procesarTabla(bueno) && C3.analizarClientes(DP.procesarTabla(bueno), { r: 'Recencia', f: 'Recencia', m: 'Monto' }, C3.DEFECTO).errores.length === 1);
const texto = DP.procesarTabla([['x', 'y'], [1, 2]]);
comprobar('Hoja con una sola columna numérica: no hay forma de elegir 3 columnas', C3.sugerirColumnas(texto).m === null);

// formatos del experimento
const eRes = C3.leerExperimento([['Version', 'Visitantes', 'Conversiones'], ['A', 1000, 100], ['B', 1000, 130]]);
comprobar('Experimento en formato resumen', eRes.errores.length === 0 && eRes.nA === 1000 && eRes.conversionesB === 130);
const eSi = C3.leerExperimento([['ID', 'Variante', 'Compró'], [1, 'Control', 'Sí'], [2, 'Control', 'No'], [3, 'Nueva', 'Sí'], [4, 'Nueva', 'Sí']]);
comprobar('Experimento con Sí/No y nombres distintos de A/B: A es el primero alfabéticamente y avisa', eSi.errores.length === 0 && eSi.nA === 2 && eSi.conversionesA === 1 && eSi.conversionesB === 2 && eSi.avisos.length === 1, JSON.stringify(eSi));
comprobar('Experimento sin columna de versión: error', C3.leerExperimento([['ID', 'Convirtio'], [1, 0]]).errores.length === 1);
comprobar('Experimento con tres versiones: error', C3.leerExperimento([['Version', 'Convirtio'], ['A', 0], ['B', 1], ['C', 1]]).errores.length === 1);

console.log('\n' + (total - fallas) + ' de ' + total + ' comprobaciones correctas.');
process.exit(fallas ? 1 : 0);
