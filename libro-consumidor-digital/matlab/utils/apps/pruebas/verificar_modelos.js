/* verificar_modelos.js — compara la salida de los modelos JS de las apps
   contra la salida REAL de los scripts MATLAB (referencias en
   referencias_matlab.json, generadas por referencias_matlab.m).
   Uso:  node pruebas/verificar_modelos.js   (desde matlab/utils/apps) */
'use strict';
const path = require('path');
const raiz = path.join(__dirname, '..');
const randn = require(path.join(raiz, 'datos', 'randn42.json'));
const base03 = require(path.join(raiz, 'datos', 'cap03_datos.json'));
const refs = require(path.join(__dirname, 'referencias_matlab.json'));
const modelos = {
  cap01: require(path.join(raiz, 'modelos', 'cap01.js')),
  cap02: require(path.join(raiz, 'modelos', 'cap02.js')),
  cap03: require(path.join(raiz, 'modelos', 'cap03.js')),
  cap04: require(path.join(raiz, 'modelos', 'cap04.js'))
};
const datosDe = { cap01: null, cap02: randn, cap03: base03, cap04: randn };

let fallas = 0, total = 0;
refs.forEach(function (r) {
  const M = modelos[r.cap];
  const P = Object.assign({}, M.DEFECTO, r.params);
  const res = M.ejecutar(P, datosDe[r.cap]);
  Object.keys(r.esperado).forEach(function (clave) {
    total++;
    const esperado = r.esperado[clave];
    const obtenido = res.metricas[clave];
    const tol = r.tol && r.tol[clave] !== undefined ? r.tol[clave] : 1e-6 * Math.max(1, Math.abs(esperado));
    const ok = typeof esperado === 'string' ? esperado === obtenido : Math.abs(obtenido - esperado) <= tol;
    if (!ok) fallas++;
    console.log((ok ? '[OK]    ' : '[FALLO] ') + r.cap + ' ' + r.caso + ' · ' + clave +
      ': MATLAB=' + esperado + '  app=' + obtenido);
  });
});
console.log('\n' + (total - fallas) + ' de ' + total + ' comprobaciones coinciden con MATLAB.');
process.exit(fallas ? 1 : 0);
