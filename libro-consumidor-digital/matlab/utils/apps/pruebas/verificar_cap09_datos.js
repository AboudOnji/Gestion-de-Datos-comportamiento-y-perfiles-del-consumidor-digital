/* verificar_cap09_datos.js — pruebas de la app de datos propios (Cap. 9):
   (1) los Excel de ejemplo, con tres escenarios de juicios cada uno, dan los mismos resultados que
       MATLAB (referencias_cap09_datos.json): pesos AHP, lambda máximo, razón de consistencia, par más
       contradictorio, cercanía TOPSIS, elección con pesos AHP y con pesos iguales y barrido;
   (2) con los datos del libro el modelo reproduce cap09.js (el del laboratorio);
   (3) las reglas de formato detectan los errores típicos y la hoja «Juicios» se lee en formato
       lista y en formato matriz.
   Uso:  node pruebas/verificar_cap09_datos.js   (desde matlab/utils/apps) */
'use strict';
const path = require('path'), fs = require('fs');
const raiz = path.join(__dirname, '..');
const XLSX = require(path.join(raiz, 'vendor', 'xlsx.full.min.js'));
const DP = require(path.join(raiz, 'modelos', 'cap02_datos.js'));
const Cap09 = require(path.join(raiz, 'modelos', 'cap09.js'));
const C9 = require(path.join(raiz, 'modelos', 'cap09_datos.js'));
const refs = require(path.join(__dirname, 'referencias_cap09_datos.json'));

let total = 0, fallas = 0;
function comprobar(n, ok, d) { total++; if (!ok) fallas++; console.log((ok ? '[OK]    ' : '[FALLO] ') + n + (d ? ' · ' + d : '')); }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const leer = (wb, h) => XLSX.utils.sheet_to_json(wb.Sheets[h], { header: 1, raw: true, defval: null, blankrows: false });
const carpeta = path.join(raiz, '..', '..', 'cap09');
const cargar = f => XLSX.read(fs.readFileSync(path.join(carpeta, f)), { type: 'buffer' });
const lista = v => (Array.isArray(v) ? v : [v]);
const leerTodo = wb => {
  const D = C9.leerDecision(DP.procesarTabla(leer(wb, 'Alternativas')));
  const T = C9.leerTipos(DP.procesarTabla(leer(wb, 'Criterios')), D.criterios);
  const J = C9.leerJuicios(DP.procesarTabla(leer(wb, 'Juicios')), D.criterios);
  return { D, T, J };
};

/* (1) contra MATLAB */
refs.forEach(function (r) {
  const { D, T, J } = leerTodo(cargar(r.archivo));
  const tag = r.archivo.replace('cap09_datos_ejemplo', 'ej').replace('.xlsx', '') + ' ' + r.escenario;
  const Jm = r.J.map(f => lista(f));
  const R = C9.evaluar(D, { esCosto: T.esCosto, J: r.escenario === 'A' ? J.J : Jm, barrido: r.barrido });
  if (r.escenario === 'A') comprobar(tag + ': los juicios leídos coinciden con la matriz de MATLAB', J.J.every((f, i) => f.every((x, j) => cerca(x, Jm[i][j], 1e-12))));
  comprobar(tag + ': pesos AHP', R.a.pesos.every((w, i) => cerca(w, lista(r.pesos)[i], 1e-9)), R.a.pesos.map(w => w.toFixed(4)).join('/'));
  comprobar(tag + ': lambda máximo y razón de consistencia', cerca(R.a.lambda, r.lambdaMax, 1e-9) && cerca(R.a.cr, r.cr, 1e-8) && R.metricas.consistente === r.consistente, R.a.cr.toFixed(4) + ' vs ' + r.cr.toFixed(4));
  comprobar(tag + ': par más contradictorio', R.metricas.peorPar === r.peorPar, R.metricas.peorPar + ' vs ' + r.peorPar);
  comprobar(tag + ': elige ' + r.ganadorAHP + ' (pesos AHP) y ' + r.ganadorIguales + ' (iguales)', D.alternativas[R.gAHP] === r.ganadorAHP && D.alternativas[R.gIg] === r.ganadorIguales && cerca(R.metricas.cercaniaGanador, r.cercaniaGanador, 1e-9));
  comprobar(tag + ': barrido (101 puntos) y cambios', R.nCambios === r.nCambios && R.ganadorBarrido.every((g, i) => g + 1 === r.ganBarrido[i]));
});

/* (2) el libro */
{
  const { D, T, J } = leerTodo(cargar('cap09_datos_ejemplo.xlsx'));
  const R = C9.evaluar(D, { esCosto: T.esCosto, J: J.J, barrido: 4 });
  const L = Cap09.ejecutar(Cap09.DEFECTO);
  comprobar('Libro: pesos, consistencia y cercanías idénticos a cap09.js', R.a.pesos.every((w, i) => cerca(w, L.ahp.pesos[i], 1e-12)) && cerca(R.a.cr, L.ahp.cr, 1e-12) && R.t.cercania.every((c, i) => cerca(c, L.t.cercania[i], 1e-12)));
  comprobar('Libro: mismo ganador con pesos AHP y con pesos iguales y mismo barrido del costo', D.alternativas[R.gAHP] === L.metricas.ganadorAHP && D.alternativas[R.gIg] === L.metricas.ganadorIguales && R.nCambios === L.metricas.nCambios &&
    R.ganadorBarrido.every((g, i) => g === L.ganadorBarrido[i]));
}

/* (3) reglas de formato */
const alt = [['Opción', 'A', 'B'], ['x', 1, 2], ['y', 2, 3], ['z', 3, 1]];
const leerA = f => C9.leerDecision(DP.procesarTabla(f));
comprobar('Formato: tabla correcta sin errores', leerA(alt).errores.length === 0);
comprobar('Formato: menos de 3 alternativas', leerA(alt.slice(0, 3)).errores.some(e => /al menos 3 alternativas/.test(e)));
comprobar('Formato: más de 8 criterios', leerA([['Alt'].concat(Array.from({ length: 9 }, (_, i) => 'C' + i))].concat([1, 2, 3].map(k => ['a' + k].concat(Array.from({ length: 9 }, (_, i) => i + k))))).errores.some(e => /máximo es 8/.test(e)));
comprobar('Formato: una columna llena de ceros', leerA([['Alt', 'A', 'B'], ['x', 0, 2], ['y', 0, 3], ['z', 0, 1]]).errores.some(e => /vale 0 en todas/.test(e)));
comprobar('Formato: celda vacía', leerA([['Alt', 'A', 'B'], ['x', 1, 2], ['y', null, 3], ['z', 3, 1]]).errores.some(e => /Falta un número/.test(e)));
comprobar('Juicios en lista: se leen y el recíproco se completa', (function () {
  const j = C9.leerJuicios(DP.procesarTabla([['Criterio_A', 'Criterio_B', 'Juicio'], ['A', 'B', 3]]), ['A', 'B']);
  return j.J[0][1] === 3 && Math.abs(j.J[1][0] - 1 / 3) < 1e-15 && j.leido;
})());
comprobar('Juicios en matriz: solo el triángulo superior cuenta', (function () {
  const j = C9.leerJuicios(DP.procesarTabla([['Criterio', 'A', 'B'], ['A', 1, 5], ['B', 0.9, 1]]), ['A', 'B']);
  return j.J[0][1] === 5 && Math.abs(j.J[1][0] - 0.2) < 1e-15;
})());
comprobar('Juicios fuera de la escala 1/9 a 9 se ignoran con aviso', (function () {
  const j = C9.leerJuicios(DP.procesarTabla([['Criterio_A', 'Criterio_B', 'Juicio'], ['A', 'B', 12]]), ['A', 'B']);
  return j.J[0][1] === 1 && j.avisos.some(a => /fuera de la escala/.test(a));
})());
comprobar('Sin hoja de juicios: todo vale 1', C9.leerJuicios(null, ['A', 'B', 'C']).J.every((f, i) => f.every((x, j) => x === (i === j ? 1 : 1)))); 

console.log('\n' + (total - fallas) + ' de ' + total + ' comprobaciones correctas.');
process.exit(fallas ? 1 : 0);
