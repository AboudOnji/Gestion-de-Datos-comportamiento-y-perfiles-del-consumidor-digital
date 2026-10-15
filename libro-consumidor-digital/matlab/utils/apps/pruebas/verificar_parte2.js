/* verificar_parte2.js — compara la salida de los modelos JS de la Parte II
   (Cap. 5-8) contra la salida REAL de los scripts MATLAB (referencias en
   referencias_parte2.json, generadas por referencias_parte2.m).
   Uso:  node pruebas/verificar_parte2.js   (desde matlab/utils/apps) */
'use strict';
const path = require('path');
const raiz = path.join(__dirname, '..');
const refs = require(path.join(__dirname, 'referencias_parte2.json'));
const modelos = {
  cap06: require(path.join(raiz, 'modelos', 'cap06.js'))
  ,cap07: require(path.join(raiz, 'modelos', 'cap07.js'))
  ,cap08: require(path.join(raiz, 'modelos', 'cap08.js'))
  ,cap09: require(path.join(raiz, 'modelos', 'cap09.js'))
  //%%MODELOS%%
};
const datosDe = { cap06: null, cap07: null, cap09: null, cap08: require(path.join(raiz, 'datos', 'rand42.json')) };

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
