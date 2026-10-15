/* verificar_cap06_datos.js — pruebas de la app de datos propios (Cap. 6):
   (1) los Excel de ejemplo, con cuatro escenarios cada uno, dan los mismos resultados que MATLAB
       (referencias_cap06_datos.json, generado por referencias_cap06_datos.m): utilidades, elección de
       cada regla, número de aceptables y barrido del peso;
   (2) con los datos del libro el modelo reproduce cap06.js (el del laboratorio);
   (3) las reglas de formato detectan los errores típicos.
   Uso:  node pruebas/verificar_cap06_datos.js   (desde matlab/utils/apps) */
'use strict';
const path = require('path'), fs = require('fs');
const raiz = path.join(__dirname, '..');
const XLSX = require(path.join(raiz, 'vendor', 'xlsx.full.min.js'));
const DP = require(path.join(raiz, 'modelos', 'cap02_datos.js'));
const Cap06 = require(path.join(raiz, 'modelos', 'cap06.js'));
const C6 = require(path.join(raiz, 'modelos', 'cap06_datos.js'));
const refs = require(path.join(__dirname, 'referencias_cap06_datos.json'));

let total = 0, fallas = 0;
function comprobar(n, ok, d) { total++; if (!ok) fallas++; console.log((ok ? '[OK]    ' : '[FALLO] ') + n + (d ? ' · ' + d : '')); }
const cerca = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const leer = (wb, h) => XLSX.utils.sheet_to_json(wb.Sheets[h], { header: 1, raw: true, defval: null, blankrows: false });
const carpeta = path.join(raiz, '..', '..', 'cap06');
const cargar = f => XLSX.read(fs.readFileSync(path.join(carpeta, f)), { type: 'buffer' });

/* (1) contra MATLAB */
refs.forEach(function (r) {
  const wb = cargar(r.archivo);
  const D = C6.leerAlternativas(DP.procesarTabla(leer(wb, 'Alternativas')));
  const K = C6.leerCriterios(DP.procesarTabla(leer(wb, 'Criterios')), D.atributos);
  const tag = r.archivo.replace('cap06_datos_ejemplo', 'ej').replace('.xlsx', '') + ' ' + r.escenario;
  const p = r.params;
  const pesos = Array.isArray(p.pesos) ? p.pesos : [p.pesos];
  const R = C6.evaluar(D, { esCosto: K.esCosto, pesos, umbralMinimo: p.umbral, prioritario: p.prio, toleranciaLex: p.tol, barrido: p.barrido });
  comprobar(tag + ': archivo leído sin errores y criterios leídos', D.errores.length === 0 && K.leido);
  comprobar(tag + ': utilidades idénticas a MATLAB', R.utilidad.every((u, i) => cerca(u, r.utilidad[i], 1e-9)));
  const nombres = D.alternativas;
  comprobar(tag + ': elige ' + r.ganadorAditiva + ' / ' + r.ganadorConj + ' / ' + r.ganadorLex,
    nombres[R.ganadorAditiva] === r.ganadorAditiva && (R.ganadorConj < 0 ? 'ninguna' : nombres[R.ganadorConj]) === r.ganadorConj && nombres[R.ganadorLex] === r.ganadorLex);
  comprobar(tag + ': aceptables y cambios del barrido', R.nAceptables === r.nAceptables && R.nCambios === r.nCambios, R.nAceptables + '/' + R.nCambios);
  comprobar(tag + ': ganador en cada punto del barrido (101 puntos)', R.ganadorBarrido.every((g, i) => g + 1 === r.ganBarrido[i]));
});

/* (2) los datos del libro dan lo mismo que el laboratorio */
{
  const wb = cargar('cap06_datos_ejemplo.xlsx');
  const D = C6.leerAlternativas(DP.procesarTabla(leer(wb, 'Alternativas')));
  const K = C6.leerCriterios(DP.procesarTabla(leer(wb, 'Criterios')), D.atributos);
  const R = C6.evaluar(D, { esCosto: K.esCosto, pesos: K.pesos, umbralMinimo: 3.5, prioritario: 2, toleranciaLex: 0.5, barrido: 1 });
  const L = Cap06.ejecutar(Cap06.DEFECTO);
  comprobar('Libro: utilidades idénticas a cap06.js', R.utilidad.every((u, i) => cerca(u, L.utilidad[i], 1e-12)));
  comprobar('Libro: mismas tres elecciones y mismo barrido que cap06.js', R.ganadorAditiva === L.ganadorAditiva && R.ganadorConj === L.ganadorConj && R.ganadorLex === L.ganadorLex &&
    R.ganadorBarrido.every((g, i) => g === L.ganadorBarrido[i]) && R.nCambios === L.metricas.nCambios);
}

/* (3) reglas de formato */
const base = [['Alternativa', 'A', 'B'], ['x', 1, 2], ['y', 2, 3], ['z', 3, 1]];
const leerFilas = f => C6.leerAlternativas(DP.procesarTabla(f));
comprobar('Formato: tabla correcta sin errores', leerFilas(base).errores.length === 0);
comprobar('Formato: menos de 3 alternativas', leerFilas(base.slice(0, 3)).errores.some(e => /al menos 3 alternativas/.test(e)));
comprobar('Formato: una sola columna numérica', leerFilas([['Alt', 'A'], ['x', 1], ['y', 2], ['z', 3]]).errores.some(e => /al menos 2 columnas numéricas/.test(e)));
comprobar('Formato: celda vacía en un atributo', leerFilas([['Alt', 'A', 'B'], ['x', 1, 2], ['y', null, 3], ['z', 3, 1]]).errores.some(e => /Falta un número/.test(e)));
comprobar('Formato: columna constante avisa y puntúa 5', (function () {
  const d = leerFilas([['Alt', 'A', 'B'], ['x', 1, 7], ['y', 2, 7], ['z', 3, 7]]);
  const S = C6.puntajes(d.X, [false, false]);
  return d.avisos.some(a => /mismo valor/.test(a)) && S.every(f => f[1] === 5);
})());
comprobar('Formato: sin columna de nombres usa «Alternativa i»', leerFilas([['A', 'B'], [1, 2], [2, 3], [3, 1]]).alternativas[0] === 'Alternativa 1');
comprobar('Criterios: nombre desconocido genera aviso', C6.leerCriterios(DP.procesarTabla([['Criterio', 'Tipo', 'Peso'], ['Z', 'costo', 1]]), ['A', 'B']).avisos.length > 0);

console.log('\n' + (total - fallas) + ' de ' + total + ' comprobaciones correctas.');
process.exit(fallas ? 1 : 0);
